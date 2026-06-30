import {
  redirect,
  type ActionFunction,
  type RouterContextProvider,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from 'react-router';

import {customerAccountContext} from '~/storefront.context';

export async function doLogout(context: Readonly<RouterContextProvider>) {
  return context.get(customerAccountContext).logout();
}

export async function loader({params}: LoaderFunctionArgs) {
  const locale = params.locale;
  return redirect(locale ? `/${locale}` : '/');
}

export const action: ActionFunction = async ({context}: ActionFunctionArgs) => {
  return doLogout(context);
};
