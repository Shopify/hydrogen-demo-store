import {createCartComponents} from '@shopify/hydrogen/react';

import type {AppCartHandlers} from './cart-handlers';

export const {
  CartProvider,
  useCart,
  useSuspenseCart,
  useOptionalCart,
  useCartActions,
  useCartForm,
} = createCartComponents<AppCartHandlers>();
