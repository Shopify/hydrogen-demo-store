import {
  redirect,
  type ActionFunction,
  type AppLoadContext,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from '@shopify/remix-oxygen';

import {getLocalePrefix} from '~/lib/redirect';

export async function doLogout(context: AppLoadContext) {
  return context.customerAccount.logout();
}

export async function loader({params}: LoaderFunctionArgs) {
  return redirect(getLocalePrefix(params.locale) || '/');
}

export const action: ActionFunction = async ({context}: ActionFunctionArgs) => {
  return doLogout(context);
};
