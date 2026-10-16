'use client';

import { PublicLink as Link } from '../../components/site/public-link';
import { useCartStore } from './cart-store';
import { useCartReady } from './use-cart-ready';
import { maxCartQuantity } from './cart-data';

const bolivianos = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
  minimumFractionDigits: 2
});

export function CartView() {
  const ready = useCartReady();
  const branch = useCartStore((state) => state.branch);
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const removeItem = useCartStore((state) => state.removeItem);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const estimatedSubtotal = items.reduce(
    (total, item) => total + Number(item.unitPrice) * item.quantity,
    0
  );

  if (!ready)
    return (
      <p className="mt-8" role="status">
        Recuperando tu carrito…
      </p>
    );
  if (items.length === 0) {
    return (
      <section className="checkout-card public-empty mt-10">
        <h2 className="text-2xl font-black">Aún no elegiste nada.</h2>
        <p className="mt-3 leading-7 text-stone-700">
          Explora el menú de una sucursal y añade tus favoritos.
        </p>
        <Link className="public-button mt-6" href="/menu">
          Ir al menú
        </Link>
      </section>
    );
  }

  return (
    <section className="checkout-card cart-review mt-10">
      {branch ? (
        <p className="text-sm font-black tracking-[0.12em] text-red-700">
          SUCURSAL: {branch.name.toUpperCase()}
        </p>
      ) : null}
      <ul className="mt-6 divide-y divide-stone-200">
        {items.map((item) => (
          <li
            className="flex flex-wrap items-center justify-between gap-4 py-5"
            key={item.productId}
          >
            <div>
              <h2 className="text-lg font-black">{item.name}</h2>
              <p className="mt-1 text-sm text-stone-700">
                {bolivianos.format(Number(item.unitPrice))} c/u
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                aria-label={`Reducir cantidad de ${item.name}`}
                className="grid size-11 place-items-center rounded-full border border-stone-300 font-black"
                onClick={() => setQuantity(item.productId, item.quantity - 1)}
                type="button"
              >
                −
              </button>
              <span
                aria-label={`Cantidad: ${item.quantity}`}
                className="w-5 text-center font-black"
              >
                {item.quantity}
              </span>
              <button
                aria-label={`Aumentar cantidad de ${item.name}`}
                disabled={item.quantity >= maxCartQuantity}
                className="grid size-11 place-items-center rounded-full border border-stone-300 font-black disabled:opacity-40"
                onClick={() => setQuantity(item.productId, item.quantity + 1)}
                type="button"
              >
                +
              </button>
              <button
                aria-label={`Quitar ${item.name} del carrito`}
                className="ml-2 text-sm font-black text-red-700 underline"
                onClick={() => removeItem(item.productId)}
                type="button"
              >
                Quitar
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="cart-total-panel">
        <div>
          <p className="text-sm font-bold text-stone-600">Subtotal estimado</p>
          <p
            className="mt-1 text-3xl font-black"
            role="status"
            aria-label={`Subtotal estimado: ${bolivianos.format(estimatedSubtotal)}`}
          >
            {bolivianos.format(estimatedSubtotal)}
          </p>
          <p className="mt-2 text-xs leading-5 text-stone-500">
            El precio y las promociones se confirmarán antes de registrar el pedido.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <button
            className="text-sm font-black text-red-700 underline"
            onClick={() => {
              if (window.confirm('¿Quitar todos los productos del carrito?')) clear();
            }}
            type="button"
          >
            Vaciar carrito
          </button>
          {branch ? (
            <Link className="public-button" href="/pedido">
              Continuar con el pedido
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
