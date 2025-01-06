import {type ReactNode, useMemo, createElement, Fragment, useState, useEffect} from 'react';
// 类型定义
type ProductMetafield = {
  key: string;
  value: string;
};
type ProductWithMetafields = {
  metafields: ProductMetafield[];
  handle: string;
};
export type CustomVariantOption = {
  name: string;
  value?: string;
  values: Array<CustomVariantOptionValue>;
};
type Facet = {
  name: string;
  optionValues: Array<{name: string}>;
};
export type CustomVariantOptionValue = {
  value: string;
  isAvailable: boolean;
  isActive: boolean;
  productHandle?: string;
  optionValue: {name: string};
  onSelect: () => void;
  to: string;
};
type CustomVariantSelectorProps = {
  handle: string;
  options: Array<Facet> | undefined;
  variants?: ProductWithMetafields[];
  children: ({
    option,
    selectedProduct
  }: {
    option: CustomVariantOption;
    selectedProduct: ProductWithMetafields | null;
  }) => ReactNode;
};
export function CustomVariantSelector({
  handle,
  options: facets = [],
  variants: productMetafields = [],
  children,
}: CustomVariantSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedProduct, setSelectedProduct] = useState<ProductWithMetafields | null>(null);
  useEffect(() => {
    const currentProduct = productMetafields.find(
      (product) => product.handle === handle
    );
    if (currentProduct) {
      const initialOptions: Record<string, string> = {};
      currentProduct.metafields.forEach((metafield) => {
        const optionName = metafield.key.charAt(0).toUpperCase() + metafield.key.slice(1);
        initialOptions[optionName] = metafield.value;
      });
      setSelectedOptions(initialOptions);
      setSelectedProduct(currentProduct);
    }
  }, [handle, productMetafields]);
  const handleOptionSelect = (optionName: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: value,
    }));
  };
  return createElement(
    Fragment,
    null,
    ...useMemo(() => {
      return facets.map((facet) => {
        const optionName = facet?.name;
        const optionValues = facet?.optionValues;
        
        if (!optionName || !optionValues) return null;
        
        const activeValue = selectedOptions[optionName];
        let availableValues: CustomVariantOptionValue[] = [];
        for (const value of optionValues) {
          const valueName = value?.name;
          if (!valueName) continue;
          const potentialSelection = {
            ...selectedOptions,
            [optionName]: valueName,
          };
          const matchingProduct = productMetafields.find((product) => {
            const currentSelections = Object.entries(potentialSelection);
            return currentSelections.every(([name, value]) => {
              const matchingMetafield = product.metafields.find(
                (metafield) => metafield.key.charAt(0).toUpperCase() + metafield.key.slice(1) === name
              );
              return matchingMetafield?.value === value;
            });
          });
          const isAvailable = !!matchingProduct;
          availableValues.push({
            value: valueName,
            optionValue: value,
            isAvailable,
            isActive: activeValue === valueName,
            productHandle: matchingProduct?.handle,
            onSelect: () => handleOptionSelect(optionName, valueName),
            to: matchingProduct ? `/products/${matchingProduct.handle}` : '',
          });
        }
        return children({
          option: {
            name: optionName,
            value: activeValue,
            values: availableValues,
          },
          selectedProduct
        });
      }).filter(Boolean);
    }, [facets, productMetafields, selectedOptions, children, selectedProduct]),
  );
}