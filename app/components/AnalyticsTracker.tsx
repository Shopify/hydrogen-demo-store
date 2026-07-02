import {useEffect} from 'react';
import {useLocation} from 'react-router';

import {
  AnalyticsEvent,
  configureAnalytics,
  getAnalytics,
  type ConsentConfig,
  type ShopAnalytics,
} from '~/lib/analytics';

export function AnalyticsTracker({
  shop,
  consent,
}: {
  shop: ShopAnalytics;
  consent: ConsentConfig;
}) {
  const location = useLocation();
  const pageKey = `${location.pathname}${location.search}`;

  useEffect(() => {
    configureAnalytics(shop, consent);
    const analytics = getAnalytics();
    if (!analytics) return;

    analytics.publish(AnalyticsEvent.PAGE_VIEWED, {
      url: window.location.href,
      shop,
    });
  }, [pageKey, shop, consent]);

  return null;
}
