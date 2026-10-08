import {redirect} from 'react-router';
import {cartQueries, createCartCookie, getCartId} from '@shopify/hydrogen';

import type {Route} from './+types/($locale).discount.$code';

import {getSafeRedirectPath} from '~/lib/redirect';
import {storefrontClientContext} from '~/lib/storefront';

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
export async function loader({request, context, params}: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  const {code} = params;

  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  // Only same-origin paths are allowed, to prevent phishing via external redirects
  const redirectPath = getSafeRedirectPath(
    searchParams.get('redirect') || searchParams.get('return_to'),
    request.url,
  );

  searchParams.delete('redirect');
  searchParams.delete('return_to');

  // Carry the remaining query params over to the redirect target
  const target = new URL(redirectPath, url.origin);
  for (const [key, value] of searchParams) {
    target.searchParams.append(key, value);
  }
  const redirectUrl = `${target.pathname}${target.search}${target.hash}`;

  if (!code) {
    return redirect(redirectUrl);
  }

  const cartId = getCartId(request);

  let updatedCartId: string | undefined;

  if (cartId) {
    const {data} = await storefrontClient.graphql(
      cartQueries.cartDiscountCodesUpdate,
      {
        variables: {cartId, discountCodes: [code]},
      },
    );
    updatedCartId = data?.cartDiscountCodesUpdate?.cart?.id;
  } else {
    const {data} = await storefrontClient.graphql(cartQueries.cartCreate, {
      variables: {input: {discountCodes: [code]}},
    });
    updatedCartId = data?.cartCreate?.cart?.id;
  }

  if (!updatedCartId) {
    return redirect(redirectUrl);
  }

  // Using set-cookie on a 303 redirect will not work if the domain origin have port number (:3000)
  // If there is no cart id and a new cart id is created in the progress, it will not be set in the cookie
  // on localhost:3000
  return redirect(redirectUrl, {
    status: 303,
    headers: {'Set-Cookie': createCartCookie(updatedCartId)},
  });
}
