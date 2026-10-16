import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-black">Esta página no está disponible</h1>
      <p className="mt-4 leading-7 text-stone-700">
        El producto o enlace puede haber cambiado. En el menú encontrarás lo que ofrecemos en cada
        sucursal.
      </p>
      <Link
        className="mt-6 inline-flex rounded-full bg-red-700 px-5 py-3 font-bold text-white"
        href="/menu"
      >
        Explorar el menú
      </Link>
    </main>
  );
}
