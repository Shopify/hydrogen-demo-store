import {createCartComponents} from '@shopify/hydrogen/react';
import type {CartDataFromHandlers} from '@shopify/hydrogen';

import type {cartHandlers} from './cart-handlers';

export const {CartProvider, useCart, useCartForm} =
  createCartComponents<typeof cartHandlers>();

export type CartData = CartDataFromHandlers<typeof cartHandlers>;
export type CartLineNode = CartData['lines']['nodes'][number];
