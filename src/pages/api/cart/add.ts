import type { APIRoute } from 'astro';
import { createCart, addCartLines, CartStockError } from '../../../lib/shopify';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { variantId, quantity = 1, cartId } = await request.json();

    if (!variantId) {
      return new Response(JSON.stringify({ error: 'variantId requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const lines = [{ merchandiseId: variantId, quantity }];
    const cart = cartId
      ? await addCartLines(cartId, lines)
      : await createCart(lines);

    return new Response(JSON.stringify({ cart }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof CartStockError) {
      return new Response(JSON.stringify({ error: 'out_of_stock', message: err.message }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.error('Cart add error:', err);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
