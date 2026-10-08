import clsx from 'clsx';
import {useRef, type RefObject} from 'react';
import useScroll from 'react-use/esm/useScroll';
import type {CartLine} from '@shopify/hydrogen';

import {Button} from '~/components/Button';
import {CartLoading} from '~/components/CartLoading';
import {Image} from '~/components/Image';
import {Money} from '~/components/Money';
import {Text, Heading} from '~/components/Text';
import {Link} from '~/components/Link';
import {IconRemove} from '~/components/Icon';
import {FeaturedProducts} from '~/components/FeaturedProducts';
import {useCart, useCartForm} from '~/lib/cart';
import {getInputStyleClasses} from '~/lib/utils';

type Layouts = 'page' | 'drawer';

export function Cart({
  layout,
  onClose,
}: {
  layout: Layouts;
  onClose?: () => void;
}) {
  const loading = useCart((s) => s.loading);
  const linesCount = useCart((s) => s.data.lines.nodes.length > 0);

  if (loading) {
    return <CartLoading />;
  }

  return (
    <>
      <CartEmpty hidden={linesCount} onClose={onClose} layout={layout} />
      <CartDetails layout={layout} />
    </>
  );
}

export function CartDetails({layout}: {layout: Layouts}) {
  const cartHasItems = useCart((s) => s.data.totalQuantity > 0);
  const container = {
    drawer: 'grid grid-cols-1 h-screen-no-nav grid-rows-[1fr_auto]',
    page: 'w-full pb-12 grid md:grid-cols-2 md:items-start gap-8 md:gap-8 lg:gap-12',
  };

  return (
    <div className={container[layout]}>
      <CartLines layout={layout} />
      {cartHasItems && (
        <CartSummary layout={layout}>
          <CartDiscounts />
          <CartCheckoutActions />
        </CartSummary>
      )}
    </div>
  );
}

/**
 * Temporary discount UI
 * @todo rework when a design is ready
 */
function CartDiscounts() {
  const discountCodes = useCart((s) => s.data.discountCodes);
  const codes: string[] = discountCodes
    .filter((discount) => discount.applicable)
    .map(({code}) => code);

  return (
    <>
      {/* Have existing discount, display it with a remove option */}
      <dl className={codes && codes.length !== 0 ? 'grid' : 'hidden'}>
        <div className="flex items-center justify-between font-medium">
          <Text as="dt">Discount(s)</Text>
          <div className="flex items-center justify-between">
            {codes.map((code) => (
              <RemoveDiscountForm key={code} code={code} />
            ))}
            <Text as="dd">{codes?.join(', ')}</Text>
          </div>
        </div>
      </dl>

      {/* Show an input to apply a discount */}
      <ApplyDiscountForm />
    </>
  );
}

function RemoveDiscountForm({code}: {code: string}) {
  const {formProps, register} = useCartForm();

  return (
    <form {...formProps()}>
      <input type="hidden" {...register('discountCode', {value: code})} />
      <button type="submit" {...register('discount-remove')}>
        <span className="sr-only">Remove discount {code}</span>
        <IconRemove aria-hidden="true" style={{height: 18, marginRight: 4}} />
      </button>
    </form>
  );
}

function ApplyDiscountForm() {
  const {formProps, register} = useCartForm();

  return (
    <form {...formProps()}>
      <div
        className={clsx('flex', 'items-center gap-4 justify-between text-copy')}
      >
        <input
          className={getInputStyleClasses()}
          type="text"
          placeholder="Discount code"
          {...register('discountCode', {defaultValue: ''})}
        />
        <button
          type="submit"
          className="flex justify-end font-medium whitespace-nowrap"
          {...register('discount-apply')}
        >
          Apply Discount
        </button>
      </div>
    </form>
  );
}

function CartLines({layout = 'drawer'}: {layout: Layouts}) {
  const lines = useCart((s) => s.data.lines.nodes);
  const scrollRef = useRef<HTMLElement>(null);
  const {y} = useScroll(scrollRef as RefObject<HTMLElement>);

  const className = clsx([
    y > 0 ? 'border-t' : '',
    layout === 'page'
      ? 'flex-grow md:translate-y-4'
      : 'px-6 pb-6 sm-max:pt-2 overflow-auto transition md:px-12',
  ]);

  return (
    <section
      ref={scrollRef}
      aria-labelledby="cart-contents"
      className={className}
    >
      <CartErrorBanner />
      <ul className="grid gap-6 md:gap-10">
        {lines.map((line) => (
          <CartLineItem key={line.id} line={line} />
        ))}
      </ul>
    </section>
  );
}

function CartErrorBanner() {
  const cartErrors = useCart((s) => s.errors.cart);
  const networkErrors = useCart((s) => s.errors.network);
  const messages = [
    ...cartErrors.userErrors.map((error) => error.message),
    ...networkErrors.map((error) => error.message),
  ];

  if (!messages.length) return null;

  return (
    <div role="alert" className="mb-4 p-3 border rounded text-notice">
      {messages.map((message, index) => (
        <Text key={index}>{message}</Text>
      ))}
    </div>
  );
}

function CartCheckoutActions() {
  const checkoutUrl = useCart((s) => s.data.checkoutUrl);

  if (!checkoutUrl) return null;

  return (
    <div className="flex flex-col mt-2">
      <a href={checkoutUrl} target="_self">
        <Button as="span" width="full">
          Continue to Checkout
        </Button>
      </a>
      {/* @todo: <CartShopPayButton cart={cart} /> */}
    </div>
  );
}

function CartSummary({
  layout,
  children = null,
}: {
  children?: React.ReactNode;
  layout: Layouts;
}) {
  const cost = useCart((s) => s.data.cost);
  const costPending = useCart((s) => Boolean(s.pending.cost || s.revalidating));

  const summary = {
    drawer: 'grid gap-4 p-6 border-t md:px-12',
    page: 'sticky top-nav grid gap-6 p-4 md:px-6 md:translate-y-4 bg-primary/5 rounded w-full',
  };

  return (
    <section aria-labelledby="summary-heading" className={summary[layout]}>
      <h2 id="summary-heading" className="sr-only">
        Order summary
      </h2>
      <dl className="grid">
        <div className="flex items-center justify-between font-medium">
          <Text as="dt">Subtotal</Text>
          <Text
            as="dd"
            data-test="subtotal"
            className={costPending ? 'opacity-50' : undefined}
          >
            {cost?.subtotalAmount?.amount ? (
              <Money data={cost?.subtotalAmount} />
            ) : (
              '-'
            )}
          </Text>
        </div>
      </dl>
      {children}
    </section>
  );
}

function CartLineItem({line}: {line: CartLine}) {
  const isPending = useCart((s) => s.pending.lines.has(line.id));
  const lineErrors = useCart((s) => s.errors.lines.get(line.id));

  if (!line?.id) return null;

  const {id, quantity, merchandise} = line;

  if (typeof quantity === 'undefined' || !merchandise?.product) return null;

  return (
    <li key={id} className="flex gap-4">
      <div className="flex-shrink">
        {merchandise.image && (
          <Image
            width={110}
            height={110}
            data={merchandise.image}
            className="object-cover object-center w-24 h-24 border rounded md:w-28 md:h-28"
            alt={merchandise.title}
          />
        )}
      </div>

      <div className="flex justify-between flex-grow">
        <div className="grid gap-2">
          <Heading as="h3" size="copy">
            {merchandise?.product?.handle ? (
              <Link to={`/products/${merchandise.product.handle}`}>
                {merchandise?.product?.title || ''}
              </Link>
            ) : (
              <Text>{merchandise?.product?.title || ''}</Text>
            )}
          </Heading>

          <div className="grid pb-2">
            {(merchandise?.selectedOptions || []).map((option) => (
              <Text color="subtle" key={option.name}>
                {option.name}: {option.value}
              </Text>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex justify-start text-copy">
              <CartLineQuantityAdjust line={line} isPending={isPending} />
            </div>
            <ItemRemoveButton lineId={id} />
          </div>
          {lineErrors && lineErrors.userErrors.length > 0 && (
            <Text role="alert" className="text-notice">
              {lineErrors.userErrors.map((error) => error.message).join(' ')}
            </Text>
          )}
        </div>
        <Text className={isPending ? 'opacity-50' : undefined}>
          <CartLinePrice line={line} as="span" />
        </Text>
      </div>
    </li>
  );
}

function ItemRemoveButton({lineId}: {lineId: CartLine['id']}) {
  const {formProps, register} = useCartForm();

  return (
    <form {...formProps()}>
      <input type="hidden" {...register('lineId', {value: lineId})} />
      <button
        className="flex items-center justify-center w-10 h-10 border rounded"
        type="submit"
        {...register('remove')}
      >
        <span className="sr-only">Remove</span>
        <IconRemove aria-hidden="true" />
      </button>
    </form>
  );
}

function CartLineQuantityAdjust({
  line,
  isPending,
}: {
  line: CartLine;
  isPending: boolean;
}) {
  const {formProps, register} = useCartForm();

  if (!line || typeof line?.quantity === 'undefined') return null;

  const {id: lineId, quantity} = line;

  return (
    <form {...formProps()}>
      <label htmlFor={`quantity-${lineId}`} className="sr-only">
        Quantity, {quantity}
      </label>
      <button {...register('set')} />
      <input type="hidden" {...register('lineId', {value: lineId})} />
      <div className="flex items-center border rounded">
        <button
          type="submit"
          aria-label="Decrease quantity"
          className="w-10 h-10 transition text-primary/50 hover:text-primary disabled:text-primary/10"
          disabled={quantity <= 1}
          {...register('decrease')}
        >
          <span>&#8722;</span>
        </button>

        <input
          id={`quantity-${lineId}`}
          className={clsx(
            'w-8 px-2 text-center bg-transparent',
            isPending ? 'opacity-50' : '',
          )}
          data-test="item-quantity"
          {...register('quantity', {value: quantity, interactive: true})}
        />

        <button
          type="submit"
          className="w-10 h-10 transition text-primary/50 hover:text-primary"
          aria-label="Increase quantity"
          {...register('increase')}
        >
          <span>&#43;</span>
        </button>
      </div>
    </form>
  );
}

function CartLinePrice({
  line,
  priceType = 'regular',
  ...passthroughProps
}: {
  line: CartLine;
  priceType?: 'regular' | 'compareAt';
  [key: string]: any;
}) {
  if (!line?.cost?.amountPerQuantity || !line?.cost?.totalAmount) return null;

  const moneyV2 =
    priceType === 'regular'
      ? line.cost.totalAmount
      : line.cost.compareAtAmountPerQuantity;

  if (moneyV2 == null) {
    return null;
  }

  return <Money withoutTrailingZeros {...passthroughProps} data={moneyV2} />;
}

export function CartEmpty({
  hidden = false,
  layout = 'drawer',
  onClose,
}: {
  hidden: boolean;
  layout?: Layouts;
  onClose?: () => void;
}) {
  const scrollRef = useRef<HTMLElement>(null);
  const {y} = useScroll(scrollRef as RefObject<HTMLElement>);

  const container = {
    drawer: clsx([
      'content-start gap-4 px-6 pb-8 transition overflow-y-scroll md:gap-12 md:px-12 h-screen-no-nav md:pb-12',
      y > 0 ? 'border-t' : '',
    ]),
    page: clsx([
      hidden ? '' : 'grid',
      `pb-12 w-full md:items-start gap-4 md:gap-8 lg:gap-12`,
    ]),
  };

  return (
    <div
      ref={scrollRef as RefObject<HTMLDivElement>}
      className={container[layout]}
      hidden={hidden}
    >
      <section className="grid gap-6">
        <Text format>
          Looks like you haven&rsquo;t added anything yet, let&rsquo;s get you
          started!
        </Text>
        <div>
          <Button onClick={onClose}>Continue shopping</Button>
        </div>
      </section>
      <section className="grid gap-8 pt-16">
        <FeaturedProducts
          count={4}
          heading="Shop Best Sellers"
          layout={layout}
          onClose={onClose}
          sortKey="BEST_SELLING"
        />
      </section>
    </div>
  );
}
