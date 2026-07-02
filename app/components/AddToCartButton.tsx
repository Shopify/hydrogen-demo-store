import {Button} from '~/components/Button';
import {useCartForm} from '~/lib/cart';
import {useIsHydrated} from '~/hooks/useIsHydrated';

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
  const {formProps, register} = useCartForm();
  const isHydrated = useIsHydrated();
  const [line] = lines;

  return (
    <form {...formProps()}>
      <input type="hidden" {...register('merchandiseId', {value: line?.merchandiseId})} />
      <input type="hidden" {...register('quantity', {value: line?.quantity ?? 1})} />
      <Button
        as="button"
        type="submit"
        width={width}
        variant={variant}
        className={className}
        disabled={disabled ?? !isHydrated}
        {...register('add')}
        {...props}
      >
        {children}
      </Button>
    </form>
  );
}
