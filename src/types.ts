import { reached, MATERIALS, Rarity } from './lib/trophies';
export interface Surah {
  id: number;
  name: string;
  arabicName: string;
  verses: number;
  difficulty: number;
  status: 'not_started' | 'in_progress' | 'review' | 'memorized';
  color?: string;
  juz?: number;
}

export interface Stroke {
  points: { x: number; y: number; p?: number }[];
  color: string;
  width: number;
  type: 'pen' | 'fountain-pen' | 'highlighter' | 'chalk' | 'eraser' | 'ruler' | 'spray' | 'marker' | 'neon' | 'pencil' | 'watercolor' | 'calligraphy' | 'dotted' | 'brush';
  timestamp: number;
}

export interface Shape {
  id: string;
  type: 'circle' | 'square' | 'triangle' | 'line' | 'arrow' | 'rectangle' | 'diamond' | 'hexagon' | 'pentagon' | 'star' | 'heart' | 'crescent'
      | 'ellipse' | 'cross' | 'octagon' | 'trapezoid' | 'cloud' | 'lightning' | 'sun' | 'speech_bubble' | 'double_arrow' | 'bracket'
      | 'star6' | 'semicircle' | 'curved_arrow'
      | 'emoji';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  rotation?: number;
  emoji?: string;
}

export interface DiftarPage {
  id: string;
  title: string;
  type: 'revision' | 'tafsir' | 'dates' | 'objectives' | 'custom'
      | 'vocab' | 'dua' | 'notes' | 'schema' | 'tajweed';
  strokes: Stroke[];
  shapes?: Shape[];
  height?: number;
  paperStyle?: 'blank' | 'lines' | 'grid' | 'dots' | 'arabesque' | 'diamond' | 'hexagonal' | 'music'
             | 'floral' | 'islamic_star' | 'waves' | 'leaves' | 'crosses' | 'triangles';
  paperColor?: string;
  sections?: { id: string; title: string; y: number }[];
  lastSaved: number;
}

export interface UserSettings {
  theme: 'gold' | 'sakura' | 'azur' | 'emerald'
       | 'light' | 'dark' | 'sepia' | 'safran' | 'lilas' | 'ocean'
       | 'rose' | 'menthe' | 'ardoise' | 'aurore' | 'prune' | 'corail';
  notifications: boolean;
  dailyReminder: string;
  fontSize: 'small' | 'medium' | 'large';
  showArabicNames: boolean;
  username: string;
  avatar?: string;
  isAdmin?: boolean;
  // Accessibility
  reduceAnimations?: boolean;
  dyslexiaFont?: boolean;
  lineSpacing?: 'normal' | 'comfortable' | 'large';
  buttonSize?: 'compact' | 'normal' | 'large';
  highContrast?: boolean;
  staticBackground?: boolean;
  autoSaveInterval?: 30 | 60 | 300 | 0;
  soundEffects?: boolean;
  uiZoom?: 80 | 100 | 120;
  showSurahNumbers?: boolean;
  confirmDelete?: boolean;
  textDirection?: 'auto' | 'ltr' | 'rtl';
  colorBlindMode?: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
  city?: string;
  settingsVersion?: number;
  darkMode?: boolean;
  // Quran reading preferences
  quranFontSize?: number;
  quranDefaultView?: 'list' | 'authentic';
  quranVerseGlow?: boolean;
  showSplashOnLogin?: boolean;
}

export interface Goal {
  id: string;
  text: string;
  completed: boolean;
  month: number;
}

export interface Badge {
  id: string;
  icon: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: number;
  condition: (userData: UserData) => boolean;
}

export interface UserData {
  surahs: Surah[];
  diftarPages: DiftarPage[];
  goals: Goal[];
  badges: Badge[];
  calendar: { date: string; prayers: string[]; fasting: boolean; pagesRead: number }[];
  tasbihCount: number;
  tasbihSessionBest: number;
  onboarded: boolean;
  settings: UserSettings;
  lastLoginDate?: string;
  loginStreak: number;
  joursBlancs?: Record<string, { 13: boolean; 14: boolean; 15: boolean }>;
}

// ═══════════════════════════════════════════════════════════════
// DÉFINITIONS DES BADGES AVEC CONDITIONS
// ═══════════════════════════════════════════════════════════════

export const BADGE_DEFINITIONS: Omit<Badge, 'unlockedAt'>[] = [
  {
    id: 'first_surah',
    icon: 'Star',
    title: 'Première Sourate',
    titleAr: 'أول سورة',
    description: 'Mémorisez votre première sourate',
    descriptionAr: 'احفظ سورتك الأولى',
    color: 'text-yellow-500',
    rarity: 'common',
    condition: (data) => data.surahs.filter(s => s.status === 'memorized').length >= 1
  },
  {
    id: 'five_surahs',
    icon: 'Award',
    title: 'Cinq Sourates',
    titleAr: 'خمس سور',
    description: 'Mémorisez 5 sourates',
    descriptionAr: 'احفظ 5 سور',
    color: 'text-blue-500',
    rarity: 'common',
    condition: (data) => data.surahs.filter(s => s.status === 'memorized').length >= 5
  },
  {
    id: 'ten_surahs',
    icon: 'Trophy',
    title: 'Dizaine Complète',
    titleAr: 'عشر سور',
    description: 'Mémorisez 10 sourates',
    descriptionAr: 'احفظ 10 سور',
    color: 'text-purple-500',
    rarity: 'common',
    condition: (data) => data.surahs.filter(s => s.status === 'memorized').length >= 10
  },
  {
    id: 'twenty_surahs',
    icon: 'Medal',
    title: 'Vingt Sourates',
    titleAr: 'عشرون سورة',
    description: 'Mémorisez 20 sourates',
    descriptionAr: 'احفظ 20 سورة',
    color: 'text-indigo-500',
    rarity: 'rare',
    condition: (data) => data.surahs.filter(s => s.status === 'memorized').length >= 20
  },
  {
    id: 'fifty_surahs',
    icon: 'Crown',
    title: 'Half Hafiz',
    titleAr: 'نصف الحافظ',
    description: 'Mémorisez 50 sourates',
    descriptionAr: 'احفظ 50 سورة',
    color: 'text-amber-600',
    rarity: 'epic',
    condition: (data) => data.surahs.filter(s => s.status === 'memorized').length >= 50
  },
  {
    id: 'hundred_surahs',
    icon: 'Gem',
    title: 'Cent Sourates',
    titleAr: 'مائة سورة',
    description: 'Mémorisez 100 sourates',
    descriptionAr: 'احفظ 100 سورة',
    color: 'text-emerald-600',
    rarity: 'legendary',
    condition: (data) => data.surahs.filter(s => s.status === 'memorized').length >= 100
  },
  {
    id: 'full_hafiz',
    icon: 'Crown',
    title: 'Hafiz Complet',
    titleAr: 'حافظ كامل',
    description: 'Mémorisez les 114 sourates du Coran',
    descriptionAr: 'احفظ القرآن كاملاً - 114 سورة',
    color: 'text-yellow-600',
    rarity: 'legendary',
    condition: (data) => data.surahs.filter(s => s.status === 'memorized').length >= 114
  },
  {
    id: 'juz_amma',
    icon: 'BookOpen',
    title: 'Juz Amma',
    titleAr: 'جزء عم',
    description: 'Complétez tout le Juz Amma (sourates 78-114)',
    descriptionAr: 'أكمل جزء عم بالكامل',
    color: 'text-green-500',
    rarity: 'rare',
    condition: (data) => {
      const juzAmma = data.surahs.filter(s => s.id >= 78 && s.id <= 114);
      return juzAmma.length > 0 && juzAmma.every(s => s.status === 'memorized');
    }
  },
  {
    id: 'juz_tabarak',
    icon: 'Bookmark',
    title: 'Juz Tabarak',
    titleAr: 'جزء تبارك',
    description: 'Complétez le Juz Tabarak (sourates 67-77)',
    descriptionAr: 'أكمل جزء تبارك',
    color: 'text-teal-500',
    rarity: 'rare',
    condition: (data) => {
      const juzTabarak = data.surahs.filter(s => s.id >= 67 && s.id <= 77);
      return juzTabarak.length > 0 && juzTabarak.every(s => s.status === 'memorized');
    }
  },
  {
    id: 'first_goal',
    icon: 'Target',
    title: 'Premier Objectif',
    titleAr: 'أول هدف',
    description: 'Complétez votre premier objectif',
    descriptionAr: 'أكمل هدفك الأول',
    color: 'text-red-500',
    rarity: 'common',
    condition: (data) => data.goals.filter(g => g.completed).length >= 1
  },
  {
    id: 'five_goals',
    icon: 'Flag',
    title: 'Planificateur',
    titleAr: 'المخطط',
    description: 'Complétez 5 objectifs',
    descriptionAr: 'أكمل 5 أهداف',
    color: 'text-orange-500',
    rarity: 'common',
    condition: (data) => data.goals.filter(g => g.completed).length >= 5
  },
  {
    id: 'ten_goals',
    icon: 'ClipboardCheck',
    title: 'Objectifs Maître',
    titleAr: 'سيد الأهداف',
    description: 'Complétez 10 objectifs',
    descriptionAr: 'أكمل 10 أهداف',
    color: 'text-pink-500',
    rarity: 'rare',
    condition: (data) => data.goals.filter(g => g.completed).length >= 10
  },
  {
    id: 'streak_3',
    icon: 'Flame',
    title: '3 Jours de Foi',
    titleAr: '3 أيام إيمان',
    description: 'Connectez-vous 3 jours consécutifs',
    descriptionAr: 'سجل دخولك 3 أيام متتالية',
    color: 'text-orange-600',
    rarity: 'common',
    condition: (data) => (data.loginStreak ?? 0) >= 3
  },
  {
    id: 'streak_7',
    icon: 'Zap',
    title: 'Semaine de Foi',
    titleAr: 'أسبوع إيمان',
    description: 'Connectez-vous 7 jours consécutifs',
    descriptionAr: 'سجل دخولك لمدة أسبوع',
    color: 'text-yellow-500',
    rarity: 'rare',
    condition: (data) => (data.loginStreak ?? 0) >= 7
  },
  {
    id: 'streak_30',
    icon: 'Moon',
    title: 'Mois de Dévotion',
    titleAr: 'شهر تفانٍ',
    description: 'Connectez-vous 30 jours consécutifs',
    descriptionAr: 'سجل دخولك لمدة شهر',
    color: 'text-purple-600',
    rarity: 'epic',
    condition: (data) => (data.loginStreak ?? 0) >= 30
  },
  {
    id: 'tasbih_33',
    icon: 'Heart',
    title: 'Tasbih Débutant',
    titleAr: 'مبتدئ التسبيح',
    description: 'Faites 33 tasbih en une session',
    descriptionAr: 'أكمل 33 تسبيحة في جلسة',
    color: 'text-rose-400',
    rarity: 'common',
    condition: (data) => (data.tasbihSessionBest ?? 0) >= 33
  },
  {
    id: 'tasbih_100',
    icon: 'Sparkles',
    title: 'Dhikr Master',
    titleAr: 'سيد الذكر',
    description: 'Faites 100 tasbih en une session',
    descriptionAr: 'أكمل 100 تسبيحة في جلسة',
    color: 'text-rose-500',
    rarity: 'rare',
    condition: (data) => (data.tasbihSessionBest ?? 0) >= 100
  },
  {
    id: 'tasbih_1000_total',
    icon: 'Star',
    title: 'Mille Dhikr',
    titleAr: 'ألف ذكر',
    description: 'Faites 1000 tasbih au total',
    descriptionAr: 'أكمل 1000 تسبيحة إجمالاً',
    color: 'text-rose-600',
    rarity: 'epic',
    condition: (data) => (data.tasbihCount ?? 0) >= 1000
  },
  {
    id: 'first_note',
    icon: 'NotebookPen',
    title: 'Première Note',
    titleAr: 'أول ملاحظة',
    description: 'Créez votre première page dans le Diftar',
    descriptionAr: 'أنشئ صفحتك الأولى في الدفتر',
    color: 'text-blue-400',
    rarity: 'common',
    condition: (data) => data.diftarPages.length >= 1
  },
  {
    id: 'five_notes',
    icon: 'BookText',
    title: 'Écrivain',
    titleAr: 'كاتب',
    description: 'Créez 5 pages dans le Diftar',
    descriptionAr: 'أنشئ 5 صفحات في الدفتر',
    color: 'text-blue-500',
    rarity: 'common',
    condition: (data) => data.diftarPages.length >= 5
  },
  {
    id: 'artist',
    icon: 'Palette',
    title: 'Artiste du Coran',
    titleAr: 'فنان القرآن',
    description: 'Coloriez 30 sourates dans la grille',
    descriptionAr: 'لوّن 30 سورة في الشبكة',
    color: 'text-pink-400',
    rarity: 'rare',
    condition: (data) => data.surahs.filter(s => s.color).length >= 30
  },
  {
    id: 'color_master',
    icon: 'Paintbrush',
    title: 'Maître de la Couleur',
    titleAr: 'سيد الألوان',
    description: 'Coloriez 60 sourates dans la grille',
    descriptionAr: 'لوّن 60 سورة في الشبكة',
    color: 'text-pink-500',
    rarity: 'epic',
    condition: (data) => data.surahs.filter(s => s.color).length >= 60
  },
  {
    id: 'first_calendar',
    icon: 'Calendar',
    title: 'Premier Jour',
    titleAr: 'أول يوم',
    description: 'Marquez votre premier jour dans le calendrier',
    descriptionAr: 'سجل يومك الأول في التقويم',
    color: 'text-cyan-500',
    rarity: 'common',
    condition: (data) => data.calendar.length >= 1
  },
  {
    id: 'week_calendar',
    icon: 'CalendarDays',
    title: 'Semaine Complète',
    titleAr: 'أسبوع كامل',
    description: 'Marquez 7 jours dans le calendrier',
    descriptionAr: 'سجل 7 أيام في التقويم',
    color: 'text-cyan-600',
    rarity: 'common',
    condition: (data) => data.calendar.length >= 7
  },

  // ── Jalons supplémentaires de mémorisation ───────────────────
  {
    id: 'thirty_surahs',
    icon: 'BookOpen',
    title: 'Trentaine',
    titleAr: 'ثلاثون سورة',
    description: 'Mémorisez 30 sourates',
    descriptionAr: 'احفظ 30 سورة',
    color: 'text-violet-500',
    rarity: 'rare',
    condition: (data) => data.surahs.filter(s => s.status === 'memorized').length >= 30
  },
  {
    id: 'seventy_surahs',
    icon: 'Trophy',
    title: 'Soixante-Dix',
    titleAr: 'سبعون سورة',
    description: 'Mémorisez 70 sourates',
    descriptionAr: 'احفظ 70 سورة',
    color: 'text-blue-600',
    rarity: 'epic',
    condition: (data) => data.surahs.filter(s => s.status === 'memorized').length >= 70
  },

  // ── Sourates emblématiques ────────────────────────────────────
  {
    id: 'surah_fatiha',
    icon: 'Star',
    title: 'La Lumière',
    titleAr: 'الفاتحة',
    description: "Mémorisez Al-Fatihah, l'ouverture du Coran",
    descriptionAr: 'احفظ سورة الفاتحة فاتحة الكتاب',
    color: 'text-yellow-400',
    rarity: 'common',
    condition: (data) => data.surahs.find(s => s.id === 1)?.status === 'memorized'
  },
  {
    id: 'surah_yaseen',
    icon: 'Heart',
    title: 'Cœur du Coran',
    titleAr: 'قلب القرآن',
    description: 'Mémorisez Ya-Sin, le cœur du Coran',
    descriptionAr: 'احفظ سورة يس قلب القرآن',
    color: 'text-rose-500',
    rarity: 'epic',
    condition: (data) => data.surahs.find(s => s.id === 36)?.status === 'memorized'
  },
  {
    id: 'surah_kahf',
    icon: 'Gem',
    title: 'Lumière du Vendredi',
    titleAr: 'نور الجمعة',
    description: 'Mémorisez Al-Kahf, lumière du vendredi',
    descriptionAr: 'احفظ سورة الكهف نور الجمعة',
    color: 'text-emerald-500',
    rarity: 'epic',
    condition: (data) => data.surahs.find(s => s.id === 18)?.status === 'memorized'
  },
  {
    id: 'surah_mulk',
    icon: 'Moon',
    title: 'La Protectrice',
    titleAr: 'المنجية',
    description: 'Mémorisez Al-Mulk, la sourate protectrice',
    descriptionAr: 'احفظ سورة الملك المنجية',
    color: 'text-indigo-400',
    rarity: 'rare',
    condition: (data) => data.surahs.find(s => s.id === 67)?.status === 'memorized'
  },
  {
    id: 'surah_rahman',
    icon: 'Sparkles',
    title: 'La Miséricorde',
    titleAr: 'الرحمن',
    description: 'Mémorisez Ar-Rahman, la beauté du Coran',
    descriptionAr: 'احفظ سورة الرحمن عروس القرآن',
    color: 'text-pink-400',
    rarity: 'rare',
    condition: (data) => data.surahs.find(s => s.id === 55)?.status === 'memorized'
  },

  // ── Streaks supplémentaires ───────────────────────────────────
  {
    id: 'streak_14',
    icon: 'Zap',
    title: 'Deux Semaines',
    titleAr: 'أسبوعان',
    description: 'Connectez-vous 14 jours consécutifs',
    descriptionAr: 'سجل دخولك 14 يوماً متتالياً',
    color: 'text-amber-500',
    rarity: 'rare',
    condition: (data) => (data.loginStreak ?? 0) >= 14
  },
  {
    id: 'streak_60',
    icon: 'Flame',
    title: 'Deux Mois de Foi',
    titleAr: 'شهران من الإيمان',
    description: 'Connectez-vous 60 jours consécutifs',
    descriptionAr: 'سجل دخولك 60 يوماً متتالياً',
    color: 'text-orange-600',
    rarity: 'epic',
    condition: (data) => (data.loginStreak ?? 0) >= 60
  },

  // ── Tasbih supplémentaires ────────────────────────────────────
  {
    id: 'tasbih_5000_total',
    icon: 'Sparkles',
    title: 'Cinq Mille Dhikr',
    titleAr: 'خمسة آلاف ذكر',
    description: 'Faites 5 000 tasbih au total',
    descriptionAr: 'أكمل 5000 تسبيحة إجمالاً',
    color: 'text-rose-600',
    rarity: 'epic',
    condition: (data) => (data.tasbihCount ?? 0) >= 5000
  },

  // ── Diftar supplémentaire ─────────────────────────────────────
  {
    id: 'ten_notes',
    icon: 'NotebookPen',
    title: 'Bibliothèque',
    titleAr: 'المكتبة',
    description: 'Créez 10 pages dans le Diftar',
    descriptionAr: 'أنشئ 10 صفحات في الدفتر',
    color: 'text-blue-600',
    rarity: 'rare',
    condition: (data) => data.diftarPages.length >= 10
  },

  // ── Coloriage supplémentaire ──────────────────────────────────
  {
    id: 'first_color',
    icon: 'Palette',
    title: 'Premier Coloriste',
    titleAr: 'أول ملوِّن',
    description: 'Coloriez votre première sourate',
    descriptionAr: 'لوّن سورتك الأولى',
    color: 'text-pink-300',
    rarity: 'common',
    condition: (data) => data.surahs.filter(s => s.color).length >= 1
  },
  {
    id: 'full_colorist',
    icon: 'Crown',
    title: 'Cœur Complet',
    titleAr: 'القلب الكامل',
    description: 'Coloriez les 114 sourates du Coran',
    descriptionAr: 'لوّن كل سور القرآن الكريم',
    color: 'text-rose-600',
    rarity: 'legendary',
    condition: (data) => data.surahs.filter(s => s.color).length >= 114
  },

  // ── Calendrier supplémentaire ─────────────────────────────────
  {
    id: 'month_calendar',
    icon: 'CalendarDays',
    title: 'Un Mois Complet',
    titleAr: 'شهر كامل',
    description: 'Marquez 30 jours dans le calendrier',
    descriptionAr: 'سجل 30 يوماً في التقويم',
    color: 'text-cyan-700',
    rarity: 'rare',
    condition: (data) => data.calendar.length >= 30
  },

  // ── Révision ──────────────────────────────────────────────────
  {
    id: 'first_revision',
    icon: 'RotateCcw',
    title: 'Révision Active',
    titleAr: 'مراجعة نشطة',
    description: 'Mettez une sourate en révision',
    descriptionAr: 'ضع سورة في خانة المراجعة',
    color: 'text-teal-400',
    rarity: 'common',
    condition: (data) => data.surahs.filter(s => s.status === 'review').length >= 1
  },
  {
    id: 'five_revision',
    icon: 'TrendingUp',
    title: 'Réviseur Assidu',
    titleAr: 'المراجع المجتهد',
    description: 'Maintenez 5 sourates en révision',
    descriptionAr: 'راجع 5 سور في آن واحد',
    color: 'text-teal-600',
    rarity: 'rare',
    condition: (data) => data.surahs.filter(s => s.status === 'review').length >= 5
  },

  // ── Trophées ajoutés avec la refonte (progression : lib/trophies.ts) ──
  { id: 'verses_100', icon: 'BookOpen', title: 'Cent versets', titleAr: 'مئة آية', description: 'Mémorisez 100 versets au total', descriptionAr: 'احفظ 100 آية', color: '', rarity: 'common', condition: reached('verses_100') },
  { id: 'verses_500', icon: 'BookOpen', title: 'Cinq cents versets', titleAr: 'خمسمئة آية', description: 'Mémorisez 500 versets au total', descriptionAr: 'احفظ 500 آية', color: '', rarity: 'rare', condition: reached('verses_500') },
  { id: 'verses_1000', icon: 'BookOpen', title: 'Mille versets', titleAr: 'ألف آية', description: 'Mémorisez 1 000 versets au total', descriptionAr: 'احفظ 1000 آية', color: '', rarity: 'epic', condition: reached('verses_1000') },
  { id: 'verses_3000', icon: 'Crown', title: 'Trois mille versets', titleAr: 'ثلاثة آلاف آية', description: 'Mémorisez 3 000 versets, près de la moitié du Coran', descriptionAr: 'احفظ 3000 آية، قرابة نصف القرآن', color: '', rarity: 'legendary', condition: reached('verses_3000') },
  { id: 'surah_ikhlas', icon: 'Heart', title: 'Le tiers du Coran', titleAr: 'ثلث القرآن', description: 'Mémorisez Al-Ikhlâs, qui équivaut au tiers du Coran', descriptionAr: 'احفظ سورة الإخلاص، تعدل ثلث القرآن', color: '', rarity: 'common', condition: reached('surah_ikhlas') },
  { id: 'muawwidhatayn', icon: 'Shield', title: 'Les deux protectrices', titleAr: 'المعوذتان', description: 'Mémorisez Al-Falaq et An-Nâs', descriptionAr: 'احفظ سورتي الفلق والناس', color: '', rarity: 'common', condition: reached('muawwidhatayn') },
  { id: 'surah_baqara', icon: 'Crown', title: 'La plus longue', titleAr: 'سورة البقرة', description: 'Mémorisez Al-Baqarah, la plus longue sourate du Coran', descriptionAr: 'احفظ سورة البقرة، أطول سور القرآن', color: '', rarity: 'legendary', condition: reached('surah_baqara') },
  { id: 'streak_100', icon: 'Flame', title: 'Cent jours', titleAr: 'مئة يوم', description: '100 jours de suite avec Mishkat', descriptionAr: '100 يوم متتالية', color: '', rarity: 'epic', condition: reached('streak_100') },
  { id: 'streak_365', icon: 'Flame', title: 'Une année de lumière', titleAr: 'سنة من النور', description: '365 jours de suite avec Mishkat', descriptionAr: '365 يوماً متتالية', color: '', rarity: 'legendary', condition: reached('streak_365') },
  { id: 'reading_100', icon: 'BookOpen', title: 'Lecteur assidu', titleAr: 'القارئ المواظب', description: 'Notez 100 versets lus dans le calendrier', descriptionAr: 'سجّل قراءة 100 آية في التقويم', color: '', rarity: 'common', condition: reached('reading_100') },
  { id: 'reading_1000', icon: 'BookOpen', title: 'Mille versets lus', titleAr: 'ألف آية مقروءة', description: 'Notez 1 000 versets lus dans le calendrier', descriptionAr: 'سجّل قراءة 1000 آية في التقويم', color: '', rarity: 'rare', condition: reached('reading_1000') },
  { id: 'prayers_full_day', icon: 'Moon', title: 'Cinq sur cinq', titleAr: 'الصلوات الخمس', description: 'Notez les cinq prières d\'une même journée', descriptionAr: 'سجّل الصلوات الخمس في يوم واحد', color: '', rarity: 'common', condition: reached('prayers_full_day') },
  { id: 'prayers_full_week', icon: 'CalendarDays', title: 'Une semaine de prières', titleAr: 'أسبوع من الصلوات', description: 'Les cinq prières notées 7 jours de suite', descriptionAr: 'الصلوات الخمس 7 أيام متتالية', color: '', rarity: 'rare', condition: reached('prayers_full_week') },
  { id: 'prayers_500', icon: 'Moon', title: 'Cinq cents prières', titleAr: 'خمسمئة صلاة', description: 'Notez 500 prières dans le calendrier', descriptionAr: 'سجّل 500 صلاة في التقويم', color: '', rarity: 'epic', condition: reached('prayers_500') },
  { id: 'fast_first', icon: 'MoonStar', title: 'Premier jeûne', titleAr: 'أول صيام', description: 'Notez un jour de jeûne', descriptionAr: 'سجّل يوم صيام', color: '', rarity: 'common', condition: reached('fast_first') },
  { id: 'fast_10', icon: 'MoonStar', title: 'Dix jeûnes', titleAr: 'عشرة أيام صيام', description: 'Notez 10 jours de jeûne', descriptionAr: 'سجّل 10 أيام صيام', color: '', rarity: 'rare', condition: reached('fast_10') },
  { id: 'jours_blancs_1', icon: 'MoonStar', title: 'Les jours blancs', titleAr: 'الأيام البيض', description: 'Jeûnez les 13, 14 et 15 d\'un mois lunaire', descriptionAr: 'صم أيام 13 و14 و15 من شهر قمري', color: '', rarity: 'rare', condition: reached('jours_blancs_1') },
  { id: 'jours_blancs_3', icon: 'MoonStar', title: 'Trois lunes', titleAr: 'ثلاثة أقمار', description: 'Jours blancs complets pendant trois mois', descriptionAr: 'الأيام البيض كاملة ثلاثة أشهر', color: '', rarity: 'epic', condition: reached('jours_blancs_3') },
  { id: 'tasbih_10000_total', icon: 'Sparkles', title: 'Dix mille dhikr', titleAr: 'عشرة آلاف ذكر', description: '10 000 dhikr au total', descriptionAr: '10000 ذكر إجمالاً', color: '', rarity: 'legendary', condition: reached('tasbih_10000_total') },
  { id: 'tajweed_page', icon: 'NotebookPen', title: 'Premier pas en tajweed', titleAr: 'أول خطوة في التجويد', description: 'Créez une page Tajweed dans le Diftar', descriptionAr: 'أنشئ صفحة تجويد في الدفتر', color: '', rarity: 'common', condition: reached('tajweed_page') },
  { id: 'all_templates', icon: 'NotebookPen', title: 'Cahier complet', titleAr: 'الدفتر الكامل', description: 'Utilisez les dix modèles de page du Diftar', descriptionAr: 'استخدم نماذج الدفتر العشرة', color: '', rarity: 'epic', condition: reached('all_templates') },
  { id: 'twenty_goals', icon: 'Target', title: 'Bâtisseur', titleAr: 'البنّاء', description: 'Accomplissez 20 objectifs', descriptionAr: 'أنجز 20 هدفاً', color: '', rarity: 'epic', condition: reached('twenty_goals') },
];

// ═══════════════════════════════════════════════════════════════
// TOUTES LES 114 SOURATES DU CORAN — NOMS COMPLETS
// ═══════════════════════════════════════════════════════════════
export const SURAH_DATA: Omit<Surah, 'status' | 'color'>[] = [
  { id: 1,   name: "Al-Fatihah",      arabicName: "الفاتحة",    verses: 7,   difficulty: 1, juz: 1  },
  { id: 2,   name: "Al-Baqarah",      arabicName: "البقرة",     verses: 286, difficulty: 5, juz: 1  },
  { id: 3,   name: "Al-Imran",        arabicName: "آل عمران",   verses: 200, difficulty: 5, juz: 3  },
  { id: 4,   name: "An-Nisa",         arabicName: "النساء",     verses: 176, difficulty: 5, juz: 4  },
  { id: 5,   name: "Al-Maidah",       arabicName: "المائدة",    verses: 120, difficulty: 4, juz: 6  },
  { id: 6,   name: "Al-Anam",         arabicName: "الأنعام",    verses: 165, difficulty: 4, juz: 7  },
  { id: 7,   name: "Al-Araf",         arabicName: "الأعراف",    verses: 206, difficulty: 5, juz: 8  },
  { id: 8,   name: "Al-Anfal",        arabicName: "الأنفال",    verses: 75,  difficulty: 3, juz: 9  },
  { id: 9,   name: "At-Tawbah",       arabicName: "التوبة",     verses: 129, difficulty: 4, juz: 10 },
  { id: 10,  name: "Yunus",           arabicName: "يونس",       verses: 109, difficulty: 3, juz: 11 },
  { id: 11,  name: "Hud",             arabicName: "هود",        verses: 123, difficulty: 3, juz: 11 },
  { id: 12,  name: "Yusuf",           arabicName: "يوسف",       verses: 111, difficulty: 3, juz: 12 },
  { id: 13,  name: "Ar-Rad",          arabicName: "الرعد",      verses: 43,  difficulty: 3, juz: 13 },
  { id: 14,  name: "Ibrahim",         arabicName: "إبراهيم",    verses: 52,  difficulty: 3, juz: 13 },
  { id: 15,  name: "Al-Hijr",         arabicName: "الحجر",      verses: 99,  difficulty: 3, juz: 14 },
  { id: 16,  name: "An-Nahl",         arabicName: "النحل",      verses: 128, difficulty: 4, juz: 14 },
  { id: 17,  name: "Al-Isra",         arabicName: "الإسراء",    verses: 111, difficulty: 3, juz: 15 },
  { id: 18,  name: "Al-Kahf",         arabicName: "الكهف",      verses: 110, difficulty: 3, juz: 15 },
  { id: 19,  name: "Maryam",          arabicName: "مريم",       verses: 98,  difficulty: 3, juz: 16 },
  { id: 20,  name: "Ta-Ha",           arabicName: "طه",         verses: 135, difficulty: 3, juz: 16 },
  { id: 21,  name: "Al-Anbiya",       arabicName: "الأنبياء",   verses: 112, difficulty: 3, juz: 17 },
  { id: 22,  name: "Al-Hajj",         arabicName: "الحج",       verses: 78,  difficulty: 3, juz: 17 },
  { id: 23,  name: "Al-Muminun",      arabicName: "المؤمنون",   verses: 118, difficulty: 3, juz: 18 },
  { id: 24,  name: "An-Nur",          arabicName: "النور",      verses: 64,  difficulty: 3, juz: 18 },
  { id: 25,  name: "Al-Furqan",       arabicName: "الفرقان",    verses: 77,  difficulty: 3, juz: 18 },
  { id: 26,  name: "Ash-Shuara",      arabicName: "الشعراء",    verses: 227, difficulty: 4, juz: 19 },
  { id: 27,  name: "An-Naml",         arabicName: "النمل",      verses: 93,  difficulty: 3, juz: 19 },
  { id: 28,  name: "Al-Qasas",        arabicName: "القصص",      verses: 88,  difficulty: 3, juz: 20 },
  { id: 29,  name: "Al-Ankabut",      arabicName: "العنكبوت",   verses: 69,  difficulty: 3, juz: 20 },
  { id: 30,  name: "Ar-Rum",          arabicName: "الروم",      verses: 60,  difficulty: 3, juz: 21 },
  { id: 31,  name: "Luqman",          arabicName: "لقمان",      verses: 34,  difficulty: 2, juz: 21 },
  { id: 32,  name: "As-Sajdah",       arabicName: "السجدة",     verses: 30,  difficulty: 2, juz: 21 },
  { id: 33,  name: "Al-Ahzab",        arabicName: "الأحزاب",    verses: 73,  difficulty: 3, juz: 21 },
  { id: 34,  name: "Saba",            arabicName: "سبأ",        verses: 54,  difficulty: 3, juz: 22 },
  { id: 35,  name: "Fatir",           arabicName: "فاطر",       verses: 45,  difficulty: 3, juz: 22 },
  { id: 36,  name: "Ya-Sin",          arabicName: "يس",         verses: 83,  difficulty: 2, juz: 22 },
  { id: 37,  name: "As-Saffat",       arabicName: "الصافات",    verses: 182, difficulty: 4, juz: 23 },
  { id: 38,  name: "Sad",             arabicName: "ص",          verses: 88,  difficulty: 3, juz: 23 },
  { id: 39,  name: "Az-Zumar",        arabicName: "الزمر",      verses: 75,  difficulty: 3, juz: 23 },
  { id: 40,  name: "Ghafir",          arabicName: "غافر",       verses: 85,  difficulty: 3, juz: 24 },
  { id: 41,  name: "Fussilat",        arabicName: "فصلت",       verses: 54,  difficulty: 3, juz: 24 },
  { id: 42,  name: "Ash-Shura",       arabicName: "الشورى",     verses: 53,  difficulty: 3, juz: 25 },
  { id: 43,  name: "Az-Zukhruf",      arabicName: "الزخرف",     verses: 89,  difficulty: 3, juz: 25 },
  { id: 44,  name: "Ad-Dukhan",       arabicName: "الدخان",     verses: 59,  difficulty: 3, juz: 25 },
  { id: 45,  name: "Al-Jathiyah",     arabicName: "الجاثية",    verses: 37,  difficulty: 3, juz: 25 },
  { id: 46,  name: "Al-Ahqaf",        arabicName: "الأحقاف",    verses: 35,  difficulty: 3, juz: 26 },
  { id: 47,  name: "Muhammad",        arabicName: "محمد",       verses: 38,  difficulty: 3, juz: 26 },
  { id: 48,  name: "Al-Fath",         arabicName: "الفتح",      verses: 29,  difficulty: 2, juz: 26 },
  { id: 49,  name: "Al-Hujurat",      arabicName: "الحجرات",    verses: 18,  difficulty: 2, juz: 26 },
  { id: 50,  name: "Qaf",             arabicName: "ق",          verses: 45,  difficulty: 2, juz: 26 },
  { id: 51,  name: "Adh-Dhariyat",    arabicName: "الذاريات",   verses: 60,  difficulty: 3, juz: 26 },
  { id: 52,  name: "At-Tur",          arabicName: "الطور",      verses: 49,  difficulty: 2, juz: 27 },
  { id: 53,  name: "An-Najm",         arabicName: "النجم",      verses: 62,  difficulty: 2, juz: 27 },
  { id: 54,  name: "Al-Qamar",        arabicName: "القمر",      verses: 55,  difficulty: 2, juz: 27 },
  { id: 55,  name: "Ar-Rahman",       arabicName: "الرحمن",     verses: 78,  difficulty: 2, juz: 27 },
  { id: 56,  name: "Al-Waqiah",       arabicName: "الواقعة",    verses: 96,  difficulty: 2, juz: 27 },
  { id: 57,  name: "Al-Hadid",        arabicName: "الحديد",     verses: 29,  difficulty: 2, juz: 27 },
  { id: 58,  name: "Al-Mujadila",     arabicName: "المجادلة",   verses: 22,  difficulty: 2, juz: 28 },
  { id: 59,  name: "Al-Hashr",        arabicName: "الحشر",      verses: 24,  difficulty: 2, juz: 28 },
  { id: 60,  name: "Al-Mumtahanah",   arabicName: "الممتحنة",   verses: 13,  difficulty: 2, juz: 28 },
  { id: 61,  name: "As-Saf",          arabicName: "الصف",       verses: 14,  difficulty: 2, juz: 28 },
  { id: 62,  name: "Al-Jumuah",       arabicName: "الجمعة",     verses: 11,  difficulty: 1, juz: 28 },
  { id: 63,  name: "Al-Munafiqun",    arabicName: "المنافقون",  verses: 11,  difficulty: 2, juz: 28 },
  { id: 64,  name: "At-Taghabun",     arabicName: "التغابن",    verses: 18,  difficulty: 2, juz: 28 },
  { id: 65,  name: "At-Talaq",        arabicName: "الطلاق",     verses: 12,  difficulty: 2, juz: 28 },
  { id: 66,  name: "At-Tahrim",       arabicName: "التحريم",    verses: 12,  difficulty: 2, juz: 28 },
  { id: 67,  name: "Al-Mulk",         arabicName: "الملك",      verses: 30,  difficulty: 2, juz: 29 },
  { id: 68,  name: "Al-Qalam",        arabicName: "القلم",      verses: 52,  difficulty: 2, juz: 29 },
  { id: 69,  name: "Al-Haqqah",       arabicName: "الحاقة",     verses: 52,  difficulty: 2, juz: 29 },
  { id: 70,  name: "Al-Maarij",       arabicName: "المعارج",    verses: 44,  difficulty: 2, juz: 29 },
  { id: 71,  name: "Nuh",             arabicName: "نوح",        verses: 28,  difficulty: 2, juz: 29 },
  { id: 72,  name: "Al-Jinn",         arabicName: "الجن",       verses: 28,  difficulty: 2, juz: 29 },
  { id: 73,  name: "Al-Muzzammil",    arabicName: "المزمل",     verses: 20,  difficulty: 2, juz: 29 },
  { id: 74,  name: "Al-Muddathir",    arabicName: "المدثر",     verses: 56,  difficulty: 2, juz: 29 },
  { id: 75,  name: "Al-Qiyamah",      arabicName: "القيامة",    verses: 40,  difficulty: 2, juz: 29 },
  { id: 76,  name: "Al-Insan",        arabicName: "الإنسان",    verses: 31,  difficulty: 2, juz: 29 },
  { id: 77,  name: "Al-Mursalat",     arabicName: "المرسلات",   verses: 50,  difficulty: 2, juz: 29 },
  { id: 78,  name: "An-Naba",         arabicName: "النبأ",      verses: 40,  difficulty: 1, juz: 30 },
  { id: 79,  name: "An-Naziat",       arabicName: "النازعات",   verses: 46,  difficulty: 1, juz: 30 },
  { id: 80,  name: "Abasa",           arabicName: "عبس",        verses: 42,  difficulty: 1, juz: 30 },
  { id: 81,  name: "At-Takwir",       arabicName: "التكوير",    verses: 29,  difficulty: 1, juz: 30 },
  { id: 82,  name: "Al-Infitar",      arabicName: "الانفطار",   verses: 19,  difficulty: 1, juz: 30 },
  { id: 83,  name: "Al-Mutaffifin",   arabicName: "المطففين",   verses: 36,  difficulty: 1, juz: 30 },
  { id: 84,  name: "Al-Inshiqaq",     arabicName: "الانشقاق",   verses: 25,  difficulty: 1, juz: 30 },
  { id: 85,  name: "Al-Buruj",        arabicName: "البروج",     verses: 22,  difficulty: 1, juz: 30 },
  { id: 86,  name: "At-Tariq",        arabicName: "الطارق",     verses: 17,  difficulty: 1, juz: 30 },
  { id: 87,  name: "Al-Ala",          arabicName: "الأعلى",     verses: 19,  difficulty: 1, juz: 30 },
  { id: 88,  name: "Al-Ghashiyah",    arabicName: "الغاشية",    verses: 26,  difficulty: 1, juz: 30 },
  { id: 89,  name: "Al-Fajr",         arabicName: "الفجر",      verses: 30,  difficulty: 1, juz: 30 },
  { id: 90,  name: "Al-Balad",        arabicName: "البلد",      verses: 20,  difficulty: 1, juz: 30 },
  { id: 91,  name: "Ash-Shams",       arabicName: "الشمس",      verses: 15,  difficulty: 1, juz: 30 },
  { id: 92,  name: "Al-Layl",         arabicName: "الليل",      verses: 21,  difficulty: 1, juz: 30 },
  { id: 93,  name: "Ad-Duha",         arabicName: "الضحى",      verses: 11,  difficulty: 1, juz: 30 },
  { id: 94,  name: "Ash-Sharh",       arabicName: "الشرح",      verses: 8,   difficulty: 1, juz: 30 },
  { id: 95,  name: "At-Tin",          arabicName: "التين",      verses: 8,   difficulty: 1, juz: 30 },
  { id: 96,  name: "Al-Alaq",         arabicName: "العلق",      verses: 19,  difficulty: 1, juz: 30 },
  { id: 97,  name: "Al-Qadr",         arabicName: "القدر",      verses: 5,   difficulty: 1, juz: 30 },
  { id: 98,  name: "Al-Bayyinah",     arabicName: "البينة",     verses: 8,   difficulty: 1, juz: 30 },
  { id: 99,  name: "Az-Zalzalah",     arabicName: "الزلزلة",    verses: 8,   difficulty: 1, juz: 30 },
  { id: 100, name: "Al-Adiyat",       arabicName: "العاديات",   verses: 11,  difficulty: 1, juz: 30 },
  { id: 101, name: "Al-Qariah",       arabicName: "القارعة",    verses: 11,  difficulty: 1, juz: 30 },
  { id: 102, name: "At-Takathur",     arabicName: "التكاثر",    verses: 8,   difficulty: 1, juz: 30 },
  { id: 103, name: "Al-Asr",          arabicName: "العصر",      verses: 3,   difficulty: 1, juz: 30 },
  { id: 104, name: "Al-Humazah",      arabicName: "الهمزة",     verses: 9,   difficulty: 1, juz: 30 },
  { id: 105, name: "Al-Fil",          arabicName: "الفيل",      verses: 5,   difficulty: 1, juz: 30 },
  { id: 106, name: "Quraysh",         arabicName: "قريش",       verses: 4,   difficulty: 1, juz: 30 },
  { id: 107, name: "Al-Maun",         arabicName: "الماعون",    verses: 7,   difficulty: 1, juz: 30 },
  { id: 108, name: "Al-Kawthar",      arabicName: "الكوثر",     verses: 3,   difficulty: 1, juz: 30 },
  { id: 109, name: "Al-Kafirun",      arabicName: "الكافرون",   verses: 6,   difficulty: 1, juz: 30 },
  { id: 110, name: "An-Nasr",         arabicName: "النصر",      verses: 3,   difficulty: 1, juz: 30 },
  { id: 111, name: "Al-Masad",        arabicName: "المسد",      verses: 5,   difficulty: 1, juz: 30 },
  { id: 112, name: "Al-Ikhlas",       arabicName: "الإخلاص",    verses: 4,   difficulty: 1, juz: 30 },
  { id: 113, name: "Al-Falaq",        arabicName: "الفلق",      verses: 5,   difficulty: 1, juz: 30 },
  { id: 114, name: "An-Nas",          arabicName: "الناس",      verses: 6,   difficulty: 1, juz: 30 },
];

export const generateAllSurahs = (): Surah[] => {
  return SURAH_DATA.map(s => ({
    ...s,
    status: 'not_started' as const,
    color: undefined,
  }));
};

// ═══════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES POUR LES BADGES
// ═══════════════════════════════════════════════════════════════

export function checkLoginStreak(userData: UserData): { newStreak: number; isConsecutive: boolean } {
  const today = new Date().toISOString().split('T')[0];
  const lastLogin = userData.lastLoginDate;

  if (!lastLogin) {
    return { newStreak: 1, isConsecutive: false };
  }

  const lastDate = new Date(lastLogin);
  const todayDate = new Date(today);
  const diffTime = todayDate.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { newStreak: userData.loginStreak || 1, isConsecutive: true };
  } else if (diffDays === 1) {
    return { newStreak: (userData.loginStreak || 0) + 1, isConsecutive: true };
  } else {
    return { newStreak: 1, isConsecutive: false };
  }
}

export function getRarityColor(rarity: string): string {
  return (MATERIALS[rarity as Rarity] ?? MATERIALS.common).mid;
}

export function getRarityLabel(rarity: string, lang: 'fr' | 'ar'): string {
  const m = MATERIALS[rarity as Rarity];
  return m ? m[lang] : rarity;
}
