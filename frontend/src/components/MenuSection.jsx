import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useCart } from '../context/CartContex';
import Reveal from './Reveal';

const filters = ['All', 'Coffee', 'Tea', 'Pastries', 'Other'];
const tones = [
  'from-[#47352b] via-[#8d4e2f] to-[#1e1e1e]',
  'from-[#332c26] via-[#a36e48] to-[#241b16]',
  'from-[#27312d] via-[#60705e] to-[#202622]',
  'from-[#41312b] via-[#bd8256] to-[#39271e]'
];

const menuPhotography = {
  cappuccino: '/images/cappuccino.jpg',
  latte: '/images/latte.jpg',
  americano: '/images/americano.jpg',
  pastry: '/images/muffin.jpg'
};

function getCategory(item) {
  const category = String(item.category || '').trim().toLowerCase();
  const knownCategory = filters.find((filter) => filter.toLowerCase() === category);
  if (knownCategory && knownCategory !== 'All') return knownCategory;
  const name = `${item.name} ${item.description}`.toLowerCase();
  if (/\b(tea|matcha|chai|earl grey)\b/.test(name)) return 'Tea';
  if (/\b(muffin|cake|cookie|croissant|pastr|brownie|scone)\b/.test(name)) return 'Pastries';
  if (category === 'other') return 'Other';
  return 'Coffee';
}

function getPhotographyPath(item, category) {
  const name = String(item.name || '').toLowerCase();
  if (category === 'Pastries') {
    return name.includes('muffin') ? menuPhotography.pastry : null;
  }
  if (name.includes('cappuccino')) return menuPhotography.cappuccino;
  if (name.includes('americano')) return menuPhotography.americano;
  if (name.includes('latte')) return menuPhotography.latte;
  return null;
}

function MenuSkeletons() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="status" aria-label="Loading menu">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-[1.4rem] border border-[#ece7e1] bg-white p-3 shadow-[0_12px_36px_rgba(44,42,41,.04)]">
          <div className="aspect-[4/3] animate-pulse rounded-[1rem] bg-[#e9e4dc]" />
          <div className="px-2 pb-2 pt-5">
            <div className="flex items-baseline justify-between gap-4">
              <div className="h-6 w-2/3 animate-pulse rounded bg-[#e9e4dc]" />
              <div className="h-4 w-12 animate-pulse rounded bg-[#e9e4dc]" />
            </div>
            <div className="mt-4 h-3 w-full animate-pulse rounded bg-[#efebe5]" />
            <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-[#efebe5]" />
            <div className="mt-6 h-12 animate-pulse rounded-full bg-[#e9e4dc]" />
          </div>
        </div>
      ))}
      <span className="sr-only">Warming the cups, loading the menu…</span>
    </div>
  );
}

export default function MenuSection({ items = [], loading = false, error = '', onRetry }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const { addToCart } = useCart();
  const shouldReduceMotion = useReducedMotion();
  const filteredItems = useMemo(
    () => activeFilter === 'All' ? items : items.filter((item) => getCategory(item) === activeFilter),
    [activeFilter, items]
  );
  const displayedItems = useMemo(() => {
    const usedPhotography = new Set();
    return filteredItems.map((item) => {
      const category = getCategory(item);
      let imageUrl = getPhotographyPath(item, category);
      if (usedPhotography.has(imageUrl)) imageUrl = null;
      if (imageUrl) usedPhotography.add(imageUrl);
      return { item, category, imageUrl };
    });
  }, [filteredItems]);
  const categoryCounts = useMemo(() => Object.fromEntries(
    filters.map((filter) => [
      filter,
      filter === 'All' ? items.length : items.filter((item) => getCategory(item) === filter).length
    ])
  ), [items]);

  return (
    <section id="menu" className="scroll-mt-24 bg-[#FAF8F5] px-5 py-24 text-[#2C2A29] md:px-8 md:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mb-12 flex flex-col justify-between gap-8 md:mb-16 md:flex-row md:items-end">
          <div>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[.28em] text-ember-copper">The counter · served today</p>
            <h2 className="text-4xl tracking-[-.03em] text-[#2C2A29] md:text-6xl" style={{ fontFamily: '"Playfair Display", serif' }}>A menu with a pulse.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#6d6c65] md:text-base">Roasted close, poured carefully, and made to be enjoyed at your own pace.</p>
          </div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter menu by category">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                role="tab"
                aria-selected={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full border px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition duration-200 hover:scale-[1.03] sm:px-5 ${activeFilter === filter ? 'border-[#C85A38] bg-[#C85A38] text-white' : 'border-[#ded9d0] bg-transparent text-[#74756e] hover:border-[#8A8178] hover:text-[#2C2A29]'}`}
              >
                {filter}<span className={`ml-2 text-[9px] ${activeFilter === filter ? 'text-white/75' : 'text-[#8A8178]'}`}>{categoryCounts[filter]}</span>
              </button>
            ))}
          </div>
        </Reveal>

        {loading && <MenuSkeletons />}
        {!loading && error && (
          <div className="flex flex-col justify-between gap-5 rounded-2xl border border-red-200 bg-red-50 p-7 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-display text-xl text-[#2C2A29]">The counter is temporarily quiet.</h3>
              <p className="mt-2 text-sm text-[#74756e]">Could not load menu: {error}</p>
            </div>
            <button type="button" onClick={onRetry} className="rounded-full bg-[#C85A38] px-5 py-3 text-sm font-bold text-white transition hover:scale-105 hover:bg-[#D95D39]">Try again</button>
          </div>
        )}
        {!loading && !error && items.length === 0 && <p className="rounded-2xl border border-[#ded9d0] p-10 text-center text-[#74756e]">Nothing on the counter just yet. Check back soon.</p>}
        {!loading && !error && items.length > 0 && filteredItems.length === 0 && (
          <p className="rounded-2xl border border-[#ded9d0] p-10 text-center text-[#74756e]">No {activeFilter.toLowerCase()} on today&apos;s counter.</p>
        )}
        {!loading && !error && filteredItems.length > 0 && (
          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.09 } }
            }}
          >
            {displayedItems.map(({ item, category, imageUrl }, index) => {
              return (
                <motion.article
                  key={item.id}
                  variants={{
                    hidden: { opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 22 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="group flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-[#ece7e1] bg-white p-3 shadow-[0_12px_36px_rgba(44,42,41,.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_54px_rgba(44,42,41,.12)]"
                >
                  <div className={`relative h-48 shrink-0 overflow-hidden rounded-t-xl bg-gradient-to-br ${tones[index % tones.length]}`}>
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt={`${item.name} served at Brew & Bloom`}
                        loading="lazy"
                        className="absolute inset-0 h-48 w-full object-cover brightness-[1.02] contrast-[1.02] transition-transform duration-700 ease-out group-hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <span className="absolute left-4 top-4 rounded-full border border-white/60 bg-[#FAF8F5]/90 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.18em] text-[#2C2A29] backdrop-blur">{category}</span>
                    {!item.available && <span className="absolute inset-0 grid place-items-center bg-[#2C2A29]/75 text-xs font-bold uppercase tracking-[.2em] text-white">Out of stock</span>}
                  </div>
                  <div className="flex flex-1 flex-col px-2 pb-2 pt-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="line-clamp-2 min-h-[3.5rem] min-w-0 flex-1 break-words whitespace-normal text-[1.55rem] leading-tight text-[#2C2A29]" style={{ fontFamily: '"Playfair Display", serif' }}>{item.name}</h3>
                      <span className="whitespace-nowrap text-sm font-semibold text-[#7A7571]">R{Number(item.price).toFixed(2)}</span>
                    </div>
                    <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-[#6d6c65]">{item.description || 'Made fresh at the counter.'}</p>
                    <button
                      type="button"
                      onClick={() => addToCart(item)}
                      disabled={!item.available}
                      className="mt-auto flex min-h-12 w-full items-center justify-between rounded-full bg-[#C85A38] px-5 text-xs font-semibold tracking-[.04em] text-white transition-colors duration-300 hover:bg-[#D95D39] disabled:cursor-not-allowed disabled:bg-[#b9b4ae]"
                    >
                      {item.available ? 'Add to Cart' : 'Unavailable'} <span aria-hidden="true" className="text-lg leading-none transition-transform group-hover:translate-x-1">↗</span>
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}
