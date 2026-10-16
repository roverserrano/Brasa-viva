export function formatBolivianos(value: string | number): string {
  return `Bs ${new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value))}`;
}
export function formatCount(value: number): string {
  return new Intl.NumberFormat('es-BO').format(value);
}
export function formatDashboardDate(value: string): string {
  return new Intl.DateTimeFormat('es-BO', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC'
  }).format(new Date(`${value}T12:00:00Z`));
}
export function comparisonLabel(current: number, previous: number): string {
  if (previous === 0) return current === 0 ? 'Sin variación' : 'Sin base comparable';
  const change = ((current - previous) / previous) * 100;
  return `${change > 0 ? '+' : ''}${change.toFixed(1)}% vs. período anterior`;
}
