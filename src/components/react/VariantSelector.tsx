import { useState } from 'react';
import type { ProductVariant } from '../../types/shopify';

function formatPrice(amount: string, currency: string) {
  return new Intl.NumberFormat('en-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(parseFloat(amount));
}

interface Props {
  variants: ProductVariant[];
  onSelect: (variant: ProductVariant) => void;
}

export default function VariantSelector({ variants, onSelect }: Props) {
  const [selected, setSelected] = useState(variants[0]);

  if (variants.length <= 1) return null;

  function select(v: ProductVariant) {
    setSelected(v);
    onSelect(v);
  }

  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-neutral-600 mb-3">
        Variant: <span className="text-neutral-800">{selected.title}</span>
        {' — '}
        <span className="text-pink font-bold">{formatPrice(selected.price.amount, selected.price.currencyCode)}</span>
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Select variant">
        {variants.map(v => (
          <button
            key={v.id}
            onClick={() => select(v)}
            disabled={!v.availableForSale}
            aria-pressed={selected.id === v.id}
            className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all duration-200 ${
              selected.id === v.id
                ? 'border-pink bg-pink-bg text-pink'
                : v.availableForSale
                  ? 'border-neutral-200 text-neutral-700 hover:border-pink-light'
                  : 'border-neutral-100 text-neutral-300 line-through cursor-not-allowed'
            }`}
          >
            {v.title}
          </button>
        ))}
      </div>
    </div>
  );
}
