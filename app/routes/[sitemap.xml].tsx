import type {Route} from './+types/[sitemap.xml]';

import {getSitemapIndex} from '~/lib/sitemap';
import {storefrontClientContext} from '~/lib/storefront';

export async function loader({request, context}: Route.LoaderArgs) {
  const storefront = context.get(storefrontClientContext);
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
