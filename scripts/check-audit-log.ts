
import { prisma } from '../src/lib/prisma';

async function checkAuditLog() {
  console.log('🔍 Checking Audit Log (HistorialMovimientos)...');

  try {
    const logs = await prisma.historialMovimientos.findMany({
      take: 10,
      orderBy: {
        fecha: 'desc'
      },
      include: {
        usuario: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    if (logs.length === 0) {
      console.log('⚠️ No audit logs found.');
      return;
    }

    console.log(`✅ Found ${logs.length} recent logs:`);
    logs.forEach(log => {
      console.log('------------------------------------------------');
      console.log(`📅 Date: ${log.fecha.toISOString()}`);
      console.log(`👤 User: ${log.usuario?.username || 'Unknown'} (${log.usuarioId})`);
      console.log(`📝 Action: ${log.accion}`);
      console.log(`📦 Entity: ${log.entidad} (ID: ${log.entidadId})`);
      console.log(`📄 Description: ${log.descripcion}`);
      console.log(`ℹ️ Details: ${log.detalles}`);
    });
    console.log('------------------------------------------------');

  } catch (error) {
    console.error('❌ Error checking audit log:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAuditLog();
