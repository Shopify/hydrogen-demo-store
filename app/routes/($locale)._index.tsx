import type {LoaderFunctionArgs, MetaArgs} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import type {SeoConfig} from '@shopify/hydrogen';
import {getSeoMeta} from '@shopify/hydrogen';
import {
  Content,
  fetchOneEntry,
  getBuilderSearchParams,
  isPreviewing,
} from '@builder.io/sdk-react';
import {fetch as webFetch} from '@remix-run/web-fetch';

import {routeHeaders} from '~/data/cache';
import {builderPageSeo} from '~/lib/builderPageSeo';

export const headers = routeHeaders;

export const meta = ({data}: MetaArgs<typeof loader>) => {
  const seoMeta = data?.seo ? getSeoMeta(data.seo as SeoConfig) : []; // Fallback to empty array

  return seoMeta || []; // Ensure we return an array
};

export async function loader(args: LoaderFunctionArgs) {
  const {request, context} = args;
  const {BUILDER_PUBLIC_API_KEY} = context.env;

  const url = new URL(request.url);
  const urlPath = '/pages/home';

  try {
    const page = await fetchOneEntry({
      model: 'page',
      apiKey: BUILDER_PUBLIC_API_KEY,
      options: getBuilderSearchParams(url.searchParams),
      userAttributes: {urlPath},
      fetch: webFetch,
    });

    if (!page && !isPreviewing(url.search)) {
      throw new Response('Page Not Found', {
        status: 404,
        statusText: 'Page not found in Builder.io',
      });
    }

    const seo = builderPageSeo({page}, request.url);
    return {apiKey: BUILDER_PUBLIC_API_KEY, page, seo};
  } catch (error) {
    console.error('Error fetching content from Builder.io:', error);
    throw new Response('Internal Server Error', {status: 500});
  }
}

// Define and render the page.
export default function Homepage() {
  // Use the useLoaderData hook to get the Page data from `loader` above.
  const {apiKey, page} = useLoaderData<typeof loader>();

  // Render the page content from Builder.io
  return <Content model="page" apiKey={apiKey} content={page as any} />;
}
