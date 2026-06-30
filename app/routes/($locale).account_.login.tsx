import type {LoaderFunctionArgs} from 'react-router';

import {customerAccountContext} from '~/storefront.context';

export async function loader({params, request, context}: LoaderFunctionArgs) {
  return context.get(customerAccountContext).login();
}
