import { PurchaseSteps } from '../../../components/site/purchase-steps';
import { PublicLink as Link } from '../../../components/site/public-link';
import { CartView } from '../../../features/cart/cart-view';

export const metadata = { title: 'Carrito', robots: { index: false, follow: false } };

export default function CartPage() {
  return (
    <main className="public-container checkout-page">
      <PurchaseSteps current={2} />
      <p className="public-eyebrow">TU PEDIDO</p>
      <h1 className="public-display checkout-title">Revisa tu pedido.</h1>
      <p className="mt-5 leading-7 text-stone-700">
        Elige cantidades y confirma la sucursal antes de continuar.
      </p>
      <CartView />
      <Link className="public-text-link mt-8" href="/menu">
        Volver al menú
      </Link>
    </main>
  );
}
