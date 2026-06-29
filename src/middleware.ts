import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Aplica i18n a todas las rutas excepto API, estáticos, _next y archivos con extensión.
  matcher: ['/((?!api|_next|_vercel|lf-admin|.*\\..*).*)'],
};
