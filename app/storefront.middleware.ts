import {
  createStorefrontClient,
  createStorefrontRequestContext,
  handleShopifyRedirects,
  handleShopifyRoutes,
} from '@shopify/hydrogen';
import type {Route} from './+types/root';
import {AppSession} from '~/lib/session.server';
import {getLocaleFromRequest} from '~/lib/utils';
import {cartHandlers} from '~/lib/cart-handlers';
import {createCustomerAccountClient} from '~/lib/customer-account.server';
import {
  customerAccountContext,
  oxygenContext,
  sessionContext,
  storefrontContext,
} from '~/storefront.context';

export const storefrontMiddleware: Route.MiddlewareFunction = async (
  {request, context},
  next,
) => {
  const {env} = context.get(oxygenContext);

  if (!env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }

  const session = await AppSession.init(request, [env.SESSION_SECRET]);
  const requestContext = createStorefrontRequestContext(request);
  const locale = getLocaleFromRequest(request);
  const buyerIp = request.headers.get('oxygen-buyer-ip') ?? '127.0.0.1';

  const storefrontClient = createStorefrontClient({
    type: 'private',
    config: {
      storeDomain: env.PUBLIC_STORE_DOMAIN,
      privateStorefrontToken: env.PRIVATE_STOREFRONT_API_TOKEN,
      buyerIp,
      requestContext,
      i18n: {language: locale.language, country: locale.country},
    },
  });

  const shopifyRoute = await handleShopifyRoutes({
    request,
    storefrontClient,
    handlers: [cartHandlers],
  });
  if (shopifyRoute) return shopifyRoute;

  context.set(storefrontContext, storefrontClient);
  context.set(sessionContext, session);
  context.set(
    customerAccountContext,
    createCustomerAccountClient({request, session, env}),
  );

  const commitSession = async (response: Response) => {
    if (session.isPending) {
      response.headers.append('Set-Cookie', await session.commit());
    }
  };

  const response = await next();

  if (response.status === 404) {
    const redirect = await handleShopifyRedirects({request, storefrontClient});
    if (redirect) {
      requestContext.applyResponseHeaders(redirect.headers);
      await commitSession(redirect);
      return redirect;
    }
  }

  requestContext.applyResponseHeaders(response.headers);
  await commitSession(response);
  return response;
};
