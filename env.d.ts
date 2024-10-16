/// <reference types="vite/client" />
/// <reference types="@shopify/remix-oxygen" />
/// <reference types="@shopify/oxygen-workers-types" />

import type {
  WithCache,
  HydrogenCart,
  HydrogenEnv,
  HydrogenSessionData,
} from '@shopify/hydrogen';
import type {Storefront, CustomerAccount} from '~/lib/type';
import type {AppSession} from '~/lib/session.server';
import type {createAppLoadContext} from '~/lib/context';

declare global {
  /**
   * A global `process` object is only available during build to access NODE_ENV.
   */
  const process: {env: {NODE_ENV: 'production' | 'development'}};

  /**
   * Declare expected Env parameter in fetch handler.
   */
  interface Env extends HydrogenEnv {
    PRIVATE_ZOX_SIGNATURE_KEY: string;
    SESSION_SECRET: string;
    PUBLIC_STOREFRONT_API_TOKEN: string;
    PRIVATE_STOREFRONT_API_TOKEN: string;
    PUBLIC_STOREFRONT_API_VERSION: string;
    PUBLIC_STORE_DOMAIN: string;
    BUILDER_PUBLIC_API_KEY: string;
    PRIVATE_SMILE_API_KEY: string;
    PRIVATE_REDEMPTIONS_KEY: string;
    HYGRAPH_API_TOKEN: string;
    MAPBOX_API_KEY: string;
    PRIVATE_SHOPIFY_STORE_MULTIPASS_SECRET: string;
    PRIVATE_SHOPIFY_CHECKOUT_DOMAIN: string;
    PUBLIC_CHECKOUT_DOMAIN: string;
    PRIVATE_SKIO_CHECK_URL: string;
    PRIVATE_ZOX_REMIX_SKIO_API_KEY: string;
    PRIVATE_DISCOUNT_TRACKER_API_TOKEN: string;
    PRIVATE_DISCOUNT_TRACKER_API_URL: string;
    PRIVATE_LOCKDOWN_API_TOKEN: string;
    PUBLIC_LOCKDOWN_API_ENDPOINT: string;
    PRIVATE_REDIS_ENDPOINT: string;
    PRIVATE_REDIS_PORT: string;
    PRIVATE_STAMPED_IO_API_TOKEN: string;
    PUBLIC_STAMPED_IO_API_KEY: string;
    STAMPED_IO_STORE_HASH: string;
    GA_TRACKING_ID: string;
    PRIVATE_HEROKU_LOCATIONS_API_KEY: string;
    PUBLIC_REBUY_API_KEY: string;
    PRIVATE_OCTANE_AI_API_KEY: string;
    SHOPIFY_LOCKDOWN_APP_URL: string;
    PUBLIC_KLAVIYO_KEY: string;
    PRIVATE_REAMAZE_API_TOKEN: string;
    PUBLIC_RETENTION_ID: string;
    PRIVATE_GHOST_CONTENT_API_KEY: string;
    PRIVATE_GHOST_ADMIN_API_KEY: string;
    PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID: string;
    PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_SECRET: string;
    PUBLIC_CUSTOMER_ACCOUNT_API_URL: string;
    OPENAI_API_KEY: string;
    OPENAI_ORGANIZATION_ID: string;
    OPENAI_PROJECT_ID: string;
  }
}

declare module '@shopify/remix-oxygen' {
  /**
   * Declare local additions to the Remix loader context.
   */

  interface AppLoadContext
    extends Awaited<ReturnType<typeof createAppLoadContext>> {}

  /**
   * Declare local additions to the Remix session data.
   */
  interface SessionData extends HydrogenSessionData {}
}

// Needed to make this file a module.
export {};
