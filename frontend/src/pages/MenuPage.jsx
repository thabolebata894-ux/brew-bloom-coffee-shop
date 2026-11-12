import { useEffect, useState } from 'react';
import HeroSection from '../components/HeroSection';
import MenuSection from '../components/MenuSection';
import LocationSection from '../components/LocationSection';
import Reveal from '../components/Reveal';
import { getMenu } from '../api/api';
import { BrandMark } from '../components/HeroSection';

const brewSteps = [
  {
    number: '01',
    name: 'The origin',
    title: 'Sourced with integrity.',
    body: 'We partner directly with farmers who prioritize quality and sustainability. Every bean has a story.',
    marker: 'STEP 01 — THE ORIGIN'
  },
  {
    number: '02',
    name: 'The roast',
    title: 'Heat, time, and a patient hand.',
    body: 'Small batches let us follow each bean as it opens up, keeping its natural sweetness while building a deep, balanced cup.',
    marker: 'SMALL BATCH · ROASTED WITH INTENTION'
  },
  {
    number: '03',
    name: 'The pour',
    title: 'A final detail makes the ritual.',
    body: 'Dialed in for the day, pulled to order, and handed over at its best. No rush, no shortcuts, just a really good cup.',
    marker: 'MADE FRESH · SERVED AT YOUR PACE'
  }
];

function BrewingProcess() {
  const [stepIndex, setStepIndex] = useState(0);
  const step = brewSteps[stepIndex];

  return (
    <section id="process" className="relative scroll-mt-24 overflow-hidden border-y border-white/10 px-5 py-24 text-[#F9F6F0] md:px-12 md:py-32">
      <div aria-hidden="true" className="absolute inset-0">
        <img
          src="/images/ice.jpg"
          alt=""
          className="h-full w-full object-cover object-center"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_48%,rgba(111,78,55,.12),transparent_48%)]" />
      </div>
      <div className="relative z-10 mx-auto grid max-w-7xl gap-14 px-6 md:grid-cols-[.8fr_1.2fr] md:items-center md:gap-24">
        <Reveal>
          <p className="mb-4 text-xs font-bold uppercase tracking-[.28em] text-ember-copper">Not a shortcut in sight</p>
          <h2 className="font-display text-4xl font-medium leading-tight tracking-[-.03em] md:text-6xl">Three steps.<br />One proper cup.</h2>
          <p className="mt-6 max-w-md text-sm leading-7 text-[#D2CBC2] md:text-base">We believe great coffee is a journey. From the farm to your cup, here is how we honor the craft.</p>
          <div className="mt-10 flex gap-2" role="tablist" aria-label="Brewing process steps">
            {brewSteps.map((item, index) => (
              <button
                type="button"
                key={item.number}
                onClick={() => setStepIndex(index)}
                role="tab"
                aria-selected={stepIndex === index}
                className={`group flex items-center gap-3 rounded-full border px-4 py-3 text-xs transition hover:scale-[1.03] ${stepIndex === index ? 'border-[#6F4E37] bg-[#6F4E37] text-white' : 'border-white/60 bg-black/10 text-[#F9F6F0] hover:border-ember-gold/60'}`}
              >
                <span className="font-bold">{item.number}</span><span className="hidden sm:inline">{item.name}</span>
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delay={130}>
          <div className="relative z-10 min-h-[350px] overflow-hidden rounded-[2rem] border border-white/70 bg-[#FAF8F5] p-7 text-[#2C2A29] shadow-2xl sm:p-10 md:min-h-[410px]">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#6F4E37]/10 blur-3xl" />
            <div className="absolute bottom-8 right-7 grid h-48 w-48 place-items-center rounded-full border border-ember-gold/10 sm:right-14 sm:h-60 sm:w-60">
              <div className="grid h-36 w-36 place-items-center rounded-full border border-[#6F4E37]/20 bg-[radial-gradient(circle,rgba(111,78,55,.13),transparent_68%)] sm:h-48 sm:w-48">
                <BrandMark className="h-20 w-20 text-[#6F4E37] sm:h-28 sm:w-28" />
              </div>
            </div>
            <div key={step.number} className="relative z-10 max-w-sm animate-fade-up">
              <span className="font-display text-7xl font-medium text-[#6F4E37]">{step.number}</span>
              <p className="mt-7 text-[10px] font-bold uppercase tracking-[.22em] text-ember-gold">{step.marker}</p>
              <h3 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">{step.title}</h3>
              <p className="mt-4 max-w-sm font-sans text-sm leading-7 text-[#6d6c65]">{step.body}</p>
            </div>
            <div className="absolute bottom-6 left-7 right-7 h-px bg-ember-line sm:left-10 sm:right-10" />
            <span className="absolute bottom-8 right-8 text-[9px] uppercase tracking-[.24em] text-ember-muted sm:right-10">{step.name}</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-white/15 bg-[#2C2A29] px-5 pt-24 text-white md:px-12 lg:pt-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 pb-14 sm:grid-cols-2 lg:grid-cols-[1.2fr_.7fr_1fr] lg:pb-20">
        <div>
          <a href="/#home" className="inline-flex items-center gap-3">
            <BrandMark className="h-11 w-11 text-ember-copper" />
            <span className="font-display text-base font-semibold uppercase leading-[1.05] tracking-[.18em]">Brew <span className="text-ember-copper">&amp;</span><br />Bloom</span>
          </a>
          <p className="mt-5 max-w-xs text-sm leading-7 text-white/75">Coffee for people who care how it&apos;s made — and take the time to enjoy it.</p>
        </div>
        <div>
          <h2 className="mb-5 text-[10px] font-bold uppercase tracking-[.32em] text-white/80">Explore</h2>
          <div className="flex flex-col items-start gap-3 text-sm text-white/75">
            <a className="transition hover:text-ember-copper" href="/#process">Our method</a>
            <a className="transition hover:text-ember-copper" href="/#menu">The menu</a>
            <a className="transition hover:text-ember-copper" href="/staff">Staff portal</a>
          </div>
        </div>
        <div>
          <h2 className="mb-5 text-[10px] font-bold uppercase tracking-[.32em] text-white/80">Get in touch</h2>
          <ul className="space-y-3 text-sm text-white/75">
            {[
              { label: '+266 59970607', phone: '+26659970607', whatsapp: '26659970607' },
              { label: '+266 59517197', phone: '+26659517197', whatsapp: '26659517197' },
              { label: '+266 577 5554', phone: '+2665775554', whatsapp: '2665775554' }
            ].map((contact) => (
              <li key={contact.phone} className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <a className="transition hover:text-ember-copper" href={`tel:${contact.phone}`}>{contact.label}</a>
                <a
                  className="text-xs font-semibold text-ember-copper transition hover:text-ember-gold"
                  href={`https://wa.me/${contact.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Chat with Brew and Bloom on WhatsApp at ${contact.label}`}
                >
                  WhatsApp
                </a>
              </li>
            ))}
          </ul>
          <a className="mt-4 inline-block text-sm text-white/75 transition hover:text-ember-copper" href="mailto:thabolebata894@gmail.com">
            thabolebata894@gmail.com
          </a>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 border-t border-white/20 px-6 py-5 text-[10px] tracking-wide text-white/75 sm:flex-row">
        <span>© {new Date().getFullYear()} Brew &amp; Bloom Coffee House</span>
        <span>Stay curious. Drink good coffee.</span>
      </div>
    </footer>
  );
}

export default function MenuPage() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMenu = async () => {
    setLoading(true);
    setError('');
    try {
      const items = await getMenu();
      setMenu(items.map((item) => ({
        ...item,
        category: item.category || inferCategory(item)
      })));
    } catch (requestError) {
      setError(requestError.message || 'Unable to load the menu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  return (
    <main>
      <HeroSection />
      <BrewingProcess />
      <MenuSection items={menu} loading={loading} error={error} onRetry={loadMenu} />
      <section className="relative overflow-hidden border-y border-ember-line bg-ember-charcoal px-6 py-20 text-center text-ember-ivory md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(111,78,55,.16),transparent_55%)]" />
        <Reveal className="relative mx-auto max-w-3xl">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[.28em] text-ember-copper">Make room for a better break</p>
          <h2 className="font-display text-4xl leading-tight sm:text-6xl">A good cup changes<br className="hidden sm:block" /> the whole afternoon.</h2>
          <a href="#menu" className="mt-8 inline-flex rounded-full border border-ember-copper px-7 py-3.5 text-sm font-semibold text-ember-ivory transition hover:scale-105 hover:bg-ember-copper hover:text-ember-charcoal">Explore the menu <span className="ml-3">↗</span></a>
        </Reveal>
      </section>
      <LocationSection />
      <SiteFooter />
    </main>
  );
}

function inferCategory(item) {
  const searchable = `${item.name} ${item.description}`.toLowerCase();
  if (/\b(tea|matcha|chai|earl grey)\b/.test(searchable)) return 'Tea';
  if (/\b(muffin|cake|cookie|croissant|pastr|brownie|scone)\b/.test(searchable)) return 'Pastries';
  return 'Coffee';
}
