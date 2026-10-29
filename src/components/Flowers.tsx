import React, { useId, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { UserData } from '../types';
import { useT } from '../lib/theme';
import { FLOWERS, FlowerDef, RARITIES, rarityOdds } from '../lib/flowers';

const rarityOf = (f: FlowerDef) => RARITIES.find(r => r.id === f.rarity)!;

const petalPath = (shape: string, L: number, w: number) => {
  switch (shape) {
    case 'pointed': return `M0 0C${w} ${-L * 0.3} ${w * 0.6} ${-L * 0.9} 0 ${-L}C${-w * 0.6} ${-L * 0.9} ${-w} ${-L * 0.3} 0 0Z`;
    case 'star':    return `M0 0C${w * 0.6} ${-L * 0.35} ${w * 0.3} ${-L * 0.85} 0 ${-L}C${-w * 0.3} ${-L * 0.85} ${-w * 0.6} ${-L * 0.35} 0 0Z`;
    case 'heart':   return `M0 0C${w} ${-L * 0.2} ${w * 1.1} ${-L * 0.85} ${w * 0.35} ${-L}C${w * 0.1} ${-L * 1.02} 0 ${-L * 0.9} 0 ${-L * 0.84}C0 ${-L * 0.9} ${-w * 0.1} ${-L * 1.02} ${-w * 0.35} ${-L}C${-w * 1.1} ${-L * 0.85} ${-w} ${-L * 0.2} 0 0Z`;
    default:        return `M0 0C${w * 1.15} ${-L * 0.1} ${w * 1.15} ${-L} 0 ${-L}C${-w * 1.15} ${-L} ${-w * 1.15} ${-L * 0.1} 0 0Z`;
  }
};

/** Illustration d'une fleur, dessinée à partir de ses paramètres. */
export const FlowerArt = ({ f, size = 80, locked = false, animate = false }: { f: FlowerDef; size?: number; locked?: boolean; animate?: boolean }) => {
  const uid = useId().replace(/:/g, '');
  const c1 = locked ? '#CFC8BC' : f.c1, c2 = locked ? '#B9B1A4' : f.c2, heart = locked ? '#A69D8F' : f.heart;
  const body = useMemo(() => {
    if (f.shape === 'tulip') {
      return (
        <g transform="translate(50 56)">
          <path d="M-20 0C-24-20-16-36-8-32L0-42L8-32C16-36 24-20 20 0C14 12-14 12-20 0Z" fill={c1} stroke={c2} strokeWidth="1.5"/>
          <path d="M0-42C-6-26-6-6 0 8C6-6 6-26 0-42Z" fill={c2} opacity="0.55"/>
        </g>
      );
    }
    if (f.shape === 'bell') {
      return (
        <g>
          <path d="M50 92C49 70 50 40 51 10" stroke="#6E9A62" strokeWidth="2.5" fill="none"/>
          {Array.from({ length: f.petals }, (_, i) => {
            const y = 16 + i * (64 / f.petals), side = i % 2 ? 1 : -1;
            return <g key={i} transform={`translate(${50 + side * 7} ${y}) rotate(${side * 20})`}><path d="M-6-4C-7 4-6 9 0 10C6 9 7 4 6-4C3-7-3-7-6-4Z" fill={i % 2 ? c1 : c2}/></g>;
          })}
        </g>
      );
    }
    const layers = Array.from({ length: f.layers }, (_, li) => {
      const k = 1 - li * 0.22, L = 40 * k, w = (f.shape === 'star' ? 7 : f.shape === 'pointed' ? 10 : 14) * k * (f.petals > 10 ? 0.7 : 1);
      const lotus = f.shape === 'lotus';
      return (
        <g key={li}>
          {Array.from({ length: f.petals }, (_, i) => {
            const a = lotus ? -80 + (160 / (f.petals - 1)) * i : (360 / f.petals) * i + (li % 2 ? 180 / f.petals : 0);
            return <path key={i} d={petalPath(lotus ? 'pointed' : f.shape, lotus ? L * 1.05 : L, lotus ? w * 0.9 : w)} transform={`rotate(${a})`} fill={li % 2 ? c2 : c1} stroke={c2} strokeWidth="0.8" strokeOpacity="0.6"/>;
          })}
        </g>
      );
    });
    return <g transform={`translate(50 ${f.shape === 'lotus' ? 62 : 50})`}>{layers}<circle r={f.shape === 'lotus' ? 6 : 7} fill={heart}/></g>;
  }, [f, c1, c2, heart]);

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ overflow: 'visible', flexShrink: 0 }}>
      <defs>
        <radialGradient id={`${uid}g`}><stop offset="0" stopColor={f.c1} stopOpacity="0.7"/><stop offset="1" stopColor={f.c1} stopOpacity="0"/></radialGradient>
      </defs>
      {f.glow && !locked && (
        <motion.circle cx="50" cy="50" r="50" fill={`url(#${uid}g)`} animate={animate ? { scale: [0.9, 1.08, 0.9], opacity: [0.7, 1, 0.7] } : undefined}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} style={{ originX: '50px', originY: '50px' }}/>
      )}
      {f.shape !== 'bell' && <path d="M50 60C49 74 50 86 50 98" stroke={locked ? '#B9B1A4' : '#6E9A62'} strokeWidth="2.5" fill="none" opacity="0.8"/>}
      {body}
      {locked && <text x="50" y="57" textAnchor="middle" fontSize="20" fontWeight="700" fill="#FFFFFF" fontFamily="Inter, sans-serif">?</text>}
    </svg>
  );
};

/** Fenêtre « Ta fleur du jour » : la fleur éclot, avec sa rareté. */
export const FlowerGiftOverlay = ({ f, reason, count, lang, onClose, onSeeAll }: { f: FlowerDef; reason: 'jour' | 'sourate'; count: number; lang: 'fr' | 'ar'; onClose: () => void; onSeeAll: () => void }) => {
  const t = useT();
  const fr = lang === 'fr';
  const r = rarityOf(f);
  const isNew = count === 1;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      role="dialog" aria-modal="true" aria-label={fr ? 'Ta fleur du jour' : 'زهرة اليوم'}
      style={{ position: 'fixed', inset: 0, zIndex: 9996, background: 'rgba(16,11,4,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, direction: fr ? 'ltr' : 'rtl' }}>
      <motion.div initial={{ y: 30, scale: 0.96, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        style={{ width: '100%', maxWidth: 380, background: t.card, border: `1px solid ${t.line}`, borderRadius: 28, padding: '28px 24px 22px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, boxShadow: `0 30px 80px -30px ${r.color}` }}>
        <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, color: t.inkMute }}>
          {reason === 'sourate' ? (fr ? 'Cadeau pour ta sourate' : 'هدية سورتك') : (fr ? 'Ta fleur du jour' : 'زهرة اليوم')}
        </div>
        <div style={{ position: 'relative', width: 170, height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '6px 0' }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, duration: 0.6 }}
            style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle, ${r.color}33, transparent 70%)` }}/>
          <motion.div initial={{ scale: 0.2, rotate: -40, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ delay: 0.25, type: 'spring', stiffness: 120, damping: 11 }}>
            <FlowerArt f={f} size={150} animate/>
          </motion.div>
        </div>
        <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          style={{ padding: '4px 12px', borderRadius: 999, background: `${r.color}22`, color: r.color, fontSize: 12.5, fontWeight: 700, letterSpacing: '0.06em' }}>
          {fr ? r.fr : r.ar}{isNew ? (fr ? ' · Nouvelle !' : ' · جديدة') : ` · ×${count}`}
        </motion.span>
        <motion.h2 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          style={{ margin: '4px 0 0', fontFamily: 'Fraunces, serif', fontWeight: 400, fontSize: 30, color: t.ink }}>{fr ? f.fr : f.ar}</motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} style={{ margin: 0, fontSize: 14.5, color: t.inkDim, lineHeight: 1.5 }}>{f.noteFr}</motion.p>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: t.inkMute, lineHeight: 1.45 }}>
          {fr ? 'Reviens chaque jour : plus ta série est longue et plus tu mémorises, plus les fleurs sont rares.' : 'عد كل يوم: كلما طالت سلسلتك زادت ندرة الأزهار.'}
        </p>
        <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 12 }}>
          <button onClick={onSeeAll} style={{ flex: 1, height: 46, borderRadius: 14, border: `1px solid ${t.line}`, background: t.bgSoft, color: t.ink, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            {fr ? 'Ma collection' : 'مجموعتي'}
          </button>
          <button className="mk-shine" onClick={onClose} style={{ flex: 1, height: 46, borderRadius: 14, border: 'none', background: t.accent, color: '#1a0f00', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            {fr ? 'Alhamdulillah' : 'الحمد لله'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/** Grille de toutes les fleurs, obtenues ou à découvrir. */
export const FlowerCollection = ({ userData, lang }: { userData: UserData; lang: 'fr' | 'ar' }) => {
  const t = useT();
  const fr = lang === 'fr';
  const got = userData.flowers?.got ?? {};
  const owned = FLOWERS.filter(f => got[f.id]).length;
  const [open, setOpen] = useState<FlowerDef | null>(null);
  const odds = rarityOdds(userData.loginStreak ?? 1, userData.surahs.filter(s => s.status === 'memorized').length);
  const sum = Object.values(odds).reduce((a, b) => a + b, 0);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }} aria-label={fr ? 'Ma collection de fleurs' : 'مجموعة الأزهار'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500 }}>{fr ? `${owned} sur ${FLOWERS.length} découvertes` : `${owned} من ${FLOWERS.length}`}</div>
          <h2 style={{ margin: '6px 0 0', fontFamily: 'Fraunces, serif', fontWeight: 400, fontSize: 26, color: t.ink }}>{fr ? 'Ma collection de fleurs' : 'مجموعة أزهاري'}</h2>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {RARITIES.map(r => (
            <span key={r.id} title={fr ? 'Chance de la recevoir demain' : ''} style={{ fontSize: 12, padding: '5px 10px', borderRadius: 999, background: `${r.color}1c`, color: r.color, fontWeight: 600 }}>
              {fr ? r.fr : r.ar} · {Math.round((odds[r.id] / sum) * 100)} %
            </span>
          ))}
        </div>
      </div>
      <div style={{ height: 8, borderRadius: 8, background: t.lineSoft, overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${(owned / FLOWERS.length) * 100}%` }} transition={{ duration: 0.9 }} style={{ height: '100%', borderRadius: 8, background: `linear-gradient(90deg, #7FA872, #5E9BD6, #B76BC9, #D9A441)` }}/>
      </div>
      {RARITIES.map(r => (
        <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: r.color }}>{fr ? r.fr : r.ar} · {FLOWERS.filter(f => f.rarity === r.id && got[f.id]).length}/{FLOWERS.filter(f => f.rarity === r.id).length}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
            {FLOWERS.filter(f => f.rarity === r.id).map(f => {
              const n = got[f.id] ?? 0;
              return (
                <motion.button key={f.id} onClick={() => setOpen(f)} whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 6px 10px', borderRadius: 16, cursor: 'pointer', background: t.card,
                    border: `1px solid ${n ? `${r.color}55` : t.line}`, color: t.ink, position: 'relative' }}>
                  {n > 1 && <span style={{ position: 'absolute', top: 6, insetInlineEnd: 8, fontSize: 11, fontWeight: 700, color: r.color }}>×{n}</span>}
                  <FlowerArt f={f} size={58} locked={!n}/>
                  <span style={{ fontSize: 12.5, fontWeight: 600, textAlign: 'center', lineHeight: 1.2, color: n ? t.ink : t.inkMute }}>{n ? (fr ? f.fr : f.ar) : '???'}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(16,11,4,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div onClick={e => e.stopPropagation()} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} role="dialog" aria-modal="true"
              style={{ width: '100%', maxWidth: 340, background: t.card, border: `1px solid ${t.line}`, borderRadius: 24, padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <FlowerArt f={open} size={120} locked={!got[open.id]} animate/>
              <span style={{ color: rarityOf(open).color, fontWeight: 700, fontSize: 13 }}>{fr ? rarityOf(open).fr : rarityOf(open).ar}</span>
              <h3 style={{ margin: 0, fontFamily: 'Fraunces, serif', fontWeight: 400, fontSize: 24, color: t.ink }}>{got[open.id] ? (fr ? open.fr : open.ar) : (fr ? 'Fleur à découvrir' : 'زهرة لم تُكتشف')}</h3>
              <p style={{ margin: 0, fontSize: 14, color: t.inkDim, lineHeight: 1.5 }}>
                {got[open.id]
                  ? `${open.noteFr} ${fr ? `Reçue ${got[open.id]} fois, la première le ${new Date(userData.flowers!.firstAt[open.id]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}.` : ''}`
                  : (fr ? 'Connecte-toi chaque jour et mémorise des sourates pour augmenter tes chances.' : 'ادخل كل يوم واحفظ السور لتزيد فرصك.')}
              </p>
              <button onClick={() => setOpen(null)} style={{ marginTop: 8, width: '100%', height: 44, borderRadius: 12, border: `1px solid ${t.line}`, background: t.bgSoft, color: t.ink, fontWeight: 600, cursor: 'pointer' }}>{fr ? 'Fermer' : 'إغلاق'}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
