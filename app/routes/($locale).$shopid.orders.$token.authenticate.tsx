import {redirect, type LoaderFunctionArgs} from 'react-router';
import {gql} from '@shopify/hydrogen';
import invariant from 'tiny-invariant';

import {Button} from '~/components/Button';
import {PageHeader} from '~/components/Text';
import {storefrontContext} from '~/storefront.context';

/*
 If your online store had active orders before you launched your Hydrogen storefront,
 and the Hydrogen storefront uses the same domain formerly used by the online store,
 then customers will receive 404 pages when they click on the old order status URLs
 that are routing to your Hydrogen storefront. To prevent this, ensure that you redirect
 those requests back to Shopify.
*/
export async function loader({request, context}: LoaderFunctionArgs) {
  const client = context.get(storefrontContext);
  const {origin} = new URL(request.url);
  const {data} = await client.graphql(SHOP_PRIMARY_DOMAIN_QUERY);
  const shop = data?.shop;
  invariant(shop, 'Error redirecting to the order status URL');
  return redirect(request.url.replace(origin, shop.primaryDomain.url));
}

const SHOP_PRIMARY_DOMAIN_QUERY = gql(`#graphql
  query getShopPrimaryDomain { shop { primaryDomain { url } } }
`);

export default function () {
  return null;
}
export function ErrorBoundary() {
  return (
    <PageHeader
      heading={'Error redirecting to the order status URL'}
      className="text-red-600"
    >
      <div className="flex items-baseline justify-between w-full">
        <Button as="button" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    </PageHeader>
  );
}
