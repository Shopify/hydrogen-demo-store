import {useRouteLoaderData} from '@remix-run/react';

import {DEFAULT_LOCALE} from '~/lib/utils';
import type {RootLoader} from '~/root';

export function useCartPath() {
  const data = useRouteLoaderData<RootLoader>('root');
  const locale = data?.selectedLocale ?? DEFAULT_LOCALE;

  return `/${locale.language}-${locale.country}/cart`;
}
