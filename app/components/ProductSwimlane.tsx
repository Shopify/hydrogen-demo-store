import {Section} from '~/components/Text';
import {ProductCard} from '~/components/ProductCard';
import type {ProductCardFragment} from '~/data/fragments';

const mockProducts = {
  nodes: new Array(12).fill(''),
};

type ProductSwimlaneProps = {
  products?: {nodes: ProductCardFragment[]};
  title?: string;
  count?: number;
};

export function ProductSwimlane({
  title = 'Featured Products',
  products = mockProducts,
  count = 12,
  ...props
}: ProductSwimlaneProps) {
  return (
    <Section heading={title} padding="y" {...props}>
      <div className="swimlane hiddenScroll md:pb-8 md:scroll-px-8 lg:scroll-px-12 md:px-8 lg:px-12">
        {products.nodes.map((product) => (
          <ProductCard
            product={product}
            key={product.id}
            className="snap-start w-80"
          />
        ))}
      </div>
    </Section>
  );
}
