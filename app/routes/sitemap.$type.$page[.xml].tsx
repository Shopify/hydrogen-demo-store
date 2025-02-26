import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';

import {getSitemap} from 'app/lib/sitemap';
import {countries} from '~/data/countries';

const locales = Object.keys(countries).filter((k) => k !== 'default');
locales.unshift('en-us');

export async function loader({
  request,
  params,
  context: {storefront},
}: LoaderFunctionArgs) {
  const response = await getSitemap({
    storefront,
    request,
    params,
    locales,
    getLink: ({type, baseUrl, handle, locale}) => {
      // Make sure the generated sitemap urls are reflective of the routes
      const typeUrl = type === 'articles' ? 'journal' : type;

      if (!locale) return `${baseUrl}/${typeUrl}/${handle}`;
      return `${baseUrl}${locale}/${typeUrl}/${handle}`;
    },
  });

  response.headers.set('Oxygen-Cache-Control', `max-age=${60 * 60 * 24}`);
  response.headers.set('Vary', 'Accept-Encoding, Accept-Language');

  return response;
}
