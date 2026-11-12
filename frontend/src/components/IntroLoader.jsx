import { motion, useReducedMotion } from 'framer-motion';
import { BrandMark } from './HeroSection';

function SteamingCup() {
  return (
    <div className="relative mt-8 h-20 w-20 text-[#A66A2C]" aria-hidden="true">
      <motion.span
        className="absolute left-[27px] top-1 h-7 w-px rounded-full bg-current"
        animate={{ opacity: [0, 0.7, 0], y: [8, 0, -8], scaleY: [0.7, 1, 0.7] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        className="absolute left-[39px] top-0 h-8 w-px rounded-full bg-current"
        animate={{ opacity: [0, 0.55, 0], y: [8, -2, -10], scaleY: [0.7, 1, 0.7] }}
        transition={{ duration: 2.2, delay: 0.45, repeat: Infinity, ease: 'easeInOut' }}
      />
      <BrandMark className="absolute bottom-0 left-0 h-16 w-16" />
    </div>
  );
}

export default function IntroLoader({ onComplete }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[#1A1A1A] text-white"
      initial={{ y: 0 }}
      animate={{ y: 0 }}
      exit={{ y: '-100%' }}
      transition={{ duration: shouldReduceMotion ? 0.2 : 0.65, ease: [0.76, 0, 0.24, 1] }}
      role="status"
      aria-label="Welcome to Brew and Bloom"
    >
      <img
        src="/images/videoframe_4557.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/65 to-[#1A1A1A]/90" />

      <motion.div
        className="relative z-10 flex flex-col items-center px-6 text-center"
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0.2 : 1, delay: shouldReduceMotion ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <BrandMark className="h-16 w-16 text-[#C85A38]" />
        <p className="mt-5 font-display text-3xl font-medium uppercase tracking-[.2em] sm:text-4xl">Brew <span className="text-[#A66A2C]">&amp;</span> Bloom</p>
        <p className="mt-3 text-[10px] uppercase tracking-[.32em] text-white/65">Coffee, considered</p>
        <SteamingCup />
      </motion.div>

      <div className="absolute bottom-10 left-8 right-28 h-px overflow-hidden bg-white/20 sm:left-12 sm:right-40">
        <motion.div
          className="h-full origin-left bg-[#6F4E37]"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: shouldReduceMotion ? 0.2 : 3.8, delay: shouldReduceMotion ? 0 : 0.4, ease: 'linear' }}
        />
      </div>
      <button
        type="button"
        onClick={onComplete}
        className="absolute bottom-7 right-6 z-20 rounded-full px-3 py-2 text-[10px] uppercase tracking-[.2em] text-white/55 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A66A2C] sm:bottom-8 sm:right-10 sm:text-xs"
      >
        Skip intro
      </button>
    </motion.div>
  );
}
