import React from 'react';
import { Icons } from './ui';

// ── Icônes au trait de la barre du Diftar ───────────────────────────────────
export const DI: Record<string, React.ReactNode> = {
  back:     <path d="M15 5l-7 7 7 7"/>,
  help:     <><circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.9 2.1c-.9.6-1.5 1.1-1.5 2.3M12 17h.01"/></>,
  palette:  Icons.palette,
  shapes:   <><circle cx="7.5" cy="7.5" r="3.8"/><rect x="13" y="3.7" width="7.5" height="7.5" rx="1.2"/><path d="M12 20.5l4.2-7.2 4.2 7.2z"/><path d="M3.5 20.5h6"/></>,
  emoji:    <><circle cx="12" cy="12" r="9"/><path d="M8 14.2c1 1.6 2.4 2.4 4 2.4s3-.8 4-2.4"/><circle cx="9" cy="9.8" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="9.8" r="1" fill="currentColor" stroke="none"/></>,
  paper:    <><path d="M6 3h8.5L19 7.5V21H6z"/><path d="M14.5 3v4.5H19M9 12h7M9 16h5"/></>,
  select:   <path d="M5.5 3.5l13 6.4-5.6 1.7-1.8 5.9z"/>,
  stylus:   <><path d="M4 20l1.2-4.2L15.6 5.4a2 2 0 0 1 2.9 0l.1.1a2 2 0 0 1 0 2.9L8.2 18.8z"/><path d="M13.8 7.2l3 3"/></>,
  finger:   <><path d="M9 11.5V5.2a1.6 1.6 0 0 1 3.2 0V11"/><path d="M12.2 10.2V8.9a1.6 1.6 0 0 1 3.2 0V11"/><path d="M15.4 10.6a1.6 1.6 0 0 1 3.2 0v4.2a6.2 6.2 0 0 1-6.2 6.2h-.8a5.4 5.4 0 0 1-4.6-2.6L4.6 15a1.6 1.6 0 0 1 2.6-1.8L9 15.2"/></>,
  undo:     <><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></>,
  redo:     <><path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/></>,
  more:     Icons.more,
  zoomIn:   <><circle cx="11" cy="11" r="7"/><path d="M20.5 20.5l-4.5-4.5M11 8v6M8 11h6"/></>,
  zoomOut:  <><circle cx="11" cy="11" r="7"/><path d="M20.5 20.5l-4.5-4.5M8 11h6"/></>,
  download: Icons.download,
  trash:    Icons.trash,
  check:    Icons.check,
  plus:     Icons.plus,
  close:    <path d="M6 6l12 12M18 6L6 18"/>,
};

// ── Aperçu du trait de chaque outil, dessiné dans la couleur choisie ────────
const WAVE = 'M5 21C14 7 24 27 33 15S50 5 59 13';
const SPRAY = Array.from({ length: 42 }, (_, i) => {
  const t = i / 41, x = 5 + t * 54, y = 17 + Math.sin(t * 6) * 6;
  const a = (i * 137.5) % 360, r = (i % 5) * 1.3;
  return [x + Math.cos(a) * r, y + Math.sin(a) * r, 0.6 + (i % 3) * 0.35];
});

export const ToolPreview = ({ id, color }: { id: string; color: string }) => {
  const c = color.startsWith('#') ? color : '#8B2635';
  const line = (w: number, extra: React.SVGProps<SVGPathElement> = {}) =>
    <path d={WAVE} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" {...extra}/>;
  let body: React.ReactNode;
  switch (id) {
    case 'fountain-pen': body = <>{line(4.5, { opacity: 0.25 })}{line(2.2)}</>; break;
    case 'highlighter':  body = line(12, { opacity: 0.32, strokeLinecap: 'butt' }); break;
    case 'chalk':        body = <>{line(5, { opacity: 0.55, strokeDasharray: '2.5 1.6' })}{line(2, { opacity: 0.5, strokeDasharray: '1 2.5' })}</>; break;
    case 'ruler':        body = <><path d="M6 24L58 8" stroke={c} strokeWidth="2.6" strokeLinecap="round"/>{[0.2, 0.4, 0.6, 0.8].map(k => <path key={k} d={`M${6 + 52 * k} ${24 - 16 * k}l1.6 4`} stroke={c} strokeWidth="1.2" opacity="0.5"/>)}</>; break;
    case 'eraser':       body = <><rect x="18" y="8" width="28" height="15" rx="4" transform="rotate(-14 32 15)" fill="#F4B6C2" stroke="#C98393" strokeWidth="1.2"/><rect x="18" y="8" width="11" height="15" rx="3" transform="rotate(-14 32 15)" fill="#fff" opacity="0.6"/></>; break;
    case 'spray':        body = <>{SPRAY.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={c} opacity={0.55}/>)}</>; break;
    case 'marker':       body = line(7.5, { opacity: 0.88 }); break;
    case 'neon':         body = <>{line(7, { opacity: 0.25 })}{line(2.6, { style: { filter: `drop-shadow(0 0 2.5px ${c})` } })}</>; break;
    case 'pencil':       body = <>{line(1.7, { opacity: 0.8 })}{line(1, { opacity: 0.35, transform: 'translate(0.8 0.6)' })}</>; break;
    case 'watercolor':   body = <>{line(13, { opacity: 0.16 })}{line(7, { opacity: 0.2 })}</>; break;
    case 'calligraphy':  body = <path d={WAVE} fill="none" stroke={c} strokeWidth="5.5" strokeLinecap="square" transform="skewX(-12) translate(3 0)"/>; break;
    case 'dotted':       body = line(3.4, { strokeDasharray: '0.1 6.5' }); break;
    case 'brush':        body = <>{line(9, { opacity: 0.9 })}{line(3, { stroke: '#fff', opacity: 0.18, transform: 'translate(0 -1.5)' })}</>; break;
    default:             body = line(2.8);
  }
  return <svg width="64" height="30" viewBox="0 0 64 30" aria-hidden="true" style={{ overflow: 'visible' }}>{body}</svg>;
};
