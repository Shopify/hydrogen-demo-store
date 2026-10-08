import {createCustomerSession} from '@shopify/hydrogen/customer-account';

let customerSession: ReturnType<typeof createCustomerSession> | undefined;

export function getCustomerSession(env: Env) {
  return (customerSession ??= createCustomerSession({
    shopId: env.SHOP_ID,
    customerAccountApiClientId: env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID,
  }));
}
