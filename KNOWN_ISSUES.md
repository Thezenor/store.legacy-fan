# KNOWN_ISSUES — Legacy Fan

## Abiertas
- **KI-001** Sin `DATABASE_URL` real todavía: las migraciones Prisma y el seed no se han ejecutado contra una BD. Pendiente de credenciales Railway.
- **KI-002** `/lf-admin` y `/account` aún no existen (Fase 1). El middleware ya excluye `/lf-admin` de la i18n pública.
- **KI-003** Métodos de `PayPalProvider`/`StripeProvider` lanzan "implementar en Fase 1": son stubs intencionales del contrato.
- **KI-004** Falta verificación de email real y rate limiting (Fase 1).

- **KI-005 (ENTORNO) Proxy con inspección SSL:** la red corporativa rompe la verificación TLS (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`) contra registry.npmjs.org, binaries.prisma.sh y fonts.googleapis.com. La instalación se completó con `--strict-ssl=false` (autorizado por el usuario, solo para esa instalación). **Fix recomendado:** instalar el CA raíz del proxy y usar `NODE_EXTRA_CA_CERTS`/`--use-system-ca`, o trabajar en red limpia. Railway (deploy) no tiene este problema.
- **KI-006 (SEGURIDAD) next@15.1.4 vulnerable:** CVE-2025-66478. Pendiente de subir a una versión parcheada de la línea 15.x (requiere descarga → red/CA). No bloquea el build local.
- **KI-007 Fuentes con stack del sistema (temporal):** se eliminó `next/font/google` porque el proxy bloquea la descarga de Google Fonts en build/dev. TODO Fase 1: auto-alojar Inter + Cormorant Garamond con `next/font/local`.

## Notas
- Modo oscuro por defecto: el render inicial no añade `.light`; el toggle persiste en localStorage (posible flash en modo claro al recargar; se resolverá con script inline en Fase 1 si molesta).
