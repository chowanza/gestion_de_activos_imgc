# 🌱 Scripts de Datos de Prueba

Este directorio contiene scripts para generar datos de prueba para el sistema de gestión de activos.

## 📋 Scripts Disponibles

### 1. **Datos Básicos** (`seed-basic-data.ts`)
Crea una estructura mínima para probar la funcionalidad básica:
- 1 empresa
- 1 departamento
- 1 cargo
- 3 empleados
- 1 gerente asignado

**Uso:**
```bash
node scripts/run-seed-basic.cjs
```

### 2. **Datos Completos** (`seed-test-data-complete.ts`)
Crea una estructura completa con datos realistas:
- 4 empresas
- 10 departamentos
- 21 cargos
- 22 empleados
- 5 marcas de dispositivos
- 14 modelos de dispositivos
- 18 equipos (computadores y dispositivos)
- Gerentes asignados a departamentos

**Uso:**
```bash
node scripts/run-seed-complete.cjs
```

### 3. **Limpieza Selectiva** (`clear-database-keep-empresas-admin.ts`)
Limpia la base de datos manteniendo solo:
- ✅ Empresas existentes
- ✅ Usuario admin
- 🗑️ Elimina: Departamentos, Empleados, Cargos, Equipos, Asignaciones

**Uso:**
```bash
node scripts/run-clear-empresas-admin.cjs
```

## 🚀 Cómo Ejecutar

### Opción 1: Usando los scripts de Node.js (Recomendado)
```bash
# Para datos básicos
node scripts/run-seed-basic.cjs

# Para datos completos
node scripts/run-seed-complete.cjs

# Para limpiar base de datos (mantener empresas y admin)
node scripts/run-clear-empresas-admin.cjs
```

### Opción 2: Ejecutando directamente con tsx
```bash
# Para datos básicos
npx tsx scripts/seed-basic-data.ts

# Para datos completos
npx tsx scripts/seed-test-data-complete.ts

# Para limpiar base de datos
npx tsx scripts/clear-database-keep-empresas-admin.ts
```

## ⚠️ Consideraciones Importantes

### **Script de Datos Básicos**
- ✅ **Seguro**: No elimina datos existentes
- ✅ **Rápido**: Solo crea lo mínimo necesario
- ✅ **Ideal para**: Pruebas rápidas y desarrollo

### **Script de Datos Completos**
- ⚠️ **Cuidado**: Elimina TODOS los datos existentes
- ⚠️ **Completo**: Crea una estructura completa
- ✅ **Ideal para**: Demostraciones y pruebas exhaustivas

### **Script de Limpieza Selectiva**
- ✅ **Seguro**: Mantiene empresas y usuario admin
- ✅ **Inteligente**: Elimina solo datos de prueba
- ✅ **Ideal para**: Resetear datos de prueba sin perder configuración

## 📊 Datos Creados

### Empresas
1. **TechCorp Solutions** - Soluciones tecnológicas empresariales
2. **InnovateSoft** - Desarrollo de software innovador
3. **DataFlow Systems** - Análisis de datos y BI
4. **CloudTech Services** - Servicios de infraestructura en la nube

### Departamentos por Empresa
- **TechCorp**: Desarrollo de Software, Infraestructura IT, Recursos Humanos
- **InnovateSoft**: Frontend Development, Backend Development, QA & Testing
- **DataFlow**: Data Science, Business Intelligence
- **CloudTech**: DevOps, Cloud Architecture

### Empleados
- 22 empleados con datos realistas
- Fechas de nacimiento e ingreso variadas
- Cargos específicos por departamento
- Gerentes asignados a departamentos

### Equipos
- **Marcas**: Dell, HP, Lenovo, Apple, Samsung
- **Modelos**: Laptops, Desktops, Tablets
- **Estados**: Activo, Disponible, Mantenimiento
- **Asignaciones**: Algunos empleados tienen equipos asignados

## 🔧 Solución de Problemas

### Error: "Cannot find module 'tsx'"
```bash
npm install -g tsx
# o
npx tsx --version
```

### Error: "Prisma Client not found"
```bash
npx prisma generate
```

### Error: "Database connection failed"
Verifica que tu base de datos esté ejecutándose y que la variable `DATABASE_URL` esté configurada correctamente.

## 🎯 Casos de Uso

### Para Desarrollo
```bash
node scripts/run-seed-basic.cjs
```
Usa datos básicos para desarrollo rápido.

### Para Demostraciones
```bash
node scripts/run-seed-complete.cjs
```
Usa datos completos para mostrar todas las funcionalidades.

### Para Testing
Ejecuta el script completo antes de las pruebas para tener un estado conocido de la base de datos.

### Para Limpieza Selectiva
```bash
node scripts/run-clear-empresas-admin.cjs
```
Limpia datos de prueba manteniendo empresas y admin.

## 📝 Notas Adicionales

- Los scripts usan fechas en formato ISO (YYYY-MM-DD)
- Las cédulas son números de 8 dígitos
- Los seriales de equipos siguen un patrón (PC001, TAB001, etc.)
- Los gerentes se asignan automáticamente a los departamentos
- Los equipos se asignan tanto a empleados como a departamentos

## 🔄 Limpiar Datos

Si necesitas limpiar todos los datos manualmente:

```sql
-- Ejecutar en tu base de datos SQL Server
DELETE FROM Asignaciones;
DELETE FROM Computador;
DELETE FROM Dispositivo;
DELETE FROM Empleado;
DELETE FROM Cargo;
DELETE FROM Departamento;
DELETE FROM Empresa;
DELETE FROM ModeloDispositivo;
DELETE FROM Marca;
```

O simplemente ejecuta el script completo que limpia automáticamente antes de crear nuevos datos.
