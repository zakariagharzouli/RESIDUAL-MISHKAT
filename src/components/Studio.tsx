import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { UserData } from '../types';
import { useT } from '../lib/theme';
import { Icon, Icons, PageHeader, RL_NODES, useIsNarrow } from './ui';

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
type FrameId = string;
const FRAMES: { id: FrameId; fr: string; ar: string; dark: boolean }[] = [
  { id: 'photo',      fr: 'Ma photo',       ar: 'صورتي',     dark: true  },
  { id: 'nuit',       fr: 'Nuit étoilée',   ar: 'ليلة',      dark: true  },
  { id: 'jardin',     fr: 'Jardin fleuri',  ar: 'حديقة',     dark: false },
  { id: 'aquarelle',  fr: 'Aquarelle',      ar: 'ألوان',     dark: false },
  { id: 'zellige',    fr: 'Zellige',        ar: 'زليج',      dark: false },
  { id: 'aube',       fr: 'Aube',           ar: 'فجر',       dark: true  },
  { id: 'rose',       fr: 'Roses',          ar: 'ورود',      dark: false },
  { id: 'lanternes',  fr: 'Lanternes',      ar: 'فوانيس',    dark: true  },
  { id: 'arche',      fr: 'Arche dorée',    ar: 'قوس ذهبي',  dark: false },
  { id: 'lapis',      fr: 'Lapis et or',    ar: 'لازورد',    dark: true  },
  { id: 'emeraude',   fr: 'Émeraude',       ar: 'زمرد',      dark: true  },
  { id: 'croissant',  fr: 'Croissant d\'or', ar: 'هلال',     dark: false },
  { id: 'ramadan',    fr: 'Ramadan',        ar: 'رمضان',     dark: true  },
  { id: 'marbre',     fr: 'Marbre',         ar: 'رخام',      dark: false },
  { id: 'parchemin',  fr: 'Parchemin',      ar: 'رق',        dark: false },
  { id: 'lavande',    fr: 'Lavande',        ar: 'خزامى',     dark: false },
  { id: 'tulipes',    fr: 'Tulipes',        ar: 'توليب',     dark: false },
  { id: 'pivoines',   fr: 'Pivoines',       ar: 'فاوانيا',   dark: false },
  { id: 'desert',     fr: 'Désert',         ar: 'صحراء',     dark: true  },
  { id: 'ocean',      fr: 'Océan',          ar: 'بحر',       dark: true  },
  { id: 'arcenciel',  fr: 'Arc pastel',     ar: 'قوس قزح',   dark: false },
  { id: 'etoiles',    fr: 'Étoiles d\'or',  ar: 'نجوم',      dark: true  },
  { id: 'mosaique',   fr: 'Mosaïque',       ar: 'فسيفساء',   dark: false },
  { id: 'feuillage',  fr: 'Feuillage',      ar: 'أوراق',     dark: false },
  { id: 'sable',      fr: 'Sable',          ar: 'رمل',       dark: false },
  { id: 'nuages',     fr: 'Nuages',         ar: 'غيوم',      dark: false },
  { id: 'poudre',     fr: 'Rose poudré',    ar: 'وردي',      dark: false },
];

type FormatId = 'story' | 'post' | 'carre';
const FORMATS: { id: FormatId; fr: string; ar: string; sub: string; h: number; ratio: string }[] = [
  { id: 'story', fr: 'Story · Reel · TikTok', ar: 'ستوري', sub: '9:16', h: 1920, ratio: '9 / 16' },
  { id: 'post',  fr: 'Publication',          ar: 'منشور', sub: '4:5',  h: 1350, ratio: '4 / 5' },
  { id: 'carre', fr: 'Carré',                ar: 'مربع',  sub: '1:1',  h: 1080, ratio: '1 / 1' },
];

const W = 1080;
// Hauteur du format en cours de dessin (dessin synchrone, un post à la fois)
let H = 1920;
// Échelle des éléments selon le format : 1 en story, plus petit en carré
const kf = () => (H >= 1900 ? 1 : H >= 1300 ? 0.84 : 0.72);
// Hauteur réservée aux décorations du haut, au-dessus du texte
const topY = () => (H >= 1900 ? 250 : H >= 1300 ? 170 : 120);
let photoImg: HTMLImageElement | null = null;

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
  const m = kf(); ctx.save(); ctx.translate(W / 2, H); ctx.scale(m, m); ctx.translate(-W / 2, -H);
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
  ctx.fillRect(-W, base, W * 3, 230);
  ctx.restore();
};

const lantern = (ctx: CanvasRenderingContext2D, x: number, len: number, s: number, glow: boolean) => {
  ctx.strokeStyle = 'rgba(210,170,90,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, len); ctx.stroke();
  ctx.save(); ctx.translate(x, len); ctx.scale(s, s);
  if (glow) { const g = ctx.createRadialGradient(0, 60, 0, 0, 60, 120); g.addColorStop(0, 'rgba(255,214,130,0.55)'); g.addColorStop(1, 'rgba(255,214,130,0)'); ctx.fillStyle = g; ctx.fillRect(-130, -60, 260, 260); }
  ctx.fillStyle = '#C9993E';
  ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(18, 0); ctx.lineTo(28, 18); ctx.lineTo(-28, 18); ctx.closePath(); ctx.fill();
  ctx.fillStyle = glow ? '#FFE3A3' : '#F3DBA6';
  ctx.beginPath(); ctx.moveTo(-28, 18); ctx.bezierCurveTo(-40, 55, -30, 95, 0, 115); ctx.bezierCurveTo(30, 95, 40, 55, 28, 18); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#C9993E'; ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(0, 115); ctx.moveTo(-16, 22); ctx.quadraticCurveTo(-20, 75, 0, 110); ctx.moveTo(16, 22); ctx.quadraticCurveTo(20, 75, 0, 110); ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#C9993E'; ctx.beginPath(); ctx.moveTo(-10, 115); ctx.lineTo(10, 115); ctx.lineTo(0, 134); ctx.closePath(); ctx.fill();
  ctx.restore();
};
const crescent = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, bg: string) => {
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(x + r * 0.4, y - r * 0.35, r * 0.9, 0, Math.PI * 2); ctx.fill();
};
const peony = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c1: string, c2: string) => {
  for (let ring = 3; ring >= 1; ring--) {
    ctx.fillStyle = ring % 2 ? c1 : c2;
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + ring; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r * ring * 0.22, y + Math.sin(a) * r * ring * 0.22, r * 0.34 * ring * 0.5 + r * 0.1, r * 0.3 * ring * 0.5 + r * 0.08, a, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.fillStyle = '#F2C35B'; ctx.beginPath(); ctx.arc(x, y, r * 0.12, 0, Math.PI * 2); ctx.fill();
};
const fillGrad = (ctx: CanvasRenderingContext2D, stops: string[], vertical = true) => {
  const g = vertical ? ctx.createLinearGradient(0, 0, 0, H) : ctx.createLinearGradient(0, 0, W, H);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
};
const archPath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + w * 0.55);
  ctx.bezierCurveTo(x, y + w * 0.2, x + w * 0.35, y + w * 0.08, x + w / 2, y);
  ctx.bezierCurveTo(x + w * 0.65, y + w * 0.08, x + w, y + w * 0.2, x + w, y + w * 0.55);
  ctx.lineTo(x + w, y + h); ctx.closePath();
};

function paintFrame(ctx: CanvasRenderingContext2D, id: FrameId) {
  const r = rng(id.length * 977 + 13);
  if (id === 'nuit') {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0B1230'); g.addColorStop(1, '#1F2B5A');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 140; i++) { ctx.fillStyle = `rgba(255,240,210,${0.25 + r() * 0.6})`; ctx.beginPath(); ctx.arc(r() * W, r() * H * 0.8, 1 + r() * 2.6, 0, Math.PI * 2); ctx.fill(); }
    { const ty = topY(), mr = 88 * kf() * (H >= 1900 ? 1 : 0.8);
      ctx.fillStyle = '#F1D28A'; ctx.beginPath(); ctx.arc(840, ty, mr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#121A3E'; ctx.beginPath(); ctx.arc(840 + mr * 0.4, ty - mr * 0.35, mr * 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#F1D28A'; star8(ctx, 840 - mr * 1.6, ty + mr * 0.9, 18 * kf()); ctx.fill(); }
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
    ctx.fillStyle = 'rgba(246,242,232,0.92)'; roundRect(ctx, 90, H * 0.15, W - 180, H * 0.66, 60); ctx.fill();
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
  } else if (id === 'photo') {
    if (photoImg) {
      const s2 = Math.max(W / photoImg.width, H / photoImg.height), iw = photoImg.width * s2, ih = photoImg.height * s2;
      ctx.drawImage(photoImg, (W - iw) / 2, (H - ih) / 2, iw, ih);
    } else fillGrad(ctx, ['#3B3550', '#1E1B2B']);
    fillGrad(ctx, ['rgba(10,8,20,0.25)', 'rgba(10,8,20,0.6)', 'rgba(10,8,20,0.35)']);
  } else if (id === 'lanternes') {
    fillGrad(ctx, ['#0E1533', '#24305E']);
    for (let i = 0; i < 90; i++) { ctx.fillStyle = `rgba(255,240,210,${0.2 + r() * 0.5})`; ctx.beginPath(); ctx.arc(r() * W, r() * H, 1 + r() * 2, 0, Math.PI * 2); ctx.fill(); }
    [[150, 170, 0.9], [360, 90, 0.7], [720, 120, 0.75], [930, 210, 1]].forEach(([x, l, sc]) => lantern(ctx, x, l * kf(), sc * kf(), true));
  } else if (id === 'arche') {
    ctx.fillStyle = '#F7F0E2'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#B8892E'; ctx.lineWidth = 6; archPath(ctx, 130, H * 0.12, W - 260, H * 0.8); ctx.stroke();
    ctx.lineWidth = 2; archPath(ctx, 158, H * 0.12 + 30, W - 316, H * 0.8 - 30); ctx.stroke();
    ctx.fillStyle = '#B8892E'; star8(ctx, W / 2, H * 0.12 + 90 * kf(), 18); ctx.fill();
  } else if (id === 'lapis') {
    fillGrad(ctx, ['#14286B', '#0C1A4A']);
    for (const [cx, cy] of [[0, 0], [W, 0], [0, H], [W, H]] as [number, number][]) {
      for (let k = 0; k < 4; k++) { ctx.strokeStyle = `rgba(217,180,90,${0.8 - k * 0.15})`; ctx.lineWidth = 3; star8(ctx, cx, cy, 120 + k * 55); ctx.stroke(); }
    }
    ctx.fillStyle = 'rgba(217,180,90,0.9)'; star8(ctx, W / 2, topY() * 0.55, 22); ctx.fill();
  } else if (id === 'emeraude') {
    fillGrad(ctx, ['#0F4D3A', '#082C22']);
    for (let x = 60; x < W; x += 80) { ctx.fillStyle = 'rgba(232,190,100,0.55)'; star8(ctx, x, 120, 18); ctx.fill(); star8(ctx, x, H - 120, 18); ctx.fill(); }
    for (let y = 200; y < H - 160; y += 80) { ctx.fillStyle = 'rgba(232,190,100,0.35)'; star8(ctx, 120, y, 12); ctx.fill(); star8(ctx, W - 120, y, 12); ctx.fill(); }
  } else if (id === 'croissant') {
    fillGrad(ctx, ['#F3DDA8', '#FBF3E1', '#F6E7C6']);
    crescent(ctx, W / 2 - 20, topY() - 20, (H >= 1900 ? 110 : 64), '#C89B3C', '#F4E0AE');
    for (let i = 0; i < 14; i++) { ctx.fillStyle = 'rgba(200,155,60,0.6)'; star8(ctx, 120 + r() * (W - 240), 100 + r() * H * 0.85, 6 + r() * 10); ctx.fill(); }
  } else if (id === 'ramadan') {
    fillGrad(ctx, ['#2A1648', '#4B2A73', '#7A4A8C']);
    for (let i = 0; i < 70; i++) { ctx.fillStyle = `rgba(255,236,200,${0.25 + r() * 0.55})`; ctx.beginPath(); ctx.arc(r() * W, r() * H * 0.7, 1 + r() * 2.2, 0, Math.PI * 2); ctx.fill(); }
    crescent(ctx, 820, topY() - 30, (H >= 1900 ? 80 : 52), '#F4D58D', '#2F1950');
    [[200, 130], [420, 70], [640, 160]].forEach(([x, l]) => lantern(ctx, x, l * kf(), 0.8 * kf(), true));
    mosque(ctx, 'rgba(25,10,45,0.6)');
  } else if (id === 'marbre') {
    ctx.fillStyle = '#F5F3EF'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 22; i++) {
      ctx.strokeStyle = `rgba(120,115,110,${0.05 + r() * 0.12})`; ctx.lineWidth = 1 + r() * 4;
      ctx.beginPath(); let x = r() * W, y = -50; ctx.moveTo(x, y);
      while (y < H + 50) { const nx = x + (r() - 0.5) * 260, ny = y + 120 + r() * 160; ctx.quadraticCurveTo(x + (r() - 0.5) * 200, (y + ny) / 2, nx, ny); x = nx; y = ny; }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(200,160,70,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W * 0.1, H * 0.2); ctx.bezierCurveTo(W * 0.4, H * 0.3, W * 0.5, H * 0.6, W * 0.95, H * 0.75); ctx.stroke();
  } else if (id === 'parchemin') {
    const g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, H * 0.75); g.addColorStop(0, '#F6E9CC'); g.addColorStop(1, '#D9BE8E');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(120,80,30,0.55)'; ctx.lineWidth = 3;
    for (const [cx, cy, sx, sy] of [[150, 150, 1, 1], [W - 150, 150, -1, 1], [150, H - 150, 1, -1], [W - 150, H - 150, -1, -1]] as number[][]) {
      ctx.save(); ctx.translate(cx, cy); ctx.scale(sx, sy);
      ctx.beginPath(); ctx.moveTo(-60, 40); ctx.bezierCurveTo(-60, -40, 40, -60, 60, -10); ctx.bezierCurveTo(70, 20, 30, 30, 20, 10); ctx.bezierCurveTo(10, -5, 30, -20, 40, -8); ctx.stroke();
      ctx.restore();
    }
  } else if (id === 'lavande') {
    fillGrad(ctx, ['#EDE6F7', '#D9CCEE']);
    for (let i = 0; i < 18; i++) {
      const x = 60 + r() * (W - 120), base = H - 40 - r() * 60, len = H * 0.12 + r() * H * 0.1;
      ctx.strokeStyle = '#7E9A6C'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + (r() - 0.5) * 60, base - len / 2, x + (r() - 0.5) * 40, base - len); ctx.stroke();
      for (let k = 0; k < 9; k++) { ctx.fillStyle = k % 2 ? '#9C7CD0' : '#B79BE0'; ctx.beginPath(); ctx.ellipse(x + (r() - 0.5) * 16, base - len + k * 18, 7, 11, 0, 0, Math.PI * 2); ctx.fill(); }
    }
  } else if (id === 'tulipes') {
    ctx.fillStyle = '#FBF5EA'; ctx.fillRect(0, 0, W, H);
    const tulip = (x: number, y: number, sc: number, c: string) => {
      ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
      ctx.strokeStyle = '#6E9A62'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-8, 80, 0, 160); ctx.stroke();
      leaf(ctx, 0, 110, 70, -0.9, '#86B279'); leaf(ctx, 0, 130, 70, -2.3, '#7FA872');
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-34, 0); ctx.bezierCurveTo(-40, -50, -20, -70, -14, -60); ctx.lineTo(0, -80); ctx.lineTo(14, -60); ctx.bezierCurveTo(20, -70, 40, -50, 34, 0); ctx.bezierCurveTo(20, 20, -20, 20, -34, 0); ctx.fill();
      ctx.restore();
    };
    for (let i = 0; i < 9; i++) tulip(80 + i * 115, H - 190 * kf(), 0.9 * kf(), ['#D9536A', '#E9849A', '#C23F5C'][i % 3]);
    for (let i = 0; i < 4; i++) tulip(100 + i * 60, 200 * kf(), 0.55 * kf(), ['#D9536A', '#E9849A'][i % 2]);
  } else if (id === 'pivoines') {
    ctx.fillStyle = '#FBEDEE'; ctx.fillRect(0, 0, W, H);
    [[90, 120, 150], [990, 160, 120], [60, H - 140, 130], [1000, H - 120, 170], [230, H - 60, 90]].forEach(([x, y, rr], i) => {
      for (let k = 0; k < 4; k++) leaf(ctx, x, y, rr * 1.2, k * 1.6 + i, '#A9C49A');
      peony(ctx, x, y, rr * kf(), i % 2 ? '#F2B6C0' : '#E8909F', i % 2 ? '#F8D3D8' : '#F3B2BD');
    });
  } else if (id === 'desert') {
    fillGrad(ctx, ['#3B2A55', '#C9707A', '#F2B27A']);
    ctx.fillStyle = 'rgba(255,224,170,0.9)'; ctx.beginPath(); ctx.arc(W * 0.7, H * 0.62, 110 * kf(), 0, Math.PI * 2); ctx.fill();
    [['#B4654F', 0.7], ['#93503F', 0.78], ['#6E3A33', 0.87]].forEach(([c, f]) => {
      ctx.fillStyle = c as string; ctx.beginPath(); ctx.moveTo(0, H * (f as number));
      ctx.bezierCurveTo(W * 0.3, H * ((f as number) - 0.06), W * 0.6, H * ((f as number) + 0.04), W, H * ((f as number) - 0.03)); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    });
  } else if (id === 'ocean') {
    fillGrad(ctx, ['#0E3A5C', '#1E6C8C', '#5FB0C2']);
    for (let k = 0; k < 7; k++) {
      ctx.strokeStyle = `rgba(255,255,255,${0.12 + k * 0.04})`; ctx.lineWidth = 3; ctx.beginPath();
      const y0 = H * 0.7 + k * 40;
      for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y0 + Math.sin(x / 70 + k) * 12);
      ctx.stroke();
    }
  } else if (id === 'arcenciel') {
    ctx.fillStyle = '#FBF6EE'; ctx.fillRect(0, 0, W, H);
    ['#F6C1C1', '#F8D8B0', '#F6EBB0', '#C9E4C5', '#BFD7EE', '#D7C6EC'].forEach((c, i) => {
      ctx.strokeStyle = c; ctx.lineWidth = 46 * kf(); ctx.beginPath(); ctx.arc(W / 2, H + 40, Math.min(W * 0.62, H * 0.36) - i * 50 * kf(), Math.PI, 0); ctx.stroke();
    });
  } else if (id === 'etoiles') {
    fillGrad(ctx, ['#101A3A', '#1A2550']);
    for (let y = 0; y <= H + 100; y += 100) for (let x = (y / 100) % 2 ? 50 : 0; x <= W + 100; x += 100) {
      ctx.strokeStyle = 'rgba(217,180,90,0.22)'; ctx.lineWidth = 1.5; star8(ctx, x, y, 34); ctx.stroke();
    }
  } else if (id === 'mosaique') {
    ctx.fillStyle = '#FBF8F1'; ctx.fillRect(0, 0, W, H);
    const cols = ['#2B6CB0', '#2F855A', '#D69E2E', '#C53030', '#2C7A7B'];
    const tile = (x: number, y: number) => { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = cols[Math.floor(r() * cols.length)]; ctx.fillRect(-16, -16, 32, 32); ctx.restore(); ctx.fillStyle = '#F2D27A'; star8(ctx, x, y, 7); ctx.fill(); };
    for (let x = 0; x <= W; x += 54) { tile(x, 30); tile(x, 84); tile(x, H - 30); tile(x, H - 84); }
    for (let y = 138; y <= H - 138; y += 54) { tile(30, y); tile(W - 30, y); }
  } else if (id === 'feuillage') {
    fillGrad(ctx, ['#EEF3E6', '#DDE8D2']);
    for (let i = 0; i < 46; i++) { const left = i % 2 === 0; const y = r() * H; leaf(ctx, left ? -20 + r() * 120 : W + 20 - r() * 120, y, 90 + r() * 60, left ? -0.4 + r() * 0.8 : Math.PI - 0.4 + r() * 0.8, ['#8FB08A', '#A7C2A0', '#6F956D'][i % 3]); }
  } else if (id === 'sable') {
    fillGrad(ctx, ['#F1E6D2', '#E7D6BA']);
    { const ah = topY() - 70; ctx.strokeStyle = '#B48A45'; ctx.lineWidth = 2; archPath(ctx, W / 2 - 120, 70, 240, ah); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W / 2 - 200, 70 + ah + 18); ctx.lineTo(W / 2 + 200, 70 + ah + 18); ctx.stroke(); }
  } else if (id === 'nuages') {
    fillGrad(ctx, ['#BFDDF5', '#EAF4FB']);
    const cloud = (x: number, y: number, s2: number) => { ctx.fillStyle = 'rgba(255,255,255,0.92)'; [[0, 0, 60], [55, -20, 70], [120, 0, 55], [60, 20, 60]].forEach(([dx, dy, rr]) => { ctx.beginPath(); ctx.arc(x + dx * s2, y + dy * s2, rr * s2, 0, Math.PI * 2); ctx.fill(); }); };
    cloud(90, topY() - 40, 0.9 * kf()); cloud(760, topY() + 20, 0.7 * kf()); cloud(110, H - 260 * kf(), 1 * kf()); cloud(740, H - 170 * kf(), 0.85 * kf());
  } else if (id === 'poudre') {
    ctx.fillStyle = '#F6E3E1'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(190,140,90,0.8)'; ctx.lineWidth = 2.5; archPath(ctx, 170, H * 0.1, W - 340, H * 0.78); ctx.stroke();
    flower(ctx, W / 2, H * 0.1 - 6, 22, '#E9A9B3', '#E2B25E');
  }
  // Double filet doré commun à tous les cadres
  const dark = (FRAMES.find(f => f.id === id) ?? FRAMES[1]).dark;
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

interface PostContent { kind: Kind; ar: string; fr: string; src: string; name: string; showName: boolean; frame: FrameId; format: FormatId; }

/** Dessine le post complet (1080 × 1920) ; `scale` sert aux miniatures. */
function renderPost(canvas: HTMLCanvasElement, c: PostContent, scale = 1) {
  H = (FORMATS.find(f => f.id === c.format) ?? FORMATS[0]).h;
  const k = kf();
  canvas.width = W * scale; canvas.height = H * scale;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  paintFrame(ctx, c.frame);
  const dark = (FRAMES.find(f => f.id === c.frame) ?? FRAMES[1]).dark;
  const ink = dark ? '#FBF3E2' : '#2B2117', soft = dark ? 'rgba(251,243,226,0.78)' : 'rgba(43,33,23,0.72)', gold = dark ? '#F1D28A' : '#A97A22';
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';

  const label = c.kind === 'verset' ? 'VERSET DU JOUR' : c.kind === 'doua' ? 'DOUA' : 'PENSÉE';
  ctx.font = '600 30px Inter, sans-serif';
  const arFont = `${Math.round(64 * k)}px "Amiri Quran", Amiri, serif`, frFont = `italic 400 ${Math.round((c.ar ? 46 : 58) * k)}px Fraunces, Georgia, serif`;
  ctx.font = arFont; ctx.direction = 'rtl'; const arLines = c.ar ? wrap(ctx, c.ar, 820) : [];
  ctx.direction = 'ltr'; ctx.font = frFont; const frLines = c.fr ? wrap(ctx, c.fr, 820) : [];
  const arLH = 122 * k, frLH = (c.ar ? 64 : 80) * k;
  const total = 70 + arLines.length * arLH + (arLines.length && frLines.length ? 40 : 0) + frLines.length * frLH + (c.src ? 90 : 0);
  let y = Math.max(220 * k + 60, (H - 300 * k - total) / 2 + 40);

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
  const by = H - 200 * k, lg = 96 * k;
  ctx.font = `400 ${Math.round(40 * k)}px Fraunces, Georgia, serif`;
  const handle = c.showName && c.name ? `@${c.name.replace(/\s+/g, '').toLowerCase()}` : '';
  ctx.font = `500 ${Math.round(26 * k)}px Inter, sans-serif`; const hw = ctx.measureText(handle).width;
  ctx.font = `400 ${Math.round(40 * k)}px Fraunces, Georgia, serif`; const tw = Math.max(ctx.measureText('Mishkat').width, hw);
  const pillW = lg + 24 * k + tw + 48 * k, px = W / 2 - pillW / 2;
  ctx.fillStyle = dark ? 'rgba(11,18,48,0.6)' : 'rgba(255,255,255,0.82)';
  roundRect(ctx, px, by - 62 * k, pillW, 124 * k, 62 * k); ctx.fill();
  if (logoImg) {
    ctx.save(); roundRect(ctx, px + 14 * k, by - lg / 2, lg, lg, 24 * k); ctx.clip();
    ctx.drawImage(logoImg, px + 14 * k, by - lg / 2, lg, lg); ctx.restore();
  }
  ctx.textAlign = 'left'; ctx.fillStyle = ink;
  const tx = px + 14 * k + lg + 22 * k;
  ctx.font = `400 ${Math.round(40 * k)}px Fraunces, Georgia, serif`; ctx.fillText('Mishkat', tx, handle ? by - 4 * k : by + 14 * k);
  if (handle) { ctx.font = `500 ${Math.round(26 * k)}px Inter, sans-serif`; ctx.fillStyle = soft; ctx.fillText(handle, tx + 2, by + 32 * k); }
  // « propulsé par » + symbole et nom Residual Labs
  ctx.textAlign = 'left'; ctx.font = '500 22px Inter, sans-serif'; ctx.fillStyle = soft;
  const pre = 'propulsé par ', brand = 'RESIDUAL LABS';
  const pw = ctx.measureText(pre).width; ctx.font = '600 20px Inter, sans-serif'; const bw = ctx.measureText(brand).width + 4 * brand.length * 0.6;
  const lineW = pw + 28 + bw, lx = W / 2 - lineW / 2, ly = by + 96 * k;
  ctx.font = '500 22px Inter, sans-serif'; ctx.fillText(pre, lx, ly);
  ctx.save(); ctx.translate(lx + pw, ly - 19); ctx.scale(22 / 64, 22 / 64); ctx.fillStyle = ink; ctx.strokeStyle = ink; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(32.2, 13.3); ctx.lineTo(14.8, 28.5); ctx.lineTo(16, 51.7); ctx.moveTo(32.2, 13.3); ctx.lineTo(48, 26.8); ctx.lineTo(33.5, 40.6); ctx.lineTo(48.2, 52.7); ctx.stroke();
  RL_NODES.forEach(([x, y2, rr]) => { ctx.beginPath(); ctx.arc(x, y2, rr, 0, Math.PI * 2); ctx.fill(); });
  ctx.restore();
  ctx.font = '600 20px Inter, sans-serif'; ctx.fillStyle = ink;
  let bx = lx + pw + 28; for (const ch of brand) { ctx.fillText(ch, bx, ly); bx += ctx.measureText(ch).width + 2.4; }
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
  const [format, setFormat] = useState<FormatId>('story');
  const [photoTick, setPhotoTick] = useState(0);
  const [ready, setReady] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const name = userData.settings?.username || 'Hafiz';
  const content: PostContent = { kind, ar, fr: txt, src, name, showName, frame, format };
  const fmt = FORMATS.find(f => f.id === format) ?? FORMATS[0];
  void photoTick;

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
    return blob ? new File([blob], `mishkat-${kind}-${fmt.sub.replace(':', 'x')}.png`, { type: 'image/png' }) : null;
  }, [content, kind, fmt.sub]);

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
        style={{ width: '100%', maxWidth: format === 'story' ? (narrow ? 300 : 380) : (narrow ? 340 : 440), aspectRatio: fmt.ratio, borderRadius: 22, boxShadow: '0 24px 60px -24px rgba(30,20,4,0.45)', background: t.bgSoft }}/>
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
        <span style={label}>{fr ? 'Format' : 'المقاس'}</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          {FORMATS.map(f => {
            const on = format === f.id;
            return (
              <button key={f.id} onClick={() => setFormat(f.id)} aria-pressed={on}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 6px', borderRadius: 14, cursor: 'pointer', border: `1.5px solid ${on ? t.accent : t.lineSoft}`, background: on ? `${t.accent}12` : t.card, color: t.ink }}>
                <span style={{ width: f.id === 'story' ? 18 : f.id === 'post' ? 24 : 28, height: f.id === 'story' ? 32 : f.id === 'post' ? 30 : 28, borderRadius: 5, border: `2px solid ${on ? t.accent : t.inkMute}` }}/>
                <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{fr ? f.fr : f.ar}</span>
                <span style={{ fontSize: 12, color: t.inkMute }}>{f.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={card}>
        <span style={label}>{fr ? 'Cadre' : 'الإطار'}</span>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${narrow ? 3 : 5}, minmax(0, 1fr))`, gap: 8, maxHeight: 560, overflowY: 'auto', paddingRight: 2 }}>
          {FRAMES.map(f => {
            const on = frame === f.id;
            return (
              <button key={f.id} onClick={() => (f.id === 'photo' ? photoInput.current?.click() : setFrame(f.id))} aria-pressed={on}
                style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 0, background: 'none', border: 'none', cursor: 'pointer', color: on ? t.ink : t.inkDim }}>
                <canvas ref={el => { if (el && ready) renderPost(el, { ...content, frame: f.id }, 0.12); }} aria-hidden="true"
                  style={{ width: '100%', aspectRatio: fmt.ratio, borderRadius: 10, border: `2px solid ${on ? t.accent : 'transparent'}`, boxShadow: on ? `0 0 0 3px ${t.accent}33` : `0 0 0 1px ${t.lineSoft}` }}/>
                <span style={{ fontSize: 12, fontWeight: on ? 600 : 500 }}>{fr ? f.fr : f.ar}</span>
              </button>
            );
          })}
        </div>
        <input ref={photoInput} type="file" accept="image/*" hidden aria-label={fr ? 'Choisir une photo' : 'اختر صورة'}
          onChange={e => {
            const file = e.target.files?.[0]; if (!file) return;
            const img = new Image();
            img.onload = () => { photoImg = img; setFrame('photo'); setPhotoTick(n => n + 1); };
            img.src = URL.createObjectURL(file);
            e.target.value = '';
          }}/>
        <span style={{ fontSize: 12.5, color: t.inkMute }}>{fr ? '« Ma photo » : choisis une image de ta galerie, le texte se pose dessus.' : 'اختر صورة من معرضك.'}</span>
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
