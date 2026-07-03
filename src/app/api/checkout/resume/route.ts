import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { resumePendingCheckout } from '@/lib/checkout/reservation';
import { appUrl } from '@/lib/app-url';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function accountUrl(locale: string, qs: string): string {
  const prefix = locale && locale !== 'es' ? `/${locale}` : '';
  return `${appUrl()}${prefix}/account?${qs}`;
}

/**
 * Reanuda un proceso de pago SIN completar (reserva o pago completo iniciado y
 * abandonado): reutiliza la misma reserva y redirige (303) a PayPal para
 * continuar el pago. Navegación clásica (no server action) para ser inmune a la
 * corrupción del canal RSC tras Cloudflare.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const locale = String(form?.get('locale') ?? 'es');

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(accountUrl(locale, 'error=unauthenticated'), 303);
  }

  try {
    const resumed = await resumePendingCheckout({ userId: session.user.id, locale });
    if (resumed?.approveUrl) return NextResponse.redirect(resumed.approveUrl, 303);
    // No había nada pendiente que reanudar: vuelve a los planes.
    const prefix = locale && locale !== 'es' ? `/${locale}` : '';
    return NextResponse.redirect(`${appUrl()}${prefix}/club`, 303);
  } catch (e) {
    console.error('[checkout/resume] error:', e instanceof Error ? e.message : e);
    return NextResponse.redirect(accountUrl(locale, 'error=1'), 303);
  }
}
