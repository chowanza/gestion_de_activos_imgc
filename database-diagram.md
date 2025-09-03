# Diagrama de Base de Datos - VENTORY

## Estructura de la Base de Datos

```mermaid
erDiagram
    User {
        string id PK
        string username UK
        string password
        Role role
    }
    
    Gerencia {
        string id PK
        string nombre
        string gerenteId FK
    }
    
    Departamento {
        string id PK
        string nombre
        string gerenciaId FK
        string ceco
        string sociedad
    }
    
    Usuario {
        string id PK
        string nombre
        string apellido
        string cargo
        int legajo
        string ced
        string departamentoId FK
    }
    
    Marca {
        string id PK
        string nombre UK
    }
    
    ModeloDispositivo {
        string id PK
        string nombre
        string marcaId FK
        string tipo
        string img
    }
    
    Computador {
        string id PK
        string serial UK
        string estado
        string modeloId FK
        string usuarioId FK
        string departamentoId FK
        string nsap
        string host
        string sede
        string ubicacion
        string sisOperativo
        string arquitectura
        string macWifi
        string macEthernet
        string ram
        string almacenamiento
        string procesador
        string sapVersion
        string officeVersion
    }
    
    Dispositivo {
        string id PK
        string serial UK
        string estado
        string modeloId FK
        string ubicacion
        string usuarioId FK
        string departamentoId FK
        string mac
        string ip
        string nsap
    }
    
    LineaTelefonica {
        string id PK
        string numero
        string proveedor
        string destino
        string estado
        string imei
    }
    
    Asignaciones {
        int id PK
        datetime date
        string notes
        string actionType
        string motivo
        string gerente
        string localidad
        string serialC
        string modeloC
        datetime createdAt
        datetime updatedAt
        string targetType
        string targetUsuarioId FK
        string targetDepartamentoId FK
        string itemType
        string computadorId FK
        string dispositivoId FK
        string lineaTelefonicaId FK
        string gerenteId FK
    }
    
    HistorialModificaciones {
        string id PK
        datetime fecha
        string campo
        string valorAnterior
        string valorNuevo
        string computadorId FK
    }
    
    Configuracion {
        int id PK
        string gerenteGeneralId FK
    }

    %% Relaciones
    User ||--o{ Gerencia : "gerente"
    User ||--o{ Configuracion : "gerenteGeneral"
    User ||--o{ Asignaciones : "targetUsuario"
    User ||--o{ Asignaciones : "gerenteUsuario"
    
    Gerencia ||--o{ Departamento : "contiene"
    Gerencia ||--o{ Usuario : "gerente"
    
    Departamento ||--o{ Usuario : "empleados"
    Departamento ||--o{ Computador : "ubicacion"
    Departamento ||--o{ Dispositivo : "ubicacion"
    Departamento ||--o{ Asignaciones : "targetDepartamento"
    
    Usuario ||--o{ Computador : "asignado"
    Usuario ||--o{ Dispositivo : "asignado"
    Usuario ||--o{ Asignaciones : "asignaciones"
    
    Marca ||--o{ ModeloDispositivo : "modelos"
    
    ModeloDispositivo ||--o{ Computador : "instancias"
    ModeloDispositivo ||--o{ Dispositivo : "instancias"
    
    Computador ||--o{ Asignaciones : "asignaciones"
    Computador ||--o{ HistorialModificaciones : "modificaciones"
    
    Dispositivo ||--o{ Asignaciones : "asignaciones"
    
    LineaTelefonica ||--o{ Asignaciones : "asignaciones"
```

## Descripción de las Tablas

### 🔐 Autenticación
- **User**: Usuarios del sistema (admin, user roles)

### 🏢 Estructura Organizacional
- **Gerencia**: Gerencias de la empresa
- **Departamento**: Departamentos dentro de cada gerencia
- **Usuario**: Empleados de la empresa
- **Configuracion**: Configuración general del sistema

### 📱 Catálogo de Equipos
- **Marca**: Marcas de equipos (Dell, HP, Apple, etc.)
- **ModeloDispositivo**: Modelos específicos de cada marca

### 💻 Inventario de Equipos
- **Computador**: Computadoras con especificaciones técnicas
- **Dispositivo**: Otros dispositivos (monitores, impresoras, etc.)
- **LineaTelefonica**: Líneas telefónicas y móviles

### 📋 Gestión de Asignaciones
- **Asignaciones**: Historial de asignaciones de equipos (polimórfico)
- **HistorialModificaciones**: Cambios en especificaciones de computadores

## Características Especiales

### 🔄 Asignaciones Polimórficas
Las asignaciones pueden ser:
- **Item**: Computador, Dispositivo o LíneaTelefonica
- **Target**: Usuario o Departamento

### 📊 Campos Técnicos
Los computadores incluyen especificaciones detalladas:
- Hardware (RAM, procesador, almacenamiento)
- Red (MAC WiFi, Ethernet)
- Software (Sistema operativo, SAP, Office)

### 🏷️ Identificadores
- **Serial**: Identificador único de cada equipo
- **Legajo**: Número de empleado
- **CECO**: Centro de costo

