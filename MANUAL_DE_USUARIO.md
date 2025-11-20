# 📘 MANUAL DE USUARIO

## SISTEMA DE GESTIÓN DE ACTIVOS

**Nombre del Proyecto:** Sistema de Gestión de Activos IMGC  
**Versión del Documento:** 1.2  
**Fecha de Publicación:** Noviembre 2025  
**Autor:** Pasante Luis Jose Candiales Fajardo  
**Departamento:** Telemática / Desarrollo

---

## 📋 Índice

1.  [Introducción](#1-introducción)
2.  [Acceso y Navegación](#2-acceso-y-navegación)
3.  [Gestión de Catálogos](#3-gestión-de-catálogos)
4.  [Gestión de Equipos](#4-gestión-de-equipos)
5.  [Gestión de Organización](#5-gestión-de-organización)
6.  [Asignaciones y Préstamos](#6-asignaciones-y-préstamos)
7.  [Reportes](#7-reportes)
8.  [Administración](#8-administración)

---

## 1. Introducción

Bienvenido al **Sistema de Gestión de Activos IMGC**. Esta plataforma ha sido diseñada para facilitar el control, seguimiento y auditoría de los recursos tecnológicos de la corporación.

**Objetivos del Sistema:**
*   **Centralizar:** Un único lugar para toda la información de activos.
*   **Rastrear:** Saber quién tiene cada equipo y desde cuándo.
*   **Auditar:** Mantener un historial inmutable de cambios y mantenimientos.

---

## 2. Acceso y Navegación

### Acceso al Sistema
1.  Para ingresar, diríjase a la dirección web proporcionada por Telemática (Intranet).
2.  Ingrese su **Nombre de Usuario** y **Contraseña**.
3.  Haga clic en **"Iniciar Sesión"**.

> **Nota:** Si usted tiene un perfil de *Solo Lectura* (Viewer), algunas opciones mencionadas en este manual (como "Guardar" o "Asignar") estarán deshabilitadas.

### Interfaz Principal (Dashboard)
Al ingresar, verá el Panel de Control con indicadores clave:
*   **Total de Activos:** Cantidad de Laptops, Desktops y Periféricos registrados.
*   **Disponibilidad:** Gráficos de anillo que muestran cuántos equipos están "Operativos", "Asignados" o "En Mantenimiento".
*   **Actividad Reciente:** Un listado cronológico de las últimas acciones realizadas por su equipo de trabajo.

> *[Captura de pantalla: Vista general del Dashboard con gráficos y actividad reciente]*

### Navegación (Barra Lateral)
El menú lateral izquierdo es su centro de comando. Desde aquí puede acceder a todas las áreas del sistema.

*   🏠 **Dashboard:** Regresa a la pantalla de inicio y resumen general.
*   🏢 **Empresas:** Gestión de entidades legales.
*   🏢 **Departamentos:** Gestión de áreas internas.
*   👥 **Empleados:** Directorio de personal.
*   📍 **Ubicaciones:** Gestión de sitios físicos.
*   📚 **Catálogo:** Configuración de datos maestros (Marcas, Modelos, Tipos).
*   💻 **Equipos:** Inventario de Computadores y Dispositivos.
*   📊 **Reportes:** Área de descarga de listados en Excel/PDF.
*   ⚙️ **Gestión de Cuentas:** (Solo Admin) Gestión de usuarios del sistema.

---

## 3. Gestión de Catálogos

Para mantener la información estandarizada, el sistema utiliza catálogos predefinidos. Estos deben configurarse antes de registrar nuevos equipos.

### Navegación
Al ingresar al módulo **Catálogo**, verá tres botones principales en la parte superior para gestionar las diferentes categorías:

1.  **Gestionar Marcas**
2.  **Gestionar Tipos**
3.  **Nuevo Modelo**

> *[Captura de pantalla: Botones de gestión de catálogos]*

### Gestión de Marcas
Define los fabricantes de los equipos (ej. Dell, HP, Lenovo).
*   **Crear:** Haga clic en "Gestionar Marcas" -> "Nueva Marca". Ingrese el nombre y guarde.
*   **Editar/Eliminar:** Use los botones de acción en la lista de marcas.

### Gestión de Tipos de Equipo
Clasifica los activos (ej. Laptop, Desktop, Monitor).
*   **Crear:** Haga clic en "Gestionar Tipos" -> "Nuevo Tipo". Defina el nombre y la categoría base (Computadora o Dispositivo).

### Gestión de Modelos
Vincula una marca con un tipo específico.
*   **Crear:** Haga clic en el botón **"Nuevo Modelo"**.
*   **Formulario:**
    *   **Nombre:** Ej. Latitude 5420.
    *   **Tipo:** Seleccione el tipo (ej. Laptop).
    *   **Marca:** Seleccione la marca (ej. Dell).
    *   **Imagen:** (Opcional) Suba una foto referencial.

> **Importante:** Al registrar un equipo, solo podrá seleccionar modelos que hayan sido creados previamente aquí.

---

## 4. Gestión de Equipos

El módulo de **Equipos** es el corazón del inventario. Aquí se registran y administran todos los activos tecnológicos.

### Navegación y Vistas
La pantalla se divide en dos pestañas principales:
1.  **Computadores**: Laptops, Desktops, Servidores.
2.  **Dispositivos**: Monitores, Impresoras, Periféricos.

> *[Captura de pantalla: Pestañas de Computadores y Dispositivos]*

### Gestión de Computadores

#### Listado y Búsqueda
*   **Búsqueda:** Use la barra "Buscar por serial..." para filtrar.
*   **Columnas:** Use el botón "Columnas" para personalizar la vista.
*   **Acciones:** En cada fila, el botón de menú (...) permite: Copiar Serial, Ver detalles, Gestionar Estado, Editar y Eliminar.

#### Agregar un Computador
1.  Haga clic en el botón **"Agregar Computador"**.
2.  Serás redirigido a un formulario completo.
3.  **Campos Clave:** Modelo, Serial, Código IMGC, Estado.
4.  **Especificaciones:** Procesador, RAM, Disco, etc.
5.  **Compra:** Fecha, Proveedor, Factura (Opcional).
6.  Haga clic en **"Guardar Computador"**.

> *[Captura de pantalla: Formulario de registro de nuevo computador]*

### Gestión de Dispositivos

#### Diferencias
La gestión es similar, pero **la creación y edición se realizan en ventanas modales** (pop-ups) para mayor agilidad.

#### Agregar un Dispositivo
1.  Seleccione la pestaña **"Dispositivos"**.
2.  Haga clic en **"Agregar Dispositivo"**.
3.  Complete el formulario en la ventana emergente (Serial, Modelo, Código, Estado).
4.  Haga clic en **"Guardar"**.

> *[Captura de pantalla: Ventana modal para agregar dispositivo]*

---

## 5. Gestión de Organización

Antes de asignar equipos, debe registrar la estructura organizacional.

### Empleados
*   **Ubicación:** Menú "Empleados".
*   **Crear:** Botón "Agregar Empleado" -> Redirige a formulario.
*   **Datos:** Nombre, Apellido, Cédula, Departamento, Cargo.
*   **Detalles:** Al ver un empleado, podrá consultar su historial de activos asignados.

### Empresas y Departamentos
*   **Empresas:** Menú "Empresas". Botón "Agregar Empresa" (Modal). Requiere Nombre y Logo opcional.
*   **Departamentos:** Menú "Departamentos". Botón "Agregar Departamento" (Modal). Se vincula a una Empresa.

---

## 6. Asignaciones y Préstamos

Esta función registra quién es responsable de un activo.

### Asignar un Equipo
1.  Busque el equipo en el inventario (debe estar "OPERATIVO").
2.  Haga clic en el menú de acciones (...) -> **"Gestionar Estado"** o vaya a "Ver detalles".
3.  En la ficha del equipo, use el botón de **Asignar**.
4.  Seleccione el empleado o ubicación destino.
5.  Confirme la operación.

### Historial de Asignaciones
En el menú **Asignaciones** del panel lateral:
*   Verá una tabla con todos los movimientos históricos.
*   **Exportar:** Use el botón **"Exportar a Excel"** para descargar el reporte de movimientos.
*   **Filtros:** Puede filtrar por fecha, tipo de acción o usuario.

> *[Captura de pantalla: Tabla de historial de asignaciones]*

---

## 7. Reportes

En la sección **Reportes**, puede generar documentos detallados.

### Tipos de Reporte Disponibles
Seleccione el tipo de reporte en el menú desplegable:

1.  **Empleados Actuales:** Lista de personal con conteo de equipos asignados.
2.  **Asignaciones y Modificaciones:** Auditoría detallada de movimientos y cambios en fichas técnicas.
3.  **Equipos por Estado:** Inventario clasificado (Operativo, Asignado, Dañado).
4.  **Ubicaciones Inventario:** Resumen de activos por sitio físico.
5.  **Catálogo Actual:** Listado maestro de modelos y marcas.

> *[Captura de pantalla: Selector de tipo de reporte y filtros]*

### Generación
1.  Seleccione el tipo de reporte.
2.  Aplique filtros si es necesario (Empresa, Departamento, Fechas).
3.  Haga clic en los botones de descarga: **PDF**, **Excel** o **Word**.

---

## 8. Administración

*(Exclusivo para Administradores)*

En el menú **Gestión de Cuentas**:

*   **Usuarios del Sistema:** Lista de operadores con acceso al software.
*   **Crear Usuario:** Registre nuevos miembros del equipo de TI.
*   **Roles:**
    *   **Admin:** Acceso total.
    *   **Editor:** Puede crear/editar pero no borrar ni administrar usuarios.
    *   **Viewer:** Solo lectura.
*   **Seguridad:** Opciones para resetear contraseñas de usuarios.

