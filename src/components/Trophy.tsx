import React, { useEffect, useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '../types';
import { MATERIALS, Rarity } from '../lib/trophies';
import { celebrateBadgeUnlock } from '../lib/badgeEngine';
import { useT } from '../lib/theme';
import { Icons } from './ui';

export const TROPHY_ICONS: Record<string, React.ReactNode> = {
  star: Icons.star, flame: Icons.flame, sparkle: Icons.sparkle, moon: Icons.moon,
  book: Icons.book, beads: Icons.beads, pen: Icons.pen, palette: Icons.palette,
  badge: Icons.badge, trophy: Icons.trophy, heart: Icons.heart, check: Icons.check,
  Star: Icons.star, Flame: Icons.flame, Sparkles: Icons.sparkle, Moon: Icons.moon, MoonStar: Icons.moonStar,
  BookOpen: Icons.book, BookText: Icons.book, Bookmark: Icons.bookmark,
  Trophy: Icons.trophy, Award: Icons.badge, Medal: Icons.badge, Crown: Icons.star,
  Gem: Icons.sparkle, Heart: Icons.heart, Flag: Icons.target, Target: Icons.target,
  ClipboardCheck: Icons.check, NotebookPen: Icons.pen, Palette: Icons.palette,
  Paintbrush: Icons.palette, Zap: Icons.flame, Calendar: Icons.calendar,
  CalendarDays: Icons.calendar, Shield: Icons.shield, TrendingUp: Icons.chart,
};

const starPath = (cx: number, cy: number, R: number, r: number, n: number) => {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 ? r : R;
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
};

const SHAPES: Record<Rarity, string> = {
  common:    'M60 16a40 40 0 1 1 0 80a40 40 0 1 1 0-80Z',
  rare:      starPath(60, 56, 45, 37, 8),
  epic:      starPath(60, 56, 47, 38, 8),
  legendary: starPath(60, 56, 49, 42, 12),
};

interface MedalProps { icon: string; rarity: Rarity; unlocked: boolean; size?: number; }

/** Médaille d'un trophée : la forme et la matière disent sa rareté. */
export const TrophyMedal = ({ icon, rarity, unlocked, size = 72 }: MedalProps) => {
  const t = useT();
  const uid = useId().replace(/:/g, '');
  const m = MATERIALS[rarity] ?? MATERIALS.common;
  const face = unlocked ? `url(#${uid}g)` : t.cardElev;
  const rim = unlocked ? m.dark : t.line;
  const glyph = unlocked ? m.ink : t.inkMute;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" style={{ flexShrink: 0, overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${uid}g`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor={m.light}/>
          <stop offset="0.55" stopColor={m.mid}/>
          <stop offset="1" stopColor={m.dark}/>
        </linearGradient>
        <radialGradient id={`${uid}h`}>
          <stop offset="0" stopColor={m.light} stopOpacity="0.55"/>
          <stop offset="1" stopColor={m.light} stopOpacity="0"/>
        </radialGradient>
      </defs>
      {unlocked && rarity === 'legendary' && <circle cx="60" cy="56" r="58" fill={`url(#${uid}h)`}/>}
      {/* rubans */}
      <path d="M44 84L34 116L45 110L52 119L60 90Z" fill={unlocked ? m.dark : t.line}/>
      <path d="M76 84L86 116L75 110L68 119L60 90Z" fill={unlocked ? m.mid : t.lineSoft}/>
      <path d={SHAPES[rarity]} fill={face} stroke={rim} strokeWidth={unlocked ? 1.5 : 2} strokeDasharray={unlocked ? undefined : '4 4'} strokeLinejoin="round"/>
      {unlocked && rarity === 'legendary' && <path d={starPath(60, 56, 44, 38, 12)} fill="none" stroke={MATERIALS.epic.light} strokeWidth="1.5"/>}
      <circle cx="60" cy="56" r="27" fill={unlocked ? m.dark : 'none'} fillOpacity={unlocked ? 0.28 : 0} stroke={unlocked ? m.light : t.line} strokeOpacity={unlocked ? 0.7 : 1} strokeWidth="1.2"/>
      {unlocked && rarity === 'epic' && <circle cx="60" cy="56" r="33" fill="none" stroke={m.light} strokeOpacity="0.8" strokeWidth="1" strokeDasharray="1.5 4"/>}
      {unlocked && <path d="M33 40C37 30 46 23 57 21" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="4" strokeLinecap="round"/>}
      <svg x="43" y="39" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={glyph} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {unlocked ? (TROPHY_ICONS[icon] ?? Icons.star) : Icons.lock}
      </svg>
    </svg>
  );
};

interface OverlayProps { badges: Badge[]; lang: 'fr' | 'ar'; onDone: () => void; }

/** Célébration plein écran d'un ou plusieurs trophées, quel que soit l'écran ouvert. */
export const TrophyUnlockOverlay = ({ badges, lang, onDone }: OverlayProps) => {
  const t = useT();
  const fr = lang === 'fr';
  const [i, setI] = useState(0);
  const b = badges[i];

  useEffect(() => { if (b) celebrateBadgeUnlock(b); }, [b]);
  if (!b) return null;
  const m = MATERIALS[b.rarity] ?? MATERIALS.common;
  const last = i === badges.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
      role="dialog" aria-modal="true" aria-label={fr ? 'Nouveau trophée' : 'وسام جديد'}
      style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(12,9,4,0.78)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, direction: fr ? 'ltr' : 'rtl' }}>
      <AnimatePresence mode="wait">
        <motion.div key={b.id}
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10, color: '#F6EEDC' }}>
          <div style={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="mk-rays" style={{ position: 'absolute', inset: -70, borderRadius: '50%', background: `repeating-conic-gradient(from 0deg, ${m.light}38 0deg 7deg, transparent 7deg 20deg)`, WebkitMaskImage: 'radial-gradient(circle, #000 18%, transparent 66%)', maskImage: 'radial-gradient(circle, #000 18%, transparent 66%)' }}/>
            <motion.div
              initial={{ scale: 0.2, rotateY: 540, opacity: 0 }} animate={{ scale: 1, rotateY: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 90, damping: 13, mass: 0.9 }}
              style={{ perspective: 800 }}>
              <TrophyMedal icon={b.icon} rarity={b.rarity} unlocked size={190}/>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, color: m.light }}>
            {fr ? `Nouveau trophée · ${m.fr}` : `وسام جديد · ${m.ar}`}
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            style={{ margin: 0, fontFamily: 'Fraunces, serif', fontWeight: 400, fontSize: 32, lineHeight: 1.1 }}>
            {fr ? b.title : b.titleAr}
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: 'rgba(246,238,220,0.78)', maxWidth: 300 }}>
            {fr ? b.description : b.descriptionAr}
          </motion.p>
          <motion.button className="mk-shine" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}
            onClick={() => (last ? onDone() : setI(i + 1))}
            style={{ marginTop: 14, minWidth: 220, padding: '14px 24px', borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 15, color: '#1a0f00', background: `linear-gradient(180deg, ${MATERIALS.epic.light}, ${t.accent})`, boxShadow: `0 10px 30px -10px ${m.mid}` }}>
            {last ? (fr ? 'Bârak Allâhu fîk' : 'بارك الله فيك') : (fr ? `Suivant · ${i + 2}/${badges.length}` : `التالي · ${i + 2}/${badges.length}`)}
          </motion.button>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
