import { createStorefrontApiClient } from '@shopify/storefront-api-client';
import type { Product, Collection } from '../types/shopify';

export type { Product, ProductImage, ProductVariant, Collection, Cart, CartLine } from '../types/shopify';

const client = createStorefrontApiClient({
  storeDomain: import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN,
  publicAccessToken: import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN,
  apiVersion: '2025-10',
});

// GraphQL fragment shared across queries
const PRODUCT_FRAGMENT = `
  fragment ProductFragment on Product {
    id handle title description descriptionHtml availableForSale tags
    featuredImage { url altText width height }
    images(first: 6) { nodes { url altText width height } }
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    variants(first: 20) {
      nodes { id title availableForSale price { amount currencyCode } }
    }
  }
`;

export async function getProducts(first = 12): Promise<Product[]> {
  const query = `
    ${PRODUCT_FRAGMENT}
    query GetProducts($first: Int!) {
      products(first: $first) { nodes { ...ProductFragment } }
    }
  `;
  const { data, errors } = await client.request(query, { variables: { first } });
  if (errors) throw new Error(errors.message);
  return data?.products?.nodes ?? [];
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  const query = `
    ${PRODUCT_FRAGMENT}
    query GetProduct($handle: String!) {
      product(handle: $handle) { ...ProductFragment }
    }
  `;
  const { data, errors } = await client.request(query, { variables: { handle } });
  if (errors) throw new Error(errors.message);
  return data?.product ?? null;
}

export async function getCollections(): Promise<Collection[]> {
  const query = `
    query GetCollections {
      collections(first: 10) {
        nodes { id handle title description image { url altText width height } }
      }
    }
  `;
  const { data, errors } = await client.request(query);
  if (errors) throw new Error(errors.message);
  return data?.collections?.nodes ?? [];
}

export async function getCollectionByHandle(handle: string, productsFirst = 12): Promise<Collection | null> {
  const query = `
    ${PRODUCT_FRAGMENT}
    query GetCollection($handle: String!, $productsFirst: Int!) {
      collection(handle: $handle) {
        id handle title description
        image { url altText width height }
        products(first: $productsFirst) { nodes { ...ProductFragment } }
      }
    }
  `;
  const { data, errors } = await client.request(query, { variables: { handle, productsFirst } });
  if (errors) throw new Error(errors.message);
  return data?.collection ?? null;
}

export async function createCart(lines: { merchandiseId: string; quantity: number }[]) {
  const query = `
    mutation CartCreate($lines: [CartLineInput!]!) {
      cartCreate(input: { lines: $lines }) {
        cart { ...CartFragment }
        userErrors { field message }
      }
    }
    ${CART_FRAGMENT}
  `;
  const { data, errors } = await client.request(query, { variables: { lines } });
  if (errors) throw new Error(errors.message);
  return data?.cartCreate?.cart;
}

export async function addCartLines(cartId: string, lines: { merchandiseId: string; quantity: number }[]) {
  const query = `
    mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { ...CartFragment }
        userErrors { field message }
      }
    }
    ${CART_FRAGMENT}
  `;
  const { data, errors } = await client.request(query, { variables: { cartId, lines } });
  if (errors) throw new Error(errors.message);
  return data?.cartLinesAdd?.cart;
}

export function formatPrice(amount: string, currencyCode: string, locale = 'en-CO'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
  }).format(parseFloat(amount));
}

const CART_FRAGMENT = `
  fragment CartFragment on Cart {
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
`;
