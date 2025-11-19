# 🤖 Agents & Scripts

Este documento describe los agentes y scripts automatizados disponibles en el proyecto para tareas de mantenimiento, testing y gestión de datos.

## 📋 Índice

- [Scripts de Base de Datos](#scripts-de-base-de-datos)
- [Scripts de Verificación](#scripts-de-verificación)
- [Scripts de Limpieza](#scripts-de-limpieza)
- [Scripts de Prueba](#scripts-de-prueba)
- [Scripts de Generación de Datos](#scripts-de-generación-de-datos)

---

## 🗄️ Scripts de Base de Datos

### `scripts/generate-sample-equipment.ts`
**Propósito**: Generar equipos de muestra para testing y desarrollo.

**Funcionalidad**:
- Crea 100 equipos (computadores y dispositivos) usando el catálogo existente
- Utiliza marcas y modelos reales de la base de datos
- Genera seriales únicos con formato específico por tipo
- Establece estados operativos por defecto

**Uso**:
```bash
npx tsx scripts/generate-sample-equipment.ts
```

**Parámetros configurables**:
- `TOTAL_EQUIPOS`: Cantidad total de equipos a generar (default: 100)
- `PORCENTAJE_COMPUTADORES`: Porcentaje de computadores vs dispositivos (default: 60%)

---

## ✅ Scripts de Verificación

### `scripts/verify-all-operational.ts`
**Propósito**: Verificar que todos los equipos están en estado OPERATIVO.

**Funcionalidad**:
- Verifica directamente en la base de datos
- Compara con datos del dashboard API
- Muestra estadísticas detalladas por estado
- Confirma consistencia entre BD y frontend

**Uso**:
```bash
npx tsx scripts/verify-all-operational.ts
```

**Output esperado**:
```
✅ Todos los computadores están OPERATIVOS
✅ Todos los dispositivos están OPERATIVOS
📊 COMPUTADORES: Total: 100, OPERATIVO: 100 (100%)
📊 DISPOSITIVOS: Total: 50, OPERATIVO: 50 (100%)
```

### `scripts/verificar-ubicaciones-equipos.ts`
**Propósito**: Verificar la integridad de datos de ubicación de equipos.

**Funcionalidad**:
- Busca un equipo específico (COMP000002) en la base de datos
- Compara datos entre endpoints de lista y detalles
- Valida consistencia de ubicaciones
- Verifica que la lógica de ubicación funcione correctamente

**Uso**:
```bash
npx tsx scripts/verificar-ubicaciones-equipos.ts
```

**Output esperado**:
```
✅ COMP000002 encontrado
✅ Ubicaciones consistentes entre lista y detalles
✅ Lógica de ubicación funciona correctamente
```

### `scripts/verificar-equipos-sin-ubicacion.ts`
**Propósito**: Identificar equipos que no tienen ubicación asignada.

**Funcionalidad**:
- Analiza todos los computadores y dispositivos
- Identifica equipos sin ubicación en asignaciones
- Genera estadísticas por estado
- Lista ubicaciones disponibles y equipos asignados

**Uso**:
```bash
npx tsx scripts/verificar-equipos-sin-ubicacion.ts
```

**Output esperado**:
```
📊 RESULTADOS:
   - Total computadores: 100
   - Computadores sin ubicación: 5
   - Total dispositivos: 50
   - Dispositivos sin ubicación: 2
```

### `scripts/verificar-detalles-ubicacion.ts`
**Propósito**: Verificar que los detalles de ubicación muestren correctamente los equipos.

**Funcionalidad**:
- Verifica que una ubicación específica muestre todos sus equipos
- Compara datos entre API y frontend
- Valida que no haya equipos duplicados
- Analiza consistencia de datos

**Uso**:
```bash
npx tsx scripts/verificar-detalles-ubicacion.ts
```

**Output esperado**:
```
✅ Ubicación encontrada: Telematica
✅ Número total de equipos coincide
✅ No hay computadores duplicados en el endpoint
📊 EQUIPOS EN LA UBICACIÓN: 3 computadores
```

### `scripts/verificar-navegacion-empleados.ts`
**Propósito**: Verificar que la navegación a empleados desde ubicaciones funcione correctamente.

**Funcionalidad**:
- Verifica que los empleados tengan IDs válidos en los datos de ubicación
- Valida que la estructura de datos sea correcta para la navegación
- Comprueba existencia de empleados en la base de datos
- Genera URLs de navegación para verificación

**Uso**:
```bash
npx tsx scripts/verificar-navegacion-empleados.ts
```

**Output esperado**:
```
✅ Ubicación encontrada: Telematica
✅ Todos los empleados tienen IDs válidos para navegación
🔗 Jorge Rodriguez → /empleados/3ce9ce06-ece6-4846-b234-d63a78918a9c
```

### `scripts/verificar-conteo-ubicaciones.ts`
**Propósito**: Verificar que el conteo de equipos en la lista de ubicaciones funcione correctamente.

**Funcionalidad**:
- Verifica que el conteo de equipos sea consistente entre API y base de datos
- Valida que solo se cuenten equipos únicos (evita duplicados)
- Compara conteos de computadores y dispositivos
- Analiza asignaciones activas e inactivas

**Uso**:
```bash
npx tsx scripts/verificar-conteo-ubicaciones.ts
```

**Output esperado**:
```
✅ Ubicaciones encontradas en BD: 1
✅ Ubicaciones obtenidas del API: 1
✅ Todos los conteos totales son consistentes
📊 Computadores únicos: 2, Total asignaciones: 3
```

### `scripts/verificar-detalles-catalogo.ts`
**Propósito**: Verificar que la información de uso en detalles del catálogo esté correcta.

**Funcionalidad**:
- Verifica que equipos asignados tengan empresa, departamento, empleado y ubicación
- Verifica que equipos no asignados tengan al menos ubicación
- Valida consistencia de datos entre asignaciones activas e inactivas
- Comprueba reglas de negocio para integridad de datos

**Uso**:
```bash
npx tsx scripts/verificar-detalles-catalogo.ts
```

**Output esperado**:
```
✅ ASIGNADO: Empleado: Jorge Rodriguez, Empresa: IMGC IRON
⚠️ NO ASIGNADO: Solo tiene ubicación: Telematica
✅ Todas las reglas de negocio se cumplen correctamente
```

### `scripts/verificar-endpoint-catalogo-details.ts`
**Propósito**: Verificar que el endpoint de detalles del catálogo funcione correctamente.

**Funcionalidad**:
- Verifica que el endpoint /api/modelos/[id]/details devuelva datos correctos
- Valida que las estadísticas de uso sean consistentes con la base de datos
- Comprueba que las ubicaciones se muestren incluso para equipos no asignados
- Analiza consistencia entre API y base de datos

**Uso**:
```bash
npx tsx scripts/verificar-endpoint-catalogo-details.ts
```

**Output esperado**:
```
✅ CORRECTO: Se muestran ubicaciones para los equipos
✅ Todos los modelos con equipos tienen ubicaciones mostradas
```

### `scripts/verificar-navegacion-catalogo-details.ts`
**Propósito**: Verificar que la navegación desde detalles del catálogo funcione correctamente.

**Funcionalidad**:
- Verifica que el endpoint devuelva IDs reales para empresas, departamentos, empleados y ubicaciones
- Valida que las URLs de navegación sean correctas
- Comprueba que las páginas de destino existan en la base de datos
- Analiza consistencia entre IDs del endpoint y BD

**Uso**:
```bash
npx tsx scripts/verificar-navegacion-catalogo-details.ts
```

**Output esperado**:
```
✅ Los botones de navegación están configurados correctamente
✅ Los IDs reales se están devolviendo desde el endpoint
✅ Las URLs de navegación son válidas
```

### `scripts/verificar-conteo-por-modelo.ts`
**Propósito**: Verificar que el conteo de equipos por modelo en ubicaciones sea correcto.

**Funcionalidad**:
- Verifica que el conteo de equipos en ubicaciones sea por modelo específico, no total
- Valida que no haya duplicados en el conteo
- Comprueba consistencia entre endpoint y base de datos
- Analiza que la suma por ubicaciones no exceda el total del modelo

**Uso**:
```bash
npx tsx scripts/verificar-conteo-por-modelo.ts
```

**Output esperado**:
```
✅ El conteo de equipos por modelo en ubicaciones está funcionando correctamente
✅ No hay duplicados en el conteo
✅ Los conteos coinciden entre API y base de datos
```

### `scripts/verificar-navegacion-rapida.ts`
**Propósito**: Verificar que la navegación rápida funcione correctamente en detalles de activos.

**Funcionalidad**:
- Verifica que las rutas de navegación sean correctas
- Comprueba que los IDs de entidades existan en la base de datos
- Valida que las páginas de destino sean accesibles
- Genera URLs de navegación para verificación manual

**Uso**:
```bash
npx tsx scripts/verificar-navegacion-rapida.ts
```

**Output esperado**:
```
✅ Navegación rápida implementada correctamente
✅ Todas las entidades existen en la base de datos
✅ Los endpoints devuelven los IDs correctos
✅ Las páginas de destino son accesibles
```

### `scripts/verificar-navegacion-historial-asignaciones.ts`
**Propósito**: Verificar que la navegación rápida funcione correctamente en el historial de asignaciones.

**Funcionalidad**:
- Verifica que los botones de navegación aparezcan en el historial de asignaciones
- Comprueba que los IDs de empleados, departamentos y empresas del historial existan
- Valida que las rutas de navegación sean correctas
- Analiza la estructura de datos del historial

**Uso**:
```bash
npx tsx scripts/verificar-navegacion-historial-asignaciones.ts
```

**Output esperado**:
```
✅ Navegación rápida en historial implementada correctamente
✅ Botones de ojo agregados para empleados, departamentos y empresas
✅ Todas las entidades del historial existen en la base de datos
✅ Los endpoints devuelven los datos correctos
```

### `scripts/verificar-navegacion-ubicaciones.ts`
**Propósito**: Verificar que la navegación rápida funcione correctamente para ubicaciones.

**Funcionalidad**:
- Verifica que los botones de navegación aparezcan en los campos de ubicación
- Comprueba que los IDs de ubicaciones existan en la base de datos
- Valida que las rutas de navegación sean correctas
- Analiza la estructura de datos de ubicaciones

**Uso**:
```bash
npx tsx scripts/verificar-navegacion-ubicaciones.ts
```

**Output esperado**:
```
✅ Navegación rápida para ubicaciones implementada correctamente
✅ Botones de ojo agregados en campos de ubicación
✅ Todas las ubicaciones existen en la base de datos
✅ Los endpoints devuelven los datos correctos
```

### `scripts/verificar-boton-volver-ubicacion.ts`
**Propósito**: Verificar que el botón de volver en detalles de ubicación funcione correctamente.

**Funcionalidad**:
- Verifica que el botón de volver use router.back() en lugar de navegación fija
- Comprueba que la página de detalles de ubicación sea accesible
- Valida que la navegación funcione desde diferentes orígenes

**Uso**:
```bash
npx tsx scripts/verificar-boton-volver-ubicacion.ts
```

**Output esperado**:
```
✅ Botón de volver modificado para usar router.back()
✅ Navegación mejorada para regresar a la pantalla anterior
✅ URLs de prueba generadas para verificación manual
```

### `scripts/verificar-consistencia-asignaciones.ts`
**Propósito**: Verificar y corregir inconsistencias entre el estado del equipo y las asignaciones activas.

**Funcionalidad**:
- Detecta equipos en estado `ASIGNADO` sin asignación activa
- Detecta equipos en estados no-asignados con asignación activa
- Advierte equipos en `EN_MANTENIMIENTO` sin asignación activa
- Modo DRY-RUN por defecto; con `--apply` corrige creando/desactivando asignaciones
- Con `--downgrade` (opcional), cambia a `OPERATIVO` cuando no existe empleado histórico para recuperar

**Uso**:
```bash
npx tsx scripts/verificar-consistencia-asignaciones.ts           # DRY-RUN
npx tsx scripts/verificar-consistencia-asignaciones.ts --apply   # Aplica correcciones
npx tsx scripts/verificar-consistencia-asignaciones.ts --apply --downgrade
```

**Output esperado**:
```
📊 RESUMEN
🖥️  Computadores ASIGNADO sin activa: 2
📱 Dispositivos ASIGNADO sin activa: 1
🖥️  Computadores NO asignados con activa: 0
📱 Dispositivos NO asignados con activa: 1
🛠️  Computadores EN_MANTENIMIENTO sin activa (warning): 0
🛠️  Dispositivos EN_MANTENIMIENTO sin activa (warning): 0

✅ Computador <id>: creando asignación activa para empleado <empleadoId>
🔄 Dispositivo <id>: desactivando asignaciones activas en estado NO asignado
🎉 Correcciones aplicadas
```

### `scripts/detect-orphan-asignados.ts`
**Propósito**: Detectar equipos (computadores y dispositivos) con estado `ASIGNADO` pero sin asignación activa válida, y corregirlos opcionalmente.

**Funcionalidad**:
- Reporta "huérfanos": estado `ASIGNADO` sin fila activa (`activo=true`, `actionType=ASIGNACION|ASSIGNMENT`, `targetEmpleadoId` no nulo)
- Reporta inconsistencias inversas: estado NO ASIGNADO con asignación activa válida
- Recupera empleado histórico (última asignación con empleado) y crea nueva asignación activa
- Flags de corrección: `--apply`, `--downgrade`, `--assign <empleadoId>`, `--limit <n>`, `--json`
  - `--assign <id>`: reasigna huérfanos sin histórico al empleado indicado
  - `--downgrade`: cambia estado a `OPERATIVO` si no hay histórico y no se dio `--assign`
  - Sin `--apply`: modo DRY-RUN (solo muestra reporte)

**Uso**:
```bash
# DRY-RUN
npx tsx scripts/detect-orphan-asignados.ts

# Aplicar (downgrade donde no hay histórico)
npx tsx scripts/detect-orphan-asignados.ts --apply --downgrade

# Aplicar asignando todos los huérfanos sin histórico a un empleado específico
npx tsx scripts/detect-orphan-asignados.ts --apply --assign 3ce9ce06-ece6-4846-b234-d63a78918a9c
```

**Output esperado (ejemplo)**:
```
📊 RESUMEN
   Huérfanos encontrados: 3
   Inconsistencias inversas: 1
🔧 Aplicando correcciones...
✅ COMPUTADOR <idA>: asignación creada (empleado <empleadoId>)
✅ DISPOSITIVO <idB>: downgraded a OPERATIVO (sin histórico)
✅ DISPOSITIVO <idC>: asignación creada (empleado <empleadoId>)
✅ COMPUTADOR <idD>: asignación activa <asigId> desactivada (inversa)
```

### `scripts/verificar-navegacion-historial-empleados.ts`
**Propósito**: Verificar que la navegación rápida funcione correctamente en el historial de asignaciones de empleados.

**Funcionalidad**:
- Verifica que los botones de navegación aparezcan en el historial de asignaciones
- Comprueba que los IDs de equipos del historial existan en la base de datos
- Valida que las rutas de navegación sean correctas
- Analiza la estructura de datos del historial de empleados

**Uso**:
```bash
npx tsx scripts/verificar-navegacion-historial-empleados.ts
```

**Output esperado**:
```
✅ Navegación rápida en historial de empleados implementada correctamente
✅ Botones de ojo agregados para equipos en el historial
✅ Todos los equipos del historial existen en la base de datos
✅ Los endpoints devuelven los datos correctos
```

### `scripts/verificar-gestion-cargos-departamento.ts`
**Propósito**: Verificar que la gestión de cargos en departamentos funcione correctamente.

**Funcionalidad**:
- Verifica que se puedan crear, editar y eliminar cargos en departamentos
- Comprueba que el conteo de empleados por cargo funcione correctamente
- Valida que los endpoints de la API respondan correctamente
- Analiza la estructura de datos de cargos

**Uso**:
```bash
npx tsx scripts/verificar-gestion-cargos-departamento.ts
```

**Output esperado**:
```
✅ Gestión de cargos en departamentos implementada correctamente
✅ Funcionalidad CRUD (Crear, Leer, Actualizar, Eliminar) disponible
✅ Conteo de empleados por cargo funcionando
✅ Endpoints de API respondiendo correctamente
✅ Validaciones de negocio implementadas
```

### `scripts/fix-equipment-states.ts`
**Propósito**: Corregir estados de equipos a OPERATIVO.

**Funcionalidad**:
- Actualiza todos los computadores a estado OPERATIVO
- Actualiza todos los dispositivos a estado OPERATIVO
- Muestra resumen de cambios realizados
- Proporciona estadísticas finales

**Uso**:
```bash
npx tsx scripts/fix-equipment-states.ts
```

**Output esperado**:
```
✅ 15 computadores actualizados a OPERATIVO
✅ 8 dispositivos actualizados a OPERATIVO
📊 RESUMEN FINAL: Total computadores: 100, Operativos: 100
```

---

## 🧹 Scripts de Limpieza

### `scripts/limpiar-base-datos.ts`
**Propósito**: Limpiar datos de prueba y testing de la base de datos.

**Funcionalidad**:
- Elimina equipos de prueba
- Limpia ubicaciones temporales
- Remueve historial de empleados de prueba
- Mantiene datos de producción intactos

**⚠️ Advertencia**: Solo usar en entornos de desarrollo/testing.

**Uso**:
```bash
npx tsx scripts/limpiar-base-datos.ts
```

---

## 🧪 Scripts de Prueba

### `scripts/test-equipment-state-change.ts`
**Propósito**: Probar el cambio de estado de equipos y verificar limpieza de asignaciones.

**Funcionalidad**:
- Obtiene un equipo operativo
- Cambia estado a EN_RESGUARDO
- Verifica que las asignaciones se limpiaron
- Restaura estado original
- Confirma integridad de datos

**Uso**:
```bash
npx tsx scripts/test-equipment-state-change.ts
```

**Output esperado**:
```
✅ Estado cambiado exitosamente
✅ CORRECTO: No hay asignaciones activas después del cambio de estado
🎉 Prueba completada exitosamente!
```

---

## 📊 Scripts de Generación de Datos

### `scripts/crear-equipos-catalogo.ts`
**Propósito**: Crear equipos usando datos del catálogo existente.

**Funcionalidad**:
- Utiliza marcas y modelos reales de la BD
- Genera seriales con formato específico
- Asigna ubicaciones existentes
- Mantiene consistencia con el esquema

**Uso**:
```bash
npx tsx scripts/crear-equipos-catalogo.ts
```

---

## 🔧 Scripts de Mantenimiento

### `scripts/check-modelos.ts`
**Propósito**: Verificar integridad de modelos y marcas en el catálogo.

**Funcionalidad**:
- Verifica relaciones marca-modelo
- Identifica modelos huérfanos
- Sugiere correcciones
- Genera reporte de integridad

**Uso**:
```bash
npx tsx scripts/check-modelos.ts
```

---

## � Scripts de Backfill/Migración de Datos

### `scripts/backfill-modelos-tipoequipo.ts`
**Propósito**: Asignar `tipoEquipoId` en `ModeloEquipo` basado en el campo legacy `tipo`.

**Funcionalidad**:
- Detecta si la columna `tipoEquipoId` existe en BD (SQL Server) antes de ejecutar
- Modo por defecto DRY-RUN (no modifica), muestra qué actualizaría
- Con `--apply` actualiza cada `ModeloEquipo` cuyo `tipoEquipoId` es NULL
- Infiera la categoría por listas base (COMPUTADORA/DISPOSITIVO) y busca `TipoEquipo` por (nombre, categoría)
- No crea ni elimina tipos; para poblar tipos base use `scripts/sync-tipos-equipos.ts`

**Prerequisitos**:
- Migración aplicada que añade `tipoEquipoId` a `ModeloEquipo` y FK a `TipoEquipo`:
  - Carpeta: `prisma/migrations/20251107120000_add_tipoequipo_fk_to_modeloequipo`
  - Aplicar en producción con: `npx prisma migrate deploy`

**Uso**:
```bash
# DRY-RUN (recomendado primero)
npx tsx scripts/backfill-modelos-tipoequipo.ts

# Aplicar cambios
npx tsx scripts/backfill-modelos-tipoequipo.ts --apply
```

**Notas**:
- Si la columna no existe, el script saldrá con un mensaje indicando aplicar migraciones
- Ejecute previamente `npx tsx scripts/sync-tipos-equipos.ts` para asegurar que los tipos base existen


## �📝 Convenciones de Scripts

### Estructura Estándar
```typescript
#!/usr/bin/env npx tsx

/**
 * Descripción del script
 */

import { prisma } from '../src/lib/prisma';

async function nombreScript() {
  try {
    // Lógica del script
    console.log('✅ Operación completada');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
nombreScript();
```

### Logging Estándar
- ✅ Éxito: `console.log('✅ Mensaje de éxito')`
- ❌ Error: `console.error('❌ Mensaje de error')`
- 📊 Información: `console.log('📊 Información relevante')`
- 🔄 Proceso: `console.log('🔄 Procesando...')`

### Manejo de Errores
- Siempre usar `try-catch`
- Desconectar Prisma en `finally`
- Mostrar mensajes claros de error
- No fallar silenciosamente

---

## 🚀 Agregar Nuevos Scripts

Para agregar un nuevo script:

1. **Crear archivo** en `scripts/` con nombre descriptivo
2. **Seguir convenciones** de estructura y logging
3. **Documentar** en este archivo `AGENTS.md`
4. **Probar** en entorno de desarrollo
5. **Validar** con datos de prueba

### Template para Nuevo Script
```typescript
#!/usr/bin/env npx tsx

/**
 * [Descripción del propósito del script]
 * 
 * Funcionalidad:
 * - [Lista de funcionalidades]
 * 
 * Uso: npx tsx scripts/nombre-script.ts
 */

import { prisma } from '../src/lib/prisma';

async function nombreScript() {
  console.log('🚀 Iniciando [nombre del script]...\n');

  try {
    // Implementación aquí
    
    console.log('\n🎉 [Script] completado exitosamente!');
  } catch (error) {
    console.error('❌ Error durante [script]:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
nombreScript();
```

---

## 🔨 Comandos de Construcción y Prueba

### Scripts de Desarrollo
```bash
# Desarrollo con hot reload
npm run dev

# Construcción para producción
npm run build

# Iniciar servidor de producción
npm run start

# Linting del código
npm run lint
```

### Scripts de Base de Datos
```bash
# Migración y seed de la base de datos
npm run migrate:deploy

# Generar cliente Prisma
npx prisma generate

# Ver base de datos en Prisma Studio
npx prisma studio

# Reset completo de la base de datos
npx prisma migrate reset

# Seed manual de datos
npm run seed
```

### Scripts de Migración (Legacy)
```bash
# Migrar usuarios del sistema anterior
npm run db:migrar-usuarios

# Generar modelos de equipos
npm run db:generar-modelos

# Migrar departamentos
npm run db:migrar-deptos

# Migrar computadores
npm run db:migrar-compus

# Generar archivo seed
npm run db:generar-seed
```

### Comandos de Utilidades
```bash
# Ejecutar scripts TypeScript directamente
npx tsx scripts/nombre-script.ts

# Verificar tipos TypeScript
npx tsc --noEmit

# Instalar dependencias
npm install

# Limpiar cache de Next.js
rm -rf .next

# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json && npm install
```

---

## 📝 Guía de Estilo de Código

### Estructura de Archivos

#### Componentes React
```
src/components/
├── ui/                    # Componentes base de shadcn/ui
├── [Nombre]Component.tsx  # Componentes específicos
└── [nombre]-table.tsx     # Tablas de datos
```

**Convenciones de Naming**:
- **Componentes**: `PascalCase` (ej: `EquipmentTimeline.tsx`)
- **Hooks**: `camelCase` con prefijo `use` (ej: `useTimelineFilters.ts`)
- **Utilidades**: `camelCase` (ej: `exportUtils.ts`)
- **Tablas**: `kebab-case-table.tsx` (ej: `equipos-table.tsx`)

#### Estructura de API Routes
```
src/app/api/
├── [recurso]/route.ts           # CRUD básico
├── [recurso]/[id]/route.ts      # Operaciones por ID
├── [recurso]/[id]/[accion]/route.ts  # Acciones específicas
└── reports/[tipo]/route.ts      # Endpoints de reportes
```

### Patrones de Importación

#### Frontend Components
```typescript
// 1. React y Next.js
import { useState, useEffect } from 'react';
import { useParams, useRouter } from "next/navigation";

// 2. UI Components (shadcn/ui)
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 3. Iconos (Lucide React)
import { User, Building, MapPin, Wrench } from 'lucide-react';

// 4. Utilidades y hooks personalizados
import { formatDate } from '@/utils/formatDate';
import { useTimelineFilters } from '@/hooks/useTimelineFilters';

// 5. Librerías externas
import { showToast } from "nextjs-toast-notify";
import { useQuery } from '@tanstack/react-query';
```

#### API Routes
```typescript
// 1. Next.js
import { NextRequest, NextResponse } from 'next/server';

// 2. Prisma y tipos
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// 3. Utilidades
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';
```

### Patrones de Componentes

#### Componente con Props Interface
```typescript
interface ComponentProps {
  data: {
    id: string;
    nombre: string;
    // ... más propiedades
  };
  onAction?: (data: any) => void;
  loading?: boolean;
  error?: string | null;
}

export function Component({ data, onAction, loading = false, error = null }: ComponentProps) {
  // Implementación
}
```

#### Hook Personalizado
```typescript
interface UseCustomHookProps {
  itemId: string;
  onDataChange?: (data: any) => void;
}

export function useCustomHook({ itemId, onDataChange }: UseCustomHookProps) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleAction = useCallback((data: any) => {
    // Lógica
  }, []);
  
  return {
    state,
    loading,
    handleAction
  };
}
```

### Patrones de API

#### Endpoint GET con Filtros
```typescript
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    
    // Construir filtros
    const where: Prisma.ModelWhereInput = {};
    if (search) {
      where.OR = [
        { campo: { contains: search } },
        { otroCampo: { contains: search } }
      ];
    }
    
    // Query con paginación
    const [data, total] = await Promise.all([
      prisma.model.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { relacion: true }
      }),
      prisma.model.count({ where })
    ]);
    
    return NextResponse.json({
      data,
      pagination: { page, limit, total }
    });
    
  } catch (error) {
    console.error('Error en API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

#### Endpoint POST con Validación
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validación de campos requeridos
    if (!body.campoRequerido) {
      return NextResponse.json(
        { message: 'Campo requerido faltante' },
        { status: 400 }
      );
    }
    
    // Operación en base de datos
    const result = await prisma.model.create({
      data: body
    });
    
    return NextResponse.json({
      message: 'Operación exitosa',
      data: result
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error procesando solicitud' },
      { status: 500 }
    );
  }
}
```

### Manejo de Estado

#### TanStack Query (React Query)
```typescript
const {
  data: equipos,
  isLoading: loading,
  error,
  refetch: loadEquipos
} = useQuery({
  queryKey: ['equipos', filtros],
  queryFn: async () => {
    const response = await fetch(`/api/equipos?${new URLSearchParams(filtros)}`);
    if (!response.ok) throw new Error('Error cargando equipos');
    return response.json();
  },
  staleTime: 5 * 60 * 1000, // 5 minutos
  gcTime: 10 * 60 * 1000, // 10 minutos
});

// Invalidación de cache
const queryClient = useQueryClient();
await queryClient.invalidateQueries({ queryKey: ['equipos'] });
```

### Logging y Debugging

#### Console Logging Estándar
```typescript
// ✅ Logs informativos
console.log('🔄 Procesando datos...');
console.log('✅ Operación completada');
console.log('📊 Estadísticas:', { total: 100, procesados: 95 });

// ❌ Logs de error
console.error('❌ Error en operación:', error);
console.error('❌ Datos inválidos recibidos:', data);

// 🔍 Logs de debug (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Debug - Datos recibidos:', data);
}
```

### Validación de Datos

#### Zod Schemas
```typescript
import { z } from 'zod';

export const equipoSchema = z.object({
  serial: z.string().min(1, "Serial requerido"),
  estado: z.enum(['OPERATIVO', 'ASIGNADO', 'EN_RESGUARDO', 'DE_BAJA', 'EN_MANTENIMIENTO']),
  modeloId: z.string().uuid("ID de modelo inválido"),
  ubicacionId: z.string().uuid().optional()
});

export type EquipoFormData = z.infer<typeof equipoSchema>;
```

### Estilos CSS

#### Tailwind CSS Classes
```typescript
// ✅ Clases consistentes
const buttonClasses = "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600";
const cardClasses = "bg-white shadow-md rounded-lg p-6";
const badgeClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

// ✅ Variantes con class-variance-authority
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      }
    }
  }
);
```

---

## 🗄️ Contexto de Base de Datos

### Esquema de Base de Datos

#### Archivo Principal del Esquema
```bash
# Ubicación del esquema de Prisma
prisma/schema.prisma
```

**Configuración de Base de Datos**:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}
```

**Contenido clave**:
- **Proveedor**: SQL Server (no PostgreSQL)
- **Modelos de datos**: Equipos, empleados, empresas, departamentos
- **Relaciones normalizadas**: Tablas de relación para evitar FK directas
- **Estados de equipos**: `OPERATIVO`, `ASIGNADO`, `EN_RESGUARDO`, `DE_BAJA`, `EN_MANTENIMIENTO`
- **Auditoría completa**: Historial de modificaciones y movimientos
- **Índices optimizados**: Para consultas frecuentes

#### Estados de Equipos
```typescript
// Estados cuando NO está asignado
const estadosNoAsignados = ['OPERATIVO', 'DE_BAJA', 'EN_RESGUARDO'];

// Estados cuando SÍ está asignado  
const estadosAsignados = ['ASIGNADO', 'EN_MANTENIMIENTO'];

// Estado por defecto al crear equipos
const estadoDefault = 'OPERATIVO';
```

#### Campos Obligatorios
```prisma
// Campos requeridos en equipos
model Computador {
  codigoImgc String    // OBLIGATORIO - Código interno IMGC
  serial     String    @unique  // OBLIGATORIO - Serial único
}

model Dispositivo {
  codigoImgc String    // OBLIGATORIO - Código interno IMGC  
  serial     String    @unique  // OBLIGATORIO - Serial único
}

// Campos requeridos en empleados
model Empleado {
  nombre   String  // OBLIGATORIO
  apellido String  // OBLIGATORIO
  ced      String  // OBLIGATORIO - Cédula única
}
```

#### Validaciones de Negocio
```typescript
// Validar estados de equipos
const esEstadoValido = (estado: string) => {
  const estadosValidos = [
    'OPERATIVO', 
    'ASIGNADO', 
    'EN_RESGUARDO', 
    'DE_BAJA', 
    'EN_MANTENIMIENTO'
  ];
  return estadosValidos.includes(estado);
};

// Validar que un equipo no esté ya asignado
const validarAsignacion = async (equipoId: string, tipoEquipo: string) => {
  const asignacionExistente = await prisma.asignacionesEquipos.findFirst({
    where: {
      [tipoEquipo === 'computador' ? 'computadorId' : 'dispositivoId']: equipoId,
      activo: true
    }
  });
  
  return !asignacionExistente;
};
```

#### Comandos para Explorar la BD
```bash
# Ver estructura completa de la base de datos
npx prisma studio

# Generar cliente Prisma actualizado
npx prisma generate

# Ver estado de migraciones
npx prisma migrate status

# Crear nueva migración
npx prisma migrate dev --name nombre_migracion
```

### Modelos Principales

#### Equipos
```prisma
model Computador {
  id                String    @id @default(uuid())
  serial            String    @unique
  estado            String    @default("OPERATIVO")
  codigoImgc        String    // OBLIGATORIO
  host              String?
  
  // Información de compra
  fechaCompra       DateTime?
  numeroFactura     String?
  proveedor         String?
  monto             Decimal?
  
  // Sistema Operativo
  sisOperativo      String?
  arquitectura      String?
  
  // Hardware
  procesador        String?
  ram               String?
  almacenamiento    String?
  macWifi           String?
  macEthernet       String?
  
  // Software
  officeVersion     String?
  anydesk           String?

  // Relaciones normalizadas
  computadorModelos       ComputadorModeloEquipo[]
  asignaciones            AsignacionesEquipos[]
  historialModificaciones HistorialModificaciones[]
}

model Dispositivo {
  id            String    @id @default(uuid())
  serial        String    @unique
  estado        String    @default("OPERATIVO")
  mac           String?
  ip            String?
  codigoImgc    String    // OBLIGATORIO
  
  // Información de compra
  fechaCompra   DateTime?
  numeroFactura String?
  proveedor     String?
  monto         Decimal?

  // Relaciones normalizadas
  dispositivoModelos DispositivoModeloEquipo[]
  asignaciones       AsignacionesEquipos[]
}
```

#### Asignaciones y Movimientos
```prisma
model AsignacionesEquipos {
  id                String    @id @default(uuid())
  date              DateTime  @default(now())
  notes             String?
  actionType        String
  motivo            String?
  targetType        String
  itemType          String
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  activo            Boolean   @default(true)

  // Relaciones opcionales
  targetEmpleadoId  String?
  computadorId      String?
  dispositivoId     String?
  gerenteId         String?
  ubicacionId       String?

  targetEmpleado    Empleado?   @relation("TargetEmpleado")
  computador        Computador? @relation(fields: [computadorId])
  dispositivo       Dispositivo? @relation(fields: [dispositivoId])
  gerenteEmpleado   Empleado?   @relation("GerenteEmpleado")
  ubicacion         Ubicacion?  @relation(fields: [ubicacionId])
}

model HistorialModificaciones {
  id            String   @id @default(uuid())
  fecha         DateTime @default(now())
  campo         String
  valorAnterior String?
  valorNuevo    String?
  computadorId  String

  computador Computador @relation(fields: [computadorId])

  @@index([computadorId])
}
```

#### Entidades Organizacionales
```prisma
model Empleado {
  id                    String  @id @default(uuid())
  nombre                String
  apellido              String
  ced                   String
  email                 String?
  telefono              String?
  direccion             String?
  fechaNacimiento       String?
  fechaIngreso          String?
  fechaDesincorporacion String?
  fotoPerfil            String? @db.Text

  // Relaciones normalizadas
  organizaciones          EmpleadoEmpresaDepartamentoCargo[]
  asignacionesComoTarget  AsignacionesEquipos[] @relation("TargetEmpleado")
  asignacionesComoGerente AsignacionesEquipos[] @relation("GerenteEmpleado")
  gerencias               DepartamentoGerente[]
  statusHistory           EmpleadoStatusHistory[]
}

model Empresa {
  id          String   @id @default(uuid())
  nombre      String   @unique
  descripcion String?
  logo        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relaciones normalizadas
  empresaDepartamentos         EmpresaDepartamento[]
  empleadoOrganizaciones       EmpleadoEmpresaDepartamentoCargo[]
}

model Departamento {
  id        String   @id @default(uuid())
  nombre    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relaciones normalizadas
  empresaDepartamentos         EmpresaDepartamento[]
  departamentoCargos           DepartamentoCargo[]
  empleadoOrganizaciones       EmpleadoEmpresaDepartamentoCargo[]
  gerencias                    DepartamentoGerente[]
}
```

#### Catálogo de Equipos
```prisma
model Marca {
  id      String @id @default(uuid())
  nombre  String @unique

  // Relaciones normalizadas
  marcaModelos MarcaModeloEquipo[]
}

model ModeloEquipo {
  id     String  @id @default(uuid())
  nombre String
  tipo   String
  img    String?

  // Relaciones normalizadas
  marcaModelos           MarcaModeloEquipo[]
  computadorModelos      ComputadorModeloEquipo[]
  dispositivoModelos     DispositivoModeloEquipo[]
}
```

#### Tablas de Relación Normalizadas
```prisma
// TABLA CENTRAL - REEMPLAZA LAS FK EN EMPLEADO
model EmpleadoEmpresaDepartamentoCargo {
  empleadoId          String
  empresaId           String
  departamentoId      String
  cargoId             String
  fechaAsignacion     DateTime  @default(now())
  fechaDesasignacion  DateTime?
  activo              Boolean   @default(true)

  empleado     Empleado     @relation(fields: [empleadoId])
  empresa      Empresa      @relation(fields: [empresaId])
  departamento Departamento @relation(fields: [departamentoId])
  cargo        Cargo        @relation(fields: [cargoId])

  @@id([empleadoId, empresaId, departamentoId, cargoId])
}

model ComputadorModeloEquipo {
  computadorId   String
  modeloEquipoId String

  computador   Computador   @relation(fields: [computadorId])
  modeloEquipo ModeloEquipo @relation(fields: [modeloEquipoId])

  @@id([computadorId, modeloEquipoId])
}

model DispositivoModeloEquipo {
  dispositivoId    String
  modeloEquipoId   String
  tipoDispositivo  String?

  dispositivo  Dispositivo  @relation(fields: [dispositivoId])
  modeloEquipo ModeloEquipo @relation(fields: [modeloEquipoId])

  @@id([dispositivoId, modeloEquipoId])
}
```

### Arquitectura Normalizada

#### Principios de Diseño
```prisma
// ❌ EVITAR: FK directas en modelos principales
model Empleado {
  // NO hacer esto:
  // empresaId String?
  // departamentoId String?
  // cargoId String?
}

// ✅ USAR: Tablas de relación normalizadas
model EmpleadoEmpresaDepartamentoCargo {
  empleadoId     String
  empresaId      String  
  departamentoId String
  cargoId        String
  activo         Boolean @default(true)
  
  // Relaciones con campos de auditoría
  fechaAsignacion    DateTime @default(now())
  fechaDesasignacion DateTime?
}
```

#### Ventajas de la Normalización
- **Flexibilidad**: Un empleado puede estar en múltiples organizaciones
- **Auditoría**: Historial completo de cambios organizacionales
- **Integridad**: Relaciones controladas por tablas intermedias
- **Escalabilidad**: Fácil agregar nuevas relaciones sin modificar modelos principales

#### Patrones de Consulta
```typescript
// Obtener empleado con organización actual
const empleado = await prisma.empleado.findUnique({
  where: { id: empleadoId },
  include: {
    organizaciones: {
      where: { activo: true },
      include: {
        empresa: true,
        departamento: true,
        cargo: true
      }
    }
  }
});

// Obtener equipos con información completa de modelo
const equipos = await prisma.computador.findMany({
  include: {
    computadorModelos: {
      include: {
        modeloEquipo: {
          include: {
            marcaModelos: {
              include: {
                marca: true
              }
            }
          }
        }
      }
    }
  }
});
```

### Consultas Comunes

#### Obtener Equipos con Asignaciones
```typescript
// Computadores con asignaciones activas y modelos
const computadores = await prisma.computador.findMany({
  include: {
    // Asignaciones activas
    asignaciones: {
      where: { activo: true },
      include: {
        targetEmpleado: {
          include: {
            organizaciones: {
              where: { activo: true },
              include: {
                departamento: true,
                empresa: true,
                cargo: true
              }
            }
          }
        },
        ubicacion: true
      }
    },
    // Modelos y marcas
    computadorModelos: {
      include: {
        modeloEquipo: {
          include: {
            marcaModelos: {
              include: {
                marca: true
              }
            }
          }
        }
      }
    },
    // Historial de modificaciones
    historialModificaciones: {
      orderBy: { fecha: 'desc' },
      take: 10
    }
  }
});
```

#### Filtrar por Estado
```typescript
// Equipos operativos (no asignados)
const equiposOperativos = await prisma.computador.findMany({
  where: {
    estado: {
      in: ['OPERATIVO', 'EN_RESGUARDO', 'DE_BAJA']
    }
  }
});

// Equipos asignados
const equiposAsignados = await prisma.computador.findMany({
  where: {
    estado: {
      in: ['ASIGNADO', 'EN_MANTENIMIENTO']
    }
  }
});
```

### Scripts de Análisis de BD

#### `scripts/check-modelos.ts`
**Propósito**: Verificar integridad de modelos y marcas.

```bash
npx tsx scripts/check-modelos.ts
```

**Output**:
```
📊 Análisis de Modelos:
✅ Modelos válidos: 45
❌ Modelos huérfanos: 3
🔧 Sugerencias de corrección:
  - Modelo "XYZ123" sin marca asociada
```

#### `scripts/verify-all-operational.ts`
**Propósito**: Verificar consistencia de estados de equipos.

```bash
npx tsx scripts/verify-all-operational.ts
```

**Output**:
```
✅ Todos los computadores están OPERATIVOS
✅ Todos los dispositivos están OPERATIVOS
📊 COMPUTADORES: Total: 100, OPERATIVO: 100 (100%)
```

### Herramientas de Debugging

#### Prisma Studio
```bash
# Interfaz visual para explorar datos
npx prisma studio
```

**Funcionalidades**:
- Navegar por todas las tablas
- Ver relaciones entre entidades
- Editar datos directamente
- Filtrar y buscar registros

#### Logs de Prisma
```typescript
// Habilitar logs detallados en desarrollo
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Ver queries SQL generadas
console.log('Query ejecutada:', query);
```

### Migraciones y Versionado

#### Verificar Estado de Migraciones
```bash
# Ver migraciones aplicadas
npx prisma migrate status

# Ver historial de migraciones
npx prisma migrate history
```

#### Crear Nueva Migración
```bash
# Crear migración después de cambios en schema.prisma
npx prisma migrate dev --name descripcion_cambio

# Aplicar migraciones en producción
npx prisma migrate deploy
```

### Backup y Restauración

#### Backup Manual
```bash
# Backup de la base de datos (PostgreSQL)
pg_dump -h localhost -U usuario -d nombre_bd > backup_$(date +%Y%m%d).sql

# Backup con Prisma (datos específicos)
npx tsx scripts/backup-data.ts
```

#### Restauración
```bash
# Restaurar desde backup SQL
psql -h localhost -U usuario -d nombre_bd < backup_20250115.sql

# Restaurar datos específicos
npx tsx scripts/restore-data.ts
```

### Consultas de Auditoría

#### Historial Completo de un Equipo
```typescript
// Obtener todo el historial de un computador
const historial = await prisma.$transaction([
  // Asignaciones
  prisma.asignacionesEquipos.findMany({
    where: { computadorId: equipoId },
    orderBy: { date: 'desc' }
  }),
  // Modificaciones
  prisma.historialModificaciones.findMany({
    where: { computadorId: equipoId },
    orderBy: { fecha: 'desc' }
  })
]);
```

#### Estadísticas Generales
```typescript
// Conteos por estado
const stats = await prisma.$transaction([
  prisma.computador.groupBy({
    by: ['estado'],
    _count: { estado: true }
  }),
  prisma.dispositivo.groupBy({
    by: ['estado'],
    _count: { estado: true }
  })
]);
```

### Troubleshooting Común

#### Problemas de Conexión
```bash
# Verificar conexión a la BD
npx prisma db pull

# Resetear conexión
npx prisma db push --force-reset
```

#### Problemas de Esquema
```bash
# Sincronizar esquema con la BD
npx prisma db push

# Resetear esquema completo
npx prisma migrate reset
```

#### Problemas de Datos
```bash
# Limpiar datos de prueba
npx tsx scripts/limpiar-base-datos.ts

# Verificar integridad
npx tsx scripts/check-modelos.ts
```

---

## 📚 Referencias

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zod Validation](https://zod.dev/)

---

## 🕵️ Auditoría de contexto (2025-10-16)

Esta sección resume el estado actual del proyecto (frontend, backend, base de datos), el flujo de datos crítico, componentes clave, convenciones y tareas de mantenimiento ya realizadas (migraciones, backups, limpieza). Úsela como referencia operativa para cualquier IA o desarrollador nuevo.

### 1) Resumen ejecutivo
- Stack: Next.js (app router, v15.x) + TypeScript, React (server & client components), Prisma (v6) con SQL Server (datasource en `prisma/schema.prisma`).
- Almacenamiento de archivos: local en `public/uploads/<categoria>/` y servido a través de endpoint streaming `/api/uploads/[...path]`.
- Autenticación: cookie-based session (custom getServerUser + middleware). Algunas páginas usan cookies y por tanto se renderizan dinámicamente.

### 2) Mapeo del flujo de datos (end-to-end)

- Formulario (Frontend - ejemplo crear/editar Empresa)
  - Componentes implicados: `src/components/EmpresaForm.tsx`, `src/components/empresas-table.tsx`, páginas: `src/app/(app)/empresas/[id]/page.tsx`.
  - Flujo: el formulario construye un `FormData` y añade campos: `nombre`, `descripcion` y `logo` (File) y hace `fetch('/api/empresas', {method: 'POST', body: formData})`.

- Ruta API (Backend)
  - `src/app/api/empresas/route.ts` recibe `FormData`, crea `public/uploads/empresas` si es necesario, escribe el archivo y guarda la fila en la BD con `logo: '/api/uploads/empresas/<archivo>'`.
  - Para edición `PUT /api/empresas/[id]` (archivo: `src/app/api/empresas/[id]/route.ts`) normaliza rutas previas (`/api/uploads/` -> `/uploads/`) para `unlink` en disco y actualiza el campo `logo` en BD.

- Streaming (servir archivo)
  - `GET /api/uploads/<...path>` implemented in `src/app/api/uploads/[...path]/route.ts`.
  - Resuelve `public/uploads/<...path>` y devuelve el fichero con Content-Type correcto (image/jpeg, image/png, ...).

- BD (Prisma)
  - Insert/Update via `prisma.empresa.create()` / `prisma.empresa.update()` (ejemplo) en los handlers.
  - Esquema principal: `prisma/schema.prisma` (modelos: Empresa, Empleado, Computador, Dispositivo, ModeloEquipo, Marca, AsignacionesEquipos, User, etc.).

### 3) Componentes críticos y dónde encontrarlos

- Autenticación & autorización:
  - `src/middleware.ts` — protege rutas, usa `session` cookie y `decrypt` para validar. matcher excluye `api`, `_next`, `uploads`, `img`.
  - `src/lib/auth-server.ts` & `getServerUser` (usado en APIs para auditoría/validación).

- Uploads & serving:
  - Upload handlers: `src/app/api/upload/images/route.ts`, `src/app/api/empresas/route.ts`, `src/app/api/modelos/route.ts` and `[id]/route.ts` variants.
  - Streaming: `src/app/api/uploads/[...path]/route.ts` (serves files from `public/uploads`).

- UI / Form flows:
  - `src/components/EmpresaForm.tsx` / `EmpresaForm` and `empresas-table.tsx` — create/update flows for empresas.
  - `src/components/ModeloForm.tsx` / `src/app/api/modelos` — modelos CRUD.
  - `src/app/(app)/empleados/[id]/page.tsx` — employee profile page with fotoPerfil rendering.

- Business logic / important API routes:
  - `src/app/api/asignaciones` (assignments), `src/app/api/intervenciones` (interventions), `src/app/api/historial-*` (auditoría)

### 4) Naming & folder conventions

- Frontend components: `src/components/` - PascalCase filenames (e.g., `EquipmentTimeline.tsx`).
- App pages: `src/app/` with app-router pattern and nested folders for routes.
- API routes: `src/app/api/<resource>/route.ts` and `src/app/api/<resource>/<id>/route.ts` for id-specific operations.
- Prisma models: lowerCamel or Pascal in `schema.prisma` (e.g., `Computador`, `AsignacionesEquipos`).
- Upload filenames: `<timestamp>-<random>.<ext>` or `<timestamp>_<rand>.<ext>` (both patterns seen); stored on disk under `public/uploads/<categoria>/` and referenced in DB as `/api/uploads/<categoria>/<file>`.

### 5) Scripts / Agents relevantes (ubicados en `scripts/`)

- Database and maintenance scripts implemented during this session:
  - `scripts/list-missing-uploads.ts` — scan DB fields that point to uploads and report missing files.
  - `scripts/convert-uploads-to-api.ts` — dry-run and `--apply` conversion of DB values from `/uploads/...` -> `/api/uploads/...`.
  - `scripts/backup-affected-uploads.ts` — backup the affected rows before migration.
  - `scripts/clean-db-leave-admin.ts` — backup + delete almost all data preserving admin users (supports dry-run/--apply).
  - `scripts/finalize-modelo-deletions.ts` — examines and deletes dependent relations then `modeloEquipo` rows.
  - `scripts/test-upload-empresa.cjs`, `scripts/check-uploaded-file.cjs` — lightweight diagnostic/test scripts for uploads.

### 6) DB / Prisma / SQL Server notes

- Prisma generator configuration in `prisma/schema.prisma` uses the `sqlserver` provider.
- Connection string: environment variable `DATABASE_URL` (format: mssql://<user>:<pass>@<host>:<port>;database=<db>;encrypt=true;... ) — confirm `env` file contains proper connection string for SQL Server.
- Common Prisma tasks:
  - Generate client: `npx prisma generate` (or `npm run build` which runs it)
  - Apply migrations (dev): `npx prisma migrate dev` / production deploy: `npx prisma migrate deploy`.

### 7) Recent changes & migration actions (done)

- Implemented streaming endpoint `/api/uploads/[...path]` to serve local uploads consistently.
- Normalized upload handlers to store `/api/uploads/...` in DB and updated delete logic to convert `/api/uploads/` -> `/uploads/` before unlink to target correct disk path.
- Created migration scripts to update DB rows referencing `/uploads/` to `/api/uploads/` and created backups prior to apply.
- Created and executed `scripts/clean-db-leave-admin.ts` to preserve the admin user and delete non-admin data (backup written to `scripts/backups/clean-db-backup-*.json`).

### 8) Known issues & warnings

- Next.js dynamic server warnings: app uses cookies and server-side dynamic usage in several routes (e.g., pages that call `cookies` or `getServerUser`). This is expected for auth'ed pages but note that pages using cookies cannot be statically prerendered.
- Build-time TypeScript linting errors may appear when changing route code; ensure `npx tsc --noEmit` passes after edits.
- After code changes to API routes, production server must be rebuilt and restarted (`npm run build && npm run start`) for changes to be active.

### 9) Quick operational playbook (essential commands)

- Build & start (production):
  - npm run build
  - npm run start

- Typecheck: npx tsc --noEmit
- Prisma client regenerate: npx prisma generate
- Run migration scripts:
  - Dry-run convert uploads: npx tsx scripts/convert-uploads-to-api.ts
  - Apply convert uploads (after backup): npx tsx scripts/convert-uploads-to-api.ts --apply

- Backup before cleanup: npx tsx scripts/backup-affected-uploads.ts
- Clean DB preserving admin (DRY-RUN first): npx tsx scripts/clean-db-leave-admin.ts
  - Apply: npx tsx scripts/clean-db-leave-admin.ts --apply

- Test upload flow (local): node scripts/test-upload-empresa.cjs
- Debug file presence: node scripts/check-uploaded-file.cjs

### 10) Recommendations & next maintenance tasks

1. Remove or secure debug endpoints once verified (`src/app/api/debug/*` and test scripts in `scripts/`).
2. Add Range/partial-content support to `/api/uploads/[...path]/route.ts` so clients (browsers) can request partial content for large files.
3. Add Cache-Control policies and ETag support (or use Next image optimizer if appropriate).
4. Add automated rollback script for DB backups (readable JSON -> re-insert with correct FK order) if rollbacks are likely.
5. Harden file deletion/GC: when deleting DB rows ensure on-disk images are removed transactionally (or via background job) and check for orphan files.
6. Add automated integration tests for upload -> serve flow (CI) to prevent regressions.

### 11) How to use this section

- This audit should be the first reference for any operational request (deploy, debug, PR, data migrations). Keep it updated: add an entry here for any future scripts you add or major change to data flow.

---

## ✅ Cambio aplicado

Se añadieron scripts y endpoints de mantenimiento y migración para arreglar el problema de imágenes en producción y realizar limpiezas seguras. Todos los scripts relacionados y resultados de ejecución pueden encontrarse en la carpeta `scripts/` y en los backups `scripts/backups/`.


**Última actualización**: $(date)
**Mantenido por**: Equipo de Desarrollo IMGC

---

## 🧭 Gestión de Cuentas (UI)

Se añadió una nueva ruta y página administrativa para la gestión de cuentas:

- **Ruta**: `/gestion-de-cuentas`
- **Archivo**: `src/app/(app)/gestion-de-cuentas/page.tsx`

Funcionalidad implementada (frontend):
- Listado de usuarios (consume `GET /api/users`)
- Búsqueda por usuario/email
- Filtrado por rol
- Crear usuario (POST `/api/users`)
- Editar usuario (PUT `/api/users/:id`)
- Eliminar usuario (DELETE `/api/users/:id`)
- Reset de contraseña (POST `/api/users/:id/password-reset`) — el token creado se muestra al admin y se copia al portapapeles (el envío de email no está implementado en el backend actualmente)

Nota operativa: esta página reutiliza los componentes UI existentes (Dialog, Table, Inputs) y asume que el usuario que la utiliza tiene rol Admin.

Dev helper: hay una anulación de desarrollo disponible en `src/lib/auth-server.ts` que permite forzar el rol Admin para un usuario de desarrollo configurado mediante las variables de entorno `DEV_SUPERADMIN_USERNAME` o `DEV_SUPERADMIN_EMAIL`. No habilitar estas variables en producción.

---

## 🖼️ Actualizaciones de UI recientes

- Se removió la visualización de “Gerente” en vistas de detalle no relacionadas con formularios/tablas:
  - Página de detalles de Empresa: `src/app/(app)/empresas/[id]/page.tsx`
  - Diálogo `EmpresaDetails`: `src/components/EmpresaDetails.tsx`
  - Página de detalles de Departamento: `src/app/(app)/departamentos/[id]/page.tsx`

Estas vistas ya no muestran el gerente del departamento y no envían `gerenteId` al crear departamentos desde Empresa. La funcionalidad de gerente se mantiene en APIs y en flujos donde sí aplica (asignaciones, auditoría) según reglas de negocio.

- Se removió “Gerente” de reportes y exportaciones:
  - Endpoints de reportes: `movimientos-historial`, `audit-logger`, `asignaciones-modificaciones` ya no incluyen campos `gerente`/`gerenteId` en la salida.
  - Utilidades de exportación: `src/utils/exportUtils.ts` actualizada para no generar columna “Gerente” en Excel/PDF (modo legacy).
  - UI de reportes: componentes que mostraban/filtraban por “Gerente” fueron ajustados (p. ej. `EmployeeAssignmentHistory`) para evitar referencias.
