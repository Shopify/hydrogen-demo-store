import {Suspense} from 'react';
import {Await} from '@remix-run/react';

import {ProductSwimlane} from '~/components/ProductSwimlane';

interface RecentlyViewedMockProps {
  recentlyViewedProducts: Promise<any>;
}

export function RecentlyViewedMock({
  recentlyViewedProducts,
}: RecentlyViewedMockProps) {
  return (
    <Suspense>
      <Await resolve={recentlyViewedProducts}>
        {(response) => {
          if (
            !response ||
            !response?.products ||
            !response?.products?.nodes ||
            response?.products?.nodes.length === 0
          ) {
            return null;
          }

          return (
            <ProductSwimlane
              products={response.products}
              title="Recently Viewed"
              count={4}
            />
          );
        }}
      </Await>
    </Suspense>
  );
}
