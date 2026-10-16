export const roleLabels = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  BRANCH_MANAGER: 'Gerente de sucursal',
  EDITOR: 'Editor de menú',
  OPERATOR: 'Operador de pedidos'
} as const;

export const serviceLabels = {
  PICKUP: 'Recojo',
  DELIVERY: 'Delivery coordinado',
  DINE_IN: 'Consumo en local',
  QR_PAYMENT: 'Pago QR'
} as const;

export const userStatusLabels = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  SUSPENDED: 'Suspendido'
} as const;
export const branchStatusLabels = {
  ACTIVE: 'Activa',
  INACTIVE: 'Inactiva',
  TEMPORARILY_CLOSED: 'Cerrada temporalmente'
} as const;
