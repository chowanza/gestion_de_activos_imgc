# DEPLOYMENT GUIDE (Producción)

Esta guía explica los pasos para preparar, construir y desplegar la aplicación "gestion_de_activos_imgc" en un servidor/VM. Incluye notas específicas para Windows (PowerShell) y Linux, manejo de Prisma + SQL Server, y pasos para migraciones y rollback relacionados con uploads.

## Resumen rápido
- Pre-requisitos: Node.js (>=18 LTS), npm, SQL Server (o acceso al servidor SQL Server), acceso al repositorio y variables de entorno.
- Pasos principales: configurar `.env`, instalar dependencias, generar Prisma Client, build de Next.js, ejecutar el proceso (PM2 / servicio), configurar reverse proxy (IIS/Nginx/Caddy) y abrir firewall según necesidad.

---

## 1) Requisitos
- Node.js (recomendado 18.x o 20.x LTS)
- npm
- SQL Server accesible desde la VM (puede ser local o remoto)
- Certificado TLS si expones la app por Internet (HTTPS)

En Windows usar PowerShell (esta guía asume PowerShell v5.1 en ejemplos). Para Linux los comandos son equivalentes excepto por la gestión de servicios.

## 2) Variables de entorno (.env)
Colocar un archivo `.env` en la raíz del proyecto. Ejemplo mínimo:

DATABASE_URL="mssql://USER:PASSWORD@HOST:PORT;database=DBNAME;encrypt=true;trustServerCertificate=true"

Notas SQL Server:
- Si tu contraseña o user contiene backslashes o caracteres especiales, escapa/encode según corresponda. En URLs las barras invertidas `\` pueden necesitar encodificado como `%5C`.

Otros valores importantes en `.env` pueden incluir:
- NEXTAUTH_URL o APP_URL (si aplica)
- SESSION_SECRET u otras claves de sesión

## 3) Preparar el servidor (PowerShell)
1. Copia el código al servidor y posiciona en la carpeta del proyecto.
2. En PowerShell ejecuta:

    # Instalar dependencias
    npm install

    # (Opcional) limpiar lock temporal de Prisma si existiera
    if (Test-Path node_modules/.prisma) { Remove-Item -Recurse -Force node_modules/.prisma }

    # Generar Prisma Client
    npx prisma generate

    # Construir (producción)
    npm run build

Si durante `npx prisma generate` aparece un error EPERM relacionado con renombrado de archivos (Windows DLL lock), antes de reintentar:

    # buscar procesos node y detenerlos
    tasklist | findstr node
    Stop-Process -Id <PID> -Force

    # eliminar carpeta temporal de prisma
    if (Test-Path node_modules/.prisma) { Remove-Item -Recurse -Force node_modules/.prisma }

    # volver a generar
    npx prisma generate

Esto fue necesario en este repositorio cuando el proceso Node retenía el archivo `query_engine-windows.dll`.

## 4) Ejecutar la aplicación en producción
- Opción simple (no recomendada para producción):

    npm run start

- Recomendado: usar un process manager (Linux: pm2/systemd; Windows: NSSM o configurar como Windows Service).

Ejemplo con PM2 (Linux):

    npm install -g pm2
    pm2 start npm --name imgc -- start
    pm2 save

En Windows puedes usar NSSM (https://nssm.cc/) para crear un servicio que ejecute `npm run start` o usar el planificador/servicio que prefieras.

### PM2 (recomendado para Linux / también funciona en Windows bajo WSL)

Se incluye un archivo de configuración de PM2 en la raíz del proyecto: `ecosystem.config.js`.

Instalación de PM2 (global):

  npm install -g pm2

Iniciar la aplicación usando el archivo de configuración:

  pm2 start ecosystem.config.js

Guardar la lista de procesos para reinicios del sistema:

  pm2 save

Comandos útiles:

  # Ver estado de procesos
  pm2 status

  # Ver logs
  pm2 logs gestion_activos_imgc

  # Reiniciar
  pm2 restart gestion_activos_imgc

  # Detener
  pm2 stop gestion_activos_imgc

La configuración en `ecosystem.config.js` ejecuta `npm run start` en modo producción y escribe logs locales en `./logs/pm2-*.log`.

## 5) Reverse proxy
Coloca un reverse proxy (Nginx, Caddy, IIS) delante de la app y expón solo el proxy en 80/443. Configura proxy pass a `http://localhost:3000`.

Ejemplo Nginx (snippet):

    server {
      listen 80;
      server_name ejemplo.com;

      location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
      }
    }

Notas de seguridad:
- Configura HTTPS con certificados (Let's Encrypt/Caddy) y fuerza Secure flag en cookies. La app usa cookie-based sessions — si sirves por HTTP en LAN, considera TLS o configurar cookies para permitir LAN use (no recomendable para Internet).

## 6) Migraciones y scripts operativos (uploads)
Este repositorio incluye scripts en `scripts/` para gestionar uploads y migraciones relacionadas.

- Hacer backup de filas afectadas (ya existe backup creado durante la migración que normalizó las rutas):
  - `scripts/backups/affected-uploads-backup-1760705848119.json`

- Comandos disponibles (desde la raíz):
  - Dry-run conversion (no aplica cambios):
      npx tsx scripts/convert-uploads-to-api.ts
  - Aplicar conversión (convierte `/uploads/...` -> `/api/uploads/...`):
      npx tsx scripts/convert-uploads-to-api.ts --apply
  - Hacer backup (guarda JSON en scripts/backups):
      npx tsx scripts/backup-affected-uploads.ts
  - Rollback desde backup (dry-run por defecto):
      npx tsx scripts/rollback-restore-affected-uploads.ts --apply --file scripts/backups/affected-uploads-backup-1760705848119.json

Estas herramientas permiten revertir la migración de rutas de uploads si fuera necesario.

## 7) Notas específicas que surgieron durante el build
- El build ejecutado localmente produjo estas observaciones:
  - `prisma generate` se ejecutó correctamente antes del `next build`.
  - Next.js compiló y generó páginas estáticas; sin embargo, durante la recolección de datos de páginas se reportaron múltiples mensajes del tipo:

    "Dynamic server usage: Route /ruta couldn't be rendered statically because it used `cookies`."

  Esto es esperado cuando las rutas usan `cookies()` o dependencias server-side en tiempo de build. Next.js marcará esas rutas como dinámicas y las renderizará en demanda. No es un error que detenga el build, pero sí una observación operativa.

## 8) Verificación post-despliegue
- Verificar que la página home carga y que los endpoints clave funcionan.
- Probar upload/serve flow (thumbnail/image serving):

PowerShell example:

    # Verificar que el streaming funciona (status 200 o 206 si Range)
    Invoke-WebRequest http://localhost:3000/api/uploads/empresas/<archivo> -UseBasicParsing

Comprobar headers `Accept-Ranges`, `ETag` y que la respuesta es 200 (o 206 si se pide rango).

## 9) Rollback y recuperación
- Si aplicaste la conversión de rutas y necesitas revertir:
  1. Restaurar desde backup JSON usando `scripts/rollback-restore-affected-uploads.ts` (ver arriba).
  2. Si hubo cambios en la base de datos más complejos, restaura desde backup de base de datos/SQL Server.

## 10) Checklist rápido antes de abrir al tráfico
- [. ] `.env` con DATABASE_URL y claves configuradas
- [. ] `npm install` completado sin errores
- [. ] `npx prisma generate` completado
- [. ] `npm run build` completado (ver logs)
- [. ] Proceso en PM2 / Windows Service en ejecución
- [. ] Reverse proxy configurado y HTTPS activo
- [. ] Verificación de uploads: `GET /api/uploads/...` funciona (200/206)

---

Si quieres, puedo:
- Subir este README y hacer el commit aquí mismo.
- Generar un script de Windows (PowerShell) que automatice los pasos de build y despliegue para esta app.
- Preparar un archivo de configuración de `pm2` o un ejemplo NSSM service para Windows.

Estado verificado en esta sesión:
- `npx prisma generate` -> OK
- `npm run build` -> OK (Next.js compiló y generó páginas; se imprimieron avisos sobre rutas dinámicas que usan `cookies`)

Archivo de backup creado durante la última migración de uploads:
- `scripts/backups/affected-uploads-backup-1760705848119.json`

---

Fin del documento.
