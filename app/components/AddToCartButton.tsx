import type {CartLineInput} from '@shopify/hydrogen/storefront-api-types';
import {CartForm} from '@shopify/hydrogen';
import {type FetcherWithComponents} from '@remix-run/react';

import {Button} from '~/components/Button';
import {useCartPath} from '~/hooks/useCartPath';

export function AddToCartButton({
  children,
  lines,
  className = '',
  variant = 'primary',
  width = 'full',
  disabled,
  ...props
}: {
  children: React.ReactNode;
  lines: CartLineInput[];
  className?: string;
  variant?: 'primary' | 'secondary' | 'inline';
  width?: 'auto' | 'full';
  disabled?: boolean;
  [key: string]: any;
}) {
  const cartPath = useCartPath();

  return (
    <CartForm
      route={cartPath}
      inputs={{
        lines,
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
