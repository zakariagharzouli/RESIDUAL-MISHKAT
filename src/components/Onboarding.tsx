import React, { useState } from 'react';
import { useT } from '../lib/theme';
import { Icon, Icons } from './ui';

interface OnboardingProps {
  lang: string;
  onClose: () => void;
}

const FEATURES = [
  { icon: '📊', titleFr: 'Tableau de bord',  titleAr: 'لوحة القيادة', descFr: 'Progrès, stats et versets du jour', descAr: 'التقدم والإحصاءات وآية اليوم' },
  { icon: '📖', titleFr: 'Mémorisation',      titleAr: 'الحفظ',        descFr: '114 sourates · suivi par étapes',  descAr: '١١٤ سورة · متابعة مرحلية'   },
  { icon: '✍️', titleFr: 'Diftar',            titleAr: 'الدفتر',       descFr: 'Cahier numérique artisanal',       descAr: 'دفتر رقمي فاخر'             },
  { icon: '🗓️', titleFr: 'Calendrier',        titleAr: 'التقويم',      descFr: 'Validez prières & révisions',      descAr: 'تحقق من الصلوات والمراجعات' },
  { icon: '📿', titleFr: 'Tasbih',            titleAr: 'التسبيح',      descFr: 'Compteur de dhikr & stats',        descAr: 'عداد الذكر والإحصاءات'      },
  { icon: '🗂️', titleFr: 'Suivi Kanban',      titleAr: 'كانبان',       descFr: 'Chaque sourate, étape par étape',  descAr: 'كل سورة خطوة بخطوة'         },
];

export const OnboardingModal = ({ lang, onClose }: OnboardingProps) => {
  const t = useT();
  const [step, setStep] = useState(0);
  const fr = lang === 'fr';
  const TOTAL = 2;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: 22, maxWidth: 520, width: '100%', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>

        {/* Skip */}
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 18, background: 'transparent', border: 'none', color: t.inkMute, fontSize: 11, cursor: 'pointer', letterSpacing: '0.12em', textTransform: 'uppercase', zIndex: 10 }}>
          {fr ? 'Passer' : 'تخطي'}
        </button>

        {/* ── Step 1 : Welcome ── */}
        {step === 0 && (
          <div style={{ padding: '48px 40px 36px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: `radial-gradient(circle, ${t.accent}18 0%, transparent 70%)` }}/>
              <img src="/icon-192.png" alt="Mishkat" width={88} height={88} style={{ position: 'relative', borderRadius: 24, boxShadow: '0 12px 28px -10px rgba(30,20,4,0.5)' }}/>
            </div>

            <div>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 44, color: t.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>Mishkat</div>
              <div style={{ fontFamily: 'Amiri Quran, serif', fontSize: 24, color: t.accentBright, marginTop: 6 }}>مِشْكَاة</div>
            </div>

            <p style={{ fontSize: 14, color: t.inkDim, lineHeight: 1.75, maxWidth: 340, margin: 0 }}>
              {fr
                ? 'Votre compagnon intelligent pour la mémorisation du Coran — notes, suivi, dhikr et bien plus.'
                : 'رفيقك الذكي لحفظ القرآن الكريم — ملاحظات، متابعة، ذكر وأكثر.'}
            </p>

            {/* Creator card */}
            <div style={{ padding: '12px 20px', borderRadius: 12, background: `${t.accent}0c`, border: `1px solid ${t.accent}20`, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: t.inkMute, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 5 }}>Artisans du Savoir</div>
              <div style={{ fontSize: 13, color: t.ink, fontWeight: 600 }}>
                Rahima{' '}
                <span style={{ color: t.accent, fontWeight: 400 }}>· @hamda_wa_chakra</span>
              </div>
            </div>

            <button onClick={() => setStep(1)}
              style={{ marginTop: 4, width: '100%', padding: '14px', borderRadius: 12, background: t.accent, color: '#1a0f00', fontWeight: 700, fontSize: 13, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
              {fr ? 'Découvrir les fonctionnalités' : 'اكتشف الميزات'} <Icon d={Icons.arrow} size={14}/>
            </button>
          </div>
        )}

        {/* ── Step 2 : Features ── */}
        {step === 1 && (
          <div style={{ padding: '40px 36px 36px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: t.inkMute, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
                {fr ? 'Ce que vous pouvez faire' : 'ما يمكنك فعله'}
              </div>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 26, color: t.ink, lineHeight: 1.2 }}>
                {fr ? 'Tout en un seul endroit' : 'كل شيء في مكان واحد'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {FEATURES.map((f, i) => (
                <div key={i} style={{ padding: '14px 13px', borderRadius: 10, background: t.bgSoft, border: `1px solid ${t.line}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontSize: 20, lineHeight: 1.1, flexShrink: 0 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: t.ink, lineHeight: 1.3 }}>{fr ? f.titleFr : f.titleAr}</div>
                    <div style={{ fontSize: 10, color: t.inkMute, marginTop: 2, lineHeight: 1.45 }}>{fr ? f.descFr : f.descAr}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setStep(0)}
                style={{ padding: '13px 20px', borderRadius: 12, background: t.cardElev, border: `1px solid ${t.line}`, color: t.inkDim, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                ←
              </button>
              <button onClick={onClose}
                style={{ flex: 1, padding: '13px', borderRadius: 12, background: t.accent, color: '#1a0f00', fontWeight: 700, fontSize: 13, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
                {fr ? 'Commencer — Bismillah !' : 'ابدأ — بسم الله!'} <Icon d={Icons.arrow} size={14}/>
              </button>
            </div>
          </div>
        )}

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingBottom: 20 }}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} onClick={() => setStep(i)} style={{ width: i === step ? 22 : 6, height: 6, borderRadius: 3, background: i === step ? t.accent : t.line, transition: 'all 0.25s', cursor: 'pointer' }}/>
          ))}
        </div>
      </div>
    </div>
  );
};
