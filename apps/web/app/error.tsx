'use client';

import Link from 'next/link';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black">No pudimos abrir esta pantalla</h1>
        <p className="mt-4 leading-7 text-stone-700">
          Puede ser un problema temporal de conexión. Intenta nuevamente o vuelve al menú para
          continuar.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <button
            className="rounded-full bg-red-700 px-5 py-3 font-bold text-white"
            type="button"
            onClick={reset}
          >
            Intentar nuevamente
          </button>
          <Link className="rounded-full border border-stone-300 px-5 py-3 font-bold" href="/menu">
            Ir al menú
          </Link>
        </div>
      </section>
    </main>
  );
}
