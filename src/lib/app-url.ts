// URL pública de la app, usada para construir enlaces absolutos (retorno de
// PayPal, enlaces de referido, emails, etc.).
//
// OJO: NEXT_PUBLIC_APP_URL se "congela" en el build. Si se compiló con
// localhost (o quedó vacío), no debe ganar en producción. Por eso NO usamos el
// primer valor disponible, sino el primer candidato que NO sea localhost,
// leyendo también variables de RUNTIME (AUTH_URL / NEXTAUTH_URL / dominio de
// Railway). Solo si todos son locales (dev) devolvemos localhost.
export function appUrl(): string {
  const railway = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : undefined;

  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.AUTH_URL,
    process.env.NEXTAUTH_URL,
    railway,
  ]
    .filter((v): v is string => !!v)
    .map((v) => v.replace(/\/+$/, '')); // sin barra(s) final(es)

  const isLocal = (u: string) => /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(u);

  // Preferimos un candidato real (no localhost) leído en runtime.
  const real = candidates.find((u) => !isLocal(u));
  return real || candidates[0] || 'http://localhost:3000';
}
