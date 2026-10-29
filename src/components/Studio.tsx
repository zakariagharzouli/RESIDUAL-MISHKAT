import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { UserData } from '../types';
import { useT } from '../lib/theme';
import { Icon, Icons, PageHeader, useIsNarrow } from './ui';

// ── Contenus prêts à l'emploi (texte coranique exact, traduction Hamidullah) ─
type Kind = 'verset' | 'doua' | 'pensee';
interface Preset { ar: string; fr: string; src: string; }

const PRESETS: Record<'verset' | 'doua', Preset[]> = {
  verset: [
    { ar: 'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا', fr: 'À côté de la difficulté est, certes, une facilité !', src: 'Ash-Sharh · 94:6' },
    { ar: 'أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ', fr: 'N\'est-ce point par l\'évocation d\'Allah que se tranquillisent les cœurs ?', src: 'Ar-Ra\'d · 13:28' },
    { ar: 'فَٱذْكُرُونِىٓ أَذْكُرْكُمْ', fr: 'Souvenez-vous de Moi donc, Je vous récompenserai.', src: 'Al-Baqarah · 2:152' },
    { ar: 'وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥٓ', fr: 'Et quiconque place sa confiance en Allah, Il lui suffit.', src: 'At-Talâq · 65:3' },
    { ar: 'وَقُل رَّبِّ زِدْنِى عِلْمًا', fr: 'Et dis : « Ô mon Seigneur, accroît mes connaissances ! »', src: 'Tâ-Hâ · 20:114' },
  ],
  doua: [
    { ar: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَٰجِنَا وَذُرِّيَّٰتِنَا قُرَّةَ أَعْيُنٍ', fr: 'Seigneur, donne-nous, en nos épouses et nos descendants, la joie des yeux.', src: 'Al-Furqân · 25:74' },
    { ar: 'رَّبِّ ٱرْحَمْهُمَا كَمَا رَبَّيَانِى صَغِيرًا', fr: 'Ô mon Seigneur, fais-leur, à tous deux, miséricorde comme ils m\'ont élevé tout petit.', src: 'Al-Isrâ\' · 17:24' },
    { ar: 'رَبِّ ٱجْعَلْنِى مُقِيمَ ٱلصَّلَوٰةِ وَمِن ذُرِّيَّتِى', fr: 'Ô mon Seigneur ! Fais que j\'accomplisse assidûment la Salât ainsi qu\'une partie de ma descendance.', src: 'Ibrâhîm · 14:40' },
    { ar: 'رَبَّنَآ ءَاتِنَا فِى ٱلدُّنْيَا حَسَنَةً وَفِى ٱلْءَاخِرَةِ حَسَنَةً وَقِنَا عَذَابَ ٱلنَّارِ', fr: 'Seigneur ! Accorde-nous belle part ici-bas, et belle part aussi dans l\'au-delà, et protège-nous du châtiment du Feu !', src: 'Al-Baqarah · 2:201' },
    { ar: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا', fr: 'Seigneur ! Ne laisse pas dévier nos cœurs après que Tu nous aies guidés.', src: 'Âl \'Imrân · 3:8' },
  ],
};

// ── Cadres ───────────────────────────────────────────────────────────────────
type FrameId = 'nuit' | 'jardin' | 'aquarelle' | 'zellige' | 'aube' | 'rose';
const FRAMES: { id: FrameId; fr: string; ar: string; dark: boolean }[] = [
  { id: 'nuit',      fr: 'Nuit étoilée',  ar: 'ليلة',    dark: true  },
  { id: 'jardin',    fr: 'Jardin fleuri', ar: 'حديقة',   dark: false },
  { id: 'aquarelle', fr: 'Aquarelle',     ar: 'ألوان',   dark: false },
  { id: 'zellige',   fr: 'Zellige',       ar: 'زليج',    dark: false },
  { id: 'aube',      fr: 'Aube',          ar: 'فجر',     dark: true  },
  { id: 'rose',      fr: 'Roses',         ar: 'ورود',    dark: false },
];

const W = 1080, H = 1920;

// Le vrai logo de l'app (même image que l'icône installée)
let logoImg: HTMLImageElement | null = null;
const loadLogo = () => new Promise<void>(res => {
  if (logoImg?.complete) return res();
  const img = new Image(); img.onload = () => { logoImg = img; res(); }; img.onerror = () => res(); img.src = '/icon-512.png';
});

/** Générateur pseudo-aléatoire stable : le même cadre est toujours dessiné pareil. */
const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

const flower = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, petal: string, heart: string, rot = 0) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = petal;
  for (let i = 0; i < 5; i++) { ctx.rotate((Math.PI * 2) / 5); ctx.beginPath(); ctx.ellipse(0, -r * 0.62, r * 0.42, r * 0.62, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = heart; ctx.beginPath(); ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
};
const leaf = (ctx: CanvasRenderingContext2D, x: number, y: number, len: number, rot: number, color: string) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -len * 0.32, len, 0); ctx.quadraticCurveTo(len * 0.5, len * 0.32, 0, 0); ctx.fill();
  ctx.restore();
};
const star8 = (ctx: CanvasRenderingContext2D, x: number, y: number, R: number) => {
  ctx.beginPath();
  for (let i = 0; i < 16; i++) { const r = i % 2 ? R * 0.42 : R, a = -Math.PI / 2 + (i * Math.PI) / 8; ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)); }
  ctx.closePath();
};
const mosque = (ctx: CanvasRenderingContext2D, color: string) => {
  ctx.fillStyle = color;
  const base = H - 230;
  ctx.fillRect(0, base, W, 230);
  ctx.beginPath(); ctx.arc(W / 2, base, 190, Math.PI, 0); ctx.fill();
  ctx.fillRect(W / 2 - 6, base - 300, 12, 120);
  ctx.beginPath(); ctx.arc(W / 2, base - 310, 14, 0, Math.PI * 2); ctx.fill();
  for (const dx of [-330, 330]) {
    ctx.fillRect(W / 2 + dx - 26, base - 420, 52, 420);
    ctx.beginPath(); ctx.moveTo(W / 2 + dx - 34, base - 420); ctx.lineTo(W / 2 + dx, base - 500); ctx.lineTo(W / 2 + dx + 34, base - 420); ctx.fill();
  }
  for (const dx of [-170, 170]) { ctx.beginPath(); ctx.arc(W / 2 + dx, base, 90, Math.PI, 0); ctx.fill(); }
};

function paintFrame(ctx: CanvasRenderingContext2D, id: FrameId) {
  const r = rng(id.length * 977 + 13);
  if (id === 'nuit') {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0B1230'); g.addColorStop(1, '#1F2B5A');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 140; i++) { ctx.fillStyle = `rgba(255,240,210,${0.25 + r() * 0.6})`; ctx.beginPath(); ctx.arc(r() * W, r() * H * 0.8, 1 + r() * 2.6, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#F1D28A'; ctx.beginPath(); ctx.arc(820, 250, 88, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#121A3E'; ctx.beginPath(); ctx.arc(856, 220, 80, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#F1D28A'; star8(ctx, 700, 330, 18); ctx.fill();
    mosque(ctx, 'rgba(6,10,30,0.75)');
  } else if (id === 'jardin') {
    ctx.fillStyle = '#FBF6EC'; ctx.fillRect(0, 0, W, H);
    const corners: [number, number][] = [[60, 80], [W - 60, 80], [60, H - 80], [W - 60, H - 80]];
    corners.forEach(([cx, cy], k) => {
      for (let i = 0; i < 9; i++) leaf(ctx, cx + (r() - 0.5) * 160, cy + (r() - 0.5) * 160, 70 + r() * 50, r() * Math.PI * 2, k % 2 ? '#9CB98E' : '#7FA37A');
      for (let i = 0; i < 6; i++) flower(ctx, cx + (r() - 0.5) * 200, cy + (r() - 0.5) * 200, 30 + r() * 34, ['#F2A7B5', '#F6C7A6', '#E9B0D6', '#FFFFFF'][i % 4], '#E8B04A', r() * 3);
    });
  } else if (id === 'aquarelle') {
    ctx.fillStyle = '#FDF7F2'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 16; i++) {
      const x = r() * W, y = r() * H, rad = 220 + r() * 380, c = ['249,180,196', '200,182,240', '252,205,160', '170,215,200'][i % 4];
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, `rgba(${c},0.38)`); g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  } else if (id === 'zellige') {
    ctx.fillStyle = '#F6F2E8'; ctx.fillRect(0, 0, W, H);
    for (let y = 0; y <= H + 120; y += 120) for (let x = 0; x <= W + 120; x += 120) {
      ctx.fillStyle = ((x + y) / 120) % 2 ? 'rgba(15,107,79,0.16)' : 'rgba(35,67,168,0.14)'; star8(ctx, x, y, 58); ctx.fill();
      ctx.fillStyle = 'rgba(227,162,26,0.35)'; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(246,242,232,0.92)'; roundRect(ctx, 90, 300, W - 180, H - 700, 60); ctx.fill();
  } else if (id === 'aube') {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5E4B9E'); g.addColorStop(0.5, '#E58C8A'); g.addColorStop(1, '#FBD2A6');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const s = ctx.createRadialGradient(W / 2, H - 360, 0, W / 2, H - 360, 520); s.addColorStop(0, 'rgba(255,232,180,0.9)'); s.addColorStop(1, 'rgba(255,232,180,0)');
    ctx.fillStyle = s; ctx.fillRect(0, 0, W, H);
    mosque(ctx, 'rgba(70,40,70,0.55)');
  } else if (id === 'rose') {
    ctx.fillStyle = '#F9E6EA'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) {
      const x = r() < 0.5 ? r() * 200 : W - r() * 200, y = r() * H;
      leaf(ctx, x, y, 60 + r() * 30, r() * 6, '#B7CDA8');
      flower(ctx, x, y, 24 + r() * 26, ['#E58AA0', '#F3B6C3', '#D9667F'][i % 3], '#F7D27A', r() * 3);
    }
  }
  // Double filet doré commun à tous les cadres
  const dark = FRAMES.find(f => f.id === id)!.dark;
  ctx.strokeStyle = dark ? 'rgba(241,210,138,0.8)' : 'rgba(180,135,50,0.7)';
  ctx.lineWidth = 4; roundRect(ctx, 50, 50, W - 100, H - 100, 44); ctx.stroke();
  ctx.lineWidth = 1.5; roundRect(ctx, 66, 66, W - 132, H - 132, 36); ctx.stroke();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) { out.push(line); line = word; } else line = test;
    }
    out.push(line);
  }
  return out;
}

interface PostContent { kind: Kind; ar: string; fr: string; src: string; name: string; showName: boolean; frame: FrameId; }

/** Dessine le post complet (1080 × 1920) ; `scale` sert aux miniatures. */
function renderPost(canvas: HTMLCanvasElement, c: PostContent, scale = 1) {
  canvas.width = W * scale; canvas.height = H * scale;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  paintFrame(ctx, c.frame);
  const dark = FRAMES.find(f => f.id === c.frame)!.dark;
  const ink = dark ? '#FBF3E2' : '#2B2117', soft = dark ? 'rgba(251,243,226,0.78)' : 'rgba(43,33,23,0.72)', gold = dark ? '#F1D28A' : '#A97A22';
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';

  const label = c.kind === 'verset' ? 'VERSET DU JOUR' : c.kind === 'doua' ? 'DOUA' : 'PENSÉE';
  ctx.font = '600 30px Inter, sans-serif';
  const arFont = '64px "Amiri Quran", Amiri, serif', frFont = `italic 400 ${c.ar ? 46 : 58}px Fraunces, Georgia, serif`;
  ctx.font = arFont; ctx.direction = 'rtl'; const arLines = c.ar ? wrap(ctx, c.ar, 820) : [];
  ctx.direction = 'ltr'; ctx.font = frFont; const frLines = c.fr ? wrap(ctx, c.fr, 820) : [];
  const arLH = 122, frLH = c.ar ? 64 : 80;
  const total = 70 + arLines.length * arLH + (arLines.length && frLines.length ? 40 : 0) + frLines.length * frLH + (c.src ? 90 : 0);
  let y = Math.max(320, (H - 260 - total) / 2 + 60);

  ctx.font = '600 28px Inter, sans-serif'; ctx.fillStyle = gold;
  ctx.fillText(label.split('').join(String.fromCharCode(8202)), W / 2, y); y += 70;
  ctx.fillStyle = gold; star8(ctx, W / 2, y - 34, 12); ctx.fill();

  if (arLines.length) {
    ctx.font = arFont; ctx.direction = 'rtl'; ctx.fillStyle = ink;
    for (const l of arLines) { y += arLH; ctx.fillText(l, W / 2, y - 26); }
    ctx.direction = 'ltr';
    if (frLines.length) y += 40;
  }
  ctx.font = frFont; ctx.fillStyle = arLines.length ? soft : ink;
  for (const l of frLines) { y += frLH; ctx.fillText(l, W / 2, y - 12); }
  if (c.src) { y += 90; ctx.font = '500 30px Inter, sans-serif'; ctx.fillStyle = gold; ctx.fillText(c.src, W / 2, y - 20); }

  // Signature : logo Mishkat et nom de l'utilisatrice
  const by = H - 150, lg = 96;
  ctx.font = '400 40px Fraunces, Georgia, serif';
  const handle = c.showName && c.name ? `@${c.name.replace(/\s+/g, '').toLowerCase()}` : '';
  ctx.font = '500 26px Inter, sans-serif'; const hw = ctx.measureText(handle).width;
  ctx.font = '400 40px Fraunces, Georgia, serif'; const tw = Math.max(ctx.measureText('Mishkat').width, hw);
  const pillW = lg + 24 + tw + 48, px = W / 2 - pillW / 2;
  ctx.fillStyle = dark ? 'rgba(11,18,48,0.6)' : 'rgba(255,255,255,0.82)';
  roundRect(ctx, px, by - 62, pillW, 124, 62); ctx.fill();
  if (logoImg) {
    ctx.save(); roundRect(ctx, px + 14, by - lg / 2, lg, lg, 24); ctx.clip();
    ctx.drawImage(logoImg, px + 14, by - lg / 2, lg, lg); ctx.restore();
  }
  ctx.textAlign = 'left'; ctx.fillStyle = ink;
  const tx = px + 14 + lg + 22;
  ctx.font = '400 40px Fraunces, Georgia, serif'; ctx.fillText('Mishkat', tx, handle ? by - 4 : by + 14);
  if (handle) { ctx.font = '500 26px Inter, sans-serif'; ctx.fillStyle = soft; ctx.fillText(handle, tx + 2, by + 32); }
}

interface Props { userData: UserData; lang: 'fr' | 'ar'; }

export const StudioSection = ({ userData, lang }: Props) => {
  const t = useT();
  const narrow = useIsNarrow();
  const fr = lang === 'fr';
  const [kind, setKind] = useState<Kind>('doua');
  const [ar, setAr] = useState(PRESETS.doua[0].ar);
  const [txt, setTxt] = useState(PRESETS.doua[0].fr);
  const [src, setSrc] = useState(PRESETS.doua[0].src);
  const [frame, setFrame] = useState<FrameId>('jardin');
  const [showName, setShowName] = useState(true);
  const [ready, setReady] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const name = userData.settings?.username || 'Hafiz';
  const content: PostContent = { kind, ar, fr: txt, src, name, showName, frame };

  // Les polices doivent être chargées avant de dessiner sur le canvas
  useEffect(() => {
    Promise.all([loadLogo(), ...['64px "Amiri Quran"', 'italic 46px Fraunces', '40px Fraunces', '600 30px Inter'].map(f => document.fonts?.load(f).catch(() => null))])
      .finally(() => setReady(true));
  }, []);
  useEffect(() => { if (preview.current) renderPost(preview.current, content); });

  const pick = (k: Kind) => {
    setKind(k);
    if (k === 'pensee') { setAr(''); setTxt(fr ? 'Écris ici ta pensée du jour…' : 'اكتب خاطرتك هنا…'); setSrc(''); }
    else { const p = PRESETS[k][0]; setAr(p.ar); setTxt(p.fr); setSrc(p.src); }
  };

  const makeFile = useCallback(async () => {
    const c = document.createElement('canvas'); renderPost(c, content);
    const blob: Blob | null = await new Promise(res => c.toBlob(res, 'image/png'));
    return blob ? new File([blob], `mishkat-${kind}.png`, { type: 'image/png' }) : null;
  }, [content, kind]);

  const download = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a'); a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const share = async () => {
    const file = await makeFile(); if (!file) return;
    const data = { files: [file], title: 'Mishkat', text: fr ? 'Fait avec Mishkat' : 'صُنع بمشكاة' };
    if (navigator.canShare?.(data)) {
      try { await navigator.share(data); } catch { /* partage annulé */ }
    } else {
      download(file);
      toast(fr ? 'Image enregistrée. Ouvre TikTok et ajoute-la depuis ta galerie.' : 'تم حفظ الصورة. افتح تيك توك وأضفها من المعرض.');
    }
  };

  const card: React.CSSProperties = { background: t.card, border: `1px solid ${t.line}`, borderRadius: 20, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 };
  const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.inkMute };
  const field: React.CSSProperties = { width: '100%', boxSizing: 'border-box', borderRadius: 12, border: `1px solid ${t.line}`, background: t.bgSoft, color: t.ink, padding: '10px 12px', fontSize: 15, outline: 'none', resize: 'vertical' };

  const Preview = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <motion.canvas ref={preview} key={frame} initial={{ opacity: 0.4, scale: 0.98 }} animate={{ opacity: ready ? 1 : 0.4, scale: 1 }} transition={{ duration: 0.25 }}
        aria-label={fr ? 'Aperçu du post' : 'معاينة'} role="img"
        style={{ width: '100%', maxWidth: narrow ? 300 : 380, aspectRatio: '9 / 16', borderRadius: 22, boxShadow: '0 24px 60px -24px rgba(30,20,4,0.45)', background: t.bgSoft }}/>
      <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 380 }}>
        <button onClick={share} style={{ flex: 1, height: 50, borderRadius: 14, border: 'none', background: t.ink, color: t.bg, fontWeight: 600, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Icon d={Icons.upload} size={18}/> {fr ? 'Partager (TikTok, WhatsApp…)' : 'مشاركة'}
        </button>
        <button onClick={async () => { const f = await makeFile(); if (f) download(f); }} aria-label={fr ? 'Enregistrer l\'image' : 'حفظ الصورة'}
          style={{ width: 50, height: 50, borderRadius: 14, border: `1px solid ${t.line}`, background: t.card, color: t.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d={Icons.download} size={18}/>
        </button>
      </div>
    </div>
  );

  const Controls = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
      <div style={card}>
        <span style={label}>{fr ? 'Type de post' : 'نوع المنشور'}</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, padding: 4, borderRadius: 14, background: t.bgSoft }}>
          {([['verset', fr ? 'Verset' : 'آية'], ['doua', fr ? 'Doua' : 'دعاء'], ['pensee', fr ? 'Pensée' : 'خاطرة']] as [Kind, string][]).map(([k, l]) => (
            <button key={k} onClick={() => pick(k)} aria-pressed={kind === k}
              style={{ height: 42, borderRadius: 11, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, background: kind === k ? t.card : 'transparent', color: kind === k ? t.ink : t.inkMute, boxShadow: kind === k ? '0 2px 8px -4px rgba(30,20,4,0.3)' : 'none' }}>{l}</button>
          ))}
        </div>
        {kind !== 'pensee' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PRESETS[kind].map(p => {
              const on = p.ar === ar;
              return (
                <button key={p.src} onClick={() => { setAr(p.ar); setTxt(p.fr); setSrc(p.src); }} aria-pressed={on}
                  style={{ textAlign: fr ? 'left' : 'right', padding: '10px 12px', borderRadius: 12, cursor: 'pointer', border: `1.5px solid ${on ? t.accent : t.lineSoft}`, background: on ? `${t.accent}12` : 'transparent', color: t.ink }}>
                  <span lang="ar" style={{ display: 'block', fontFamily: '"Amiri Quran", Amiri, serif', fontSize: 19, direction: 'rtl', textAlign: 'right', lineHeight: 1.8 }}>{p.ar}</span>
                  <span style={{ display: 'block', fontSize: 12.5, color: t.inkMute }}>{p.src}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={card}>
        <span style={label}>{fr ? 'Texte' : 'النص'}</span>
        <textarea value={ar} onChange={e => setAr(e.target.value)} rows={2} dir="rtl" lang="ar" placeholder={fr ? 'Texte en arabe (facultatif)' : 'النص بالعربية'} aria-label={fr ? 'Texte en arabe' : 'النص العربي'}
          style={{ ...field, fontFamily: '"Amiri Quran", Amiri, serif', fontSize: 20 }}/>
        <textarea value={txt} onChange={e => setTxt(e.target.value)} rows={3} placeholder={fr ? 'Ton texte, ta doua, ta pensée…' : 'نصك'} aria-label={fr ? 'Texte' : 'النص'} style={field}/>
        <input value={src} onChange={e => setSrc(e.target.value)} placeholder={fr ? 'Source (ex. Al-Baqarah · 2:286)' : 'المصدر'} aria-label={fr ? 'Source' : 'المصدر'} style={{ ...field, resize: undefined }}/>
        {kind === 'verset' && <span style={{ fontSize: 12.5, color: t.inkMute }}>{fr ? 'Pour un verset, vérifie le texte arabe avant de publier.' : 'تحقق من نص الآية قبل النشر.'}</span>}
      </div>

      <div style={card}>
        <span style={label}>{fr ? 'Cadre' : 'الإطار'}</span>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${narrow ? 3 : 6}, minmax(0, 1fr))`, gap: 8 }}>
          {FRAMES.map(f => {
            const on = frame === f.id;
            return (
              <button key={f.id} onClick={() => setFrame(f.id)} aria-pressed={on}
                style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 0, background: 'none', border: 'none', cursor: 'pointer', color: on ? t.ink : t.inkDim }}>
                <canvas ref={el => { if (el && ready) renderPost(el, { ...content, frame: f.id }, 0.12); }} aria-hidden="true"
                  style={{ width: '100%', aspectRatio: '9 / 16', borderRadius: 10, border: `2px solid ${on ? t.accent : 'transparent'}`, boxShadow: on ? `0 0 0 3px ${t.accent}33` : `0 0 0 1px ${t.lineSoft}` }}/>
                <span style={{ fontSize: 12, fontWeight: on ? 600 : 500 }}>{fr ? f.fr : f.ar}</span>
              </button>
            );
          })}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: t.ink, cursor: 'pointer' }}>
          <input type="checkbox" checked={showName} onChange={e => setShowName(e.target.checked)} style={{ width: 20, height: 20, accentColor: t.accent }}/>
          {fr ? `Afficher mon nom (@${name.replace(/\s+/g, '').toLowerCase()})` : 'إظهار اسمي'}
        </label>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, direction: fr ? 'ltr' : 'rtl' }}>
      <PageHeader eyebrow={fr ? 'Partage un verset, une doua, une pensée' : 'شارك آية أو دعاء أو خاطرة'} title={fr ? 'Créer un post' : 'إنشاء منشور'}/>
      {narrow ? (
        <>{Preview}{Controls}</>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 5fr)', gap: 24, alignItems: 'start' }}>
          {Controls}
          <div style={{ position: 'sticky', top: 0 }}>{Preview}</div>
        </div>
      )}
    </div>
  );
};
