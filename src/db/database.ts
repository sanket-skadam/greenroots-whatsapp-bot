import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { LangCode } from '../data/catalog.js';

export type UserRole = 'farmer' | 'industry' | 'buyer';

export type StateStep =
  | 'ONBOARDING_LANGUAGE'
  | 'ONBOARDING_ROLE'
  | 'ONBOARDING_NAME'
  | 'MENU'
  | 'SELL_COLLECTING'
  | 'SELL_CONFIRM'
  | 'BUY_BROWSING'
  | 'BUY_LOCATION'
  | 'BUY_CONFIRM'
  | 'PAYMENT_PENDING'
  | 'PAID';

export interface DraftListing {
  itemId: string | null;
  quantityTons: number | null;
  pricePerTonInr: number | null;
  location: string | null;
  grade: 'A' | 'B' | 'C';
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface UserRecord {
  jid: string;
  phone: string;
  language: LangCode;
  name: string | null;
  role: UserRole;
  step: StateStep;
  selectedListingId: string | null;
  selectedQuantityTons: number | null;
  draftListing: DraftListing | null;
  userLocation: string | null;
  lastGreetedAt: number;
  lastMessageAt: number;
  history: ChatTurn[];
}

export interface WasteListing {
  id: string;
  farmerName: string;
  farmerPhone: string;
  farmerEmail: string;
  itemId: string;
  quantityTons: number;
  pricePerTonInr: number;
  location: string;
  grade: 'A' | 'B' | 'C';
  status: 'available' | 'reserved' | 'sold';
}

export type OrderStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'NEEDS_REVIEW';

export interface OrderRecord {
  paypalOrderId: string;
  buyerJid: string;
  listingId: string;
  quantityTons: number;
  totalInr: number;
  totalUsd: string;
  isSimulated: boolean;
  status: OrderStatus;
  createdAt: number;
  expiresAt: number;
  reminderSent: boolean;
}

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!db) {
    initDatabase();
  }
  return db!;
}

export function initDatabase(dbPath?: string): DatabaseSync {
  const target = dbPath ?? path.resolve(process.cwd(), 'data', 'greenroots.db');
  if (target !== ':memory:') {
    fs.mkdirSync(path.dirname(target), { recursive: true });
  }
  db = new DatabaseSync(target);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      jid TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'en',
      name TEXT,
      role TEXT NOT NULL DEFAULT 'farmer',
      step TEXT NOT NULL DEFAULT 'ONBOARDING_LANGUAGE',
      selected_listing_id TEXT,
      selected_quantity_tons REAL,
      draft_listing_json TEXT,
      user_location TEXT,
      last_greeted_at INTEGER NOT NULL DEFAULT 0,
      last_message_at INTEGER NOT NULL DEFAULT 0,
      history_json TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      farmer_name TEXT NOT NULL,
      farmer_phone TEXT NOT NULL,
      farmer_email TEXT NOT NULL,
      item_id TEXT NOT NULL,
      quantity_tons REAL NOT NULL,
      price_per_ton_inr REAL NOT NULL,
      location TEXT NOT NULL,
      grade TEXT NOT NULL DEFAULT 'A',
      status TEXT NOT NULL DEFAULT 'available'
    );

    CREATE TABLE IF NOT EXISTS orders (
      paypal_order_id TEXT PRIMARY KEY,
      buyer_jid TEXT NOT NULL,
      listing_id TEXT NOT NULL,
      quantity_tons REAL NOT NULL,
      total_inr REAL NOT NULL,
      total_usd TEXT NOT NULL,
      is_simulated INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      reminder_sent INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS processed_messages (
      message_id TEXT PRIMARY KEY,
      processed_at INTEGER NOT NULL
    );
  `);

  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM listings').get() as { cnt: number };
  if (countRow.cnt === 0) {
    const insert = db.prepare(`
      INSERT INTO listings (id, farmer_name, farmer_phone, farmer_email, item_id, quantity_tons, price_per_ton_inr, location, grade, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')
    `);
    insert.run('LST-101', 'Harpreet Singh', '+919876543210', 'sb-farmer-harpreet@personal.example.com', 'paddy_straw', 4, 1600, 'Ludhiana, Punjab', 'A');
    insert.run('LST-102', 'Ramesh Yadav', '+919812345678', 'sb-farmer-ramesh@personal.example.com', 'wheat_straw', 6, 1900, 'Karnal, Haryana', 'A');
    insert.run('LST-103', 'Suresh Patil', '+919765432109', 'sb-farmer-suresh@personal.example.com', 'sugarcane_bagasse', 10, 1450, 'Kolhapur, Maharashtra', 'B');
  }

  // Erase conversation memory & stale pending checkouts on server restart
  db.exec(`
    DELETE FROM users;
    DELETE FROM processed_messages;
    UPDATE orders SET status = 'EXPIRED' WHERE status = 'PENDING';
    UPDATE listings SET status = 'available' WHERE status = 'reserved';
  `);

  return db;
}

export function jidToPhone(jid: string): string {
  return jid.split('@')[0] ?? jid;
}

export function getOrCreateUser(jid: string): UserRecord {
  const conn = getDb();
  const row = conn.prepare('SELECT * FROM users WHERE jid = ?').get(jid) as Record<string, unknown> | undefined;
  if (row) {
    return {
      jid: String(row.jid),
      phone: String(row.phone),
      language: (row.language as LangCode) || 'en',
      name: (row.name as string | null) ?? null,
      role: (row.role as UserRole) || 'farmer',
      step: (row.step as StateStep) || 'ONBOARDING_LANGUAGE',
      selectedListingId: (row.selected_listing_id as string | null) ?? null,
      selectedQuantityTons: (row.selected_quantity_tons as number | null) ?? null,
      draftListing: row.draft_listing_json ? (JSON.parse(String(row.draft_listing_json)) as DraftListing) : null,
      userLocation: (row.user_location as string | null) ?? null,
      lastGreetedAt: Number(row.last_greeted_at ?? 0),
      lastMessageAt: Number(row.last_message_at ?? 0),
      history: row.history_json ? (JSON.parse(String(row.history_json)) as ChatTurn[]) : [],
    };
  }

  const phone = jidToPhone(jid);
  const fresh: UserRecord = {
    jid,
    phone,
    language: 'en',
    name: null,
    role: 'farmer',
    step: 'ONBOARDING_LANGUAGE',
    selectedListingId: null,
    selectedQuantityTons: null,
    draftListing: null,
    userLocation: null,
    lastGreetedAt: 0,
    lastMessageAt: 0,
    history: [],
  };
  saveUser(fresh);
  return fresh;
}

export function saveUser(user: UserRecord): void {
  const conn = getDb();
  const trimmedHistory = user.history.slice(-10);
  user.history = trimmedHistory;
  conn.prepare(`
    INSERT INTO users (
      jid, phone, language, name, role, step,
      selected_listing_id, selected_quantity_tons, draft_listing_json,
      user_location, last_greeted_at, last_message_at, history_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(jid) DO UPDATE SET
      phone = excluded.phone,
      language = excluded.language,
      name = excluded.name,
      role = excluded.role,
      step = excluded.step,
      selected_listing_id = excluded.selected_listing_id,
      selected_quantity_tons = excluded.selected_quantity_tons,
      draft_listing_json = excluded.draft_listing_json,
      user_location = excluded.user_location,
      last_greeted_at = excluded.last_greeted_at,
      last_message_at = excluded.last_message_at,
      history_json = excluded.history_json
  `).run(
    user.jid,
    user.phone,
    user.language,
    user.name,
    user.role,
    user.step,
    user.selectedListingId,
    user.selectedQuantityTons,
    user.draftListing ? JSON.stringify(user.draftListing) : null,
    user.userLocation,
    user.lastGreetedAt,
    user.lastMessageAt,
    JSON.stringify(trimmedHistory)
  );
}

export function isDuplicateMessage(messageId: string, now = Date.now()): boolean {
  const conn = getDb();
  const ttlMs = 24 * 60 * 60 * 1000;
  conn.prepare('DELETE FROM processed_messages WHERE processed_at < ?').run(now - ttlMs);
  const existing = conn.prepare('SELECT 1 FROM processed_messages WHERE message_id = ?').get(messageId);
  if (existing) return true;
  conn.prepare('INSERT INTO processed_messages (message_id, processed_at) VALUES (?, ?)').run(messageId, now);
  return false;
}

function rowToListing(r: Record<string, unknown>): WasteListing {
  return {
    id: String(r.id),
    farmerName: String(r.farmer_name),
    farmerPhone: String(r.farmer_phone),
    farmerEmail: String(r.farmer_email),
    itemId: String(r.item_id),
    quantityTons: Number(r.quantity_tons),
    pricePerTonInr: Number(r.price_per_ton_inr),
    location: String(r.location),
    grade: (r.grade as 'A' | 'B' | 'C') || 'A',
    status: (r.status as 'available' | 'reserved' | 'sold') || 'available',
  };
}

export function getAllListings(onlyAvailable = false): WasteListing[] {
  const conn = getDb();
  const sql = onlyAvailable
    ? "SELECT * FROM listings WHERE status = 'available' ORDER BY rowid DESC"
    : 'SELECT * FROM listings ORDER BY rowid DESC';
  const rows = conn.prepare(sql).all() as Record<string, unknown>[];
  return rows.map(rowToListing);
}

export function getListingById(id: string): WasteListing | null {
  const conn = getDb();
  const normalizedId = id.trim().toUpperCase();
  const row = conn.prepare('SELECT * FROM listings WHERE id = ?').get(normalizedId) as Record<string, unknown> | undefined;
  return row ? rowToListing(row) : null;
}

export function createListing(input: Omit<WasteListing, 'id' | 'status'>): WasteListing {
  if (!input.farmerName.trim() || !input.farmerPhone.trim()) {
    throw new Error('Seller name and phone are required to publish a listing');
  }
  const conn = getDb();
  const countRow = conn.prepare('SELECT COUNT(*) as cnt FROM listings').get() as { cnt: number };
  const id = `LST-${101 + countRow.cnt}`;
  conn.prepare(`
    INSERT INTO listings (id, farmer_name, farmer_phone, farmer_email, item_id, quantity_tons, price_per_ton_inr, location, grade, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')
  `).run(
    id,
    input.farmerName,
    input.farmerPhone,
    input.farmerEmail,
    input.itemId,
    input.quantityTons,
    input.pricePerTonInr,
    input.location,
    input.grade
  );
  return { ...input, id, status: 'available' };
}

export function updateListingStatus(id: string, status: 'available' | 'reserved' | 'sold'): void {
  getDb().prepare('UPDATE listings SET status = ? WHERE id = ?').run(status, id);
}

function rowToOrder(r: Record<string, unknown>): OrderRecord {
  return {
    paypalOrderId: String(r.paypal_order_id),
    buyerJid: String(r.buyer_jid),
    listingId: String(r.listing_id),
    quantityTons: Number(r.quantity_tons),
    totalInr: Number(r.total_inr),
    totalUsd: String(r.total_usd),
    isSimulated: Boolean(r.is_simulated),
    status: r.status as OrderStatus,
    createdAt: Number(r.created_at),
    expiresAt: Number(r.expires_at),
    reminderSent: Boolean(r.reminder_sent),
  };
}

export function saveOrder(order: OrderRecord): void {
  getDb().prepare(`
    INSERT INTO orders (paypal_order_id, buyer_jid, listing_id, quantity_tons, total_inr, total_usd, is_simulated, status, created_at, expires_at, reminder_sent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(paypal_order_id) DO UPDATE SET
      status = excluded.status,
      reminder_sent = excluded.reminder_sent
  `).run(
    order.paypalOrderId,
    order.buyerJid,
    order.listingId,
    order.quantityTons,
    order.totalInr,
    order.totalUsd,
    order.isSimulated ? 1 : 0,
    order.status,
    order.createdAt,
    order.expiresAt,
    order.reminderSent ? 1 : 0
  );
}

export function getOrder(paypalOrderId: string): OrderRecord | null {
  const row = getDb().prepare('SELECT * FROM orders WHERE paypal_order_id = ?').get(paypalOrderId) as Record<string, unknown> | undefined;
  return row ? rowToOrder(row) : null;
}

export function getPendingOrders(): OrderRecord[] {
  const rows = getDb().prepare("SELECT * FROM orders WHERE status = 'PENDING'").all() as Record<string, unknown>[];
  return rows.map(rowToOrder);
}

