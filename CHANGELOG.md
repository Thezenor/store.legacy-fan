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
