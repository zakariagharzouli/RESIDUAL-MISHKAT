import React from 'react';
import { Surah, UserData } from '../types';
import { useT } from '../lib/theme';
import { useIsNarrow, PageHeader } from './ui';
import { playKanbanAdvance } from '../lib/sounds';

const COLUMN_CONFIG_BASE = [
  { id: 'not_started' as const, labelFr: 'À mémoriser',    labelAr: 'لم يبدأ',   color: null as null | string },
  { id: 'in_progress' as const, labelFr: 'En cours',       labelAr: 'قيد الحفظ', color: null as null | string },
  { id: 'review'      as const, labelFr: 'En révision',    labelAr: 'مراجعة',    color: '#a78bdb' },
  { id: 'memorized'   as const, labelFr: 'Mémorisées',     labelAr: 'تم الحفظ',  color: '#5fb088' },
];

const STATUS_PROGRESS: Record<string, number> = {
  not_started: 0,
  in_progress: 60,
  review: 90,
  memorized: 100,
};

export const KanbanSection = ({
  userData, setUserData, lang
}: { userData: UserData; setUserData: React.Dispatch<React.SetStateAction<UserData>>; lang: string }) => {
  const t = useT();
  const narrow = useIsNarrow();
  const fr = lang === 'fr';
  const showArabic = userData.settings.showArabicNames ?? true;

  const COLUMN_CONFIG = COLUMN_CONFIG_BASE.map(col => ({
    ...col,
    color: col.color ?? (col.id === 'not_started' ? t.inkMute : t.accent),
  }));

  const updateStatus = (id: number, status: Surah['status']) => {
    setUserData((prev: UserData) => ({
      ...prev,
      surahs: prev.surahs.map((s: Surah) => s.id === id ? { ...s, status } : s)
    }));
  };

  const advanceStatus = (surah: Surah) => {
    const order: Surah['status'][] = ['not_started', 'in_progress', 'review', 'memorized'];
    const idx = order.indexOf(surah.status);
    const next = order[(idx + 1) % order.length];
    updateStatus(surah.id, next);
    playKanbanAdvance();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...(narrow ? {} : { height: '100%' }), gap: 20, paddingBottom: 16 }}>
      <PageHeader eyebrow={fr ? 'Touche une sourate pour la faire avancer' : 'انقر على سورة لتتقدم'} title={fr ? 'Suivi' : 'المتابعة'}/>

      <div style={{
        display: 'grid',
        gridTemplateColumns: narrow ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: 10,
        ...(narrow ? {} : { flex: 1, minHeight: 0 }),
      }}>
        {COLUMN_CONFIG.map(col => {
          const surahs = userData.surahs.filter(s => s.status === col.id);
          const progress = STATUS_PROGRESS[col.id];
          return (
            <div key={col.id} style={{
              background: t.bgSoft,
              border: `1px solid ${t.line}`,
              borderRadius: 10,
              padding: 10,
              display: 'flex',
              flexDirection: 'column',
              minHeight: narrow ? 280 : 0,
            }}>
              {/* Column header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '4px 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: col.color, flexShrink: 0 }}/>
                  <span style={{ fontSize: 10, color: t.ink, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500 }}>
                    {fr ? col.labelFr : col.labelAr}
                  </span>
                </div>
                <span style={{ fontFamily: 'Fraunces, serif', fontSize: 13, color: t.inkDim }}>{surahs.length}</span>
              </div>

              {/* Cards list */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
                {surahs.map((surah: Surah) => (
                  <div
                    key={surah.id}
                    onClick={() => advanceStatus(surah)}
                    style={{
                      background: t.card,
                      border: `1px solid ${t.line}`,
                      borderRadius: 7,
                      padding: '10px 12px',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 9.5, color: t.inkMute, fontFamily: 'Fraunces, serif' }}>#{surah.id}</span>
                      {showArabic && <span style={{ fontFamily: 'Amiri Quran, serif', fontSize: 13, color: col.color }}>{surah.arabicName}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: t.ink, fontWeight: 500 }}>{surah.name}</div>
                    <div style={{ marginTop: 8 }}>
                      <div style={{ height: 2, background: t.lineSoft, borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: col.color, borderRadius: 2, transition: 'width 0.3s ease' }}/>
                      </div>
                    </div>
                  </div>
                ))}

                {surahs.length === 0 && (
                  <div style={{ padding: '20px 0', textAlign: 'center', opacity: 0.4 }}>
                    <div style={{ fontSize: 11, color: t.inkMute, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
                      {fr ? 'Vide' : 'فارغ'}
                    </div>
                  </div>
                )}

                {/* Dashed add button */}
                <div style={{ padding: 10, borderRadius: 7, border: `1.5px dashed ${t.line}`, color: t.inkMute, fontSize: 11, textAlign: 'center', flexShrink: 0, marginTop: 'auto' }}>
                  + {fr ? 'Ajouter' : 'إضافة'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
