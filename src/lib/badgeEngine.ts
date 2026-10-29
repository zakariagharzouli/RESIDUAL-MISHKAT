import { UserData, Badge, BADGE_DEFINITIONS, checkLoginStreak } from '../types';
import confetti from 'canvas-confetti';
import { trophyProgress, MATERIALS } from './trophies';

export interface BadgeUnlockResult {
  newBadges: Badge[];
  totalBadges: number;
  progress: number;
}

/**
 * Vérifie et débloque automatiquement les badges
 * À appeler APRÈS chaque action utilisateur importante
 */
export function checkAndUnlockBadges(userData: UserData): BadgeUnlockResult {
  const currentBadgeIds = new Set(userData.badges.map(b => b.id));
  const newBadges: Badge[] = [];

  for (const badgeDef of BADGE_DEFINITIONS) {
    if (currentBadgeIds.has(badgeDef.id)) continue;
    try {
      if (badgeDef.condition(userData)) {
        const unlockedBadge: Badge = {
          ...badgeDef,
          unlockedAt: Date.now()
        };
        newBadges.push(unlockedBadge);
      }
    } catch (error) {
      console.error(`Erreur badge ${badgeDef.id}:`, error);
    }
  }

  return {
    newBadges,
    totalBadges: userData.badges.length + newBadges.length,
    progress: Math.round(((userData.badges.length + newBadges.length) / BADGE_DEFINITIONS.length) * 100)
  };
}

/**
 * Met à jour la streak de connexion
 */
export function updateLoginStreak(userData: UserData): UserData {
  const { newStreak } = checkLoginStreak(userData);
  const today = new Date().toISOString().split('T')[0];
  if (userData.lastLoginDate !== today) {
    return { ...userData, lastLoginDate: today, loginStreak: newStreak };
  }
  return userData;
}

/**
 * Animation de célébration quand un badge est débloqué
 */
export function celebrateBadgeUnlock(badge: Badge): void {
  // Pluie d'éclats dans la matière de la médaille ; plus dense pour les plus rares
  const m = MATERIALS[badge.rarity] ?? MATERIALS.common;
  const colors = [m.light, m.mid, m.dark, '#FFE7A3'];
  const power = { common: 0.5, rare: 0.75, epic: 1, legendary: 1.4 }[badge.rarity] ?? 0.5;
  const base = { origin: { y: 0.42 }, colors, disableForReducedMotion: true, zIndex: 10001, ticks: 220, gravity: 0.7, scalar: 0.9 };
  confetti({ ...base, particleCount: Math.round(90 * power), spread: 70, startVelocity: 38 });
  setTimeout(() => confetti({ ...base, particleCount: Math.round(60 * power), spread: 110, startVelocity: 30, shapes: ['circle'] }), 180);
}

export function formatUnlockDate(timestamp: number, lang: 'fr' | 'ar'): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-SA', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function getTimeSinceUnlock(timestamp: number, lang: 'fr' | 'ar'): string {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (lang === 'fr') {
    if (days > 0) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    return "À l'instant";
  } else {
    if (days > 0) return `منذ ${days} يوم`;
    if (hours > 0) return `منذ ${hours} ساعة`;
    if (minutes > 0) return `منذ ${minutes} دقيقة`;
    return 'الآن';
  }
}

export function getBadgesByRarity(badges: Badge[]): Record<string, Badge[]> {
  return badges.reduce((acc, badge) => {
    if (!acc[badge.rarity]) acc[badge.rarity] = [];
    acc[badge.rarity].push(badge);
    return acc;
  }, {} as Record<string, Badge[]>);
}

export function isBadgeUnlocked(userData: UserData, badgeId: string): boolean {
  return userData.badges.some(b => b.id === badgeId);
}

export function getNextBadgeToUnlock(userData: UserData): Badge | null {
  const unlockedIds = new Set(userData.badges.map(b => b.id));
  for (const badgeDef of BADGE_DEFINITIONS) {
    if (!unlockedIds.has(badgeDef.id)) {
      const progress = getBadgeProgress(userData, badgeDef.id);
      if (progress > 0) return { ...badgeDef, unlockedAt: undefined };
    }
  }
  return null;
}

export function getBadgeProgress(userData: UserData, badgeId: string): number {
  const p = trophyProgress(userData, badgeId);
  if (p) return Math.min(100, (p[0] / p[1]) * 100);
  switch (badgeId) {
    case 'first_surah':        return Math.min(100, (userData.surahs.filter(s => s.status === 'memorized').length / 1) * 100);
    case 'five_surahs':        return Math.min(100, (userData.surahs.filter(s => s.status === 'memorized').length / 5) * 100);
    case 'ten_surahs':         return Math.min(100, (userData.surahs.filter(s => s.status === 'memorized').length / 10) * 100);
    case 'twenty_surahs':      return Math.min(100, (userData.surahs.filter(s => s.status === 'memorized').length / 20) * 100);
    case 'fifty_surahs':       return Math.min(100, (userData.surahs.filter(s => s.status === 'memorized').length / 50) * 100);
    case 'hundred_surahs':     return Math.min(100, (userData.surahs.filter(s => s.status === 'memorized').length / 100) * 100);
    case 'full_hafiz':         return Math.min(100, (userData.surahs.filter(s => s.status === 'memorized').length / 114) * 100);
    case 'first_goal':         return Math.min(100, (userData.goals.filter(g => g.completed).length / 1) * 100);
    case 'five_goals':         return Math.min(100, (userData.goals.filter(g => g.completed).length / 5) * 100);
    case 'ten_goals':          return Math.min(100, (userData.goals.filter(g => g.completed).length / 10) * 100);
    case 'streak_3':           return Math.min(100, ((userData.loginStreak ?? 0) / 3) * 100);
    case 'streak_7':           return Math.min(100, ((userData.loginStreak ?? 0) / 7) * 100);
    case 'streak_30':          return Math.min(100, ((userData.loginStreak ?? 0) / 30) * 100);
    case 'tasbih_33':          return Math.min(100, ((userData.tasbihSessionBest ?? 0) / 33) * 100);
    case 'tasbih_100':         return Math.min(100, ((userData.tasbihSessionBest ?? 0) / 100) * 100);
    case 'tasbih_1000_total':  return Math.min(100, ((userData.tasbihCount ?? 0) / 1000) * 100);
    case 'first_note':         return Math.min(100, (userData.diftarPages.length / 1) * 100);
    case 'five_notes':         return Math.min(100, (userData.diftarPages.length / 5) * 100);
    case 'artist':             return Math.min(100, (userData.surahs.filter(s => s.color).length / 30) * 100);
    case 'color_master':       return Math.min(100, (userData.surahs.filter(s => s.color).length / 60) * 100);
    case 'first_calendar':     return Math.min(100, (userData.calendar.length / 1) * 100);
    case 'week_calendar':      return Math.min(100, (userData.calendar.length / 7) * 100);
    // New badges
    case 'thirty_surahs':      return Math.min(100, (userData.surahs.filter(s => s.status === 'memorized').length / 30) * 100);
    case 'seventy_surahs':     return Math.min(100, (userData.surahs.filter(s => s.status === 'memorized').length / 70) * 100);
    case 'surah_fatiha':       return userData.surahs.find(s => s.id === 1)?.status === 'memorized' ? 100 : 0;
    case 'surah_yaseen':       return userData.surahs.find(s => s.id === 36)?.status === 'memorized' ? 100 : 0;
    case 'surah_kahf':         return userData.surahs.find(s => s.id === 18)?.status === 'memorized' ? 100 : 0;
    case 'surah_mulk':         return userData.surahs.find(s => s.id === 67)?.status === 'memorized' ? 100 : 0;
    case 'surah_rahman':       return userData.surahs.find(s => s.id === 55)?.status === 'memorized' ? 100 : 0;
    case 'streak_14':          return Math.min(100, ((userData.loginStreak ?? 0) / 14) * 100);
    case 'streak_60':          return Math.min(100, ((userData.loginStreak ?? 0) / 60) * 100);
    case 'tasbih_5000_total':  return Math.min(100, ((userData.tasbihCount ?? 0) / 5000) * 100);
    case 'ten_notes':          return Math.min(100, (userData.diftarPages.length / 10) * 100);
    case 'first_color':        return Math.min(100, (userData.surahs.filter(s => s.color).length / 1) * 100);
    case 'full_colorist':      return Math.min(100, (userData.surahs.filter(s => s.color).length / 114) * 100);
    case 'month_calendar':     return Math.min(100, (userData.calendar.length / 30) * 100);
    case 'first_revision':     return Math.min(100, (userData.surahs.filter(s => s.status === 'review').length / 1) * 100);
    case 'five_revision':      return Math.min(100, (userData.surahs.filter(s => s.status === 'review').length / 5) * 100);
    default:                   return 0;
  }
}
