import { useEffect, useState } from 'react';
import { BrandMark } from './HeroSection';

export default function IntroSplash({ onComplete }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      onComplete();
      return undefined;
    }

    const fadeTimer = window.setTimeout(() => setLeaving(true), 1150);
    const completeTimer = window.setTimeout(onComplete, 1500);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center bg-[#121212] transition-opacity duration-[350ms] ${leaving ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      role="status"
      aria-label="Welcome to Brew and Bloom"
    >
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 180 170" className="h-40 w-40 overflow-visible text-ember-copper" fill="none" aria-hidden="true">
          <path
            className="animate-draw-cup drop-shadow-[0_0_8px_rgba(111,78,55,.65)]"
            d="M37 66h91v43c0 25-20 45-45 45h-1c-25 0-45-20-45-45V66Zm91 12h13c15 0 21 9 21 21s-7 21-22 21h-14M60 48c-9-12 10-13 2-26m28 26c-9-12 10-13 2-26"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="420"
            strokeDashoffset="420"
          />
          <path d="M45 70h75" stroke="#A66A2C" strokeWidth="1.5" opacity=".8" />
        </svg>
        <div className="-mt-2 flex items-center gap-3 text-ember-ivory">
          <BrandMark className="h-7 w-7 text-ember-copper" />
          <span className="font-display text-sm font-semibold uppercase tracking-[.22em]">Brew <span className="text-ember-copper">&amp;</span> Bloom</span>
        </div>
        <p className="mt-4 text-[9px] uppercase tracking-[.28em] text-ember-muted">A moment before the first sip</p>
      </div>
    </div>
  );
}
