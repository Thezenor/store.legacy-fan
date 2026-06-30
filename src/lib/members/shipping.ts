import { prisma } from '../prisma';
import type { ShippingAddress } from '../payments/types';

// Guarda la dirección de envío recibida de la pasarela en el perfil del usuario.
// No pisa con valores vacíos; ignora si no hay dirección.
export async function saveShippingToProfile(userId: string, shipping?: ShippingAddress): Promise<void> {
  if (!shipping || !shipping.line1) return;
  await prisma.userProfile
    .update({
      where: { userId },
      data: {
        ...(shipping.name ? { shippingName: shipping.name } : {}),
        addressLine1: shipping.line1,
        addressLine2: shipping.line2 ?? null,
        ...(shipping.city ? { city: shipping.city } : {}),
        ...(shipping.region ? { region: shipping.region } : {}),
        ...(shipping.postalCode ? { postalCode: shipping.postalCode } : {}),
        ...(shipping.country ? { country: shipping.country.toUpperCase().slice(0, 2) } : {}),
      },
    })
    .catch(() => {});
}
