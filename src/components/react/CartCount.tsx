import { useState, useEffect } from 'react';
import { cartStore } from '../../store/cart';

export default function CartCount() {
  const [count, setCount] = useState(cartStore.get()?.totalQuantity ?? 0);

  useEffect(() => {
    return cartStore.subscribe(cart => setCount(cart?.totalQuantity ?? 0));
  }, []);

  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-pink text-white rounded-full text-[10px] font-bold flex items-center justify-center px-1 leading-none">
      {count}
    </span>
  );
}
