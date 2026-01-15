import type {LoaderFunctionArgs} from 'react-router';

export async function loader({params, request, context}: LoaderFunctionArgs) {
  return context.customerAccount.login();
}
