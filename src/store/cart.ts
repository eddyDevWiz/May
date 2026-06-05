import type { Cart } from '../types/shopify';

// Simple pub/sub cart store shared between React components
type Listener = (cart: Cart | null) => void;

const listeners = new Set<Listener>();
let current: Cart | null = null;

function init() {
  try {
    const raw = localStorage.getItem('mg_cart');
    if (raw) current = JSON.parse(raw) as Cart;
  } catch { /* ignore */ }
}

if (typeof window !== 'undefined') init();

export const cartStore = {
  get(): Cart | null { return current; },

  set(cart: Cart | null) {
    current = cart;
    try { localStorage.setItem('mg_cart', JSON.stringify(cart)); } catch { /* ignore */ }
    listeners.forEach(fn => fn(cart));
  },

  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

// Expose for non-React code (Layout script etc.)
if (typeof window !== 'undefined') {
  (window as any).__cartStore = cartStore;
}
