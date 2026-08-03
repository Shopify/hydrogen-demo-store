import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import type {FetcherWithComponents} from '@remix-run/react';
import {useIgCart} from '@intelligems/headless/hydrogen';

import {Button} from '~/components/Button';

export function AddToCartButton({
  children,
  lines,
  productId,
  className = '',
  variant = 'primary',
  width = 'full',
  disabled,
  ...props
}: {
  children: React.ReactNode;
  lines: Array<OptimisticCartLineInput>;
  /** Needed for Intelligems price/discount line item properties. */
  productId?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'inline';
  width?: 'auto' | 'full';
  disabled?: boolean;
  [key: string]: any;
}) {
  // No cart token needed here: useIgTrack in root.tsx already calls useIgCart
  // with the token to sync cart attributes. This is only for the ATC props.
  const {wrapCustomAttributes} = useIgCart();

  return (
    <CartForm
      route="/cart"
      inputs={{
        lines: lines.map((line) => ({
          ...line,
          attributes: wrapCustomAttributes({
            productId,
            variantId: line.merchandiseId,
            customAttributes: line.attributes,
          }),
        })),
      }}
      action={CartForm.ACTIONS.LinesAdd}
    >
      {(fetcher: FetcherWithComponents<any>) => {
        return (
          <>
            <Button
              as="button"
              type="submit"
              width={width}
              variant={variant}
              className={className}
              disabled={disabled ?? fetcher.state !== 'idle'}
              {...props}
            >
              {children}
            </Button>
          </>
        );
      }}
    </CartForm>
  );
}
