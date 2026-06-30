# Despliegue en Railway — Legacy Fan (store.legacy-fan.com)

La app es Next.js 15 + Prisma + PostgreSQL. La base de datos ya
existe en Railway; falta desplegar **el servicio de la app web**.

## 1. Crear el servicio de la app
1. En el proyecto de Railway (el mismo donde está el Postgres) → **New → GitHub Repo**.
2. Elige `Thezenor/store.legacy-fan` (rama `main`). Railway detecta Next.js (Nixpacks).
3. El build usa `npm run build` y el arranque (definido en `railway.json`) es:
   `npx prisma migrate deploy && npm run start` — aplica migraciones y levanta la app.

## 2. Variables de entorno (Service → Variables)
Copia estas variables en el servicio de la app:

```
NODE_ENV=production
# URL pública final del sitio (ajústala al dominio real)
NEXT_PUBLIC_APP_URL=https://store.legacy-fan.com
NEXT_PUBLIC_SITE_NAME=Legacy Fan

# Base de datos: usa la URL INTERNA de Railway (mismo proyecto).
# Referencia al servicio Postgres con la sintaxis de variables de Railway:
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Auth.js (NextAuth)
# OBLIGATORIO y SECRETO. Genera uno propio y NO lo subas al repo:
#   openssl rand -base64 32      (o: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
# Sin AUTH_SECRET, la app NO arranca en producción (fail-fast intencionado).
AUTH_SECRET=__genera_uno_propio_y_pegalo_aqui__
AUTH_URL=https://store.legacy-fan.com
AUTH_TRUST_HOST=true

# Superadmin (acceso a /lf-admin antes de asignar roles)
SUPERADMIN_EMAILS=lopez@karaokemedia.com,admin@legacy-fan.com

# Pagos (PayPal activo; rellenar con credenciales reales/sandbox)
PAYMENTS_PAYPAL_ENABLED=true
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYMENTS_STRIPE_ENABLED=false

# Email (Resend recomendado en producción)
EMAIL_PROVIDER=resend
RESEND_API_KEY=
EMAIL_FROM=Legacy Fan <no-reply@legacy-fan.com>

RATE_LIMIT_ENABLED=true

# Subida de imágenes de producto (apunta al Volume montado, ver paso 6)
UPLOAD_DIR=/data/uploads
```

## 6. Almacenamiento de imágenes (Railway Volume)
Las fotos de producto se guardan en disco y se sirven por `/api/media/...`.
Para que persistan entre despliegues:
1. Servicio de la app → **Settings → Volumes → New Volume**.
2. Mount path: **`/data`**.
3. Variable `UPLOAD_DIR=/data/uploads` (ya incluida arriba).
Sin volumen, las imágenes se pierden en cada redeploy.

> `AUTH_SECRET` de arriba es un valor recién generado; puedes cambiarlo por otro
> (`openssl rand -base64 32`). `AUTH_TRUST_HOST=true` es necesario detrás del proxy de Railway.

## 3. Dominio
- Service → **Settings → Networking → Generate Domain** (te da `*.up.railway.app`), o
- **Custom Domain** → `store.legacy-fan.com` (añade el CNAME que indique Railway en tu DNS).
- Actualiza `NEXT_PUBLIC_APP_URL` y `AUTH_URL` al dominio definitivo y redeploy.

## 4. Tras el primer deploy
- Las migraciones se aplican solas (startCommand). El seed NO se ejecuta en deploy;
  los datos ya están en la BD. Si necesitaras re-sembrar: `railway run npm run db:seed`.
- Cuentas demo ya creadas: `admin@legacy-fan.com` / `Admin1234`, `demo@legacy-fan.com` / `Demo1234`.

## 5. Webhook de PayPal (cuando haya credenciales)
- En el panel de PayPal, apunta el webhook a: `https://store.legacy-fan.com/api/webhooks/paypal`
- Copia el `PAYPAL_WEBHOOK_ID` resultante a las variables.

## Notas
- Cloudflare delante (HTTPS/CDN/WAF) es opcional pero recomendado (doc 15).
- El proxy SSL corporativo solo afecta a tu máquina local, no a Railway.
