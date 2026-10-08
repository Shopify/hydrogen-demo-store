import {AnalyticsEvent} from '@shopify/hydrogen';

export {AnalyticsEvent};

export function getAnalytics() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.Shopify?.analytics;
}
