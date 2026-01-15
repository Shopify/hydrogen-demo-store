/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

import type {
  HydrogenContext,
  HydrogenEnv,
  HydrogenSession,
} from '@shopify/hydrogen';
import type {I18nLocale, Storefront} from '~/lib/type';

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

declare global {
  interface Env extends HydrogenEnv {}
}

type AppHydrogenContext = HydrogenContext<
  HydrogenSession,
  undefined,
  I18nLocale
>;

declare module 'react-router' {
  interface AppLoadContext extends AppHydrogenContext {
    storefront: Storefront;
  }
  interface RouterContextProvider extends AppHydrogenContext {
    storefront: Storefront;
  }
}

export {};
