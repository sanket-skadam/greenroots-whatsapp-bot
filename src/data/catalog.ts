export type LangCode = 'en' | 'hi' | 'pa' | 'mr';

export interface CanonicalItem {
  id: string;
  names: Record<LangCode, string>;
  aliases: string[];
}

export const ITEM_CATALOG: CanonicalItem[] = [
  {
    id: 'wheat_straw',
    names: {
      en: 'Wheat Straw',
      hi: 'गेहूँ का भूसा',
      pa: 'ਕਣਕ ਦਾ ਤੂੜੀ (ਭੂਸਾ)',
      mr: 'गव्हाचा भुसा',
    },
    aliases: [
      'wheat_straw',
      'wheat straw',
      'wheat husk',
      'bhusa',
      'bhoosa',
      'gehu ka bhusa',
      'gehun ka bhusa',
      'gehu bhusa',
      'tudi',
      'toori',
      'गेहूं का भूसा',
      'गेहूँ का भूसा',
      'भूसा',
      'गव्हाचा भुसा',
    ],
  },
  {
    id: 'paddy_straw',
    names: {
      en: 'Paddy Straw',
      hi: 'धान की पराली',
      pa: 'ਝੋਨੇ ਦੀ ਪਰਾਲੀ',
      mr: 'भाताचा पेंढा (पराली)',
    },
    aliases: [
      'paddy_straw',
      'paddy straw',
      'rice straw',
      'parali',
      'paraali',
      'dhan ki parali',
      'dhaan ki parali',
      'stubble',
      'पराली',
      'धान की पराली',
      'ਝੋਨੇ ਦੀ ਪਰਾਲੀ',
      'ਪਰਾਲੀ',
    ],
  },
  {
    id: 'sugarcane_bagasse',
    names: {
      en: 'Sugarcane Bagasse',
      hi: 'गन्ने की खोई',
      pa: 'ਗੰਨੇ ਦੀ ਖੋਈ',
      mr: 'उसाची चिपाड',
    },
    aliases: [
      'sugarcane_bagasse',
      'sugarcane bagasse',
      'bagasse',
      'sugarcane waste',
      'ganne ki khoi',
      'ganna',
      'usachi chipad',
      'गन्ने की खोई',
      'उसाची चिपाड',
    ],
  },
  {
    id: 'cotton_stalks',
    names: {
      en: 'Cotton Stalks',
      hi: 'कपास के डंठल',
      pa: 'ਨਰਮੇ ਦੀਆਂ ਛਟੀਆਂ',
      mr: 'कापसाच्या काड्या',
    },
    aliases: [
      'cotton_stalks',
      'cotton stalks',
      'cotton waste',
      'kapas',
      'narma',
      'कपास के डंठल',
      'कापसाच्या काड्या',
    ],
  },
  {
    id: 'rice_husk',
    names: {
      en: 'Rice Husk',
      hi: 'धान की भूसी',
      pa: 'ਝੋਨੇ ਦਾ ਛਿਲਕਾ',
      mr: 'तांदळाची तूस',
    },
    aliases: [
      'rice_husk',
      'rice husk',
      'chaff',
      'dhan ki bhusi',
      'धान की भूसी',
    ],
  },
  {
    id: 'coconut_husk',
    names: {
      en: 'Coconut Husk',
      hi: 'नारियल का छिलका',
      pa: 'ਨਾਰੀਅਲ ਦਾ ਛਿਲਕਾ',
      mr: 'नारळाचे टरफल (शेंडी)',
    },
    aliases: [
      'coconut_husk',
      'coconut husk',
      'coconut shell',
      'coir',
      'nariyal ka chilka',
      'nariyal ke chilke',
      'nariyal chilka',
      'naral',
      'नारियल का छिलका',
      'नारियल के छिलके',
    ],
  },
];

export const CANONICAL_ITEM_IDS = ITEM_CATALOG.map((i) => i.id);

export function normalizeItemId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase();
  if (!cleaned) return null;

  for (const item of ITEM_CATALOG) {
    if (item.id === cleaned) return item.id;
    if (item.aliases.some((a) => a.toLowerCase() === cleaned || cleaned.includes(a.toLowerCase()))) {
      return item.id;
    }
  }
  // Preserve custom agricultural waste types instead of discarding them
  return raw.trim();
}

export function getItemName(itemId: string, lang: LangCode): string {
  const found = ITEM_CATALOG.find((i) => i.id === itemId);
  if (found) return found.names[lang] ?? found.names.en;
  return itemId
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const inrFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

export function formatCurrency(amountInr: number, _lang?: LangCode): string {
  return `₹${inrFormatter.format(Math.round(amountInr))}`;
}

