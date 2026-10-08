import {createProductComponents} from '@shopify/hydrogen/react';
import type {ProductFragment} from 'storefrontapi.generated';

export type ProductVariantData = NonNullable<
  ProductFragment['selectedOrFirstAvailableVariant']
>;

export type ProductData = Omit<
  ProductFragment,
  'selectedOrFirstAvailableVariant'
> & {
  selectedOrFirstAvailableVariant: ProductVariantData | null;
};

export const {ProductProvider, useProduct, useProductForm} =
  createProductComponents<ProductData>();
