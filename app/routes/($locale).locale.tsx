import {redirect} from 'react-router';
import {getCartId} from '@shopify/hydrogen';
import type {CountryCode} from '@shopify/hydrogen/storefront-api-types';

import type {Route} from './+types/($locale).locale';

import {getSafeRedirectPath} from '~/lib/redirect';
import {storefrontClientContext} from '~/lib/storefront';

export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const countryCode = formData.get('country');
  const redirectTo = formData.get('redirectTo');

  const path = getSafeRedirectPath(redirectTo, request.url);

  const cartId = getCartId(request);

  if (cartId && typeof countryCode === 'string') {
    const storefrontClient = context.get(storefrontClientContext);
    await storefrontClient.graphql(CART_BUYER_IDENTITY_UPDATE_MUTATION, {
      variables: {
        cartId,
        buyerIdentity: {countryCode: countryCode as CountryCode},
      },
    });
  }

  return redirect(path);
}

const CART_BUYER_IDENTITY_UPDATE_MUTATION = `#graphql
  mutation CartBuyerIdentityUpdate(
    $cartId: ID!
    $buyerIdentity: CartBuyerIdentityInput!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      cart {
        id
      }
      userErrors {
        message
      }
    }
  }
`;
