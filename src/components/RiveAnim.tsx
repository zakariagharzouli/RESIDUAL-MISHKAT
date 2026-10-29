import React, { useEffect, useRef, useState } from 'react';

// Le lecteur Rive (≈ 450 Ko) n'est chargé qu'à la première animation affichée
let runtime: Promise<typeof import('@rive-app/canvas')> | null = null;
const loadRuntime = () => {
  runtime ??= import('@rive-app/canvas').then(m => { m.RuntimeLoader.setWasmUrl('/rive/rive.wasm'); return m; });
  return runtime;
};

/** Chat compagnon : gris de fond collé dans le fichier (rendu transparent) et nœuds qui orientent sa tête. */
export const CAT_BG: [number, number, number] = [49, 49, 49];
export const CAT_LOOK = [{ node: 'HeadTurn_IK', rx: 85, ry: 55 }, { node: 'Face_G', rx: 16, ry: 10 }];

interface Props {
  src: string;
  size: number;
  animation?: string;
  stateMachine?: string;
  artboard?: string;
  /** Couleur de fond collée dans le fichier, rendue transparente image par image */
  keyColor?: [number, number, number];
  /** Regard qui suit le doigt ou le stylet sur toute la page : nœuds du dessin déplacés et amplitude (x, y) */
  look?: { node: string; rx: number; ry: number }[];
  /** Affiché pendant le chargement, si Rive échoue ou si l'appareil limite les animations */
  fallback?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Chat compagnon de Mishkat : il tourne la tête vers le doigt ou le stylet. */
export const CompanionCat = ({ size, style }: { size: number; style?: React.CSSProperties }) => (
  <span style={{ position: 'relative', display: 'inline-flex', flexShrink: 0, ...style }}>
    <span aria-hidden="true" style={{ position: 'absolute', inset: '18% 14% 10%', borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,226,160,0.42), rgba(255,226,160,0))' }}/>
    <RiveAnim src="/rive/chat.riv" artboard="Cat" stateMachine="State Machine 1" keyColor={CAT_BG} look={CAT_LOOK} size={size}/>
  </span>
);

/** Animation Rive (.riv dans public/rive). */
export const RiveAnim = ({ src, size, animation, stateMachine, artboard, keyColor, look, fallback = null, style }: Props) => {
  const riveRef = useRef<HTMLCanvasElement>(null);
  const outRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const instRef = useRef<unknown>(null);
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const key = keyColor?.join(',');

  useEffect(() => {
    if (reduced || !riveRef.current) return;
    let inst: { cleanup: () => void } | null = null;
    let cancelled = false;
    loadRuntime().then(({ Rive, Layout, Fit }) => {
      if (cancelled || !riveRef.current) return;
      inst = instRef.current = new Rive({
        src, canvas: riveRef.current, autoplay: true, artboard,
        animations: animation, stateMachines: stateMachine,
        layout: new Layout({ fit: Fit.Contain }), isTouchScrollEnabled: true,
        // Le fond détouré exige de relire les pixels du canvas
        ...(keyColor ? { useOffscreenRenderer: false } : {}),
        onLoad: () => { if (!cancelled) setReady(true); },
        onLoadError: () => { if (!cancelled) setFailed(true); },
      });
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; inst?.cleanup(); };
  }, [src, animation, stateMachine, artboard, reduced, key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Détourage : chaque pixel proche du gris de fond devient transparent, en fondu sur les bords
  useEffect(() => {
    if (!ready || !keyColor || !riveRef.current || !outRef.current) return;
    const src2d = document.createElement('canvas');
    const out = outRef.current.getContext('2d');
    const tmp = src2d.getContext('2d', { willReadFrequently: true });
    if (!out || !tmp) return;
    const [kr, kg, kb] = keyColor;
    let raf = 0;
    const frame = () => {
      const c = riveRef.current;
      if (c && c.width) {
        if (src2d.width !== c.width) { src2d.width = c.width; src2d.height = c.height; }
        tmp.clearRect(0, 0, c.width, c.height);
        tmp.drawImage(c, 0, 0);
        const img = tmp.getImageData(0, 0, c.width, c.height);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          const dist = Math.max(Math.abs(d[i] - kr), Math.abs(d[i + 1] - kg), Math.abs(d[i + 2] - kb));
          if (dist < 14) d[i + 3] = dist < 5 ? 0 : Math.round(((dist - 5) / 9) * d[i + 3]);
        }
        out.putImageData(img, 0, 0);
        // Tant que le coin n'a pas la couleur de fond (logo d'intro du fichier), on n'affiche rien
        const c0 = Math.max(Math.abs(d[0] - kr), Math.abs(d[1] - kg), Math.abs(d[2] - kb));
        if (outRef.current) outRef.current.style.visibility = d[3] === 0 || c0 < 5 ? 'visible' : 'hidden';
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [ready, key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Regard qui suit : la direction du doigt déplace doucement les nœuds de la tête
  useEffect(() => {
    if (!ready || !look?.length) return;
    type N = { x: number; y: number };
    const ab = (instRef.current as { artboard?: { node: (n: string) => N | null } } | null)?.artboard;
    const nodes = look.map(l => ({ l, n: ab?.node(l.node) ?? null })).filter((x): x is { l: typeof look[number]; n: N } => !!x.n);
    if (!nodes.length) return;
    const base = nodes.map(({ n }) => ({ x: n.x, y: n.y }));
    const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    let idle = 0;
    const onMove = (e: PointerEvent) => {
      const el = riveRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const k = 1 / Math.max(160, Math.hypot(dx, dy));
      target.x = Math.max(-1, Math.min(1, dx * k * 1.4));
      target.y = Math.max(-1, Math.min(1, dy * k * 1.4));
      idle = performance.now();
    };
    let raf = 0;
    const frame = (now: number) => {
      // Sans mouvement pendant 4 s, le chat revient regarder devant lui
      if (now - idle > 4000) { target.x = 0; target.y = 0; }
      cur.x += (target.x - cur.x) * 0.12; cur.y += (target.y - cur.y) * 0.12;
      try { nodes.forEach(({ l, n }, i) => { n.x = base[i].x + cur.x * l.rx; n.y = base[i].y + cur.y * l.ry; }); } catch { return; }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerdown', onMove);
      // L'animation peut déjà être détruite (changement de page) : on ne touche plus à ses nœuds
    };
  }, [ready, look?.map(l => l.node).join()]); // eslint-disable-line react-hooks/exhaustive-deps

  const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;
  const px = Math.round(size * dpr);
  const canvasStyle: React.CSSProperties = { position: 'absolute', inset: 0, width: size, height: size, display: 'block' };
  return (
    <span aria-hidden="true" style={{ position: 'relative', display: 'inline-block', width: size, height: size, flexShrink: 0, ...style }}>
      {(!ready || failed || reduced) && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{fallback}</span>}
      {!failed && !reduced && <>
        {/* Avec détourage, le canvas Rive reste invisible (mais en place pour recevoir le regard) et sa copie détourée s'affiche */}
        <canvas ref={riveRef} width={px} height={px} style={{ ...canvasStyle, opacity: keyColor ? 0 : ready ? 1 : 0, transition: 'opacity .3s' }}/>
        {keyColor && <canvas ref={outRef} width={px} height={px} style={{ ...canvasStyle, pointerEvents: 'none', opacity: ready ? 1 : 0, transition: 'opacity .3s' }}/>}
      </>}
    </span>
  );
};
