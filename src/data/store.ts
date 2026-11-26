export {
  createListing,
  getAllListings,
  getListingById,
  updateListingStatus,
  type WasteListing,
} from '../db/database.js';

export interface IndustryPool {
  id: string;
  industryName: string;
  itemId: string;
  targetTons: number;
  filledTons: number;
  pricePerTonInr: number;
  location: string;
  deadline: string;
}

export interface CollectionPoint {
  id: string;
  name: string;
  village: string;
  lat: number;
  lng: number;
  hours: string;
}

export const pools: IndustryPool[] = [
  {
    id: 'POOL-201',
    industryName: 'EcoBioPower Ltd.',
    itemId: 'paddy_straw',
    targetTons: 50,
    filledTons: 35,
    pricePerTonInr: 1800,
    location: 'Ludhiana Bio-Plant',
    deadline: 'Friday 6:00 PM',
  },
  {
    id: 'POOL-202',
    industryName: 'GreenPulp Paper Mills',
    itemId: 'wheat_straw',
    targetTons: 40,
    filledTons: 18,
    pricePerTonInr: 2050,
    location: 'Panipat Industrial Area',
    deadline: 'Next Monday',
  },
];

export const collectionPoints: CollectionPoint[] = [
  {
    id: 'CP-01',
    name: 'Ludhiana Mandi Biomass Hub',
    village: 'Gill Village, Ludhiana',
    lat: 30.8588,
    lng: 75.8573,
    hours: '7:00 AM – 7:00 PM',
  },
  {
    id: 'CP-02',
    name: 'Karnal Agri-Waste Depot',
    village: 'Taraori, Karnal',
    lat: 29.7966,
    lng: 76.9344,
    hours: '6:30 AM – 6:30 PM',
  },
  {
    id: 'CP-03',
    name: 'Kolhapur Sugar Co-op Yard',
    village: 'Shiroli, Kolhapur',
    lat: 16.7436,
    lng: 74.2836,
    hours: '8:00 AM – 6:00 PM',
  },
];

export function formatPoolBar(pool: IndustryPool): string {
  const pct = Math.min(100, Math.round((pool.filledTons / pool.targetTons) * 100));
  const filledBlocks = Math.round(pct / 10);
  const bar = '█'.repeat(filledBlocks) + '░'.repeat(10 - filledBlocks);
  const remaining = Math.max(0, pool.targetTons - pool.filledTons);
  return `[${bar}] ${pct}% (${pool.filledTons}/${pool.targetTons}T, ${remaining}T left)`;
}
