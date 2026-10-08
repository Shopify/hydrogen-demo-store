import {createCartServerHandlers} from '@shopify/hydrogen';

import {getCustomerSession} from './customer-session';

function createHandlers(env: Env) {
  return createCartServerHandlers({
    customerSession: getCustomerSession(env),
  });
}

let cartHandlers: ReturnType<typeof createHandlers> | undefined;

export function getCartHandlers(env: Env) {
  return (cartHandlers ??= createHandlers(env));
}

export type AppCartHandlers = ReturnType<typeof getCartHandlers>;
