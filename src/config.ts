import dotenv from 'dotenv';

dotenv.config();

export const config = {
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite',
  paypalClientId: process.env.PAYPAL_CLIENT_ID ?? '',
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET ?? '',
  paypalBaseUrl: process.env.PAYPAL_BASE_URL ?? 'https://api-m.sandbox.paypal.com',
  port: Number(process.env.PORT ?? 3050),
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3050}`,
  inrPerUsd: Number(process.env.INR_PER_USD ?? 85),
  authDir: process.env.AUTH_DIR ?? 'auth_info',
  dbPath: process.env.DB_PATH ?? '',
  qrAdminKey: process.env.QR_ADMIN_KEY ?? '',
};

