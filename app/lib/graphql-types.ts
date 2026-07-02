import type {StorefrontQueryString} from '@shopify/hydrogen';

export type ResultOf<Doc> =
  Doc extends StorefrontQueryString<infer Result, any, string> ? Result : never;
