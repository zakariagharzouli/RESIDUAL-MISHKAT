import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar as CalendarIcon, BookOpen, Target, Award,
  Palette, NotebookPen, Settings, ChevronRight, ChevronLeft, Languages,
  Trash2, Wind, Kanban, Flame, Moon, Sun, Shield,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang: string;
  setLang: (l: 'fr' | 'ar') => void;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  loginStreak?: number;
  theme?: string;
  onThemeToggle?: () => void;
  isAdmin?: boolean;
}

export const Sidebar = ({
  activeTab, setActiveTab, lang, setLang,
  isCollapsed, setIsCollapsed, loginStreak = 1, theme = 'light', onThemeToggle, isAdmin = false,
}: SidebarProps) => {

  const menuItems = [
    { id: 'dashboard',    icon: LayoutDashboard, labelFr: 'Tableau de bord', labelAr: 'لوحة التحكم' },
    { id: 'calendar',     icon: CalendarIcon,    labelFr: 'Calendrier',       labelAr: 'التقويم'     },
    { id: 'memorization', icon: BookOpen,         labelFr: 'Mémorisation',     labelAr: 'الحفظ'       },
    { id: 'goals',        icon: Target,           labelFr: 'Objectifs',        labelAr: 'الأهداف'     },
    { id: 'badges',       icon: Award,            labelFr: 'Badges',           labelAr: 'الإنجازات'   },
    { id: 'tasbih',       icon: Wind,             labelFr: 'Tasbih',           labelAr: 'تسبيح'       },
    { id: 'coloring',     icon: Palette,          labelFr: 'Coloriage',        labelAr: 'التلوين'     },
    { id: 'diftar',       icon: NotebookPen,      labelFr: 'Diftar',           labelAr: 'الدفتر'      },
    { id: 'kanban',       icon: Kanban,           labelFr: 'Suivi',            labelAr: 'المتابعة'    },
    { id: 'quran',        icon: BookOpen,         labelFr: 'Coran',            labelAr: 'القرآن'      },
    { id: 'settings',     icon: Settings,         labelFr: 'Réglages',         labelAr: 'الإعدادات'   },
    ...(isAdmin ? [{ id: 'admin', icon: Shield, labelFr: 'Admin', labelAr: 'الإدارة' }] : []),
  ];

  const isRtl = lang === 'ar';

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <>
    {/* Floating tab to reopen sidebar when collapsed — desktop only */}
    <AnimatePresence>
      {!isMobile && isCollapsed && (
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={() => setIsCollapsed(false)}
          className="fixed z-50 flex items-center justify-center"
          style={{
            top: '50%',
            left: 0,
            transform: 'translateY(-50%)',
            width: 20,
            height: 56,
            borderRadius: '0 10px 10px 0',
            background: 'var(--brand-surface)',
            border: '1px solid var(--border-subtle)',
            borderLeft: 'none',
            boxShadow: 'var(--shadow-soft)',
            color: 'var(--brand-primary)',
          }}
        >
          <ChevronRight size={13} />
        </motion.button>
      )}
    </AnimatePresence>

    <motion.div
      initial={false}
      animate={isMobile ? {} : {
        width: isCollapsed ? 0 : 280,
        opacity: isCollapsed ? 0 : 1,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        /* Mobile: bottom floating bar */
        'fixed bottom-3 left-3 right-3 h-20',
        'flex flex-row overflow-x-auto no-scrollbar',
        /* Desktop: floating left/right sidebar */
        'md:bottom-auto md:right-auto md:flex-col md:overflow-hidden',
        'md:h-[calc(100vh-3rem)] md:top-6',
        isRtl ? 'md:right-6 md:left-auto' : 'md:left-6 md:right-auto',
        /* Shared */
        'rounded-[1.75rem] md:rounded-[2rem] z-50',
        'p-2 md:p-5 gap-1 md:gap-1.5 justify-start',
      )}
      style={{
        background: 'var(--brand-surface)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-medium), inset 0 1px 0 0 rgba(255,255,255,0.45)',
        pointerEvents: !isMobile && isCollapsed ? 'none' : 'auto',
      }}
    >
      {/* ── Logo (desktop) ── */}
      <div className="hidden md:flex items-center justify-between mb-6 shrink-0 pt-1 px-1">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              key="logo"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                  <img src="/favicon-96x96.png" alt="Mishkat" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h1 className="text-gradient leading-none" style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: '18px' }}>
                    Mishkat
                  </h1>
                  <p className="text-[8px] uppercase tracking-[0.3em] mt-0.5 font-bold"
                     style={{ color: 'var(--brand-secondary)', opacity: 0.65 }}>
                    مِشْكَاة · حِفْظ القرآن
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-xl transition-all hover:scale-105 flex-shrink-0"
          style={{ background: 'color-mix(in srgb, var(--brand-primary) 8%, transparent)', color: 'var(--brand-primary)' }}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* ── Streak (desktop, expanded) ── */}
      <AnimatePresence>
        {!isCollapsed && loginStreak >= 2 && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: '1rem' }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="hidden md:flex items-center gap-3 px-3 py-2.5 rounded-xl overflow-hidden"
            style={{ background: 'color-mix(in srgb, var(--brand-primary) 8%, transparent)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: 'var(--brand-primary)' }}>
              <Flame size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-gradient leading-none">{loginStreak} jours</p>
              <p className="text-[9px] uppercase tracking-widest font-bold mt-0.5"
                 style={{ color: 'var(--brand-text-muted)' }}>
                {lang === 'fr' ? 'de suite' : 'متواصل'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Menu items ── */}
      <div className="flex md:flex-col gap-1 flex-1">
        {menuItems.map((item, idx) => {
          const label = lang === 'fr' ? item.labelFr : item.labelAr;
          const isActive = activeTab === item.id;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? label : ''}
              className={cn(
                'flex flex-col md:flex-row items-center gap-1.5 md:gap-3',
                'px-2 md:px-3 py-2 md:py-2.5 rounded-xl transition-all shrink-0',
                'min-w-[60px] md:min-w-0 relative group',
                isCollapsed ? 'md:justify-center' : ''
              )}
              style={isActive
                ? { background: 'var(--brand-primary)', color: '#fff', boxShadow: '0 4px 18px color-mix(in srgb, var(--brand-primary) 32%, transparent)' }
                : { color: 'color-mix(in srgb, var(--brand-primary) 55%, transparent)' }
              }
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div layoutId="sidebar-pill"
                  className="absolute inset-0 rounded-xl -z-10"
                  style={{ background: 'var(--brand-primary)' }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }} />
              )}
              {/* Hover bg */}
              {!isActive && (
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10"
                     style={{ background: 'color-mix(in srgb, var(--brand-primary) 6%, transparent)' }} />
              )}

              <item.icon
                size={17}
                className="transition-all duration-300 group-hover:scale-110 flex-shrink-0"
                style={isActive ? { color: '#fff' } : { color: 'var(--brand-primary)', opacity: 0.55 }}
              />

              {/* Label desktop */}
              {!isCollapsed && (
                <span className={cn(
                  'text-[12px] whitespace-nowrap leading-none hidden md:block',
                  isActive ? 'text-white font-semibold' : 'font-medium'
                )}
                style={isActive ? {} : { color: 'color-mix(in srgb, var(--brand-primary) 65%, transparent)' }}>
                  {label}
                </span>
              )}

              {/* Label mobile */}
              <span className="text-[8px] md:hidden whitespace-nowrap leading-none font-bold"
                    style={{ color: isActive ? '#fff' : 'color-mix(in srgb, var(--brand-primary) 50%, transparent)' }}>
                {label.slice(0, 6)}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* ── Bottom actions (desktop expanded) ── */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="hidden md:flex mt-auto flex-col gap-3 pt-3 border-t"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            {/* Credits */}
            <div className="px-3 py-3 rounded-xl relative overflow-hidden"
                 style={{ background: 'color-mix(in srgb, var(--brand-secondary) 7%, transparent)', border: '1px solid var(--border-accent)' }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-1"
                 style={{ color: 'var(--brand-secondary)' }}>Artisans du Savoir</p>
              <p className="text-[10px] font-medium mb-2" style={{ color: 'var(--brand-text-muted)' }}>
                Rahima · @hamda_wa_chakra
              </p>
              <div className="flex gap-3">
                <a href="https://www.instagram.com/hamda_wa_chakra" target="_blank" rel="noopener noreferrer"
                   className="text-[10px] font-black hover:scale-105 transition-transform"
                   style={{ color: 'var(--brand-primary)' }}>Instagram</a>
                <a href="https://www.tiktok.com/@hamda_wa_chakra" target="_blank" rel="noopener noreferrer"
                   className="text-[10px] font-black hover:scale-105 transition-transform"
                   style={{ color: 'var(--brand-primary)' }}>TikTok</a>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group"
                style={{ color: 'var(--brand-text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--brand-primary) 5%, transparent)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Languages size={15} className="group-hover:rotate-12 transition-transform flex-shrink-0"
                           style={{ color: 'var(--brand-secondary)' }} />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {lang === 'fr' ? 'العربية' : 'Français'}
                </span>
              </button>

              <button
                onClick={() => {
                  if (confirm(lang === 'fr' ? 'Voulez-vous vraiment tout réinitialiser ?' : 'هل تريد حقاً إعادة ضبط كل شيء؟')) {
                    localStorage.removeItem('mishkat_user_data');
                    window.location.reload();
                  }
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group"
                style={{ color: 'rgba(239,68,68,0.4)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Trash2 size={15} className="group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {lang === 'fr' ? 'Réinitialiser' : 'إعادة ضبط'}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </>
  );
};
