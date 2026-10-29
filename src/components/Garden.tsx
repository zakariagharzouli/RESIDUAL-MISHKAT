import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PlantedFlower, Surah, UserData } from '../types';
import { useT } from '../lib/theme';
import { AnimatedNumber, PageHeader, useIsMobile, useIsNarrow } from './ui';
import { FlowerArt, FlowerCollection } from './Flowers';
import { FLOWERS, RARITIES, basket, plantFlower, unplantFlower } from '../lib/flowers';

// Chaque sourate travaillée devient une plante : bourgeon (en cours),
// fleur (mémorisée), fleur qui a soif (à réviser).
const PALETTES = [
  ['#F2A7B5', '#E58AA0'], ['#F6C7A6', '#EBA77F'], ['#E9B0D6', '#C98BC0'],
  ['#FFFFFF', '#F1E6D6'], ['#F7D27A', '#E8B04A'], ['#B9C8F2', '#8EA5E6'],
];
const VB_W = 1000, VB_H = 640;

const hash = (n: number) => { let x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };

interface Plant { s: Surah; x: number; y: number; scale: number; kind: 'bud' | 'bloom' | 'thirsty'; }

function layout(surahs: Surah[]): Plant[] {
  const touched = surahs.filter(s => s.status !== 'not_started');
  const rows = [{ y: 470, sc: 0.72 }, { y: 528, sc: 0.88 }, { y: 592, sc: 1.05 }];
  const perRow = Math.max(8, Math.ceil(touched.length / 3));
  return touched.map((s, i): Plant => {
    const r = rows[i % 3], col = Math.floor(i / 3);
    const step = 900 / perRow;
    return {
      s,
      x: 50 + col * step + step * 0.5 + (hash(s.id) - 0.5) * step * 0.5 + (i % 3 === 1 ? step * 0.33 : 0),
      y: r.y + (hash(s.id + 7) - 0.5) * 16,
      scale: r.sc * (0.85 + Math.min(0.4, s.verses / 300)),
      kind: s.status === 'memorized' ? 'bloom' : s.status === 'review' ? 'thirsty' : 'bud',
    };
  }).sort((a, b) => a.y - b.y);
}

const Petals = ({ type, c1, c2 }: { type: number; c1: string; c2: string }) => {
  if (type === 0) return <>{[0, 72, 144, 216, 288].map(a => <ellipse key={a} cx="0" cy="-13" rx="9" ry="14" fill={c1} stroke={c2} strokeWidth="1" transform={`rotate(${a})`}/>)}<circle r="7" fill="#E8B04A"/></>;
  if (type === 1) return <><path d="M-14 4C-16-14-6-22 0-14C6-22 16-14 14 4C10 14-10 14-14 4Z" fill={c1} stroke={c2} strokeWidth="1.2"/><path d="M0-14V8" stroke={c2} strokeWidth="1.2"/></>;
  return <>{[0, 45, 90, 135, 180, 225, 270, 315].map(a => <ellipse key={a} cx="0" cy="-11" rx="6" ry="12" fill={c1} stroke={c2} strokeWidth="0.8" transform={`rotate(${a})`}/>)}<circle r="8" fill={c2}/><circle r="4" fill="#F7D27A"/></>;
};

const PlantSVG = ({ p, onPick, selected }: { p: Plant; onPick: () => void; selected: boolean }) => {
  const [c1, c2] = PALETTES[(p.s.juz ?? p.s.id) % PALETTES.length];
  const stem = p.kind === 'bud' ? 46 : 64;
  const tilt = p.kind === 'thirsty' ? 16 : 0;
  const delay = hash(p.s.id + 3) * 3;
  return (
    <g transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${p.scale.toFixed(2)})`} style={{ cursor: 'pointer' }} onClick={onPick}
      role="button" aria-label={p.s.name} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onPick(); }}>
      <ellipse cx="0" cy="2" rx="18" ry="5" fill="rgba(60,40,10,0.16)"/>
      <motion.g style={{ originX: '0px', originY: '0px' }} animate={{ rotate: [tilt - 2.5, tilt + 2.5, tilt - 2.5] }}
        transition={{ duration: 4 + hash(p.s.id) * 2, repeat: Infinity, ease: 'easeInOut', delay }}>
        <path d={`M0 0C-3 -${stem * 0.4} 3 -${stem * 0.7} 0 -${stem}`} stroke="#6E9A62" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d={`M0 -${stem * 0.35}c-10 -6 -18 -2 -20 4c10 2 16 0 20 -4z`} fill="#86B279"/>
        <path d={`M0 -${stem * 0.55}c10 -6 18 -2 20 4c-10 2 -16 0 -20 -4z`} fill="#7FA872"/>
        <g transform={`translate(0 -${stem})`}>
          {p.kind === 'bud'
            ? <><path d="M0 4C-8 0-8-14 0-20C8-14 8 0 0 4Z" fill={c1} stroke={c2} strokeWidth="1.2"/><path d="M-6 2C-3-4 3-4 6 2" fill="#86B279"/></>
            : <Petals type={p.s.id % 3} c1={c1} c2={c2}/>}
        </g>
      </motion.g>
      {p.kind === 'thirsty' && (
        <motion.path d="M0 -10C4 -4 6 0 6 3A6 6 0 0 1 -6 3C-6 0 -4 -4 0 -10Z" fill="#7FB6E8" transform={`translate(22 -${stem + 18})`}
          animate={{ y: [0, -4, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}/>
      )}
      {selected && <circle cx="0" cy={-stem} r="30" fill="none" stroke="#E8B04A" strokeWidth="2.5" strokeDasharray="4 4"/>}
    </g>
  );
};

const Lantern = ({ x, len, night }: { x: number; len: number; night: boolean }) => (
  <motion.g style={{ originX: `${x}px`, originY: '0px' }} animate={{ rotate: [-1.8, 1.8, -1.8] }} transition={{ duration: 5 + (x % 3), repeat: Infinity, ease: 'easeInOut' }}>
    <path d={`M${x} 0V${len}`} stroke="#8C6A2E" strokeWidth="1.5"/>
    <g transform={`translate(${x} ${len})`}>
      {night && <circle cy="26" r="34" fill="#FFD98A" opacity="0.28"/>}
      <path d="M-8 0H8L12 8H-12Z" fill="#B8892E"/>
      <path d="M-12 8C-16 22-12 40 0 48C12 40 16 22 12 8Z" fill={night ? '#FFE3A3' : '#F5DCA8'} stroke="#B8892E" strokeWidth="2"/>
      <path d="M0 8V48M-7 10C-9 24-6 38 0 46M7 10C9 24 6 38 0 46" stroke="#B8892E" strokeWidth="1" fill="none" opacity="0.7"/>
      <path d="M-5 48H5L0 56Z" fill="#B8892E"/>
    </g>
  </motion.g>
);

// Les fleurs plantées rapetissent vers le fond du jardin
const GROUND_TOP = 468, GROUND_BOTTOM = 628;
const depth = (y: number) => 0.62 + ((y - GROUND_TOP) / (GROUND_BOTTOM - GROUND_TOP)) * 0.45;

const PlantedSVG = ({ p, onPick, selected }: { p: PlantedFlower; onPick: () => void; selected: boolean }) => {
  const f = FLOWERS.find(x => x.id === p.id);
  if (!f) return null;
  const size = 50 * depth(p.y);
  const delay = hash(p.x + p.y) * 3;
  return (
    <g transform={`translate(${p.x} ${p.y})`} style={{ cursor: 'pointer' }} onClick={onPick}
      role="button" aria-label={f.fr} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onPick(); }}>
      <ellipse cx="0" cy="2" rx={size * 0.24} ry={size * 0.07} fill="rgba(60,40,10,0.18)"/>
      <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 11 }} style={{ originX: 0.5, originY: 1 }}>
        <motion.g animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 4.5 + hash(p.x) * 2, repeat: Infinity, ease: 'easeInOut', delay }} style={{ originX: 0.5, originY: 1 }}>
          <g transform={`translate(${-size / 2} ${-size * 0.98})`}><FlowerArt f={f} size={size} animate/></g>
        </motion.g>
      </motion.g>
      {selected && <circle cx="0" cy={-size * 0.5} r={size * 0.55} fill="none" stroke="#E8B04A" strokeWidth="2.5" strokeDasharray="4 4"/>}
    </g>
  );
};

interface Props { userData: UserData; setUserData?: (updater: (prev: UserData) => UserData) => void; lang: 'fr' | 'ar'; onNavigate?: (to: string) => void; }

export const GardenSection = ({ userData, setUserData, lang, onNavigate }: Props) => {
  const t = useT();
  const narrow = useIsNarrow();
  const isMobile = useIsMobile();
  // Sur téléphone, le jardin est plus large que l'écran : on le fait défiler, centré au départ
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const el = scrollRef.current; if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2; }, [isMobile]);
  const fr = lang === 'fr';
  const plants = useMemo(() => layout(userData.surahs), [userData.surahs]);
  const [sel, setSel] = useState<Plant | null>(null);
  const [selP, setSelP] = useState<PlantedFlower | null>(null);
  const [planting, setPlanting] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const planted = userData.flowers?.planted ?? [];
  const inBasket = useMemo(() => basket(userData), [userData.flowers]); // eslint-disable-line react-hooks/exhaustive-deps
  const plantingDef = planting ? FLOWERS.find(f => f.id === planting) : null;
  const selPDef = selP ? FLOWERS.find(f => f.id === selP.id) : null;

  // Touche sur la terre : on convertit le point écran en coordonnées du dessin
  const onGround = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!planting) {
      if (!(e.target as Element).closest('[role=button]')) { setSel(null); setSelP(null); }
      return;
    }
    if (!svgRef.current) return;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const x = Math.min(970, Math.max(30, pt.x));
    const y = Math.min(GROUND_BOTTOM, Math.max(GROUND_TOP, pt.y + 20));
    setUserData?.(prev => plantFlower(prev, planting, x, y));
    setPlanting(null);
  };
  const scene = useMemo(() => [
    ...plants.map(p => ({ y: p.y, el: <PlantSVG key={`s${p.s.id}`} p={p} selected={sel?.s.id === p.s.id} onPick={() => { if (planting) return; setSelP(null); setSel(sel?.s.id === p.s.id ? null : p); }}/> })),
    ...planted.map(p => ({ y: p.y, el: <PlantedSVG key={p.key} p={p} selected={selP?.key === p.key} onPick={() => { if (planting) return; setSel(null); setSelP(selP?.key === p.key ? null : p); }}/> })),
  ].sort((a, b) => a.y - b.y), [plants, planted, sel, selP, planting]);
  const hour = new Date().getHours();
  const night = hour >= 19 || hour < 6;
  const dawn = hour >= 6 && hour < 9;

  const blooms = plants.filter(p => p.kind === 'bloom').length;
  const thirsty = plants.filter(p => p.kind === 'thirsty').length;
  const buds = plants.filter(p => p.kind === 'bud').length;
  const sky = night ? ['#141B3D', '#2C3566'] : dawn ? ['#F4C6B0', '#FBE7D3'] : ['#CFE6F5', '#F6EFE2'];

  const card: React.CSSProperties = { background: t.card, border: `1px solid ${t.line}`, borderRadius: 18, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 };
  const statusText = (p: Plant) => p.kind === 'bloom'
    ? (fr ? 'En fleur : mémorisée' : 'مزهرة: محفوظة')
    : p.kind === 'thirsty' ? (fr ? 'A soif : à réviser' : 'عطشى: للمراجعة') : (fr ? 'Bourgeon : en cours' : 'برعم: قيد الحفظ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, direction: fr ? 'ltr' : 'rtl' }}>
      <PageHeader eyebrow={fr ? 'Tes sourates y poussent, tes fleurs s\'y plantent' : 'سورك تنمو فيها وأزهارك تُزرع فيها'} title={fr ? 'Mon jardin' : 'حديقتي'}/>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${narrow ? 2 : 4}, minmax(0, 1fr))`, gap: 10 }}>
        {[
          { n: blooms, l: fr ? 'fleurs écloses' : 'زهرة متفتحة', c: '#E58AA0' },
          { n: thirsty, l: fr ? 'ont soif' : 'عطشى', c: '#5E9BD6' },
          { n: buds, l: fr ? 'bourgeons' : 'براعم', c: '#6E9A62' },
          { n: planted.length, l: fr ? 'fleurs plantées' : 'زهرة مزروعة', c: '#B76BC9' },
        ].map(x => (
          <div key={x.l} style={card}>
            <span style={{ fontFamily: 'Fraunces, serif', fontSize: 28, color: x.c, lineHeight: 1 }}><AnimatedNumber value={x.n}/></span>
            <span style={{ fontSize: 13, color: t.inkMute }}>{x.l}</span>
          </div>
        ))}
      </div>

      <section aria-label={fr ? 'Mon panier de fleurs' : 'سلة أزهاري'} style={{ ...card, padding: '14px 16px', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Fraunces, serif', fontSize: 20, color: t.ink }}>🧺 {fr ? 'Mon panier' : 'سلتي'}</span>
          <span style={{ fontSize: 13, color: t.inkMute }}>
            {inBasket.length
              ? (fr ? 'Choisis une fleur, puis touche la terre pour la planter.' : 'اختر زهرة ثم المس التراب لزرعها.')
              : (fr ? 'Panier vide : chaque jour, une nouvelle fleur t\'attend.' : 'السلة فارغة: زهرة جديدة كل يوم.')}
          </span>
        </div>
        {inBasket.length > 0 && (
          <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {inBasket.map(({ f, n }) => {
              const on = planting === f.id;
              const rc = RARITIES.find(r => r.id === f.rarity)!.color;
              return (
                <motion.button key={f.id} onClick={() => { setSel(null); setSelP(null); setPlanting(on ? null : f.id); }} whileTap={{ scale: 0.94 }}
                  animate={on ? { y: [0, -4, 0] } : { y: 0 }} transition={on ? { duration: 1.2, repeat: Infinity } : undefined}
                  aria-pressed={on} aria-label={fr ? `Planter ${f.fr}` : f.ar}
                  style={{ position: 'relative', flexShrink: 0, width: 84, padding: '8px 4px 8px', borderRadius: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    background: on ? `${rc}22` : t.bgSoft, border: `1.5px solid ${on ? rc : t.lineSoft}`, color: t.ink }}>
                  {n > 1 && <span style={{ position: 'absolute', top: 5, insetInlineEnd: 7, fontSize: 11, fontWeight: 700, color: rc }}>×{n}</span>}
                  <FlowerArt f={f} size={46}/>
                  <span style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.15, textAlign: 'center' }}>{fr ? f.fr : f.ar}</span>
                </motion.button>
              );
            })}
          </div>
        )}
      </section>

      <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', border: `1px solid ${planting ? t.accent : t.line}`, boxShadow: planting ? `0 0 0 4px ${t.accent}26` : '0 20px 50px -30px rgba(30,20,4,0.5)', transition: 'box-shadow .3s, border-color .3s' }}>
        <div ref={scrollRef} className="no-scrollbar" style={{ overflowX: isMobile ? 'auto' : 'visible' }}>
        <svg ref={svgRef} onClick={onGround} viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ width: isMobile ? '190%' : '100%', display: 'block', cursor: planting ? 'copy' : 'default', touchAction: 'manipulation' }} role="img" aria-label={fr ? `Jardin : ${blooms} fleurs, ${thirsty} à arroser, ${buds} bourgeons` : 'الحديقة'}>
          <defs>
            <linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sky[0]}/><stop offset="1" stopColor={sky[1]}/></linearGradient>
            <linearGradient id="g-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#A8C796"/><stop offset="1" stopColor="#7FA872"/></linearGradient>
          </defs>
          <rect width={VB_W} height={VB_H} fill="url(#g-sky)"/>
          {night && Array.from({ length: 50 }, (_, i) => <circle key={i} cx={hash(i) * VB_W} cy={hash(i + 99) * 300} r={0.8 + hash(i + 5) * 1.6} fill="#FFF3D6" opacity={0.4 + hash(i + 3) * 0.5}/>)}
          {night
            ? <><circle cx="760" cy="110" r="44" fill="#F1D28A"/><circle cx="780" cy="96" r="40" fill={sky[0]}/></>
            : <circle cx="760" cy="120" r="54" fill={dawn ? '#FFD4A3' : '#FFE7A8'} opacity="0.9"/>}
          {/* Arche de mosquée et minarets au fond */}
          <g fill={night ? 'rgba(10,14,40,0.55)' : 'rgba(255,255,255,0.55)'}>
            <path d="M330 450V300C330 230 420 190 500 150C580 190 670 230 670 300V450Z"/>
            <rect x="250" y="250" width="34" height="200"/><path d="M244 250L267 200L290 250Z"/>
            <rect x="716" y="250" width="34" height="200"/><path d="M710 250L733 200L756 250Z"/>
          </g>
          <path d="M410 450V330C410 290 455 268 500 246C545 268 590 290 590 330V450Z" fill={night ? 'rgba(255,217,138,0.35)' : 'rgba(184,137,46,0.14)'}/>
          <Lantern x={120} len={70} night={night}/><Lantern x={380} len={40} night={night}/><Lantern x={620} len={56} night={night}/><Lantern x={900} len={86} night={night}/>
          <path d={`M0 455C200 430 380 470 520 448S820 430 ${VB_W} 452V${VB_H}H0Z`} fill="url(#g-ground)"/>
          <path d={`M0 470C220 450 420 488 560 466S860 452 ${VB_W} 470`} fill="none" stroke="#C9DDB7" strokeWidth="3" opacity="0.6"/>
          {planting && <motion.path d={`M0 ${GROUND_TOP}C200 448 380 486 520 464S820 448 ${VB_W} ${GROUND_TOP}V${VB_H}H0Z`} fill="#FFF6D8" animate={{ opacity: [0.08, 0.28, 0.08] }} transition={{ duration: 1.6, repeat: Infinity }} style={{ pointerEvents: 'none' }}/>}
          {scene.map(x => x.el)}
          {plants.length === 0 && planted.length === 0 && (
            <text x={VB_W / 2} y={560} textAnchor="middle" fontFamily="Fraunces, serif" fontSize="26" fill="#3A5A30">
              {fr ? 'Ton jardin attend sa première fleur' : 'حديقتك تنتظر زهرتها الأولى'}
            </text>
          )}
        </svg>
        </div>

        <AnimatePresence>
          {plantingDef && (
            <motion.div key="hint" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{ position: 'absolute', top: 10, left: 10, right: 10, margin: '0 auto', maxWidth: 420, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px 8px 12px', borderRadius: 16, background: 'rgba(255,250,238,0.92)', backdropFilter: 'blur(8px)', boxShadow: '0 10px 30px -14px rgba(30,20,4,0.5)', color: '#2a1d08' }}>
              <FlowerArt f={plantingDef} size={34}/>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{fr ? `Touche la terre pour planter : ${plantingDef.fr}` : `المس التراب لزرع ${plantingDef.ar}`}</span>
              <button onClick={() => setPlanting(null)} style={{ height: 34, padding: '0 12px', borderRadius: 10, border: '1px solid rgba(42,29,8,0.18)', background: 'transparent', color: '#2a1d08', fontSize: 13, cursor: 'pointer' }}>{fr ? 'Annuler' : 'إلغاء'}</button>
            </motion.div>
          )}
          {selP && selPDef && (
            <motion.div key={selP.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              style={{ ...(narrow ? { position: 'relative', margin: 10 } : { position: 'absolute', left: 12, right: 12, bottom: 12, margin: '0 auto' }), maxWidth: 420, background: t.card, border: `1px solid ${t.line}`, borderRadius: 18, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 16px 40px -16px rgba(30,20,4,0.45)' }}>
              <FlowerArt f={selPDef} size={44}/>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: t.ink }}>{fr ? selPDef.fr : selPDef.ar}</span>
                <span style={{ display: 'block', fontSize: 13, color: t.inkMute }}>{fr ? `Plantée le ${new Date(selP.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}` : ''}</span>
              </span>
              <button onClick={() => { setUserData?.(prev => unplantFlower(prev, selP.key)); setSelP(null); }}
                style={{ height: 40, padding: '0 12px', borderRadius: 12, border: `1px solid ${t.line}`, background: t.bgSoft, color: t.ink, fontWeight: 600, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
                {fr ? 'Remettre au panier' : 'أعدها للسلة'}
              </button>
            </motion.div>
          )}
          {sel && (
            <motion.div key={sel.s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              style={{ ...(narrow ? { position: 'relative', margin: 10 } : { position: 'absolute', left: 12, right: 12, bottom: 12, margin: '0 auto' }), maxWidth: 420, background: t.card, border: `1px solid ${t.line}`, borderRadius: 18, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 16px 40px -16px rgba(30,20,4,0.45)' }}>
              <span lang="ar" style={{ fontFamily: '"Amiri Quran", Amiri, serif', fontSize: 26, color: t.accent, flexShrink: 0 }}>{sel.s.arabicName}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: t.ink }}>{sel.s.name}</span>
                <span style={{ display: 'block', fontSize: 13, color: t.inkMute }}>{statusText(sel)} · {sel.s.verses} {fr ? 'versets' : 'آية'}</span>
              </span>
              <button onClick={() => onNavigate?.('memorization')}
                style={{ height: 40, padding: '0 14px', borderRadius: 12, border: 'none', background: sel.kind === 'thirsty' ? '#5E9BD6' : t.accent, color: sel.kind === 'thirsty' ? '#fff' : '#1a0f00', fontWeight: 600, fontSize: 14, cursor: 'pointer', flexShrink: 0 }}>
                {sel.kind === 'thirsty' ? (fr ? 'Arroser' : 'اسقِ') : sel.kind === 'bud' ? (fr ? 'Continuer' : 'تابع') : (fr ? 'Revoir' : 'راجع')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p style={{ margin: 0, fontSize: 14, color: t.inkDim, lineHeight: 1.55, maxWidth: 640 }}>
        {fr
          ? `Les grandes fleurs sont tes sourates, les petites sont celles que tu as plantées. Touche une fleur pour la voir.${isMobile ? ' Fais glisser le jardin pour le voir en entier.' : ''} Les fleurs qui ont soif sont les sourates à réviser : les réviser, c'est les arroser.${narrow ? '' : ' La nuit, les lanternes s\'allument.'}`
          : 'المس زهرة لرؤيتها. الأزهار العطشى هي السور التي تحتاج إلى مراجعة.'}
      </p>

      <FlowerCollection userData={userData} lang={lang}/>
    </div>
  );
};
