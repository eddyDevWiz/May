/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SHOPIFY_STORE_DOMAIN: string;
  readonly PUBLIC_SHOPIFY_STOREFRONT_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
