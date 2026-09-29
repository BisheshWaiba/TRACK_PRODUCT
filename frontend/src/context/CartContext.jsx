import { createContext, useContext, useEffect, useState } from "react";
import { productById } from "../data/mockData";

const CartContext = createContext(null);

const STORAGE_KEY = "bulktrack_cart";

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { "grocery-a": 2 };
  } catch {
    return { "grocery-a": 2 };
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [items]);

  function addToCart(productId, qty = 1) {
    setItems((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + qty }));
  }

  function setQty(productId, qty) {
    setItems((prev) => {
      if (qty <= 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: qty };
    });
  }

  function removeFromCart(productId) {
    setItems((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  }

  function clearCart() {
    setItems({});
  }

  const lines = Object.entries(items)
    .map(([productId, qty]) => ({ product: productById(productId), qty }))
    .filter((l) => l.product);

  const count = lines.reduce((sum, l) => sum + l.qty, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);

  return (
    <CartContext.Provider value={{ items, lines, count, subtotal, addToCart, setQty, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
