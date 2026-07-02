import type {LoaderFunctionArgs} from 'react-router';

import {getSitemapIndex} from 'app/lib/sitemap';
import {storefrontContext} from '~/storefront.context';

export async function loader({request, context}: LoaderFunctionArgs) {
  const storefront = context.get(storefrontContext);
  const url = new URL(request.url);
  const baseUrl = url.origin;

  const response = await getSitemapIndex({
    storefront,
    request,
    types: ['products', 'pages', 'collections', 'articles'],
    customUrls: [`${baseUrl}/sitemap-empty.xml`],
  });

  response.headers.set('Oxygen-Cache-Control', `max-age=${60 * 60 * 24}`);
  response.headers.set('Vary', 'Accept-Encoding, Accept-Language');

  return response;
}
