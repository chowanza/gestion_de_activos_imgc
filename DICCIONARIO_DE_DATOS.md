# 📚 Diccionario de Datos - Sistema de Gestión de Activos IMGC

Este documento detalla la estructura de la base de datos, incluyendo tablas, campos, tipos de datos y restricciones.

---

## 🗂️ Índice de Tablas

1.  [Entidades Principales](#entidades-principales)
    *   [Computador](#computador)
    *   [Dispositivo](#dispositivo)
    *   [Empleado](#empleado)
    *   [User (Usuarios del Sistema)](#user)
2.  [Catálogos y Organización](#catálogos-y-organización)
    *   [Empresa](#empresa)
    *   [Departamento](#departamento)
    *   [Cargo](#cargo)
    *   [Ubicacion](#ubicacion)
    *   [Marca](#marca)
    *   [ModeloEquipo](#modeloequipo)
    *   [TipoEquipo](#tipoequipo)
3.  [Operaciones y Auditoría](#operaciones-y-auditoría)
    *   [AsignacionesEquipos](#asignacionesequipos)
    *   [HistorialModificaciones](#historialmodificaciones)
    *   [HistorialMovimientos](#historialmovimientos)
    *   [IntervencionesEquipos](#intervencionesequipos)

---

## 1. Entidades Principales

### `Computador`
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

### `Dispositivo`
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

### `Empleado`
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

### `User`
Usuarios con acceso al sistema administrativo (Login).

| Campo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Identificador único del usuario | **PK** |
| `username` | String | Nombre de usuario para login | **Unique** |
| `email` | String | Correo electrónico | **Unique**, Nullable |
| `password` | String | Hash de la contraseña | Not Null |
| `role` | String | Rol de permisos (Admin, Soporte, etc.) | Default: 'No-Admin' |

---

## 2. Catálogos y Organización

### `Empresa`
Entidades legales o filiales de la organización.

| Campo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Identificador único | **PK** |
| `nombre` | String | Nombre de la empresa | **Unique** |
| `descripcion` | String | Descripción de la empresa | Nullable |
| `logo` | String | URL del logo de la empresa | Nullable |
| `createdAt` | DateTime | Fecha de creación del registro | Default: now() |

### `Departamento`
Áreas funcionales dentro de las empresas.

| Campo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Identificador único | **PK** |
| `nombre` | String | Nombre del departamento | Not Null |
| `createdAt` | DateTime | Fecha de creación del registro | Default: now() |

### `Cargo`
Puestos de trabajo definidos.

| Campo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Identificador único | **PK** |
| `nombre` | String | Nombre del cargo | Not Null |
| `descripcion` | String | Descripción de funciones | Nullable |

### `Ubicacion`
Lugares físicos donde pueden estar los activos.

| Campo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Identificador único | **PK** |
| `nombre` | String | Nombre de la ubicación | **Unique** |
| `descripcion` | String | Descripción detallada | Nullable |
| `direccion` | String | Dirección física | Nullable |
| `piso` | String | Piso o nivel | Nullable |
| `sala` | String | Sala u oficina específica | Nullable |

### `Marca`
Fabricantes de equipos.

| Campo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Identificador único | **PK** |
| `nombre` | String | Nombre de la marca (HP, Dell, etc.) | **Unique** |

### `ModeloEquipo`
Modelos específicos de equipos.

| Campo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Identificador único | **PK** |
| `nombre` | String | Nombre del modelo | Not Null |
| `tipo` | String | Tipo de equipo (Legacy) | Not Null |
| `tipoEquipoId` | UUID | Referencia a la categoría del equipo | **FK** (TipoEquipo) |
| `img` | String | URL de la imagen del modelo | Nullable |

### `TipoEquipo`
Categorización de equipos (Laptop, Desktop, Monitor, etc.).

| Campo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Identificador único | **PK** |
| `nombre` | String | Nombre del tipo | Not Null |
| `categoria` | String | Categoría macro (COMPUTADORA/DISPOSITIVO)| Not Null |
| `activo` | Boolean | Si el tipo está habilitado | Default: true |

---

## 3. Operaciones y Auditoría

### `AsignacionesEquipos`
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

### `HistorialModificaciones`
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

### `HistorialMovimientos`
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

### `IntervencionesEquipos`
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

---

## Tablas de Relación (Normalización)

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
