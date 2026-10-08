import {redirect} from 'react-router';
import {Cache} from '@shopify/hydrogen';
import invariant from 'tiny-invariant';

import type {Route} from './+types/($locale).$shopid.orders.$token.authenticate';

import {storefrontClientContext} from '~/lib/storefront';
import {Button} from '~/components/Button';
import {PageHeader} from '~/components/Text';

/*
 If your online store had active orders before you launched your Hydrogen storefront,
 and the Hydrogen storefront uses the same domain formerly used by the online store,
 then customers will receive 404 pages when they click on the old order status URLs
 that are routing to your Hydrogen storefront. To prevent this, ensure that you redirect
 those requests back to Shopify.
*/
export async function loader({request, context}: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  const {origin} = new URL(request.url);
  const {data} = await storefrontClient.graphql(
    `#graphql
      query getShopPrimaryDomain { shop { primaryDomain { url } } }
    `,
    {cache: Cache.long()},
  );
  invariant(data?.shop, 'Error redirecting to the order status URL');
  return redirect(request.url.replace(origin, data.shop.primaryDomain.url));
}

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
