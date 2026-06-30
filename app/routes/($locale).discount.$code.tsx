import {redirect, type LoaderFunctionArgs} from 'react-router';
import {cartQueries, createCartCookie, getCartId} from '@shopify/hydrogen';

import {storefrontContext} from '~/storefront.context';

/**
 * Automatically applies a discount found on the url
 * If a cart exists it's updated with the discount, otherwise a cart is created with the discount already applied
 * @param ?redirect an optional path to return to otherwise return to the home page
 * @example
 * Example path applying a discount and redirecting
 * ```ts
 * /discount/FREESHIPPING?redirect=/products
 *
 * ```
 * @preserve
 */
export async function loader({request, context, params}: LoaderFunctionArgs) {
  const client = context.get(storefrontContext);
  const {code} = params;

  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  let redirectParam =
    searchParams.get('redirect') || searchParams.get('return_to') || '/';

  if (redirectParam.includes('//')) {
    redirectParam = '/';
  }

  searchParams.delete('redirect');
  searchParams.delete('return_to');

  const redirectUrl = `${redirectParam}?${searchParams}`;

  if (!code) {
    return redirect(redirectUrl);
  }

  const cartId = getCartId(request);

  let cartResult;
  if (cartId) {
    const {data} = await client.graphql(cartQueries.cartDiscountCodesUpdate, {
      variables: {cartId, discountCodes: [code]},
    });
    cartResult = (data as any)?.cartDiscountCodesUpdate?.cart;
  } else {
    const {data} = await client.graphql(cartQueries.cartCreate, {
      variables: {input: {discountCodes: [code]}},
    });
    cartResult = (data as any)?.cartCreate?.cart;
  }

  const headers = new Headers();
  if (cartResult?.id) {
    headers.append('Set-Cookie', createCartCookie(cartResult.id));
  }

  return redirect(redirectUrl, {
    status: 303,
    headers,
  });
}
