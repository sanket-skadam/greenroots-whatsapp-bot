import express from 'express';
import QRCode from 'qrcode';
import type { WASocket } from '@whiskeysockets/baileys';
import { config } from '../config.js';
import { generateReceiptPdf } from '../features/receipt.js';
import { getListingById, getOrder, getOrCreateUser, saveOrder, saveUser, updateListingStatus } from '../db/database.js';
import { getItemName, formatCurrency } from '../data/catalog.js';
import { capturePayPalOrder, createFarmerPayout, inrToUsd } from './client.js';
import { t } from '../i18n/messages.js';
import { appendHistory, clearDrafts } from '../session.js';

export interface WhatsAppStatus {
  connected: boolean;
  qr: string | null;
  lastDisconnectReason: string | null;
}

export interface ServerControlOptions {
  getStatus?: () => WhatsAppStatus;
  resetAuth?: () => Promise<void>;
}

function isQrAuthorized(req: express.Request): boolean {
  if (!config.qrAdminKey) return true;
  return String(req.query.key ?? '') === config.qrAdminKey;
}

export function startPayPalServer(
  getSocket: () => WASocket | null,
  options?: ServerControlOptions
): void {
  const app = express();

  app.get('/health', (_req, res) => {
    const status = options?.getStatus?.();
    res.json({
      ok: true,
      service: 'greenroots-whatsapp-bot',
      whatsappConnected: status?.connected ?? false,
    });
  });

  app.get('/qr', async (req, res) => {
    if (!isQrAuthorized(req)) {
      res.status(401).send('<h2>Unauthorized. Pass <code>?key=YOUR_QR_ADMIN_KEY</code>.</h2>');
      return;
    }

    const status = options?.getStatus?.() ?? { connected: false, qr: null, lastDisconnectReason: null };
    const keyQuery = config.qrAdminKey ? `?key=${encodeURIComponent(config.qrAdminKey)}` : '';

    if (status.connected) {
      res.send(`
        <html>
          <body style="font-family:system-ui,sans-serif;background:#f5f7fa;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;">
            <div style="background:#fff;padding:32px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);text-align:center;max-width:400px;">
              <h2 style="color:#1B5E20;margin-top:0;">✅ WhatsApp Connected</h2>
              <p style="color:#555;font-size:14px;">GreenRoots Bot is online and listening for messages.</p>
              <a href="/qr/reset${keyQuery}" style="display:inline-block;margin-top:14px;padding:10px 18px;background:#d32f2f;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
                Disconnect &amp; Generate New QR
              </a>
            </div>
          </body>
        </html>
      `);
      return;
    }

    if (status.qr) {
      const qrDataUrl = await QRCode.toDataURL(status.qr, { width: 300, margin: 2 });
      res.send(`
        <html>
          <head><meta http-equiv="refresh" content="8" /></head>
          <body style="font-family:system-ui,sans-serif;background:#f5f7fa;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;">
            <div style="background:#fff;padding:32px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);text-align:center;max-width:400px;">
              <h2 style="color:#1B5E20;margin-top:0;">🌱 GreenRoots WhatsApp Login</h2>
              <p style="color:#555;font-size:14px;">Open WhatsApp → Linked Devices → Link a Device, and scan this QR code:</p>
              <img src="${qrDataUrl}" alt="WhatsApp QR Code" style="width:260px;height:260px;border:1px solid #eee;border-radius:8px;" />
              <p style="color:#888;font-size:12px;margin-top:12px;">Page refreshes automatically every 8 seconds.</p>
            </div>
          </body>
        </html>
      `);
      return;
    }

    res.send(`
      <html>
        <head><meta http-equiv="refresh" content="3" /></head>
        <body style="font-family:system-ui,sans-serif;background:#f5f7fa;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;">
          <div style="background:#fff;padding:32px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);text-align:center;max-width:400px;">
            <h2 style="margin-top:0;">⏳ Connecting to WhatsApp...</h2>
            <p style="color:#555;font-size:14px;">${status.lastDisconnectReason ? `Last status: ${status.lastDisconnectReason}` : 'Waiting for QR code or session restore...'}</p>
            <a href="/qr/reset${keyQuery}" style="display:inline-block;margin-top:12px;color:#0070ba;font-size:13px;">Force Fresh QR</a>
          </div>
        </body>
      </html>
    `);
  });

  app.get('/qr/reset', async (req, res) => {
    if (!isQrAuthorized(req)) {
      res.status(401).send('<h2>Unauthorized.</h2>');
      return;
    }
    if (options?.resetAuth) {
      await options.resetAuth();
    }
    const keyQuery = config.qrAdminKey ? `?key=${encodeURIComponent(config.qrAdminKey)}` : '';
    res.redirect(`/qr${keyQuery}`);
  });

  app.get('/paypal/demo-checkout', (req, res) => {
    const token = String(req.query.token ?? '');
    const order = getOrder(token);
    if (!token || !order) {
      res.status(404).send('<h2>Demo checkout session not found or already completed.</h2>');
      return;
    }
    const listing = getListingById(order.listingId);
    const itemName = listing ? getItemName(listing.itemId, 'en') : order.listingId;
    const totalStr = formatCurrency(order.totalInr);

    res.send(`
      <html>
        <body style="font-family:system-ui,sans-serif;background:#f5f7fa;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;">
          <div style="background:#fff;padding:32px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);max-width:420px;width:100%;">
            <div style="text-align:center;margin-bottom:20px;">
              <h2 style="margin:0;color:#003087;">PayPal <span style="font-size:13px;background:#e8f0fe;color:#003087;padding:3px 8px;border-radius:999px;">Demo Checkout</span></h2>
              <p style="color:#666;font-size:13px;margin-top:6px;">GreenRoots Agricultural Waste Marketplace</p>
            </div>
            <div style="border-top:1px solid #eee;border-bottom:1px solid #eee;padding:16px 0;margin-bottom:20px;font-size:14px;line-height:1.7;">
              <div><strong>Order ID:</strong> ${order.paypalOrderId}</div>
              <div><strong>Item:</strong> ${order.quantityTons} Tons — ${itemName}</div>
              <div><strong>Seller:</strong> ${listing?.farmerName ?? '-'} (${listing?.location ?? '-'})</div>
              <div style="font-size:18px;margin-top:10px;color:#1B5E20;"><strong>Total: ${totalStr} ($${order.totalUsd} USD)</strong></div>
            </div>
            <a href="/paypal/success?token=${encodeURIComponent(token)}" style="display:block;text-align:center;background:#0070ba;color:#fff;text-decoration:none;padding:13px;border-radius:24px;font-weight:600;margin-bottom:10px;">
              Pay Now (Simulated)
            </a>
            <a href="/paypal/cancel?jid=${encodeURIComponent(order.buyerJid)}" style="display:block;text-align:center;color:#555;text-decoration:none;padding:10px;font-size:14px;">
              Cancel &amp; Return to WhatsApp
            </a>
          </div>
        </body>
      </html>
    `);
  });

  app.get('/paypal/success', async (req, res) => {
    const token = String(req.query.token ?? '');
    const order = getOrder(token);

    if (!token || !order) {
      res.status(404).send('<h2>Order session not found or already completed.</h2>');
      return;
    }

    // Idempotency: already paid
    if (order.status === 'PAID') {
      res.send('<h2>Payment already processed. Check WhatsApp for your receipt.</h2>');
      return;
    }

    // Expired order — flag for review
    if (order.status === 'EXPIRED' || Date.now() > order.expiresAt) {
      saveOrder({ ...order, status: 'NEEDS_REVIEW' });
      const user = getOrCreateUser(order.buyerJid);
      clearDrafts(user);
      user.step = 'MENU';
      saveUser(user);

      const sock = getSocket();
      if (sock) {
        await sock.sendMessage(order.buyerJid, {
          text: t(user.language, 'checkout_expired_payment_review', { orderId: order.paypalOrderId }),
        });
      }
      res.send('<h2>Order expired — payment flagged for manual review. We will follow up.</h2>');
      return;
    }

    try {
      const capture = await capturePayPalOrder(token);
      if (capture.status !== 'COMPLETED') {
        res.status(400).send(`<h2>Payment status: ${capture.status}</h2>`);
        return;
      }

      saveOrder({ ...order, status: 'PAID' });
      updateListingStatus(order.listingId, 'sold');

      const listing = getListingById(order.listingId);
      const payout = await createFarmerPayout({
        farmerEmail: listing?.farmerEmail ?? 'unknown@example.com',
        amountUsd: order.totalUsd,
        listingId: order.listingId,
        isSimulated: order.isSimulated,
      });

      const receiptId = `GR-RCP-${Date.now().toString().slice(-6)}`;
      const itemName = listing ? getItemName(listing.itemId, 'en') : order.listingId;
      const pdfBuffer = await generateReceiptPdf({
        orderId: receiptId,
        paypalOrderId: token,
        wasteType: itemName,
        quantityTons: order.quantityTons,
        totalInr: order.totalInr,
        totalUsd: order.totalUsd,
        farmerName: listing?.farmerName ?? 'Unknown',
        location: listing?.location ?? 'Unknown',
        payoutNote: payout.note,
      });

      const user = getOrCreateUser(order.buyerJid);
      clearDrafts(user);
      user.step = 'MENU';
      appendHistory(user, 'assistant', `Payment confirmed for order ${token} (${order.quantityTons}T ${itemName}).`);
      saveUser(user);

      const sock = getSocket();
      if (sock) {
        await sock.sendMessage(order.buyerJid, {
          text: t(user.language, 'payment_confirmed', {
            orderId: token,
            quantity: order.quantityTons,
            item: getItemName(listing?.itemId ?? 'wheat_straw', user.language),
            total: formatCurrency(order.totalInr, user.language),
            usd: order.totalUsd,
            payoutNote: payout.note,
          }),
        });
        await sock.sendMessage(order.buyerJid, {
          document: pdfBuffer,
          mimetype: 'application/pdf',
          fileName: `${receiptId}.pdf`,
          caption: t(user.language, 'receipt_caption', { receiptId }),
        });
      }

      res.send(
        `<html><body style="font-family:sans-serif;text-align:center;padding:40px;">
          <h1 style="color:#1B5E20;">✅ Payment Successful!</h1>
          <p>PayPal Order <b>${token}</b> captured.</p>
          <p>Return to <b>WhatsApp</b> — your PDF receipt has been sent!</p>
        </body></html>`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Capture error';
      res.status(500).send(`<h2>Error capturing PayPal order: ${msg}</h2>`);
    }
  });

  app.get('/paypal/cancel', async (req, res) => {
    const jid = String(req.query.jid ?? '');
    const sock = getSocket();
    if (jid) {
      const user = getOrCreateUser(jid);
      if (user.selectedListingId) {
        const listing = getListingById(user.selectedListingId);
        if (listing && listing.status === 'reserved') {
          updateListingStatus(listing.id, 'available');
        }
      }
      clearDrafts(user);
      user.step = 'MENU';
      saveUser(user);
      if (sock) {
        await sock.sendMessage(jid, { text: t(user.language, 'checkout_cancelled') });
      }
    }
    res.send('<h2>Checkout cancelled. You may close this window and return to WhatsApp.</h2>');
  });

  app.listen(config.port, () => {
    console.log(`[PayPal Server] Listening on ${config.publicBaseUrl}`);
  });
}
