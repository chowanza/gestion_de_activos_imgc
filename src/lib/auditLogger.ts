// src/lib/auditLogger.ts
// Compatibility wrapper: route code may import from '@/lib/auditLogger'.
// Delegate to the canonical logger in '@/lib/audit-logger' which enforces
// the standardized action set: NAVEGACION | CREACION | ACTUALIZACION | ELIMINACION.
import { AuditLogger as BaseAuditLogger } from './audit-logger';

export class AuditLogger {
  static async logCreate(
    entityType: string,
    entityId: string,
    description: string,
    userId?: string
  ) {
    return BaseAuditLogger.logCreate(entityType, entityId, description, userId);
  }

  static async logUpdate(
    entityType: string,
    entityId: string,
    description: string,
    userId?: string
  ) {
    return BaseAuditLogger.logUpdate(entityType, entityId, description, userId);
  }

  static async logDelete(
    entityType: string,
    entityId: string,
    description: string,
    userId?: string
  ) {
    return BaseAuditLogger.logDelete(entityType, entityId, description, userId);
  }

  static async logView(
    entityType: string,
    entityId: string,
    description: string,
    userId?: string
  ) {
    return BaseAuditLogger.logView(entityType, entityId, description, userId);
  }
}
