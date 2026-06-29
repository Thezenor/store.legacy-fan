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
- [x] **Módulo 3 — Páginas de conversión**: landing /club comparativa, selector divisa EUR/USD, beneficios, FAQ, SEO JSON-LD, stub /checkout con gating
- [x] **Módulo 4** — Reserva 50 € + checkout PayPal + webhooks (CÓDIGO-COMPLETO; falta probar con credenciales sandbox)
- [x] **Módulo 5** — Numeración de socios: servicio atómico LF-000101+ (advisory lock, idempotente, conserva nº en upgrade) + activación de membresía. Verificado sin duplicados bajo concurrencia.
- [x] **Módulo 6** — Pago completo (CÓDIGO-COMPLETO): club, numeración, productos incluidos, factura, puntos, referidos, emails. Falta probar pagos con sandbox.
- [ ] Upsell segunda moneda (solo Prestige) — Módulo 7 (pendiente)
- [x] **Módulo 8** — Puntos + referidos (código por socio, captura en registro, recompensa al pago, resúmenes)
- [x] **Módulo 9** — Panel `/account` completo (resumen, membresía, productos, puntos, referidos, pedidos/facturas, perfil)
- [ ] Superadmin `/lf-admin`
- [ ] Emails esenciales + máquina de estados
- [ ] SEO técnico completo + GEO + páginas legales
- [ ] QA (doc 17)
