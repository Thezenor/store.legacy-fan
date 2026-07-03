-- Proveedor de pago MANUAL (cobros registrados a mano por el superadmin).
ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'MANUAL';
