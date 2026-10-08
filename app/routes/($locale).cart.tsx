import {useEffect, useRef} from 'react';
import type {AnalyticsCart} from '@shopify/hydrogen';

import {Cart} from '~/components/Cart';
import {useCart} from '~/lib/cart';
import {AnalyticsEvent, getAnalytics} from '~/lib/analytics';

export default function CartRoute() {
  return (
    <div className="cart">
      <h1>Cart</h1>
      <Cart layout="page" />
      <CartViewTracker />
    </div>
  );
}

function CartViewTracker() {
  const loading = useCart((s) => s.loading);
  const cart = useCart((s) => s.data);
  const published = useRef(false);

  useEffect(() => {
    if (loading || published.current) return;
    published.current = true;
    getAnalytics()?.publish(AnalyticsEvent.CART_VIEWED, {
      cart: cart.id ? (cart as unknown as AnalyticsCart) : null,
      url: window.location.href,
    });
  }, [loading, cart]);

  return null;
}
