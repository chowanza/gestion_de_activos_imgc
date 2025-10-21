# Configurar Nginx + HTTPS en Windows para la aplicación Next.js

Esta guía explica cómo poner HTTPS en tu máquina Windows usando Nginx como reverse-proxy hacia la app Next.js que corre en `localhost:3000`.

Resumen rápido:
- Generar un certificado TLS (self-signed o importado).
- Convertirlo a PEM (cert + key) para Nginx.
- Configurar Nginx para hacer proxy a `http://127.0.0.1:3000` y reenviar cabeceras necesarias (X-Forwarded-Proto, X-Forwarded-For).
- Cambiar `NEXT_PUBLIC_APP_URL` a `https://<host>` y eliminar `COOKIE_FORCE_SECURE`.

IMPORTANTE: para entornos de producción y acceso público usa un certificado válido (Let’s Encrypt o CA comercial). El self-signed es útil para intranet/PRUEBAS.

Requisitos previos
- Nginx para Windows (instalado, por ejemplo, con Chocolatey: `choco install -y nginx`).
- OpenSSL disponible (puedes instalar `openssl.light` con Chocolatey si no lo tienes).
- PowerShell en modo Administrador para los pasos que afectan a certificados y servicios.

Contenido del workflow
1) Generar certificado (auto-firmado) con PowerShell + OpenSSL (script incluido)
2) Convertir a PEM (cert + key)
3) Crear carpeta de certificados para Nginx y copiar los archivos
4) Crear/editar bloque de servidor Nginx (HTTPS) que haga proxy a Next.js
5) Cambiar `.env`: `NEXT_PUBLIC_APP_URL="https://<host>"` y eliminar `COOKIE_FORCE_SECURE`
6) Reiniciar Nginx y la app

### 1) Generar certificado (opciones)

Opción A - Usar el script incluido `scripts/setup-windows-nginx-https.ps1` (recomendado)

- El script realiza:
  - instalación opcional de OpenSSL (via Chocolatey)
  - creación de un certificado auto-firmado en el almacén de máquina
  - export a PFX
  - conversión del PFX a `cert.pem` y `key.pem` usando OpenSSL
  - copia de `cert.pem` y `key.pem` a la carpeta de Nginx `conf/certs/` (opcional)
  - imprime un bloque de configuración Nginx listo para pegar en `nginx.conf` o un archivo en `sites-available`.

Ejemplo de uso del script:

```powershell
# Ejecutar desde la raíz del repo (Admin PowerShell)
pwsh .\scripts\setup-windows-nginx-https.ps1 -Host '172.16.3.123' -NginxConfDir 'C:\nginx\conf' -PfxPassword 'ChangeMe123!'
```

Opción B - Manual (pasos resumidos)

1. Generar self-signed en PowerShell:

```powershell
$host = '172.16.3.123' # o tu-dominio.local
$cert = New-SelfSignedCertificate -DnsName $host -CertStoreLocation Cert:\LocalMachine\My -NotAfter (Get-Date).AddYears(5) -FriendlyName "imgc-dev-$host"

# Exportar a PFX
$pfxPath = "C:\temp\imgc-$host.pfx"
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password (ConvertTo-SecureString 'ChangeMe123!' -AsPlainText -Force)
```

2. Convertir el PFX a PEM (requiere OpenSSL):

```powershell
# Instalar OpenSSL si no lo tienes: choco install -y openssl.light
openssl pkcs12 -in C:\temp\imgc-172.16.3.123.pfx -nocerts -nodes -out C:\temp\imgc.key -passin pass:ChangeMe123!
openssl pkcs12 -in C:\temp\imgc-172.16.3.123.pfx -clcerts -nokeys -out C:\temp\imgc.crt -passin pass:ChangeMe123!
```

3. Copiar `imgc.crt` y `imgc.key` a la carpeta de Nginx (por ejemplo `C:\nginx\conf\certs\imgc.crt` y `...\imgc.key`).

### 2) Bloque Nginx (ejemplo)

Pega este bloque dentro de `http { ... }` o como `server` independiente en `nginx.conf`:

```nginx
server {
    listen 443 ssl;
    server_name 172.16.3.123; # o tu-dominio

    ssl_certificate      conf/certs/imgc.crt;
    ssl_certificate_key  conf/certs/imgc.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name 172.16.3.123;
    return 301 https://$host$request_uri;
}
```

Notas importantes:
- `proxy_set_header X-Forwarded-Proto $scheme;` es crítico — Next.js lo usa para decidir si debe poner `Secure` en la cookie.
- No elimines ni filtres `Set-Cookie` en el proxy.

### 3) Actualizar `.env` y reiniciar procesos

- Cambia en `.env`:

```env
NEXT_PUBLIC_APP_URL="https://172.16.3.123"
# elimina o comenta COOKIE_FORCE_SECURE
```

- Reinicia tu app (`pm2 restart imgc`) y reinicia Nginx.

### 4) Verificar desde cliente

- Abre en el navegador: `https://172.16.3.123` (acepta el certificado si es self-signed).
- Prueba login → revisa Network → Response Headers → Set-Cookie. Deberías ver `Secure` en la cookie.
- Prueba logout → revisa Network → Response Headers → Set-Cookie con `Max-Age=0`. El navegador debería borrar la cookie.

---

Si prefieres que ejecute los pasos automáticamente, puedes ejecutar el script `scripts/setup-windows-nginx-https.ps1` desde PowerShell (administrador). Lee el header del script y los parámetros. Si tienes dudas sobre rutas de Nginx en Windows (`C:\nginx` o `C:\tools\nginx`), dímelo y adapto el script.
