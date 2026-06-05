import { useState, useEffect, useCallback } from 'react';
import { cartStore } from '../../store/cart';
import type { Cart, CartLine } from '../../types/shopify';

function formatPrice(amount: string, currency: string) {
  return new Intl.NumberFormat('en-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(parseFloat(amount));
}

function CartLineItem({ line, onUpdate }: { line: CartLine; onUpdate: () => void }) {
  const [loading, setLoading] = useState(false);

  async function updateQty(qty: number) {
    setLoading(true);
    const cart = cartStore.get();
    if (!cart) return;
    try {
      const res = await fetch('/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId: cart.id, lineId: line.id, quantity: qty }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      cartStore.set(data.cart);
      onUpdate();
    } catch {
      alert('Error updating cart. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const img = line.merchandise.product.featuredImage;
  const lineTotal = parseFloat(line.merchandise.price.amount) * line.quantity;

  return (
    <div className={`flex gap-3 py-4 border-b border-neutral-100 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Image */}
      <div className="w-18 h-18 flex-shrink-0 rounded-xl overflow-hidden bg-pink-bg">
        {img ? (
          <img src={img.url} alt={img.altText ?? ''} className="w-full h-full object-cover" width={72} height={72} loading="lazy" />
        ) : (
          <div className="w-full h-full bg-pink-bg" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-800 truncate">{line.merchandise.product.title}</p>
        {line.merchandise.title !== 'Default Title' && (
          <p className="text-xs text-neutral-500 mt-0.5">{line.merchandise.title}</p>
        )}

        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold text-pink">
            {formatPrice(String(lineTotal), line.merchandise.price.currencyCode)}
          </span>

          <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden">
            <button
              onClick={() => updateQty(line.quantity - 1)}
              className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-pink-bg hover:text-pink transition-colors text-base"
              aria-label="Decrease quantity"
            >−</button>
            <span className="w-7 text-center text-sm font-semibold">{line.quantity}</span>
            <button
              onClick={() => updateQty(line.quantity + 1)}
              className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-pink-bg hover:text-pink transition-colors text-base"
              aria-label="Increase quantity"
            >+</button>
          </div>
        </div>

        <button
          onClick={() => updateQty(0)}
          className="text-xs text-neutral-400 hover:text-red-500 transition-colors mt-1 flex items-center gap-1"
          aria-label="Remove item"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
          Remove
        </button>
      </div>
    </div>
  );
}

export default function CartDrawer() {
  const [cart, setCart] = useState<Cart | null>(cartStore.get());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsub = cartStore.subscribe(setCart);

    // Listen for open/close events from non-React code
    const handleOpen  = () => setOpen(true);
    const handleClose = () => setOpen(false);
    window.addEventListener('cart:open',  handleOpen);
    window.addEventListener('cart:close', handleClose);

    // Expose helpers to window for Astro Header
    (window as any).openCart  = handleOpen;
    (window as any).closeCart = handleClose;

    return () => {
      unsub();
      window.removeEventListener('cart:open',  handleOpen);
      window.removeEventListener('cart:close', handleClose);
    };
  }, []);

  const handleUpdate = useCallback(() => setCart(cartStore.get()), []);

  const totalQty = cart?.totalQuantity ?? 0;
  const isEmpty  = !cart || totalQty === 0;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 bg-black/45 z-[1000] transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 w-[420px] max-w-full h-dvh bg-white z-[1001] flex flex-col shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
        aria-label="Shopping cart"
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
          <h2 className="text-lg font-bold font-heading text-neutral-800 flex items-center gap-2">
            My Cart
            {totalQty > 0 && (
              <span className="bg-pink text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{totalQty}</span>
            )}
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-neutral-100 hover:bg-pink-bg hover:text-pink text-neutral-600 transition-colors"
            aria-label="Close cart"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6">
          {isEmpty ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center py-12">
              <div className="text-neutral-300">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-neutral-600 mb-1">Your cart is empty</p>
                <p className="text-sm text-neutral-400">Add some artwork to get started</p>
              </div>
              <button onClick={() => setOpen(false)} className="btn btn-primary mt-2">
                Browse Shop
              </button>
            </div>
          ) : (
            <div>
              {cart!.lines.nodes.map(line => (
                <CartLineItem key={line.id} line={line} onUpdate={handleUpdate} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isEmpty && (
          <div className="px-6 py-5 bg-neutral-50 border-t border-neutral-100">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-neutral-700">Subtotal</span>
              <span className="font-bold text-lg text-pink">
                {formatPrice(cart!.cost.totalAmount.amount, cart!.cost.totalAmount.currencyCode)}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mb-4">Taxes and shipping calculated at checkout.</p>
            <a
              href={cart!.checkoutUrl}
              className="btn btn-primary btn-lg w-full justify-center mb-3"
            >
              Checkout →
            </a>
            <button
              onClick={() => setOpen(false)}
              className="btn btn-outline w-full justify-center"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
