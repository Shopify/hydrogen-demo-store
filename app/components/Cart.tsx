import clsx from 'clsx';
import {useRef} from 'react';
import useScroll from 'react-use/esm/useScroll';

import {useCart, useCartForm, type CartLineNode} from '~/lib/cart';
import {Image} from '~/components/Image';
import {Money} from '~/components/Money';
import {Button} from '~/components/Button';
import {Text, Heading} from '~/components/Text';
import {Link} from '~/components/Link';
import {IconRemove} from '~/components/Icon';
import {FeaturedProducts} from '~/components/FeaturedProducts';
import {getInputStyleClasses} from '~/lib/utils';

type Layouts = 'page' | 'drawer';

export function Cart({
  layout,
  onClose,
}: {
  layout: Layouts;
  onClose?: () => void;
}) {
  const totalQuantity = useCart((state) => state.data.totalQuantity);
  const linesCount = Boolean(totalQuantity && totalQuantity > 0);

  return (
    <>
      <CartEmpty hidden={linesCount} onClose={onClose} layout={layout} />
      <CartDetails layout={layout} />
    </>
  );
}

export function CartDetails({layout}: {layout: Layouts}) {
  const totalQuantity = useCart((state) => state.data.totalQuantity);
  const cartHasItems = Boolean(totalQuantity && totalQuantity > 0);
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

function CartDiscounts() {
  const discountCodes = useCart((state) => state.data.discountCodes);
  const codes: string[] =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];

  return (
    <>
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

      <ApplyDiscountForm />
    </>
  );
}

function ApplyDiscountForm() {
  const {formProps, register} = useCartForm();
  const pendingDiscounts = useCart((state) => state.pending.discountCodes);
  const isPending = pendingDiscounts.size > 0;

  return (
    <form {...formProps()}>
      <button type="submit" hidden {...register('discount-apply')} />
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
          {...register('discount-apply')}
          className="flex justify-end font-medium whitespace-nowrap"
        >
          {isPending ? 'Applying…' : 'Apply Discount'}
        </button>
      </div>
    </form>
  );
}

function RemoveDiscountForm({code}: {code: string}) {
  const {formProps, register} = useCartForm();

  return (
    <form {...formProps()}>
      <input type="hidden" {...register('discountCode', {value: code})} />
      <button type="submit" {...register('discount-remove')}>
        <IconRemove aria-hidden="true" style={{height: 18, marginRight: 4}} />
      </button>
    </form>
  );
}

function CartLines({layout = 'drawer'}: {layout: Layouts}) {
  const currentLines = useCart((state) => state.data.lines.nodes);
  const scrollRef = useRef(null);
  const {y} = useScroll(scrollRef);

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
      <ul className="grid gap-6 md:gap-10">
        {currentLines.map((line) => (
          <CartLineItem key={line.id} line={line} />
        ))}
      </ul>
    </section>
  );
}

function CartCheckoutActions() {
  const checkoutUrl = useCart((state) => state.data.checkoutUrl);
  if (!checkoutUrl) return null;

  return (
    <div className="flex flex-col mt-2">
      <a href={checkoutUrl} target="_self">
        <Button as="span" width="full">
          Continue to Checkout
        </Button>
      </a>
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
  const cost = useCart((state) => state.data.cost);
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
          <Text as="dd" data-test="subtotal">
            {cost?.subtotalAmount?.amount ? (
              <Money data={cost.subtotalAmount} />
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

function CartLineItem({line}: {line: CartLineNode}) {
  const {formProps, register} = useCartForm();
  const pendingLines = useCart((state) => state.pending.lines);

  if (!line?.id) return null;

  const {id, quantity, merchandise} = line;

  if (typeof quantity === 'undefined' || !merchandise?.product) return null;

  const isPending = pendingLines.has(id);

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

          <form {...formProps()} className="flex items-center gap-2">
            <button {...register('set')} />
            <input type="hidden" {...register('lineId', {value: id})} />
            <div className="flex items-center border rounded">
              <button
                type="submit"
                {...register('decrease')}
                aria-label="Decrease quantity"
                className="w-10 h-10 transition text-primary/50 hover:text-primary"
              >
                <span>&#8722;</span>
              </button>
              <input
                {...register('quantity', {value: quantity, interactive: true})}
                aria-label="Quantity"
                className={clsx(
                  'px-2 w-8 text-center bg-transparent appearance-none border-0 focus:outline-none focus:ring-0',
                  isPending ? 'opacity-30' : '',
                )}
              />
              <button
                type="submit"
                {...register('increase')}
                aria-label="Increase quantity"
                className="w-10 h-10 transition text-primary/50 hover:text-primary"
              >
                <span>&#43;</span>
              </button>
            </div>
            <button
              type="submit"
              {...register('remove')}
              className="flex items-center justify-center w-10 h-10 border rounded"
            >
              <span className="sr-only">Remove</span>
              <IconRemove aria-hidden="true" />
            </button>
          </form>
        </div>
        <Text className={isPending ? 'opacity-30' : ''}>
          <CartLinePrice line={line} as="span" />
        </Text>
      </div>
    </li>
  );
}

function CartLinePrice({
  line,
  ...passthroughProps
}: {
  line: CartLineNode;
  [key: string]: any;
}) {
  const moneyV2 = line?.cost?.totalAmount;
  if (moneyV2 == null) return null;

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
  const scrollRef = useRef(null);
  const {y} = useScroll(scrollRef);

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
    <div ref={scrollRef} className={container[layout]} hidden={hidden}>
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
