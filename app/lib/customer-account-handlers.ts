import {createCustomerAccountServerHandlers} from '@shopify/hydrogen/customer-account';

import {getCustomerSession} from './customer-session';

function createHandlers(env: Env) {
  return createCustomerAccountServerHandlers({
    customerSession: getCustomerSession(env),
  });
}

let customerAccountHandlers: ReturnType<typeof createHandlers> | undefined;

export function getCustomerAccountHandlers(env: Env) {
  return (customerAccountHandlers ??= createHandlers(env));
}
