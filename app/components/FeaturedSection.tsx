import {useEffect} from 'react';
import {useFetcher} from 'react-router';

import {FeaturedCollections} from './FeaturedCollections';
import {ProductSwimlane} from './ProductSwimlane';

import {usePrefixPathWithLocale} from '~/lib/utils';
import type {FeaturedData} from '~/routes/($locale).featured-products';

export function FeaturedSection() {
  const {load, data} = useFetcher<FeaturedData>();
  const path = usePrefixPathWithLocale('/featured-products');

  useEffect(() => {
    load(path);
  }, [load, path]);

  if (!data) return null;

  const {featuredCollections, featuredProducts} = data;

  return (
    <>
      {featuredCollections.nodes.length < 2 && (
        <FeaturedCollections
          title="Popular Collections"
          collections={featuredCollections}
        />
      )}
      <ProductSwimlane products={featuredProducts} />
    </>
  );
}
