# TODO — Legacy Fan

## Fase 0 — Cimientos
- [x] Scaffolding Next.js + TS + Tailwind
- [x] Schema Prisma + seed
- [x] i18n ES/EN/FR/IT
- [x] Auth.js base
- [x] Capas pago/email
- [x] Layout mobile-first + home + /club
- [x] SEO base (robots/sitemap) + redirección Early Collector
- [x] Documentos de memoria
- [x] `npm install` + `prisma generate`
- [x] Migración baseline `0_init` generada y validada offline (39 tablas)
- [x] Conectar `DATABASE_URL` (Railway) + `prisma migrate deploy` + `db:seed` (verificado: 7 roles, 2 planes, 10 fases, 18 settings, 100 nº reservados, disclaimer x4)
- [ ] Deploy inicial en Railway (app)

## Fase 1 — MVP comercial (siguiente, tras validar Fase 0)
- [x] **Módulo 1 — Auth completo**: registro, verificación email (obligatoria pre-compra), reset, rate limiting, logout, /account mínimo, header con sesión
- [x] **Módulo 2 — Motor comercial**: fases/precios/reserva desde BD (fuente única), pricing por club/divisa, precio mostrado en Prime/Prestige
- [ ] Páginas Prime/Prestige con comparativa completa + selector divisa (Módulo 3)
- [ ] Reserva 50 € + checkout PayPal + webhooks
- [ ] Pago completo: club, numeración, productos incluidos, factura
- [ ] Upsell segunda moneda (solo Prestige)
- [ ] Puntos + referidos
- [ ] Panel `/account`
- [ ] Superadmin `/lf-admin`
- [ ] Emails esenciales + máquina de estados
- [ ] SEO técnico completo + GEO + páginas legales
- [ ] QA (doc 17)
