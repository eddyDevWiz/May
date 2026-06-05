import { useState } from 'react';
import type { ProductImage } from '../../types/shopify';

interface Props {
  images: ProductImage[];
  title: string;
  available: boolean;
}

export default function ProductGallery({ images, title, available }: Props) {
  const [active, setActive] = useState(0);
  const main = images[active];

  if (!main) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="relative rounded-3xl overflow-hidden bg-pink-bg aspect-square shadow-hover">
        <img
          src={main.url}
          alt={main.altText ?? title}
          className="w-full h-full object-cover"
          width={main.width}
          height={main.height}
          loading="eager"
          decoding="async"
        />
        {!available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xl font-bold font-heading tracking-wide">Sold Out</span>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 flex-wrap">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActive(i)}
              className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                i === active ? 'border-pink shadow-pink' : 'border-neutral-200 hover:border-pink-light'
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <img src={img.url} alt={img.altText ?? ''} className="w-full h-full object-cover" width={72} height={72} loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
