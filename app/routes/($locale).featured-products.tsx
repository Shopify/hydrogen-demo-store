import invariant from 'tiny-invariant';

import type {Route} from './+types/($locale).featured-products';

import {
  storefrontClientContext,
  type AppStorefrontClient,
} from '~/lib/storefront';
import {
  PRODUCT_CARD_FRAGMENT,
  FEATURED_COLLECTION_FRAGMENT,
} from '~/data/fragments';

export async function loader({context}: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  return await getFeaturedData(storefrontClient);
}

export async function getFeaturedData(
  storefrontClient: AppStorefrontClient,
  variables: {pageBy?: number} = {},
) {
  const {data} = await storefrontClient.graphql(FEATURED_ITEMS_QUERY, {
    variables: {
      pageBy: 12,
      ...variables,
    },
  });

  invariant(data, 'No featured items data returned from Shopify API');

  return data;
}

export type FeaturedData = Awaited<ReturnType<typeof getFeaturedData>>;

export const FEATURED_ITEMS_QUERY = `#graphql
  query FeaturedItems(
    $country: CountryCode
    $language: LanguageCode
    $pageBy: Int = 12
  ) @inContext(country: $country, language: $language) {
    featuredCollections: collections(first: 3, sortKey: UPDATED_AT) {
      nodes {
        ...FeaturedCollectionDetails
      }
    }
    featuredProducts: products(first: $pageBy) {
      nodes {
        ...ProductCard
      }
    }
  }

  ${PRODUCT_CARD_FRAGMENT}
  ${FEATURED_COLLECTION_FRAGMENT}
` as const;
