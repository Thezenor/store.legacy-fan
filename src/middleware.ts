import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intl = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const res = intl(req);
  // Atribución last-click del Programa de Embajadores: si la URL trae ?ref=CODE,
  // se guarda en una cookie de 30 días para recuperar el código si el cliente
  // vuelve más tarde. No decide nada por sí sola (la captura real está gateada
  // por ambassador.enabled); solo persiste el último código visto.
  const ref = req.nextUrl.searchParams.get('ref');
  if (ref) {
    const clean = ref.trim().slice(0, 40);
    if (clean) {
      res.cookies.set('lf_ref', clean, {
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
        sameSite: 'lax',
      });
    }
  }
  return res;
}

export const config = {
  // Aplica i18n a todas las rutas excepto API, estáticos, _next y archivos con extensión.
  matcher: ['/((?!api|_next|_vercel|lf-admin|.*\\..*).*)'],
};
