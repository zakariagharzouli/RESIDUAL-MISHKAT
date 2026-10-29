import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { UserData } from '../types';
import { useT } from '../lib/theme';
import { Icon, Icons, useIsNarrow, useIsMobile, AnimatedNumber } from './ui';
import { Skeleton, SkeletonCard } from './Skeleton';

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
      { name: 'Fajr',    nameAr: 'الفجر',   time: t.Fajr    },
      { name: 'Dhuhr',   nameAr: 'الظهر',   time: t.Dhuhr   },
      { name: 'Asr',     nameAr: 'العصر',   time: t.Asr     },
      { name: 'Maghrib', nameAr: 'المغرب',  time: t.Maghrib },
      { name: 'Isha',    nameAr: 'العشاء',  time: t.Isha    },
    ];
  } catch { return []; }
}

async function fetchVerseOfDay(): Promise<{ ar: string; fr: string; ref: string; surahName: string; verseNum: number } | null> {
  try {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const verseNum = (dayOfYear % 6236) + 1;
    const [arRes, frRes] = await Promise.all([
      fetch(`https://api.alquran.cloud/v1/ayah/${verseNum}/ar.alafasy`),
      fetch(`https://api.alquran.cloud/v1/ayah/${verseNum}/fr.hamidullah`),
    ]);
    const [arData, frData] = await Promise.all([arRes.json(), frRes.json()]);
    if (arData.code !== 200) return null;
    return {
      ar: arData.data.text,
      fr: frData.data.text,
      ref: `${arData.data.surah.englishName} · ${arData.data.surah.number}:${arData.data.numberInSurah}`,
      surahName: arData.data.surah.englishName,
      verseNum: arData.data.numberInSurah,
    };
  } catch { return null; }
}

const FALLBACK_VERSE = {
  ar: 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ',
  fr: 'Lis, au nom de ton Seigneur qui a créé.',
  ref: 'Al-ʿAlaq · 96:1',
  surahName: 'Al-ʿAlaq',
  verseNum: 1,
};

const Ring = ({ pct, size = 100, stroke = 5, color }: { pct: number; size?: number; stroke?: number; color: string }) => {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} opacity={0.12}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"/>
    </svg>
  );
};

export const Dashboard = ({ userData, lang, onNavigate }: { userData: UserData; lang: string; onNavigate?: (section: string) => void }) => {
  const t = useT();
  const narrow = useIsNarrow();
  const isMobile = useIsMobile();
  const fr = lang === 'fr';

  const memorizedCount  = userData.surahs.filter(s => s.status === 'memorized').length;
  const inProgressSurah = userData.surahs.find(s => s.status === 'in_progress') ?? null;
  const reviewSurahs    = userData.surahs.filter(s => s.status === 'review').slice(0, 5);
  const totalVersets    = userData.surahs.filter(s => s.status === 'memorized').reduce((acc, s) => acc + s.verses, 0);
  const streak          = userData.loginStreak || 1;
  const username        = userData.settings?.username || 'Hafiz';
  const city            = userData.settings?.city;

  const [verse, setVerse]             = useState<typeof FALLBACK_VERSE | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [nowTime, setNowTime]         = useState(new Date());
  const [verseLoading, setVerseLoading]       = useState(true);
  const [prayerLoading, setPrayerLoading]     = useState(!!city);
  const [verseFlipped, setVerseFlipped]       = useState(false);
  const [pullY, setPullY]             = useState(0);
  const [pulling, setPulling]         = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const resumePos = loadQuranPosition();

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setVerseLoading(true);
    if (city) setPrayerLoading(true);
    await Promise.all([
      fetchVerseOfDay().then(v => { setVerse(v ?? FALLBACK_VERSE); setVerseLoading(false); }),
      city ? fetchPrayerTimes(city).then(p => { setPrayerTimes(p); setPrayerLoading(false); }) : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [city]);

  useEffect(() => {
    fetchVerseOfDay().then(v => { setVerse(v ?? FALLBACK_VERSE); setVerseLoading(false); });
  }, []);
  useEffect(() => {
    if (city) fetchPrayerTimes(city).then(p => { setPrayerTimes(p); setPrayerLoading(false); });
  }, [city]);

  // Pull-to-refresh touch handlers
  const touchStartY = React.useRef(0);
  const onTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const onTouchMove  = (e: React.TouchEvent) => {
    const el = e.currentTarget as HTMLElement;
    if (el.scrollTop > 0) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0) { setPulling(true); setPullY(Math.min(dy * 0.4, 60)); }
  };
  const onTouchEnd = () => {
    if (pullY > 45) refresh();
    setPulling(false); setPullY(0);
  };
  useEffect(() => {
    const id = setInterval(() => setNowTime(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

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

  const dateStr = new Date().toLocaleDateString(fr ? 'fr-FR' : 'ar-EG', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  // Monthly progress — calendar entries this month
  const now = new Date();
  const monthSessions = userData.calendar.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthTarget = 30;

  // Verse tiles for in-progress surah
  const tiles = inProgressSurah
    ? Array.from({ length: Math.min(inProgressSurah.verses, 40) }, (_, i) => {
        const ratio = inProgressSurah.verses > 0 ? i / inProgressSurah.verses : 0;
        if (ratio < 0.4)  return 'memorized';
        if (ratio < 0.55) return 'progress';
        return 'none';
      })
    : [];

  const card: React.CSSProperties = {
    background: t.card, border: `1px solid ${t.line}`, borderRadius: 12,
  };

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%', overflowY: 'auto', transform: `translateY(${pullY}px)`, transition: pulling ? 'none' : 'transform 0.3s ease' }}
      className="no-scrollbar"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {(pulling || refreshing) && (
        <div style={{ position: 'absolute', top: -40, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 40 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${t.accent}`, borderTopColor: 'transparent', animation: refreshing ? 'spin 0.7s linear infinite' : 'none', transform: `rotate(${pullY * 3}deg)`, transition: 'transform 0.05s' }}/>
        </div>
      )}
      <div style={{ padding: isMobile ? '16px 14px 100px' : narrow ? '16px 16px 24px' : '26px 28px 24px', display: 'flex', flexDirection: 'column', gap: 20, minHeight: '100%' }}>

        {/* ── Header ─────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: t.inkMute, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 6 }}>
              {dateStr}
            </div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 32, margin: 0, color: t.ink, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {fr ? `As-salāmu ʿalaykum,` : 'السلام عليك،'}<br/>
              <span style={{ color: t.accent }}>{username}</span>
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginTop: 4 }}>
            <motion.button whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.06, transition: { duration: 0.12 } }} onClick={() => onNavigate?.('memorization')} style={{ width: 36, height: 36, borderRadius: 8, background: t.card, border: `1px solid ${t.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.inkMute, cursor: 'pointer' }}>
              <Icon d={Icons.search} size={14}/>
            </motion.button>
            <motion.button whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.06, transition: { duration: 0.12 } }} onClick={() => onNavigate?.('settings')} style={{ width: 36, height: 36, borderRadius: 8, background: t.card, border: `1px solid ${t.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.inkMute, cursor: 'pointer' }}>
              <Icon d={Icons.bell} size={14}/>
            </motion.button>
            <motion.button whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.06, transition: { duration: 0.12 } }} onClick={() => onNavigate?.('settings')} style={{ width: 36, height: 36, borderRadius: 8, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, serif', fontSize: 16, color: '#1a0f00', fontWeight: 400, border: 'none', cursor: 'pointer' }}>
              {username.charAt(0).toUpperCase()}
            </motion.button>
          </div>
        </div>

        {/* ── Stats tiles row ────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: narrow ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { icon: Icons.flame,    value: streak,        suffix: '',    label: fr ? 'Jours de suite'    : 'يوم متواصل', to: 'calendar',     shimmer: true },
            { icon: Icons.book,     value: totalVersets,  suffix: '',    label: fr ? 'Versets mémorisés' : 'آية محفوظة', to: 'memorization', shimmer: false },
            { icon: Icons.bookmark, value: memorizedCount, suffix: '/114', label: fr ? 'Sourates'        : 'سورة',       to: 'memorization', shimmer: false },
            { icon: Icons.badge,    value: userData.badges?.filter(b => b.unlockedAt).length ?? 0, suffix: '', label: fr ? 'Trophées' : 'وسام', to: 'badges', shimmer: false },
          ].map((s, i) => (
            <motion.button
              key={i}
              onClick={() => onNavigate?.(s.to)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.97 }}
              className={s.shimmer ? 'anim-shimmer' : ''}
              style={{ ...card, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left', color: t.ink }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${t.accent}16`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon d={s.icon} size={18} color={t.accent}/>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 26, color: t.ink, fontWeight: 360, lineHeight: 1 }}>
                  <AnimatedNumber value={s.value}/>{s.suffix && <span style={{ fontSize: 15, color: t.inkMute }}>{s.suffix}</span>}
                </div>
                <div style={{ fontSize: 12, color: t.inkMute, marginTop: 5 }}>{s.label}</div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* ── Main 2-column grid ─────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : 'minmax(0,2fr) minmax(0,1fr)', gap: 14 }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Resume Quran reading card */}
            {resumePos && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2, scale: 1.005, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.97 }}
                style={{ ...card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', background: `linear-gradient(135deg, ${t.accent}0e, ${t.card})` }}
                onClick={() => onNavigate?.('quran')}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon d={Icons.bookmark} size={16} color="#1a0f00"/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 9, color: t.accentBright, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>
                    {fr ? 'Reprendre la lecture' : 'متابعة القراءة'}
                  </div>
                  <div style={{ fontSize: 13, color: t.ink, fontWeight: 600, marginTop: 2 }}>
                    {resumePos.surahName} · v.{resumePos.ayah}
                  </div>
                </div>
                <Icon d={Icons.arrow} size={14} color={t.inkMute}/>
              </motion.div>
            )}

            {/* Hero card — verse du jour avec flip card */}
            <div className="anim-souffle anim-d2" style={{ ...card, padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${t.accent}0d, transparent 60%)`, pointerEvents: 'none' }}/>

              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ fontSize: 9, color: t.inkMute, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
                    {inProgressSurah
                      ? (fr ? `À reprendre · ${inProgressSurah.name}` : `للمتابعة · ${inProgressSurah.arabicName}`)
                      : (fr ? 'Verset du jour — cliquer pour la traduction' : 'آية اليوم — انقر للترجمة')
                    }
                  </div>
                  {inProgressSurah && (
                    <div style={{ padding: '3px 10px', borderRadius: 999, background: `${t.accent}22`, border: `1px solid ${t.accent}44`, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: t.accent }}>
                      {fr ? 'EN COURS' : 'قيد الحفظ'}
                    </div>
                  )}
                </div>

                {verseLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
                    <div className="skeleton-line lg" style={{ width: '90%' }}/>
                    <div className="skeleton-line" style={{ width: '75%' }}/>
                    <div className="skeleton-line sm" style={{ width: '50%' }}/>
                  </div>
                ) : (
                  <div
                    className={`flip-container${verseFlipped ? ' is-flipped' : ''}`}
                    onClick={() => setVerseFlipped(f => !f)}
                    title={verseFlipped ? (fr ? 'Voir l\'arabe' : 'عرض العربية') : (fr ? 'Voir la traduction' : 'عرض الترجمة')}
                  >
                    <div className="flip-inner">
                      {/* RECTO — texte arabe */}
                      <div className="flip-front">
                        <div style={{ fontFamily: 'Amiri Quran, serif', fontSize: 24, color: t.ink, lineHeight: 1.9, direction: 'rtl', textAlign: 'right' }}>
                          {verse?.ar}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                          <div style={{ fontSize: 9.5, color: t.accentBright, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                            {verse?.ref}
                          </div>
                          <div style={{ fontSize: 9, color: t.inkMute, letterSpacing: '0.1em' }}>
                            {fr ? 'Cliquer pour traduction →' : '← انقر للترجمة'}
                          </div>
                        </div>
                      </div>
                      {/* VERSO — traduction */}
                      <div className="flip-back">
                        <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 300, fontSize: 14, color: t.ink, lineHeight: 1.8 }}>
                          « {verse?.fr} »
                        </div>
                        <div style={{ fontSize: 9.5, color: t.accentBright, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 10 }}>
                          {verse?.ref}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
                  <motion.button
                    whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.04, transition: { duration: 0.12 } }}
                    onClick={() => onNavigate?.('memorization')}
                    style={{ padding: '9px 18px', borderRadius: 8, background: t.accent, color: '#1a0f00', fontFamily: 'Inter', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', border: 'none' }}>
                    {fr ? 'Mémorisation' : 'الحفظ'} <Icon d={Icons.arrow} size={12}/>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.04, transition: { duration: 0.12 } }}
                    onClick={() => onNavigate?.('kanban')}
                    style={{ padding: '9px 14px', borderRadius: 8, background: t.cardElev, border: `1px solid ${t.line}`, color: t.inkDim, fontFamily: 'Inter', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <Icon d={Icons.grid} size={12}/> {fr ? 'Kanban' : 'كانبان'}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.04, transition: { duration: 0.12 } }}
                    onClick={() => onNavigate?.('diftar')}
                    style={{ padding: '9px 14px', borderRadius: 8, background: t.cardElev, border: `1px solid ${t.line}`, color: t.inkDim, fontFamily: 'Inter', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <Icon d={Icons.edit} size={12}/> {fr ? 'Diftar' : 'الدفتر'}
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Sourate en cours */}
            {inProgressSurah && (
              <div style={{ ...card, padding: '18px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 9.5, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4 }}>
                      {fr ? 'Sourate en cours' : 'السورة الحالية'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span style={{ fontFamily: 'Fraunces, serif', fontSize: 17, color: t.ink, fontWeight: 300 }}>{inProgressSurah.name}</span>
                      <span style={{ fontFamily: 'Amiri Quran, serif', fontSize: 15, color: t.accentBright }}>{inProgressSurah.arabicName}</span>
                      <span style={{ fontSize: 11, color: t.inkMute }}>{Math.round(tiles.filter(x => x === 'memorized').length / Math.max(tiles.length, 1) * inProgressSurah.verses)}/{inProgressSurah.verses} {fr ? 'versets' : 'آية'}</span>
                    </div>
                  </div>
                  <button style={{ fontSize: 11, color: t.accentBright, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Inter' }}>
                    {fr ? 'Voir tout' : 'عرض الكل'}
                  </button>
                </div>

                {/* Verse tiles */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {tiles.map((status, i) => (
                    <div key={i} style={{
                      width: 18, height: 18, borderRadius: 4,
                      background: status === 'memorized' ? t.accent : status === 'progress' ? `${t.accent}40` : t.cardElev,
                      border: `1px solid ${status === 'none' ? t.line : 'transparent'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Fraunces, serif', fontSize: 7, color: status === 'memorized' ? '#1a0f00' : t.inkMute,
                    }}>{i + 1}</div>
                  ))}
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                  {[
                    { color: t.accent, label: fr ? 'Mémorisé' : 'محفوظ' },
                    { color: `${t.accent}40`, label: fr ? 'En cours' : 'قيد الحفظ' },
                    { color: t.cardElev, label: fr ? 'À venir' : 'قادم' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, border: `1px solid ${t.line}` }}/>
                      <span style={{ fontSize: 9.5, color: t.inkMute }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prayer times */}
            {(prayerLoading || prayerTimes.length > 0) && (
              <div style={{ ...card, padding: '18px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 9.5, color: t.accentBright, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                    {fr ? 'Horaires de prière' : 'مواقيت الصلاة'}
                  </div>
                  {city && <div style={{ fontSize: 10, color: t.inkMute }}>{city}</div>}
                </div>
                {prayerLoading ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
                    {[1,2,3,4,5].map(i => <Skeleton key={i} height={52} borderRadius={8}/>)}
                  </div>
                ) : (
                  <>
                    {/* Next prayer ring */}
                    {nextPrayer && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14, padding: '12px 16px', borderRadius: 10, background: `${t.accent}0e`, border: `1px solid ${t.accent}33` }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <Ring pct={(() => {
                            const idx = prayerTimes.findIndex(p => p.name === nextPrayer.name);
                            const prev = prayerTimes[idx > 0 ? idx - 1 : prayerTimes.length - 1];
                            const [ph, pm] = prev.time.split(':').map(Number);
                            const [nh, nm] = nextPrayer.time.split(':').map(Number);
                            const total = ((nh * 60 + nm) - (ph * 60 + pm) + 1440) % 1440;
                            return total > 0 ? Math.max(0, 100 - (nextPrayer.minsLeft / total * 100)) : 0;
                          })()} size={64} stroke={4} color={t.accent}/>
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 9, color: t.accent, fontWeight: 700 }}>
                              {Math.floor(nextPrayer.minsLeft / 60)}h{String(nextPrayer.minsLeft % 60).padStart(2,'0')}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{fr ? 'Prochaine' : 'التالية'}</div>
                          <div style={{ fontSize: 18, color: t.ink, fontFamily: 'Fraunces, serif', fontWeight: 300, lineHeight: 1.2 }}>
                            {fr ? nextPrayer.name : nextPrayer.nameAr}
                          </div>
                          <div style={{ fontSize: 11, color: t.accentBright, marginTop: 2 }}>{nextPrayer.time}</div>
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: narrow ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: 6 }}>
                      {prayerTimes.map(p => {
                        const isNext = nextPrayer?.name === p.name;
                        return (
                          <div key={p.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 4px', borderRadius: 8, background: isNext ? `${t.accent}14` : t.cardElev, border: `1px solid ${isNext ? t.accent : t.line}` }}>
                            <div style={{ fontSize: 9, color: isNext ? t.accent : t.inkMute, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>{fr ? p.name : p.nameAr}</div>
                            <div style={{ fontSize: 11, color: isNext ? t.ink : t.inkDim, fontFamily: 'Fraunces, serif' }}>{p.time}</div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Today card — ring + stats */}
            <div style={{ ...card, padding: '20px 22px' }}>
              <div style={{ fontSize: 9.5, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14 }}>
                {fr ? "Aujourd'hui" : 'اليوم'}
              </div>

              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                {/* Ring */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Ring pct={memorizedCount / 114 * 100} size={90} stroke={5} color={t.accent}/>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, color: t.accent, lineHeight: 1 }}>{memorizedCount}</div>
                    <div style={{ fontSize: 7.5, color: t.inkMute, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{fr ? 'sour.' : 'سور'}</div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { icon: Icons.flame, value: streak, label: fr ? 'jours de suite' : 'يوم متواصل' },
                    { icon: Icons.book,  value: totalVersets, label: fr ? 'versets totaux' : 'آية محفوظة' },
                    { icon: Icons.badge, value: `${memorizedCount}/114`, label: fr ? 'sourates' : 'سورة' },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon d={s.icon} size={12} color={t.accent}/>
                      <span style={{ fontFamily: 'Fraunces, serif', fontSize: 14, color: t.ink, fontWeight: 300 }}>{s.value}</span>
                      <span style={{ fontSize: 10, color: t.inkDim }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Progression mensuelle */}
            <div style={{ ...card, padding: '18px 22px' }}>
              <div style={{ fontSize: 9.5, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>
                {fr ? 'Progression mensuelle' : 'التقدم الشهري'}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
                <span style={{ fontFamily: 'Fraunces, serif', fontSize: 26, color: t.ink, fontWeight: 300 }}>{monthSessions.length}</span>
                <span style={{ fontSize: 12, color: t.inkDim }}>/ {monthTarget} {fr ? 'sessions' : 'جلسة'}</span>
              </div>
              <div style={{ height: 4, background: t.lineSoft, borderRadius: 4, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(monthSessions.length / monthTarget * 100, 100)}%` }}
                  transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                  style={{ height: '100%', background: `linear-gradient(90deg, ${t.accent}, ${t.accentBright})`, borderRadius: 4 }}
                />
              </div>
            </div>

            {/* Prochaine étape */}
            {(() => {
              const nextSurah = userData.surahs.find(s => s.status === 'not_started');
              if (!nextSurah) return null;
              return (
                <div style={{ ...card, padding: '16px 20px' }}>
                  <div style={{ fontSize: 9.5, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>
                    {fr ? 'Prochaine étape' : 'الخطوة التالية'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${t.accent}14`, border: `1px solid ${t.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: 'Fraunces, serif', fontSize: 13, color: t.accent }}>{nextSurah.id}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: t.ink, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nextSurah.name}</div>
                      <div style={{ fontFamily: 'Amiri Quran, serif', fontSize: 13, color: t.accentBright }}>{nextSurah.arabicName}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                      {[1,2,3,4,5].map(star => (
                        <span key={star} style={{ fontSize: 8, color: star <= nextSurah.difficulty ? t.accent : `${t.inkMute}40` }}>★</span>
                      ))}
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.94 }} whileHover={{ scale: 1.02, transition: { duration: 0.12 } }}
                    onClick={() => onNavigate?.('memorization')}
                    style={{ width: '100%', marginTop: 12, padding: '8px 0', borderRadius: 7, background: `${t.accent}18`, border: `1px solid ${t.accent}33`, color: t.accent, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', cursor: 'pointer' }}>
                    {fr ? 'Commencer' : 'ابدأ'}
                  </motion.button>
                </div>
              );
            })()}

            {/* Révisions du jour */}
            <div style={{ ...card, padding: '18px 22px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 9.5, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                  {fr ? 'Révisions du jour' : 'مراجعات اليوم'}
                </div>
                <div style={{ padding: '2px 8px', borderRadius: 10, background: t.cardElev, fontSize: 10, color: t.inkDim }}>{reviewSurahs.length}</div>
              </div>

              {reviewSurahs.length === 0 ? (
                <div style={{ fontSize: 12, color: t.inkMute, textAlign: 'center', padding: '20px 0', fontFamily: 'Fraunces, serif', fontStyle: 'italic' }}>
                  {fr ? 'Aucune révision prévue' : 'لا مراجعات اليوم'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {reviewSurahs.map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: t.cardElev, border: `1px solid ${t.line}` }}
                    >
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: `${t.accent}18`, border: `1px solid ${t.accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'Fraunces, serif', fontSize: 10, color: t.accent }}>{i + 1}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: t.ink, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                          <span style={{ fontFamily: 'Amiri Quran, serif', fontSize: 13, color: t.accentBright, flexShrink: 0, marginLeft: 8 }}>{s.arabicName}</span>
                        </div>
                        <div style={{ fontSize: 9.5, color: t.inkMute, marginTop: 2 }}>{s.verses} {fr ? 'versets' : 'آية'}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
