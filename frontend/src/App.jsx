import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import CartDrawer from './components/CartDrawer';
import IntroLoader from './components/IntroLoader';
import Navbar from './components/Navbar';
import { CartProvider, useCart } from './context/CartContex';
import MenuPage from './pages/MenuPage';
import StaffDashboard from './pages/StaffDashboard';
import StaffLogin from './pages/StaffLogin';

function CartRedirect() {
  const { openCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    openCart();
    navigate('/', { replace: true });
  }, [openCart, navigate]);

  return null;
}

export default function App() {
  const [staffSignedIn, setStaffSignedIn] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const finishIntro = useCallback(() => setIntroVisible(false), []);

  useEffect(() => {
    if (!introVisible) return undefined;
    const timerId = window.setTimeout(finishIntro, 4000);
    return () => window.clearTimeout(timerId);
  }, [finishIntro, introVisible]);

  return (
    <BrowserRouter>
      <CartProvider>
        <div className="min-h-screen bg-ember-charcoal font-sans text-ember-ivory antialiased selection:bg-ember-copper selection:text-ember-charcoal">
          <Navbar />
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/cart" element={<CartRedirect />} />
            <Route
              path="/staff"
              element={staffSignedIn
                ? <StaffDashboard onLogout={() => setStaffSignedIn(false)} />
                : <StaffLogin onLogin={() => setStaffSignedIn(true)} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <CartDrawer />
          <AnimatePresence>
            {introVisible && <IntroLoader key="intro-loader" onComplete={finishIntro} />}
          </AnimatePresence>
        </div>
      </CartProvider>
    </BrowserRouter>
  );
}
