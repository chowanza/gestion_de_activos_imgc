# 🛠️ Manual Técnico - Sistema de Gestión de Activos IMGC

**Versión del Documento:** 1.0  
**Fecha:** Noviembre 2025  
**Departamento:** Telemática / Desarrollo  
**Clasificación:** Confidencial - Uso Interno

---

## 📋 Tabla de Contenidos

1. [Visión General de la Arquitectura](#1-visión-general-de-la-arquitectura)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Base de Datos](#4-base-de-datos)
   - [Diagrama Entidad-Relación (ERD)](#diagrama-entidad-relación-erd)
   - [Diccionario de Datos](#diccionario-de-datos)
5. [API y Backend](#5-api-y-backend)
6. [Frontend y UI](#6-frontend-y-ui)
7. [Seguridad y Autenticación](#7-seguridad-y-autenticación)
8. [Despliegue e Infraestructura](#8-despliegue-e-infraestructura)
9. [Mantenimiento y Scripts](#9-mantenimiento-y-scripts)

---

## 1. Visión General de la Arquitectura

El sistema está construido bajo una arquitectura **Monolítica Modular** utilizando **Next.js (App Router)**. Combina el frontend y el backend en una sola unidad desplegable, aprovechando el renderizado híbrido (Server Components y Client Components) para optimizar el rendimiento y la SEO, aunque se trata de una aplicación de intranet.

*   **Patrón de Diseño:** MVC (Model-View-Controller) adaptado a Next.js (Rutas API como Controladores, Prisma como Modelo, React Components como Vista).
*   **Comunicación:** REST API interna consumida por el cliente React.

---

## 2. Stack Tecnológico

### Core
*   **Framework:** Next.js 15.x (App Router)
*   **Lenguaje:** TypeScript 5.x (Tipado estático estricto)
*   **Runtime:** Node.js (v18+ recomendado)

### Base de Datos & ORM
*   **Motor de BD:** Microsoft SQL Server
*   **ORM:** Prisma ORM v6.x
*   **Driver:** `sqlserver` (Native)

### Frontend & UI
*   **Librería UI:** React 19
*   **Estilos:** Tailwind CSS
*   **Componentes Base:** shadcn/ui (basado en Radix UI)
*   **Iconos:** Lucide React
*   **Gestión de Estado:** React Hooks (`useState`, `useReducer`, `useContext`) + TanStack Query (para estado asíncrono del servidor).

### Utilidades
*   **Validación:** Zod (Validación de esquemas en runtime)
*   **Manejo de Fechas:** Objeto `Date` nativo + utilidades personalizadas.
*   **Cifrado:** `jose` (JWT y encriptación de sesiones).

---

## 3. Estructura del Proyecto

```bash
/
├── prisma/                 # Esquema de BD y migraciones
│   ├── schema.prisma       # Definición de modelos
│   └── migrations/         # Historial de cambios SQL
├── public/                 # Archivos estáticos y Uploads
│   └── uploads/            # Almacenamiento local de imágenes
├── scripts/                # Scripts de mantenimiento (TS/JS)
├── src/
│   ├── app/                # Rutas de Next.js (App Router)
│   │   ├── (app)/          # Rutas protegidas de la aplicación (Layout principal)
│   │   ├── api/            # Endpoints REST (Backend)
│   │   └── login/          # Ruta pública de acceso
│   ├── components/         # Componentes React reutilizables
│   │   ├── ui/             # Componentes base (shadcn)
│   │   └── ...             # Componentes de negocio (Forms, Tables)
│   ├── hooks/              # Custom Hooks (ej. useTimelineFilters)
│   ├── lib/                # Lógica core (Prisma, Auth, Logger)
│   └── utils/              # Funciones auxiliares
└── ...config files         # (next.config, tailwind, tsconfig)
```

---

## 4. Base de Datos

El sistema utiliza **SQL Server**. La integridad referencial y la estructura se gestionan mediante **Prisma Migrate**.

### Diagrama Entidad-Relación (ERD) - Resumen

El modelo se centra en dos entidades principales: `Computador` y `Dispositivo`, las cuales se relacionan con `Empleado`, `Ubicacion` y `ModeloEquipo`.

*   **Normalización:** Se utilizan tablas intermedias para relaciones N:M (ej. `EmpleadoEmpresaDepartamentoCargo`).
*   **Auditoría:** Tablas `HistorialModificaciones`, `HistorialMovimientos` y `AsignacionesEquipos` actúan como logs transaccionales.

### Diccionario de Datos (Tablas Principales)

#### `Computador`
Almacena la información técnica y administrativa de los equipos de cómputo (Laptops, Desktops, AIO).

| Campo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Identificador único del registro | **PK** |
| `serial` | String | Número de serie del fabricante | **Unique** |
| `codigoImgc` | String | Código de activo fijo interno | Not Null |
| `estado` | String | Estado operativo actual | Default: 'OPERATIVO' |
| `descripcion` | String | Descripción general o notas | Nullable |
| `host` | String | Nombre de host en la red | Nullable |
| `sisOperativo` | String | Sistema Operativo instalado | Nullable |
| `arquitectura` | String | Arquitectura del SO (x86/x64) | Nullable |
| `procesador` | String | Modelo del procesador | Nullable |
| `ram` | String | Cantidad de memoria RAM | Nullable |
| `almacenamiento` | String | Capacidad de disco duro/SSD | Nullable |
| `macWifi` | String | Dirección MAC de la tarjeta Wi-Fi | Nullable |
| `macEthernet` | String | Dirección MAC de la tarjeta Ethernet | Nullable |
| `officeVersion` | String | Versión de Microsoft Office | Nullable |
| `anydesk` | String | ID de AnyDesk | Nullable |
| `fechaCompra` | DateTime | Fecha de adquisición | Nullable |
| `monto` | Decimal | Costo de adquisición | Nullable |
| `numeroFactura` | String | Número de factura de compra | Nullable |
| `proveedor` | String | Proveedor del equipo | Nullable |

#### `Dispositivo`
Almacena información de otros activos tecnológicos (Monitores, Impresoras, Periféricos, Tablets).

| Campo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Identificador único del registro | **PK** |
| `serial` | String | Número de serie del fabricante | **Unique** |
| `codigoImgc` | String | Código de activo fijo interno | Not Null |
| `estado` | String | Estado operativo actual | Default: 'OPERATIVO' |
| `descripcion` | String | Descripción general o notas | Nullable |
| `mac` | String | Dirección MAC (si aplica) | Nullable |
| `ip` | String | Dirección IP (si aplica) | Nullable |
| `fechaCompra` | DateTime | Fecha de adquisición | Nullable |
| `monto` | Decimal | Costo de adquisición | Nullable |
| `numeroFactura` | String | Número de factura de compra | Nullable |
| `proveedor` | String | Proveedor del equipo | Nullable |

#### `Empleado`
Información del personal de la empresa.

| Campo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Identificador único del registro | **PK** |
| `nombre` | String | Nombres del empleado | Not Null |
| `apellido` | String | Apellidos del empleado | Not Null |
| `ced` | String | Cédula de identidad | Not Null |
| `email` | String | Correo electrónico corporativo | Nullable |
| `telefono` | String | Número de teléfono de contacto | Nullable |
| `direccion` | String | Dirección de habitación | Nullable |
| `fechaNacimiento` | String | Fecha de nacimiento | Nullable |
| `fechaIngreso` | String | Fecha de ingreso a la empresa | Nullable |
| `fechaDesincorporacion`| String | Fecha de egreso de la empresa | Nullable |
| `fotoPerfil` | String (Text)| URL o Base64 de la foto de perfil | Nullable |

#### `User`
Usuarios con acceso al sistema administrativo (Login).

| Campo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Identificador único del usuario | **PK** |
| `username` | String | Nombre de usuario para login | **Unique** |
| `email` | String | Correo electrónico | **Unique**, Nullable |
| `password` | String | Hash de la contraseña | Not Null |
| `role` | String | Rol de permisos (Admin, Soporte, etc.) | Default: 'No-Admin' |

#### `AsignacionesEquipos`
Registro histórico y actual de quién posee qué equipo.

| Campo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Identificador único | **PK** |
| `date` | DateTime | Fecha efectiva de la asignación | Default: now() |
| `actionType` | String | Tipo (ASIGNACION, DEVOLUCION, etc.) | Not Null |
| `activo` | Boolean | Indica si es la asignación vigente | Default: true |
| `notes` | String | Notas u observaciones | Nullable |
| `motivo` | String | Motivo de la asignación | Nullable |
| `evidenciaFotos` | String | URLs de fotos de evidencia | Nullable |
| `computadorId` | UUID | Equipo asignado (si es computador) | **FK**, Nullable |
| `dispositivoId` | UUID | Equipo asignado (si es dispositivo) | **FK**, Nullable |
| `targetEmpleadoId`| UUID | Empleado que recibe el equipo | **FK**, Nullable |
| `gerenteId` | UUID | Gerente responsable (si aplica) | **FK**, Nullable |
| `ubicacionId` | UUID | Ubicación asignada (si no es empleado) | **FK**, Nullable |
| `usuarioId` | UUID | Usuario del sistema que registró la acción| **FK**, Nullable |

#### `HistorialModificaciones`
Auditoría de cambios en campos específicos de los equipos.

| Campo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Identificador único | **PK** |
| `fecha` | DateTime | Fecha del cambio | Default: now() |
| `campo` | String | Nombre del campo modificado | Not Null |
| `valorAnterior` | String | Valor antes del cambio | Nullable |
| `valorNuevo` | String | Valor después del cambio | Nullable |
| `computadorId` | UUID | Equipo afectado | **FK** |
| `usuarioId` | UUID | Usuario que realizó el cambio | **FK**, Nullable |

#### `HistorialMovimientos`
Log general de acciones en el sistema (Login, Creación, Edición).

| Campo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Identificador único | **PK** |
| `fecha` | DateTime | Fecha del evento | Default: now() |
| `accion` | String | Acción (CREATE, UPDATE, DELETE, LOGIN) | Not Null |
| `entidad` | String | Entidad afectada (User, Computador, etc.)| Not Null |
| `entidadId` | String | ID de la entidad afectada | Nullable |
| `descripcion` | String | Descripción legible del evento | Not Null |
| `detalles` | String | JSON con detalles técnicos | Nullable |
| `usuarioId` | UUID | Usuario que realizó la acción | **FK**, Nullable |
| `ipAddress` | String | Dirección IP del cliente | Nullable |

#### `IntervencionesEquipos`
Registro de mantenimientos y reparaciones.

| Campo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Identificador único | **PK** |
| `fecha` | DateTime | Fecha de la intervención | Default: now() |
| `notas` | String | Informe técnico de la intervención | Nullable |
| `evidenciaFotos` | String | URLs de fotos del trabajo | Nullable |
| `computadorId` | UUID | Equipo intervenido (si es computador) | **FK**, Nullable |
| `dispositivoId` | UUID | Equipo intervenido (si es dispositivo) | **FK**, Nullable |
| `empleadoId` | UUID | Técnico que realizó la intervención | **FK**, Nullable |

#### Tablas de Relación (Normalización)

Estas tablas gestionan las relaciones Muchos a Muchos (N:M) del sistema.

| Tabla | Relación | Descripción |
| :--- | :--- | :--- |
| `MarcaModeloEquipo` | Marca ↔ Modelo | Define qué modelos pertenecen a qué marca. |
| `EmpresaDepartamento` | Empresa ↔ Departamento | Asocia departamentos a empresas. |
| `DepartamentoCargo` | Departamento ↔ Cargo | Define qué cargos existen en un departamento. |
| `EmpleadoEmpresaDepartamentoCargo` | Empleado ↔ Org | Relación central que define la posición de un empleado (Empresa + Depto + Cargo). |
| `ComputadorModeloEquipo` | Computador ↔ Modelo | Asocia un computador físico a su modelo de catálogo. |
| `DispositivoModeloEquipo` | Dispositivo ↔ Modelo | Asocia un dispositivo físico a su modelo de catálogo. |
| `DepartamentoGerente` | Departamento ↔ Empleado | Define quién es el gerente de un departamento. |

---

## 5. API y Backend

El backend reside en `src/app/api`. Cada carpeta representa un recurso.

### Patrones de Diseño API
*   **Route Handlers:** Se usan archivos `route.ts` que exportan funciones `GET`, `POST`, `PUT`, `DELETE`.
*   **Middleware de Roles:** Se utiliza `requirePermission` o `requireAnyPermission` al inicio de cada handler para validar la sesión y el rol del usuario.
*   **Transacciones:** Las operaciones críticas (como asignar un equipo) utilizan `prisma.$transaction` para asegurar la integridad de los datos (Atomicidad).

### Endpoints Clave
*   `/api/computador`: CRUD de computadores.
*   `/api/equipos/asignar`: Lógica compleja de asignación (valida estado, cierra asignaciones previas, crea nueva).
*   `/api/historial/audit`: Endpoint de lectura para el módulo de auditoría.

---

## 6. Frontend y UI

### Componentes Clave
*   **`EquipmentTimeline.tsx`:** Componente complejo que renderiza la historia de un activo. Fusiona datos de `AsignacionesEquipos`, `HistorialModificaciones` e `Intervenciones`.
*   **`PermissionGuard.tsx`:** Componente HOC (Higher Order Component) que oculta o muestra partes de la UI según el rol del usuario logueado.

### Gestión de Estado
*   Se minimiza el estado global global (Redux/Zustand no son necesarios).
*   Se prefiere el estado del servidor (Server State) mediante `fetch` en Server Components o React Query en Client Components.

---

## 7. Seguridad y Autenticación

### Autenticación
*   **Mecanismo:** Cookies cifradas (JWE - JSON Web Encryption).
*   **Librería:** `jose`.
*   **Flujo:**
    1.  Login envía credenciales a `/api/auth/login`.
    2.  Backend valida contra tabla `User`.
    3.  Backend genera JWT cifrado y lo setea como cookie `session` (HttpOnly, Secure).
    4.  Middleware (`middleware.ts`) intercepta cada request y valida la cookie.

### Autorización (RBAC)
*   Sistema de Control de Acceso Basado en Roles.
*   Los permisos se definen en `src/lib/permissions.ts`.
*   Cada rol (Admin, Soporte, etc.) tiene un array de permisos (`canCreate`, `canDelete`, etc.).

---

## 8. Despliegue e Infraestructura

### Requisitos del Servidor
*   **OS:** Windows Server (actual) o Linux.
*   **Node.js:** v18.17.0 o superior.
*   **Base de Datos:** SQL Server accesible vía red interna.
*   **PM2:** Recomendado para gestión de procesos en producción.

### Proceso de Build
1.  `npm install` (Instalar dependencias).
2.  `npx prisma generate` (Generar cliente de BD).
3.  `npm run build` (Compilar Next.js a producción).
4.  `npm start` (Iniciar servidor).

### Variables de Entorno (.env)
*   `DATABASE_URL`: Cadena de conexión a SQL Server.
*   `JWT_SECRET_KEY`: Llave para firmar sesiones.

---

## 10. Casos de Uso por Rol

El sistema implementa un control de acceso basado en roles (RBAC) definido en `src/lib/permissions.ts`. A continuación se detalla la matriz de permisos, accesos y restricciones para los perfiles activos.

### 👑 Admin (Administrador)
**Nivel de Acceso:** Total (Superusuario).

| Módulo | Permisos CRUD | Funcionalidades Específicas |
| :--- | :--- | :--- |
| **Usuarios** | ✅ C ✅ R ✅ U ✅ D | Crear cuentas, resetear contraseñas, eliminar usuarios. |
| **Inventario** | ✅ C ✅ R ✅ U ✅ D | Registrar equipos, editar especificaciones, dar de baja. |
| **Asignaciones** | ✅ C ✅ R ✅ U ✅ D | Asignar equipos, cambiar estados, editar historial. |
| **Organización** | ✅ C ✅ R ✅ U ✅ D | Gestión completa de Empresas, Departamentos y Cargos. |
| **Catálogos** | ✅ C ✅ R ✅ U ✅ D | Gestión de Marcas, Modelos y Tipos de Equipo. |
| **Reportes** | ✅ R (Exportación) | Generación de reportes de inventario, estados y movimientos. |
| **Intervenciones** | ✅ C ✅ R | Registro y seguimiento de mantenimientos correctivos/preventivos. |
| **Auditoría** | ✅ R | Acceso exclusivo al módulo de Historial y Logs. |

**Restricciones:** Ninguna. Es el único rol que puede eliminar registros y gestionar accesos.

### 📝 Editor (Gestor de Catálogos)
**Nivel de Acceso:** Gestión Organizacional y Registro.

| Módulo | Permisos CRUD | Funcionalidades Específicas |
| :--- | :--- | :--- |
| **Usuarios** | ❌ Acceso Denegado | No puede ver ni gestionar usuarios. |
| **Inventario** | ✅ C ✅ R ✅ U ❌ D | **Puede Registrar y Editar** equipos. **No puede Eliminar** existentes. |
| **Asignaciones** | 👁️ R (Solo Lectura) | Puede ver quién tiene qué, pero **no puede asignar/cambiar estados**. |
| **Organización** | ✅ C ✅ R ✅ U 🚫 D | **Puede Crear y Editar** Empresas, Departamentos y Cargos. **No puede Eliminar**. |
| **Catálogos** | ✅ C ✅ R ✅ U 🚫 D | Puede mantener el catálogo de Marcas y Modelos. |
| **Reportes** | ✅ R (Exportación) | Generación de reportes de inventario. Sin acceso a Auditoría. |
| **Intervenciones** | ✅ C ✅ R | Registro de mantenimientos a equipos. |
| **Auditoría** | ❌ Acceso Denegado | No tiene acceso a los logs del sistema. |

**Restricciones:**
*   **No puede Eliminar** ningún registro (Soft Delete ni Hard Delete).
*   **No puede realizar movimientos** de inventario (Asignaciones).

### 👁️ Viewer (Lector / Auditor)
**Nivel de Acceso:** Consulta Estricta.

| Módulo | Permisos CRUD | Funcionalidades Específicas |
| :--- | :--- | :--- |
| **Usuarios** | ❌ Acceso Denegado | No puede ver ni gestionar usuarios. |
| **Inventario** | 👁️ R (Solo Lectura) | Búsqueda y visualización de fichas técnicas. |
| **Asignaciones** | 👁️ R (Solo Lectura) | Visualización de historial de asignaciones. |
| **Organización** | 👁️ R (Solo Lectura) | Visualización de estructura organizativa. |
| **Catálogos** | 👁️ R (Solo Lectura) | Consulta de marcas y modelos. |
| **Reportes** | 👁️ R (Solo Lectura) | Visualización de reportes disponibles. |
| **Intervenciones** | 👁️ R (Solo Lectura) | Consulta de historial de intervenciones. |
| **Auditoría** | ❌ Acceso Denegado | No tiene acceso a los logs del sistema. |

**Restricciones:**
*   **Solo Lectura:** No tiene habilitado ningún botón de Guardar, Crear, Editar o Eliminar en toda la interfaz.
*   Ideal para auditores externos o personal que requiere consultar disponibilidad sin riesgo operativo.

---

## 11. Mantenimiento y Scripts

El proyecto incluye una carpeta `/scripts` con herramientas útiles para el equipo de Telemática:

*   `verify-all-operational.ts`: Chequeo de integridad de estados.
*   `fix-equipment-states.ts`: Script de corrección masiva de estados inconsistentes.
*   `clean-db-leave-admin.ts`: **PELIGRO**. Limpia toda la data transaccional dejando solo al usuario admin (útil para reinicios de sistema o entornos de prueba).

Para ejecutar un script:
```bash
npx tsx scripts/nombre-del-script.ts
```

---

**Autor:** Pasante Luis Jose Candiales Fajardo  
**Revisado por:** Tutor Industrial Ing. Jorge Rodriguez  
**Contacto:** telemática@imgc.corp
