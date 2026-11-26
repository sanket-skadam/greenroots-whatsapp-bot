import fs from 'node:fs';
import { Boom } from '@hapi/boom';
import makeWASocket, {
  DisconnectReason,
  downloadMediaMessage,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  type proto,
  type WASocket,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { config } from './config.js';

import {
  classifyAndExtract,
  extractNameAndRole,
  generateSmallTalkReply,
  gradeWastePhoto,
  transcribeAndExtractVoice,
} from './ai/gemini.js';
import { CANONICAL_ITEM_IDS, formatCurrency, getItemName, normalizeItemId } from './data/catalog.js';
import { formatPoolBar, pools } from './data/store.js';
import {
  createListing,
  getAllListings,
  getListingById,
  getOrCreateUser,
  isDuplicateMessage,
  jidToPhone,
  saveUser,
  updateListingStatus,
  type DraftListing,
  type StateStep,
  type UserRecord,
} from './db/database.js';
import { findNearestCollectionPoint } from './features/location.js';

import { LANGUAGE_NAMES, t } from './i18n/messages.js';
import { createPayPalOrder, startOrderExpiryChecker } from './paypal/client.js';
import { startPayPalServer, type WhatsAppStatus } from './paypal/server.js';
import { appendHistory, clearDrafts } from './session.js';

// ─── Active socket & WhatsApp status (shared with Express server) ─────────────
let activeSocket: WASocket | null = null;
let isResettingAuth = false;
let reconnectTimer: NodeJS.Timeout | null = null;
const waStatus: WhatsAppStatus = {
  connected: false,
  qr: null,
  lastDisconnectReason: null,
};

// ─── Per-user sequential queue (prevents race conditions) ────────────────────
const userQueues = new Map<string, Promise<void>>();

// ─── Debounce: accumulate rapid text messages (1.5 s) ────────────────────────
const DEBOUNCE_MS = 1500;
const debounceTimers = new Map<string, NodeJS.Timeout>();
const debounceBuffers = new Map<string, string[]>();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractText(msg: proto.IWebMessageInfo): string {
  const m = msg.message;
  if (!m) return '';
  return (
    m.conversation ??
    m.extendedTextMessage?.text ??
    m.imageMessage?.caption ??
    ''
  ).trim();
}

async function send(sock: WASocket, jid: string, text: string): Promise<void> {
  const target = activeSocket ?? sock;
  await target.sendMessage(jid, { text });
}

async function react(sock: WASocket, msg: proto.IWebMessageInfo, emoji: string): Promise<void> {
  if (!msg.key.remoteJid) return;
  try {
    const target = activeSocket ?? sock;
    await target.sendMessage(msg.key.remoteJid, { react: { text: emoji, key: msg.key } });
  } catch {
    // Reactions are best-effort; never fail message handling on a closed socket
  }
}

function parseLanguageChoice(text: string): 'en' | 'hi' | 'pa' | 'mr' | null {
  const t2 = text.trim().toLowerCase();
  if (t2 === '1' || t2.includes('eng') || t2.includes('english')) return 'en';
  if (t2 === '2' || t2.includes('hin') || t2.includes('हिंदी') || t2.includes('hindi')) return 'hi';
  if (t2 === '3' || t2.includes('pun') || t2.includes('ਪੰਜਾਬੀ') || t2.includes('punjabi')) return 'pa';
  if (t2 === '4' || t2.includes('mar') || t2.includes('मराठी') || t2.includes('marathi')) return 'mr';
  return null;
}

function parseRoleChoice(text: string): 'farmer' | 'industry' | 'buyer' | null {
  const t2 = text.trim().toLowerCase();
  if (t2 === '1' || t2.includes('farm') || t2.includes('किसान') || t2.includes('ਕਿਸਾਨ') || t2.includes('शेतकरी') || t2.includes('kisan') || t2.includes('shetkari'))
    return 'farmer';
  if (t2 === '2' || t2.includes('ind') || t2.includes('उद्योग') || t2.includes('ਉਦਯੋਗ') || t2.includes('udyog'))
    return 'industry';
  if (t2 === '3' || t2.includes('buy') || t2.includes('खरीद') || t2.includes('ਖਰੀਦ') || t2.includes('खरेदी') || t2.includes('khareed') || t2.includes('kharidar'))
    return 'buyer';
  return null;
}

function formatPoolsBody(user: UserRecord): string {
  const title = t(user.language, 'pools_header');
  const tonUnit = t(user.language, 'ton_unit');
  const deadlineLabel = t(user.language, 'deadline_label');
  const body = pools
    .map(
      (p) =>
        `• *${p.id}* — ${p.industryName}\n  ${getItemName(p.itemId, user.language)} @ ${formatCurrency(p.pricePerTonInr)} / ${tonUnit}\n  ${formatPoolBar(p)}\n  ${deadlineLabel}: ${p.deadline}`
    )
    .join('\n\n');
  return `🏭 *${title}*\n\n${body}`;
}

function formatListingBody(user: UserRecord, items = getAllListings(true)): string {
  if (items.length === 0) return t(user.language, 'no_listings_found');
  const tonUnit = t(user.language, 'ton_unit');
  const lines = items.map(
    (l) =>
      `• *${l.id}* — ${getItemName(l.itemId, user.language)}\n` +
      `  ${l.quantityTons} ${tonUnit} @ ${formatCurrency(l.pricePerTonInr)} / ${tonUnit} | ${l.location} | ${l.farmerName}`
  );
  return t(user.language, 'listings_header', { body: lines.join('\n\n') });
}

function askNextMissingField(user: UserRecord): string {
  const draft = user.draftListing;
  if (!draft) return t(user.language, 'ask_missing_item');
  if (!draft.itemId) return t(user.language, 'ask_missing_item');
  const itemName = getItemName(draft.itemId, user.language);
  if (draft.quantityTons === null) return t(user.language, 'ask_missing_quantity', { item: itemName });
  if (draft.pricePerTonInr === null) return t(user.language, 'ask_missing_price', { item: itemName, quantity: String(draft.quantityTons) });
  if (!draft.location) return t(user.language, 'ask_missing_location', { item: itemName });
  return ''; // all filled
}

function isDraftComplete(draft: DraftListing | null): draft is DraftListing & { itemId: string; quantityTons: number; pricePerTonInr: number; location: string } {
  return !!(draft && draft.itemId && draft.quantityTons !== null && draft.pricePerTonInr !== null && draft.location);
}

function buildBuyConfirmText(user: UserRecord, listing: ReturnType<typeof getListingById>): string {
  if (!listing) return t(user.language, 'listing_not_found');
  const qty = user.selectedQuantityTons ?? listing.quantityTons;
  return t(user.language, 'buy_order_confirm', {
    id: listing.id,
    item: getItemName(listing.itemId, user.language),
    farmerName: listing.farmerName,
    listingLocation: listing.location,
    buyerLocation: user.userLocation ?? '—',
    quantity: String(qty),
    total: formatCurrency(qty * listing.pricePerTonInr),
  });
}

// ─── Send-guard: re-read user step before sending to drop stale replies ───────
async function guardedSend(sock: WASocket, jid: string, expectedStep: StateStep, text: string): Promise<void> {
  const freshUser = getOrCreateUser(jid);
  if (freshUser.step !== expectedStep) {
    console.warn(`[GUARD] Dropped stale reply for jid=${jid} (expected step=${expectedStep}, now=${freshUser.step})`);
    return;
  }
  await send(sock, jid, text);
}

// ─── Core message handler ─────────────────────────────────────────────────────

async function handleMessage(
  sock: WASocket,
  jid: string,
  inputText?: string,
  audioBuffer?: Buffer,
  audioMime?: string,
  imageBuffer?: Buffer,
  imageMime?: string,
  locationMsg?: { lat: number; lng: number }
): Promise<void> {
  const t0 = Date.now();
  let user = getOrCreateUser(jid);
  const upper = inputText?.toUpperCase().trim() ?? '';

  try {
    try {
      await (activeSocket ?? sock).sendPresenceUpdate('composing', jid);
    } catch {
      // Presence update is best-effort
    }

    // ── Slash commands (available from MENU step onward) ──────────────────────
    if (upper === '/RESET' || upper === '/START') {
      clearDrafts(user);
      user.step = 'ONBOARDING_LANGUAGE';
      user.name = null;
      user.role = 'farmer';
      user.language = 'en';
      user.selectedListingId = null;
      user.selectedQuantityTons = null;
      user.userLocation = null;
      user.history = [];
      user.lastGreetedAt = 0;
      saveUser(user);
      await send(sock, jid, t(user.language, 'welcome_greeting_and_language'));
      return;
    }

    if (upper.startsWith('/ROLE ') && user.step !== 'ONBOARDING_LANGUAGE') {
      const chosenRole = inputText!.slice(6).trim().toLowerCase();
      if (chosenRole === 'farmer' || chosenRole === 'industry' || chosenRole === 'buyer') {
        clearDrafts(user);
        user.role = chosenRole;
        user.step = 'MENU';
        saveUser(user);
        const roleLabel = t(user.language, `role_label_${chosenRole}` as Parameters<typeof t>[1]);
        const menuMsg = t(user.language, chosenRole === 'farmer' ? 'menu_farmer' : 'menu_buyer', {
          name: user.name ?? 'Friend',
          roleLabel,
        });
        await send(sock, jid, `${t(user.language, 'role_switched', { roleLabel })}\n\n${menuMsg}`);
      } else {
        await send(sock, jid, `Use \`/role farmer\`, \`/role industry\`, or \`/role buyer\`.`);
      }
      return;
    }

    if (upper === '/LISTINGS' && user.step !== 'ONBOARDING_LANGUAGE' && user.step !== 'ONBOARDING_ROLE' && user.step !== 'ONBOARDING_NAME') {
      await send(sock, jid, formatListingBody(user));
      return;
    }

    if ((upper === '/POOL' || upper === '/POOLS') && user.step !== 'ONBOARDING_LANGUAGE') {
      await send(sock, jid, formatPoolsBody(user));
      return;
    }

    if (upper === '/HELP' && user.step === 'MENU') {
      const menuKey = user.role === 'farmer' ? 'menu_farmer' : 'menu_buyer';
      await send(sock, jid, t(user.language, menuKey, { name: user.name ?? 'Friend', roleLabel: t(user.language, `role_label_${user.role}` as Parameters<typeof t>[1]) }));
      return;
    }

    // ── State machine ─────────────────────────────────────────────────────────

    switch (user.step) {

      // ── ONBOARDING_LANGUAGE ─────────────────────────────────────────────────
      case 'ONBOARDING_LANGUAGE': {
        const lang = inputText ? parseLanguageChoice(inputText) : null;
        if (!lang) {
          await send(sock, jid, t('en', 'welcome_greeting_and_language'));
          return;
        }
        user.language = lang;
        user.step = 'ONBOARDING_NAME';
        saveUser(user);
        await send(sock, jid, t(lang, 'intro_and_ask_name_role'));
        return;
      }

      // ── ONBOARDING_ROLE (fallback if reached) ───────────────────────────────
      case 'ONBOARDING_ROLE': {
        const role = inputText ? parseRoleChoice(inputText) : null;
        if (!role) {
          await send(sock, jid, t(user.language, 'ask_role_numbered'));
          return;
        }
        user.role = role;
        user.step = 'ONBOARDING_NAME';
        saveUser(user);
        await send(sock, jid, t(user.language, 'ask_name'));
        return;
      }

      // ── ONBOARDING_NAME (combined free-form name + role) ────────────────────
      case 'ONBOARDING_NAME': {
        const text = (inputText ?? '').trim();
        if (!text) {
          await send(sock, jid, t(user.language, 'retry_name_role'));
          return;
        }
        const extracted = await extractNameAndRole(text, user.language);
        if (!extracted) {
          await send(sock, jid, t(user.language, 'retry_name_role'));
          return;
        }
        user.name = extracted.name;
        user.role = extracted.role;
        user.step = 'MENU';
        user.lastGreetedAt = Date.now();
        saveUser(user);
        const menuKey = user.role === 'farmer' ? 'menu_farmer' : 'menu_buyer';
        await send(sock, jid, t(user.language, menuKey, {
          name: user.name,
          roleLabel: t(user.language, `role_label_${user.role}` as Parameters<typeof t>[1]),
        }));
        return;
      }

      // ── MENU ────────────────────────────────────────────────────────────────
      case 'MENU': {
        // Handle location pin
        if (locationMsg) {
          const { point, distanceKm } = findNearestCollectionPoint(locationMsg.lat, locationMsg.lng);
          user.userLocation = `${point.village} (${locationMsg.lat.toFixed(3)}, ${locationMsg.lng.toFixed(3)})`;
          saveUser(user);
          const mapsUrl = `https://maps.google.com/?q=${point.lat},${point.lng}`;
          await send(sock, jid, t(user.language, 'location_hub_found', {
            hubName: point.name,
            hubVillage: point.village,
            distanceKm: distanceKm.toFixed(1),
            hubHours: point.hours,
            mapsUrl,
          }));
          await sock.sendMessage(jid, { location: { degreesLatitude: point.lat, degreesLongitude: point.lng, name: point.name, address: point.village } });
          return;
        }

        // Handle voice note in MENU
        if (audioBuffer && audioMime) {
          await handleVoiceInMenu(sock, jid, user, audioBuffer, audioMime);
          return;
        }

        // Handle photo in MENU (farmer only)
        if (imageBuffer && imageMime) {
          await handlePhotoInMenu(sock, jid, user, imageBuffer, imageMime);
          return;
        }

        if (!inputText) return;

        // Classify
        const stepBeforeClassify = user.step;
        const extraction = await classifyAndExtract(user, inputText);
        const { intent } = extraction;

        console.log(`[MSG] jid=${jid} step=${stepBeforeClassify} intent=${intent} latency=${Date.now() - t0}ms`);

        appendHistory(user, 'user', inputText);

        // Role gating
        if ((intent === 'SELL_LISTING') && user.role !== 'farmer') {
          const reply = t(user.language, 'buyer_cannot_sell');
          appendHistory(user, 'assistant', reply);
          saveUser(user);
          await send(sock, jid, reply);
          return;
        }
        if ((intent === 'BUY_SEARCH' || intent === 'SELECT_LISTING') && user.role === 'farmer') {
          const reply = t(user.language, 'farmer_cannot_buy');
          appendHistory(user, 'assistant', reply);
          saveUser(user);
          await send(sock, jid, reply);
          return;
        }

        switch (intent) {
          case 'VIEW_LISTINGS': {
            const body = formatListingBody(user);
            appendHistory(user, 'assistant', body);
            saveUser(user);
            await send(sock, jid, body);
            return;
          }

          case 'VIEW_POOLS': {
            const body = formatPoolsBody(user);
            appendHistory(user, 'assistant', body);
            saveUser(user);
            await send(sock, jid, body);
            return;
          }

          case 'SELL_LISTING': {
            if (user.role !== 'farmer') break;
            // Start draft from extracted fields; local-normalize item if Gemini missed it
            const localMatch = normalizeItemId(inputText);
            const rawItem = extraction.item ?? (localMatch && CANONICAL_ITEM_IDS.includes(localMatch) ? localMatch : null);
            user.draftListing = {
              itemId: rawItem,
              quantityTons: extraction.quantity_tons ?? null,
              pricePerTonInr: extraction.price_per_ton ?? null,
              location: extraction.location ?? null,
              grade: 'A',
            };
            user.step = 'SELL_COLLECTING';
            const question = askNextMissingField(user);
            if (!question && isDraftComplete(user.draftListing)) {
              // All fields already in one message → go to confirm
              await goToSellConfirm(sock, jid, user);
            } else {
              saveUser(user);
              await send(sock, jid, question);
            }
            return;
          }

          case 'BUY_SEARCH': {
            const matches = getAllListings(true).filter((l) => {
              if (extraction.item && l.itemId !== extraction.item) return false;
              if (extraction.quantity_tons && l.quantityTons < extraction.quantity_tons) return false;
              return true;
            });
            if (matches.length === 0) {
              const reply = t(user.language, 'no_listings_found');
              appendHistory(user, 'assistant', reply);
              saveUser(user);
              await send(sock, jid, reply);
              return;
            }
            user.step = 'BUY_BROWSING';
            user.selectedQuantityTons = extraction.quantity_tons ?? null;
            const reply = formatListingBody(user, matches);
            appendHistory(user, 'assistant', reply);
            saveUser(user);
            await send(sock, jid, reply);
            return;
          }

          case 'SELECT_LISTING': {
            const id = extraction.listing_id ?? extractListingIdFromText(inputText);
            if (!id) {
              await send(sock, jid, formatListingBody(user));
              return;
            }
            const listing = getListingById(id);
            if (!listing || listing.status !== 'available') {
              await send(sock, jid, t(user.language, 'listing_not_found'));
              return;
            }
            user.selectedListingId = listing.id;
            user.selectedQuantityTons = extraction.quantity_tons ?? listing.quantityTons;
            if (!user.userLocation) {
              user.step = 'BUY_LOCATION';
              saveUser(user);
              await send(sock, jid, t(user.language, 'ask_buyer_location'));
            } else {
              user.step = 'BUY_CONFIRM';
              saveUser(user);
              await send(sock, jid, buildBuyConfirmText(user, listing));
            }
            return;
          }

          case 'CONFIRM':
          case 'CANCEL': {
            const reply = t(user.language, 'invalid_step_hint');
            appendHistory(user, 'assistant', reply);
            saveUser(user);
            await send(sock, jid, reply);
            return;
          }

          case 'PROVIDE_LOCATION': {
            if (extraction.location) {
              user.userLocation = extraction.location;
              saveUser(user);
            }
            const reply = await generateSmallTalkReply(user, inputText);
            appendHistory(user, 'assistant', reply);
            saveUser(user);
            await send(sock, jid, reply);
            return;
          }

          case 'SMALL_TALK':
          default: {
            const reply = await generateSmallTalkReply(user, inputText);
            appendHistory(user, 'assistant', reply);
            saveUser(user);
            await send(sock, jid, reply);
            return;
          }
        }
        return;
      }

      // ── SELL_COLLECTING ─────────────────────────────────────────────────────
      case 'SELL_COLLECTING': {
        if (imageBuffer && imageMime) {
          await handlePhotoInMenu(sock, jid, user, imageBuffer, imageMime);
          return;
        }
        if (!inputText && !audioBuffer) return;

        let extraction;
        if (audioBuffer && audioMime) {
          extraction = await transcribeAndExtractVoice(user, audioBuffer, audioMime);
        } else {
          extraction = await classifyAndExtract(user, inputText!);
        }

        if (extraction.intent === 'CANCEL' || upper === 'CANCEL') {
          clearDrafts(user);
          user.step = 'MENU';
          saveUser(user);
          await send(sock, jid, t(user.language, 'cancelled_action'));
          return;
        }
        if (extraction.intent === 'VIEW_POOLS') {
          const body = formatPoolsBody(user);
          appendHistory(user, 'assistant', body);
          saveUser(user);
          await send(sock, jid, body);
          return;
        }

        // Merge into draft
        const draft: DraftListing = user.draftListing ?? { itemId: null, quantityTons: null, pricePerTonInr: null, location: null, grade: 'A' };
        if (extraction.item) draft.itemId = extraction.item;
        if (extraction.quantity_tons !== null) draft.quantityTons = extraction.quantity_tons;
        if (extraction.price_per_ton !== null) draft.pricePerTonInr = extraction.price_per_ton;
        if (extraction.location) draft.location = extraction.location;

        // ── Item fallback: if still missing item and user typed a plain item name ──
        // Gemini may classify bare item names (e.g. "Nariyal ka chilka") as SMALL_TALK
        // with item=null; try a local catalog lookup before asking again.
        if (!draft.itemId && inputText) {
          const localItem = normalizeItemId(inputText.trim());
          if (localItem && CANONICAL_ITEM_IDS.includes(localItem)) {
            draft.itemId = localItem;
          }
        }

        // Numeric fallback when user answers a single-field prompt like "5" or "1800"
        if (inputText && /^\d+(?:\.\d+)?$/.test(inputText.trim())) {
          const num = Number(inputText.trim());
          if (draft.itemId && draft.quantityTons === null) {
            draft.quantityTons = num;
          } else if (draft.itemId && draft.quantityTons !== null && draft.pricePerTonInr === null) {
            draft.pricePerTonInr = num;
          }
        }
        user.draftListing = draft;

        if (isDraftComplete(draft)) {
          await goToSellConfirm(sock, jid, user);
        } else {
          saveUser(user);
          await send(sock, jid, askNextMissingField(user));
        }
        return;
      }

      // ── SELL_CONFIRM ────────────────────────────────────────────────────────
      case 'SELL_CONFIRM': {
        const extraction = inputText ? await classifyAndExtract(user, inputText) : null;
        const intent = extraction?.intent;

        if (intent === 'CONFIRM' || upper === 'YES' || upper === 'HAA' || upper === 'HAAN') {
          const draft = user.draftListing!;
          if (!isDraftComplete(draft)) {
            user.step = 'SELL_COLLECTING';
            saveUser(user);
            await send(sock, jid, askNextMissingField(user));
            return;
          }
          try {
            const listing = createListing({
              farmerName: user.name ?? 'WhatsApp Farmer',
              farmerPhone: user.phone,
              farmerEmail: `sb-farmer-${user.phone}@personal.example.com`,
              itemId: draft.itemId!,
              quantityTons: draft.quantityTons!,
              pricePerTonInr: draft.pricePerTonInr!,
              location: draft.location!,
              grade: draft.grade,
            });
            clearDrafts(user);
            user.step = 'MENU';
            saveUser(user);
            await send(sock, jid, t(user.language, 'listing_published', {
              id: listing.id,
              item: getItemName(listing.itemId, user.language),
              quantity: String(listing.quantityTons),
              price: formatCurrency(listing.pricePerTonInr),
              location: listing.location,
              sellerName: listing.farmerName,
              sellerPhone: listing.farmerPhone,
            }));
          } catch (err) {
            await send(sock, jid, t(user.language, 'generic_error'));
          }
        } else if (intent === 'CANCEL' || upper === 'CANCEL' || upper === 'NO' || upper === 'NAHI') {
          clearDrafts(user);
          user.step = 'MENU';
          saveUser(user);
          await send(sock, jid, t(user.language, 'cancelled_action'));
        } else {
          // Re-show summary
          await send(sock, jid, t(user.language, 'invalid_step_hint'));
        }
        return;
      }

      // ── BUY_BROWSING ────────────────────────────────────────────────────────
      case 'BUY_BROWSING': {
        if (locationMsg) {
          const { point, distanceKm } = findNearestCollectionPoint(locationMsg.lat, locationMsg.lng);
          user.userLocation = `${point.village} (${locationMsg.lat.toFixed(3)}, ${locationMsg.lng.toFixed(3)})`;
          if (user.selectedListingId) {
            user.step = 'BUY_CONFIRM';
            saveUser(user);
            const listing = getListingById(user.selectedListingId);
            await send(sock, jid, buildBuyConfirmText(user, listing));
          } else {
            saveUser(user);
            const mapsUrl = `https://maps.google.com/?q=${point.lat},${point.lng}`;
            await send(sock, jid, t(user.language, 'location_hub_found', {
              hubName: point.name, hubVillage: point.village, distanceKm: distanceKm.toFixed(1), hubHours: point.hours, mapsUrl,
            }));
          }
          return;
        }

        if (audioBuffer && audioMime) {
          await handleVoiceInMenu(sock, jid, user, audioBuffer, audioMime);
          return;
        }

        if (!inputText) return;
        const extraction = await classifyAndExtract(user, inputText);

        if (extraction.intent === 'CANCEL' || upper === 'CANCEL') {
          clearDrafts(user);
          user.step = 'MENU';
          saveUser(user);
          await send(sock, jid, t(user.language, 'cancelled_action'));
          return;
        }

        if (extraction.intent === 'BUY_SEARCH') {
          const matches = getAllListings(true).filter((l) => {
            if (extraction.item && l.itemId !== extraction.item) return false;
            if (extraction.quantity_tons && l.quantityTons < extraction.quantity_tons) return false;
            return true;
          });
          if (matches.length === 0) {
            await send(sock, jid, t(user.language, 'no_listings_found'));
            return;
          }
          user.selectedQuantityTons = extraction.quantity_tons ?? null;
          const reply = formatListingBody(user, matches);
          appendHistory(user, 'assistant', reply);
          saveUser(user);
          await send(sock, jid, reply);
          return;
        }

        if (extraction.intent === 'VIEW_POOLS') {
          const body = formatPoolsBody(user);
          appendHistory(user, 'assistant', body);
          saveUser(user);
          await send(sock, jid, body);
          return;
        }

        if (extraction.intent === 'SELECT_LISTING' || extraction.listing_id) {
          const id = extraction.listing_id ?? extractListingIdFromText(inputText);
          if (!id) { await send(sock, jid, formatListingBody(user)); return; }
          const listing = getListingById(id);
          if (!listing || listing.status !== 'available') {
            await send(sock, jid, t(user.language, 'listing_not_found')); return;
          }
          user.selectedListingId = listing.id;
          user.selectedQuantityTons = extraction.quantity_tons ?? user.selectedQuantityTons ?? listing.quantityTons;
          if (!user.userLocation) {
            user.step = 'BUY_LOCATION';
            saveUser(user);
            await send(sock, jid, t(user.language, 'ask_buyer_location'));
          } else {
            user.step = 'BUY_CONFIRM';
            saveUser(user);
            await send(sock, jid, buildBuyConfirmText(user, listing));
          }
          return;
        }

        if (extraction.intent === 'PROVIDE_LOCATION' && extraction.location) {
          user.userLocation = extraction.location;
          if (user.selectedListingId) {
            user.step = 'BUY_CONFIRM';
            saveUser(user);
            const listing = getListingById(user.selectedListingId);
            await send(sock, jid, buildBuyConfirmText(user, listing));
          } else {
            saveUser(user);
            await send(sock, jid, t(user.language, 'ask_buyer_location'));
          }
          return;
        }

        if (extraction.intent === 'VIEW_LISTINGS') {
          await send(sock, jid, formatListingBody(user));
          return;
        }

        const reply = await generateSmallTalkReply(user, inputText);
        appendHistory(user, 'assistant', reply);
        saveUser(user);
        await send(sock, jid, reply);
        return;
      }

      // ── BUY_LOCATION ────────────────────────────────────────────────────────
      case 'BUY_LOCATION': {
        let location: string | null = null;

        if (locationMsg) {
          const { point } = findNearestCollectionPoint(locationMsg.lat, locationMsg.lng);
          location = `${point.village} (${locationMsg.lat.toFixed(3)}, ${locationMsg.lng.toFixed(3)})`;
        } else if (inputText) {
          if (upper === 'CANCEL' || upper === 'NO' || upper === 'NAHI') {
            clearDrafts(user);
            user.step = 'MENU';
            saveUser(user);
            await send(sock, jid, t(user.language, 'cancelled_action'));
            return;
          }
          const extraction = await classifyAndExtract(user, inputText);
          if (extraction.intent === 'CANCEL') {
            clearDrafts(user);
            user.step = 'MENU';
            saveUser(user);
            await send(sock, jid, t(user.language, 'cancelled_action'));
            return;
          }
          location = extraction.location ?? inputText.trim();
        }

        if (!location) {
          await send(sock, jid, t(user.language, 'ask_buyer_location'));
          return;
        }

        user.userLocation = location;
        user.step = 'BUY_CONFIRM';
        saveUser(user);
        const listing = user.selectedListingId ? getListingById(user.selectedListingId) : null;
        if (!listing) {
          user.step = 'MENU';
          saveUser(user);
          await send(sock, jid, t(user.language, 'listing_not_found'));
          return;
        }
        await send(sock, jid, buildBuyConfirmText(user, listing));
        return;
      }

      // ── BUY_CONFIRM ─────────────────────────────────────────────────────────
      case 'BUY_CONFIRM': {
        const extraction = inputText ? await classifyAndExtract(user, inputText) : null;
        const intent = extraction?.intent;

        if (intent === 'CONFIRM' || upper === 'YES' || upper === 'HAA' || upper === 'HAAN' || upper === 'CONFIRM') {
          const listingId = user.selectedListingId;
          const listing = listingId ? getListingById(listingId) : null;
          if (!listing || listing.status !== 'available') {
            user.step = 'MENU';
            clearDrafts(user);
            saveUser(user);
            await send(sock, jid, t(user.language, 'listing_not_found'));
            return;
          }

          const qty = user.selectedQuantityTons ?? listing.quantityTons;
          const totalInr = qty * listing.pricePerTonInr;

          updateListingStatus(listing.id, 'reserved');
          user.step = 'PAYMENT_PENDING';
          saveUser(user);

          const stepAfterConfirm = user.step;
          await react(sock, { key: { remoteJid: jid } } as proto.IWebMessageInfo, '⏳');

          const checkout = await createPayPalOrder({
            buyerJid: jid,
            listing,
            quantityTons: qty,
            totalInr,
          });

          // Guard: only send if user is still in PAYMENT_PENDING
          await guardedSend(sock, jid, stepAfterConfirm, t(user.language, 'checkout_ready', {
            quantity: String(qty),
            item: getItemName(listing.itemId, user.language),
            orderId: checkout.paypalOrderId,
            total: formatCurrency(totalInr),
            usd: checkout.totalUsd,
            url: checkout.approveUrl,
          }));
          return;
        }

        if (intent === 'CANCEL' || upper === 'CANCEL' || upper === 'NO' || upper === 'NAHI') {
          if (user.selectedListingId) {
            const l = getListingById(user.selectedListingId);
            if (l && l.status === 'reserved') updateListingStatus(user.selectedListingId, 'available');
          }
          clearDrafts(user);
          user.step = 'MENU';
          saveUser(user);
          await send(sock, jid, t(user.language, 'cancelled_action'));
          return;
        }

        // Re-show summary
        const listing2 = user.selectedListingId ? getListingById(user.selectedListingId) : null;
        await send(sock, jid, buildBuyConfirmText(user, listing2));
        return;
      }

      // ── PAYMENT_PENDING ─────────────────────────────────────────────────────
      case 'PAYMENT_PENDING': {
        if (upper === 'CANCEL' || upper === 'NAHI' || upper === 'NO') {
          if (user.selectedListingId) {
            const l = getListingById(user.selectedListingId);
            if (l && l.status === 'reserved') updateListingStatus(user.selectedListingId, 'available');
          }
          clearDrafts(user);
          user.step = 'MENU';
          saveUser(user);
          await send(sock, jid, t(user.language, 'cancelled_action'));
          return;
        }
        await send(sock, jid, t(user.language, 'payment_pending_reminder'));
        return;
      }

      // ── PAID ────────────────────────────────────────────────────────────────
      case 'PAID': {
        const reply = await generateSmallTalkReply(user, inputText ?? 'thank you');
        await send(sock, jid, reply);
        return;
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unexpected error';
    console.error('[Bot Error]', errMsg);
    try {
      await send(sock, jid, t(user.language, 'generic_error'));
    } catch (sendErr) {
      console.error('[Bot Send Error]', sendErr instanceof Error ? sendErr.message : sendErr);
    }
  }
}

// ─── Voice handler (from MENU) ────────────────────────────────────────────────
async function handleVoiceInMenu(
  sock: WASocket,
  jid: string,
  user: UserRecord,
  audioBuffer: Buffer,
  mimeType: string
): Promise<void> {
  const result = await transcribeAndExtractVoice(user, audioBuffer, mimeType);

  // Role gating
  if (result.intent === 'SELL_LISTING' && user.role !== 'farmer') {
    await send(sock, jid, t(user.language, 'buyer_cannot_sell'));
    return;
  }
  if ((result.intent === 'BUY_SEARCH' || result.intent === 'SELECT_LISTING') && user.role === 'farmer') {
    await send(sock, jid, t(user.language, 'farmer_cannot_buy'));
    return;
  }

  if (result.intent === 'SELL_LISTING') {
    user.draftListing = {
      itemId: result.item ?? null,
      quantityTons: result.quantity_tons ?? null,
      pricePerTonInr: result.price_per_ton ?? null,
      location: result.location ?? null,
      grade: 'A',
    };
    user.step = 'SELL_COLLECTING';

    if (isDraftComplete(user.draftListing)) {
      await goToSellConfirm(sock, jid, user);
    } else {
      saveUser(user);
      await send(sock, jid, `🎙️ _"${result.transcript}"_\n\n${askNextMissingField(user)}`);
    }
    return;
  }

  if (result.intent === 'BUY_SEARCH') {
    const matches = getAllListings(true).filter((l) => {
      if (result.item && l.itemId !== result.item) return false;
      if (result.quantity_tons && l.quantityTons < result.quantity_tons) return false;
      return true;
    });
    if (matches.length === 0) {
      await send(sock, jid, `🎙️ _"${result.transcript}"_\n\n${t(user.language, 'no_listings_found')}`);
      return;
    }
    user.step = 'BUY_BROWSING';
    user.selectedQuantityTons = result.quantity_tons ?? null;
    saveUser(user);
    await send(sock, jid, `🎙️ _"${result.transcript}"_\n\n${formatListingBody(user, matches)}`);
    return;
  }

  // Fallback: small talk
  const reply = await generateSmallTalkReply(user, result.transcript);
  appendHistory(user, 'assistant', reply);
  saveUser(user);
  await send(sock, jid, reply);
}

// ─── Photo handler ────────────────────────────────────────────────────────────
async function handlePhotoInMenu(
  sock: WASocket,
  jid: string,
  user: UserRecord,
  imageBuffer: Buffer,
  mimeType: string
): Promise<void> {
  const graded = await gradeWastePhoto(imageBuffer, mimeType, user.language);
  const templateKey = user.role === 'farmer' ? 'photo_grade_report' : 'photo_grade_report_buyer';
  const reply = t(user.language, templateKey, {
    item: getItemName(graded.itemId, user.language),
    grade: graded.grade,
    moisture: graded.moistureEstimate,
    price: formatCurrency(graded.suggestedPriceInr),
    summary: graded.summary,
  });

  if (user.role === 'farmer') {
    user.draftListing = {
      itemId: graded.itemId,
      quantityTons: null, // will ask
      pricePerTonInr: graded.suggestedPriceInr,
      location: null, // will ask
      grade: graded.grade,
    };
    user.step = 'SELL_COLLECTING';
    saveUser(user);
  }

  await send(sock, jid, reply);
}

// ─── Sell confirm helper ──────────────────────────────────────────────────────
async function goToSellConfirm(sock: WASocket, jid: string, user: UserRecord): Promise<void> {
  const draft = user.draftListing!;
  user.step = 'SELL_CONFIRM';
  saveUser(user);
  await send(sock, jid, t(user.language, 'sell_summary_confirm', {
    item: getItemName(draft.itemId!, user.language),
    quantity: String(draft.quantityTons!),
    price: formatCurrency(draft.pricePerTonInr!),
    location: draft.location!,
    sellerName: user.name ?? 'You',
    sellerPhone: user.phone,
  }));
}

// ─── Listing ID extractor ─────────────────────────────────────────────────────
function extractListingIdFromText(text: string): string | null {
  const match = text.toUpperCase().match(/LST-\d+/);
  return match ? match[0] : null;
}

// ─── Main Baileys incoming message handler ────────────────────────────────────
async function handleIncomingMessage(sock: WASocket, msg: proto.IWebMessageInfo): Promise<void> {
  const jid = msg.key.remoteJid;
  if (!jid || msg.key.fromMe || jid === 'status@broadcast' || !msg.message) return;

  const msgId = msg.key.id;
  if (!msgId) return;

  // Deduplication
  if (isDuplicateMessage(msgId)) {
    console.log(`[DEDUP] Skipping already-processed message ${msgId}`);
    return;
  }

  const m = msg.message;

  // ── Voice note: process immediately in per-user queue (no debounce) ──────────
  if (m.audioMessage) {
    const queued = (userQueues.get(jid) ?? Promise.resolve()).then(async () => {
      try {
        const buffer = (await downloadMediaMessage(msg, 'buffer', {})) as Buffer;
        const mime = m.audioMessage!.mimetype ?? 'audio/ogg';
        await react(sock, msg, '⏳');
        await handleMessage(sock, jid, undefined, buffer, mime, undefined, undefined, undefined);
        await react(sock, msg, '✅');
      } catch (err) {
        console.error('[Voice Error]', err);
      }
    });
    userQueues.set(jid, queued);
    return;
  }

  // ── Photo: process immediately ───────────────────────────────────────────────
  if (m.imageMessage) {
    const queued = (userQueues.get(jid) ?? Promise.resolve()).then(async () => {
      try {
        const buffer = (await downloadMediaMessage(msg, 'buffer', {})) as Buffer;
        const mime = m.imageMessage!.mimetype ?? 'image/jpeg';
        await react(sock, msg, '⏳');
        await handleMessage(sock, jid, undefined, undefined, undefined, buffer, mime, undefined);
        await react(sock, msg, '✅');
      } catch (err) {
        console.error('[Photo Error]', err);
      }
    });
    userQueues.set(jid, queued);
    return;
  }

  // ── Location pin: process immediately ───────────────────────────────────────
  if (m.locationMessage) {
    const lat = m.locationMessage.degreesLatitude;
    const lng = m.locationMessage.degreesLongitude;
    if (typeof lat === 'number' && typeof lng === 'number') {
      const queued = (userQueues.get(jid) ?? Promise.resolve()).then(async () => {
        await handleMessage(sock, jid, undefined, undefined, undefined, undefined, undefined, { lat, lng });
      });
      userQueues.set(jid, queued);
    }
    return;
  }

  // ── Text: debounce 1.5 s, then process via per-user queue ───────────────────
  const text = extractText(msg);
  if (!text) return;

  // Accumulate
  const existing = debounceBuffers.get(jid) ?? [];
  existing.push(text);
  debounceBuffers.set(jid, existing);

  const existing_timer = debounceTimers.get(jid);
  if (existing_timer) clearTimeout(existing_timer);

  const timer = setTimeout(() => {
    const accumulated = debounceBuffers.get(jid)?.join(' ') ?? text;
    debounceBuffers.delete(jid);
    debounceTimers.delete(jid);

    const queued = (userQueues.get(jid) ?? Promise.resolve()).then(async () => {
      await handleMessage(sock, jid, accumulated, undefined, undefined, undefined, undefined, undefined);
    });
    userQueues.set(jid, queued);
  }, DEBOUNCE_MS);

  debounceTimers.set(jid, timer);
}

// ─── WhatsApp Bot startup & auth reset ────────────────────────────────────────
async function resetWhatsAppAuth(): Promise<void> {
  if (isResettingAuth) return;
  isResettingAuth = true;
  try {
    waStatus.connected = false;
    waStatus.qr = null;
    waStatus.lastDisconnectReason = 'Resetting session...';
    try {
      activeSocket?.end(undefined);
    } catch {
      // ignore socket close errors
    }
    activeSocket = null;
    fs.rmSync(config.authDir, { recursive: true, force: true });
    await startWhatsAppBot();
  } finally {
    isResettingAuth = false;
  }
}

function scheduleReconnect(delayMs = 2000): void {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void startWhatsAppBot();
  }, delayMs);
}

async function startWhatsAppBot(): Promise<void> {
  try {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    fs.mkdirSync(config.authDir, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(config.authDir);
    const { version } = await fetchLatestBaileysVersion();

    const prevSocket = activeSocket;
    const sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'silent' }),
      markOnlineOnConnect: false,
    });

    activeSocket = sock;
    try {
      prevSocket?.end(undefined);
    } catch {
      // ignore closing superseded socket
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      if (activeSocket !== sock) return;
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        waStatus.qr = qr;
        waStatus.connected = false;
        console.log('\n[GreenRoots Bot] Scan this QR code with WhatsApp (Linked Devices) or open /qr:');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
        waStatus.connected = false;
        waStatus.lastDisconnectReason = statusCode ? `code ${statusCode}` : 'closed';
        console.log(`[WhatsApp] Disconnected (${waStatus.lastDisconnectReason}). Logged out: ${isLoggedOut}`);

        if (isResettingAuth) return;

        if (isLoggedOut) {
          console.log('[WhatsApp] Session logged out. Clearing auth and generating a fresh QR...');
          setTimeout(() => {
            void resetWhatsAppAuth();
          }, 2000);
        } else {
          scheduleReconnect(2000);
        }
      } else if (connection === 'open') {
        waStatus.connected = true;
        waStatus.qr = null;
        waStatus.lastDisconnectReason = null;
        console.log('✅ [GreenRoots Bot] Connected to WhatsApp WebSocket!');
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (activeSocket !== sock || type !== 'notify') return;
      for (const msg of messages) {
        await handleIncomingMessage(sock, msg);
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[WhatsApp Startup Error]', msg);
    waStatus.connected = false;
    waStatus.lastDisconnectReason = msg;
    scheduleReconnect(5000);
  }
}

// ─── Checkout expiry checker ──────────────────────────────────────────────────
startOrderExpiryChecker(
  async (order) => {
    const sock = activeSocket;
    if (!sock) return;
    const user = getOrCreateUser(order.buyerJid);
    const listing = getListingById(order.listingId);
    // Reset user step if still PAYMENT_PENDING
    if (user.step === 'PAYMENT_PENDING') {
      clearDrafts(user);
      user.step = 'MENU';
      saveUser(user);
    }
    await send(sock, order.buyerJid, t(user.language, 'checkout_expired', {
      orderId: order.paypalOrderId,
      total: formatCurrency(order.totalInr),
    }));
  },
  async (order) => {
    const sock = activeSocket;
    if (!sock) return;
    const user = getOrCreateUser(order.buyerJid);
    const listing = getListingById(order.listingId);
    if (!listing) return;
    // reconstruct URL (simulated)
    const approveUrl = `${process.env.PUBLIC_BASE_URL ?? 'http://localhost:3050'}/paypal/demo-checkout?token=${order.paypalOrderId}`;
    await send(sock, order.buyerJid, t(user.language, 'checkout_reminder', {
      orderId: order.paypalOrderId,
      total: formatCurrency(order.totalInr),
      url: approveUrl,
    }));
  }
);

// ─── PayPal server: expose getSocket & WhatsApp QR/status controls ───────────
startPayPalServer(() => activeSocket, {
  getStatus: () => waStatus,
  resetAuth: resetWhatsAppAuth,
});

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
void startWhatsAppBot();
