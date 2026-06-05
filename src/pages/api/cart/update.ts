import type { APIRoute } from 'astro';
import { createStorefrontApiClient } from '@shopify/storefront-api-client';

const client = createStorefrontApiClient({
  storeDomain: import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN,
  publicAccessToken: import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN,
  apiVersion: '2024-10',
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const { cartId, lineId, quantity } = await request.json();

    if (!cartId || !lineId) {
      return new Response(JSON.stringify({ error: 'cartId y lineId requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let cart;

    if (quantity === 0) {
      // Remove line
      const query = `
        mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
          cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
            cart {
              id checkoutUrl totalQuantity
              cost { totalAmount { amount currencyCode } }
              lines(first: 20) {
                nodes {
                  id quantity
                  merchandise {
                    ... on ProductVariant {
                      id title
                      price { amount currencyCode }
                      product { title featuredImage { url altText width height } }
                    }
                  }
                }
              }
            }
            userErrors { field message }
          }
        }
      `;
      const { data } = await client.request(query, { variables: { cartId, lineIds: [lineId] } });
      cart = data?.cartLinesRemove?.cart;
    } else {
      // Update quantity
      const query = `
        mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
          cartLinesUpdate(cartId: $cartId, lines: $lines) {
            cart {
              id checkoutUrl totalQuantity
              cost { totalAmount { amount currencyCode } }
              lines(first: 20) {
                nodes {
                  id quantity
                  merchandise {
                    ... on ProductVariant {
                      id title
                      price { amount currencyCode }
                      product { title featuredImage { url altText width height } }
                    }
                  }
                }
              }
            }
            userErrors { field message }
          }
        }
      `;
      const { data } = await client.request(query, {
        variables: { cartId, lines: [{ id: lineId, quantity }] },
      });
      cart = data?.cartLinesUpdate?.cart;
    }

    return new Response(JSON.stringify({ cart }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Cart update error:', err);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
