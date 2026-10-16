'use client';

import { useState } from 'react';
import Link from 'next/link';
import { type CartBranch, useCartStore } from './cart-store';

type AddToCartButtonProps = {
  branch: CartBranch;
  product: {
    id: string;
    name: string;
    price: string;
  };
};

export function AddToCartButton({ branch, product }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const cartBranch = useCartStore((state) => state.branch);
  const clear = useCartStore((state) => state.clear);
  const [message, setMessage] = useState<string | null>(null);

  function handleAdd(): void {
    const added = addItem(branch, {
      productId: product.id,
      name: product.name,
      unitPrice: product.price
    });

    setMessage(
      added
        ? `${product.name} fue añadido al carrito.`
        : cartBranch && cartBranch.id !== branch.id
          ? `Tu carrito pertenece a ${cartBranch.name}. Puedes revisarlo o empezar uno en esta sucursal.`
          : 'Llegaste al límite de este pedido: 99 unidades por producto y 30 productos diferentes.'
    );
  }

  return (
    <div className="cart-add mt-5">
      <button
        className="rounded-full bg-stone-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-red-700 focus:outline-2 focus:outline-offset-2 focus:outline-red-700"
        aria-label={`Añadir al carrito: ${product.name}`}
        onClick={handleAdd}
        type="button"
      >
        Añadir al carrito
      </button>
      <p aria-live="polite" className="mt-2 min-h-5 text-xs font-semibold text-stone-600">
        {message}
      </p>
      {message && cartBranch && cartBranch.id !== branch.id ? (
        <button
          type="button"
          className="mt-2 text-sm font-bold text-red-700 underline"
          onClick={() => {
            if (
              window.confirm(
                `¿Quitar los productos de ${cartBranch.name} y empezar un carrito en ${branch.name}?`
              )
            ) {
              clear();
              handleAdd();
            }
          }}
        >
          Empezar en {branch.name}
        </button>
      ) : null}
      {message ? (
        <Link className="mt-2 block text-sm font-bold text-red-700 underline" href="/carrito">
          Ver mi carrito
        </Link>
      ) : null}
    </div>
  );
}
