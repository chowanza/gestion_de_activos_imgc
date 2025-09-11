import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuditLogger {
  static async logView(entity: string, description: string, userId?: string) {
    try {
      await prisma.historialMovimientos.create({
        data: {
          accion: 'VIEW',
          entidad: entity,
          descripcion: description,
          usuarioId: userId || null,
          fecha: new Date(),
        },
      });
    } catch (error) {
      console.error('Error logging view:', error);
    }
  }

  static async logCreate(entity: string, entityId: string, details: any, userId?: string) {
    try {
      await prisma.historialMovimientos.create({
        data: {
          accion: 'CREATE',
          entidad: entity,
          entidadId: entityId,
          descripcion: `Creado ${entity}: ${details.nombre || entityId}`,
          detalles: JSON.stringify(details),
          usuarioId: userId || null,
          fecha: new Date(),
        },
      });
    } catch (error) {
      console.error('Error logging create:', error);
    }
  }

  static async logUpdate(entity: string, entityId: string, details: any, userId?: string) {
    try {
      await prisma.historialMovimientos.create({
        data: {
          accion: 'UPDATE',
          entidad: entity,
          entidadId: entityId,
          descripcion: `Actualizado ${entity}: ${details.nombre || entityId}`,
          detalles: JSON.stringify(details),
          usuarioId: userId || null,
          fecha: new Date(),
        },
      });
    } catch (error) {
      console.error('Error logging update:', error);
    }
  }

  static async logDelete(entity: string, entityId: string, details: any, userId?: string) {
    try {
      await prisma.historialMovimientos.create({
        data: {
          accion: 'DELETE',
          entidad: entity,
          entidadId: entityId,
          descripcion: `Eliminado ${entity}: ${details.nombre || entityId}`,
          detalles: JSON.stringify(details),
          usuarioId: userId || null,
          fecha: new Date(),
        },
      });
    } catch (error) {
      console.error('Error logging delete:', error);
    }
  }
}
