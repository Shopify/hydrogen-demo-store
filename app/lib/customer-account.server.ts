import {redirectDocument} from 'react-router';
import type {RouterContextProvider} from 'react-router';
import {createCustomerAccountClient} from '@shopify/hydrogen/customer-account';

import {envContext, storefrontRequestContext} from '~/lib/storefront';
import {sessionManagerContext} from '~/lib/session.server';
import {getCustomerSession} from '~/lib/customer-session';

export async function getAuthenticatedCustomerClient(
  request: Request,
  context: Readonly<RouterContextProvider>,
) {
  const env = context.get(envContext);
  const requestContext = context.get(storefrontRequestContext);
  const sessionManager = context.get(sessionManagerContext);
  const customerSession = getCustomerSession(env);

  const accessToken = await customerSession.getAccessToken(
    sessionManager,
    requestContext,
  );

  if (!accessToken) {
    const url = new URL(request.url);
    const isLoggedIn = await customerSession.isLoggedIn(
      sessionManager,
      requestContext,
    );

    if (isLoggedIn && !url.searchParams.has('refreshed')) {
      url.searchParams.set('refreshed', '1');
      throw redirectDocument(
        `/account/refresh?return_to=${encodeURIComponent(
          url.pathname + url.search,
        )}`,
      );
    }

    throw redirectDocument(
      `/account/login?return_to=${encodeURIComponent(url.pathname)}`,
    );
  }

  const client = createCustomerAccountClient({
    shopId: env.SHOP_ID,
    requestContext,
  });

  return {client, accessToken};
}
