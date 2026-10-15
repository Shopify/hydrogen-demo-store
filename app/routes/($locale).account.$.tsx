import {redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';

import {getLocalePrefix} from '~/lib/redirect';

// fallback wild card for all unauthenticated routes in account section
export async function loader({context, params}: LoaderFunctionArgs) {
  await context.customerAccount.handleAuthStatus();

  return redirect(`${getLocalePrefix(params.locale)}/account`);
}
