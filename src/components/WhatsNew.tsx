import React from 'react';
import { motion } from 'framer-motion';
import { useT } from '../lib/theme';
import { Icon, Icons, PoweredBy } from './ui';

// Changer cette clé à chaque grosse mise à jour pour la réannoncer à tout le monde
export const WHATS_NEW_KEY = 'mishkat_whats_new_2026_11';

interface Props { name: string; lang: 'fr' | 'ar'; onClose: (goTo?: string) => void; }

const ITEMS = [
  { icon: Icons.check,    fr: ['Ta séance du jour', 'Chaque matin, tes révisions, ta sourate en cours et ton dhikr, au même endroit.'], ar: ['جلسة اليوم', 'مراجعاتك وسورتك الحالية وذكرك في مكان واحد كل صباح.'] },
  { icon: Icons.badge,    fr: ['62 trophées à collectionner', 'De vraies médailles en bronze, argent, or et nûr, et une célébration à chaque nouveau trophée.'], ar: ['62 وساماً', 'أوسمة من البرونز والفضة والذهب والنور.'] },
  { icon: Icons.flower,   fr: ['Mon jardin', 'Chaque sourate mémorisée fait pousser une fleur, les révisions l\'arrosent.'], ar: ['حديقتي', 'كل سورة تحفظها تنبت زهرة.'] },
  { icon: Icons.share,    fr: ['Crée tes posts', 'Un verset, une doua ou une pensée dans un joli cadre, à partager sur TikTok ou WhatsApp.'], ar: ['أنشئ منشوراتك', 'آية أو دعاء في إطار جميل للمشاركة.'] },
  { icon: Icons.pen,      fr: ['Un Diftar plus doux', 'Nouveaux stylos, couleurs favorites, papiers fleuris, emojis par thème, et deux doigts pour défiler.'], ar: ['دفتر أجمل', 'أقلام وألوان وأوراق جديدة.'] },
  { icon: Icons.heart,    fr: ['Des mots de soutien', 'Mishkat t\'encourage selon ta progression, par ton prénom.'], ar: ['كلمات تشجيع', 'مشكاة تشجعك حسب تقدمك وباسمك.'] },
    { icon: Icons.bell,     fr: ['Des rappels plus doux', 'Un seul rappel par jour, à l\'heure que tu choisis.'], ar: ['تذكيرات ألطف', 'تذكير واحد يومياً في الوقت الذي تختاره.'] },
];

/** Annonce affichée une fois à chaque utilisateur après une grosse mise à jour. */
export const WhatsNew = ({ name, lang, onClose }: Props) => {
  const t = useT();
  const fr = lang === 'fr';
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9995, background: 'rgba(16,11,4,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div role="dialog" aria-modal="true" aria-labelledby="whats-new-title"
        initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        style={{ width: '100%', maxWidth: 440, maxHeight: '100%', overflowY: 'auto', background: t.card, border: `1px solid ${t.line}`, borderRadius: 26, padding: '30px 26px 24px', boxShadow: '0 30px 80px -20px rgba(30,20,4,0.45)', direction: fr ? 'ltr' : 'rtl' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 14 }}
            style={{ width: 72, height: 72, borderRadius: '50%', background: `radial-gradient(circle, ${t.accent}33, transparent 70%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/icon-192.png" alt="Mishkat" width={64} height={64} style={{ borderRadius: 18, boxShadow: '0 8px 20px -8px rgba(30,20,4,0.5)' }}/>
          </motion.div>
          <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.accent, fontWeight: 600 }}>{fr ? 'Mise à jour' : 'تحديث جديد'}</div>
          <h2 id="whats-new-title" style={{ margin: 0, fontFamily: 'Fraunces, serif', fontWeight: 400, fontSize: 28, color: t.ink, lineHeight: 1.15 }}>
            {fr ? <>Salam {name},<br/>Mishkat fait peau neuve</> : <>السلام عليكم {name}،<br/>مشكاة بحلة جديدة</>}
          </h2>
          <p style={{ margin: 0, fontSize: 15, color: t.inkDim, lineHeight: 1.5 }}>
            {fr ? 'On a tout repensé pour t\'accompagner encore mieux dans ta mémorisation. Voici ce qui change.' : 'أعدنا التفكير في كل شيء لنرافقك أفضل في حفظك.'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: '22px 0' }}>
          {ITEMS.map((it, i) => (
            <motion.div key={it.fr[0]} initial={{ opacity: 0, x: fr ? -10 : 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.07 }}
              style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ width: 38, height: 38, borderRadius: 12, background: `${t.accent}16`, color: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon d={it.icon} size={18}/>
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: t.ink }}>{fr ? it.fr[0] : it.ar[0]}</span>
                <span style={{ display: 'block', fontSize: 13.5, color: t.inkMute, lineHeight: 1.45, marginTop: 2 }}>{fr ? it.fr[1] : it.ar[1]}</span>
              </span>
            </motion.div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => onClose('dashboard')}
            style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: t.accent, color: '#1a0f00', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
            {fr ? 'Découvrir ma séance du jour' : 'اكتشف جلسة اليوم'}
          </button>
          <button onClick={() => onClose('badges')}
            style={{ width: '100%', padding: '12px', borderRadius: 14, border: `1px solid ${t.line}`, background: 'transparent', color: t.ink, fontWeight: 500, fontSize: 14, cursor: 'pointer' }}>
            {fr ? 'Voir mes trophées' : 'شاهد أوسمتي'}
          </button>
        </div>
        <div style={{ marginTop: 16 }}><PoweredBy lang={lang}/></div>
      </motion.div>
    </motion.div>
  );
};
