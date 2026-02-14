// Central Marketplace API configuration
// This URL is pre-configured so self-hosted CMS instances can automatically
// connect to the central marketplace without any manual setup.

export const MARKETPLACE_API_URL =
  "https://qrosfbyafhgrwamagrgn.supabase.co/functions/v1/marketplace-api";

export const MARKETPLACE_ENDPOINTS = {
  products: `${MARKETPLACE_API_URL}/products`,
  categories: `${MARKETPLACE_API_URL}/categories`,
  submit: `${MARKETPLACE_API_URL}/submit`,
  generateKey: `${MARKETPLACE_API_URL}/keys/generate`,
} as const;
