import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { getDisplayCurrency } from '@/lib/commerce/currency';
import { startFullPayment } from '@/lib/checkout/full-payment';
import { appUrl } from '@/lib/app-url';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function accountUrl(locale: string, qs: string): string {
  const prefix = locale && locale !== 'es' ? `/${locale}` : '';
  return `${appUrl()}${prefix}/account?${qs}`;
}

/**
 * Inicia el pago del RESTANTE de una reserva (pago completo) y redirige a
 * PayPal con una navegación normal (303). Se usa desde el panel del socio en
 * lugar de una server action: la redirección clásica es inmune a fallos del
 * canal RSC (proxies/Cloudflare que corrompen la respuesta de la acción, o
 * cliente de un build anterior) que provocaban "Application error" al pulsar.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const club = String(form?.get('club') ?? '').trim();
  const locale = String(form?.get('locale') ?? 'es');

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(accountUrl(locale, 'error=unauthenticated'), 303);
  }
  if (!club) return NextResponse.redirect(accountUrl(locale, 'error=1'), 303);

  try {
    const currency = await getDisplayCurrency();
    const { approveUrl } = await startFullPayment({
      userId: session.user.id,
      club,
      currency,
      locale,
    });
    return NextResponse.redirect(approveUrl, 303);
  } catch (e) {
    const code = e instanceof Error && e.message === 'already_member' ? 'already_member' : '1';
    console.error('[checkout/full/start] error:', e instanceof Error ? e.message : e);
    return NextResponse.redirect(accountUrl(locale, `error=${code}`), 303);
  }
}
