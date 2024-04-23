import {json, type LoaderFunctionArgs} from '@remix-run/server-runtime';

export async function loader({context}: LoaderFunctionArgs) {
  const time = new Date().getTime();
  await context.storefront.query(
    `query getShop {
        shop {
          name
        }
      }`,
    {
      cache: context.storefront.CacheLong(),
    },
  );

  return json({
    time: new Date().getTime() - time,
  });
}
