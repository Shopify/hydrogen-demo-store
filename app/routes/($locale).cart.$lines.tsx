import {redirect, type LoaderFunctionArgs} from 'react-router';
import {cartQueries, createCartCookie} from '@shopify/hydrogen';

import {storefrontContext} from '~/storefront.context';

/**
 * Automatically creates a new cart based on the URL and redirects straight to checkout.
 * Expected URL structure:
 * ```ts
 * /cart/<variant_id>:<quantity>
 *
 * ```
 * More than one `<variant_id>:<quantity>` separated by a comma, can be supplied in the URL, for
 * carts with more than one product variant.
 *
 * @param `?discount` an optional discount code to apply to the cart
 * @example
 * Example path creating a cart with two product variants, different quantities, and a discount code:
 * ```ts
 * /cart/41007289663544:1,41007289696312:2?discount=HYDROBOARD
 *
 * ```
 * @preserve
 */
export async function loader({request, context, params}: LoaderFunctionArgs) {
  const client = context.get(storefrontContext);
  const {lines} = params;
  const linesMap = (lines?.split(',') ?? []).map((line) => {
    const lineDetails = line.split(':');
    const variantId = lineDetails[0];
    const quantity = parseInt(lineDetails[1], 10);

    return {
      merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
      quantity,
    };
  });

  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);

  const discount = searchParams.get('discount');
  const discountArray = discount ? [discount] : [];

  const {data} = await client.graphql(cartQueries.cartCreate, {
    variables: {
      input: {
        lines: linesMap,
        discountCodes: discountArray,
      },
    },
  });

  const cartResult = (data as any)?.cartCreate?.cart;
  const userErrors = (data as any)?.cartCreate?.userErrors;

  if (userErrors?.length || !cartResult) {
    throw new Response('Link may be expired. Try checking the URL.', {
      status: 410,
    });
  }

  const headers = new Headers();
  headers.append('Set-Cookie', createCartCookie(cartResult.id));

  if (cartResult.checkoutUrl) {
    return redirect(cartResult.checkoutUrl, {headers});
  } else {
    throw new Error('No checkout URL found');
  }
}

export default function Component() {
  return null;
}
