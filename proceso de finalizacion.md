# Proceso de Finalización — Pendientes y Pasos a Seguir

Este documento centraliza los pendientes críticos y los pasos recomendados para llevar la aplicación a una versión de producción segura y consistente.

## Resumen rápido (prioridad)
- P0 (Crítico): Evitar fuga/exposición o corrupción de credenciales y asegurar autorización en APIs.
- P1 (Alto): Normalizar roles, centralizar autorización y añadir validaciones en endpoints.
- P2 (Medio): Harden uploads, sanitización de datos y tests automáticos.
- P3 (Bajo): Limpieza de logs, mejoras menores y documentación.

---

## Pendientes detallados (ordenados por prioridad)

### P0 — Crítico (arreglar antes de producción)
1. Proteger y sanear endpoints de usuarios:
   - `src/app/api/users/route.ts` (GET): no devolver `password` ni campos sensibles.
   - `src/app/api/users/[id]/route.ts` (GET): seleccionar solo `id, username, email, role`.
   - `src/app/api/users/[id]/route.ts` (PUT): validar entrada con Zod, si `password` viene -> hash (bcrypt) antes de guardar.
   - Exigir autenticación + permiso `admin` para estas operaciones.
2. Requerir autorización en APIs críticas. Actualmente `src/middleware.ts` protege la UI pero excluye `/api`.
   - Implementar controles `requireAuth`/`requirePermission` en handlers de server o ampliar `middleware` para incluir `/api`.
3. Revisar `getServerUser` DEV override: asegurar que sólo opere en entornos de desarrollo y/o con flag explicita `ENABLE_DEV_SUPERADMIN`.

### P1 — Alto
4. Normalizar valores de roles (contrato): elegir tokens canónicos (recomendado: `admin`, `user`, `viewer`, `assigner`) y mapear entradas existentes.
5. Implementar helper central `src/lib/api-auth.ts` con funciones reutilizables:
   - `requireAuth(request)` -> retorna session o lanza/retorna 401.
   - `requireAdmin(request)` / `requirePermission(request, perm)`.
6. Implementar validación con Zod en todos los handlers que escriben a la BD (evitar `data: body` directo en Prisma).
7. Implementar `getUserIdFromRequest` o usar `getServerUser` para pasar `userId` a `role-middleware`.

### P2 — Medio
8. Hardening de uploads: validar MIME/extension, limitar tamaño, sanitizar nombres y evitar path traversal.
9. Revisar report endpoints para no devolver información innecesaria según role.
10. Añadir tests básicos: creación usuario (hash), autorización 401/403 para endpoints críticos, asignaciones transaccionales.

### P3 — Bajo
11. Quitar logs con PII (ej. `console.log(body)` en handlers de producción)
12. Documentar RBAC en `AGENTS.md` o `docs/RBAC_README.md` con ejemplos y mapeo de permisos.

---

## Pasos recomendados (acciones concretas y comandos)

1) Parche rápido (P0) — recomendado aplicar inmediatamente
- Cambios mínimos:
  - `src/app/api/users/route.ts` -> usar `select` para omitir `password`.
  - `src/app/api/users/[id]/route.ts` -> `select` y añadir guard admin básico.
  - `src/app/api/users/[id]/route.ts` (PUT) -> validar con Zod y hash si `password` aparece.
- Verificar tipos:

```powershell
npx tsc --noEmit
npm run lint
```

2) Implementar autorización central (P1)
- Crear `src/lib/api-auth.ts` con `requireAuth` y `isAdmin` y usarlo en endpoints sensibles.
- Migrar endpoints críticos (`users`, `asignaciones`, `equipos`, `empresas`, `ubicaciones`) a usarlos.

3) Normalizar roles (P1)
- Añadir validación en creación/actualización de usuarios. Opcional: script de migración (ej. `scripts/normalize-roles.ts`) para convertir valores existentes.

4) Harden uploads y datos (P2)
- Validar tamaño y tipo, guardar con `uuid + ext`, limitar extensiones aceptadas y detectar contenido malicioso.

5) Tests y CI (P2)
- Añadir tests unitarios e integrar checks básicos en CI: `npx tsc --noEmit`, `npm run lint`, y tests.

6) Limpieza final (P3)
- Revisar logs, documentar cambios en `AGENTS.md` y `README.md`.

---

## Checklist de acciones que puedes marcar como completadas
- [ ] Aplicar parche P0 en usuarios (GET/PUT) y ejecutar TypeScript check.
- [ ] Implementar `src/lib/api-auth.ts` y usarlo en endpoints críticos.
- [ ] Normalizar roles y crear script de migración si se decide un cambio en BD.
- [ ] Harden de uploads.
- [ ] Agregar tests y CI checks.
- [ ] Revisar y remover logs con PII.
- [ ] Actualizar `AGENTS.md` con la definición final de RBAC.

---

## Siguientes pasos (si quieres que los aplique ahora)
- Opción 1 (rápida y recomendada): Aplico el parche P0 (ocultar passwords en GET users, proteger GET/PUT user con guard admin y añadir hashing en PUT). Luego ejecuto `npx tsc --noEmit` y te muestro resultados.
- Opción 2: Implemento `requireAuth` + cambio en `asignaciones` y `users`.
- Opción 3: Sólo documentar y dejar las acciones para que las apliques tú.

Dime cuál opción quieres que ejecute y procedo con los cambios y las comprobaciones automáticas.

---

## Cambios aplicados (estado: ejecución automática)

Resumen de lo que ya se aplicó en esta sesión:

- Centralización de RBAC:
   - Se añadió `src/lib/permissions.ts` con el mapeo rol → permisos.
   - Se añadió `src/lib/role-middleware.ts` con helpers: `requirePermission`, `requireAnyPermission`, `requireAllPermissions`, `getUserIdFromRequest`.
- Normalización de sesión:
   - `getServerUser` ahora normaliza `role` y expone `permissions` en la sesión objeto.
- Parche de endpoints:
   - Se sustituyeron controles ad-hoc (`requireAdmin`, checks directos de role) por llamadas tempranas a `requirePermission` / `requireAnyPermission` en los handlers de `src/app/api/**` (batches aplicados iterativamente).
   - Ejemplos editados: `usuarios/[id]/route.ts`, `usuarios/route.ts`, `equipos/*` (asignar, cambiarEstado), `empresas/*`, `marcas/*`, `departamentos/*`, `ubicaciones/*`, `historial/*`, `upload/images` y muchos otros.
- Scripts y validación:
   - `scripts/create-default-users.ts` fue usado para upsert de usuarios `admin`, `editor`, `viewer` con contraseñas temporales.
   - `scripts/smoke-tests.js` se ejecutó autenticándose como `admin` y validó endpoints críticos.

Resultados de validación ejecutados hoy:

- Smoke-tests (admin): PASS — autenticación y verificación de una lista de endpoints (GET/POST) completada; 200s recibidos para endpoints protegidos cuando se usa admin.
- Typecheck (tsc): se ejecutó en el flujo de trabajo; no se reportaron errores críticos durante las iteraciones de parche (si deseas, ejecuto `npx tsc --noEmit` de nuevo y te pego la salida completa).

Notas y decisiones realizadas durante la ejecución:

- Política por defecto usada para recursos:
   - View -> `canView`
   - Create -> `canCreate`
   - Update -> `canUpdate` (o `canManage*` específico cuando aplica)
   - Delete -> `canDelete` (o `canManage*` específico cuando aplica)
   - Assignments -> `canAssign` / `canManageAsignaciones`
   - Audit logs -> `canViewAuditLogs`
- Upload endpoints fueron protegidos con `canCreate`.

---

## Próximos pasos recomendados (post-ejecución)

1. Ejecutar pruebas end-to-end con datos reales y revisar permisos en frontend (especialmente botones/acciones que pueden estar visibles aunque backend bloquee).  
2. Añadir pruebas automáticas que verifiquen 401/403 para usuarios sin permisos (esto evitará regresiones).  
3. Revisar `auth/reset-password` y validaciones de token (casos donde se compara `role === 'Admin'` deben normalizarse a minusculas o usar helpers).  
4. Decidir política final para uploads (servir vía `/api/uploads` vs `/uploads`) y normalizar la DB.  
5. Añadir CI job que ejecute: `npx tsc --noEmit`, linter, y smoke-tests (con credenciales seguras en CI).

Si quieres, aplico los próximos pasos 1–3 automáticamente ahora; dime cuál de ellos priorizamos y lo inicio en batches de 4–6 archivos/tests como antes.
