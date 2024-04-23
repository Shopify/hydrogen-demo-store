import {json, type LoaderFunctionArgs} from '@remix-run/server-runtime';

export async function loader({context}: LoaderFunctionArgs) {
  return json({
    result: await context.storefront.query(
      `query getShop {
        shop {
          name
        }
      }`,
      {
        cache: context.storefront.CacheLong(),
      },
    ),
  });
}
