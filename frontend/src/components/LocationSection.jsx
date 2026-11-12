import { MapPin } from 'lucide-react';

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5 shrink-0 text-[#2A4B3C]">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LocationSection() {
  return (
    <section id="location" className="scroll-mt-24 bg-[#FAF8F5] px-5 py-24 text-[#2C2A29] md:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.2em] text-ember-copper">Find us</p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-[#2C2A29] sm:text-5xl">Visit us in Maseru.</h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#6d6c65] md:text-base">
            Come say hello. Whether you&apos;re grabbing a quick espresso before shopping or staying for a slow pour-over, our doors are open.
          </p>

          <div className="mt-9 space-y-5">
            <div className="flex items-start gap-3">
              <MapPin aria-hidden="true" className="h-5 w-5 shrink-0 text-[#C85A38]" strokeWidth={1.7} />
              <div>
                <h3 className="font-semibold">Pioneer Mall, Maseru</h3>
                <p className="mt-1 text-sm text-[#6d6c65]">First Floor</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin aria-hidden="true" className="h-5 w-5 shrink-0 text-[#C85A38]" strokeWidth={1.7} />
              <div>
                <h3 className="font-semibold">Maseru Mall</h3>
                <p className="mt-1 text-sm text-[#6d6c65]">First Floor, next to KFC, near the stadium area</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ClockIcon />
              <div>
                <h3 className="font-semibold">Opening hours</h3>
                <p className="mt-1 text-sm leading-6 text-[#6d6c65]">Mon–Fri: 8:00 AM–6:00 PM<br />Sat–Sun: 9:00 AM–4:00 PM</p>
              </div>
            </div>
          </div>

          <a
            href="https://maps.google.com/?q=Pioneer+Mall+Maseru"
            target="_blank"
            rel="noreferrer"
            className="mt-9 inline-flex min-h-12 items-center rounded-full bg-[#C85A38] px-7 text-sm font-semibold text-white transition hover:scale-[1.03] hover:bg-[#D95D39]"
          >
            Get Directions
          </a>
        </div>

        <svg
          viewBox="0 0 600 420"
          role="img"
          aria-label="Brew & Bloom roadside billboard advertising coffee in Maseru"
          className="h-auto w-full drop-shadow-[0_24px_32px_rgba(44,42,41,.16)]"
        >
          <defs>
            <linearGradient id="billboard-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F4EEE5" />
              <stop offset="1" stopColor="#E9E0D5" />
            </linearGradient>
            <linearGradient id="billboard-panel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FFFCF7" />
              <stop offset="1" stopColor="#F4EEE5" />
            </linearGradient>
          </defs>
          <rect x="10" y="10" width="580" height="400" rx="28" fill="url(#billboard-sky)" />
          <path d="M10 328c104-27 188-4 286-16 101-12 185-31 294-5v103H10Z" fill="#D9D7C8" />
          <path d="M202 239h34v143h-34zm162 0h34v143h-34z" fill="#6F4E37" />
          <path d="M185 378h230l22 17H163z" fill="#5A4030" />
          <rect x="54" y="46" width="492" height="208" rx="18" fill="#6F4E37" />
          <rect x="63" y="55" width="474" height="190" rx="12" fill="url(#billboard-panel)" />
          <path d="M85 210h52v15H85z" fill="#6F4E37" />
          <svg x="88" y="89" width="118" height="118" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <path d="M14 31h32v11a13 13 0 0 1-13 13h-6a13 13 0 0 1-13-13V31Z" stroke="#6F4E37" strokeWidth="2.4" strokeLinejoin="round" />
            <path d="M46 35h4a6 6 0 0 1 0 12h-7M19 59h25" stroke="#6F4E37" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M30 30c0-7 1-12 4-17m-3 10c-7 0-11-4-12-10 7-1 12 2 14 8m2-4c1-7 5-10 11-11 0 7-3 12-10 14" stroke="#6F4E37" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <text x="229" y="133" fill="#2C2A29" fontFamily="Georgia, serif" fontSize="32" fontWeight="700" letterSpacing="1.2">BREW &amp; BLOOM</text>
          <path d="M229 151h266" stroke="#6F4E37" strokeWidth="3" />
          <text x="231" y="181" fill="#6D6C65" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700" letterSpacing="4">COFFEE · MASERU</text>
          <text x="229" y="218" fill="#6F4E37" fontFamily="Georgia, serif" fontSize="16" fontStyle="italic">Slow roast. Thoughtful pour.</text>
        </svg>
      </div>
    </section>
  );
}
