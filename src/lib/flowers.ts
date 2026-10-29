import type { PlantedFlower, UserData } from '../types';

// ── Collection de fleurs : une fleur offerte chaque jour, plus rare avec la régularité ──
export type FlowerRarity = 'commune' | 'rare' | 'precieuse' | 'legendaire';
export type PetalShape = 'round' | 'pointed' | 'heart' | 'tulip' | 'lotus' | 'bell' | 'star';

export interface FlowerDef {
  id: string; fr: string; ar: string; rarity: FlowerRarity;
  shape: PetalShape; petals: number; layers: number;
  c1: string; c2: string; heart: string; glow?: boolean;
  noteFr: string;
}

export const RARITIES: { id: FlowerRarity; fr: string; ar: string; color: string }[] = [
  { id: 'commune',    fr: 'Commune',    ar: 'عادية',   color: '#7FA872' },
  { id: 'rare',       fr: 'Rare',       ar: 'نادرة',   color: '#5E9BD6' },
  { id: 'precieuse',  fr: 'Précieuse',  ar: 'ثمينة',   color: '#B76BC9' },
  { id: 'legendaire', fr: 'Légendaire', ar: 'أسطورية', color: '#D9A441' },
];

export const FLOWERS: FlowerDef[] = [
  { id: 'marguerite', fr: 'Marguerite', ar: 'أقحوان', rarity: 'commune', shape: 'pointed', petals: 14, layers: 1, c1: '#FFFFFF', c2: '#E9E4DA', heart: '#F2C14E', noteFr: 'Simple et lumineuse, comme un premier pas.' },
  { id: 'coquelicot', fr: 'Coquelicot', ar: 'شقائق النعمان', rarity: 'commune', shape: 'round', petals: 4, layers: 1, c1: '#E5484D', c2: '#B92D33', heart: '#2B1B1B', noteFr: 'Elle fleurit dans les champs d\'Algérie au printemps.' },
  { id: 'camomille', fr: 'Camomille', ar: 'بابونج', rarity: 'commune', shape: 'pointed', petals: 18, layers: 1, c1: '#FFFDF6', c2: '#EFE7D4', heart: '#F5B83D', noteFr: 'Douce et apaisante.' },
  { id: 'bleuet', fr: 'Bleuet', ar: 'قنطريون', rarity: 'commune', shape: 'star', petals: 10, layers: 2, c1: '#5B7FE0', c2: '#3A5BC0', heart: '#2A3570', noteFr: 'Un éclat de ciel dans le blé.' },
  { id: 'primevere', fr: 'Primevère', ar: 'زهرة الربيع', rarity: 'commune', shape: 'heart', petals: 5, layers: 1, c1: '#FBE38E', c2: '#F1C94E', heart: '#E58A2E', noteFr: 'Elle annonce le printemps.' },
  { id: 'violette', fr: 'Violette', ar: 'بنفسج', rarity: 'commune', shape: 'round', petals: 5, layers: 1, c1: '#8A63C9', c2: '#6B48A8', heart: '#F4D35E', noteFr: 'Discrète et parfumée.' },
  { id: 'myosotis', fr: 'Myosotis', ar: 'لا تنسني', rarity: 'commune', shape: 'round', petals: 5, layers: 1, c1: '#9CC6F0', c2: '#76A9DE', heart: '#F7D774', noteFr: 'On l\'appelle « ne m\'oubliez pas ».' },
  { id: 'jasmin', fr: 'Jasmin', ar: 'ياسمين', rarity: 'commune', shape: 'pointed', petals: 5, layers: 1, c1: '#FFFFFF', c2: '#F0EBE2', heart: '#F3D58A', noteFr: 'Le parfum des cours d\'Alger le soir.' },
  { id: 'lavande', fr: 'Lavande', ar: 'خزامى', rarity: 'commune', shape: 'bell', petals: 7, layers: 1, c1: '#A889DA', c2: '#8768C2', heart: '#6E9A62', noteFr: 'Une brise de calme.' },
  { id: 'souci', fr: 'Souci', ar: 'آذريون', rarity: 'commune', shape: 'pointed', petals: 16, layers: 2, c1: '#F7A531', c2: '#E8821C', heart: '#B5561A', noteFr: 'Une petite boule de soleil.' },
  { id: 'paquerette', fr: 'Pâquerette', ar: 'زهرة الأقحوان الصغيرة', rarity: 'commune', shape: 'pointed', petals: 20, layers: 1, c1: '#FFFFFF', c2: '#F6C9D6', heart: '#F2C14E', noteFr: 'Toute petite, et pourtant partout.' },
  { id: 'trefle', fr: 'Fleur de trèfle', ar: 'زهرة البرسيم', rarity: 'commune', shape: 'round', petals: 9, layers: 2, c1: '#F1B6CF', c2: '#DE8EB3', heart: '#C46A96', noteFr: 'Les abeilles l\'adorent.' },

  { id: 'rose-damas', fr: 'Rose de Damas', ar: 'الوردة الدمشقية', rarity: 'rare', shape: 'round', petals: 6, layers: 3, c1: '#E8869A', c2: '#C9576F', heart: '#A63D55', noteFr: 'La rose au parfum légendaire.' },
  { id: 'tulipe', fr: 'Tulipe', ar: 'توليب', rarity: 'rare', shape: 'tulip', petals: 3, layers: 1, c1: '#E55373', c2: '#B8344F', heart: '#7FA872', noteFr: 'Venue des jardins d\'Orient.' },
  { id: 'iris', fr: 'Iris', ar: 'سوسن', rarity: 'rare', shape: 'heart', petals: 6, layers: 2, c1: '#7A6AD8', c2: '#5546B2', heart: '#F4CF5D', noteFr: 'Elle porte toutes les nuances du violet.' },
  { id: 'lys', fr: 'Lys blanc', ar: 'زنبق أبيض', rarity: 'rare', shape: 'pointed', petals: 6, layers: 1, c1: '#FFFFFF', c2: '#EDE6F2', heart: '#E4A93A', noteFr: 'Pure et élancée.' },
  { id: 'fleur-oranger', fr: 'Fleur d\'oranger', ar: 'زهر البرتقال', rarity: 'rare', shape: 'pointed', petals: 5, layers: 2, c1: '#FFFCF4', c2: '#F3E9D2', heart: '#F0B93A', noteFr: 'L\'eau de fleur d\'oranger des pâtisseries de l\'Aïd.' },
  { id: 'pivoine', fr: 'Pivoine', ar: 'فاوانيا', rarity: 'rare', shape: 'round', petals: 8, layers: 3, c1: '#F4B3C0', c2: '#E6899C', heart: '#F2C35B', noteFr: 'Généreuse et pleine de pétales.' },
  { id: 'hibiscus', fr: 'Hibiscus', ar: 'كركديه', rarity: 'rare', shape: 'heart', petals: 5, layers: 1, c1: '#F0566A', c2: '#C7344B', heart: '#F7D774', noteFr: 'On en fait le karkadé.' },
  { id: 'jacinthe', fr: 'Jacinthe', ar: 'زنبق الماء', rarity: 'rare', shape: 'bell', petals: 9, layers: 2, c1: '#7FA2EC', c2: '#5A7FD8', heart: '#7FA872', noteFr: 'Un bouquet de clochettes.' },
  { id: 'narcisse', fr: 'Narcisse', ar: 'نرجس', rarity: 'rare', shape: 'pointed', petals: 6, layers: 2, c1: '#FFF6D8', c2: '#F6E2A0', heart: '#F29C1F', noteFr: 'Son cœur est une petite trompette dorée.' },

  { id: 'lotus', fr: 'Lotus', ar: 'لوتس', rarity: 'precieuse', shape: 'lotus', petals: 8, layers: 2, c1: '#F6BED0', c2: '#E58FAE', heart: '#F4D35E', noteFr: 'Elle s\'élève, pure, au-dessus de l\'eau.' },
  { id: 'orchidee', fr: 'Orchidée', ar: 'سحلبية', rarity: 'precieuse', shape: 'heart', petals: 5, layers: 2, c1: '#D59BE6', c2: '#A863C2', heart: '#F7E08C', noteFr: 'Rare et délicate.' },
  { id: 'magnolia', fr: 'Magnolia', ar: 'ماغنوليا', rarity: 'precieuse', shape: 'tulip', petals: 5, layers: 2, c1: '#FBE7EE', c2: '#E8B6C8', heart: '#C98B5E', noteFr: 'Une des fleurs les plus anciennes du monde.' },
  { id: 'gardenia', fr: 'Gardénia', ar: 'غاردينيا', rarity: 'precieuse', shape: 'round', petals: 7, layers: 3, c1: '#FFFFFF', c2: '#F2EDE1', heart: '#EFD9A2', noteFr: 'Un parfum qui reste longtemps.' },
  { id: 'grenadier', fr: 'Fleur de grenadier', ar: 'زهرة الرمان', rarity: 'precieuse', shape: 'bell', petals: 6, layers: 2, c1: '#F2553C', c2: '#C73A26', heart: '#F5C04A', noteFr: 'La grenade est citée dans le Coran parmi les fruits du Paradis.' },
  { id: 'camelia', fr: 'Camélia', ar: 'كاميليا', rarity: 'precieuse', shape: 'round', petals: 8, layers: 3, c1: '#E25F7E', c2: '#B9405E', heart: '#F4D35E', noteFr: 'Parfaite, pétale après pétale.' },

  { id: 'lotus-bleu', fr: 'Lotus bleu', ar: 'اللوتس الأزرق', rarity: 'legendaire', shape: 'lotus', petals: 10, layers: 3, c1: '#9FB6F5', c2: '#5D7CDB', heart: '#FFE27A', glow: true, noteFr: 'On ne la trouve qu\'au bout d\'une longue régularité.' },
  { id: 'rose-or', fr: 'Rose d\'or', ar: 'الوردة الذهبية', rarity: 'legendaire', shape: 'round', petals: 7, layers: 4, c1: '#FBE3A0', c2: '#D9A441', heart: '#A8761E', glow: true, noteFr: 'Elle brille comme la constance.' },
  { id: 'nur', fr: 'Fleur de lumière', ar: 'زهرة النور', rarity: 'legendaire', shape: 'star', petals: 12, layers: 3, c1: '#FFF4C9', c2: '#F2C66C', heart: '#FFFFFF', glow: true, noteFr: 'La plus rare de toutes. Elle récompense le cœur qui revient chaque jour.' },
];

export const todayKey = () => new Date().toISOString().split('T')[0];

/** Probabilités de rareté : la régularité fait glisser les chances vers les fleurs rares. */
export function rarityOdds(streak: number, memorized: number): Record<FlowerRarity, number> {
  const s = Math.min(streak, 40) * 0.6 + Math.min(memorized, 30) * 0.2;
  return { commune: 70 - s, rare: 22 + s * 0.55, precieuse: 7 + s * 0.35, legendaire: 1 + s * 0.1 };
}

const ORDER: FlowerRarity[] = ['commune', 'rare', 'precieuse', 'legendaire'];

/** Tire une fleur ; `min` impose une rareté minimale (bonus de mémorisation). */
export function rollFlower(d: UserData, min: FlowerRarity = 'commune', rand = Math.random): FlowerDef {
  const memorized = d.surahs.filter(s => s.status === 'memorized').length;
  const odds = rarityOdds(d.loginStreak ?? 1, memorized);
  const allowed = ORDER.slice(ORDER.indexOf(min));
  const total = allowed.reduce((a, r) => a + odds[r], 0);
  let x = rand() * total, rarity: FlowerRarity = allowed[0];
  for (const r of allowed) { if ((x -= odds[r]) <= 0) { rarity = r; break; } }
  const pool = FLOWERS.filter(f => f.rarity === rarity);
  const got = d.flowers?.got ?? {};
  const fresh = pool.filter(f => !got[f.id]);
  const list = fresh.length && rand() < 0.8 ? fresh : pool;
  return list[Math.floor(rand() * list.length)];
}

/** Ajoute une fleur à la collection. */
export function addFlower(d: UserData, f: FlowerDef, reason: 'jour' | 'sourate'): UserData {
  const prev = d.flowers ?? { got: {}, firstAt: {} };
  const day = todayKey();
  return {
    ...d,
    flowers: {
      got: { ...prev.got, [f.id]: (prev.got[f.id] ?? 0) + 1 },
      firstAt: prev.firstAt[f.id] ? prev.firstAt : { ...prev.firstAt, [f.id]: day },
      lastGift: reason === 'jour' ? day : prev.lastGift,
      history: [{ id: f.id, date: day, reason }, ...(prev.history ?? [])].slice(0, 60),
    },
  };
}

/** Fleurs encore dans le panier : reçues mais pas encore plantées. */
export function basket(d: UserData): { f: FlowerDef; n: number }[] {
  const got = d.flowers?.got ?? {};
  const planted = d.flowers?.planted ?? [];
  return FLOWERS.map(f => ({ f, n: (got[f.id] ?? 0) - planted.filter(p => p.id === f.id).length })).filter(x => x.n > 0);
}

/** Plante une fleur du panier à l'endroit touché. */
export function plantFlower(d: UserData, id: string, x: number, y: number): UserData {
  const prev = d.flowers ?? { got: {}, firstAt: {} };
  const p: PlantedFlower = { key: `${id}-${Date.now().toString(36)}`, id, x: Math.round(x), y: Math.round(y), at: todayKey() };
  return { ...d, flowers: { ...prev, planted: [...(prev.planted ?? []), p] } };
}

/** Retire une fleur du jardin : elle retourne dans le panier. */
export function unplantFlower(d: UserData, key: string): UserData {
  const prev = d.flowers ?? { got: {}, firstAt: {} };
  return { ...d, flowers: { ...prev, planted: (prev.planted ?? []).filter(p => p.key !== key) } };
}
