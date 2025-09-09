// src/lib/audit-logger.ts
import { prisma } from './prisma';

export interface AuditLogData {
  accion: string;
  entidad: string;
  entidadId?: string;
  descripcion: string;
  detalles?: any;
  usuarioId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogger {
  static async log(data: AuditLogData) {
    try {
      await prisma.historialMovimientos.create({
        data: {
          accion: data.accion,
          entidad: data.entidad,
          entidadId: data.entidadId || null,
          descripcion: data.descripcion,
          detalles: data.detalles ? JSON.stringify(data.detalles) : null,
          usuarioId: data.usuarioId || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
        }
      });
    } catch (error) {
      console.error('Error logging audit:', error);
      // No lanzamos el error para no afectar la operación principal
    }
  }

  // Métodos de conveniencia para acciones comunes
  static async logLogin(usuarioId: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      accion: 'login',
      entidad: 'usuario',
      entidadId: usuarioId,
      descripcion: 'Usuario inició sesión',
      usuarioId,
      ipAddress,
      userAgent
    });
  }

  static async logLogout(usuarioId: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      accion: 'logout',
      entidad: 'usuario',
      entidadId: usuarioId,
      descripcion: 'Usuario cerró sesión',
      usuarioId,
      ipAddress,
      userAgent
    });
  }

  static async logCreate(entidad: string, entidadId: string, descripcion: string, usuarioId?: string, detalles?: any) {
    await this.log({
      accion: 'create',
      entidad,
      entidadId,
      descripcion,
      usuarioId,
      detalles
    });
  }

  static async logUpdate(entidad: string, entidadId: string, descripcion: string, usuarioId?: string, detalles?: any) {
    await this.log({
      accion: 'update',
      entidad,
      entidadId,
      descripcion,
      usuarioId,
      detalles
    });
  }

  static async logDelete(entidad: string, entidadId: string, descripcion: string, usuarioId?: string, detalles?: any) {
    await this.log({
      accion: 'delete',
      entidad,
      entidadId,
      descripcion,
      usuarioId,
      detalles
    });
  }

  static async logView(entidad: string, entidadId: string, descripcion: string, usuarioId?: string) {
    await this.log({
      accion: 'view',
      entidad,
      entidadId,
      descripcion,
      usuarioId
    });
  }

  static async logAssign(entidad: string, entidadId: string, descripcion: string, usuarioId?: string, detalles?: any) {
    await this.log({
      accion: 'assign',
      entidad,
      entidadId,
      descripcion,
      usuarioId,
      detalles
    });
  }

  static async logUnassign(entidad: string, entidadId: string, descripcion: string, usuarioId?: string, detalles?: any) {
    await this.log({
      accion: 'unassign',
      entidad,
      entidadId,
      descripcion,
      usuarioId,
      detalles
    });
  }
}


