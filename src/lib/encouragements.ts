import type { UserData } from '../types';
import { BADGE_DEFINITIONS } from '../types';
import { trophyProgress } from './trophies';

type Lang = 'fr' | 'ar';
type Pair = [fr: string, ar: string];

const dayIndex = (d = new Date()) => Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 864e5);
const pick = <T,>(list: T[], seed: number) => list[Math.abs(seed) % list.length];
const memorized = (d: UserData) => d.surahs.filter(s => s.status === 'memorized');

/**
 * Message du jour pour l'accueil : personnel, lié à la progression réelle,
 * et stable dans la journée (il ne change pas à chaque ouverture).
 */
export function dailyEncouragement(d: UserData, lang: Lang, now = new Date()): string {
  const name = d.settings?.username || (lang === 'fr' ? 'toi' : '');
  const streak = d.loginStreak ?? 1;
  const mem = memorized(d).length;
  const reviews = d.surahs.filter(s => s.status === 'review').length;
  const current = d.surahs.find(s => s.status === 'in_progress');
  const seed = dayIndex(now);
  const hour = now.getHours();
  const L = (p: Pair) => (lang === 'fr' ? p[0] : p[1]);

  // Un trophée tout proche passe avant tout : c'est le message le plus motivant
  const near = BADGE_DEFINITIONS
    .filter(b => !d.badges.some(o => o.id === b.id))
    .map(b => ({ b, p: trophyProgress(d, b.id) }))
    .filter(x => x.p && x.p[0] > 0 && x.p[1] - x.p[0] <= Math.max(1, Math.ceil(x.p[1] * 0.1)))
    .sort((a, b) => (b.p![0] / b.p![1]) - (a.p![0] / a.p![1]))[0];
  if (near && seed % 2 === 0) {
    const left = near.p![1] - near.p![0];
    return L([
      `Plus que ${left} pour le trophée « ${near.b.title} ». Tu y es presque, ${name}.`,
      `باقي ${left} لوسام «${near.b.titleAr}». أنت قريب جداً.`,
    ]);
  }

  if (streak >= 2 && [3, 7, 14, 30, 60, 100, 365].includes(streak)) {
    return L([
      `${streak} jours de suite. Mâ shâ' Allâh, ${name}, la régularité est ce qu'Allah aime le plus.`,
      `${streak} يوماً متتالية. ما شاء الله، أحب الأعمال إلى الله أدومها وإن قلّ.`,
    ]);
  }
  if (streak === 1 && d.calendar.length > 3) {
    return L([
      `Bon retour, ${name}. L'important n'est pas d'avoir fait une pause, c'est d'être revenu.`,
      `أهلاً بعودتك. المهم أنك عدت.`,
    ]);
  }

  const pool: Pair[] = [
    [`Un verset révisé aujourd'hui vaut mieux qu'une page oubliée demain.`, `آية تراجعها اليوم خير من صفحة تنساها غداً.`],
    [`Le meilleur d'entre vous est celui qui apprend le Coran et l'enseigne.`, `خيركم من تعلّم القرآن وعلّمه.`],
    [`Peu mais régulier : c'est ainsi que le Coran s'installe dans le cœur.`, `قليل دائم، هكذا يستقر القرآن في القلب.`],
  ];
  if (mem > 0) pool.push([`${mem} sourate${mem > 1 ? 's' : ''} dans ton cœur. Chacune est une lumière pour toi, ${name}.`, `${mem} سورة في قلبك، كل واحدة نور لك.`]);
  if (current) pool.push([`${current.name} t'attend. Quelques versets aujourd'hui suffisent.`, `سورة ${current.arabicName} بانتظارك. بضع آيات اليوم تكفي.`]);
  if (reviews > 0) pool.push([`${reviews} sourate${reviews > 1 ? 's' : ''} à consolider. Les réviser, c'est les protéger de l'oubli.`, `${reviews} سورة للمراجعة. المراجعة تحميها من النسيان.`]);
  if (hour < 11) pool.push([`Bonjour ${name}. Le matin est béni pour la mémoire, profites-en.`, `صباح الخير. الصباح مبارك للحفظ.`]);
  if (hour >= 20) pool.push([`Une courte révision avant de dormir, et la nuit fera le reste.`, `مراجعة قصيرة قبل النوم، والليل يكمل الباقي.`]);

  return L(pick(pool, seed + name.length));
}

/** Mot de soutien quand une action importante vient d'être faite, ou null. */
export function cheerFor(prev: UserData, next: UserData, lang: Lang): string | null {
  const fr = lang === 'fr';
  const name = next.settings?.username || '';
  const seed = Date.now();

  const newlyMem = next.surahs.find(s => s.status === 'memorized' && prev.surahs.find(p => p.id === s.id)?.status !== 'memorized');
  if (newlyMem) return fr
    ? pick([`${newlyMem.name} est dans ton cœur. Mâ shâ' Allâh, ${name} !`, `Bârak Allâhu fîk, ${name} : ${newlyMem.name} est mémorisée.`], seed)
    : `ما شاء الله! سورة ${newlyMem.arabicName} في قلبك الآن.`;

  const goalsBefore = prev.goals.filter(g => g.completed).length;
  if (next.goals.filter(g => g.completed).length > goalsBefore) return fr
    ? pick([`Objectif accompli. Continue comme ça, ${name}.`, `Un objectif de plus. Qu'Allah te facilite la suite.`], seed)
    : 'هدف آخر أُنجز. بارك الله فيك.';

  if (next.diftarPages.length > prev.diftarPages.length) return fr
    ? `Nouvelle page dans ton Diftar. Écrire, c'est déjà retenir.`
    : 'صفحة جديدة في دفترك. الكتابة بداية الحفظ.';

  const tPrev = prev.tasbihCount ?? 0, tNext = next.tasbihCount ?? 0;
  if (Math.floor(tNext / 100) > Math.floor(tPrev / 100) && tNext > 0) return fr
    ? `${tNext} dhikr au total. Que ta langue reste humide du rappel d'Allah.`
    : `${tNext} ذكر. لا يزال لسانك رطباً من ذكر الله.`;

  const doneBefore = prev.dailySession?.done.length ?? 0, doneNow = next.dailySession?.done.length ?? 0;
  if (next.dailySession && doneNow > doneBefore && next.dailySession.total && doneNow >= next.dailySession.total) return fr
    ? `Séance du jour accomplie, ${name}. Bârak Allâhu fîk !`
    : 'أتممت جلسة اليوم. بارك الله فيك!';

  return null;
}
