import {useLoaderData} from 'react-router';
import invariant from 'tiny-invariant';

import type {Route} from './+types/($locale).pages.$pageHandle';

import {PageHeader} from '~/components/Text';
import {routeHeaders} from '~/data/cache';
import {seoPayload} from '~/lib/seo.server';
import {getSeoMeta} from '~/lib/seo-meta';
import {storefrontClientContext} from '~/lib/storefront';

export const headers = routeHeaders;

export async function loader({request, params, context}: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  invariant(params.pageHandle, 'Missing page handle');

  const {data} = await storefrontClient.graphql(PAGE_QUERY, {
    variables: {
      handle: params.pageHandle,
    },
  });

  const page = data?.page;

  if (!page) {
    throw new Response(null, {status: 404});
  }

  const seo = seoPayload.page({page, url: request.url});

  return {page, seo};
}

export const meta: Route.MetaFunction = ({matches}) => {
  return getSeoMeta(...matches.map((match) => (match?.data as any)?.seo));
};

export default function Page() {
  const {page} = useLoaderData<typeof loader>();

  return (
    <>
      <PageHeader heading={page.title}>
        <div
          dangerouslySetInnerHTML={{__html: page.body}}
          className="prose dark:prose-invert"
        />
      </PageHeader>
    </>
  );
}

const PAGE_QUERY = `#graphql
  query PageDetails($language: LanguageCode, $handle: String!)
  @inContext(language: $language) {
    page(handle: $handle) {
      id
      title
      body
      seo {
        description
        title
      }
    }
  }
`;
