import type { PaymentStatus, MemberStatus, OrderItemStatus } from '@prisma/client';

/**
 * Máquina de estados centralizada (doc 07). Define las transiciones permitidas
 * para validar cambios de estado de forma consistente en toda la app.
 */
const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  RESERVA_PENDIENTE: ['PENDIENTE_DE_PAGO', 'PAGO_COMPLETO', 'RESERVA_CADUCADA', 'CANCELADO', 'REEMBOLSADO'],
  PENDIENTE_DE_PAGO: ['PAGO_COMPLETO', 'RESERVA_PENDIENTE', 'CANCELADO', 'RESERVA_CADUCADA', 'INCIDENCIA'],
  PAGO_COMPLETO: ['REEMBOLSADO', 'INCIDENCIA'],
  RESERVA_CADUCADA: ['PENDIENTE_DE_PAGO'],
  CANCELADO: [],
  REEMBOLSADO: [],
  INCIDENCIA: ['PAGO_COMPLETO', 'REEMBOLSADO', 'CANCELADO'],
};

const MEMBER_TRANSITIONS: Record<MemberStatus, MemberStatus[]> = {
  CUENTA_CREADA: ['RESERVA_PENDIENTE', 'SOCIO_ACTIVO'],
  RESERVA_PENDIENTE: ['SOCIO_ACTIVO', 'SOCIO_SUSPENDIDO'],
  SOCIO_ACTIVO: ['UPGRADE_PENDIENTE', 'SOCIO_CADUCADO', 'SOCIO_SUSPENDIDO'],
  UPGRADE_PENDIENTE: ['UPGRADE_COMPLETADO', 'SOCIO_ACTIVO'],
  UPGRADE_COMPLETADO: ['SOCIO_ACTIVO'],
  SOCIO_CADUCADO: ['SOCIO_ACTIVO'],
  SOCIO_SUSPENDIDO: ['SOCIO_ACTIVO'],
};

const ORDER_ITEM_TRANSITIONS: Record<OrderItemStatus, OrderItemStatus[]> = {
  PENDIENTE_DE_LANZAMIENTO: ['PENDIENTE_DE_PRODUCCION', 'CANCELADO'],
  PENDIENTE_DE_PRODUCCION: ['PENDIENTE_DE_RECEPCION', 'CANCELADO'],
  PENDIENTE_DE_RECEPCION: ['EN_PREPARACION', 'INCIDENCIA'],
  EN_PREPARACION: ['ENVIADO_PARCIALMENTE', 'ENVIADO', 'INCIDENCIA'],
  ENVIADO_PARCIALMENTE: ['ENVIADO', 'ENTREGADO', 'INCIDENCIA'],
  ENVIADO: ['ENTREGADO', 'INCIDENCIA'],
  ENTREGADO: ['INCIDENCIA'],
  CANCELADO: [],
  REEMBOLSADO: [],
  INCIDENCIA: ['EN_PREPARACION', 'ENVIADO', 'REEMBOLSADO', 'CANCELADO'],
};

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  return from === to || PAYMENT_TRANSITIONS[from]?.includes(to) || false;
}
export function canTransitionMember(from: MemberStatus, to: MemberStatus): boolean {
  return from === to || MEMBER_TRANSITIONS[from]?.includes(to) || false;
}
export function canTransitionOrderItem(from: OrderItemStatus, to: OrderItemStatus): boolean {
  return from === to || ORDER_ITEM_TRANSITIONS[from]?.includes(to) || false;
}
