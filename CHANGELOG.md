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

### Fase 1 · Módulo 3 — Páginas de conversión
- Landing `/club` con comparativa Prime vs Prestige (precio de fase activa, reserva, "qué incluye").
- Selector de divisa EUR/USD (cookie + server action; preferencia de perfil si hay sesión).
- Páginas Prime/Prestige enriquecidas (beneficios, CTAs, FAQ).
- SEO estructurado JSON-LD: Product/Offer, FAQPage, BreadcrumbList. FAQ multiidioma.
- Stub `/checkout` con gating de compra (M1: requiere email verificado) + resumen de precio (M2).
- Build OK (49 páginas).

### Diseño — Rediseño "menos IA, más original" (auditado con 2 agentes)
- **Tipografía nueva**: fuera Cormorant Garamond + Hanken Grotesk (dúo "IA/plantilla"); entran **Cinzel** (capitales romanas grabadas, ADN de acuñación/medallística) para títulos y **Spectral** (serif editorial) para texto. Auto-alojadas (@fontsource).
- **Oro como filete, no relleno**: eliminado el gradiente dorado en titulares/precios (`text-metal-gold` ahora sólido sobrio); precios en marfil con cifras tabulares; el acento del hero es un filete oro bajo una palabra.
- **Fuera la marquesina** (banner de texto corriendo, cliché IA) → **cartela de especificación estática** numismática (Plata .999 · 2 oz · Tirada 999 · MMXXVI · Ø 38 mm) entre filetes.
- **Moneda acuñada** de verdad: canto estriado, leyenda circular tipográfica, monograma LF y nº de serie grabado, acabado mate (sustituye el radial-gradient 3D genérico).
- **Toques Art Deco**: esquinas biseladas (`.bevel` clip-path), pilares con numeración romana (I·II·III) y filete, números de serie como motivo recurrente (clase `.serial` en cobre), bullets ✓ → filete metálico, hero editorial asimétrico (sin glow de esquina), botones oro sólido (sin gradiente+brightness).

### Diseño — Auditoría y correcciones responsive (escritorio + móvil)
- Auditoría con 4 agentes en paralelo (chrome, home/club, auth/checkout/account, admin).
- Global: `overflow-x-hidden` en body (elimina scroll horizontal de los márgenes negativos).
- Chrome: bug del panel de menú móvil (`top-[68px]`→`top-full`), logo responsive (17→21px), header con gaps/padding adaptados, targets táctiles ≥40px (hamburguesa, toggle, auth-nav).
- Home/club: titular `clamp` con balance, pilares 1→2→3 col, comparativa apila hasta `lg`, precios `text-3xl sm:text-4xl`, cabeceras Prime/Prestige apilan en móvil, switcher táctil.
- Account/checkout: grids `grid-cols-1 sm:grid-cols-2/3`, listas con truncado (`min-w-0 truncate`/`shrink-0`), carnet con nombre truncado sin solape.
- Admin: nav móvil con scroll contenido, email truncado, inputs `w-full sm:w-*`.
- Verificado: build OK (62 págs) y rutas sirviendo 200.

### Diseño — Sistema visual de marca (handoff hi-fi + carnet Art Deco)
- Fuentes reales auto-alojadas: Cormorant Garamond (display) + Hanken Grotesk (UI) vía @fontsource.
- Tokens hi-fi: negro mate #08080a, texto #f2f0ea/#9a978f, oro label #c8a24b / texto #e6c878 / gradiente, metales plata/cobre, colores de estado.
- Componentes de marca: `Wordmark` (sello metálico + LEGACY FAN), `ArtDecoMotif` (arco solar + cuñas metálicas, inspirado en el carnet), clase `.eyebrow` y `.text-metal-gold`.
- Header con wordmark (chrome 68px), footer con disclaimer + dirección legal (Dover) + © Legacy Fan.
- Hero home rediseñado (eyebrow, titular Cormorant, emblema, marquesina de valores), CTAs con gradiente oro, tarjetas de plan y bloque de precio actualizados.
- Pulido: marquesina infinita animada (CSS, respeta reduce-motion), 3 pilares de valor en home, **carnet digital Art Deco** en /account (réplica del carnet físico con nº de socio; vista previa atenuada para reservas), hover dorado en tarjetas de plan.
- **Fidelidad al prototipo** (spec extraído con subagente del handoff): logo recreado "LEGACY FAN + filete dorado + PRECIOUS METALS"; header 74px con nav centrado title-case (13px, tracking 0.04em, oro activo); Hero A·Split con **moneda metálica** (radial plata + doble sombra), eyebrow 0.34em, titular Cormorant 76px con acento dorado en italic, CTAs exactos (gradiente 135deg, radius 4px); marquesina Cormorant 17px sobre #0b0b0d. Verificado por render. Early Collector excluido (regla maestra).

### Navegación — Menú superior alineado al sitio corporativo
- Menú con desplegable **El Club** (Prime · Prestige · Comparar) + **Colecciones** (nuestra) + enlaces al sitio corporativo: **Punto de venta · Distribuidor · Founders · Trabaja con nosotros** (en pestaña nueva). **Early Collector excluido** (regla maestra).
- `MainNav` reescrito: soporta ítems internos, externos y desplegables (desktop hover/focus, móvil expandible).
- **Página pública `/colecciones`** con las colecciones (World Peace, Sacred Blessings, Legends of War, Top Sports), cada una con su moneda y estado; sitemap ampliado.

### Superadmin v2 (tanda 2) — clubs y pasarelas
- **Gestión de Clubs** `/lf-admin/clubs`: activar/desactivar (muestra u oculta el club en la web), editar nombre/lema, y **lanzamiento y reserva propios por club** (con respaldo a los globales). Migración `club_config` aplicada.
- El motor comercial usa la **reserva y el lanzamiento por club**; las páginas Prime/Prestige y la comparativa **ocultan los clubs inactivos**.
- **Fases y precios** movido al final del menú (se publica poco).
- **Pasarelas**: estado de credenciales PayPal (variables de entorno) visible en Configuración; las API keys viven en el entorno (seguro), no en BD.

### Superadmin v2 (tanda 1) — usabilidad y control
- **Sidebar** resalta la sección activa (borde + fondo oro).
- **Ficha de socio** completa: datos personales/dirección, pagos (con **ID de PayPal**) e factura, reservas, pedidos+envíos, histórico de puntos, referidos, y acciones (club/estado, ajuste de saldo, reset contraseña, bloqueo).
- **Reservas y pagos**: el email enlaza a la ficha del socio; columna **ID de pago (PayPal)**.
- **Numeración**: formulario de **alta manual** del socio reservado en la propia sección.
- **Legal**: maestro-detalle (lista → editar una página) en vez de todo en una página.
- **Dashboard**: más KPIs (productos, colecciones), **gráfico de ventas** (6 meses) y socios recientes enlazados.
- **Emails**: títulos legibles por sección + **vista previa** del email tal como lo recibe el cliente (ES/EN/FR/IT).
- **Pedidos**: lista + **detalle por pedido** (nº, datos del cliente, dirección de envío, gestión de estados y envío con tracking).

### Fase 1 · Módulo 10 — Superadmin completo
- **Detalle de socio** `/lf-admin/socios/[id]`: cambiar club/estado, ajustar saldo/puntos (transacción auditada), restablecer contraseña, ver datos relacionados.
- **Reembolsos** en pagos (estado interno + auditoría; devolución PayPal real al activar pasarela).
- **FAQ** CRUD, **SEO/GEO** (metatítulos/descr./keywords por ruta e idioma), **Roles** (asignar/quitar rol a usuario por email).
- **Pedidos y envíos**: cambiar estado logístico por item + crear envío con tracking.
- **Modo mantenimiento**: si está activo, solo los admin ven la web (resto ve aviso).
- Menú admin ampliado. Build OK.
- **Configuración del sistema** `/lf-admin/config`: panel agrupado y usable (empresa/fiscal, lanzamiento, pasarelas PayPal/Stripe + modo, reserva, puntos/upsell, mantenimiento) en un solo formulario.
- **Numeración de socios** `/lf-admin/numeracion`: rejilla de reservados 1–100 (bloquear/activar), tabla de asignados.
- **Logs de email** en la sección Emails; **borrado** de productos y colecciones (con guardas de integridad). Build OK (72 páginas, 16 secciones admin).

### Fase 1 · Módulo 11 — Emails gestionables + máquina de estados
- Plantillas de email en BD (seed de 6 esenciales ES/EN), editables desde `/lf-admin/emails` (asunto/cuerpo por idioma, activar/desactivar, **envío de prueba**).
- `renderTemplate`/`sendTemplatedEmail` con interpolación de variables ({{firstName}}, {{amount}}, {{memberNumber}}, {{deadline}}) y registro en EmailLog.
- Máquina de estados centralizada (`src/lib/states.ts`): transiciones permitidas para pagos, socios y items de pedido (doc 07).

### Fase 1 · Módulo 10 (base) — Superadmin /lf-admin
- Gate RBAC (`requireAdmin`) por roles con bootstrap por `SUPERADMIN_EMAILS` (acceso inicial antes de asignar roles).
- Layout admin propio (sidebar 248px, no localizado, noindex) + dashboard con KPIs (socios activos, reservas, pagos, ingresos).
- Listados (solo lectura): socios, reservas y pagos, auditoría.
- **Edición**: fases y precios (EUR/USD + activar/forzar estado), ajustes del sistema (valor JSON) y páginas legales (ES/EN), con auditoría y revalidación. Server actions protegidas por gate admin.
- **Productos y colecciones**: crear/editar colecciones (estado) y productos (precios, premium, incluido en Prime/Prestige, moneda inaugural, disponible/visible). Habilita productos incluidos en pedidos (M6) y el upsell inaugural (M7).
- **Gestión de socios**: crear socio manualmente (doc 04: usuario existente + club + número reservado 1–100, con código de referido y auditoría) y bloquear/desbloquear usuarios. Verificado contra BD.

### Fase 1 · Módulo 12 (parcial) — SEO y legal
- Páginas legales editables (ruta `/legal/[slug]` con fallback de idioma) + seed de términos, privacidad, cookies, envíos, devoluciones, membresía, puntos, referidos.
- Enlaces legales en el footer; sitemap ampliado con las legales. (GEO por región queda preparado vía SeoMetadata.)

### Fase 1 · Módulo 8 — Referidos y puntos
- Código de referido único por socio (`ensureReferralCode`, generado al activar la membresía).
- Captura de referido en el registro (`?ref=CODE` → relación REGISTRADO); recompensa al pago completo del referido (M6) según modalidad.
- Resúmenes para el panel: puntos/saldo con histórico y estadísticas de referidos (registrados, conversión, saldo generado).

### Fase 1 · Módulo 9 — Panel /account completo
- Secciones (doc 08): resumen (club, nº socio, fechas), mi membresía, mis productos con estado, comunidad, puntos/saldo con movimientos, referidos (código/enlace/stats), pedidos y facturas, perfil.
- Carnet digital para socios; panel de reserva con "pagar restante" para reservas pendientes.

### Fase 1 · Módulo 6 — Pago completo (código-completo, sin probar)
- `startFullPayment` (descuenta automáticamente la reserva si existe) + `captureFullPaymentByOrder` con PayPal (intent=full en el retorno).
- Al capturar, en una sola transacción: club definitivo, número de socio (M5), pedido con productos incluidos, factura con serie, puntos sobre premium y recompensa de referido. Idempotente.
- Botón "Pagar y unirme" en /checkout (join) y "pagar restante" en /account. Email de bienvenida con número de socio. Build OK.

### Fase 1 · Módulo 5 — Numeración de socios
- Servicio atómico de número de socio `LF-000101+` con advisory lock de Postgres (sin duplicados ni condiciones de carrera), idempotente y conservando el número en upgrade Prime→Prestige; respeta los 1–100 reservados.
- `activateMembership` (transaccional, márgenes amplios) que crea/activa la membresía, calcula duración 12 meses (lanzamiento o pago) y asigna número; con auditoría. Lo usará el pago completo (M6).
- Verificado contra BD: 6 asignaciones concurrentes → 101–106 únicas y contiguas, reservados intactos.

### Fase 1 · Módulo 4 — Checkout de reserva + PayPal (código-completo, sin probar)
- `PayPalProvider` real: OAuth client_credentials, crear/capturar orden (Orders v2), verificación de webhook. Sandbox/live por `PAYPAL_MODE`.
- Servicio de reserva: crea `Reservation` (50 €/$ genérica, club preseleccionado no vinculante) + `Payment` PayPal; captura idempotente; regla 1 email = 1 reserva/membresía activa (doc 03).
- Rutas: `/api/checkout/paypal/return` (captura + email), `/cancel`, `/api/webhooks/paypal` (verifica firma + reconcilia, idempotente).
- Email "reserva recibida" multiidioma. Botón de pago en `/checkout` (tipo reserva) con gating D-009. Panel de reserva en `/account` (pagado/restante, sin número de socio).
- Auditoría de captura/reconciliación. Build OK (52 páginas). **Pendiente de credenciales sandbox para probar pagos reales.**
