// Etiquetas legibles (ES) de los estados que se guardan como enum en BD, para no
// mostrarlos "en crudo" (p. ej. SOCIO_ACTIVO) en el panel de administración.

const MEMBER_STATUS: Record<string, string> = {
  CUENTA_CREADA: 'Cuenta creada',
  RESERVA_PENDIENTE: 'Reserva pendiente',
  SOCIO_ACTIVO: 'Socio activo',
  SOCIO_CADUCADO: 'Socio caducado',
  SOCIO_SUSPENDIDO: 'Socio suspendido',
  UPGRADE_PENDIENTE: 'Mejora pendiente',
  UPGRADE_COMPLETADO: 'Mejora completada',
};

const PAYMENT_STATUS: Record<string, string> = {
  RESERVA_PENDIENTE: 'Reserva pendiente',
  PENDIENTE_DE_PAGO: 'Pendiente de pago',
  PAGO_COMPLETO: 'Pago completo',
  RESERVA_CADUCADA: 'Reserva caducada',
  CANCELADO: 'Cancelado',
  REEMBOLSADO: 'Reembolsado',
  INCIDENCIA: 'Incidencia',
};

const SUBSCRIPTION_STATUS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  ACTIVA: 'Activa',
  EN_PRUEBA: 'En prueba',
  PAGO_FALLIDO: 'Pago fallido',
  CANCELADA: 'Cancelada',
  CADUCADA: 'Caducada',
};

const ORDER_ITEM_STATUS: Record<string, string> = {
  PENDIENTE_DE_LANZAMIENTO: 'Pendiente de lanzamiento',
  PENDIENTE_DE_PRODUCCION: 'Pendiente de producción',
  PENDIENTE_DE_RECEPCION: 'Pendiente de recepción',
  EN_PREPARACION: 'En preparación',
  ENVIADO_PARCIALMENTE: 'Enviado parcialmente',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
  REEMBOLSADO: 'Reembolsado',
  INCIDENCIA: 'Incidencia',
};

const SHIPMENT_STATUS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  PREPARANDO: 'Preparando',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  INCIDENCIA: 'Incidencia',
  DEVUELTO: 'Devuelto',
};

const PAYMENT_PROVIDER: Record<string, string> = {
  PAYPAL: 'PayPal',
  STRIPE: 'Stripe',
  MANUAL: 'Manual',
};

/** Genérico: capitaliza el enum si no hay etiqueta específica. */
function fallback(v: string): string {
  const s = v.replaceAll('_', ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const memberStatusLabel = (v: string) => MEMBER_STATUS[v] ?? fallback(v);
export const paymentStatusLabel = (v: string) => PAYMENT_STATUS[v] ?? fallback(v);
export const subscriptionStatusLabel = (v: string) => SUBSCRIPTION_STATUS[v] ?? fallback(v);
export const orderItemStatusLabel = (v: string) => ORDER_ITEM_STATUS[v] ?? fallback(v);
export const shipmentStatusLabel = (v: string) => SHIPMENT_STATUS[v] ?? fallback(v);
export const paymentProviderLabel = (v: string) => PAYMENT_PROVIDER[v] ?? fallback(v);
