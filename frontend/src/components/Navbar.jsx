import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContex';
import { BrandMark } from './HeroSection';

export default function Navbar() {
  const { cart, openCart } = useCart();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-30 border-b border-ember-line/80 bg-ember-charcoal/95 text-ember-ivory shadow-lg shadow-black/10 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-6 px-5 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="Brew and Bloom home">
          <BrandMark className="h-10 w-10 text-[#C85A38]" />
          <span
            className="leading-[1.05] tracking-[0.16em] text-ember-ivory"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            <span className="text-sm font-semibold uppercase sm:text-base">Brew</span>
            <span className="mx-1 text-sm font-semibold uppercase text-ember-copper sm:text-base">&amp;</span>
            <span className="text-sm font-semibold uppercase sm:text-base">Bloom</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-[11px] font-medium uppercase tracking-[0.2em] text-ember-muted md:flex" aria-label="Main navigation">
          <a href="/#home" className="transition hover:text-ember-copper">Our story</a>
          <a href="/#process" className="transition hover:text-ember-copper">The method</a>
          <a href="/#menu" className="transition hover:text-ember-copper">The menu</a>
          <a href="/#location" className="transition hover:text-ember-copper">Location</a>
          <NavLink to="/staff" className={({ isActive }) => `transition hover:text-ember-copper ${isActive ? 'text-ember-gold' : ''}`}>Staff</NavLink>
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <button type="button" onClick={openCart} className="relative rounded-full border border-ember-line bg-transparent px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ember-ivory transition hover:scale-105 hover:border-ember-copper hover:text-ember-copper">
            Your order
            <span className="ml-2 inline-grid min-h-5 min-w-5 place-items-center rounded-full bg-ember-copper px-1 text-[10px] font-bold text-ember-charcoal">{itemCount}</span>
          </button>
          <a href="/#menu" className="hidden rounded-full bg-[#C85A38] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white transition hover:scale-[1.04] hover:bg-[#B84D30] sm:inline-flex">Order a coffee</a>
        </div>
      </div>
    </header>
  );
}
