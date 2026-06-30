import {type MetaArgs, type LoaderFunctionArgs} from 'react-router';
import {useLoaderData} from 'react-router';
import {gql} from '@shopify/hydrogen';

import {Image} from '~/components/Image';
import {Pagination} from '~/components/Pagination';
import {getPaginationVariables} from '~/lib/pagination';
import {Grid} from '~/components/Grid';
import {Heading, PageHeader, Section} from '~/components/Text';
import {Link} from '~/components/Link';
import {Button} from '~/components/Button';
import {getImageLoadingPriority} from '~/lib/const';
import {seoPayload} from '~/lib/seo.server';
import {generateSeoMeta} from '~/lib/seo';
import {routeHeaders} from '~/data/cache';
import {storefrontContext} from '~/storefront.context';
import type {ResultOf} from '~/lib/graphql-types';

const PAGINATION_SIZE = 4;

type CollectionNode = NonNullable<
  ResultOf<typeof COLLECTIONS_QUERY>['collections']
>['nodes'][number];

export const headers = routeHeaders;

export const loader = async ({request, context}: LoaderFunctionArgs) => {
  const client = context.get(storefrontContext);
  const variables = getPaginationVariables(request, {pageBy: PAGINATION_SIZE});
  const {data} = await client.graphql(COLLECTIONS_QUERY, {variables});
  const collections = data?.collections;

  const seo = seoPayload.listCollections({
    collections: collections ?? {nodes: []},
    url: request.url,
  });

  return {collections, seo};
};

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return generateSeoMeta(...matches.map((match) => (match.data as any)?.seo));
};

export default function Collections() {
  const {collections} = useLoaderData<typeof loader>();

  if (!collections) return null;

  return (
    <>
      <PageHeader heading="Collections" />
      <Section>
        <Pagination connection={collections}>
          {({nodes, isLoading, PreviousLink, NextLink}) => (
            <>
              <div className="flex items-center justify-center mb-6">
                <Button as={PreviousLink} variant="secondary" width="full">
                  {isLoading ? 'Loading...' : 'Previous collections'}
                </Button>
              </div>
              <Grid
                items={nodes.length === 3 ? 3 : 2}
                data-test="collection-grid"
              >
                {nodes.map((collection, i) => (
                  <CollectionCard
                    collection={collection}
                    key={collection.id}
                    loading={getImageLoadingPriority(i, 2)}
                  />
                ))}
              </Grid>
              <div className="flex items-center justify-center mt-6">
                <Button as={NextLink} variant="secondary" width="full">
                  {isLoading ? 'Loading...' : 'Next collections'}
                </Button>
              </div>
            </>
          )}
        </Pagination>
      </Section>
    </>
  );
}

function CollectionCard({
  collection,
  loading,
}: {
  collection: CollectionNode;
  loading?: HTMLImageElement['loading'];
}) {
  return (
    <Link
      prefetch="viewport"
      to={`/collections/${collection.handle}`}
      className="grid gap-4"
    >
      <div className="card-image bg-primary/5 aspect-[3/2]">
        {collection?.image && (
          <Image
            data={collection.image}
            aspectRatio="6/4"
            sizes="(max-width: 32em) 100vw, 45vw"
            loading={loading}
          />
        )}
      </div>
      <Heading as="h3" size="copy">
        {collection.title}
      </Heading>
    </Link>
  );
}

const COLLECTIONS_QUERY = gql(`
  query Collections(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes {
        id
        title
        description
        handle
        seo {
          description
          title
        }
        image {
          id
          url
          width
          height
          altText
        }
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
`);
