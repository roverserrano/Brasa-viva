import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  ...(process.env.NEXT_PUBLIC_SITE_URL
    ? { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL) }
    : {}),
  title: {
    default: 'Brasa Viva | Sabor que reúne',
    template: '%s | Brasa Viva'
  },
  description: 'Menú, promociones y pedidos de Brasa Viva en Cochabamba.'
};

export const viewport: Viewport = { themeColor: '#faf5eb' };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es-BO" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
