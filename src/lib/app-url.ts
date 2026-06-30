// URL pública de la app, usada para construir enlaces absolutos (retorno de
// PayPal, emails, etc.). OJO: NEXT_PUBLIC_APP_URL se "congela" en el build, así
// que admitimos respaldos leídos en RUNTIME (AUTH_URL / NEXTAUTH_URL) para no
// quedarnos en localhost si esa variable no estaba presente al compilar.
export function appUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000';
  return raw.replace(/\/+$/, ''); // sin barra(s) final(es)
}
