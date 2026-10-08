import {createContext} from 'react-router';
import {
  createShopifyRequestContext,
  createStorefrontClient,
} from '@shopify/hydrogen';

import {getLocaleFromRequest} from './i18n';

type WaitUntil = ExecutionContext['waitUntil'];

export const envContext = createContext<Env>();
export const cacheContext = createContext<Cache>();
export const waitUntilContext = createContext<WaitUntil>();

function getBuyerIp(headers: Headers) {
  for (const header of [
    'oxygen-buyer-ip',
    'cf-connecting-ip',
    'x-forwarded-for',
  ]) {
    const ip = headers.get(header)?.split(',')[0]?.trim();
    if (ip) return ip;
  }
  if (process.env.NODE_ENV !== 'production') return '127.0.0.1';
  throw new Error('No buyer IP header on the request');
}

export function createRequestStorefrontClient(
  request: Request,
  env: Env,
  cache: Cache,
  waitUntil: WaitUntil,
) {
  const requestContext = createShopifyRequestContext({
    request,
    i18n: getLocaleFromRequest(request),
    buyerIp: getBuyerIp(request.headers),
  });

  const commonConfig = {
    storeDomain: env.PUBLIC_STORE_DOMAIN,
    storefrontId: env.PUBLIC_STOREFRONT_ID,
    cache,
    waitUntil,
  };

  if (env.PRIVATE_STOREFRONT_API_TOKEN) {
    return createStorefrontClient({
      type: 'private',
      requestContext,
      config: {
        ...commonConfig,
        privateStorefrontToken: env.PRIVATE_STOREFRONT_API_TOKEN,
      },
    });
  }

  return createStorefrontClient({
    type: 'public',
    requestContext,
    config: {
      ...commonConfig,
      publicStorefrontToken: env.PUBLIC_STOREFRONT_API_TOKEN,
    },
  });
}

export type AppStorefrontClient = ReturnType<
  typeof createRequestStorefrontClient
>;
export type AppRequestContext = AppStorefrontClient['requestContext'];

export const storefrontClientContext = createContext<AppStorefrontClient>();
export const storefrontRequestContext = createContext<AppRequestContext>();
