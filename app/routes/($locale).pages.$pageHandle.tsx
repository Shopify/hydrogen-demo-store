import {type MetaArgs, type LoaderFunctionArgs} from 'react-router';
import {useLoaderData} from 'react-router';
import invariant from 'tiny-invariant';
import {gql} from '@shopify/hydrogen';

import {PageHeader} from '~/components/Text';
import {routeHeaders} from '~/data/cache';
import {seoPayload} from '~/lib/seo.server';
import {generateSeoMeta} from '~/lib/seo';
import {storefrontContext} from '~/storefront.context';

export const headers = routeHeaders;

export async function loader({request, params, context}: LoaderFunctionArgs) {
  invariant(params.pageHandle, 'Missing page handle');

  const client = context.get(storefrontContext);
  const {data} = await client.graphql(PAGE_QUERY, {
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

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return generateSeoMeta(...matches.map((match) => (match.data as any)?.seo));
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

const PAGE_QUERY = gql(`
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
`);
