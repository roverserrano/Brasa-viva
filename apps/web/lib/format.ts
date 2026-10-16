const bolivianos = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
  minimumFractionDigits: 2
});

/** Monto en bolivianos con el formato del negocio ("Bs 32,50"). */
export function formatBs(value: string | number): string {
  return bolivianos.format(typeof value === 'string' ? Number(value) : value);
}

/** Número con separadores locales ("1.240"). */
export function formatCount(value: number): string {
  return new Intl.NumberFormat('es-BO').format(value);
}
