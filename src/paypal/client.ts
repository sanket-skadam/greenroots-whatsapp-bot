import { config } from '../config.js';
import {
  getListingById,
  getPendingOrders,
  getOrder,
  saveOrder,
  updateListingStatus,
  type OrderRecord,
  type WasteListing,
} from '../db/database.js';

export { type OrderRecord };

export function inrToUsd(inr: number): string {
  return Math.max(1, inr / config.inrPerUsd).toFixed(2);
}

export function hasRealPayPalCreds(): boolean {
  return (
    Boolean(config.paypalClientId) &&
    Boolean(config.paypalClientSecret) &&
    !config.paypalClientId.startsWith('your_') &&
    !config.paypalClientSecret.startsWith('your_')
  );
}

const ORDER_TTL_MS = 30 * 60 * 1000;

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(`${config.paypalClientId}:${config.paypalClientSecret}`).toString('base64');
  const res = await fetch(`${config.paypalBaseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal OAuth failed (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function createPayPalOrder(params: {
  buyerJid: string;
  listing: WasteListing;
  quantityTons: number;
  totalInr: number;
}): Promise<{ paypalOrderId: string; approveUrl: string; totalUsd: string; isSimulated: boolean }> {
  const totalUsd = inrToUsd(params.totalInr);
  const now = Date.now();
  const expiresAt = now + ORDER_TTL_MS;

  if (!hasRealPayPalCreds()) {
    const simOrderId = `SIM-PP-${now.toString().slice(-8)}`;
    const order: OrderRecord = {
      paypalOrderId: simOrderId,
      buyerJid: params.buyerJid,
      listingId: params.listing.id,
      quantityTons: params.quantityTons,
      totalInr: params.totalInr,
      totalUsd,
      isSimulated: true,
      status: 'PENDING',
      createdAt: now,
      expiresAt,
      reminderSent: false,
    };
    saveOrder(order);
    return {
      paypalOrderId: simOrderId,
      approveUrl: `${config.publicBaseUrl}/paypal/demo-checkout?token=${simOrderId}`,
      totalUsd,
      isSimulated: true,
    };
  }

  const token = await getAccessToken();
  const res = await fetch(`${config.paypalBaseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: params.listing.id,
        description: `GreenRoots: ${params.quantityTons}T ${params.listing.itemId}`,
        amount: { currency_code: 'USD', value: totalUsd },
      }],
      application_context: {
        brand_name: 'GreenRoots Marketplace',
        user_action: 'PAY_NOW',
        return_url: `${config.publicBaseUrl}/paypal/success`,
        cancel_url: `${config.publicBaseUrl}/paypal/cancel?jid=${encodeURIComponent(params.buyerJid)}`,
      },
    }),
  });
  if (!res.ok) throw new Error(`PayPal Create Order failed (${res.status}): ${await res.text()}`);

  const data = (await res.json()) as { id: string; links: Array<{ rel: string; href: string }> };
  const approveUrl =
    data.links.find((l) => l.rel === 'approve')?.href ??
    `https://www.sandbox.paypal.com/checkoutnow?token=${data.id}`;

  const order: OrderRecord = {
    paypalOrderId: data.id,
    buyerJid: params.buyerJid,
    listingId: params.listing.id,
    quantityTons: params.quantityTons,
    totalInr: params.totalInr,
    totalUsd,
    isSimulated: false,
    status: 'PENDING',
    createdAt: now,
    expiresAt,
    reminderSent: false,
  };
  saveOrder(order);
  return { paypalOrderId: data.id, approveUrl, totalUsd, isSimulated: false };
}

export async function capturePayPalOrder(paypalOrderId: string): Promise<{ status: string }> {
  const order = getOrder(paypalOrderId);
  if (!order) throw new Error(`Order ${paypalOrderId} not found`);
  if (order.isSimulated) return { status: 'COMPLETED' };

  const token = await getAccessToken();
  const res = await fetch(`${config.paypalBaseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`PayPal Capture failed (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { status: string };
  return { status: data.status };
}

export async function createFarmerPayout(params: {
  farmerEmail: string;
  amountUsd: string;
  listingId: string;
  isSimulated?: boolean;
}): Promise<{ ok: boolean; note: string; batchId?: string }> {
  if (params.isSimulated || !hasRealPayPalCreds()) {
    return { ok: true, note: `Simulated Payout ($${params.amountUsd} USD → ${params.farmerEmail})` };
  }
  try {
    const token = await getAccessToken();
    const senderBatchId = `GR-${params.listingId}-${Date.now()}`;
    const res = await fetch(`${config.paypalBaseUrl}/v1/payments/payouts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_batch_header: { sender_batch_id: senderBatchId, email_subject: 'GreenRoots Farmer Payout!' },
        items: [{
          recipient_type: 'EMAIL',
          amount: { value: params.amountUsd, currency: 'USD' },
          receiver: params.farmerEmail,
          note: `Payout for GreenRoots listing ${params.listingId}`,
        }],
      }),
    });
    if (!res.ok) {
      return { ok: false, note: `Simulated Payout (API ${res.status}: ${(await res.text()).slice(0, 100)})` };
    }
    const data = (await res.json()) as { batch_header?: { payout_batch_id?: string } };
    const batchId = data.batch_header?.payout_batch_id;
    return { ok: true, batchId, note: `PayPal Payout Batch: ${batchId ?? senderBatchId}` };
  } catch (err) {
    return { ok: false, note: `Simulated Payout (${err instanceof Error ? err.message : 'error'})` };
  }
}

export function startOrderExpiryChecker(
  onExpired: (order: OrderRecord) => Promise<void>,
  onReminder: (order: OrderRecord) => Promise<void>
): void {
  const REMINDER_BEFORE_EXPIRY_MS = 15 * 60 * 1000;

  setInterval(() => {
    const now = Date.now();
    const pending = getPendingOrders();
    for (const order of pending) {
      if (now >= order.expiresAt) {
        saveOrder({ ...order, status: 'EXPIRED' });
        const listing = getListingById(order.listingId);
        if (listing && listing.status === 'reserved') {
          updateListingStatus(order.listingId, 'available');
        }
        void onExpired(order);
      } else if (!order.reminderSent && now >= order.expiresAt - REMINDER_BEFORE_EXPIRY_MS) {
        saveOrder({ ...order, reminderSent: true });
        void onReminder(order);
      }
    }
  }, 60_000);
}
