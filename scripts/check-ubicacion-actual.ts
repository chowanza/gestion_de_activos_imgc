#!/usr/bin/env node
/**
 * Script: check-ubicacion-actual.ts
 * Propósito: Ejecutar una consulta de verificación sobre `vw_ubicacion_actual`
 * y mostrar un muestreo de filas para validar la vista.
 * Uso: npx tsx scripts/check-ubicacion-actual.ts
 */
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🔎 Verificando contenido de dbo.vw_ubicacion_actual (TOP 20)...');
  try {
    const rows = await prisma.$queryRawUnsafe(`
      SELECT TOP 20 v.tipo, v.equipoId, v.ubicacionId, v.date, v.targetEmpleadoId, v.asignacionId,
        c.serial AS computadorSerial, d.serial AS dispositivoSerial,
        e.nombre + ' ' + e.apellido AS empleadoNombre
      FROM dbo.vw_ubicacion_actual v
      LEFT JOIN Computador c ON c.id = v.equipoId AND v.tipo = 'C'
      LEFT JOIN Dispositivo d ON d.id = v.equipoId AND v.tipo = 'D'
      LEFT JOIN Empleado e ON e.id = v.targetEmpleadoId
      ORDER BY v.date DESC
    `);

    console.log('--- Muestra de vw_ubicacion_actual ---');
    console.log(rows);
    console.log('✅ Consulta completada. Si ves filas, la vista existe y devuelve resultados.');
  } catch (error) {
    console.error('❌ Error verificando la vista:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
