PROCESO DE FINALIZACIÓN — RBAC, AUDITORÍA Y P0 FIXES

Resumen rápido

Este documento explica los pasos ya realizados en esta sesión, los comandos para verificar localmente, la checklist para preparar el PR y las acciones recomendadas para desplegar con seguridad.

Objetivos cubiertos en esta sesión

- Centralizar RBAC (roles → permisos) y exponer permisos en la sesión.
- Introducir middleware helpers para verificar permisos en API handlers.
- Instrumentar audit logging para login/logout y añadir un script de verificación.
- Ocultar controles UI (p. ej. "Agregar Empresa") para usuarios sin permisos.
- Permitir que viewers accedan a la página de departamentos (control fino por endpoint).
- Evitar que clientes intenten escribir logs de navegación cuando no tienen permiso (silencia 403s en console).
- Agregar scripts de verificación: `scripts/verify-audit-logs.ts` y `scripts/verify-viewer-access.ts`.

Archivos clave modificados/creados

- src/lib/permissions.ts (nuevo/central)
- src/lib/role-middleware.ts (nuevo/central)
- src/lib/auth-server.ts (sesión normalizada con permissions)
- src/lib/audit-logger.ts (usado por endpoints de auth)
- src/middleware.ts (ajuste: permitir /departamentos a viewers)
- src/hooks/useAuditLogger.tsx (client: evita POST si no tiene permiso)
- src/components/empresas-table.tsx (oculta botón "Agregar Empresa" según permisos)
- scripts/verify-audit-logs.ts (nuevo)
- scripts/verify-viewer-access.ts (nuevo)

Criterios de aceptación (qué confirma que estamos listos)

1. TypeScript y linter pasan: `npx tsc --noEmit` y `npm run lint` deben devolver éxito.
2. Los endpoints críticos siguen rechazando operaciones no autorizadas (401/403).
3. Auditoría registra eventos importantes (login/logout; luego, create/update/delete para recursos críticos cuando instrumentados).
4. UI no muestra controles de escritura a viewers, y el servidor sigue bloqueando escrituras si se manipula el frontend.
5. Scripts de verificación (local) confirman los cambios.

Cómo verificar localmente (PowerShell)

1) Levanta el servidor (si no está todavía):

```powershell
npm run dev
```

2) Verificar TypeScript y linter:

```powershell
npx tsc --noEmit
npm run lint
```

3) Verificar auditoría (login/logout):

```powershell
# Ejecuta con admin credentials env vars si deseas
$env:ADMIN_USERNAME='admin'; $env:ADMIN_PASSWORD='admin123'; npx tsx scripts/verify-audit-logs.ts
```

Salida esperada: login 200, session con permisos, logout 200 y filas de audit log impresas.

4) Verificar viewer UX + permisos:

```powershell
$env:ADMIN_USERNAME='viewer'; $env:ADMIN_PASSWORD='viewer123'; npx tsx scripts/verify-viewer-access.ts
```

Salida esperada: session.role === 'viewer', GET /api/departamentos -> 200, POST /api/empresas -> 401/403 (prohibido).

PR checklist (lo mínimo que debe incluir el PR que resume estos cambios)

- [ ] Descripción clara de la intención del PR y lista de archivos cambiados (breve resumen)
- [ ] Pruebas locales ejecutadas: `npx tsc --noEmit`, `npm run lint` y pasos de smoke-test (adjuntar salida o capturas)
- [ ] Scripts de verificación añadidos o actualizados (ubicación y cómo ejecutarlos)
- [ ] Migraciones de Prisma si se agregaron campos (comando `npx prisma migrate dev --name ...`)
- [ ] Notas de despliegue: variables de entorno nuevas/modificadas, pasos de backup
- [ ] Señalar riesgos y rollback plan (qué tablas/ops to revert)
- [ ] Aprobación de un reviewer con conocimiento de seguridad/DB

Release & deployment checklist

- Backup DB antes de aplicar cambios: exportar o usar herramientas internas.
- Ejecutar migraciones en staging primero y correr smoke-tests.
- Revisar que los env vars (DATABASE_URL, AUTH secrets) estén configurados en entorno de destino.
- Desplegar en ventana de mantenimiento corta; alertar a stakeholders.

Rollback plan

- Si algo falla, revertir el commit/PR y redeploy. Si la migración alteró datos destructivamente, restaurar desde backup.

Próximos pasos que recomiendo (priorizados)

1. Instrumentar CRUD de usuarios para audit logs (logCreate/logUpdate/logDelete) — prioridad alta. (Puedo aplicar en batch: `src/app/api/usuarios/route.ts`, `src/app/api/usuarios/[id]/route.ts`).
2. Instrumentar asignaciones y cambios de estado en equipos (logAssign/logUnassign/logStateChange).
3. Harden uploads (validación MIME/tamaño, rutas, sanitización).
4. Agregar tests automáticos que garanticen 401/403 para usuarios sin permiso.

Si quieres que los aplique ahora

- Dime qué batch priorizas. Recomiendo empezar por usuarios + asignaciones (4–6 archivos). Haré los cambios en pequeños commits, ejecutaré `npx tsc --noEmit` y correré los scripts de verificación.

Notas finales

- Decisión sobre si todos los usuarios deben poder loguear navegación: actualmente el sistema requiere permiso para escribir audit logs; esto evita ruidosos 403 y respeta privacidad. Si quieres trackear todas las visitas, puedo añadir un endpoint separado para pings anónimos con menos detalle.

--
Documento generado: PROCESO_DE_FINALIZACION.md
