# GreenRoots WhatsApp Bot (Standalone Baileys + Gemini AI + PayPal Sandbox)

A standalone WhatsApp chatbot built with **Baileys (WebSocket)**, **Gemini AI**, and **PayPal Sandbox** for the **GreenRoots** Agricultural Waste Management Marketplace.

## Features
- **Voice-First Regional Listings:** Farmers send voice notes (Hindi, Punjabi, Marathi, English) → Gemini transcribes & extracts structured crop-waste listings.
- **Photo Quality Grading:** Send a photo of crop waste → Gemini Vision estimates moisture/grade (`A/B/C`) and suggests a fair ₹/ton price.
- **Human-in-the-Loop PayPal Checkout & Payouts:** Buyers/industries confirm orders (`CONFIRM PAY`) → generates a PayPal Sandbox checkout link → auto-captures payment, initiates farmer payout, and sends a **PDF receipt** in WhatsApp.
- **Industry Pools & Location Hubs:** Live pool progress bars (`/pool`, `JOIN POOL-201 5`) and nearest collection point finder via WhatsApp location pins.
- **Demo Role Switcher:** Switch between `/role farmer`, `/role industry`, and `/role buyer` in one chat.

## Setup
```bash
npm install
cp .env.example .env
# Add your GEMINI_API_KEY, PAYPAL_CLIENT_ID, and PAYPAL_CLIENT_SECRET in .env
npm run dev
```

Scan the QR code in your terminal using **WhatsApp → Linked Devices**, then send `/help` to the bot!

