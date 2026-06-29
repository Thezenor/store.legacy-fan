# CHANGELOG — Legacy Fan

## [Sin publicar]

### Fase 0 — Cimientos (2026-06-29)
- Scaffolding Next.js 15 + TypeScript + Tailwind (modo oscuro por defecto + toggle).
- Schema Prisma completo con las entidades del doc 13 e invariantes de negocio.
- Seed: roles, planes Prime/Prestige con fases y precios (doc 02), ajustes del sistema,
  bloque reservado de números de socio 1–100, disclaimer legal multiidioma.
- i18n con next-intl (ES/EN/FR/IT), rutas localizadas, middleware.
- Auth.js base (credenciales, email único, adaptador Prisma).
- Capas de abstracción de pagos (PayPal activo / Stripe desactivado) y email (Resend/console).
- Layout base mobile-first, theme toggle, home + landing `/club` + Prime/Prestige.
- SEO: robots.txt, sitemap con hreflang, redirección Early Collector → /club.
- Documentos de memoria del proyecto.

### Seguridad
- Actualizado Next.js 15.1.4 → **15.5.19** (corrige CVE-2025-66478). Typecheck + build OK.

### Base de datos
- Migración baseline `0_init` (39 tablas) aplicada a Railway + seed verificado.

### Fase 1 · Módulo 1 — Auth completo
- Registro (nombre, apellidos, teléfono, país, email, contraseña, términos, divisa preferida),
  login, logout, recuperación y reset de contraseña.
- Verificación de email **obligatoria antes de comprar** (D-009): tokens de un solo uso,
  reenvío, gating `requireVerifiedUser`.
- Rate limiting en memoria (D-010) en login/registro/forgot/reenvío.
- Emails transaccionales (verificación, reset) multiidioma vía capa EmailProvider.
- UI mobile-first i18n (ES/EN/FR/IT): /login /register /forgot-password /reset-password
  /verify-email, header consciente de sesión, panel /account mínimo.
- Typecheck + build OK (45 páginas).

### Fase 1 · Módulo 2 — Motor comercial
- `src/lib/commerce`: fuente única de configuración comercial (nada hardcodeado, doc 18).
- Acceso tipado a `SystemSetting` memoizado por request (con defaults de resiliencia).
- Resolución de **fase activa** por club: override forzado del admin → ventana de fechas → isActive → fallback.
- Pricing por club/divisa (`getClubPricing`) y términos de reserva con caducidad/reembolso (`getReservationTerms`).
- Formato de dinero en céntimos → EUR/USD por locale (`Intl.NumberFormat`).
- Precio de fase activa + reserva mostrados en páginas Prime/Prestige. Verificado contra BD: Prime 149 €/$179, Prestige 599 €/$699, reserva 50 €.
