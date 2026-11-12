import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const addToCart = (item) => {
    setCart((currentCart) => {
      const existing = currentCart.find((entry) => entry.id === item.id);
      if (existing) {
        return currentCart.map((entry) =>
          entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
        );
      }
      return [...currentCart, { ...item, quantity: 1 }];
    });
    openCart();
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      setCart((currentCart) => currentCart.filter((entry) => entry.id !== id));
      return;
    }

    setCart((currentCart) =>
      currentCart.map((entry) =>
        entry.id === id ? { ...entry, quantity } : entry
      )
    );
  };

  const clearCart = () => setCart([]);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [cart]
  );

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      updateQuantity,
      clearCart,
      total,
      cartOpen,
      openCart,
      closeCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
