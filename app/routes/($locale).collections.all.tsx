import {redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';

import {getLocalePrefix} from '~/lib/redirect';

export async function loader({params}: LoaderFunctionArgs) {
  return redirect(`${getLocalePrefix(params.locale)}/products`);
}
