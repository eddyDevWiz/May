import { useState } from 'react';
import { cartStore } from '../../store/cart';
import { useTranslations } from '../../i18n/utils';
import type { Lang } from '../../i18n/utils';

interface Props {
  variantId: string;
  productTitle: string;
  available: boolean;
  lang?: Lang;
}

export default function AddToCart({ variantId, productTitle, available, lang = 'es' }: Props) {
  const t = useTranslations(lang);
  const msg = lang === 'en'
    ? { added: 'added to cart', error: 'Could not add to cart. Please try again.', outOfStock: 'Sorry, this piece is out of stock.', wrong: 'Something went wrong. Please try again.' }
    : { added: 'agregado al carrito', error: 'No se pudo agregar al carrito. Inténtalo de nuevo.', outOfStock: 'Lo sentimos, esta pieza está agotada.', wrong: 'Algo salió mal. Inténtalo de nuevo.' };
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(1);

  async function addToCart() {
    setLoading(true);
    const existingCart = cartStore.get();

    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId,
          quantity: qty,
          cartId: existingCart?.id,
        }),
      });
      if (res.status === 409) { showToast(msg.outOfStock); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      cartStore.set(data.cart);
      window.dispatchEvent(new Event('cart:open'));
      showToast(`✓ ${productTitle} ${msg.added}`);
    } catch {
      showToast(msg.error);
    } finally {
      setLoading(false);
    }
  }

  async function buyNow() {
    setLoading(true);
    const existingCart = cartStore.get();
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, quantity: qty, cartId: existingCart?.id }),
      });
      if (res.status === 409) { showToast(msg.outOfStock); setLoading(false); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      cartStore.set(data.cart);
      if (data.cart?.checkoutUrl) window.location.href = data.cart.checkoutUrl;
    } catch {
      showToast(msg.wrong);
      setLoading(false);
    }
  }

  if (!available) {
    return (
      <button disabled className="btn btn-lg w-full justify-center bg-neutral-100 text-neutral-400 border-neutral-100 cursor-not-allowed">
        {t.shop.soldOut}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Quantity + Add */}
      <div className="flex gap-3">
        <div className="flex items-center border-2 border-neutral-200 rounded-lg overflow-hidden flex-shrink-0">
          <button
            onClick={() => setQty(q => Math.max(1, q - 1))}
            className="w-10 h-12 flex items-center justify-center text-neutral-600 hover:bg-pink-bg hover:text-pink transition-colors text-lg font-medium"
            aria-label="Decrease"
          >−</button>
          <span className="w-10 text-center font-bold text-neutral-800">{qty}</span>
          <button
            onClick={() => setQty(q => Math.min(99, q + 1))}
            className="w-10 h-12 flex items-center justify-center text-neutral-600 hover:bg-pink-bg hover:text-pink transition-colors text-lg font-medium"
            aria-label="Increase"
          >+</button>
        </div>

        <button
          onClick={addToCart}
          disabled={loading}
          className={`btn btn-primary btn-lg flex-1 justify-center ${loading ? 'opacity-70 pointer-events-none' : ''}`}
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 10h-4z"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          )}
          {loading ? t.shop.adding : t.shop.addToCart}
        </button>
      </div>

      {/* Buy Now */}
      <button
        onClick={buyNow}
        disabled={loading}
        className="btn btn-outline btn-lg w-full justify-center"
      >
        {t.shop.buyNow}
      </button>
    </div>
  );
}

function showToast(msg: string) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
