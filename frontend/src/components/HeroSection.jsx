import { Link } from 'react-router-dom';

export function BrandMark({ className = 'h-10 w-10' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="Brew and Bloom logo"
    >
      <path d="M14 31h32v11a13 13 0 0 1-13 13h-6a13 13 0 0 1-13-13V31Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M46 35h4a6 6 0 0 1 0 12h-7M19 59h25" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M30 30c0-7 1-12 4-17m-3 10c-7 0-11-4-12-10 7-1 12 2 14 8m2-4c1-7 5-10 11-11 0 7-3 12-10 14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 35h26" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity=".6" />
    </svg>
  );
}

export default function HeroSection() {
  return (
    <section id="home" className="bg-[#FAF8F5] text-[#2C2A29]">
      <div className="mx-auto grid max-w-[90rem] gap-14 px-6 pb-24 pt-16 sm:px-8 md:min-h-[820px] md:grid-cols-[.95fr_1.05fr] md:items-center md:gap-20 md:px-12 md:py-28 lg:px-16">
        <div className="max-w-2xl py-4 md:py-12">
          <h1
            className="text-[clamp(4rem,7.2vw,8.5rem)] font-normal leading-[0.91] tracking-[-0.065em] text-[#2C2A29]"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            Good mornings<br />take their <em className="not-italic text-[#C85A38]">time.</em>
          </h1>
          <p className="mt-10 max-w-lg text-base leading-8 text-[#6d6c65] md:text-lg md:leading-9">
            Thoughtfully sourced beans, roasted in small batches, and poured for the pleasure of slowing down.
          </p>
          <div className="mt-12 flex flex-wrap items-center gap-7">
            <a href="#menu" className="group inline-flex min-h-14 items-center gap-5 rounded-full bg-[#C85A38] px-7 text-sm font-medium text-white transition duration-300 hover:scale-[1.04] hover:bg-[#D95D39]">
              Explore our coffee <span className="transition-transform group-hover:translate-y-1">↓</span>
            </a>
            <Link to="/staff" className="text-xs font-medium uppercase tracking-[0.18em] text-[#6d6c65] underline decoration-[#8A8178]/50 underline-offset-4 transition hover:text-[#2C2A29]">Staff portal</Link>
          </div>
          <div className="mt-16 flex items-center gap-4 text-[10px] uppercase tracking-[.2em] text-[#8A8178]">
            <span className="h-px w-10 bg-[#8A8178]" /> Slow roast · thoughtful pour
          </div>
        </div>

        <div className="relative min-h-[480px] overflow-hidden rounded-[2rem] bg-[#2c211c] shadow-[0_30px_90px_rgba(44,42,41,0.18)] md:min-h-[680px]">
          <img
            src="/images/coffe-van.jpg"
            alt="Brew & Bloom coffee shop"
            fetchpriority="high"
            className="absolute inset-0 h-full w-full rounded-2xl object-cover brightness-[.82] contrast-[1.05] transition-transform duration-[1200ms] hover:scale-[1.03]"
          />
          <div
            aria-label="Brew and Bloom logo"
            className="absolute left-1/2 top-[24%] z-10 flex aspect-square w-[26%] max-w-44 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-[#E8C889]/90 bg-[#30231d]/95 text-[#F8E5B8] shadow-[0_0_28px_rgba(232,200,137,.55),inset_0_0_18px_rgba(232,200,137,.12)] md:top-[18%]"
          >
            <BrandMark className="h-[38%] w-[38%]" />
            <span className="mt-1 whitespace-nowrap text-[clamp(8px,1.3vw,12px)] font-semibold uppercase tracking-[.15em]">Brew &amp; Bloom</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-7 left-7 right-7 flex items-end justify-between gap-5 text-[#F9F6F0] md:bottom-10 md:left-10 md:right-10">
            <div>
              <p className="text-[9px] uppercase tracking-[.25em] text-white/75">The perfect pour</p>
              <p className="mt-2 text-2xl text-[#F9F6F0]" style={{ fontFamily: '"Playfair Display", serif' }}>Crafted with intention.</p>
            </div>
            <div className="hidden flex-col items-end gap-2 text-[9px] uppercase tracking-[.2em] text-white/75 sm:flex">
              <span>Single origin</span>
              <span>Locally roasted</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
