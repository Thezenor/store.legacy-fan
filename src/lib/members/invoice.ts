import type { Currency, Prisma } from '@prisma/client';
import { getSetting } from '../commerce/settings';

/**
 * Genera la factura definitiva del pago completo (doc 03): un solo pago/factura
 * final con el total. Numeración por serie configurable (SystemSetting fiscal.invoice_series).
 * La secuencia se calcula dentro de la transacción del pago (volumen bajo).
 */
export async function createInvoice(
  tx: Prisma.TransactionClient,
  opts: { paymentId: string; totalCents: number; currency: Currency; year: number },
) {
  const series = (await getSetting<string>('fiscal.invoice_series')) || 'LF';
  const count = await tx.invoice.count();
  const seq = String(count + 1).padStart(5, '0');
  const number = `${series}-${opts.year}-${seq}`;

  return tx.invoice.create({
    data: {
      paymentId: opts.paymentId,
      number,
      currency: opts.currency,
      subtotalCents: opts.totalCents,
      taxCents: 0,
      totalCents: opts.totalCents,
    },
  });
}
