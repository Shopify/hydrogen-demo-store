import {useEffect} from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useRouteLoaderData,
  useRouteError,
  type LinksFunction,
  type ShouldRevalidateFunction,
} from 'react-router';
import {handleShopifyRedirects, handleShopifyRoutes} from '@shopify/hydrogen';
import {ShopifyScripts, useCartAnalytics} from '@shopify/hydrogen/react';
import invariant from 'tiny-invariant';

import type {Route} from './+types/root';
import {DEFAULT_LOCALE, getLocaleFromRequest, parseMenu} from './lib/utils';

import {PageLayout} from '~/components/PageLayout';
import {GenericError} from '~/components/GenericError';
import {NotFound} from '~/components/NotFound';
import favicon from '~/assets/favicon.svg';
import {seoPayload} from '~/lib/seo.server';
import {getSeoMeta, type SeoConfig} from '~/lib/seo-meta';
import {useNonce} from '~/lib/nonce';
import {AnalyticsEvent, getAnalytics} from '~/lib/analytics';
import {CartProvider} from '~/lib/cart';
import {getCartHandlers} from '~/lib/cart-handlers';
import {getCustomerSession} from '~/lib/customer-session';
import {getCustomerAccountHandlers} from '~/lib/customer-account-handlers';
import {routeTemplates} from '~/lib/route-templates';
import {
  cacheContext,
  createRequestStorefrontClient,
  envContext,
  storefrontClientContext,
  storefrontRequestContext,
  waitUntilContext,
  type AppStorefrontClient,
} from '~/lib/storefront';
import {
  createRequestSessionManager,
  sessionManagerContext,
} from '~/lib/session.server';
import styles from '~/styles/app.css?url';

export type RootLoader = typeof loader;

export const middleware: Route.MiddlewareFunction[] = [
  async ({request, context}, next) => {
    const env = context.get(envContext);
    const storefrontClient = createRequestStorefrontClient(
      request,
      env,
      context.get(cacheContext),
      context.get(waitUntilContext),
    );
    const {requestContext} = storefrontClient;
    const sessionManager = await createRequestSessionManager(request, env);

    const shopifyRoute = handleShopifyRoutes({
      request,
      requestContext,
      sessionManager,
      storefrontClient,
      routeTemplates,
      handlers: [getCartHandlers(env), getCustomerAccountHandlers(env)],
    });
    if (shopifyRoute) return shopifyRoute;

    context.set(storefrontClientContext, storefrontClient);
    context.set(storefrontRequestContext, requestContext);
    context.set(sessionManagerContext, sessionManager);

    const response = await next();

    if (response.status === 404) {
      const redirect = await handleShopifyRedirects({
        request,
        storefrontClient,
        routeTemplates,
      });
      if (redirect) return redirect;
    }

    const sessionHeaders = await sessionManager.commit();
    if (sessionHeaders) {
      for (const [key, value] of new Headers(sessionHeaders)) {
        response.headers.append(key, value);
      }
    }
    requestContext.applyResponseHeaders(response.headers);

    return response;
  },
];

// This is important to avoid re-fetching root queries on sub-navigations
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') {
    return true;
  }

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) {
    return true;
  }

  return false;
};

/**
 * The link to the main stylesheet is purposely not in this list. Instead, it is added
 * in the Layout function.
 *
 * This is to avoid a development bug where after an edit/save, navigating to another
 * link will cause page rendering error "failed to execute 'insertBefore' on 'Node'".
 *
 * This is a workaround until this is fixed in the foundational library.
 */
export const links: LinksFunction = () => {
  return [
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {
    ...deferredData,
    ...criticalData,
  };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({request, context}: Route.LoaderArgs) {
  const env = context.get(envContext);
  const storefront = context.get(storefrontClientContext);

  const layout = await getLayoutData(storefront, env);

  const seo = seoPayload.root({shop: layout.shop, url: request.url});

  return {
    layout,
    seo,
    shop: {
      shopId: env.SHOP_ID,
      storefrontId: env.PUBLIC_STOREFRONT_ID ?? '0',
      myshopifyDomain: env.PUBLIC_STORE_DOMAIN,
    },
    selectedLocale: getLocaleFromRequest(request),
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({request, context}: Route.LoaderArgs) {
  const env = context.get(envContext);
  const storefrontClient = context.get(storefrontClientContext);
  const requestContext = context.get(storefrontRequestContext);
  const sessionManager = context.get(sessionManagerContext);

  return {
    isLoggedIn: getCustomerSession(env).isLoggedIn(
      sessionManager,
      requestContext,
    ),
    cart: getCartHandlers(env)
      .get({storefrontClient, request, sessionManager, requestContext})
      .then((result) => result.data),
  };
}

export const meta = ({data}: Route.MetaArgs) => {
  return getSeoMeta(data!.seo as SeoConfig);
};

function AnalyticsTracker() {
  const location = useLocation();

  useCartAnalytics();

  useEffect(() => {
    getAnalytics()?.publish(AnalyticsEvent.PAGE_VIEWED, {
      url: window.location.href,
    });
  }, [location.pathname, location.search]);

  return null;
}

function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();
  const data = useRouteLoaderData<RootLoader>('root');
  const locale = data?.selectedLocale ?? DEFAULT_LOCALE;

  return (
    <html lang={locale.language}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="msvalidate.01" content="A352E6A0AF9A652267361BBB572B8468" />
        <link rel="stylesheet" href={styles}></link>
        <Meta />
        <Links />
        {data ? (
          <ShopifyScripts
            shop={data.shop}
            i18n={{
              country: locale.country,
              language: locale.language,
              pathPrefix: locale.pathPrefix,
              currency: locale.currency,
            }}
            consent={{mode: 'default-banner'}}
            routes={routeTemplates}
            nonce={nonce}
          />
        ) : null}
      </head>
      <body>
        {data ? (
          <CartProvider initialData={data.cart}>
            <AnalyticsTracker />
            <PageLayout
              key={`${locale.language}-${locale.country}`}
              layout={data.layout}
            >
              {children}
            </PageLayout>
          </CartProvider>
        ) : (
          children
        )}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export function ErrorBoundary({error}: Route.ErrorBoundaryProps) {
  const routeError = useRouteError();
  const isRouteError = isRouteErrorResponse(routeError);

  let pageType = 'page';

  if (isRouteError && routeError.status === 404) {
    pageType = routeError.data || pageType;
  }

  return (
    <Layout>
      {isRouteError ? (
        <>
          {routeError.status === 404 ? (
            <NotFound type={pageType} />
          ) : (
            <GenericError
              error={{message: `${routeError.status} ${routeError.data}`}}
            />
          )}
        </>
      ) : (
        <GenericError error={error instanceof Error ? error : undefined} />
      )}
    </Layout>
  );
}

const LAYOUT_QUERY = `#graphql
  query layout(
    $language: LanguageCode
    $headerMenuHandle: String!
    $footerMenuHandle: String!
  ) @inContext(language: $language) {
    shop {
      ...Shop
    }
    headerMenu: menu(handle: $headerMenuHandle) {
      ...Menu
    }
    footerMenu: menu(handle: $footerMenuHandle) {
      ...Menu
    }
  }
  fragment Shop on Shop {
    id
    name
    description
    primaryDomain {
      url
    }
    brand {
      logo {
        image {
          url
        }
      }
    }
  }
  fragment MenuItem on MenuItem {
    id
    resourceId
    tags
    title
    type
    url
  }
  fragment ChildMenuItem on MenuItem {
    ...MenuItem
  }
  fragment ParentMenuItem on MenuItem {
    ...MenuItem
    items {
      ...ChildMenuItem
    }
  }
  fragment Menu on Menu {
    id
    items {
      ...ParentMenuItem
    }
  }
` as const;

async function getLayoutData(storefront: AppStorefrontClient, env: Env) {
  const {data} = await storefront.graphql(LAYOUT_QUERY, {
    variables: {
      headerMenuHandle: 'main-menu',
      footerMenuHandle: 'footer',
    },
  });

  invariant(data, 'No data returned from Shopify API');

  /*
    Modify specific links/routes (optional)
    @see: https://shopify.dev/api/storefront/unstable/enums/MenuItemType
    e.g here we map:
      - /blogs/news -> /news
      - /blog/news/blog-post -> /news/blog-post
      - /collections/all -> /products
  */
  const customPrefixes = {BLOG: '', CATALOG: 'products'};

  const headerMenu = data?.headerMenu
    ? parseMenu(
        data.headerMenu,
        data.shop.primaryDomain.url,
        env,
        customPrefixes,
      )
    : undefined;

  const footerMenu = data?.footerMenu
    ? parseMenu(
        data.footerMenu,
        data.shop.primaryDomain.url,
        env,
        customPrefixes,
      )
    : undefined;

  return {shop: data.shop, headerMenu, footerMenu};
}
