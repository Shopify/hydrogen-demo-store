import {Button} from '~/components/Button';
import {useCartForm} from '~/lib/cart';
import {openCartDrawer} from '~/lib/cart-drawer';

export function AddToCartButton({
  children,
  merchandiseId,
  quantity = 1,
  className = '',
  variant = 'primary',
  width = 'full',
  disabled,
  ...props
}: {
  children: React.ReactNode;
  merchandiseId: string;
  quantity?: number;
  className?: string;
  variant?: 'primary' | 'secondary' | 'inline';
  width?: 'auto' | 'full';
  disabled?: boolean;
  [key: string]: any;
}) {
  const {formProps, register} = useCartForm();

  return (
    <form {...formProps({beforeSubmit: openCartDrawer})}>
      <input
        type="hidden"
        {...register('merchandiseId', {value: merchandiseId})}
      />
      <input type="hidden" {...register('quantity', {value: quantity})} />
      <Button
        as="button"
        type="submit"
        width={width}
        variant={variant}
        className={className}
        disabled={disabled}
        {...register('add')}
        {...props}
      >
        {children}
      </Button>
    </form>
  );
}
