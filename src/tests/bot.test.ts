import assert from 'node:assert/strict';
import test from 'node:test';
import { formatCurrency, getItemName, normalizeItemId } from '../data/catalog.js';
import {
  createListing,
  getAllListings,
  getListingById,
  getOrCreateUser,
  getOrder,
  getPendingOrders,
  initDatabase,
  isDuplicateMessage,
  saveOrder,
  saveUser,
  updateListingStatus,
} from '../db/database.js';
import { getAllowedIntentsForRole } from '../ai/gemini.js';
import { ALL_I18N_KEYS, getDictionary, SUPPORTED_LANGUAGES, t } from '../i18n/messages.js';

test('i18n: every key exists and has matching placeholders in all 4 languages', () => {
  const dict = getDictionary();
  for (const key of ALL_I18N_KEYS) {
    const entry = dict[key] as Record<string, string>;
    const enVars = [...(entry.en.matchAll(/\{\{(\w+)\}\}/g))].map((m) => m[1]).sort();
    for (const lang of SUPPORTED_LANGUAGES) {
      assert.ok(entry[lang] && entry[lang].trim().length > 0, `Missing "${key}" for "${lang}"`);
      const langVars = [...(entry[lang].matchAll(/\{\{(\w+)\}\}/g))].map((m) => m[1]).sort();
      assert.deepEqual(langVars, enVars, `Placeholder mismatch in "${key}" for "${lang}"`);
    }
  }
});

test('catalog: canonical normalization and localized names', () => {
  assert.equal(normalizeItemId('bhusa'), 'wheat_straw');
  assert.equal(normalizeItemId('gehu ka bhusa'), 'wheat_straw');
  assert.equal(normalizeItemId('parali'), 'paddy_straw');
  assert.equal(normalizeItemId('ganne ki khoi'), 'sugarcane_bagasse');
  assert.equal(normalizeItemId('nariyal ka chilka'), 'coconut_husk');
  assert.equal(normalizeItemId('mustard_stalks'), 'mustard_stalks');
  assert.equal(normalizeItemId(null), null);

  assert.equal(getItemName('wheat_straw', 'hi'), 'गेहूँ का भूसा');
  assert.equal(getItemName('coconut_husk', 'hi'), 'नारियल का छिलका');
  assert.equal(getItemName('mustard_stalks', 'en'), 'Mustard Stalks');
});

test('currency: formats INR with Indian grouping', () => {
  assert.equal(formatCurrency(1900), '₹1,900');
  assert.equal(formatCurrency(11400), '₹11,400');
  assert.equal(formatCurrency(150000), '₹1,50,000');
});

test('role gating: farmer cannot buy and buyer cannot sell', () => {
  const farmerIntents = getAllowedIntentsForRole('farmer');
  assert.ok(farmerIntents.includes('SELL_LISTING'));
  assert.ok(farmerIntents.includes('VIEW_POOLS'));
  assert.ok(!farmerIntents.includes('BUY_SEARCH'));
  assert.ok(!farmerIntents.includes('SELECT_LISTING'));

  const buyerIntents = getAllowedIntentsForRole('buyer');
  assert.ok(buyerIntents.includes('BUY_SEARCH'));
  assert.ok(buyerIntents.includes('VIEW_LISTINGS'));
  assert.ok(!buyerIntents.includes('SELL_LISTING'));
});

test('database: dedup, seller identity validation, and order persistence', () => {
  initDatabase(':memory:');

  // Dedup
  assert.equal(isDuplicateMessage('msg-1'), false);
  assert.equal(isDuplicateMessage('msg-1'), true);
  assert.equal(isDuplicateMessage('msg-2'), false);

  // User state persistence
  const user = getOrCreateUser('919999999999@s.whatsapp.net');
  assert.equal(user.step, 'ONBOARDING_LANGUAGE');
  user.language = 'hi';
  user.role = 'farmer';
  user.name = 'संकेत';
  user.step = 'MENU';
  saveUser(user);
  assert.equal(getOrCreateUser('919999999999@s.whatsapp.net').name, 'संकेत');

  // Reject listing without seller name/phone
  assert.throws(() =>
    createListing({
      farmerName: '',
      farmerPhone: '',
      farmerEmail: 'a@b.com',
      itemId: 'wheat_straw',
      quantityTons: 2,
      pricePerTonInr: 1800,
      location: 'Karnal',
      grade: 'A',
    })
  );

  // Create valid listing
  const created = createListing({
    farmerName: 'संकेत',
    farmerPhone: '919999999999',
    farmerEmail: 'sanket@example.com',
    itemId: 'coconut_husk',
    quantityTons: 3,
    pricePerTonInr: 1850,
    location: 'Kolhapur',
    grade: 'A',
  });
  assert.ok(created.id.startsWith('LST-'));
  assert.equal(getListingById(created.id)?.itemId, 'coconut_husk');
  assert.equal(getListingById(created.id.toLowerCase())?.itemId, 'coconut_husk');
  assert.equal(getListingById(`  ${created.id.toLowerCase()}  `)?.itemId, 'coconut_husk');

  // Reserve and sell hides from available listings
  updateListingStatus(created.id, 'reserved');
  assert.ok(!getAllListings(true).some((l) => l.id === created.id));

  // Order creation & pending query
  const now = Date.now();
  saveOrder({
    paypalOrderId: 'SIM-PP-TEST1',
    buyerJid: '918888888888@s.whatsapp.net',
    listingId: created.id,
    quantityTons: 3,
    totalInr: 5550,
    totalUsd: '65.29',
    isSimulated: true,
    status: 'PENDING',
    createdAt: now,
    expiresAt: now + 30 * 60 * 1000,
    reminderSent: false,
  });
  assert.equal(getPendingOrders().length, 1);
  assert.equal(getOrder('SIM-PP-TEST1')?.status, 'PENDING');
});

test('i18n: template interpolation works cleanly', () => {
  const msg = t('hi', 'role_switched', { roleLabel: t('hi', 'role_label_farmer') });
  assert.equal(msg, '🔄 अब आप *किसान* मोड में हैं।');
});

