import {
  defer,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {Suspense} from 'react';
import {Await, useLoaderData} from '@remix-run/react';
import {getSeoMeta} from '@shopify/hydrogen';

import {Hero} from '~/components/Hero';
import {FeaturedCollections} from '~/components/FeaturedCollections';
import {ProductSwimlane} from '~/components/ProductSwimlane';
import {MEDIA_FRAGMENT, PRODUCT_CARD_FRAGMENT} from '~/data/fragments';
import {getHeroPlaceholder} from '~/lib/placeholders';
import {seoPayload} from '~/lib/seo.server';
import {routeHeaders} from '~/data/cache';

export const headers = routeHeaders;

export async function loader(args: LoaderFunctionArgs) {
  const {params, context} = args;
  const {language, country} = context.storefront.i18n;

  if (
    params.locale &&
    params.locale.toLowerCase() !== `${language}-${country}`.toLowerCase()
  ) {
    // If the locale URL param is defined, yet we still are on `EN-US`
    // the the locale param must be invalid, send to the 404 page
    throw new Response(null, {status: 404});
  }

  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return defer({...deferredData, ...criticalData});
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request}: LoaderFunctionArgs) {
  const [{shop, hero}] = await Promise.all([
    context.storefront.query(HOMEPAGE_SEO_QUERY, {
      variables: {handle: 'freestyle'},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {
    shop,
    primaryHero: hero,
    seo: seoPayload.home({url: request.url}),
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs) {
  const {language, country} = context.storefront.i18n;

  const featuredProducts = context.storefront
    .query(HOMEPAGE_FEATURED_PRODUCTS_QUERY, {
      variables: {
        /**
         * Country and language properties are automatically injected
         * into all queries. Passing them is unnecessary unless you
         * want to override them from the following default:
         */
        country,
        language,
      },
    })
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      // eslint-disable-next-line no-console
      console.error(error);
      return null;
    });

  const secondaryHero = context.storefront
    .query(COLLECTION_HERO_QUERY, {
      variables: {
        handle: 'backcountry',
        country,
        language,
      },
    })
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      // eslint-disable-next-line no-console
      console.error(error);
      return null;
    });

  const featuredCollections = context.storefront
    .query(FEATURED_COLLECTIONS_QUERY, {
      variables: {
        country,
        language,
      },
    })
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      // eslint-disable-next-line no-console
      console.error(error);
      return null;
    });

  const tertiaryHero = context.storefront
    .query(COLLECTION_HERO_QUERY, {
      variables: {
        handle: 'winter-2022',
        country,
        language,
      },
    })
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      // eslint-disable-next-line no-console
      console.error(error);
      return null;
    });

  return {
    featuredProducts,
    secondaryHero,
    featuredCollections,
    tertiaryHero,
  };
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Homepage() {
  const {
    primaryHero,
    secondaryHero,
    tertiaryHero,
    featuredCollections,
    featuredProducts,
  } = useLoaderData<typeof loader>();

  // TODO: skeletons vs placeholders
  const skeletons = getHeroPlaceholder([{}, {}, {}]);

  return (
    <>
      {primaryHero && (
        <Hero {...primaryHero} height="full" top loading="eager" />
      )}

      {featuredProducts && (
        <Suspense>
          <Await resolve={featuredProducts}>
            {(response) => {
              if (
                !response ||
                !response?.products ||
                !response?.products?.nodes
              ) {
                return <></>;
              }
              return (
                <ProductSwimlane
                  products={response.products}
                  title="Featured Products"
                  count={4}
                />
              );
            }}
          </Await>
        </Suspense>
      )}

      {secondaryHero && (
        <Suspense fallback={<Hero {...skeletons[1]} />}>
          <Await resolve={secondaryHero}>
            {(response) => {
              if (!response || !response?.hero) {
                return <></>;
              }
              return <Hero {...response.hero} />;
            }}
          </Await>
        </Suspense>
      )}

      {featuredCollections && (
        <Suspense>
          <Await resolve={featuredCollections}>
            {(response) => {
              if (
                !response ||
                !response?.collections ||
                !response?.collections?.nodes
              ) {
                return <></>;
              }
              return (
                <FeaturedCollections
                  collections={response.collections}
                  title="Collections"
                />
              );
            }}
          </Await>
        </Suspense>
      )}

      {tertiaryHero && (
        <Suspense fallback={<Hero {...skeletons[2]} />}>
          <Await resolve={tertiaryHero}>
            {(response) => {
              if (!response || !response?.hero) {
                return <></>;
              }
              return <Hero {...response.hero} />;
            }}
          </Await>
        </Suspense>
      )}
    </>
  );
}

const COLLECTION_CONTENT_FRAGMENT = `#graphql
  fragment CollectionContent on Collection {
    id
    handle
    title
    descriptionHtml
    heading: metafield(namespace: "hero", key: "title") {
      value
    }
    byline: metafield(namespace: "hero", key: "byline") {
      value
    }
    cta: metafield(namespace: "hero", key: "cta") {
      value
    }
    spread: metafield(namespace: "hero", key: "spread") {
      reference {
        ...Media
      }
    }
    spreadSecondary: metafield(namespace: "hero", key: "spread_secondary") {
      reference {
        ...Media
      }
    }
  }
  ${MEDIA_FRAGMENT}
` as const;

const HOMEPAGE_SEO_QUERY = `#graphql
  query seoCollectionContent($handle: String, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    hero: collection(handle: $handle) {
      ...CollectionContent
    }
    shop {
      name
      description
    }
  }
  ${COLLECTION_CONTENT_FRAGMENT}
` as const;

const COLLECTION_HERO_QUERY = `#graphql
  query heroCollectionContent($handle: String, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    hero: collection(handle: $handle) {
      ...CollectionContent
    }
  }
  ${COLLECTION_CONTENT_FRAGMENT}
` as const;

// @see: https://shopify.dev/api/storefront/current/queries/products
export const HOMEPAGE_FEATURED_PRODUCTS_QUERY = `#graphql
  query homepageFeaturedProducts($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: 8) {
      nodes {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;

// @see: https://shopify.dev/api/storefront/current/queries/collections
export const FEATURED_COLLECTIONS_QUERY = `#graphql
  query homepageFeaturedCollections($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(
      first: 4,
      sortKey: UPDATED_AT
    ) {
      nodes {
        id
        title
        handle
        image {
          altText
          width
          height
          url
        }
      }
    }
  }
` as const;
