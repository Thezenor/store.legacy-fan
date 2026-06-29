# KNOWN_ISSUES — Legacy Fan

## Abiertas
- **KI-001** Sin `DATABASE_URL` real todavía: las migraciones Prisma y el seed no se han ejecutado contra una BD. Pendiente de credenciales Railway.
- **KI-002** `/lf-admin` y `/account` aún no existen (Fase 1). El middleware ya excluye `/lf-admin` de la i18n pública.
- **KI-003** Métodos de `PayPalProvider`/`StripeProvider` lanzan "implementar en Fase 1": son stubs intencionales del contrato.
- **KI-004** Falta verificación de email real y rate limiting (Fase 1).

- **KI-005 (ENTORNO) Proxy con inspección SSL:** la red corporativa rompe la verificación TLS (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`) contra registry.npmjs.org, binaries.prisma.sh y fonts.googleapis.com. **Solución segura adoptada:** ejecutar npm/node con `NODE_OPTIONS=--use-system-ca` (usa el almacén de certificados de Windows, donde está el CA del proxy; NO baja la seguridad TLS). Además el proxy sirve metadata de npm inconsistente/antigua: usar `--prefer-online` al instalar versiones nuevas. Railway (deploy) no tiene este problema.
- **KI-006 (RESUELTO) next actualizado a 15.5.19:** corrige CVE-2025-66478 (la 15.1.4 era vulnerable). Typecheck + build verificados.
- **KI-008 (ACEPTADO) PostCSS moderate (transitiva de Next):** `npm audit` reporta 3 moderate (GHSA-qx2v-qp2m-jg93) en el postcss que Next empaqueta. No accionable sin romper (el "fix" de npm es downgrade a next@9). Riesgo nulo en nuestro uso (build-time, no procesamos CSS no confiable). Se resolverá al actualizar Next en el futuro.
- **KI-007 Fuentes con stack del sistema (temporal):** se eliminó `next/font/google` porque el proxy bloquea la descarga de Google Fonts en build/dev. TODO Fase 1: auto-alojar Inter + Cormorant Garamond con `next/font/local`.

- **KI-008 (M4) Checkout de reserva sin probar:** la integración PayPal (crear/capturar orden, webhook) está implementada pero NO se ha probado con pagos reales. Falta configurar `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` (sandbox) y `PAYPAL_WEBHOOK_ID`. Sin ellas, el botón "Pagar reserva" devuelve error controlado. Nota: el proxy SSL corporativo también afectaría las llamadas a `api-m.sandbox.paypal.com` en local (usar `--use-system-ca` o probar en Railway).

- **KI-009 (build) prisma:error transitorios en prerender:** al generar estáticamente las páginas que consultan la BD (club Prime/Prestige × 4 idiomas) contra la BD pública de Railway, ocasionalmente aparecen 1–3 `prisma:error` por latencia/concurrencia. No son fatales (el build completa). En Railway (BD interna, baja latencia) no se reproducen. Si molesta, marcar esas páginas con `revalidate` o `dynamic` o limitar la concurrencia de build.

## Notas
- Modo oscuro por defecto: el render inicial no añade `.light`; el toggle persiste en localStorage (posible flash en modo claro al recargar; se resolverá con script inline en Fase 1 si molesta).
