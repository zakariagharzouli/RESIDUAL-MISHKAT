import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { UserData, BADGE_DEFINITIONS } from '../types';
import { getTimeSinceUnlock } from '../lib/badgeEngine';
import { CATEGORIES, MATERIALS, Rarity, TrophyCategory, trophyCategory, trophyProgress } from '../lib/trophies';
import { useT } from '../lib/theme';
import { AnimatedNumber, PageHeader, useIsNarrow } from './ui';
import { TrophyMedal } from './Trophy';

interface BadgesSectionProps {
  userData: UserData;
  lang: 'fr' | 'ar';
}

type Row = (typeof BADGE_DEFINITIONS)[number] & { unlockedAt?: number; done: boolean; cur: number; goal: number; cat: TrophyCategory };

const RARITIES: Rarity[] = ['common', 'rare', 'epic', 'legendary'];
const fmt = (n: number) => n.toLocaleString('fr-FR');

export const BadgesSection = ({ userData, lang }: BadgesSectionProps) => {
  const t = useT();
  const narrow = useIsNarrow();
  const fr = lang === 'fr';
  const [cat, setCat] = useState<TrophyCategory | 'all'>('all');
  const [open, setOpen] = useState<Row | null>(null);

  const rows: Row[] = useMemo(() => BADGE_DEFINITIONS.map(def => {
    const owned = userData.badges.find(b => b.id === def.id);
    const p = trophyProgress(userData, def.id) ?? [owned ? 1 : 0, 1];
    return { ...def, unlockedAt: owned?.unlockedAt, done: !!owned, cur: p[0], goal: p[1], cat: trophyCategory(def.id) };
  }), [userData]);

  const total = rows.length;
  const owned = rows.filter(r => r.done).length;
  const pct = total ? owned / total : 0;
  const almost = rows.filter(r => !r.done && r.cur > 0).sort((a, b) => b.cur / b.goal - a.cur / a.goal).slice(0, 3);
  const shown = rows.filter(r => cat === 'all' || r.cat === cat)
    .sort((a, b) => Number(b.done) - Number(a.done) || RARITIES.indexOf(a.rarity) - RARITIES.indexOf(b.rarity));

  const card: React.CSSProperties = { background: t.card, border: `1px solid ${t.line}`, borderRadius: 20 };
  const C = 2 * Math.PI * 44;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, direction: fr ? 'ltr' : 'rtl' }}>
      <PageHeader
        eyebrow={fr ? `${owned} sur ${total} obtenus` : `${owned} من ${total}`}
        title={fr ? 'Trophées' : 'الأوسمة'}
      />

      {/* ── Résumé ── */}
      <div style={{ display: 'grid', gridTemplateColumns: narrow ? 'minmax(0, 1fr)' : 'minmax(0, 5fr) minmax(0, 7fr)', gap: 14 }}>
        <div style={{ ...card, padding: 22, display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ position: 'relative', width: 104, height: 104, flexShrink: 0 }}>
            <svg width="104" height="104" viewBox="0 0 104 104" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
              <circle cx="52" cy="52" r="44" fill="none" stroke={t.lineSoft} strokeWidth="8"/>
              <motion.circle cx="52" cy="52" r="44" fill="none" stroke={t.accent} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - pct) }}
                transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}/>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: 30, color: t.ink, lineHeight: 1 }}><AnimatedNumber value={owned}/></span>
              <span style={{ fontSize: 11, color: t.inkMute, marginTop: 2 }}>/ {total}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px 18px', flex: 1, minWidth: 0 }}>
            {RARITIES.map(r => {
              const n = rows.filter(x => x.rarity === r && x.done).length;
              const of = rows.filter(x => x.rarity === r).length;
              return (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <TrophyMedal icon="Star" rarity={r} unlocked size={34}/>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{fr ? MATERIALS[r].fr : MATERIALS[r].ar}</div>
                    <div style={{ fontSize: 12, color: t.inkMute, fontVariantNumeric: 'tabular-nums' }}>{n} / {of}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ ...card, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500 }}>
            {fr ? 'Presque à toi' : 'قريب منك'}
          </div>
          {almost.length === 0 && (
            <div style={{ fontSize: 14, color: t.inkDim }}>{fr ? 'Mémorise ta première sourate pour lancer ta collection.' : 'احفظ سورتك الأولى لتبدأ مجموعتك.'}</div>
          )}
          {almost.map(r => (
            <button key={r.id} onClick={() => setOpen(r)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: fr ? 'left' : 'right', width: '100%', padding: 0, background: 'none', border: 'none', cursor: 'pointer', color: t.ink }}>
              <TrophyMedal icon={r.icon} rarity={r.rarity} unlocked={false} size={40}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 14 }}>
                  <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fr ? r.title : r.titleAr}</span>
                  <span style={{ color: t.inkMute, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{fmt(r.cur)} / {fmt(r.goal)}</span>
                </div>
                <div style={{ height: 6, borderRadius: 6, background: t.lineSoft, marginTop: 6, overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(r.cur / r.goal) * 100}%` }} transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                    style={{ height: '100%', borderRadius: 6, background: MATERIALS[r.rarity].mid }}/>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Catégories ── */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }} className="no-scrollbar">
        {[{ id: 'all' as const, fr: 'Tous', ar: 'الكل' }, ...CATEGORIES].map(c => {
          const on = cat === c.id;
          return (
            <button key={c.id} onClick={() => setCat(c.id)}
              style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                background: on ? t.ink : t.card, color: on ? t.bg : t.inkDim, border: `1px solid ${on ? t.ink : t.line}`, transition: 'background .2s, color .2s' }}>
              {fr ? c.fr : c.ar}
            </button>
          );
        })}
      </div>

      {/* ── Collection ── */}
      <motion.div layout style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${narrow ? 104 : 132}px, 1fr))`, gap: 10 }}>
        <AnimatePresence initial={false}>
          {shown.map((r, i) => (
            <motion.button key={r.id} layout onClick={() => setOpen(r)}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, delay: Math.min(i, 18) * 0.02 }}
              whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
              style={{ ...card, borderRadius: 18, padding: '16px 10px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', color: t.ink,
                borderColor: r.done ? `${MATERIALS[r.rarity].mid}55` : t.line }}>
              <div style={{ opacity: r.done ? 1 : 0.75 }}><TrophyMedal icon={r.icon} rarity={r.rarity} unlocked={r.done} size={narrow ? 60 : 72}/></div>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.25, textAlign: 'center', color: r.done ? t.ink : t.inkDim }}>{fr ? r.title : r.titleAr}</div>
              {r.done ? (
                <div style={{ fontSize: 11.5, color: MATERIALS[r.rarity].mid, fontWeight: 600 }}>{fr ? MATERIALS[r.rarity].fr : MATERIALS[r.rarity].ar}</div>
              ) : (
                <div style={{ width: '82%' }}>
                  <div style={{ height: 4, borderRadius: 4, background: t.lineSoft, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(r.cur / r.goal) * 100}%`, background: MATERIALS[r.rarity].mid, borderRadius: 4 }}/>
                  </div>
                  <div style={{ fontSize: 11, color: t.inkMute, marginTop: 4, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.cur)} / {fmt(r.goal)}</div>
                </div>
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* ── Détail ── */}
      <AnimatePresence>
        {open && (
          <motion.div key="sheet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(16,11,4,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: narrow ? 'flex-end' : 'center', justifyContent: 'center', padding: narrow ? 0 : 20 }}>
            <motion.div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={fr ? open.title : open.titleAr}
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              style={{ ...card, width: '100%', maxWidth: 420, borderRadius: narrow ? '24px 24px 0 0' : 24, padding: `28px 24px ${narrow ? 'calc(28px + env(safe-area-inset-bottom, 0px))' : '28px'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10, direction: fr ? 'ltr' : 'rtl' }}>
              <motion.div initial={{ rotateY: 90, scale: 0.8 }} animate={{ rotateY: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 14 }}>
                <TrophyMedal icon={open.icon} rarity={open.rarity} unlocked={open.done} size={140}/>
              </motion.div>
              <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, color: MATERIALS[open.rarity].mid }}>
                {fr ? MATERIALS[open.rarity].fr : MATERIALS[open.rarity].ar} · {fr ? CATEGORIES.find(c => c.id === open.cat)?.fr : CATEGORIES.find(c => c.id === open.cat)?.ar}
              </div>
              <h2 style={{ margin: 0, fontFamily: 'Fraunces, serif', fontWeight: 400, fontSize: 26, color: t.ink }}>{fr ? open.title : open.titleAr}</h2>
              <p style={{ margin: 0, fontSize: 15, color: t.inkDim, lineHeight: 1.55 }}>{fr ? open.description : open.descriptionAr}</p>
              {open.done ? (
                <div style={{ marginTop: 6, fontSize: 13, color: t.inkMute }}>
                  {fr ? 'Obtenu' : 'حصلت عليه'}{open.unlockedAt ? ` · ${getTimeSinceUnlock(open.unlockedAt, lang).toLowerCase()}` : ''}
                </div>
              ) : (
                <div style={{ width: '100%', marginTop: 8 }}>
                  <div style={{ height: 8, borderRadius: 8, background: t.lineSoft, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(open.cur / open.goal) * 100}%` }} transition={{ duration: 0.8 }}
                      style={{ height: '100%', borderRadius: 8, background: MATERIALS[open.rarity].mid }}/>
                  </div>
                  <div style={{ fontSize: 13, color: t.inkMute, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(open.cur)} / {fmt(open.goal)} · {fr ? `encore ${fmt(open.goal - open.cur)}` : `باقي ${fmt(open.goal - open.cur)}`}
                  </div>
                </div>
              )}
              <button onClick={() => setOpen(null)}
                style={{ marginTop: 12, width: '100%', padding: '13px', borderRadius: 14, border: `1px solid ${t.line}`, background: t.bgSoft, color: t.ink, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                {fr ? 'Fermer' : 'إغلاق'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
