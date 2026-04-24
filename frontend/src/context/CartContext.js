import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();
const CART_KEY     = 'fs_cart';
const CART_TS_KEY  = 'fs_cart_ts';
const CART_TTL_MS  = 6 * 60 * 60 * 1000; // 6 hours — cart expires after 6hrs (prices change daily)

function loadCart() {
  try {
    const saved = localStorage.getItem(CART_KEY);
    const ts    = localStorage.getItem(CART_TS_KEY);
    if (!saved) return [];

    // If cart is older than 6 hours, clear it — prices may have changed
    if (ts && Date.now() - parseInt(ts) > CART_TTL_MS) {
      localStorage.removeItem(CART_KEY);
      localStorage.removeItem(CART_TS_KEY);
      return [];
    }

    return JSON.parse(saved) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  try {
    if (cart.length === 0) {
      // Fully wipe from localStorage when empty
      localStorage.removeItem(CART_KEY);
      localStorage.removeItem(CART_TS_KEY);
    } else {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      // Only update timestamp when items are first added (not on every change)
      if (!localStorage.getItem(CART_TS_KEY)) {
        localStorage.setItem(CART_TS_KEY, String(Date.now()));
      }
    }
  } catch { /* storage full or private mode */ }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);

  // Sync to localStorage on every change
  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const exists = prev.find(i => i.productId === product.id);
      if (exists) {
        return prev.map(i =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + quantity, price: product.price } // always use latest price
            : i
        );
      }
      return [...prev, {
        productId:   product.id,
        productName: product.name,
        price:       product.price,   // today's live price
        quantity,
        unit:        product.unit,
        imageUrl:    product.imageUrl || '',
      }];
    });
  };

  const removeFromCart = (id) => setCart(p => p.filter(i => i.productId !== id));

  const clearCart = () => {
    // Wipe state AND localStorage immediately — no stale items after order
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(CART_TS_KEY);
    setCart([]);
  };

  const updateQuantity = (id, qty) => {
    if (qty <= 0) { removeFromCart(id); return; }
    setCart(p => p.map(i => i.productId === id ? { ...i, quantity: qty } : i));
  };

  const subtotal  = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart, subtotal, cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);