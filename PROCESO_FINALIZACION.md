# Proceso de Finalización — Auditoría RBAC & Integridad CRUD

Este documento resume las acciones realizadas durante la auditoría de finalización (roles de acceso, integridad CRUD y limpieza dev), y entrega una checklist priorizada (P0..P3), pasos de verificación y siguientes actividades recomendadas.

## Resumen ejecutivo
- Stack: Next.js (app router) + TypeScript, Prisma (SQL Server), React.
- Autenticación: Cookie-based sessions (custom `getServerUser`).
- RBAC centralizado en: `src/lib/permissions.ts` (nuevo) y usado por `src/lib/role-middleware.ts`.
- Cambios principales aplicados:
  - Ocultamiento y hashing de contraseñas en endpoints de usuarios.
  - Exposición de `session.permissions` derivadas del rol para uso en frontend.
  - Normalización de roles (lowercase canonical values: `admin` / `user`).
  - Ajustes UI: `gestion-de-cuentas` espera a sesión cargada; sidebar agrupa items admin en el footer y los centra para simetría.
  - Backups y limpieza de BD en entorno de desarrollo (scripts en `scripts/`, backup en `scripts/backups/`).

## Contrato (muy corto)
- Inputs: código del repo y base de datos de desarrollo.
- Outputs: checklist completada, cambios aplicados (ya están en el repo), y un plan reproducible para terminar RBAC y permisos granulares.
- Éxitos: TypeScript pasa (`npx tsc --noEmit`), endpoints protegidos críticamente, UI refleja permisos.
- Errores: cualquier endpoint sin protección será listado y priorizado en P0 si expone o modifica datos sensibles.

## Checklist priorizada

P0 (hacer antes de desplegar a staging/producción)
- [x] Revisar y asegurar que ningún endpoint devuelve campos sensibles (passwords, tokens). (Hecho: endpoints de `users` no devuelven password.)
- [x] Forzar hashing de password en creación/actualización y validar entradas (Zod). (Hecho.)
- [x] Asegurar los endpoints admin críticos usan `requirePermission('users.manage')` o equivalente. (Parcial: endpoints críticos cubiertos; ver sección "Tareas pendientes" para cobertura completa.)
- [x] Exponer `session.permissions` derivadas del rol para que el frontend pueda condicionar UI sin inferir roles. (Hecho en `auth-server`.)
- [x] Verificar que `useSession` devuelve status tri-estatal para evitar redirecciones prematuras. (Hecho.)
- [x] Backups: crear backup antes de cualquier limpieza (backup creado y almacenado en `scripts/backups/`). (Hecho.)

P1 (importante, planear e implementar antes de producción plena)
- [ ] Sustituir chequeos inline por `requirePermission()` en todos los endpoints (API). (En progreso — priorizar endpoints que modifican inventario, ubicaciones, empleados y asignaciones.)
- [ ] Añadir tests de integración (smoke tests) que cubran: login admin, listado/creación/edición de usuarios, y un par de endpoints de inventario. (Pendiente.)
- [ ] Documentar y lockear la lógica de DEV override que concede `['*']` permisos (limitar a entornos de desarrollo). (Pendiente, recomendado.)

P2 (mejoras y hardening)
- [ ] Implementar soporte Range/partial-content y Cache-Control + ETag en `/api/uploads/[...path]`.
- [ ] Migración para permisos por usuario (si se requiere granularidad): diseñar tabla `UserPermission` o campo JSON y endpoints para GET/PUT permisos para un usuario. (Plan más abajo.)
- [ ] Añadir UI en `gestion-de-cuentas` para editar permisos por usuario (solo si se implementa la migración). (Pendiente.)

P3 (UX/operacional)
- [ ] Automatizar rollback de backups (script para restaurar backups JSON en orden de FK).
- [ ] Agregar integración CI que ejecuta `npx tsc --noEmit`, linter, y tests (cuando existan).

## Pasos de verificación (local)
1. Typecheck y lint
   - Ejecutar: `npx tsc --noEmit` (ya ejecutado en esta sesión; confirmar en tu máquina).
2. Levantar dev server
   - Ejecutar: `npm install` (si es necesario) y `npm run dev`.
3. Validación manual rápida (smoke):
   - Iniciar sesión como admin (usar dev credentials o crear admin en DB si falta).
   - `/api/auth/session` debe incluir `permissions: string[]` en el payload del usuario.
   - Ir a `/gestion-de-cuentas` y confirmar que la página no redirige mientras el `status` de `useSession()` === 'loading'.
   - Verificar sidebar: en usuario admin, los items “Gestión de Cuentas” y “Historial” deben aparecer en la parte inferior (footer) y el bloque central del footer debe estar alineado/simétrico.
   - Intentar listar/crear/editar usuario vía UI y confirmar que la API no devuelve `password` y que la creación en la BD guarda password hasheado.

## Comandos útiles
- Typecheck: `npx tsc --noEmit`
- Levantar dev: `npm run dev`
- Generar prisma client (si cambias schema): `npx prisma generate`
- Ejecutar scripts (ejemplos en repo):
  - Convertir uploads (dry-run): `npx tsx scripts/convert-uploads-to-api.ts`
  - Limpiar BD (dry-run): `npx tsx scripts/clean-db-leave-admin.ts`
  - Aplicar limpieza: `npx tsx scripts/clean-db-leave-admin.ts --apply`

## Plan de migración para permisos por usuario (opcional, P2)
Objetivo: permitir al admin asignar permisos finos por usuario sin depender solo del rol.

1) Diseño del esquema (prisma)
   - Opción A (tabla normalizada): `UserPermission { id, userId, permissionKey }` (recomendado si habrá muchos permisos individuales y auditoría).
   - Opción B (campo JSON): añadir `permissions Json?` en model `User` (más simple, menos queries).

2) Pasos técnicos
   - Crear migración Prisma (ej: `prisma migrate dev --name add-user-permissions`).
   - `npx prisma generate`
   - Backend: endpoints `GET /api/users/:id/permissions` y `PUT /api/users/:id/permissions` protegidos por `requirePermission('users.manage')`.
   - Auth: `getServerUser` debe mezclar permisos del rol con permisos explícitos del usuario (user-level override allowed/deny policy — definir la política: union vs explicit allow/deny).
   - Frontend: en `gestion-de-cuentas` añadir UI para toggle de permisos, y `usePermissions` debe preferir la lista `session.permissions` (ya soportado).

3) Pruebas
   - Test unitario de migración/seed.
   - Test de API PUT/GET permisos.

## QA / Tests recomendados (mínimo)
- Unit tests: permisos (mapping roles -> permissions), hashing y validación de usuarios.
- Integration: login flow, protective middleware behavior (requests by non-admin must be 403), and a smoke test that creates a user.

## Riesgos y notas
- Asegúrate de que la lógica DEV override que da `['*']` no esté activa en producción; limitar por `NODE_ENV` o variable explícita.
- Normalizar roles en la DB puede romper integraciones externas: revisar scripts/clients que envían rol en mayúsculas o con nombres distintos.
- Migración para permisos por usuario añade complejidad: definir claramente la política (role perms union user perms? user can remove role perms?).

## Siguientes pasos propuestos (mínimos)
1. Completar reemplazo de chequeos inline por `requirePermission()` en todos los endpoints prioritarios (empresas, empleados, equipos, ubicaciones, asignaciones).
2. Implementar 2-3 tests de integración y añadirlos a CI.
3. Decidir e implementar la estrategia de permisos por usuario (si se desea).
4. Revisar y limitar el DEV override para `['*']`.

---
Fecha de generación: 2025-10-27

Si quieres, aplico la migración de permisos por usuario y preparo las APIs/UI necesarias (dime si prefieres Opción A - tabla normalizada - o Opción B - campo JSON en `User`).
