# Legacy Fan — Pack de documentación para Claude + Antigravity

Proyecto: **Legacy Fan**  
Dominio de trabajo: **store.legacy-fan.com**  
Objetivo: construir desde cero una web/store mobile-first para vender membresías Legacy Prime Club y Legacy Prestige Club, gestionar reservas, pagos, socios, productos, puntos, referidos, certificados, envíos parciales, contenidos privados y superadmin.

## Cómo usar este pack

1. Crear un proyecto nuevo en Claude / Antigravity.
2. Copiar toda esta carpeta `/docs` dentro del repositorio.
3. Pegar el prompt de `prompts/CLAUDE_START_PROMPT.md`.
4. Claude debe leer primero todos los `.md`, detectar contradicciones y proponer arquitectura.
5. No debe programar hasta que confirme el plan técnico y las fases.

## Reglas críticas

- No existe Early Collector. Todo eso se sustituye por **Legacy Fan Club**.
- La web se llama **Legacy Fan** y se monta en `store.legacy-fan.com`.
- Mobile-first y SEO/GEO desde el inicio.
- Modo oscuro por defecto con botón de modo claro.
- Superadmin en `/lf-admin`.
- Panel usuario en `/account`.
- Cuenta obligatoria para comprar o reservar.
- Número de socio solo con membresía pagada completa.
- Reservas de 50 € / 50 $ no asignan número de socio.
- PayPal activo de inicio. Stripe preparado, pero desactivado.
- Railway como plataforma principal cuando sea viable.
