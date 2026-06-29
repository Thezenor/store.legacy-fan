# 13 — Borrador de base de datos

Diseñar en PostgreSQL/Supabase.

## Entidades principales

- users
- user_profiles
- roles
- permissions
- memberships
- membership_plans
- membership_phases
- reservations
- payments
- invoices
- member_numbers
- collections
- products
- product_translations
- product_images
- orders
- order_items
- shipments
- shipment_items
- certificates
- points_wallets
- points_transactions
- referral_codes
- referrals
- email_templates
- email_jobs
- email_logs
- system_settings
- legal_pages
- faq_items
- seo_metadata
- blog_posts
- audit_logs

## Reglas críticas

- Email único.
- Número socio único.
- Los primeros 100 números reservados.
- Pago completo de club dispara asignación de número.
- Reserva no asigna número.
- Productos incluidos se generan como order_items internos.
- Puntos se generan sobre premium.
- Devoluciones generan transacciones negativas de puntos/saldo.
- Referidos solo activan recompensa con pago completo.
- Certificados con QR único.
- Estados auditables.

## Auditoría

Todo cambio crítico debe registrar:

- usuario/admin que hizo cambio
- fecha/hora
- entidad afectada
- valor anterior
- valor nuevo
- motivo opcional
