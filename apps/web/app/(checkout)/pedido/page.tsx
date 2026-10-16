import { PurchaseSteps } from '../../../components/site/purchase-steps';
import { CheckoutForm } from '../../../features/checkout/checkout-form';

export const metadata = { title: 'Preparar pedido', robots: { index: false, follow: false } };

export default function OrderPreparationPage() {
  return (
    <main className="public-container checkout-page">
      <PurchaseSteps current={3} />
      <p className="public-eyebrow">PREPARA TU PEDIDO</p>
      <h1 className="public-display checkout-title">Casi listo para disfrutar.</h1>
      <p className="mt-5 max-w-2xl leading-7 text-stone-700">
        Confirma cómo quieres recibir tu pedido. Antes de enviarlo, Brasa Viva validará de nuevo
        disponibilidad, precios y promociones.
      </p>
      <CheckoutForm />
    </main>
  );
}
