import {Cart} from '~/components/Cart';

export default function CartRoute() {
  return (
    <div className="cart">
      <h1>Cart</h1>
      <Cart layout="page" />
    </div>
  );
}
