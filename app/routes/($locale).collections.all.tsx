import {redirect} from 'react-router';

import type {Route} from './+types/($locale).collections.all';

import {getLocalePrefix} from '~/lib/redirect';

export async function loader({params}: Route.LoaderArgs) {
  return redirect(`${getLocalePrefix(params.locale)}/products`);
}
