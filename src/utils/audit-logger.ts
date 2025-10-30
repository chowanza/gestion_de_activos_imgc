import { AuditLogger as BaseAuditLogger } from '@/lib/audit-logger';

// Backward-compatible wrapper to ensure any legacy imports still produce
// standardized actions (NAVEGACION, CREACION, ACTUALIZACION, ELIMINACION)
// and avoid creating extra Prisma clients in utils.
export class AuditLogger {
  static async logView(entity: string, description: string, userId?: string) {
    // Treat view as navigation to the entity detail
    return BaseAuditLogger.logNavigation(entity, description, userId);
  }

  static async logCreate(entity: string, entityId: string, details: any, userId?: string) {
    const desc = `Creado ${entity}: ${details?.nombre || entityId}`;
    return BaseAuditLogger.logCreate(entity, entityId, desc, userId, details);
  }

  static async logUpdate(entity: string, entityId: string, details: any, userId?: string) {
    const desc = `Actualizado ${entity}: ${details?.nombre || entityId}`;
    return BaseAuditLogger.logUpdate(entity, entityId, desc, userId, details);
  }

  static async logDelete(entity: string, entityId: string, details: any, userId?: string) {
    const desc = `Eliminado ${entity}: ${details?.nombre || entityId}`;
    return BaseAuditLogger.logDelete(entity, entityId, desc, userId, details);
  }
}
