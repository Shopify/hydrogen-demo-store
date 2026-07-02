import {
  createStorefrontAnalytics,
  AnalyticsEvent,
  type ShopAnalytics,
  type ConsentConfig,
  type StorefrontAnalytics,
} from '@shopify/hydrogen';

export {AnalyticsEvent};
export type {ShopAnalytics, ConsentConfig};

let analytics: StorefrontAnalytics | null = null;
let currentShop: ShopAnalytics | null = null;

export function configureAnalytics(shop: ShopAnalytics, consent: ConsentConfig) {
  currentShop = shop;

  if (!analytics) {
    analytics = createStorefrontAnalytics({shop, consent});
  }

  return analytics;
}

export function getAnalytics() {
  return analytics;
}

export function getAnalyticsShop() {
  return currentShop;
}
