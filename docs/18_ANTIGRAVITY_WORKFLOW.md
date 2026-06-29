# 18 — Flujo de trabajo para Antigravity

## Objetivo

Evitar errores, repeticiones y consumo excesivo de tokens.

## Proceso obligatorio

1. Leer documentación.
2. Crear plan.
3. Dividir en tareas pequeñas.
4. Implementar módulo a módulo.
5. Testear cada módulo.
6. Registrar decisiones.
7. No modificar reglas de negocio sin aprobación.

## Memoria del proyecto

Crear/actualizar:

- `PROJECT_MEMORY.md`
- `DECISIONS_LOG.md`
- `CHANGELOG.md`
- `TODO.md`
- `KNOWN_ISSUES.md`

## Reglas

- No reescribir todo si solo hay que modificar un módulo.
- No duplicar lógica de precios.
- Variables comerciales centralizadas.
- Estados centralizados.
- No hardcodear fechas/precios si deben estar en admin.
- Antes de crear nuevo modelo, revisar si ya existe.
- Antes de añadir dependencia, justificarla.
