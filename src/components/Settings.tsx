import React, { useState, useRef, useEffect } from 'react';
import { UserData, UserSettings } from '../types';
import { useT } from '../lib/theme';
import { Icon, Icons, useIsNarrow } from './ui';
import { signOut } from '../lib/supabase';

export const SettingsSection = ({
  userData, setUserData, lang, setLang, onSignOut,
}: { userData: UserData; setUserData: React.Dispatch<React.SetStateAction<UserData>>; lang: string; setLang?: (l: 'fr' | 'ar') => void; onSignOut?: () => void }) => {
  const t = useT();
  const narrow = useIsNarrow();
  const settings = userData.settings;
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const importRef = useRef<HTMLInputElement>(null);
  const fr = lang === 'fr';

  useEffect(() => {
    if ('Notification' in window) setNotifPermission(Notification.permission);
  }, []);

  const sendPWANotification = async (title: string, body: string) => {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/favicon-96x96.png',
        tag: 'mishkat-reminder',
      });
    } catch {
      new Notification(title, { body, icon: '/icon-192.png' });
    }
  };

  const handleNotifToggle = async (enable: boolean) => {
    if (!enable) { updateSettings({ notifications: false }); return; }
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      updateSettings({ notifications: true });
      await sendPWANotification(
        'Mishkat 🕌',
        fr ? 'Les rappels quotidiens sont activés !' : 'تم تفعيل التذكيرات اليومية!'
      );
    }
  };

  useEffect(() => {
    if (!settings.notifications || !settings.dailyReminder || notifPermission !== 'granted') return;
    const today = new Date().toISOString().split('T')[0];
    const lastDate = localStorage.getItem('mishkat_last_notif_date');
    if (lastDate === today) return;
    const [hh, mm] = settings.dailyReminder.split(':').map(Number);
    const now = new Date();
    if (now.getHours() > hh || (now.getHours() === hh && now.getMinutes() >= mm)) {
      localStorage.setItem('mishkat_last_notif_date', today);
      const body = fr ? `C'est l'heure de votre révision du Coran !` : 'حان وقت مراجعة القرآن الكريم!';
      navigator.serviceWorker?.ready.then(reg =>
        reg.showNotification('Mishkat 🕌', { body, icon: '/icon-192.png', badge: '/favicon-96x96.png', tag: 'mishkat-reminder' })
      ).catch(() => new Notification('Mishkat 🕌', { body }));
    }
  }, [settings.notifications, settings.dailyReminder, notifPermission, fr]);

  const NAV_SECTIONS = [
    { id: 'profile',       labelFr: 'Profil',          labelAr: 'الملف الشخصي' },
    { id: 'appearance',    labelFr: 'Apparence',        labelAr: 'المظهر'       },
    { id: 'lecture',       labelFr: 'Lecture',          labelAr: 'القراءة'      },
    { id: 'notifications', labelFr: 'Notifications',    labelAr: 'التنبيهات'    },
    { id: 'accessibility', labelFr: 'Accessibilité',    labelAr: 'إمكانية الوصول'},
    { id: 'data',          labelFr: 'Données',          labelAr: 'البيانات'     },
    { id: 'about',         labelFr: 'À propos',         labelAr: 'حول التطبيق'  },
  ];

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setUserData((prev: UserData) => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const exportData = () => {
    const json = JSON.stringify(userData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mishkat-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.surahs && parsed.settings) {
          setUserData(parsed);
          setSaved(true);
          setTimeout(() => setSaved(false), 1500);
        }
      } catch {}
    };
    reader.readAsText(file);
  };

  const themes = [
    { id: 'gold',    labelFr: 'Or',       labelAr: 'ذهبي',   bg: '#f8f3e9', accent: '#c8962a', accentBright: '#d4a64a' },
    { id: 'sakura',  labelFr: 'Sakura',   labelAr: 'ساكورا', bg: '#fdf0f4', accent: '#c85068', accentBright: '#d96b7a' },
    { id: 'azur',    labelFr: 'Azur',     labelAr: 'أزرق',   bg: '#f0f5fa', accent: '#4580c0', accentBright: '#5b9bd5' },
    { id: 'emerald', labelFr: 'Émeraude', labelAr: 'زمردي',  bg: '#f0f8f2', accent: '#4a9870', accentBright: '#5fb088' },
  ];

  const memorizedCount = userData.surahs.filter(s => s.status === 'memorized').length;
  const completedGoals = userData.goals.filter(g => g.completed).length;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', background: t.card, border: `1px solid ${t.line}`,
    borderRadius: 8, color: t.ink, fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };

  const card: React.CSSProperties = { background: t.card, border: `1px solid ${t.line}`, borderRadius: 14, padding: '20px 22px' };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12, position: 'relative', flexShrink: 0, cursor: 'pointer',
        background: value ? t.accent : t.cardElev, border: `1px solid ${value ? t.accent : t.line}`,
        transition: 'background 0.2s',
      }}>
      <div style={{
        position: 'absolute', top: 3, left: value ? 22 : 3, width: 16, height: 16, borderRadius: '50%',
        background: value ? '#1a0f00' : t.inkMute, transition: 'left 0.2s',
      }}/>
    </button>
  );


  const SegButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick}
      style={{
        flex: 1, padding: '9px', borderRadius: 8, cursor: 'pointer',
        background: active ? t.accent : 'transparent',
        color: active ? '#1a0f00' : t.inkMute,
        fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>
      {children}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 32 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 32, color: t.ink }}>
            {fr ? 'Paramètres' : 'الإعدادات'}
          </div>
          <div style={{ fontSize: 10, color: t.inkMute, letterSpacing: '0.3em', textTransform: 'uppercase', marginTop: 4 }}>
            {fr ? 'Personnalisation · accessibilité · données' : 'تخصيص · وصول · بيانات'}
          </div>
        </div>
        {saved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: `${t.accentSoft}30`, color: t.accentBright, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            <Icon d={Icons.check} size={12} color={t.accentBright}/>
            {fr ? 'Sauvegardé' : 'تم الحفظ'}
          </div>
        )}
      </div>

      {/* Nav pills (mobile) ou sidebar nav (desktop) */}
      {narrow ? (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {NAV_SECTIONS.map(s => {
            const active = activeSection === s.id;
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 999, fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer', background: active ? `${t.accent}18` : t.bgSoft, border: `1px solid ${active ? `${t.accent}44` : t.line}`, color: active ? t.ink : t.inkDim }}>
                {fr ? s.labelFr : s.labelAr}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* 2-column grid: sidebar + content */}
      <div style={{ display: 'grid', gridTemplateColumns: narrow ? 'minmax(0, 1fr)' : '200px minmax(0, 1fr)', gap: 14, alignItems: 'start' }}>

        {/* Sidebar nav — desktop only */}
        {!narrow && (
          <div style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: 14, padding: '14px 4px', position: 'sticky', top: 16 }}>
            {NAV_SECTIONS.map(s => {
              const active = activeSection === s.id;
              return (
                <div key={s.id} onClick={() => setActiveSection(s.id)}
                  style={{ padding: '9px 16px', fontSize: 12.5, cursor: 'pointer', color: active ? t.ink : t.inkDim, fontWeight: active ? 500 : 400, borderLeft: `2px solid ${active ? t.accent : 'transparent'}`, background: active ? `${t.accent}10` : 'transparent', transition: 'all 0.15s' }}>
                  {fr ? s.labelFr : s.labelAr}
                </div>
              );
            })}
          </div>
        )}

        {/* Content area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Stats — visible only on profile section */}
      {(activeSection === 'profile' || narrow) && (
      <div style={card}>
        <div style={{ fontSize: 10, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>
          {fr ? 'Votre progression' : 'تقدمك'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: narrow ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
          {[
            { value: memorizedCount,          label: fr ? 'Sourates'      : 'السور'    },
            { value: completedGoals,           label: fr ? 'Objectifs'     : 'الأهداف'  },
            { value: userData.badges.length,   label: fr ? 'Badges'        : 'الشارات'  },
            { value: userData.loginStreak || 1,label: fr ? 'Jours de suite': 'الأيام'   },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28, color: t.accent, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 9.5, color: t.inkMute, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Profile */}
        {(activeSection === 'profile' || narrow) && (
        <div style={card}>
          <div style={{ fontSize: 10, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>
            {fr ? 'Profil' : 'الملف الشخصي'}
          </div>
          {/* Avatar row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${t.accent}, ${t.accentBright})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, serif', fontSize: 26, color: '#1a0f00', fontWeight: 500, flexShrink: 0 }}>
              {(settings.username || '?')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 19, color: t.ink, fontWeight: 300 }}>{settings.username || (fr ? 'Anonyme' : 'مجهول')}</div>
              <div style={{ fontSize: 11, color: t.inkDim, marginTop: 2 }}>{fr ? 'Mishkat · حِفْظ القرآن' : 'مشكاة · حِفْظ القرآن'}</div>
              {(userData.loginStreak || 1) > 1 && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, padding: '3px 10px', borderRadius: 999, background: `${t.accent}18`, fontSize: 11, color: t.accent }}>
                  <Icon d={Icons.flame} size={11} color={t.accent}/> {userData.loginStreak} {fr ? 'jours' : 'يوم'}
                </div>
              )}
            </div>
          </div>
          {/* Langue de l'interface */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: `1px solid ${t.lineSoft}` }}>
            <span style={{ fontSize: 12, color: t.inkDim }}>{fr ? 'Langue' : 'اللغة'}</span>
            <div style={{ display: 'flex', gap: 4, padding: 3, background: t.cardElev, borderRadius: 8, border: `1px solid ${t.line}` }}>
              {(['fr', 'ar'] as const).map(l => (
                <button key={l} onClick={() => setLang?.(l)}
                  style={{ padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none',
                    background: lang === l ? t.accent : 'transparent',
                    color: lang === l ? '#1a0f00' : t.inkDim,
                  }}>
                  {l === 'fr' ? 'Français' : 'العربية'}
                </button>
              ))}
            </div>
          </div>

          {/* Field rows */}
          {[
            { label: fr ? "Nom d'utilisateur" : 'اسم المستخدم', value: settings.username, onChange: (v: string) => updateSettings({ username: v }), placeholder: fr ? 'Votre nom…' : 'اسمك…' },
            { label: fr ? 'Ville (prière)' : 'المدينة (الصلاة)', value: settings.city ?? '', onChange: (v: string) => updateSettings({ city: v }), placeholder: fr ? 'Ex: Paris, Alger…' : 'مثال: الجزائر…' },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: `1px solid ${t.lineSoft}`, gap: 12 }}>
              <span style={{ fontSize: 12, color: t.inkDim, flexShrink: 0 }}>{f.label}</span>
              <input type="text" value={f.value} onChange={e => f.onChange(e.target.value)} placeholder={f.placeholder}
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12.5, color: t.ink, textAlign: 'right', width: '100%', fontFamily: 'inherit' }}/>
            </div>
          ))}

          {onSignOut && (
            <div style={{ paddingTop: 14, marginTop: 4 }}>
              <button
                onClick={async () => { await signOut(); onSignOut(); }}
                style={{ width: '100%', padding: '10px', borderRadius: 9, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.05)', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.05em' }}>
                {fr ? 'Se déconnecter' : 'تسجيل الخروج'}
              </button>
            </div>
          )}
        </div>
        )}

        {/* Appearance */}
        {(activeSection === 'appearance' || narrow) && (
        <div style={card}>
          <div style={{ fontSize: 10, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>
            {fr ? 'Apparence' : 'المظهر'}
          </div>

          {/* Dark / Light mode */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: t.inkDim, marginBottom: 8 }}>{fr ? 'Mode' : 'الوضع'}</div>
            <div style={{ display: 'flex', gap: 4, padding: 4, background: t.cardElev, borderRadius: 10 }}>
              <SegButton active={!(settings.darkMode ?? false)} onClick={() => updateSettings({ darkMode: false })}>
                ☀ {fr ? 'Clair' : 'فاتح'}
              </SegButton>
              <SegButton active={settings.darkMode === true} onClick={() => updateSettings({ darkMode: true })}>
                ☾ {fr ? 'Sombre' : 'داكن'}
              </SegButton>
            </div>
          </div>

          {/* Theme swatches — 3 color dots */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: t.inkDim, marginBottom: 10 }}>{fr ? 'Thème' : 'السمة'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
              {themes.map(theme => {
                const isActive = settings.theme === theme.id;
                return (
                  <button key={theme.id} onClick={() => updateSettings({ theme: theme.id as any })}
                    style={{ padding: 10, background: isActive ? `${t.accent}10` : t.cardElev, border: `1px solid ${isActive ? t.accent : t.line}`, borderRadius: 8, cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, background: theme.accent }}/>
                      <div style={{ width: 16, height: 16, borderRadius: 4, background: theme.accentBright }}/>
                      <div style={{ width: 16, height: 16, borderRadius: 4, background: theme.bg, border: `1px solid ${theme.accent}44` }}/>
                    </div>
                    <div style={{ fontSize: 11, color: isActive ? t.accent : t.ink, fontWeight: isActive ? 600 : 400 }}>
                      {fr ? theme.labelFr : theme.labelAr}
                    </div>
                    {isActive && <div style={{ fontSize: 9, color: t.accent, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 3 }}>{fr ? 'Actuel' : 'الحالي'}</div>}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9.5, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
              {fr ? 'Taille du texte' : 'حجم الخط'}
            </div>
            <div style={{ display: 'flex', gap: 4, padding: 4, background: t.cardElev, borderRadius: 10 }}>
              {[
                { id: 'small', labelFr: 'Petit', labelAr: 'صغير' },
                { id: 'medium', labelFr: 'Moyen', labelAr: 'متوسط' },
                { id: 'large', labelFr: 'Grand', labelAr: 'كبير' },
              ].map(f => (
                <SegButton key={f.id} active={settings.fontSize === f.id} onClick={() => updateSettings({ fontSize: f.id as any })}>
                  {fr ? f.labelFr : f.labelAr}
                </SegButton>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 9.5, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
              {fr ? 'Zoom interface' : 'تكبير الواجهة'}
            </div>
            <div style={{ display: 'flex', gap: 4, padding: 4, background: t.cardElev, borderRadius: 10 }}>
              {([80, 100, 120] as const).map(z => (
                <SegButton key={z} active={(settings.uiZoom ?? 100) === z} onClick={() => updateSettings({ uiZoom: z })}>
                  {z}%
                </SegButton>
              ))}
            </div>
          </div>
        </div>
        )} {/* end Appearance conditional */}

        {/* Lecture / Quran reading */}
        {(activeSection === 'lecture' || narrow) && (
        <div style={card}>
          <div style={{ fontSize: 10, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>
            {fr ? 'Lecture du Coran' : 'قراءة القرآن'}
          </div>

          {/* Font size default */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: t.inkDim, marginBottom: 10 }}>
              {fr ? 'Taille de police arabe (défaut)' : 'حجم الخط العربي (افتراضي)'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => updateSettings({ quranFontSize: Math.max(18, (settings.quranFontSize ?? 24) - 2) })}
                style={{ width: 32, height: 32, borderRadius: 8, background: t.cardElev, border: `1px solid ${t.line}`, color: t.inkDim, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >−</button>
              <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Fraunces, serif', fontSize: 22, color: t.accent, lineHeight: 1 }}>
                {settings.quranFontSize ?? 24}
              </div>
              <button
                onClick={() => updateSettings({ quranFontSize: Math.min(40, (settings.quranFontSize ?? 24) + 2) })}
                style={{ width: 32, height: 32, borderRadius: 8, background: t.cardElev, border: `1px solid ${t.line}`, color: t.inkDim, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >+</button>
            </div>
            <div style={{ fontFamily: 'Amiri Quran, serif', fontSize: settings.quranFontSize ?? 24, color: t.ink, textAlign: 'center', direction: 'rtl', marginTop: 10, padding: '8px', background: t.cardElev, borderRadius: 8 }}>
              بِسْمِ اللَّهِ
            </div>
          </div>

          {/* Default view mode */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: t.inkDim, marginBottom: 8 }}>
              {fr ? 'Affichage par défaut' : 'عرض افتراضي'}
            </div>
            <div style={{ display: 'flex', gap: 4, padding: 4, background: t.cardElev, borderRadius: 10 }}>
              <SegButton active={(settings.quranDefaultView ?? 'list') === 'list'} onClick={() => updateSettings({ quranDefaultView: 'list' })}>
                {fr ? 'Liste' : 'قائمة'}
              </SegButton>
              <SegButton active={settings.quranDefaultView === 'authentic'} onClick={() => updateSettings({ quranDefaultView: 'authentic' })}>
                {fr ? 'Pages Mushaf' : 'صفحات المصحف'}
              </SegButton>
            </div>
          </div>

          {/* Toggles */}
          {[
            { label: fr ? 'Lueur dorée sur les versets' : 'توهج ذهبي على الآيات', value: settings.quranVerseGlow !== false, key: 'quranVerseGlow' as const },
            { label: fr ? 'Animation de bienvenue à la connexion' : 'رسوم ترحيبية عند الدخول', value: settings.showSplashOnLogin !== false, key: 'showSplashOnLogin' as const },
          ].map(row => (
            <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: `1px solid ${t.lineSoft}` }}>
              <span style={{ fontSize: 12, color: t.ink }}>{row.label}</span>
              <Toggle value={row.value} onChange={v => updateSettings({ [row.key]: v })}/>
            </div>
          ))}
        </div>
        )} {/* end Lecture conditional */}

        {/* Accessibility */}
        {(activeSection === 'accessibility' || narrow) && (
        <div style={card}>
          <div style={{ fontSize: 10, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>
            {fr ? 'Accessibilité' : 'إمكانية الوصول'}
          </div>
          {[
            { label: fr ? 'Réduire les animations' : 'تقليل الحركات',           value: settings.reduceAnimations ?? false, key: 'reduceAnimations' as const },
            { label: fr ? 'Police dyslexie (OpenDyslexic)' : 'خط عسر القراءة', value: settings.dyslexiaFont ?? false,     key: 'dyslexiaFont'     as const },
            { label: fr ? 'Contraste élevé' : 'تباين عالٍ',                    value: settings.highContrast ?? false,     key: 'highContrast'     as const },
            { label: fr ? 'Effets sonores' : 'أصوات التنقل',                   value: settings.soundEffects ?? false,     key: 'soundEffects'     as const },
            { label: fr ? 'Noms arabes des sourates' : 'الأسماء العربية',       value: settings.showArabicNames,           key: 'showArabicNames'  as const },
            { label: fr ? 'Numéros de sourates' : 'أرقام السور',               value: settings.showSurahNumbers ?? true,  key: 'showSurahNumbers' as const },
            { label: fr ? 'Confirmer avant suppression' : 'تأكيد الحذف',       value: settings.confirmDelete ?? true,     key: 'confirmDelete'    as const },
          ].map(row => (
            <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: `1px solid ${t.lineSoft}` }}>
              <span style={{ fontSize: 12, color: t.ink }}>{row.label}</span>
              <Toggle value={row.value} onChange={v => updateSettings({ [row.key]: v })}/>
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: t.inkDim, marginBottom: 8 }}>{fr ? 'Espacement des lignes' : 'تباعد الأسطر'}</div>
            <div style={{ display: 'flex', gap: 4, padding: 4, background: t.cardElev, borderRadius: 10 }}>
              {[{ id: 'normal', fr: 'Normal' }, { id: 'comfortable', fr: 'Confortable' }, { id: 'large', fr: 'Large' }].map(s => (
                <SegButton key={s.id} active={(settings.lineSpacing ?? 'normal') === s.id} onClick={() => updateSettings({ lineSpacing: s.id as any })}>{s.fr}</SegButton>
              ))}
            </div>
          </div>
        </div>
        )} {/* end Accessibility conditional */}

        {/* Notifications PWA */}
        {(activeSection === 'notifications' || narrow) && (
        <div style={card}>
          <div style={{ fontSize: 10, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>
            {fr ? 'Notifications' : 'التنبيهات'}
          </div>

          {/* Permission status badge */}
          {notifPermission === 'denied' && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', fontSize: 11, color: 'rgba(239,68,68,0.8)', marginBottom: 14 }}>
              {fr ? '⚠ Notifications bloquées par le navigateur. Autorisez-les dans les paramètres du site.' : '⚠ الإشعارات محظورة. أتح الإذن من إعدادات الموقع.'}
            </div>
          )}

          {/* Main toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: `1px solid ${t.lineSoft}` }}>
            <div>
              <div style={{ fontSize: 12, color: t.ink }}>{fr ? 'Rappels quotidiens' : 'تذكيرات يومية'}</div>
              <div style={{ fontSize: 10, color: t.inkMute, marginTop: 2 }}>
                {notifPermission === 'granted' ? (fr ? '✓ Autorisées' : '✓ مسموح') : (fr ? 'Appuyez pour autoriser' : 'اضغط للسماح')}
              </div>
            </div>
            <Toggle value={settings.notifications} onChange={handleNotifToggle}/>
          </div>

          {/* Time picker */}
          {settings.notifications && notifPermission === 'granted' && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, color: t.inkDim, marginBottom: 8 }}>{fr ? 'Heure du rappel' : 'وقت التذكير'}</div>
              <input type="time" value={settings.dailyReminder}
                onChange={e => updateSettings({ dailyReminder: e.target.value })}
                style={inputStyle}/>
            </div>
          )}

          {/* Test notification button */}
          {notifPermission === 'granted' && (
            <button
              onClick={() => sendPWANotification('Mishkat 🕌', fr ? 'Notification de test — tout fonctionne !' : 'إشعار تجريبي — كل شيء يعمل!')}
              style={{ marginTop: 14, width: '100%', padding: '10px', borderRadius: 10, border: `1px solid ${t.line}`, background: t.cardElev, cursor: 'pointer', fontSize: 12, color: t.inkDim, fontWeight: 500 }}>
              {fr ? 'Envoyer un test' : 'إرسال تجريبي'}
            </button>
          )}
        </div>
        )} {/* end Notifications conditional */}

        {/* General / Données */}
        {(activeSection === 'data' || narrow) && (
        <div style={card}>
          <div style={{ fontSize: 10, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>
            {fr ? 'Données' : 'البيانات'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Auto-save interval */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 10, background: t.cardElev, border: `1px solid ${t.line}` }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: t.ink }}>{fr ? 'Sauvegarde automatique' : 'الحفظ التلقائي'}</div>
                <div style={{ fontSize: 11, color: t.inkMute, marginTop: 2 }}>{fr ? 'Fréquence de sync cloud' : 'تردد المزامنة'}</div>
              </div>
              <select
                value={userData.settings.autoSaveInterval ?? 60}
                onChange={e => updateSettings({ autoSaveInterval: Number(e.target.value) as 30 | 60 | 300 | 0 })}
                style={{ padding: '6px 10px', background: t.card, border: `1px solid ${t.line}`, borderRadius: 8, color: t.ink, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                <option value={30}>{fr ? '30 secondes' : '٣٠ ثانية'}</option>
                <option value={60}>{fr ? '1 minute' : 'دقيقة'}</option>
                <option value={300}>{fr ? '5 minutes' : '٥ دقائق'}</option>
                <option value={0}>{fr ? 'Manuel' : 'يدوي'}</option>
              </select>
            </div>

            <button onClick={exportData}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 10, background: t.cardElev, border: `1px solid ${t.line}`, cursor: 'pointer', color: t.ink }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon d={Icons.download} size={15} color={t.accentBright}/>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{fr ? 'Exporter les données' : 'تصدير البيانات'}</span>
              </div>
              <Icon d={Icons.arrow} size={14} color={t.inkMute}/>
            </button>

            <button onClick={() => importRef.current?.click()}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 10, background: t.cardElev, border: `1px solid ${t.line}`, cursor: 'pointer', color: t.ink }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon d={Icons.upload} size={15} color={t.accentBright}/>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{fr ? 'Importer les données' : 'استيراد البيانات'}</span>
              </div>
              <Icon d={Icons.arrow} size={14} color={t.inkMute}/>
            </button>
            <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={importData}/>

            <button onClick={() => {
              if (confirm(fr ? 'Voulez-vous vraiment tout réinitialiser ?' : 'هل تريد حقاً إعادة ضبط كل شيء؟')) {
                localStorage.removeItem('mishkat_user_data');
                window.location.reload();
              }
            }}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon d={Icons.trash} size={15} color="rgba(239,68,68,0.6)"/>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(239,68,68,0.75)' }}>
                  {fr ? 'Réinitialiser les données' : 'إعادة ضبط البيانات'}
                </span>
              </div>
              <Icon d={Icons.arrow} size={14} color="rgba(239,68,68,0.3)"/>
            </button>
          </div>
        </div>
        )} {/* end data conditional */}

        {/* À propos */}
        {(activeSection === 'about' || narrow) && (
        <div style={card}>
          <div style={{ fontSize: 10, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 18 }}>
            {fr ? 'À propos' : 'حول التطبيق'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: fr ? 'Version' : 'الإصدار',         value: 'Mishkat v2.0' },
              { label: fr ? 'Développé par' : 'المطوّر',    value: 'Rahima (@hamda_wa_chakra)' },
              { label: fr ? 'Stack' : 'التقنية',            value: 'React · TypeScript · PWA' },
              { label: fr ? 'Thème actif' : 'السمة الحالية',value: `${settings.theme} ${settings.darkMode ? '🌙' : '☀️'}` },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${t.lineSoft}`, fontSize: 12 }}>
                <span style={{ color: t.inkDim }}>{row.label}</span>
                <span style={{ color: t.ink, fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
            <div style={{ marginTop: 4, padding: '14px 16px', borderRadius: 10, background: `${t.accent}08`, border: `1px solid ${t.line}`, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Amiri Quran, serif', fontSize: 18, color: t.accentBright, direction: 'rtl' }}>اقْرَأْ بِاسْمِ رَبِّكَ</div>
              <div style={{ fontSize: 10, color: t.inkMute, marginTop: 6, fontStyle: 'italic' }}>Une lanterne pour la mémoire du cœur</div>
            </div>
          </div>
        </div>
        )} {/* end about conditional */}

      </div> {/* end flex column cards */}

        </div> {/* end content area */}
      </div> {/* end 2-column grid */}

      {/* Footer */}
      <div style={{ textAlign: 'center', paddingTop: 8 }}>
        <div style={{ fontSize: 9.5, color: t.inkMute, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
          Mishkat v2.0 · {fr ? 'Fait avec amour' : 'صنع بكل حب'}
        </div>
        <div style={{ fontSize: 9, color: t.inkMute, opacity: 0.5, marginTop: 4 }}>
          Par Rahima · @hamda_wa_chakra
        </div>
      </div>
    </div>
  );
};
