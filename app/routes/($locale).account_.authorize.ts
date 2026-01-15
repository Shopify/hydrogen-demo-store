import type {LoaderFunctionArgs} from 'react-router';

export async function loader({context, params}: LoaderFunctionArgs) {
  return context.customerAccount.authorize();
}
