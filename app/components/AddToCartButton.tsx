import {useFetcher} from 'react-router';

import {Button} from '~/components/Button';
import {usePrefixPathWithLocale} from '~/lib/utils';

type LineInput = {merchandiseId: string; quantity: number};

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
  lines: Array<LineInput>;
  className?: string;
  variant?: 'primary' | 'secondary' | 'inline';
  width?: 'auto' | 'full';
  disabled?: boolean;
  [key: string]: any;
}) {
  const fetcher = useFetcher();
  const action = usePrefixPathWithLocale('/api/cart');
  const [line] = lines;

  return (
    <fetcher.Form method="post" action={action}>
      <input type="hidden" name="intent" value="add" />
      <input type="hidden" name="merchandiseId" value={line?.merchandiseId} />
      <input type="hidden" name="quantity" value={line?.quantity ?? 1} />
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
    </fetcher.Form>
  );
}
