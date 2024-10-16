# Hydrogen upgrade guide: 2024.7.2 to 2024.7.3

----

## Features

### Simplified creation of app context. [#2333](https://github.com/Shopify/hydrogen/pull/2333)

#### Step: 1. Create a app/lib/context file and use `createHydrogenContext` in it. [#2333](https://github.com/Shopify/hydrogen/pull/2333)

[#2333](https://github.com/Shopify/hydrogen/pull/2333)
```.ts
// in app/lib/context

import {createHydrogenContext} from '@shopify/hydrogen';

export async function createAppLoadContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
) {
    const hydrogenContext = createHydrogenContext({
      env,
      request,
      cache,
      waitUntil,
      session,
      i18n: {language: 'EN', country: 'US'},
      cart: {
        queryFragment: CART_QUERY_FRAGMENT,
      },
      // ensure to overwrite any options that is not using the default values from your server.ts
    });

  return {
    ...hydrogenContext,
    // declare additional Remix loader context
  };
}

```

#### Step: 2. Use `createAppLoadContext` method in server.ts Ensure to overwrite any options that is not using the default values in `createHydrogenContext` [#2333](https://github.com/Shopify/hydrogen/pull/2333)

[#2333](https://github.com/Shopify/hydrogen/pull/2333)
```diff
// in server.ts

- import {
-   createCartHandler,
-   createStorefrontClient,
-   createCustomerAccountClient,
- } from '@shopify/hydrogen';
+ import {createAppLoadContext} from '~/lib/context';

export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {

-   const {storefront} = createStorefrontClient(
-     ...
-   );

-   const customerAccount = createCustomerAccountClient(
-     ...
-   );

-   const cart = createCartHandler(
-     ...
-   );

+   const appLoadContext = await createAppLoadContext(
+      request,
+      env,
+      executionContext,
+   );

    /**
      * Create a Remix request handler and pass
      * Hydrogen's Storefront client to the loader context.
      */
    const handleRequest = createRequestHandler({
      build: remixBuild,
      mode: process.env.NODE_ENV,
-      getLoadContext: (): AppLoadContext => ({
-        session,
-        storefront,
-        customerAccount,
-        cart,
-        env,
-        waitUntil,
-      }),
+      getLoadContext: () => appLoadContext,
    });
  }
```

#### Step: 3. Use infer type for AppLoadContext in env.d.ts [#2333](https://github.com/Shopify/hydrogen/pull/2333)

[#2333](https://github.com/Shopify/hydrogen/pull/2333)
```diff
// in env.d.ts

+ import type {createAppLoadContext} from '~/lib/context';

+ interface AppLoadContext extends Awaited<ReturnType<typeof createAppLoadContext>> {
- interface AppLoadContext {
-  env: Env;
-  cart: HydrogenCart;
-  storefront: Storefront;
-  customerAccount: CustomerAccount;
-  session: AppSession;
-  waitUntil: ExecutionContext['waitUntil'];
}

```

----

----

## Fixes

### Fix an infinite redirect when viewing the cached version of a Hydrogen site on Google Web Cache [#2334](https://github.com/Shopify/hydrogen/pull/2334)

#### Update your entry.client.jsx file to include this check
[#2334](https://github.com/Shopify/hydrogen/pull/2334)
```diff
+ if (!window.location.origin.includes("webcache.googleusercontent.com")) {
   startTransition(() => {
     hydrateRoot(
       document,
       <StrictMode>
         <RemixBrowser />
       </StrictMode>
     );
   });
+ }
```
