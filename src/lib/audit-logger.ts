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

  // Método para logging de navegación (NAVEGACION)
  static async logNavigation(route: string, routeName: string, usuarioId?: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      accion: 'NAVEGACION',
      entidad: 'sistema',
      entidadId: route,
      descripcion: `Usuario navegó a: ${routeName}`,
      detalles: {
        ruta: route,
        pagina: routeName,
        timestamp: new Date().toISOString(),
        tipo: 'navegacion'
      },
      usuarioId,
      ipAddress,
      userAgent
    });
  }

  // Métodos de conveniencia para acciones comunes
  static async logLogin(usuarioId: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      accion: 'NAVEGACION',
      entidad: 'usuario',
      entidadId: usuarioId,
      descripcion: 'Usuario inició sesión',
      detalles: {
        tipo: 'login',
        timestamp: new Date().toISOString()
      },
      usuarioId,
      ipAddress,
      userAgent
    });
  }

  static async logLogout(usuarioId: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      accion: 'NAVEGACION',
      entidad: 'usuario',
      entidadId: usuarioId,
      descripcion: 'Usuario cerró sesión',
      detalles: {
        tipo: 'logout',
        timestamp: new Date().toISOString()
      },
      usuarioId,
      ipAddress,
      userAgent
    });
  }

  static async logCreate(entidad: string, entidadId: string, descripcion: string, usuarioId?: string, detalles?: any) {
    await this.log({
      accion: 'CREACION',
      entidad,
      entidadId,
      descripcion,
      detalles: {
        ...detalles,
        tipo: 'creacion',
        timestamp: new Date().toISOString()
      },
      usuarioId
    });
  }

  static async logUpdate(entidad: string, entidadId: string, descripcion: string, usuarioId?: string, detalles?: any) {
    await this.log({
      accion: 'ACTUALIZACION',
      entidad,
      entidadId,
      descripcion,
      detalles: {
        ...detalles,
        tipo: 'actualizacion',
        timestamp: new Date().toISOString()
      },
      usuarioId
    });
  }

  static async logDelete(entidad: string, entidadId: string, descripcion: string, usuarioId?: string, detalles?: any) {
    await this.log({
      accion: 'ELIMINACION',
      entidad,
      entidadId,
      descripcion,
      detalles: {
        ...detalles,
        tipo: 'eliminacion',
        timestamp: new Date().toISOString()
      },
      usuarioId
    });
  }

  static async logView(entidad: string, entidadId: string, descripcion: string, usuarioId?: string) {
    await this.log({
      accion: 'NAVEGACION',
      entidad,
      entidadId,
      descripcion,
      detalles: {
        tipo: 'view',
        timestamp: new Date().toISOString()
      },
      usuarioId
    });
  }

  static async logAssign(entidad: string, entidadId: string, descripcion: string, usuarioId?: string, detalles?: any) {
    await this.log({
      accion: 'ACTUALIZACION',
      entidad,
      entidadId,
      descripcion,
      detalles: {
        ...detalles,
        tipo: 'asignacion',
        subtipo: 'asignacion',
        timestamp: new Date().toISOString()
      },
      usuarioId
    });
  }

  static async logUnassign(entidad: string, entidadId: string, descripcion: string, usuarioId?: string, detalles?: any) {
    await this.log({
      accion: 'ACTUALIZACION',
      entidad,
      entidadId,
      descripcion,
      detalles: {
        ...detalles,
        tipo: 'asignacion',
        subtipo: 'devolucion',
        timestamp: new Date().toISOString()
      },
      usuarioId
    });
  }

  // Método específico para cambios de estado
  static async logStateChange(entidad: string, entidadId: string, estadoAnterior: string, estadoNuevo: string, usuarioId?: string, detalles?: any) {
    await this.log({
      accion: 'ACTUALIZACION',
      entidad,
      entidadId,
      descripcion: `Estado cambiado de ${estadoAnterior} a ${estadoNuevo}`,
      detalles: {
        ...detalles,
        tipo: 'cambio_estado',
        subtipo: 'cambio_estado',
        estadoAnterior,
        estadoNuevo,
        timestamp: new Date().toISOString()
      },
      usuarioId
    });
  }
}


