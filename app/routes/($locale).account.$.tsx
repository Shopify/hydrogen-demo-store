import {redirect, type LoaderFunctionArgs} from 'react-router';

import {customerAccountContext} from '~/storefront.context';

// fallback wild card for all unauthenticated routes in account section
export async function loader({context, params}: LoaderFunctionArgs) {
  await context.get(customerAccountContext).handleAuthStatus();

  const locale = params.locale;
  return redirect(locale ? `/${locale}/account` : '/account');
}
