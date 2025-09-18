// src/lib/auditLogger.ts
import { prisma } from './prisma';

export class AuditLogger {
  static async logCreate(
    entityType: string,
    entityId: string,
    description: string,
    userId?: string
  ) {
    try {
      await prisma.historialMovimientos.create({
        data: {
          entidad: entityType,
          entidadId: entityId,
          accion: 'CREATE',
          descripcion: description,
          usuarioId: userId || null
        }
      });
    } catch (error) {
      console.error('Error logging create action:', error);
    }
  }

  static async logUpdate(
    entityType: string,
    entityId: string,
    description: string,
    userId?: string
  ) {
    try {
      await prisma.historialMovimientos.create({
        data: {
          entidad: entityType,
          entidadId: entityId,
          accion: 'UPDATE',
          descripcion: description,
          usuarioId: userId || null
        }
      });
    } catch (error) {
      console.error('Error logging update action:', error);
    }
  }

  static async logDelete(
    entityType: string,
    entityId: string,
    description: string,
    userId?: string
  ) {
    try {
      await prisma.historialMovimientos.create({
        data: {
          entidad: entityType,
          entidadId: entityId,
          accion: 'DELETE',
          descripcion: description,
          usuarioId: userId || null
        }
      });
    } catch (error) {
      console.error('Error logging delete action:', error);
    }
  }
}
