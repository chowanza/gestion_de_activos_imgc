#!/usr/bin/env node
/**
 * Script: create-ubicacion-actual-view.ts
 * Propósito: Crear o reemplazar la vista SQL Server `vw_ubicacion_actual`
 * que devuelve la última asignación por equipo (Computador y Dispositivo).
 * Uso: npx tsx scripts/create-ubicacion-actual-view.ts
 */
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🚀 Creando vista dbo.vw_ubicacion_actual...');

  try {
    // Eliminar la vista si existe (forma compatible SQL Server)
    await prisma.$executeRawUnsafe(`IF OBJECT_ID('dbo.vw_ubicacion_actual', 'V') IS NOT NULL DROP VIEW dbo.vw_ubicacion_actual;`);

    const createSql = `CREATE VIEW dbo.vw_ubicacion_actual AS
SELECT 'C' AS tipo, computadorId AS equipoId, ubicacionId, date, targetEmpleadoId, id as asignacionId
FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY computadorId ORDER BY date DESC) AS rn
  FROM AsignacionesEquipos
  WHERE computadorId IS NOT NULL
) t WHERE rn = 1
UNION ALL
SELECT 'D' AS tipo, dispositivoId AS equipoId, ubicacionId, date, targetEmpleadoId, id as asignacionId
FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY dispositivoId ORDER BY date DESC) AS rn
  FROM AsignacionesEquipos
  WHERE dispositivoId IS NOT NULL
) t2 WHERE rn = 1;`;

    await prisma.$executeRawUnsafe(createSql);

    console.log('✅ Vista creada o reemplazada: dbo.vw_ubicacion_actual');
  } catch (error) {
    console.error('❌ Error creando la vista:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
