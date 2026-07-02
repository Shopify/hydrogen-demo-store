import {
  createStorefrontClient,
  createShopifyRequestContext,
  handleShopifyRedirects,
  handleShopifyRoutes,
  type I18nConfig,
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
  const locale = getLocaleFromRequest(request);
  const requestContext = createShopifyRequestContext({
    request,
    i18n: {
      language: locale.language as I18nConfig['language'],
      country: locale.country as I18nConfig['country'],
    },
  });
  const buyerIp = request.headers.get('oxygen-buyer-ip') ?? '127.0.0.1';

  const routeSessionManager = {
    getSessionOrigin: () => new URL(request.url).origin,
    getSessionItem: (key: string) => session.get(key),
    setSessionItem: (key: string, value: unknown) => {
      session.set(key, value);
    },
    removeSessionItem: (key: string) => {
      session.unset(key);
    },
    commit: async (): Promise<HeadersInit | void> => {
      if (!session.isPending) return;
      return {'Set-Cookie': await session.commit()};
    },
  };

  const storefrontClient = createStorefrontClient({
    type: 'private',
    requestContext,
    config: {
      storeDomain: env.PUBLIC_STORE_DOMAIN,
      privateStorefrontToken: env.PRIVATE_STOREFRONT_API_TOKEN,
      buyerIp,
    },
  });

  const shopifyRoute = await handleShopifyRoutes({
    request,
    requestContext,
    sessionManager: routeSessionManager,
    storefrontClient,
    handlers: [cartHandlers],
  });
  if (shopifyRoute) return shopifyRoute;

  const {client: customerAccountClient, sessionManager: customerSessionManager} =
    await createCustomerAccountClient({request, requestContext, env});

  context.set(storefrontContext, storefrontClient);
  context.set(sessionContext, session);
  context.set(customerAccountContext, customerAccountClient);

  const commitSession = async (response: Response) => {
    if (session.isPending) {
      response.headers.append('Set-Cookie', await session.commit());
    }
    const customerCookie = await customerSessionManager.commit?.();
    if (customerCookie) {
      new Headers(customerCookie).forEach((value, key) =>
        response.headers.append(key, value),
      );
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
