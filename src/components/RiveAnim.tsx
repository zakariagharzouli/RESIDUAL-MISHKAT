import React, { useEffect, useRef, useState } from 'react';

// Le lecteur Rive (≈ 450 Ko) n'est chargé qu'à la première animation affichée
let runtime: Promise<typeof import('@rive-app/canvas')> | null = null;
const loadRuntime = () => {
  runtime ??= import('@rive-app/canvas').then(m => { m.RuntimeLoader.setWasmUrl('/rive/rive.wasm'); return m; });
  return runtime;
};

interface Props {
  src: string;
  size: number;
  animation?: string;
  stateMachine?: string;
  artboard?: string;
  /** Affiché pendant le chargement, si Rive échoue ou si l'appareil limite les animations */
  fallback?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Animation Rive (.riv dans public/rive). */
export const RiveAnim = ({ src, size, animation, stateMachine, artboard, fallback = null, style }: Props) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (reduced || !ref.current) return;
    let inst: { cleanup: () => void } | null = null;
    let cancelled = false;
    loadRuntime().then(({ Rive, Layout, Fit }) => {
      if (cancelled || !ref.current) return;
      inst = new Rive({
        src, canvas: ref.current, autoplay: true, artboard,
        animations: animation, stateMachines: stateMachine,
        layout: new Layout({ fit: Fit.Contain }),
        onLoad: () => { if (!cancelled) setReady(true); },
        onLoadError: () => { if (!cancelled) setFailed(true); },
      });
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; inst?.cleanup(); };
  }, [src, animation, stateMachine, artboard, reduced]);

  const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;
  return (
    <span aria-hidden="true" style={{ position: 'relative', display: 'inline-block', width: size, height: size, flexShrink: 0, ...style }}>
      {(!ready || failed || reduced) && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{fallback}</span>}
      {!failed && !reduced && <canvas ref={ref} width={size * dpr} height={size * dpr} style={{ width: size, height: size, display: 'block', opacity: ready ? 1 : 0, transition: 'opacity .3s' }}/>}
    </span>
  );
};
