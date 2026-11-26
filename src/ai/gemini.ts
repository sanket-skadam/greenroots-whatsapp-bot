import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { config } from '../config.js';
import { CANONICAL_ITEM_IDS, getItemName, normalizeItemId, type LangCode } from '../data/catalog.js';
import { getAllListings, type UserRecord, type UserRole } from '../db/database.js';
import { pools } from '../data/store.js';
import { LANGUAGE_NAMES } from '../i18n/messages.js';

export const INTENT_ENUM = [
  'SELL_LISTING',
  'BUY_SEARCH',
  'VIEW_LISTINGS',
  'VIEW_POOLS',
  'SELECT_LISTING',
  'CONFIRM',
  'CANCEL',
  'PROVIDE_LOCATION',
  'PROVIDE_NAME_ROLE',
  'CHANGE_LANGUAGE',
  'SMALL_TALK',
  'UNKNOWN',
] as const;

export type Intent = (typeof INTENT_ENUM)[number];

export const ExtractionSchema = z.object({
  intent: z.enum(INTENT_ENUM),
  item: z.string().nullable(),
  quantity_tons: z.number().nullable(),
  price_per_ton: z.number().nullable(),
  location: z.string().nullable(),
  listing_id: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1),
});

export type ExtractionResult = z.infer<typeof ExtractionSchema>;

export const VoiceExtractionSchema = ExtractionSchema.extend({
  transcript: z.string(),
});

export type VoiceExtractionResult = z.infer<typeof VoiceExtractionSchema>;

const GEMINI_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    intent: { type: Type.STRING, enum: [...INTENT_ENUM] },
    item: { type: Type.STRING, nullable: true },
    quantity_tons: { type: Type.NUMBER, nullable: true },
    price_per_ton: { type: Type.NUMBER, nullable: true },
    location: { type: Type.STRING, nullable: true },
    listing_id: { type: Type.STRING, nullable: true },
    confidence: { type: Type.NUMBER },
  },
  required: ['intent', 'item', 'quantity_tons', 'price_per_ton', 'location', 'confidence'],
};

const VOICE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    transcript: { type: Type.STRING },
    intent: { type: Type.STRING, enum: [...INTENT_ENUM] },
    item: { type: Type.STRING, nullable: true },
    quantity_tons: { type: Type.NUMBER, nullable: true },
    price_per_ton: { type: Type.NUMBER, nullable: true },
    location: { type: Type.STRING, nullable: true },
    listing_id: { type: Type.STRING, nullable: true },
    confidence: { type: Type.NUMBER },
  },
  required: ['transcript', 'intent', 'item', 'quantity_tons', 'price_per_ton', 'location', 'confidence'],
};

function getClient(): GoogleGenAI {
  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is missing in .env');
  }
  return new GoogleGenAI({ apiKey: config.geminiApiKey });
}

const FALLBACK_MODELS = [
  config.geminiModel,
  'gemini-3.1-flash-lite',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
];

const TIMEOUT_MS = 15_000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`Gemini timeout after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function callGeminiWithRetry<T>(fn: (model: string) => Promise<T>): Promise<T> {
  const uniqueModels = [...new Set(FALLBACK_MODELS)];
  let lastErr: unknown;

  for (const model of uniqueModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await withTimeout(fn(model), TIMEOUT_MS);
      } catch (err) {
        lastErr = err;
        const msg = err instanceof Error ? err.message : String(err);
        const isRetryable =
          msg.includes('503') ||
          msg.includes('500') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('429') ||
          msg.includes('404') ||
          msg.includes('timeout');
        if (!isRetryable) throw err;
        if (attempt === 0 && (msg.includes('429') || msg.includes('503') || msg.includes('500'))) {
          await new Promise((r) => setTimeout(r, 800 * 2 ** attempt));
        } else {
          break;
        }
      }
    }
  }
  throw lastErr;
}

export function getAllowedIntentsForRole(role: UserRole): Intent[] {
  if (role === 'farmer') {
    return [
      'SELL_LISTING',
      'VIEW_POOLS',
      'CONFIRM',
      'CANCEL',
      'PROVIDE_LOCATION',
      'PROVIDE_NAME_ROLE',
      'CHANGE_LANGUAGE',
      'SMALL_TALK',
      'UNKNOWN',
    ];
  }
  return [
    'BUY_SEARCH',
    'VIEW_LISTINGS',
    'VIEW_POOLS',
    'SELECT_LISTING',
    'CONFIRM',
    'CANCEL',
    'PROVIDE_LOCATION',
    'PROVIDE_NAME_ROLE',
    'CHANGE_LANGUAGE',
    'SMALL_TALK',
    'UNKNOWN',
  ];
}

function buildClassifierPrompt(user: UserRecord, inputText?: string): string {
  const allowed = getAllowedIntentsForRole(user.role).join(', ');
  const recentHistory =
    user.history.length === 0
      ? 'None'
      : user.history
        .slice(-10)
        .map((h) => `${h.role === 'user' ? 'User' : 'Bot'}: ${h.text}`)
        .join('\n');

  return `You are a strict intent classifier and field extractor for GreenRoots (agricultural crop-waste marketplace).
You MUST ONLY classify intent and extract explicitly stated fields. Do NOT decide conversation flow.

User State:
- Role: ${user.role} (allowed intents for this role: ${allowed})
- Current Step: ${user.step}
- Language: ${LANGUAGE_NAMES[user.language]}
- Name: ${user.name ?? 'unknown'}
- Selected Listing: ${user.selectedListingId ?? 'none'}
- Draft Listing: ${JSON.stringify(user.draftListing)}

Recent Chat History (last 10 turns):
${recentHistory}

${inputText !== undefined ? `Latest User Message: "${inputText}"` : 'Analyze the attached voice note.'}

Intent Rules & Hindi/Hinglish Cues:
- BUY_SEARCH: user wants to buy/find/get crop waste. Hindi/Hinglish cues: "chahiye", "chahta hu", "kharidna hai", "lena hai", "chahiye hai", "need", "want to buy".
- SELL_LISTING: user wants to sell/list crop waste. Hindi/Hinglish cues: "bechna hai", "becha", "available hai", "mere paas hai", "sell", "bechni hai".
- VIEW_LISTINGS: user asks to see all listings ("listings dikhao", "show listings", "kya available hai").
- VIEW_POOLS: user asks to see live industry pools ("pool dikhao", "live pools dekhne the", "industry pools", "show pools").
- SELECT_LISTING: user picks a listing ID like "LST-101" or "LST-102".
- CONFIRM: "yes", "haan", "haa", "ha", "ok", "confirm", "aage badho", "theek hai", "हाँ", "हो".
- CANCEL: "cancel", "no", "nahi", "ruko", "band karo".
- PROVIDE_LOCATION: user states a city/village/location (e.g. "Ludhiana", "Ludhiana, Punjab se hu", "Karnal").
- CHANGE_LANGUAGE: user asks to switch language.
- SMALL_TALK: greetings or general questions.

Canonical Item IDs (use one of these when it matches): ${CANONICAL_ITEM_IDS.join(', ')}
- "bhusa", "gehu ka bhusa", "wheat husk", "tudi" -> "wheat_straw"
- "parali", "dhan ki parali", "stubble" -> "paddy_straw"
- "ganna", "bagasse", "ganne ki khoi" -> "sugarcane_bagasse"
- "kapas", "cotton" -> "cotton_stalks"
- "rice husk", "dhan ki bhusi" -> "rice_husk"
- "nariyal ka chilka", "nariyal ke chilke", "coconut husk", "coir" -> "coconut_husk"
- For any other agricultural/crop waste explicitly named by the user (e.g. mustard stalks, corn cob, groundnut shell), output a short snake_case name (e.g. "mustard_stalks") instead of null.

CRITICAL EXTRACTION RULE:
Never guess or infer values. If a value (item, quantity_tons, price_per_ton, location, listing_id) was NOT explicitly stated in the user's words, return null for that field.`;
}

function normalizeExtraction(parsed: ExtractionResult): ExtractionResult {
  return {
    ...parsed,
    item: normalizeItemId(parsed.item),
    listing_id: parsed.listing_id ? parsed.listing_id.toUpperCase() : null,
  };
}

export async function classifyAndExtract(
  user: UserRecord,
  text: string
): Promise<ExtractionResult> {
  const ai = getClient();
  const prompt = buildClassifierPrompt(user, text);

  for (let parseAttempt = 0; parseAttempt < 2; parseAttempt++) {
    const response = await callGeminiWithRetry((model) =>
      ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: GEMINI_RESPONSE_SCHEMA,
        },
      })
    );
    const raw = response.text?.trim() ?? '';
    try {
      const validated = ExtractionSchema.parse(JSON.parse(raw));
      return normalizeExtraction(validated);
    } catch {
      if (parseAttempt === 1) {
        throw new Error('Failed to parse Gemini JSON output');
      }
    }
  }
  throw new Error('Failed to parse Gemini JSON output');
}

export async function transcribeAndExtractVoice(
  user: UserRecord,
  audioBuffer: Buffer,
  mimeType: string
): Promise<VoiceExtractionResult> {
  const ai = getClient();
  const prompt = buildClassifierPrompt(user);

  for (let parseAttempt = 0; parseAttempt < 2; parseAttempt++) {
    const response = await callGeminiWithRetry((model) =>
      ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: mimeType || 'audio/ogg', data: audioBuffer.toString('base64') } },
              { text: prompt },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: VOICE_RESPONSE_SCHEMA,
        },
      })
    );
    const raw = response.text?.trim() ?? '';
    try {
      const validated = VoiceExtractionSchema.parse(JSON.parse(raw));
      return {
        ...normalizeExtraction(validated),
        transcript: validated.transcript,
      };
    } catch {
      if (parseAttempt === 1) {
        throw new Error('Failed to parse Gemini voice JSON output');
      }
    }
  }
  throw new Error('Failed to parse Gemini voice JSON output');
}

export interface PhotoGradeResult {
  itemId: string;
  grade: 'A' | 'B' | 'C';
  moistureEstimate: string;
  suggestedPriceInr: number;
  summary: string;
}

export async function gradeWastePhoto(
  imageBuffer: Buffer,
  mimeType: string,
  language: LangCode
): Promise<PhotoGradeResult> {
  const ai = getClient();
  const langName = LANGUAGE_NAMES[language];
  const response = await callGeminiWithRetry((model) =>
    ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBuffer.toString('base64') } },
            {
              text: `Inspect this crop waste photo.
Output ONLY JSON:
- itemId: one of ${CANONICAL_ITEM_IDS.join(', ')} if it matches, otherwise a short snake_case name for the crop waste (e.g. "coconut_husk", "corn_cobs")
- grade: "A" | "B" | "C"
- moistureEstimate: short phrase describing moisture level, written ENTIRELY in ${langName} native script (Devanagari for Hindi/Marathi, Gurmukhi for Punjabi, English for English). Do NOT mix languages or scripts. Example for Hindi: "मध्यम नमी", for English: "Medium moisture"
- suggestedPriceInr: number (1400-2200)
- summary: 2 sentences on quality & CO2 impact, written ENTIRELY in ${langName} native script. Do NOT mix languages or use English words inside a Hindi/Punjabi/Marathi sentence.`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itemId: { type: Type.STRING },
            grade: { type: Type.STRING, enum: ['A', 'B', 'C'] },
            moistureEstimate: { type: Type.STRING },
            suggestedPriceInr: { type: Type.NUMBER },
            summary: { type: Type.STRING },
          },
          required: ['itemId', 'grade', 'moistureEstimate', 'suggestedPriceInr', 'summary'],
        },
      },
    })
  );
  const parsed = JSON.parse(response.text?.trim() ?? '{}') as PhotoGradeResult;
  return {
    ...parsed,
    itemId: normalizeItemId(parsed.itemId) ?? 'wheat_straw',
  };
}

export async function generateSmallTalkReply(
  user: UserRecord,
  userMessage: string
): Promise<string> {
  const ai = getClient();
  const langName = LANGUAGE_NAMES[user.language];
  const recentHistory = user.history
    .slice(-10)
    .map((h) => `${h.role === 'user' ? 'User' : 'Bot'}: ${h.text}`)
    .join('\n');
  const poolSummary = pools
    .map((p) => `${p.id}: ${p.industryName} wants ${getItemName(p.itemId, user.language)} @ ₹${p.pricePerTonInr}/ton (${p.filledTons}/${p.targetTons}T, ${p.location})`)
    .join('\n');
  const listingSummary = getAllListings(true)
    .map((l) => `${l.id}: ${l.quantityTons}T ${getItemName(l.itemId, user.language)} @ ₹${l.pricePerTonInr}/ton (${l.location})`)
    .join('\n');

  const response = await callGeminiWithRetry((model) =>
    ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are GreenRoots assistant replying to ${user.name ?? 'a user'} (role: ${user.role}, step: ${user.step}).
Preferred Language: ${langName}.
Live Industry Pools:
${poolSummary || 'None'}
Active Listings:
${listingSummary || 'None'}
Recent Chat History:
${recentHistory || 'None'}

Latest User Message: "${userMessage}"

Rules:
- Do not greet again. Continue the conversation naturally.
- Reply ONLY in ${langName} using its native script (Devanagari for Hindi/Marathi, Gurmukhi for Punjabi), even if the user wrote in Hinglish.
- Keep it short (1-3 sentences), friendly, and helpful.`,
            },
          ],
        },
      ],
    })
  );
  return response.text?.trim() || '';
}

const NameRoleSchema = z.object({
  name: z.string().nullable(),
  role: z.enum(['farmer', 'industry', 'buyer']).nullable(),
});

export async function extractNameAndRole(
  text: string,
  language: LangCode
): Promise<{ name: string; role: UserRole } | null> {
  const ai = getClient();
  const langName = LANGUAGE_NAMES[language];
  const scriptRule =
    language === 'en'
      ? 'Return the name in English/Latin script.'
      : `Transliterate the person's name into ${langName} native script (Devanagari for Hindi/Marathi, Gurmukhi for Punjabi), e.g. "Sanket" -> "संकेत" (hi/mr) or "ਸੰਕੇਤ" (pa).`;

  const response = await callGeminiWithRetry((model) =>
    ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Extract the user's name and role from this message. The user may write in English, Hindi, Punjabi, Marathi, or Hinglish (Romanized Hindi/Punjabi/Marathi), and may mention name and role anywhere in any order.

Message: "${text}"

Rules:
- role must be one of: "farmer" (kisan, shetkari, krishak, seller, bechna hai), "industry" (udyog, factory, mill, company, bulk buyer), "buyer" (kharidar, kharidi, customer, lena hai, buyer).
- If name is missing or unclear, return null for name.
- If role is missing or unclear, return null for role.
- ${scriptRule}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, nullable: true },
            role: { type: Type.STRING, enum: ['farmer', 'industry', 'buyer'], nullable: true },
          },
          required: ['name', 'role'],
        },
      },
    })
  );

  try {
    const parsed = NameRoleSchema.parse(JSON.parse(response.text?.trim() ?? '{}'));
    if (!parsed.name || !parsed.role) return null;
    const cleanedName = parsed.name.trim();
    if (!cleanedName) return null;
    return { name: cleanedName, role: parsed.role };
  } catch {
    return null;
  }
}
