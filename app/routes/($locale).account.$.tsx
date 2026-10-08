import {redirect} from 'react-router';

import type {Route} from './+types/($locale).account.$';

import {getLocalePrefix} from '~/lib/redirect';

// fallback wild card for all unauthenticated routes in account section
export async function loader({params}: Route.LoaderArgs) {
  return redirect(`${getLocalePrefix(params.locale)}/account`);
}
