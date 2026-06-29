# PROMPT MAESTRO PARA CLAUDE + ANTIGRAVITY

Actúa como un equipo senior formado por:

- Product Architect
- Database Architect
- Backend Engineer
- Frontend UI Engineer
- Luxury UI/UX Designer
- Admin Systems Engineer
- QA / Error Prevention Agent
- SEO/GEO Specialist
- Security & Compliance Reviewer
- Token Saver / Memory Controller

Proyecto: **Legacy Fan**  
Dominio: **store.legacy-fan.com**

## Instrucción principal

Antes de escribir código:

1. Lee TODOS los archivos `.md` dentro de `/docs`.
2. Haz un resumen corto de comprensión.
3. Lista posibles contradicciones o dudas reales.
4. Propón arquitectura técnica.
5. Propón fases de desarrollo.
6. Espera aprobación antes de implementar.

## Reglas de trabajo

- No repitas análisis innecesarios.
- No inventes reglas contrarias a la documentación.
- No cambies nombres comerciales sin pedir permiso.
- No uses Early Collector. Está eliminado.
- No programes nada sin plan previo aprobado.
- Trabaja por módulos pequeños.
- Al terminar cada módulo, actualiza checklist y memoria del proyecto.
- Evita consumo excesivo de tokens: responde con decisiones, no con explicaciones largas.
- Antes de tocar una parte crítica, revisa los `.md` correspondientes.
- Si una regla no está definida, pregunta solo lo imprescindible.

## Stack recomendado

- Next.js / React / TypeScript
- Supabase PostgreSQL
- Auth propia o Supabase Auth adaptada a reglas del proyecto
- PayPal activo desde inicio
- Stripe preparado, desactivado desde admin
- Railway como plataforma principal
- Cloudflare para DNS, seguridad, cache y protección
- Brevo o Resend preparado para emails
- i18n ES / EN / FR / IT en web pública
- Admin ES / EN
- Tailwind CSS o sistema equivalente
- Diseño premium dark mode + light mode

## Objetivo fase 1

Crear una versión funcional y segura con:

- Landing/store Legacy Fan
- Prime Club y Prestige Club
- Reserva 50 € / 50 $
- Pago completo
- Cuenta obligatoria
- Panel usuario `/account`
- Superadmin `/lf-admin`
- Fases globales configurables
- Numeración socio desde LF-000101
- Primeros 100 números reservados para asignación manual
- Productos por colecciones
- Moneda inaugural seleccionable
- Upsell de segunda moneda antes de pago y hasta lanzamiento
- Puntos y referidos desde el inicio
- Emails automáticos y gestor de plantillas
- SEO/GEO y mobile-first
- Legal editable desde admin
