import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { UserData } from '../types';
import { useT } from '../lib/theme';
import { dailyEncouragement } from '../lib/encouragements';
import { Icon, Icons, useIsNarrow, useIsMobile, AnimatedNumber } from './ui';
import { Skeleton } from './Skeleton';
import { RiveAnim } from './RiveAnim';
import { FlowerArt } from './Flowers';
import { FLOWERS } from '../lib/flowers';

const RESUME_KEY = 'mishkat_quran_last';
export function saveQuranPosition(surahId: number, surahName: string, ayah: number) {
  localStorage.setItem(RESUME_KEY, JSON.stringify({ surahId, surahName, ayah, ts: Date.now() }));
}
export function loadQuranPosition(): { surahId: number; surahName: string; ayah: number } | null {
  try { return JSON.parse(localStorage.getItem(RESUME_KEY) || 'null'); } catch { return null; }
}

interface PrayerTime { name: string; nameAr: string; time: string; }

async function fetchPrayerTimes(city: string): Promise<PrayerTime[]> {
  try {
    const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=&method=2`);
    const data = await res.json();
    if (data.code !== 200) return [];
    const t = data.data.timings;
    return [
      { name: 'Fajr',    nameAr: 'الفجر',  time: t.Fajr    },
      { name: 'Dhuhr',   nameAr: 'الظهر',  time: t.Dhuhr   },
      { name: 'Asr',     nameAr: 'العصر',  time: t.Asr     },
      { name: 'Maghrib', nameAr: 'المغرب', time: t.Maghrib },
      { name: 'Isha',    nameAr: 'العشاء', time: t.Isha    },
    ];
  } catch { return []; }
}

interface Verse { ar: string; fr: string; ref: string; }

async function fetchVerseOfDay(): Promise<Verse | null> {
  try {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const verseNum = (dayOfYear % 6236) + 1;
    const [arRes, frRes] = await Promise.all([
      fetch(`https://api.alquran.cloud/v1/ayah/${verseNum}/ar.alafasy`),
      fetch(`https://api.alquran.cloud/v1/ayah/${verseNum}/fr.hamidullah`),
    ]);
    const [arData, frData] = await Promise.all([arRes.json(), frRes.json()]);
    if (arData.code !== 200) return null;
    return { ar: arData.data.text, fr: frData.data.text, ref: `${arData.data.surah.englishName} · ${arData.data.surah.number}:${arData.data.numberInSurah}` };
  } catch { return null; }
}

const FALLBACK_VERSE: Verse = { ar: 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ', fr: 'Lis, au nom de ton Seigneur qui a créé.', ref: 'Al-ʿAlaq · 96:1' };

// Couleurs des sections : elles restent les mêmes en thème clair et sombre
const HUE = { flame: '#E8743B', emerald: '#2E9E6E', lapis: '#3B6FD8', violet: '#8A5CD0', rose: '#D9577A', amber: '#E0A21C' };

type Period = 'aube' | 'jour' | 'apres' | 'soir' | 'nuit';
const SCENES: Record<Period, { id: string; pos: string; fr: string; ar: string; stars?: boolean }[]> = {
  aube:  [{ id: 'medine', pos: 'center 64%', fr: 'Médine', ar: 'المدينة' }, { id: 'ghardaia', pos: 'center 62%', fr: 'Ghardaïa', ar: 'غرداية' }],
  jour:  [{ id: 'casbah', pos: 'center 50%', fr: 'Casbah d\'Alger', ar: 'القصبة' }, { id: 'arcades', pos: 'center 55%', fr: 'Arcades', ar: 'أقواس' }],
  apres: [{ id: 'kaaba-crepuscule', pos: 'center 70%', fr: 'La Mecque', ar: 'مكة' }, { id: 'balcon-alger', pos: 'center 52%', fr: 'Baie d\'Alger', ar: 'الجزائر' }, { id: 'timimoun', pos: 'center 72%', fr: 'Timimoun', ar: 'تيميمون' }],
  soir:  [{ id: 'alger-mosquee', pos: 'center 66%', fr: 'Djamaa el Djazaïr', ar: 'جامع الجزائر' }, { id: 'dunes', pos: 'center 70%', fr: 'Le Sahara', ar: 'الصحراء' }],
  nuit:  [{ id: 'haram-nuit', pos: 'center 62%', fr: 'Al-Haram', ar: 'الحرم' }, { id: 'tassili', pos: 'center 50%', fr: 'Tassili n\'Ajjer', ar: 'الطاسيلي', stars: true }],
};
const periodOf = (h: number): Period => h >= 4 && h < 7 ? 'aube' : h < 15 && h >= 7 ? 'jour' : h >= 15 && h < 18 ? 'apres' : h >= 18 && h < 20 ? 'soir' : 'nuit';
const GREET: Record<Period, [string, string]> = {
  aube: ['Belle aube', 'فجر مبارك'], jour: ['Belle journée', 'يوم سعيد'], apres: ['Bel après-midi', 'مساء طيب'], soir: ['Bonne soirée', 'مساء الخير'], nuit: ['Douce nuit', 'ليلة هادئة'],
};
// Étoiles fixes (pas d'aléatoire : même ciel à chaque rendu)
const STARS = Array.from({ length: 46 }, (_, i) => ({ x: (i * 37.7) % 100, y: ((i * 53.3) % 62), r: 0.6 + ((i * 7) % 5) / 4, d: (i % 7) * 0.6 }));

interface Task { id: string; title: string; sub: string; ar?: string; to: string; icon: React.ReactNode; hue: string; }

const todayKey = () => new Date().toISOString().split('T')[0];
const dayIndex = () => Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 864e5);

/** Les étapes du jour, construites à partir de la progression réelle. */
function buildSession(d: UserData, fr: boolean, resume: ReturnType<typeof loadQuranPosition>): Task[] {
  const tasks: Task[] = [];
  const reviews = d.surahs.filter(s => s.status === 'review');
  const n = Math.min(3, reviews.length);
  for (let k = 0; k < n; k++) {
    const s = reviews[(dayIndex() + k) % reviews.length];
    tasks.push({ id: `review-${s.id}`, title: fr ? `Réviser ${s.name}` : `مراجعة ${s.arabicName}`, sub: `${s.verses} ${fr ? 'versets' : 'آية'}`, ar: s.arabicName, to: 'memorization', icon: Icons.refresh, hue: HUE.emerald });
  }
  const current = d.surahs.find(s => s.status === 'in_progress');
  const next = current ?? d.surahs.find(s => s.status === 'not_started');
  if (next) tasks.push({
    id: `hifz-${next.id}`,
    title: fr ? `${current ? 'Continuer' : 'Commencer'} ${next.name}` : `${current ? 'متابعة' : 'بدء'} ${next.arabicName}`,
    sub: fr ? `Mémorisation · ${next.verses} versets` : `الحفظ · ${next.verses} آية`, ar: next.arabicName, to: 'memorization', icon: Icons.book, hue: HUE.amber,
  });
  if (resume) tasks.push({ id: 'read', title: fr ? 'Reprendre la lecture' : 'متابعة القراءة', sub: `${resume.surahName} · v.${resume.ayah}`, to: 'quran', icon: Icons.bookmark, hue: HUE.lapis });
  const morning = new Date().getHours() < 15;
  tasks.push({ id: morning ? 'adhkar-matin' : 'adhkar-soir', title: fr ? (morning ? 'Adhkâr du matin' : 'Adhkâr du soir') : (morning ? 'أذكار الصباح' : 'أذكار المساء'), sub: fr ? '8 invocations · 5 min' : '8 أذكار · 5 دقائق', to: 'adhkar', icon: Icons.moon, hue: morning ? HUE.flame : HUE.rose });
  tasks.push({ id: 'tasbih', title: fr ? '33 × Subhân Allâh' : 'سبحان الله ×33', sub: fr ? 'Tasbih' : 'التسبيح', to: 'tasbih', icon: Icons.beads, hue: HUE.violet });
  return tasks;
}

interface DashboardProps {
  userData: UserData;
  setUserData?: (updater: (prev: UserData) => UserData) => void;
  lang: string;
  onNavigate?: (section: string) => void;
}

export const Dashboard = ({ userData, setUserData, lang, onNavigate }: DashboardProps) => {
  const t = useT();
  const narrow = useIsNarrow();
  const isMobile = useIsMobile();
  const fr = lang === 'fr';
  const L = fr ? 'fr' : 'ar';

  const memorizedCount = userData.surahs.filter(s => s.status === 'memorized').length;
  const totalVersets   = userData.surahs.filter(s => s.status === 'memorized').reduce((acc, s) => acc + s.verses, 0);
  const streak         = userData.loginStreak || 1;
  const username       = userData.settings?.username || 'Hafiz';
  const city           = userData.settings?.city;
  const resumePos      = loadQuranPosition();

  const [verse, setVerse]           = useState<Verse | null>(null);
  const [showTr, setShowTr]         = useState(false);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [prayerLoading, setPrayerLoading] = useState(!!city);
  const [nowTime, setNowTime]       = useState(new Date());

  useEffect(() => { fetchVerseOfDay().then(v => setVerse(v ?? FALLBACK_VERSE)); }, []);
  useEffect(() => {
    if (!city) return;
    setPrayerLoading(true);
    fetchPrayerTimes(city).then(p => { setPrayerTimes(p); setPrayerLoading(false); });
  }, [city]);
  useEffect(() => { const id = setInterval(() => setNowTime(new Date()), 30000); return () => clearInterval(id); }, []);

  const nextPrayer = useMemo(() => {
    if (!prayerTimes.length) return null;
    const now = nowTime.getHours() * 60 + nowTime.getMinutes();
    for (const p of prayerTimes) {
      const [h, m] = p.time.split(':').map(Number);
      if (h * 60 + m > now) return { ...p, minsLeft: h * 60 + m - now };
    }
    const [h, m] = prayerTimes[0].time.split(':').map(Number);
    return { ...prayerTimes[0], minsLeft: 24 * 60 - now + h * 60 + m };
  }, [prayerTimes, nowTime]);

  // ── Séance du jour ──
  const tasks = useMemo(() => buildSession(userData, fr, resumePos), [userData.surahs, fr]); // eslint-disable-line react-hooks/exhaustive-deps
  const today = todayKey();
  const done = new Set(userData.dailySession?.date === today ? userData.dailySession.done : []);
  const doneCount = tasks.filter(x => done.has(x.id)).length;
  const allDone = tasks.length > 0 && doneCount === tasks.length;
  const toggle = useCallback((id: string) => {
    setUserData?.(prev => {
      const cur = prev.dailySession?.date === today ? prev.dailySession.done : [];
      const nextDone = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
      return { ...prev, dailySession: { date: today, done: nextDone, total: tasks.length } };
    });
  }, [setUserData, today, tasks.length]);

  const message = useMemo(() => dailyEncouragement(userData, L), [userData.loginStreak, userData.badges.length, L]); // eslint-disable-line react-hooks/exhaustive-deps

  const dateStr = new Date().toLocaleDateString(fr ? 'fr-FR' : 'ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
  let hijri = '';
  try { hijri = new Intl.DateTimeFormat(fr ? 'fr-FR-u-ca-islamic-umalqura' : 'ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()).replace(/\s?(AH|ap\. ?H\.?|هـ)$/i, ''); } catch { /* ignoré */ }

  // ── Semaine ──
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 864e5);
    const key = d.toISOString().split('T')[0];
    const entry = userData.calendar.find(c => c.date === key);
    const prayers = entry?.prayers?.length ?? 0;
    return { key, label: d.toLocaleDateString(fr ? 'fr-FR' : 'ar-EG', { weekday: 'narrow' }), prayers, today: i === 6 };
  });

  const card: React.CSSProperties = { background: t.card, border: `1px solid ${t.line}`, borderRadius: 20 };
  const eyebrow: React.CSSProperties = { fontSize: 11, color: t.inkMute, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500 };
  const C = 2 * Math.PI * 34;

  const stats = [
    { icon: Icons.flame,    value: streak,         suffix: '',     label: fr ? 'Jours de suite'    : 'يوم متواصل', to: 'calendar', hue: HUE.flame },
    { icon: Icons.book,     value: totalVersets,   suffix: '',     label: fr ? 'Versets mémorisés' : 'آية محفوظة', to: 'memorization', hue: HUE.emerald },
    { icon: Icons.bookmark, value: memorizedCount, suffix: '/114', label: fr ? 'Sourates'          : 'سورة',       to: 'memorization', hue: HUE.lapis },
    { icon: Icons.badge,    value: userData.badges?.filter(b => b.unlockedAt).length ?? 0, suffix: '', label: fr ? 'Trophées' : 'وسام', to: 'badges', hue: HUE.violet },
  ];

  // ── Grande image du moment ──
  const period = periodOf(nowTime.getHours());
  const scenes = SCENES[period];
  const scene = scenes[dayIndex() % scenes.length];
  const starry = !!scene.stars;

  const Hero = (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
      style={{ position: 'relative', overflow: 'hidden', color: '#FFF8EA', minHeight: isMobile ? 330 : 300,
        margin: isMobile ? '-18px -14px 0' : 0, borderRadius: isMobile ? '0 0 30px 30px' : 26,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 24px 50px -28px rgba(30,20,4,0.6)', background: '#2a2014' }}>
      <motion.img key={scene.id} src={`/frames/${scene.id}.jpg`} alt="" aria-hidden="true"
        initial={{ scale: 1.12, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ scale: { duration: 22, ease: 'easeOut' }, opacity: { duration: 0.9 } }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: scene.pos }}/>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: isMobile ? 'linear-gradient(180deg, rgba(14,10,4,0.4) 0%, rgba(14,10,4,0) 22%, rgba(14,10,4,0.35) 45%, rgba(14,10,4,0.86) 100%)' : 'linear-gradient(180deg, rgba(14,10,4,0.42) 0%, rgba(14,10,4,0) 30%, rgba(14,10,4,0.2) 55%, rgba(14,10,4,0.8) 100%)' }}/>
      {starry && (
        <svg aria-hidden="true" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          {STARS.map((st, i) => <circle key={i} className="mk-twinkle" cx={`${st.x}%`} cy={`${st.y}%`} r={st.r} fill="#FFF4D6" style={{ animationDelay: `${st.d}s` }}/>)}
        </svg>
      )}
      {!starry && <div aria-hidden="true" className="mk-glow" style={{ position: 'absolute', width: '70%', height: '120%', top: '-40%', left: '-10%', background: 'radial-gradient(closest-side, rgba(255,226,160,0.35), transparent)', pointerEvents: 'none' }}/>}

      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '18px 18px 0' : '20px 24px 0', gap: 10 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'rgba(20,14,6,0.32)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', fontSize: 12.5, border: '1px solid rgba(255,255,255,0.18)' }}>
          <span aria-hidden="true">📍</span>{fr ? scene.fr : scene.ar}
        </span>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => onNavigate?.('settings')} aria-label={fr ? 'Réglages' : 'الإعدادات'}
          style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,248,234,0.22)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, serif', fontSize: 19, color: '#FFF8EA', cursor: 'pointer', flexShrink: 0 }}>
          {username.charAt(0).toUpperCase()}
        </motion.button>
      </div>

      <div style={{ position: 'relative', padding: isMobile ? '0 20px 24px' : '0 28px 26px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14 }}>
        <div style={{ minWidth: 0, maxWidth: 620, textShadow: '0 2px 14px rgba(0,0,0,0.45)' }}>
          <div style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, opacity: 0.85, display: 'flex', flexWrap: 'wrap', gap: '0 8px' }}>
            <span>{dateStr}</span>{hijri && <span style={{ color: '#F3D58A' }}>· {hijri}</span>}
          </div>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 360, fontSize: isMobile ? 32 : 40, margin: '6px 0 0', letterSpacing: '-0.015em', lineHeight: 1.08 }}>
            {fr ? 'As-salâmu ʿalaykum,' : 'السلام عليكم،'}<br/><span style={{ color: '#F3D58A', fontStyle: 'italic' }}>{username}</span>
          </h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }}
            style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.45, opacity: 0.92 }}>{GREET[period][fr ? 0 : 1]} · {message}</motion.p>
        </div>
        {nextPrayer && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 16, background: 'rgba(20,14,6,0.38)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.18)' }}>
            <Icon d={Icons.moon} size={18} color="#F3D58A"/>
            <span style={{ fontSize: 14 }}><b style={{ fontWeight: 600 }}>{fr ? nextPrayer.name : nextPrayer.nameAr}</b> · {nextPrayer.time}
              <span style={{ opacity: 0.75 }}> · {fr ? 'dans ' : 'بعد '}{Math.floor(nextPrayer.minsLeft / 60) > 0 ? `${Math.floor(nextPrayer.minsLeft / 60)} h ` : ''}{nextPrayer.minsLeft % 60} min</span></span>
          </div>
        )}
      </div>
    </motion.section>
  );

  // ── Vignettes à découvrir ──
  const gardenFlowers = [FLOWERS[1], FLOWERS[3], FLOWERS[4]];
  const explore = [
    { to: 'studio', fr: 'Créer un post', ar: 'أنشئ منشوراً', sub: fr ? 'Pour la famille' : 'للعائلة', img: '/frames/kaaba-crepuscule.jpg', pos: 'center 70%' },
    { to: 'garden', fr: 'Mon jardin', ar: 'حديقتي', sub: fr ? 'Tes fleurs' : 'أزهارك', img: null, pos: '' },
    { to: 'adhkar', fr: 'Adhkâr', ar: 'الأذكار', sub: fr ? 'Matin et soir' : 'الصباح والمساء', img: '/frames/doua-mains.jpg', pos: 'center 60%' },
    { to: 'diftar', fr: 'Mon Diftar', ar: 'دفتري', sub: fr ? 'Écrire, dessiner' : 'اكتب وارسم', img: '/frames/balcon-alger.jpg', pos: 'center 62%' },
  ];
  const Explore = (
    <section aria-label={fr ? 'À découvrir' : 'اكتشف'} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={eyebrow}>{fr ? 'À découvrir' : 'اكتشف'}</div>
      <div className="no-scrollbar" style={{ display: 'grid', gridAutoFlow: narrow ? 'column' : 'row', gridAutoColumns: narrow ? '42%' : undefined, gridTemplateColumns: narrow ? undefined : 'repeat(4, minmax(0, 1fr))', gap: 10, overflowX: narrow ? 'auto' : 'visible', margin: narrow ? '0 -14px' : 0, padding: narrow ? '0 14px 4px' : 0, scrollSnapType: 'x mandatory' }}>
        {explore.map((e, i) => (
          <motion.button key={e.to} onClick={() => onNavigate?.(e.to)}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06 }} whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }}
            style={{ position: 'relative', height: isMobile ? 168 : 150, borderRadius: 20, overflow: 'hidden', border: 'none', padding: 0, cursor: 'pointer', scrollSnapAlign: 'start', color: '#FFF8EA', textAlign: fr ? 'left' : 'right',
              background: e.img ? '#2a2014' : 'linear-gradient(160deg, #3FA374, #1F6B47)', boxShadow: '0 14px 28px -18px rgba(30,20,4,0.7)' }}>
            {e.img
              ? <img src={e.img} alt="" aria-hidden="true" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: e.pos }}/>
              : <span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, paddingBottom: 34 }}>
                  {gardenFlowers.map((f, k) => <span key={f.id} style={{ transform: `translateY(${k === 1 ? -10 : 4}px)`, margin: '0 -6px' }}><FlowerArt f={f} size={k === 1 ? 62 : 50} animate/></span>)}
                </span>}
            <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(12,8,2,0.72))' }}/>
            <span style={{ position: 'absolute', left: 14, right: 14, bottom: 12 }}>
              <span style={{ display: 'block', fontFamily: 'Fraunces, serif', fontSize: 18, lineHeight: 1.1 }}>{fr ? e.fr : e.ar}</span>
              <span style={{ display: 'block', fontSize: 12.5, opacity: 0.85, marginTop: 2 }}>{e.sub}</span>
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );

  const Session = (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      aria-label={fr ? 'Ta séance du jour' : 'جلسة اليوم'}
      style={{ ...card, padding: isMobile ? 18 : 24, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', overflow: 'hidden',
        borderColor: allDone ? `${t.accent}80` : t.line, boxShadow: allDone ? `0 0 0 4px ${t.accent}1a, 0 18px 40px -20px ${t.accent}` : 'none', transition: 'box-shadow .5s, border-color .5s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
            <circle cx="40" cy="40" r="34" fill="none" stroke={t.lineSoft} strokeWidth="7"/>
            <motion.circle cx="40" cy="40" r="34" fill="none" stroke={t.accent} strokeWidth="7" strokeLinecap="round" strokeDasharray={C}
              initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - (tasks.length ? doneCount / tasks.length : 0)) }}
              transition={{ type: 'spring', stiffness: 70, damping: 16 }}/>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, serif', fontSize: 22, color: t.ink }}>
            {doneCount}<span style={{ fontSize: 13, color: t.inkMute }}>/{tasks.length}</span>
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={eyebrow}>{fr ? 'Ta séance du jour' : 'جلسة اليوم'}</div>
          <h2 style={{ margin: '6px 0 0', fontFamily: 'Fraunces, serif', fontWeight: 400, fontSize: isMobile ? 22 : 26, color: t.ink, lineHeight: 1.15 }}>
            {allDone
              ? (fr ? 'Séance accomplie, bârak Allâhu fîk' : 'أتممت جلسة اليوم، بارك الله فيك')
              : (fr ? `${tasks.length - doneCount} étape${tasks.length - doneCount > 1 ? 's' : ''} pour aujourd'hui` : `${tasks.length - doneCount} خطوات لليوم`)}
          </h2>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {tasks.map((task, i) => {
          const on = done.has(task.id);
          return (
            <motion.div key={task.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.05 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i ? `1px solid ${t.lineSoft}` : 'none' }}>
              <button onClick={() => toggle(task.id)} aria-pressed={on} aria-label={on ? (fr ? `Décocher ${task.title}` : 'إلغاء') : (fr ? `Cocher ${task.title}` : 'تم')}
                style={{ width: 44, height: 44, margin: -6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                <motion.span animate={{ scale: on ? [1, 1.25, 1] : 1, backgroundColor: on ? t.accent : 'rgba(0,0,0,0)', borderColor: on ? t.accent : t.line }}
                  transition={{ duration: 0.35 }}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {on && <Icon d={Icons.check} size={15} stroke={2.6} color="#1a0f00"/>}
                </motion.span>
              </button>
              <button onClick={() => onNavigate?.(task.to)}
                style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: fr ? 'left' : 'right', padding: 0, color: t.ink }}>
                <span style={{ width: 40, height: 40, borderRadius: 13, background: `${task.hue}1f`, color: task.hue, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: on ? 0.55 : 1, transition: 'opacity .3s' }}>
                  <Icon d={task.icon} size={19} stroke={1.9}/>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: on ? t.inkMute : t.ink, textDecoration: on ? 'line-through' : 'none', textDecorationColor: t.accent, transition: 'color .3s' }}>{task.title}</span>
                  <span style={{ display: 'block', fontSize: 13, color: t.inkMute, marginTop: 1 }}>{task.sub}</span>
                </span>
                {task.ar
                  ? <span style={{ fontFamily: "'Amiri Quran', Amiri, serif", fontSize: 20, color: on ? t.inkMute : t.accent, flexShrink: 0 }} lang="ar">{task.ar}</span>
                  : null}
                <span style={{ color: t.inkMute, display: 'inline-flex', transform: fr ? 'none' : 'scaleX(-1)' }}><Icon d={Icons.arrow} size={14}/></span>
              </button>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );

  const Stats = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
      {stats.map((s, i) => (
        <motion.button key={s.label} onClick={() => onNavigate?.(s.to)}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
          whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
          style={{ ...card, position: 'relative', overflow: 'hidden', borderRadius: 18, padding: '14px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, cursor: 'pointer', textAlign: fr ? 'left' : 'right', color: t.ink,
            background: `linear-gradient(150deg, ${s.hue}1c, ${s.hue}08 70%), ${t.card}`, borderColor: `${s.hue}33` }}>
          {(() => {
            const badge = <span style={{ width: 34, height: 34, borderRadius: '50%', background: s.hue, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 14px -6px ${s.hue}` }}><Icon d={s.icon} size={17} stroke={2}/></span>;
            return i === 0
              ? <>{badge}<RiveAnim src="/rive/flamme.riv" animation="Normal" size={isMobile ? 96 : 104} style={{ position: 'absolute', top: -6, insetInlineEnd: -10, pointerEvents: 'none' }}/></>
              : badge;
          })()}
          <span style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 360, lineHeight: 1 }}>
            <AnimatedNumber value={s.value}/>{s.suffix && <span style={{ fontSize: 14, color: t.inkMute }}>{s.suffix}</span>}
          </span>
          <span style={{ fontSize: 12, color: t.inkMute }}>{s.label}</span>
        </motion.button>
      ))}
    </div>
  );

  const Prayer = city ? (
    <div style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={eyebrow}>{fr ? `Prochaine prière · ${city}` : `الصلاة القادمة · ${city}`}</div>
      {prayerLoading ? <Skeleton width="60%" height={28}/> : nextPrayer ? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontFamily: 'Fraunces, serif', fontSize: 28, color: t.ink }}>{fr ? nextPrayer.name : nextPrayer.nameAr}</span>
            <span style={{ fontSize: 15, color: t.accent, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{nextPrayer.time}</span>
          </div>
          <div style={{ fontSize: 13, color: t.inkMute }}>
            {fr ? 'dans ' : 'بعد '}{Math.floor(nextPrayer.minsLeft / 60) > 0 ? `${Math.floor(nextPrayer.minsLeft / 60)} h ` : ''}{nextPrayer.minsLeft % 60} min
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 4, marginTop: 4 }}>
            {prayerTimes.map(p => {
              const on = p.name === nextPrayer.name;
              return (
                <div key={p.name} style={{ textAlign: 'center', padding: '6px 0', borderRadius: 10, background: on ? `${t.accent}18` : 'transparent' }}>
                  <div style={{ fontSize: 11, color: on ? t.accent : t.inkMute, fontWeight: on ? 600 : 400 }}>{fr ? p.name : p.nameAr}</div>
                  <div style={{ fontSize: 12, color: t.ink, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>{p.time}</div>
                </div>
              );
            })}
          </div>
        </>
      ) : <div style={{ fontSize: 14, color: t.inkDim }}>{fr ? 'Horaires indisponibles pour le moment.' : 'المواقيت غير متاحة حالياً.'}</div>}
    </div>
  ) : (
    <button onClick={() => onNavigate?.('settings')}
      style={{ ...card, padding: 20, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: fr ? 'left' : 'right', color: t.ink }}>
      <span style={{ width: 40, height: 40, borderRadius: 12, background: `${t.accent}16`, color: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon d={Icons.moon} size={18}/></span>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{fr ? 'Horaires de prière' : 'مواقيت الصلاة'}</span>
        <span style={{ display: 'block', fontSize: 13, color: t.inkMute, marginTop: 2 }}>{fr ? 'Ajoute ta ville dans les réglages pour les afficher ici.' : 'أضف مدينتك في الإعدادات.'}</span>
      </span>
    </button>
  );

  const Week = (
    <div style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={eyebrow}>{fr ? 'Ta semaine' : 'أسبوعك'}</span>
        <button onClick={() => onNavigate?.('calendar')} style={{ background: 'none', border: 'none', color: t.accent, fontSize: 13, cursor: 'pointer', padding: 0 }}>{fr ? 'Calendrier' : 'التقويم'}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
        {week.map((d, i) => (
          <div key={d.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: d.today ? t.accent : t.inkMute, fontWeight: d.today ? 600 : 400, textTransform: 'uppercase' }}>{d.label}</span>
            <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15 + i * 0.04, type: 'spring', stiffness: 260, damping: 18 }}
              title={`${d.prayers}/5`}
              style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: d.prayers >= 5 ? t.accent : d.prayers > 0 ? `${t.accent}26` : 'transparent',
                border: `1.5px ${d.prayers ? 'solid' : 'dashed'} ${d.prayers ? t.accent : t.line}`,
                outline: d.today ? `2px solid ${t.accent}40` : 'none', outlineOffset: 2 }}>
              {d.prayers >= 5 ? <Icon d={Icons.check} size={14} stroke={2.6} color="#1a0f00"/> : d.prayers > 0 ? <span style={{ fontSize: 11, color: t.accent, fontWeight: 600 }}>{d.prayers}</span> : null}
            </motion.span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: t.inkMute }}>{fr ? 'Prières notées chaque jour' : 'الصلوات المسجلة كل يوم'}</div>
    </div>
  );

  const VerseCard = (
    <button onClick={() => setShowTr(v => !v)} aria-expanded={showTr}
      style={{ ...card, padding: 22, display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer', textAlign: fr ? 'left' : 'right', color: t.ink }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span style={eyebrow}>{fr ? 'Verset du jour' : 'آية اليوم'}</span>
        <span style={{ fontSize: 12, color: t.accent }}>{verse?.ref}</span>
      </div>
      {verse ? (
        <>
          <p lang="ar" style={{ margin: 0, fontFamily: "'Amiri Quran', Amiri, serif", fontSize: isMobile ? 24 : 28, lineHeight: 2, direction: 'rtl', textAlign: 'right' }}>{verse.ar}</p>
          <AnimatePresence initial={false}>
            {showTr
              ? <motion.p key="tr" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ margin: 0, fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 16, color: t.inkDim, lineHeight: 1.5, overflow: 'hidden' }}>{verse.fr}</motion.p>
              : <motion.span key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ fontSize: 12, color: t.inkMute }}>{fr ? 'Touche pour la traduction' : 'انقر للترجمة'}</motion.span>}
          </AnimatePresence>
        </>
      ) : <Skeleton width="80%" height={28}/>}
    </button>
  );

  return (
    <div style={{ height: '100%', overflowY: 'auto', direction: fr ? 'ltr' : 'rtl' }} className="no-scrollbar">
      <div style={{ padding: isMobile ? '18px 14px 100px' : narrow ? '18px 16px 24px' : '28px 28px 32px', display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1180, margin: '0 auto' }}>

        {Hero}

        {narrow ? (
          <>
            {Session}
            {Stats}
            {Explore}
            {Prayer}
            {Week}
            {VerseCard}
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 5fr)', gap: 18, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {Session}
              {Explore}
              {VerseCard}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {Stats}
              {Prayer}
              {Week}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
