import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { cheerFor } from './lib/encouragements';
import { WhatsNew, WHATS_NEW_KEY } from './components/WhatsNew';
import { FlowerGiftOverlay } from './components/Flowers';
import { FlowerDef, rollFlower, addFlower, todayKey } from './lib/flowers';
import { ThemeContext, THEMES, DARK_THEMES, Theme } from './lib/theme';
import { OfflineBanner } from './components/OfflineBanner';
import { AppSidebar, LanternMark, useIsMobile } from './components/ui';
import { Dashboard } from './components/Dashboard';
import { Diftar } from './components/Diftar';
import { ColoringGrid } from './components/ColoringGrid';
import { GoalsSection } from './components/Goals';
import { TasbihSection } from './components/Tasbih';
import { MemorizationSection } from './components/Memorization';
import { CalendarSection } from './components/Calendar';
import { BadgesSection } from './components/Badges';
import { KanbanSection } from './components/Kanban';
import { SettingsSection } from './components/Settings';
import { QuranSection } from './components/Quran';
import { AdhkarSection } from './components/Adhkar';
import { QuizSection } from './components/Quiz';
import { JoursBlancsSection } from './components/JoursBlancs';
import { StudioSection } from './components/Studio';
import { GardenSection } from './components/Garden';
import { AdminSection } from './components/Admin';
import localforage from 'localforage';
import { UserData, Badge, generateAllSurahs, checkLoginStreak } from './types';
import { checkAndUnlockBadges } from './lib/badgeEngine';
import { TrophyUnlockOverlay } from './components/Trophy';
import { supabase, loadUserData, saveUserData, migrateLocalToSupabase, isAdminEmail } from './lib/supabase';
import { AuthScreen, REMEMBER_KEY, SESSION_ALIVE_KEY } from './components/Auth';
import { WelcomeSplash } from './components/WelcomeSplash';
import { OnboardingModal } from './components/Onboarding';
import { setSoundEnabled, playBadgeUnlock } from './lib/sounds';

// Map old theme name → new token key
const mapTheme = (old?: string): string => {
  if (old === 'sakura') return 'sakura';
  if (old === 'azur') return 'azur';
  if (old === 'emerald') return 'emerald';
  return 'gold';
};

const whatsNewSeen = () => { try { return !!localStorage.getItem(WHATS_NEW_KEY); } catch { return true; } };

export default function App() {
  const [activeTab, setActiveTab]   = useState('dashboard');
  const [lang, setLang]             = useState<'fr' | 'ar'>('fr');
  const [userData, setUserData]     = useState<UserData | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Badge[]>([]);
  const [updateWorker, setUpdateWorker]   = useState<ServiceWorker | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);
  const [showAuth,  setShowAuth]    = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [localOnly, setLocalOnly]   = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [diftarEditing, setDiftarEditing] = useState(false);
  const [flowerGifts, setFlowerGifts] = useState<{ f: FlowerDef; reason: 'jour' | 'sourate' }[]>([]);

  const isDark = userData?.settings?.darkMode ?? false;
  const themeMap = isDark ? DARK_THEMES : THEMES;
  const theme: Theme = themeMap[mapTheme(userData?.settings?.theme)] ?? themeMap.gold;
  const isMobile = useIsMobile();

  const userDataRef = useRef(userData);
  const supaDirtyRef = useRef(false);
  useEffect(() => { userDataRef.current = userData; }, [userData]);

  const saveNow = useCallback((dataToSave: UserData) => {
    if (supabaseUserId) {
      saveUserData(supabaseUserId, dataToSave).catch(() => {});
      supaDirtyRef.current = false;
    }
  }, [supabaseUserId]);

  // Mots de soutien après les actions importantes (un toast à la fois, jamais en rafale)
  const langRef = useRef(lang);
  useEffect(() => { langRef.current = lang; }, [lang]);
  const lastCheerRef = useRef(0);
  const memGiftRef = useRef<FlowerDef | null>(null);
  const cheer = (prev: UserData, next: UserData) => {
    const msg = cheerFor(prev, next, langRef.current);
    if (!msg || Date.now() - lastCheerRef.current < 6000) return;
    lastCheerRef.current = Date.now();
    setTimeout(() => toast(msg, { id: msg, duration: 4200, icon: <LanternMark size={20}/> }), 0);
  };

  const updateUserDataWithBadges = useCallback((updater: UserData | ((prev: UserData) => UserData)) => {
    setUserData(prev => {
      if (!prev) return prev;
      let next = typeof updater === 'function' ? updater(prev) : updater;
      cheer(prev, next);
      // Une sourate mémorisée offre une fleur rare ou mieux
      const newlyMem = next.surahs.some(s => s.status === 'memorized' && prev.surahs.find(p => p.id === s.id)?.status !== 'memorized');
      if (newlyMem) {
        const f = rollFlower(next, 'rare');
        next = addFlower(next, f, 'sourate');
        // L'updater peut être rejoué (mode strict) : seule la dernière fleur tirée, celle gardée, est annoncée
        memGiftRef.current = f;
        setTimeout(() => { const g = memGiftRef.current; if (g) { memGiftRef.current = null; setFlowerGifts(q => [...q, { f: g, reason: 'sourate' }]); } }, 0);
      }
      const { newBadges } = checkAndUnlockBadges(next);
      if (newBadges.length > 0) {
        const updated = { ...next, badges: [...next.badges, ...newBadges] };
        setNewlyUnlocked(prevNew => [...prevNew, ...newBadges.filter(b => !prevNew.some(p => p.id === b.id))]);
        playBadgeUnlock();
        return updated;
      }
      return next;
    });
  }, []);

  // ── Auth state listener ──────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // "Remember me" enforcement: if user logged in without remember-me,
        // the session must not survive a browser restart (sessionStorage is cleared on restart).
        const hasRemember  = !!localStorage.getItem(REMEMBER_KEY);
        const hasAliveFlag = !!sessionStorage.getItem(SESSION_ALIVE_KEY);
        if (!hasRemember && !hasAliveFlag) {
          supabase.auth.signOut().then(() => { setShowAuth(true); setAuthChecked(true); });
          return;
        }
        setSupabaseUserId(session.user.id);
        setShowAuth(false);
      } else if (!localOnly) {
        setShowAuth(true);
      }
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setSupabaseUserId(session.user.id);
        setShowAuth(false);
        if (_event === 'SIGNED_IN') {
          try {
            let cloudData = await migrateLocalToSupabase(session.user.id);
            if (!cloudData) cloudData = await loadUserData(session.user.id);
            if (cloudData) {
              if (!cloudData.surahs || !Array.isArray(cloudData.surahs)) cloudData.surahs = generateAllSurahs();
              if (!cloudData.diftarPages) cloudData.diftarPages = [];
              if (!cloudData.goals) cloudData.goals = [];
              if (!cloudData.badges) cloudData.badges = [];
              if (!cloudData.calendar) cloudData.calendar = [];
              if (!cloudData.settings) cloudData.settings = { theme: 'gold', notifications: true, dailyReminder: '20:00', fontSize: 'medium', showArabicNames: true, username: 'Hafiz' };
              if (typeof cloudData.tasbihCount !== 'number') cloudData.tasbihCount = 0;
              if (typeof cloudData.loginStreak !== 'number') cloudData.loginStreak = 1;
              cloudData.settings = { ...cloudData.settings, isAdmin: isAdminEmail(session.user.email) };
              setUserData(cloudData);
              if (!whatsNewSeen()) setShowWhatsNew(true);
              if (cloudData.settings?.showSplashOnLogin !== false) setShowSplash(true);
              return;
            }
          } catch {}
          // Fallback: no cloud data → will use local/default data; show splash if setting allows
          // (userData not set yet here, so splash is controlled per-path above)
        }
        setUserData(prev => prev ? {
          ...prev,
          settings: { ...prev.settings, isAdmin: isAdminEmail(session.user.email) },
        } : prev);
      } else if (!localOnly) {
        setSupabaseUserId(null);
        setShowAuth(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [localOnly]);

  // ── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let parsed: UserData | null = null;

        if (session?.user) {
          parsed = await migrateLocalToSupabase(session.user.id);
          if (!parsed) parsed = await loadUserData(session.user.id);
        }
        if (!parsed) {
          parsed = await localforage.getItem<UserData>('mishkat_user_data');
          if (!parsed) {
            const lsRaw = localStorage.getItem('mishkat_user_data');
            if (lsRaw) { try { parsed = JSON.parse(lsRaw); } catch {} }
          }
        }

        const today = new Date().toISOString().split('T')[0];

        if (parsed) {
          if (!parsed.surahs || !Array.isArray(parsed.surahs)) parsed.surahs = generateAllSurahs();
          if (!parsed.diftarPages || !Array.isArray(parsed.diftarPages)) parsed.diftarPages = [];
          if (!parsed.goals || !Array.isArray(parsed.goals)) parsed.goals = [];
          if (!parsed.badges || !Array.isArray(parsed.badges)) parsed.badges = [];
          if (!parsed.calendar || !Array.isArray(parsed.calendar)) parsed.calendar = [];
          if (!parsed.settings) parsed.settings = { theme: 'gold', notifications: true, dailyReminder: '20:00', fontSize: 'medium', showArabicNames: true, username: 'Hafiz' };
          if (typeof parsed.tasbihCount !== 'number') parsed.tasbihCount = 0;
          if (typeof parsed.loginStreak !== 'number') parsed.loginStreak = 1;
          if (typeof parsed.tasbihSessionBest !== 'number') parsed.tasbihSessionBest = 0;
          if (typeof parsed.onboarded !== 'boolean') parsed.onboarded = false;

          if (parsed.surahs && parsed.surahs[0]?.name === 'Surah 1') {
            const freshSurahs = generateAllSurahs();
            parsed.surahs = freshSurahs.map((fresh: any, i: number) => ({
              ...fresh,
              status: parsed!.surahs[i]?.status || 'not_started',
              color: parsed!.surahs[i]?.color,
            }));
          }
          if (parsed.lastLoginDate !== today) {
            const { newStreak } = checkLoginStreak(parsed);
            parsed.loginStreak = newStreak;
            parsed.lastLoginDate = today;
          }
          if (!parsed.settings.settingsVersion) {
            parsed.settings.settingsVersion = 1;
          }
          if (session?.user) {
            parsed.settings = { ...parsed.settings, isAdmin: isAdminEmail(session.user.email) };
          }
          const { newBadges } = checkAndUnlockBadges(parsed);
          if (newBadges.length > 0) parsed.badges = [...parsed.badges, ...newBadges];
          setUserData(parsed);
          if (!whatsNewSeen()) setShowWhatsNew(true);
        } else {
          const initial: UserData = {
            surahs: generateAllSurahs(), diftarPages: [],
            goals: [
              { id: '1', text: 'Mémoriser Sourate Al-Mulk', completed: false, month: 3 },
              { id: '2', text: 'Lire 5 pages par jour', completed: true, month: 3 },
            ],
            badges: [], calendar: [], tasbihCount: 0, onboarded: false,
            loginStreak: 1, lastLoginDate: today, tasbihSessionBest: 0,
            settings: { theme: 'gold', notifications: true, dailyReminder: '20:00', fontSize: 'medium', showArabicNames: true, username: 'Hafiz' },
          };
          initial.badges = checkAndUnlockBadges(initial).newBadges;
          setUserData(initial);
          setShowOnboarding(true);
          try { localStorage.setItem(WHATS_NEW_KEY, '1'); } catch { /* stockage indisponible */ }
        }
      } catch {
        const today = new Date().toISOString().split('T')[0];
        setUserData({
          surahs: generateAllSurahs(), diftarPages: [], goals: [], badges: [],
          calendar: [], tasbihCount: 0, onboarded: true, loginStreak: 1,
          lastLoginDate: today, tasbihSessionBest: 0,
          settings: { theme: 'gold', notifications: true, dailyReminder: '20:00', fontSize: 'medium', showArabicNames: true, username: 'Hafiz' },
        });
      }
    };
    load();
  }, []);

  // ── Save local (immédiat) ────────────────────────────────────────────────
  useEffect(() => {
    if (!userData) return;
    localforage.setItem('mishkat_user_data', userData).catch(() => {});
    if (supabaseUserId) supaDirtyRef.current = true;
  }, [userData, supabaseUserId]);

  // ── Save Supabase (intervalle) ───────────────────────────────────────────
  useEffect(() => {
    if (!supabaseUserId) return;
    const sec = userData?.settings?.autoSaveInterval ?? 60;
    if (sec === 0) return; // sauvegarde manuelle uniquement
    const id = setInterval(() => {
      if (supaDirtyRef.current && userDataRef.current) {
        saveUserData(supabaseUserId, userDataRef.current).catch(() => {});
        supaDirtyRef.current = false;
      }
    }, sec * 1000);
    return () => clearInterval(id);
  }, [supabaseUserId, userData?.settings?.autoSaveInterval]);

  // ── Fleur du jour : offerte à la première ouverture de chaque journée ──
  const giftedRef = useRef(false);
  useEffect(() => {
    if (!userData || giftedRef.current) return;
    giftedRef.current = true;
    if (userData.flowers?.lastGift === todayKey()) return;
    const f = rollFlower(userData);
    setUserData(prev => (prev ? addFlower(prev, f, 'jour') : prev));
    setFlowerGifts(q => [...q, { f, reason: 'jour' }]);
  }, [userData]);

  // ── Rappel quotidien : une seule notification par jour, à l'heure choisie ──
  useEffect(() => {
    const s = userData?.settings;
    if (!s || s.notifications === false || !s.dailyReminder) return;
    if (!('Notification' in window)) return;
    const check = () => {
      if (Notification.permission !== 'granted') return;
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      if (localStorage.getItem('mishkat_last_notif_date') === today) return;
      const [hh, mm] = s.dailyReminder.split(':').map(Number);
      if (now.getHours() < hh || (now.getHours() === hh && now.getMinutes() < mm)) return;
      localStorage.setItem('mishkat_last_notif_date', today);
      const title = 'Mishkat';
      const body = lang === 'fr' ? 'Ta fleur du jour t\'attend, et ta séance de révision aussi.' : 'زهرة اليوم بانتظارك، وجلسة المراجعة أيضاً.';
      navigator.serviceWorker?.ready
        .then(reg => reg.showNotification(title, { body, icon: '/icon-192.png', badge: '/favicon-96x96.png', tag: 'mishkat-reminder' }))
        .catch(() => new Notification(title, { body, icon: '/icon-192.png' }));
    };
    check();
    const id = setInterval(check, 60 * 1000);
    return () => clearInterval(id);
  }, [lang, userData?.settings?.notifications, userData?.settings?.dailyReminder]);

  // ── SW update ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleUpdate = (e: any) => {
      setUpdateWorker(e.detail.waiting);
      setShowUpdatePrompt(true);
    };
    window.addEventListener('mishkatUpdateAvailable', handleUpdate);
    return () => window.removeEventListener('mishkatUpdateAvailable', handleUpdate);
  }, []);

  // Apply user settings to the DOM
  useEffect(() => {
    if (!userData?.settings) return;
    const s = userData.settings;

    let styleEl = document.getElementById('mishkat-settings-css') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'mishkat-settings-css';
      document.head.appendChild(styleEl);
    }

    const fontSizeMap: Record<string, string> = { small: '13px', medium: '15px', large: '18px' };
    const lineMap: Record<string, string>     = { normal: '1.5', comfortable: '1.8', large: '2.2' };
    const baseFont = fontSizeMap[s.fontSize ?? 'medium'];
    const lineH    = lineMap[s.lineSpacing  ?? 'normal'];

    styleEl.textContent = `
      body {
        font-size: ${baseFont};
        line-height: ${lineH};
        ${s.highContrast    ? 'filter: contrast(1.3);' : ''}
        ${s.dyslexiaFont    ? "font-family: 'OpenDyslexic', sans-serif !important;" : ''}
      }
      ${s.reduceAnimations ? '*, *::before, *::after { transition-duration: 0s !important; animation-duration: 0s !important; }' : ''}
      ${s.dyslexiaFont     ? '[lang="ar"], [dir="rtl"], .arabic { font-family: "Amiri Quran", serif !important; }' : ''}
    `;

    // Load OpenDyslexic font on demand
    const fontLinkId = 'mishkat-dyslexic-font';
    if (s.dyslexiaFont && !document.getElementById(fontLinkId)) {
      const link = document.createElement('link');
      link.id   = fontLinkId;
      link.rel  = 'stylesheet';
      link.href = 'https://fonts.cdnfonts.com/css/opendyslexic';
      document.head.appendChild(link);
    }

    // uiZoom on the app root
    const appRoot = document.getElementById('mishkat-app-root');
    if (appRoot) appRoot.style.zoom = `${s.uiZoom ?? 100}%`;

    setSoundEnabled(s.soundEffects ?? true);
  }, [userData?.settings]);

  const handleSignOut = () => {
    setSupabaseUserId(null);
    setUserData(null);
    setLocalOnly(false);
    setShowAuth(true);
  };

  // ── Trial popup (1 month free, non-admin users) ──────────────────────────
  useEffect(() => {
    if (!userData || userData.settings?.isAdmin) return;
    const TRIAL_KEY = 'mishkat_trial_ack';
    if (localStorage.getItem(TRIAL_KEY)) return;
    const TRIAL_START_KEY = 'mishkat_trial_start';
    if (!localStorage.getItem(TRIAL_START_KEY)) {
      localStorage.setItem(TRIAL_START_KEY, Date.now().toString());
    }
    const delay = setTimeout(() => setShowTrialPopup(true), 1200);
    return () => clearTimeout(delay);
  }, [userData?.settings?.isAdmin]);

  const applyUpdate = () => {
    if (updateWorker) {
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return; refreshing = true; window.location.reload();
      });
      updateWorker.postMessage({ type: 'SKIP_WAITING' });
    } else window.location.reload();
  };

  // ── Auth screen ──────────────────────────────────────────────────────────
  if (!authChecked && !localOnly) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: isDark ? '#0c0a08' : '#f8f3e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LanternMark size={48} color={isDark ? '#d4a64a' : '#c8962a'}/>
      </div>
    );
  }

  if (showAuth && !localOnly) {
    return (
      <ThemeContext.Provider value={theme}>
        <AuthScreen lang={lang} onContinueLocal={() => { setLocalOnly(true); setShowAuth(false); }}/>
      </ThemeContext.Provider>
    );
  }

  if (showSplash) {
    return <WelcomeSplash lang={lang} onDone={() => setShowSplash(false)} />;
  }

  if (!userData) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: isDark ? '#0c0a08' : '#f8f3e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LanternMark size={48} color={isDark ? '#d4a64a' : '#c8962a'}/>
      </div>
    );
  }

  const t = theme;
  const commonProps = { userData, setUserData: updateUserDataWithBadges, lang };

  return (
    <ThemeContext.Provider value={t}>
      <OfflineBanner lang={lang} />
      <Toaster
        containerStyle={{ bottom: isMobile ? 92 : 28 }}
        position="bottom-center"
        toastOptions={{
          style: { background: t.card, color: t.ink, border: `1px solid ${t.line}`, fontFamily: 'Inter, sans-serif', fontSize: 14, lineHeight: 1.45, borderRadius: 14, padding: '12px 16px', maxWidth: 420, boxShadow: '0 12px 32px -12px rgba(30,20,4,0.3)' },
          success: { iconTheme: { primary: t.accent, secondary: t.card } },
          error:   { iconTheme: { primary: '#ef4444', secondary: t.card } },
          duration: 2500,
        }}
      />
      {/* SVG colour-blind filters */}
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
          <filter id="deuteranopia"><feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0"/></filter>
          <filter id="protanopia"><feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0"/></filter>
          <filter id="tritanopia"><feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0"/></filter>
        </defs>
      </svg>

      {/* Full-screen layout */}
      <div id="mishkat-app-root" style={{ '--brand-primary': t.accent, '--brand-secondary': t.accentBright, '--brand-accent': t.accent, '--brand-text-muted': t.inkMute, '--border-subtle': t.line, '--brand-bg': t.bg, '--brand-bg-soft': t.bgSoft, width: '100vw', height: '100vh', background: t.bg, display: 'flex', overflow: 'hidden', fontFamily: 'Inter, sans-serif', color: t.ink, position: 'relative' } as React.CSSProperties}>
        {/* Fond vivant : lumières douces qui dérivent, teinte selon le moment de la journée */}
        {!userData.settings?.staticBackground && (() => {
          const h = new Date().getHours();
          const tint = h < 7 ? '#8E7CC3' : h < 11 ? '#F2B880' : h < 17 ? t.accentBright : h < 20 ? '#E8907A' : '#6C7FC9';
          return (
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
              <div className="mk-glow mk-glow-a" style={{ background: `radial-gradient(circle, ${t.accent}${isDark ? '24' : '2e'}, transparent 65%)` }}/>
              <div className="mk-glow mk-glow-b" style={{ background: `radial-gradient(circle, ${tint}${isDark ? '1c' : '26'}, transparent 65%)` }}/>
              <div className="mk-glow mk-glow-c" style={{ background: `radial-gradient(circle, ${t.accentBright}${isDark ? '14' : '1c'}, transparent 65%)` }}/>
            </div>
          );
        })()}
        {/* Geometric background pattern */}
        <svg width="100%" height="100%" className={userData.settings?.staticBackground ? undefined : 'mk-drift'} style={{ position: 'absolute', inset: 0, opacity: isDark ? 0.045 : 0.07, pointerEvents: 'none', zIndex: 0 }}>
          <defs>
            {/* Khatam : étoile à huit branches, en treillis discret */}
            <pattern id="app-pat" x="0" y="0" width="96" height="96" patternUnits="userSpaceOnUse">
              <path d="M48 30l5.3 12.7L66 48l-12.7 5.3L48 66l-5.3-12.7L30 48l12.7-5.3z" fill="none" stroke={t.accent} strokeWidth="0.8"/>
              <path d="M48 18v12M48 66v12M18 48h12M66 48h12" stroke={t.accent} strokeWidth="0.6"/>
              <circle cx="0" cy="0" r="2" fill={t.accent}/><circle cx="96" cy="0" r="2" fill={t.accent}/><circle cx="0" cy="96" r="2" fill={t.accent}/><circle cx="96" cy="96" r="2" fill={t.accent}/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#app-pat)"/>
        </svg>

        {/* Sidebar — desktop (controlled: edge tab button at root level below) */}
        <div className="hidden md:block" style={{ position: 'relative', zIndex: 1, flexShrink: 0, width: sidebarOpen && !diftarEditing ? undefined : 0, overflow: 'hidden', transition: 'width 0.2s ease' }}>
          <AppSidebar
            active={activeTab}
            onNavigate={setActiveTab}
            streak={userData.loginStreak}
            isAdmin={userData.settings?.isAdmin}
            lang={lang}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', overflowX: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }} className="no-scrollbar">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
            >
              {activeTab === 'dashboard'    && <Dashboard {...commonProps} onNavigate={setActiveTab}/>}
              {activeTab === 'diftar'       && <Diftar userData={userData} setUserData={updateUserDataWithBadges} lang={lang} onSaveNow={saveNow} onEditingChange={setDiftarEditing}/>}
              {!['dashboard','diftar'].includes(activeTab) && (
                <div style={{ flex: 1, minWidth: 0, padding: isMobile ? '16px 14px 100px' : '26px 28px 36px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {activeTab === 'coloring'     && <ColoringGrid {...commonProps}/>}
                  {activeTab === 'goals'        && <GoalsSection {...commonProps}/>}
                  {activeTab === 'tasbih'       && <TasbihSection {...commonProps}/>}
                  {activeTab === 'memorization' && <MemorizationSection {...commonProps}/>}
                  {activeTab === 'calendar'     && <CalendarSection {...commonProps}/>}
                  {activeTab === 'badges'       && <BadgesSection userData={userData} lang={lang}/>}
                  {activeTab === 'kanban'       && <KanbanSection {...commonProps}/>}
                  {activeTab === 'quran'        && <QuranSection userData={userData!} lang={lang} />}
                  {activeTab === 'adhkar'       && <AdhkarSection lang={lang} />}
                  {activeTab === 'quiz'         && <QuizSection lang={lang} />}
                  {activeTab === 'joursblancs'  && <JoursBlancsSection {...commonProps}/>}
                  {activeTab === 'studio'       && <StudioSection userData={userData} lang={lang}/>}
                  {activeTab === 'garden'       && <GardenSection userData={userData} lang={lang} onNavigate={setActiveTab}/>}
                  {activeTab === 'settings'     && <SettingsSection userData={userData} setUserData={updateUserDataWithBadges} lang={lang} setLang={setLang} onSignOut={!localOnly ? handleSignOut : undefined}/>}
                  {activeTab === 'admin'        && userData.settings?.isAdmin && <AdminSection userData={userData} lang={lang}/>}
                </div>
              )}
            </motion.div>
        </main>

        {/* Mobile bottom nav */}
        <div className="md:hidden" style={{ position: 'relative', zIndex: 1, display: diftarEditing ? 'none' : undefined }}>
          <AppSidebar active={activeTab} onNavigate={setActiveTab} streak={userData.loginStreak} isAdmin={userData.settings?.isAdmin} lang={lang}/>
        </div>

        {/* Sidebar edge-reopen tab — desktop only, rendered at root level to avoid z-index burial */}
        {!sidebarOpen && !diftarEditing && (
          <button
            className="hidden md:flex"
            onClick={() => setSidebarOpen(true)}
            title="Ouvrir la navigation"
            style={{
              position: 'fixed', left: 0, top: '50%', transform: 'translateY(-50%)',
              zIndex: 9999, width: 18, height: 60,
              borderRadius: '0 10px 10px 0',
              background: t.bgSoft,
              border: `1px solid ${t.line}`, borderLeft: 'none',
              alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: t.inkMute,
              boxShadow: '3px 0 12px rgba(0,0,0,0.1)',
              padding: 0,
            }}
          >
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Célébration des trophées, visible depuis n'importe quel écran */}
      {newlyUnlocked.length > 0 && (
        <TrophyUnlockOverlay badges={newlyUnlocked} lang={lang} onDone={() => setNewlyUnlocked([])}/>
      )}

      {/* Annonce de mise à jour, une fois par utilisateur */}
      {showWhatsNew && !showOnboarding && newlyUnlocked.length === 0 && (
        <WhatsNew name={userData.settings?.username || 'Hafiz'} lang={lang}
          onClose={(goTo) => {
            try { localStorage.setItem(WHATS_NEW_KEY, '1'); } catch { /* stockage indisponible */ }
            setShowWhatsNew(false);
            if (goTo) setActiveTab(goTo);
          }}/>
      )}

      {/* Fleur du jour, après les autres annonces */}
      <AnimatePresence>
        {flowerGifts.length > 0 && !showWhatsNew && !showOnboarding && newlyUnlocked.length === 0 && (
          <FlowerGiftOverlay key={flowerGifts[0].f.id + flowerGifts.length} f={flowerGifts[0].f} reason={flowerGifts[0].reason}
            count={userData.flowers?.got[flowerGifts[0].f.id] ?? 1} lang={lang}
            onClose={() => setFlowerGifts(q => q.slice(1))}
            onSeeAll={() => { setFlowerGifts(q => q.slice(1)); setActiveTab('garden'); }}/>
        )}
      </AnimatePresence>

      {/* Onboarding modal */}
      {showOnboarding && (
        <OnboardingModal lang={lang} onClose={() => setShowOnboarding(false)}/>
      )}

      {/* Trial popup */}
      {showTrialPopup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9990, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: 22, maxWidth: 440, width: '100%', padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: 36 }}>🌙</div>
            <div>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 24, color: t.ink, marginBottom: 6 }}>
                {lang === 'fr' ? 'Bienvenue dans Mishkat' : 'مرحباً في مشكاة'}
              </div>
              <div style={{ fontSize: 10, color: t.accentBright, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
                {lang === 'fr' ? 'Période de découverte' : 'فترة الاكتشاف'}
              </div>
            </div>
            <div style={{ background: `${t.accent}0d`, border: `1px solid ${t.accent}22`, borderRadius: 14, padding: '18px 22px', width: '100%' }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 48, color: t.accent, lineHeight: 1, marginBottom: 6 }}>1</div>
              <div style={{ fontSize: 11, color: t.ink, fontWeight: 600 }}>{lang === 'fr' ? 'mois gratuit' : 'شهر مجاناً'}</div>
              <div style={{ fontSize: 10, color: t.inkMute, marginTop: 4, lineHeight: 1.6 }}>
                {lang === 'fr'
                  ? 'Profite de toutes les fonctionnalités sans limitation. Après cette période, Mishkat deviendra payant et les comptes non renouvelés seront supprimés.'
                  : 'استمتع بجميع الميزات دون قيود. بعد هذه الفترة، ستصبح مشكاة مدفوعة وستُحذف الحسابات غير المجددة.'}
              </div>
            </div>
            <div style={{ fontSize: 11, color: t.inkMute, lineHeight: 1.7 }}>
              {lang === 'fr'
                ? '⚠ Les comptes administrateurs ne seront jamais supprimés.'
                : '⚠ لن تُحذف حسابات المشرفين أبداً.'}
            </div>
            <button
              onClick={() => { localStorage.setItem('mishkat_trial_ack', '1'); setShowTrialPopup(false); }}
              style={{ width: '100%', padding: '13px', borderRadius: 12, background: t.accent, color: '#1a0f00', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
              {lang === 'fr' ? 'J\'ai compris — Bismillah !' : 'فهمت — بسم الله!'}
            </button>
          </div>
        </div>
      )}

      {/* Update prompt */}
      {showUpdatePrompt && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, width: 'calc(100% - 48px)', maxWidth: 360, pointerEvents: 'auto' }}>
          <div style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: t.accent, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>
                {lang === 'fr' ? 'Mise à jour disponible' : 'تحديث متاح'}
              </div>
              <div style={{ fontSize: 11, color: t.inkDim, marginTop: 2 }}>
                {lang === 'fr' ? 'Nouvelle version de Mishkat !' : 'إصدار جديد من مشكاة!'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <button onClick={applyUpdate} style={{ padding: '8px 14px', borderRadius: 8, background: t.accent, color: '#1a0f00', fontFamily: 'Inter', fontWeight: 600, fontSize: 12 }}>
                {lang === 'fr' ? 'Actualiser' : 'تحديث'}
              </button>
              <button onClick={() => setShowUpdatePrompt(false)} style={{ padding: '6px', borderRadius: 8, background: 'transparent', color: t.inkMute, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Ignorer">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 1l11 11M12 1L1 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </ThemeContext.Provider>
  );
}
