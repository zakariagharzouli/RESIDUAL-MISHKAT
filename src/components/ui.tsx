import React, { useState, useEffect } from 'react';
import { useT, Theme } from '../lib/theme';

// ── Icon ─────────────────────────────────────────────────────────────────────
interface IconProps {
  d: React.ReactNode;
  size?: number;
  stroke?: number;
  fill?: string;
  style?: React.CSSProperties;
  color?: string;
}
export const Icon = ({ d, size = 16, stroke = 1.6, fill = 'none', style, color }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
    strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, color, ...style }}>
    {d}
  </svg>
);

// ── Icon paths ────────────────────────────────────────────────────────────────
export const Icons = {
  book:      <><path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M4 16a4 4 0 0 1 4-4h12"/></>,
  calendar:  <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
  target:    <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></>,
  badge:     <><circle cx="12" cy="9" r="6"/><path d="M8 14l-2 7 6-3 6 3-2-7"/></>,
  beads:     <><circle cx="6" cy="12" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="12" cy="18" r="2"/><path d="M7.5 10.5l3-3M13.5 7.5l3 3M16.5 13.5l-3 3M10.5 16.5l-3-3"/></>,
  palette:   <><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2v-1a2 2 0 0 1 2-2h2a3 3 0 0 0 3-3 9 9 0 0 0-9-10z"/><circle cx="7.5" cy="11" r="1" fill="currentColor"/><circle cx="11" cy="7" r="1" fill="currentColor"/><circle cx="16" cy="8" r="1" fill="currentColor"/></>,
  chart:     <><path d="M4 20V8M10 20V4M16 20v-8M22 20H2"/></>,
  bookmark:  <><path d="M6 3h12v18l-6-4-6 4z"/></>,
  settings:  <><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></>,
  flame:     <><path d="M12 2c0 4-4 5-4 9a4 4 0 0 0 8 0c0-2-1-3-2-4 0 2-1 3-2 3-1 0-2-1-2-3 0-2 2-3 2-5z"/></>,
  moon:      <><path d="M20 14a8 8 0 1 1-9-10 6 6 0 0 0 9 10z"/></>,
  moonStar:  <><path d="M20 14a8 8 0 1 1-9-10 6 6 0 0 0 9 10z"/><path d="M18.5 3.5l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5L17 5.5l1.5-.5z" fill="currentColor"/></>,
  sparkle:   <><path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5z"/></>,
  check:     <><path d="M5 12l4 4 10-10"/></>,
  plus:      <><path d="M12 5v14M5 12h14"/></>,
  arrow:     <><path d="M5 12h14M13 5l7 7-7 7"/></>,
  arrowDown: <><path d="M12 5v14M5 13l7 7 7-7"/></>,
  search:    <><circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/></>,
  filter:    <><path d="M3 5h18M6 12h12M10 19h4"/></>,
  edit:      <><path d="M16 3l5 5L8 21H3v-5z"/></>,
  trash:     <><path d="M3 6h18M8 6V4h8v2M5 6l1 14h12l1-14"/></>,
  play:      <><path d="M6 4l14 8-14 8z" fill="currentColor"/></>,
  pause:     <><rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/></>,
  rotate:    <><path d="M3 12a9 9 0 1 0 3-7M3 5v5h5"/></>,
  more:      <><circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/></>,
  star:      <><path d="M12 3l2.7 6 6.3.6-4.8 4.3 1.5 6.3L12 17l-5.7 3.2 1.5-6.3L3 9.6l6.3-.6z"/></>,
  trophy:    <><path d="M8 4h8v6a4 4 0 0 1-8 0z"/><path d="M8 6H4v3a3 3 0 0 0 3 3M16 6h4v3a3 3 0 0 1-3 3M10 14h4v4l2 2H8l2-2z"/></>,
  user:      <><circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 5-7 8-7s7 2 8 7"/></>,
  bell:      <><path d="M6 8a6 6 0 1 1 12 0c0 5 2 7 2 7H4s2-2 2-7zM10 20a2 2 0 0 0 4 0"/></>,
  globe:     <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
  download:  <><path d="M12 3v12M6 11l6 6 6-6M4 21h16"/></>,
  upload:    <><path d="M12 21V9M6 13l6-6 6 6M4 3h16"/></>,
  eye:       <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
  shield:    <><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/></>,
  refresh:   <><path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"/></>,
  lock:      <><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>,
  pen:       <><path d="M14 4l6 6L8 22H2v-6z"/></>,
  layers:    <><path d="M12 2l10 6-10 6L2 8z"/><path d="M2 14l10 6 10-6M2 11l10 6 10-6"/></>,
  grid:      <><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></>,
  list:      <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></>,
  heart:     <><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 7a5.5 5.5 0 0 1 9.5 5c-2.5 4.5-9.5 9-9.5 9z"/></>,
  wind:      <><path d="M3 8h12a3 3 0 1 0-3-3M3 12h17a3 3 0 1 1-3 3M3 16h10"/></>,
  dashboard: <><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></>,
};

// ── LanternMark ───────────────────────────────────────────────────────────────
export const LanternMark = ({ size = 32, color = '#d4a64a' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <path d="M32 6 L32 12" stroke={color} strokeWidth="1.4"/>
    <path d="M22 14 L42 14" stroke={color} strokeWidth="1.4"/>
    <path d="M22 14 Q22 28 18 38 L46 38 Q42 28 42 14 Z" stroke={color} strokeWidth="1.4" fill={`${color}15`}/>
    <path d="M32 18 L36 28 L46 28 L38 34 L41 44 L32 38 L23 44 L26 34 L18 28 L28 28 Z" fill={color} opacity="0.55"/>
    <path d="M18 38 L46 38 L44 46 L20 46 Z" stroke={color} strokeWidth="1.4"/>
    <path d="M28 46 L36 46 L34 54 L30 54 Z" stroke={color} strokeWidth="1.4"/>
    <circle cx="32" cy="32" r="20" stroke={color} strokeWidth="0.4" opacity="0.3" fill="none"/>
  </svg>
);

// ── Geo ornament ──────────────────────────────────────────────────────────────
export const Geo = ({ size = 60, color, sw = 0.8, opacity = 1 }: { size?: number; color: string; sw?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none" stroke={color} strokeWidth={sw} style={{ opacity }}>
    <rect x="10" y="10" width="40" height="40"/>
    <rect x="10" y="10" width="40" height="40" transform="rotate(45 30 30)"/>
    <circle cx="30" cy="30" r="14"/>
  </svg>
);

// ── Card ──────────────────────────────────────────────────────────────────────
export const Card = ({ children, padding = '20px 22px', style }: { children: React.ReactNode; padding?: string; style?: React.CSSProperties }) => {
  const t = useT();
  return (
    <div style={{ padding, background: t.card, border: `1px solid ${t.line}`, borderRadius: 12, ...style }}>
      {children}
    </div>
  );
};

// ── Pill ──────────────────────────────────────────────────────────────────────
export const Pill = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => {
  const t = useT();
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 10px',
      background: `${t.accent}18`,
      border: `1px solid ${t.accent}33`,
      borderRadius: 999,
      fontSize: 10.5, color: t.accentBright,
      fontFamily: 'Inter', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 500,
      ...style,
    }}>
      {children}
    </div>
  );
};

// ── PrimaryBtn ────────────────────────────────────────────────────────────────
export const PrimaryBtn = ({ children, icon, style, onClick, disabled }: { children?: React.ReactNode; icon?: React.ReactNode; style?: React.CSSProperties; onClick?: () => void; disabled?: boolean }) => {
  const t = useT();
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '11px 20px', borderRadius: 10,
        background: disabled ? t.accentSoft : t.accent,
        color: '#1a0f00',
        fontFamily: 'Inter', fontWeight: 600, fontSize: 13,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        opacity: disabled ? 0.6 : 1,
        transition: 'opacity 0.15s',
        ...style,
      }}
    >
      {children}{icon}
    </button>
  );
};

// ── GhostBtn ──────────────────────────────────────────────────────────────────
export const GhostBtn = ({ children, icon, style, onClick }: { children?: React.ReactNode; icon?: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) => {
  const t = useT();
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 16px', borderRadius: 10,
        border: `1px solid ${t.line}`,
        background: 'transparent', color: t.ink,
        fontFamily: 'Inter', fontWeight: 500, fontSize: 12.5,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        ...style,
      }}
    >
      {icon}{children}
    </button>
  );
};

// ── SectionLabel ──────────────────────────────────────────────────────────────
export const SectionLabel = ({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) => {
  const t = useT();
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
      <div style={{ fontSize: 10.5, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{children}</div>
      {right}
    </div>
  );
};

// ── Stat row ──────────────────────────────────────────────────────────────────
export const Stat = ({ icon, value, label, t: theme }: { icon: React.ReactNode; value: string | number; label: string; t: Theme }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${theme.lineSoft}` }}>
    <Icon d={icon} size={14} style={{ color: theme.accent, flexShrink: 0 }}/>
    <span style={{ fontFamily: 'Fraunces', fontSize: 15, color: theme.ink, fontWeight: 300, minWidth: 48 }}>{value}</span>
    <span style={{ fontSize: 11, color: theme.inkDim }}>{label}</span>
  </div>
);

// ── MemoStat ──────────────────────────────────────────────────────────────────
export const MemoStat = ({ label, value, sub, t: theme }: { label: string; value: string; sub: string; t: Theme }) => (
  <Card padding="14px 18px">
    <div style={{ fontSize: 10, color: theme.inkMute, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
      <span style={{ fontFamily: 'Fraunces', fontSize: 26, color: theme.ink, fontWeight: 300 }}>{value}</span>
      <span style={{ fontSize: 11, color: theme.inkDim }}>{sub}</span>
    </div>
  </Card>
);

// ── Background geo pattern ────────────────────────────────────────────────────
const BgPattern = ({ t: theme }: { t: Theme }) => (
  <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.025, pointerEvents: 'none', zIndex: 0 }}>
    <defs>
      <pattern id={`pat-${theme.name}`} x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
        <rect x="20" y="20" width="40" height="40" fill="none" stroke={theme.accent} strokeWidth="0.5"/>
        <rect x="20" y="20" width="40" height="40" fill="none" stroke={theme.accent} strokeWidth="0.5" transform="rotate(45 40 40)"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#pat-${theme.name})`}/>
  </svg>
);

// ── AppSidebar ────────────────────────────────────────────────────────────────
interface SidebarProps {
  active: string;
  onNavigate: (id: string) => void;
  streak?: number;
  isAdmin?: boolean;
  lang?: string;
  open?: boolean;
  onClose?: () => void;
}

const MENU_ITEMS = [
  { id: 'dashboard',    labelFr: 'Tableau de bord', labelAr: 'لوحة التحكم',    icon: 'dashboard', group: '' },
  { id: 'memorization', labelFr: 'Mémorisation',    labelAr: 'الحفظ',          icon: 'book',      group: 'learn' },
  { id: 'quran',        labelFr: 'Coran',            labelAr: 'القرآن',         icon: 'bookmark',  group: 'learn' },
  { id: 'diftar',       labelFr: 'Diftar',           labelAr: 'دفتر',           icon: 'pen',       group: 'learn' },
  { id: 'quiz',         labelFr: 'Quiz',             labelAr: 'مسابقة',         icon: 'sparkle',   group: 'learn' },
  { id: 'kanban',       labelFr: 'Suivi',            labelAr: 'متابعة',         icon: 'chart',     group: 'learn' },
  { id: 'tasbih',       labelFr: 'Tasbih',           labelAr: 'تسبيح',          icon: 'beads',     group: 'practice' },
  { id: 'adhkar',       labelFr: 'Adhkar',           labelAr: 'الأذكار',        icon: 'moon',      group: 'practice' },
  { id: 'joursblancs',  labelFr: 'Jours Blancs',     labelAr: 'الأيام البيض',   icon: 'moonStar',  group: 'practice' },
  { id: 'calendar',     labelFr: 'Calendrier',       labelAr: 'التقويم',        icon: 'calendar',  group: 'progress' },
  { id: 'goals',        labelFr: 'Objectifs',        labelAr: 'الأهداف',        icon: 'target',    group: 'progress' },
  { id: 'badges',       labelFr: 'Trophées',         labelAr: 'الأوسمة',        icon: 'badge',     group: 'progress' },
  { id: 'coloring',     labelFr: 'Coloriage',        labelAr: 'تلوين',          icon: 'palette',   group: 'progress' },
  { id: 'settings',     labelFr: 'Réglages',         labelAr: 'الإعدادات',      icon: 'settings',  group: 'system' },
];

const MENU_GROUPS: Record<string, { fr: string; ar: string }> = {
  learn:    { fr: 'Apprendre',  ar: 'التعلّم' },
  practice: { fr: 'Pratiquer',  ar: 'العبادة' },
  progress: { fr: 'Progresser', ar: 'التقدّم' },
  system:   { fr: '',           ar: '' },
};

// Onglets toujours visibles sur mobile ; le reste passe dans « Plus »
const MOBILE_PRIMARY = [
  { id: 'dashboard',    labelFr: 'Accueil',   labelAr: 'الرئيسية', icon: 'dashboard' },
  { id: 'memorization', labelFr: 'Mémoriser', labelAr: 'الحفظ',    icon: 'book'      },
  { id: 'quran',        labelFr: 'Coran',     labelAr: 'القرآن',   icon: 'bookmark'  },
  { id: 'diftar',       labelFr: 'Diftar',    labelAr: 'دفتر',     icon: 'pen'       },
];

export const AppSidebar = ({ active, onNavigate, streak = 1, isAdmin = false, lang = 'fr', open: openProp, onClose }: SidebarProps) => {
  const t = useT();
  const items = [
    ...MENU_ITEMS,
    ...(isAdmin ? [{ id: 'admin', labelFr: 'Admin', labelAr: 'الإدارة', icon: 'shield', group: 'system' }] : []),
  ];

  const isMobile = useIsMobile();
  const [openLocal, setOpenLocal] = useState(true);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp! : openLocal;
  const handleClose = () => { if (controlled) onClose?.(); else setOpenLocal(false); };
  const [moreOpen, setMoreOpen] = useState(false);

  if (isMobile) {
    const ar = lang === 'ar';
    const moreItems = items.filter(i => !MOBILE_PRIMARY.some(p => p.id === i.id));
    const moreActive = moreItems.some(i => i.id === active);
    const go = (id: string) => { setMoreOpen(false); onNavigate(id); };
    const tab = (id: string, icon: string, label: string, on: boolean, onClick: () => void) => (
      <button key={id} onClick={onClick} aria-current={on ? 'page' : undefined}
        style={{
          flex: 1, minWidth: 0, minHeight: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
          borderRadius: 12, color: on ? t.accent : t.inkMute, position: 'relative',
        }}>
        <span style={{
          width: 44, height: 28, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: on ? `${t.accent}1f` : 'transparent', transition: 'background 0.2s ease',
        }}>
          <Icon d={(Icons as Record<string, React.ReactNode>)[icon]} size={20} stroke={on ? 1.9 : 1.6}/>
        </span>
        <span style={{ fontSize: 11, fontFamily: 'Inter', fontWeight: on ? 600 : 500, color: on ? t.ink : t.inkMute, whiteSpace: 'nowrap' }}>{label}</span>
      </button>
    );
    return (
      <>
        {moreOpen && (
          <div onClick={() => setMoreOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(20,14,6,0.32)', backdropFilter: 'blur(2px)', animation: 'mk-fade 0.18s ease-out' }}>
            <div onClick={e => e.stopPropagation()} role="dialog" aria-label={ar ? 'المزيد' : 'Plus de rubriques'}
              style={{
                position: 'absolute', left: 0, right: 0, bottom: 0,
                background: t.card, borderTop: `1px solid ${t.line}`, borderRadius: '22px 22px 0 0',
                padding: '10px 16px calc(92px + env(safe-area-inset-bottom, 0px))',
                boxShadow: '0 -12px 40px rgba(40,28,8,0.14)', animation: 'mk-sheet 0.24s cubic-bezier(0.2,0.8,0.2,1)',
                direction: ar ? 'rtl' : 'ltr',
              }}>
              <div style={{ width: 36, height: 4, borderRadius: 4, background: t.line, margin: '0 auto 14px' }}/>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
                {moreItems.map(item => {
                  const on = item.id === active;
                  return (
                    <button key={item.id} onClick={() => go(item.id)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 2px', borderRadius: 14,
                        background: on ? `${t.accent}14` : 'transparent', color: on ? t.accent : t.inkDim,
                      }}>
                      <span style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? `${t.accent}1f` : t.bgSoft, border: `1px solid ${on ? `${t.accent}40` : t.lineSoft}` }}>
                        <Icon d={(Icons as Record<string, React.ReactNode>)[item.icon]} size={20}/>
                      </span>
                      <span style={{ fontSize: 11.5, fontFamily: 'Inter', fontWeight: 500, color: on ? t.ink : t.inkDim, textAlign: 'center', lineHeight: 1.2 }}>
                        {ar ? (item as any).labelAr : item.labelFr}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        <nav aria-label={ar ? 'التنقل' : 'Navigation'} style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: t.bgSoft,
          borderTop: `1px solid ${t.line}`,
          display: 'flex', gap: 2,
          padding: '6px 6px calc(8px + env(safe-area-inset-bottom, 0px))',
          direction: ar ? 'rtl' : 'ltr',
        }}>
          {MOBILE_PRIMARY.map(p => tab(p.id, p.icon, ar ? p.labelAr : p.labelFr, !moreOpen && p.id === active, () => go(p.id)))}
          {tab('more', 'more', ar ? 'المزيد' : 'Plus', moreOpen || moreActive, () => setMoreOpen(v => !v))}
        </nav>
      </>
    );
  }

  /* ── Fully hidden — edge tab rendered by parent in controlled mode ── */
  if (!open) return null;

  /* ── Full sidebar ── */
  return (
    <aside style={{
      width: 220, padding: '20px 12px',
      background: t.bgSoft,
      borderRight: lang === 'ar' ? 'none' : `1px solid ${t.line}`,
      borderLeft: lang === 'ar' ? `1px solid ${t.line}` : 'none',
      display: 'flex', flexDirection: 'column', gap: 18,
      flexShrink: 0, height: '100%', overflow: 'hidden',
      direction: lang === 'ar' ? 'rtl' : 'ltr',
    }}>
      {/* Logo + close button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px' }}>
        <LanternMark size={30} color={t.accent}/>
        <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: t.ink, letterSpacing: '0.32em', textTransform: 'uppercase', flex: 1 }}>Mishkat</div>
        <button onClick={handleClose}
          style={{ width: 26, height: 26, borderRadius: 6, background: t.card, border: `1px solid ${t.line}`, color: t.inkMute, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: lang === 'ar' ? 'scaleX(-1)' : 'none' }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Streak chip */}
      {streak >= 2 && (
        <div style={{
          margin: '0 2px', padding: '10px 12px', borderRadius: 9,
          background: `linear-gradient(140deg, ${t.accent}1a, ${t.accent}08)`,
          border: `1px solid ${t.accent}33`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Icon d={Icons.flame} size={17} stroke={1.8} fill={t.accent} style={{ color: t.accent }}/>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontFamily: 'Fraunces', fontWeight: 400, fontSize: 19, color: t.ink, letterSpacing: '-0.02em' }}>{streak}</div>
            <div style={{ fontSize: 9, color: t.inkDim, marginTop: 2, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              {lang === 'fr' ? 'jours de suite' : 'أيام متتالية'}
            </div>
          </div>
        </div>
      )}

      {/* Menu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, overflowY: 'auto' }} className="no-scrollbar">
        {items.map((item, idx) => {
          const on = item.id === active;
          const newGroup = idx > 0 && item.group !== items[idx - 1].group;
          const groupLabel = newGroup ? (lang === 'ar' ? MENU_GROUPS[item.group]?.ar : MENU_GROUPS[item.group]?.fr) : '';
          return (
            <React.Fragment key={item.id}>
            {newGroup && (
              groupLabel
                ? <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.inkMute, padding: '14px 11px 6px' }}>{groupLabel}</div>
                : <div style={{ height: 1, background: t.lineSoft, margin: '12px 8px' }}/>
            )}
            <button onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 11,
                padding: '8px 11px', borderRadius: 7,
                background: on ? `${t.accent}14` : 'transparent',
                color: on ? t.ink : t.inkDim,
                fontFamily: 'Inter', fontSize: 12.5, fontWeight: on ? 500 : 400,
                position: 'relative', textAlign: 'left', width: '100%',
              }}>
              {on && <div style={{ position: 'absolute', left: -12, top: 8, bottom: 8, width: 2, background: t.accent, borderRadius: 2 }}/>}
              <span style={{ color: on ? t.accent : t.inkMute, display: 'inline-flex' }}>
                <Icon d={(Icons as Record<string, React.ReactNode>)[item.icon]} size={15}/>
              </span>
              {lang === 'ar' ? (item as any).labelAr : item.labelFr}
            </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Footer credits */}
      <div style={{ padding: '10px 8px', borderTop: `1px solid ${t.lineSoft}` }}>
        <div style={{ fontSize: 9.5, color: t.inkMute, letterSpacing: '0.14em' }}>Artisans du Savoir</div>
        <div style={{ fontSize: 10, color: t.inkMute, opacity: 0.6, marginTop: 2 }}>Rahima · @hamda_wa_chakra</div>
      </div>
    </aside>
  );
};

// ── AppFrame ──────────────────────────────────────────────────────────────────
interface AppFrameProps {
  active: string;
  title: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  onNavigate: (id: string) => void;
  streak?: number;
  isAdmin?: boolean;
  lang?: string;
  noPadding?: boolean;
}

export const AppFrame = ({ active, title, subtitle, headerRight, children, onNavigate, streak, isAdmin, lang, noPadding }: AppFrameProps) => {
  const t = useT();
  const isMobile = useIsMobile();

  return (
    <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, display: 'flex', overflow: 'hidden', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      <BgPattern t={t}/>

      {/* Sidebar — desktop only */}
      {!isMobile && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <AppSidebar active={active} onNavigate={onNavigate} streak={streak} isAdmin={isAdmin} lang={lang}/>
        </div>
      )}

      {/* Main */}
      <main style={{
        flex: 1, overflowY: 'auto',
        padding: noPadding ? 0 : isMobile ? '16px 16px 90px' : '26px 34px 36px',
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
      }} className="no-scrollbar">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: noPadding ? 0 : 22, flexShrink: 0 }}>
          <div>
            {subtitle && (
              <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>
                {subtitle}
              </div>
            )}
            <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: isMobile ? 26 : 32, margin: 0, color: t.ink, letterSpacing: '-0.02em' }}>
              {title}
            </h1>
          </div>
          {headerRight && <div style={{ flexShrink: 0 }}>{headerRight}</div>}
        </div>
        {children}
      </main>

      {/* Mobile bottom nav */}
      {isMobile && <AppSidebar active={active} onNavigate={onNavigate} streak={streak} isAdmin={isAdmin} lang={lang}/>}
    </div>
  );
};

// ── useIsMobile ───────────────────────────────────────────────────────────────
export const useIsMobile = () => {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);
  return mobile;
};

// ── useIsNarrow — covers mobile + small tablet (< 900px) ─────────────────────
export const useIsNarrow = () => {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 900 : false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 900);
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);
  return narrow;
};

// ── PageHeader : le même en-tête partout (sur-titre, titre, actions) ─────────
export const PageHeader = ({ eyebrow, title, right }: { eyebrow?: React.ReactNode; title: React.ReactNode; right?: React.ReactNode }) => {
  const t = useT();
  const isMobile = useIsMobile();
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        {eyebrow && (
          <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 500, marginBottom: 8 }}>{eyebrow}</div>
        )}
        <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 360, fontSize: isMobile ? 30 : 36, margin: 0, color: t.ink, letterSpacing: '-0.015em', lineHeight: 1.05 }}>{title}</h1>
      </div>
      {right && <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{right}</div>}
    </div>
  );
};

// ── AnimatedNumber : compte jusqu'à la valeur au montage et à chaque changement ──
export const AnimatedNumber = ({ value, duration = 900 }: { value: number; duration?: number }) => {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setShown(value); return; }
    let raf = 0;
    const from = 0, start = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(from + (value - from) * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{shown}</span>;
};
