import {redirect, type LoaderFunctionArgs} from 'react-router';

export async function loader({params}: LoaderFunctionArgs) {
  return redirect(params?.locale ? `${params.locale}/products` : '/products');
}
