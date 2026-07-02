import type {LoaderFunctionArgs} from 'react-router';

import {customerAccountContext} from '~/storefront.context';

export async function loader({context, params}: LoaderFunctionArgs) {
  return context.get(customerAccountContext).authorize();
}
