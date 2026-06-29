import { NextResponse, type NextRequest } from 'next/server';

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// El usuario canceló el pago en PayPal: volver a los planes.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'es';
  const prefix = locale && locale !== 'es' ? `/${locale}` : '';
  return NextResponse.redirect(`${appUrl()}${prefix}/club?canceled=1`);
}
