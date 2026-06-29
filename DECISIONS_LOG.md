# DECISIONS_LOG — Legacy Fan

Registro de decisiones técnicas y de negocio. No cambiar reglas sin aprobación.

## 2026-06-29

- **D-001 Stack:** Next.js 15 + Tailwind + PostgreSQL(Railway) + Prisma + Auth.js. Descartado Supabase. *Motivo:* "Railway como plataforma principal".
- **D-002 Pagos:** PayPal activo desde inicio; Stripe implementado tras interface común pero desactivado por flag (`PAYMENTS_STRIPE_ENABLED`).
- **D-003 Email:** capa de abstracción `EmailProvider`; implementación inicial Resend (`EMAIL_PROVIDER=resend`).
- **D-004 Upsell 2ª moneda:** solo Prestige (`upsell.second_coin.enabled_prestige=true`, prime=false).
- **D-005 Divisa:** selección manual del usuario (campo `UserProfile.preferredCurrency`); sin detección GEO de divisa.
- **D-006 Reserva:** única de 50 €/$ genérica; el club se confirma en el pago completo (`Reservation.club` nullable).
- **D-007 i18n:** `localePrefix: 'as-needed'` (es sin prefijo; /en, /fr, /it con prefijo).
- **D-008 Numeración:** enteros con `formatted` LF-000000; 1–100 sembrados como `isReserved`.

## Pendientes de confirmar
- Proveedor de email definitivo (Resend asumido).
- Almacenamiento de imágenes/certificados (Railway volume vs Cloudflare R2) — se decidirá en Fase 1.
- Serie/numeración fiscal de facturas (placeholder `LF`).
