import {Await, Form, useLoaderData} from 'react-router';
import {Suspense, useEffect, useRef} from 'react';
import invariant from 'tiny-invariant';

import type {Route} from './+types/($locale).search';
import {
  getFeaturedData,
  type FeaturedData,
} from './($locale).featured-products';

import {Heading, PageHeader, Section, Text} from '~/components/Text';
import {Input} from '~/components/Input';
import {Grid} from '~/components/Grid';
import {ProductCard} from '~/components/ProductCard';
import {ProductSwimlane} from '~/components/ProductSwimlane';
import {FeaturedCollections} from '~/components/FeaturedCollections';
import {PRODUCT_CARD_FRAGMENT} from '~/data/fragments';
import {getImageLoadingPriority, PAGINATION_SIZE} from '~/lib/const';
import {seoPayload} from '~/lib/seo.server';
import {getSeoMeta} from '~/lib/seo-meta';
import {Pagination, getPaginationVariables} from '~/lib/pagination';
import {
  storefrontClientContext,
  type AppStorefrontClient,
} from '~/lib/storefront';
import {AnalyticsEvent, getAnalytics} from '~/lib/analytics';

export async function loader({request, context}: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  const searchParams = new URL(request.url).searchParams;
  const searchTerm = searchParams.get('q')!;
  const variables = getPaginationVariables(request, {pageBy: 8});

  const {data} = await storefrontClient.graphql(SEARCH_QUERY, {
    variables: {
      searchTerm,
      ...variables,
    },
  });

  const products = data?.products;
  invariant(products, 'No search data returned from Shopify API');

  const shouldGetRecommendations = !searchTerm || products?.nodes?.length === 0;

  const seo = seoPayload.collection({
    url: request.url,
    collection: {
      id: 'search',
      title: 'Search',
      handle: 'search',
      descriptionHtml: 'Search results',
      description: 'Search results',
      seo: {
        title: 'Search',
        description: `Showing ${products.nodes.length} search results for "${searchTerm}"`,
      },
      metafields: [],
      products,
      updatedAt: new Date().toISOString(),
    },
  });

  return {
    seo,
    searchTerm,
    products,
    noResultRecommendations: shouldGetRecommendations
      ? getNoResultRecommendations(storefrontClient)
      : Promise.resolve(null),
  };
}

export const meta: Route.MetaFunction = ({matches}) => {
  return getSeoMeta(...matches.map((match) => (match?.data as any)?.seo));
};

export default function Search() {
  const {searchTerm, products, noResultRecommendations} =
    useLoaderData<typeof loader>();
  const noResults = products?.nodes?.length === 0;

  return (
    <>
      <PageHeader>
        <Heading as="h1" size="copy">
          Search
        </Heading>
        <Form method="get" className="relative flex w-full text-heading">
          <Input
            defaultValue={searchTerm}
            name="q"
            placeholder="Search…"
            type="search"
            variant="search"
          />
          <button className="absolute right-0 py-2" type="submit">
            Go
          </button>
        </Form>
      </PageHeader>
      {!searchTerm || noResults ? (
        <NoResults
          noResults={noResults}
          recommendations={noResultRecommendations}
        />
      ) : (
        <Section>
          <Pagination connection={products}>
            {({nodes, isLoading, NextLink, PreviousLink}) => {
              const itemsMarkup = nodes.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  loading={getImageLoadingPriority(i)}
                />
              ));

              return (
                <>
                  <div className="flex items-center justify-center mt-6">
                    <PreviousLink className="inline-block rounded font-medium text-center py-3 px-6 border border-primary/10 bg-contrast text-primary w-full">
                      {isLoading ? 'Loading...' : 'Previous'}
                    </PreviousLink>
                  </div>
                  <Grid data-test="product-grid">{itemsMarkup}</Grid>
                  <div className="flex items-center justify-center mt-6">
                    <NextLink className="inline-block rounded font-medium text-center py-3 px-6 border border-primary/10 bg-contrast text-primary w-full">
                      {isLoading ? 'Loading...' : 'Next'}
                    </NextLink>
                  </div>
                </>
              );
            }}
          </Pagination>
        </Section>
      )}
      <SearchViewTracker searchTerm={searchTerm} searchResults={products} />
    </>
  );
}

function SearchViewTracker({
  searchTerm,
  searchResults,
}: {
  searchTerm: string;
  searchResults: unknown;
}) {
  const lastPublishedTerm = useRef<string | null>(null);

  useEffect(() => {
    if (lastPublishedTerm.current === searchTerm) return;
    lastPublishedTerm.current = searchTerm;
    getAnalytics()?.publish(AnalyticsEvent.SEARCH_VIEWED, {
      searchTerm,
      searchResults,
      url: window.location.href,
    });
  }, [searchTerm, searchResults]);

  return null;
}

function NoResults({
  noResults,
  recommendations,
}: {
  noResults: boolean;
  recommendations: Promise<null | FeaturedData>;
}) {
  return (
    <>
      {noResults && (
        <Section padding="x">
          <Text className="opacity-50">
            No results, try a different search.
          </Text>
        </Section>
      )}
      <Suspense>
        <Await
          errorElement="There was a problem loading related products"
          resolve={recommendations}
        >
          {(result) => {
            if (!result) return null;
            const {featuredCollections, featuredProducts} = result;

            return (
              <>
                <FeaturedCollections
                  title="Trending Collections"
                  collections={featuredCollections}
                />
                <ProductSwimlane
                  title="Trending Products"
                  products={featuredProducts}
                />
              </>
            );
          }}
        </Await>
      </Suspense>
    </>
  );
}

export function getNoResultRecommendations(
  storefrontClient: AppStorefrontClient,
) {
  return getFeaturedData(storefrontClient, {pageBy: PAGINATION_SIZE});
}

const SEARCH_QUERY = `#graphql
  query PaginatedProductsSearch(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $searchTerm: String
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor,
      sortKey: RELEVANCE,
      query: $searchTerm
    ) {
      nodes {
        ...ProductCard
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }

  ${PRODUCT_CARD_FRAGMENT}
` as const;
