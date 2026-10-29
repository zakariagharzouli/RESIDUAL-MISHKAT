import type { UserData } from '../types';

// ── Matières : la rareté se lit à la matière de la médaille ──────────────────
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export const MATERIALS: Record<Rarity, { fr: string; ar: string; light: string; mid: string; dark: string; ink: string }> = {
  common:    { fr: 'Bronze', ar: 'برونزي', light: '#F0C39A', mid: '#B9763F', dark: '#7A4520', ink: '#FFF4E8' },
  rare:      { fr: 'Argent', ar: 'فضي',    light: '#FAFAFC', mid: '#B8BAC6', dark: '#6E7182', ink: '#FFFFFF' },
  epic:      { fr: 'Or',     ar: 'ذهبي',   light: '#FFE7A3', mid: '#D9A441', dark: '#8F6418', ink: '#FFF9E8' },
  legendary: { fr: 'Nûr',    ar: 'نور',    light: '#9FB0F5', mid: '#3D4FB0', dark: '#1B2466', ink: '#FFE7A3' },
};

// ── Catégories ───────────────────────────────────────────────────────────────
export type TrophyCategory = 'hifz' | 'surahs' | 'regularity' | 'ibada' | 'dhikr' | 'diftar' | 'goals' | 'coloring';

export const CATEGORIES: { id: TrophyCategory; fr: string; ar: string }[] = [
  { id: 'hifz',       fr: 'Mémorisation',     ar: 'الحفظ' },
  { id: 'surahs',     fr: 'Sourates',         ar: 'السور' },
  { id: 'regularity', fr: 'Régularité',       ar: 'المواظبة' },
  { id: 'ibada',      fr: 'Prière et jeûne',  ar: 'الصلاة والصيام' },
  { id: 'dhikr',      fr: 'Dhikr',            ar: 'الذكر' },
  { id: 'diftar',     fr: 'Diftar',           ar: 'الدفتر' },
  { id: 'goals',      fr: 'Objectifs',        ar: 'الأهداف' },
  { id: 'coloring',   fr: 'Coloriage',        ar: 'التلوين' },
];

// ── Mesures ──────────────────────────────────────────────────────────────────
const memorized   = (d: UserData) => d.surahs.filter(s => s.status === 'memorized');
const memCount    = (d: UserData) => memorized(d).length;
const versesMem   = (d: UserData) => memorized(d).reduce((a, s) => a + (s.verses || 0), 0);
const isMem       = (d: UserData, id: number) => d.surahs.find(s => s.id === id)?.status === 'memorized' ? 1 : 0;
const reviewCount = (d: UserData) => d.surahs.filter(s => s.status === 'review').length;
const colored     = (d: UserData) => d.surahs.filter(s => s.color).length;
const goalsDone   = (d: UserData) => d.goals.filter(g => g.completed).length;
const streak      = (d: UserData) => d.loginStreak ?? 0;
const cal         = (d: UserData) => d.calendar ?? [];
const fullPrayerDays = (d: UserData) => cal(d).filter(c => (c.prayers?.length ?? 0) >= 5);
const prayerTotal = (d: UserData) => cal(d).reduce((a, c) => a + (c.prayers?.length ?? 0), 0);
const fastDays    = (d: UserData) => cal(d).filter(c => c.fasting).length;
const readTotal   = (d: UserData) => cal(d).reduce((a, c) => a + (c.pagesRead || 0), 0);
const jbMonths    = (d: UserData) => Object.values(d.joursBlancs ?? {}).filter(m => m[13] && m[14] && m[15]).length;
const pageTypes   = (d: UserData) => new Set(d.diftarPages.map(p => p.type)).size;

/** Plus longue suite de jours consécutifs avec les cinq prières notées. */
const bestPrayerRun = (d: UserData) => {
  const days = fullPrayerDays(d).map(c => c.date).sort();
  let best = 0, run = 0, prev = 0;
  for (const day of days) {
    const t = Date.parse(day);
    run = prev && t - prev === 864e5 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
};

type Measure = (d: UserData) => number;

// id → [catégorie, mesure, objectif]
export const TROPHY_RULES: Record<string, [TrophyCategory, Measure, number]> = {
  first_surah:        ['hifz', memCount, 1],
  five_surahs:        ['hifz', memCount, 5],
  ten_surahs:         ['hifz', memCount, 10],
  twenty_surahs:      ['hifz', memCount, 20],
  thirty_surahs:      ['hifz', memCount, 30],
  fifty_surahs:       ['hifz', memCount, 50],
  seventy_surahs:     ['hifz', memCount, 70],
  hundred_surahs:     ['hifz', memCount, 100],
  full_hafiz:         ['hifz', memCount, 114],
  verses_100:         ['hifz', versesMem, 100],
  verses_500:         ['hifz', versesMem, 500],
  verses_1000:        ['hifz', versesMem, 1000],
  verses_3000:        ['hifz', versesMem, 3000],
  first_revision:     ['hifz', reviewCount, 1],
  five_revision:      ['hifz', reviewCount, 5],

  juz_amma:           ['surahs', d => d.surahs.filter(s => s.id >= 78 && s.status === 'memorized').length, 37],
  juz_tabarak:        ['surahs', d => d.surahs.filter(s => s.id >= 67 && s.id <= 77 && s.status === 'memorized').length, 11],
  surah_fatiha:       ['surahs', d => isMem(d, 1), 1],
  surah_ikhlas:       ['surahs', d => isMem(d, 112), 1],
  muawwidhatayn:      ['surahs', d => isMem(d, 113) + isMem(d, 114), 2],
  surah_mulk:         ['surahs', d => isMem(d, 67), 1],
  surah_kahf:         ['surahs', d => isMem(d, 18), 1],
  surah_yaseen:       ['surahs', d => isMem(d, 36), 1],
  surah_rahman:       ['surahs', d => isMem(d, 55), 1],
  surah_baqara:       ['surahs', d => isMem(d, 2), 1],

  streak_3:           ['regularity', streak, 3],
  streak_7:           ['regularity', streak, 7],
  streak_14:          ['regularity', streak, 14],
  streak_30:          ['regularity', streak, 30],
  streak_60:          ['regularity', streak, 60],
  streak_100:         ['regularity', streak, 100],
  streak_365:         ['regularity', streak, 365],
  first_calendar:     ['regularity', d => cal(d).length, 1],
  week_calendar:      ['regularity', d => cal(d).length, 7],
  month_calendar:     ['regularity', d => cal(d).length, 30],
  reading_100:        ['regularity', readTotal, 100],
  reading_1000:       ['regularity', readTotal, 1000],

  prayers_full_day:   ['ibada', d => Math.min(1, fullPrayerDays(d).length), 1],
  prayers_full_week:  ['ibada', bestPrayerRun, 7],
  prayers_500:        ['ibada', prayerTotal, 500],
  fast_first:         ['ibada', fastDays, 1],
  fast_10:            ['ibada', fastDays, 10],
  jours_blancs_1:     ['ibada', jbMonths, 1],
  jours_blancs_3:     ['ibada', jbMonths, 3],

  tasbih_33:          ['dhikr', d => d.tasbihSessionBest ?? 0, 33],
  tasbih_100:         ['dhikr', d => d.tasbihSessionBest ?? 0, 100],
  tasbih_1000_total:  ['dhikr', d => d.tasbihCount ?? 0, 1000],
  tasbih_5000_total:  ['dhikr', d => d.tasbihCount ?? 0, 5000],
  tasbih_10000_total: ['dhikr', d => d.tasbihCount ?? 0, 10000],

  first_note:         ['diftar', d => d.diftarPages.length, 1],
  five_notes:         ['diftar', d => d.diftarPages.length, 5],
  ten_notes:          ['diftar', d => d.diftarPages.length, 10],
  tajweed_page:       ['diftar', d => d.diftarPages.some(p => p.type === 'tajweed') ? 1 : 0, 1],
  all_templates:      ['diftar', pageTypes, 10],

  first_goal:         ['goals', goalsDone, 1],
  five_goals:         ['goals', goalsDone, 5],
  ten_goals:          ['goals', goalsDone, 10],
  twenty_goals:       ['goals', goalsDone, 20],

  first_color:        ['coloring', colored, 1],
  artist:             ['coloring', colored, 30],
  color_master:       ['coloring', colored, 60],
  full_colorist:      ['coloring', colored, 114],
};

/** [valeur actuelle plafonnée, objectif] pour un trophée, ou null s'il est inconnu. */
export function trophyProgress(d: UserData, id: string): [number, number] | null {
  const rule = TROPHY_RULES[id];
  if (!rule) return null;
  let cur = 0;
  try { cur = rule[1](d); } catch { cur = 0; }
  return [Math.min(cur, rule[2]), rule[2]];
}

/** Condition de déblocage dérivée de la même règle que la progression. */
export const reached = (id: string) => (d: UserData) => {
  const p = trophyProgress(d, id);
  return !!p && p[0] >= p[1];
};

export const trophyCategory = (id: string): TrophyCategory => TROPHY_RULES[id]?.[0] ?? 'hifz';
