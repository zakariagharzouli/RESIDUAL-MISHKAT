import React, { useState, useEffect } from 'react';
import { useT } from '../lib/theme';
import { LanternMark, Icon, Icons, PoweredBy } from './ui';
import { signIn, signUp } from '../lib/supabase';

interface AuthProps {
  lang: string;
  onContinueLocal: () => void;
}

export const REMEMBER_KEY      = 'mishkat_remembered_email';
export const SESSION_ALIVE_KEY = 'mishkat_session_alive';

export const AuthScreen = ({ lang, onContinueLocal }: AuthProps) => {
  const t = useT();
  const [mode, setMode]         = useState<'login' | 'signup'>('login');
  const [email, setEmail]       = useState(() => localStorage.getItem(REMEMBER_KEY) ?? '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem(REMEMBER_KEY));
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const fr = lang === 'fr';

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPwaModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null); setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        if (rememberMe) {
          localStorage.setItem(REMEMBER_KEY, email);
          sessionStorage.removeItem(SESSION_ALIVE_KEY);
        } else {
          localStorage.removeItem(REMEMBER_KEY);
          sessionStorage.setItem(SESSION_ALIVE_KEY, '1');
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        setSuccess(fr ? 'Compte créé ! Vérifie ta boîte mail.' : 'تم إنشاء الحساب! تحقق من بريدك.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Invalid login')) setError(fr ? 'Email ou mot de passe incorrect.' : 'البريد أو كلمة المرور خاطئة.');
      else if (msg.includes('already registered')) setError(fr ? 'Cet email est déjà utilisé.' : 'هذا البريد مسجل مسبقاً.');
      else setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: t.bg, color: t.ink, display: 'flex', overflow: 'hidden', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none' }}>
        <defs>
          <pattern id="auth-pat" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <rect x="20" y="20" width="40" height="40" fill="none" stroke={t.accent} strokeWidth="0.5"/>
            <rect x="20" y="20" width="40" height="40" fill="none" stroke={t.accent} strokeWidth="0.5" transform="rotate(45 40 40)"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-pat)"/>
      </svg>

      {/* Left — image hero (desktop only, hidden on tablet/mobile) */}
      <div className="hidden lg:flex" style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRight: `1px solid ${t.line}` }}>
        <img src="/login-bg.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.22)' }}/>
        <div style={{ position: 'relative', width: '100%', padding: '50px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <LanternMark size={40} color="#f5e6b8"/>
            <div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, color: '#fff', fontWeight: 300 }}>Mishkat</div>
              <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.32em', textTransform: 'uppercase' }}>مِشْكَاة · حِفْظ القرآن</div>
            </div>
          </div>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Une lanterne pour la mémoire du cœur
          </div>
        </div>
      </div>

      {/* Right — form (full width on mobile/tablet, 440px on desktop) */}
      <div style={{ width: '100%', maxWidth: 440, padding: 'clamp(24px, 5vw, 48px) clamp(20px, 5vw, 40px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: t.bgSoft, overflowY: 'auto', flex: 'none' }}>
        <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>
          {fr ? 'Bienvenue' : 'أهلاً وسهلاً'}
        </div>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 28, margin: '0 0 28px', color: t.ink, letterSpacing: '-0.02em' }}>
          {mode === 'login' ? (fr ? 'Reprenez votre mémorisation' : 'تابع حفظك') : (fr ? 'Créer votre compte' : 'إنشاء حساب')}
        </h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 22, padding: 4, background: t.card, borderRadius: 10, border: `1px solid ${t.line}` }}>
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(null); setSuccess(null); }}
              style={{ flex: 1, padding: '9px', borderRadius: 7, background: mode === m ? t.accent : 'transparent', color: mode === m ? '#1a0f00' : t.inkDim, fontFamily: 'Inter', fontWeight: 600, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {m === 'login' ? (fr ? 'Connexion' : 'دخول') : (fr ? 'Inscription' : 'تسجيل')}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 10.5, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Email</div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder={fr ? 'vous@exemple.com' : 'بريدك@مثال.com'}
              style={{ width: '100%', padding: '12px 14px', background: t.card, border: `1px solid ${t.line}`, borderRadius: 8, color: t.ink, fontSize: 13, outline: 'none' }}
            />
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: t.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
              {fr ? 'Mot de passe' : 'كلمة المرور'}
            </div>
            <div style={{ position: 'relative' }}>
              <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                placeholder="••••••••"
                style={{ width: '100%', padding: '12px 40px 12px 14px', background: t.card, border: `1px solid ${t.line}`, borderRadius: 8, color: t.ink, fontSize: 13, outline: 'none' }}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: t.inkMute }}>
                <Icon d={showPwd ? Icons.eye : Icons.lock} size={14}/>
              </button>
            </div>
          </div>

          {mode === 'login' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
              <div
                onClick={() => setRememberMe(v => !v)}
                style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  border: `1.5px solid ${rememberMe ? t.accent : t.line}`,
                  background: rememberMe ? t.accent : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                {rememberMe && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="#1a0f00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 12, color: t.inkDim }}>
                {fr ? 'Se souvenir de moi' : 'تذكرني'}
              </span>
            </label>
          )}

          {(error || success) && (
            <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: error ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', color: error ? '#ef4444' : '#16a34a', border: `1px solid ${error ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}` }}>
              {error || success}
            </div>
          )}

          <button className="mk-shine" type="submit" disabled={loading}
            style={{ width: '100%', padding: '13px', borderRadius: 10, background: loading ? t.accentSoft : t.accent, color: '#1a0f00', fontFamily: 'Inter', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
            {loading ? (fr ? 'Chargement…' : 'جاري…') : mode === 'login' ? (fr ? 'Se connecter' : 'تسجيل الدخول') : (fr ? 'Créer mon compte' : 'إنشاء الحساب')}
            {!loading && <Icon d={Icons.arrow} size={14}/>}
          </button>
        </form>

        <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: t.line }}/><span style={{ fontSize: 10, color: t.inkMute, letterSpacing: '0.18em' }}>ou</span><div style={{ flex: 1, height: 1, background: t.line }}/>
        </div>

        <button onClick={onContinueLocal}
          style={{ width: '100%', padding: '11px', borderRadius: 10, border: `1px solid ${t.line}`, background: 'transparent', color: t.inkDim, fontFamily: 'Inter', fontWeight: 500, fontSize: 12 }}>
          {fr ? 'Continuer sans compte (données locales)' : 'المتابعة بدون حساب'}
        </button>

        {/* PWA install hint */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => setShowPwaModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 16px', borderRadius: 20, border: `1px solid ${t.lineSoft}`, background: 'transparent', color: t.inkMute, fontSize: 11, cursor: 'pointer', letterSpacing: '0.06em' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v13M7 9l5 5 5-5"/><path d="M20 17v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2"/>
            </svg>
            {fr ? 'Installer l\'appli sur l\'écran d\'accueil' : 'تثبيت التطبيق على الشاشة الرئيسية'}
          </button>
        </div>
        <div style={{ marginTop: 22 }}><PoweredBy lang={lang}/></div>
      </div>

      {/* PWA install modal */}
      {showPwaModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 16px 24px' }} onClick={() => setShowPwaModal(false)}>
          <div style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: 18, padding: '24px 24px 20px', width: '100%', maxWidth: 400, boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 20, color: t.ink }}>
                {fr ? 'Installer Mishkat' : 'تثبيت مشكاة'}
              </div>
              <button onClick={() => setShowPwaModal(false)} style={{ padding: 4, color: t.inkMute, background: 'transparent', borderRadius: 8 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '14px 16px', background: `${t.accent}0d`, border: `1px solid ${t.accent}22`, borderRadius: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: t.accentBright, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>
                  iPhone · iPad &nbsp;·&nbsp; Safari
                </div>
                <div style={{ fontSize: 12, color: t.inkDim, lineHeight: 1.7 }}>
                  {fr
                    ? <>1. Appuie sur le bouton <b>Partager</b> <span style={{ fontSize: 14 }}>⎋</span> en bas de l'écran<br/>2. Fais défiler et choisis <b>« Sur l'écran d'accueil »</b></>
                    : <>١. اضغط على زر <b>المشاركة</b> ⎋ أسفل الشاشة<br/>٢. اختر <b>« إضافة إلى الشاشة الرئيسية »</b></>}
                </div>
              </div>

              <div style={{ padding: '14px 16px', background: `${t.accent}0d`, border: `1px solid ${t.accent}22`, borderRadius: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: t.accentBright, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Android &nbsp;·&nbsp; Chrome
                </div>
                <div style={{ fontSize: 12, color: t.inkDim, lineHeight: 1.7 }}>
                  {fr
                    ? <>1. Appuie sur le menu <b>⋮</b> en haut à droite<br/>2. Choisis <b>« Ajouter à l'écran d'accueil »</b></>
                    : <>١. اضغط على قائمة <b>⋮</b> في أعلى اليمين<br/>٢. اختر <b>« إضافة إلى الشاشة الرئيسية »</b></>}
                </div>
              </div>
            </div>

            {deferredPrompt && (
              <button
                onClick={handleNativeInstall}
                style={{ marginTop: 16, width: '100%', padding: '12px', borderRadius: 10, background: t.accent, color: '#1a0f00', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}
              >
                {fr ? 'Installer maintenant' : 'تثبيت الآن'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
