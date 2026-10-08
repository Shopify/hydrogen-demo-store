import {data} from 'react-router';

import {CACHE_LONG} from '~/data/cache';
import {countries} from '~/data/countries';

export async function loader() {
  return data(
    {
      ...countries,
    },
    {
      headers: {
        'cache-control': CACHE_LONG,
      },
    },
  );
}

// no-op
export default function CountriesApiRoute() {
  return null;
}
