import { PublicLink } from './public-link';

export function PurchaseSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav className="purchase-steps" aria-label="Progreso del pedido">
      <ol>
        {[
          { label: 'Elige tus favoritos', short: 'Menú', href: '/menu' },
          { label: 'Revisa tu selección', short: 'Carrito', href: '/carrito' },
          { label: 'Coordina con nosotros', short: 'Confirmar', href: '/pedido' }
        ].map((step, index) => (
          <li key={step.href} aria-current={current === index + 1 ? 'step' : undefined}>
            <span className="purchase-step-number" aria-hidden="true">
              {index + 1}
            </span>
            <span>
              {index + 1 < current ? (
                <PublicLink href={step.href}>{step.short}</PublicLink>
              ) : (
                <strong>{step.short}</strong>
              )}
              <small>{step.label}</small>
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
