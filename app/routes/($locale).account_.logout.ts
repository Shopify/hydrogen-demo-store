import {
  redirect,
  type ActionFunction,
  type AppLoadContext,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from 'react-router';

export async function doLogout(context: AppLoadContext) {
  return context.customerAccount.logout();
}

export async function loader({params}: LoaderFunctionArgs) {
  const locale = params.locale;
  return redirect(locale ? `/${locale}` : '/');
}

export const action: ActionFunction = async ({context}: ActionFunctionArgs) => {
  return doLogout(context);
};
