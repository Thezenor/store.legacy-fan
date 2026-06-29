# PROJECT_MEMORY — Legacy Fan

Memoria viva del proyecto. Resume estado, stack y reglas para no repetir análisis.

## Identidad
- Web: **Legacy Fan** · Dominio: **store.legacy-fan.com**
- NO existe Early Collector (redirección `/early-collector` → `/club`).
- Oferta: **Legacy Fan Club** con planes **Prime** y **Prestige**. Founders Circle = futuro/privado.

## Stack (aprobado)
- Next.js 15 (App Router, TS, RSC) + Tailwind (dark por defecto, toggle a claro).
- PostgreSQL en **Railway** + Prisma. Auth.js (credenciales, email único).
- Pagos: **PayPal activo**; **Stripe preparado/desactivado** (flag).
- Email: capa abstracción + **Resend** inicial.
- i18n next-intl: público ES/EN/FR/IT; admin ES/EN.
- Hosting Railway + Cloudflare delante.

## Rutas
- Público: `/`, `/club`, `/club/prime`, `/club/prestige`
- Superadmin: `/lf-admin` (Fase 1) · Panel usuario: `/account` (Fase 1)

## Decisiones clave
- Reserva única 50 €/$ genérica; club se confirma en pago completo.
- Upsell 2ª moneda: **solo Prestige**.
- Divisa: **selector manual** (sin GEO de divisa).
- Numeración socio global `LF-000101+`; 1–100 reservados a admin manual; solo pago completo numera.
- Puntos/descuentos **solo sobre premium**, nunca spot. Puntos = saldo interno, caducidad 2 años.
- Referidos = saldo interno no retirable; recompensa solo al pago completo del referido.

## Reglas de oro de desarrollo (doc 18)
- Variables comerciales centralizadas (`SystemSetting`/`MembershipPhase`), nunca hardcodear precios/fechas.
- Lógica de precios única; estados centralizados (enums Prisma).
- Auditar todo cambio crítico (`AuditLog`).
- Trabajar por fases/módulos pequeños; no reescribir si solo hay que modificar.

## Estado actual
- **Fase 0 (cimientos): EN CURSO.** Scaffolding, schema Prisma, seed, i18n, auth base, capas pago/email, layout, SEO.
- Pendiente: validar con `DATABASE_URL` de Railway y `npm install` + migración inicial.
