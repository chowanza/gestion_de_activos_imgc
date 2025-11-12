export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import { promises as fs } from 'fs';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';
import { requirePermission, requireAnyPermission } from '@/lib/role-middleware';

// Helper function to format date to dd/mm/yy
function formatDateToDDMMYY(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
}

// Helper function to parse dd/mm/yy to ISO string
function parseDDMMYYToISO(dateString: string): string {
  const [day, month, year] = dateString.split('/');
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    // Require view permission
    const deny = await requirePermission('canView')(request as any);
    if (deny) return deny;

    // Obtener usuario de la sesión para auditoría
    const user = await getServerUser(request);
    
    const empleados = await prisma.empleado.findMany({
      include: {
        organizaciones: {
          where: { activo: true },
          include: {
            empresa: true,
            departamento: true,
            cargo: true
          }
        },
        asignacionesComoTarget: {
          where: { activo: true },
          include: {
            computador: {
              include: {
                computadorModelos: {
                  include: {
                    modeloEquipo: {
                      include: {
                        marcaModelos: {
                          include: {
                            marca: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            dispositivo: {
              include: {
                dispositivoModelos: {
                  include: {
                    modeloEquipo: {
                      include: {
                        marcaModelos: {
                          include: {
                            marca: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    // Mapear campos de la API al formato esperado por el frontend
    const mappedEmpleados = empleados.map(empleado => {
      // Obtener la organización activa (primera si hay múltiples)
      const organizacionActiva = empleado.organizaciones[0];
      
      // Mapear equipos asignados
      const computadores = empleado.asignacionesComoTarget
        .filter(a => a.computador && a.actionType === 'Assignment')
        .map(a => a.computador);
      
      const dispositivos = empleado.asignacionesComoTarget
        .filter(a => a.dispositivo && a.actionType === 'Assignment')
        .map(a => a.dispositivo);
      
      return {
        ...empleado,
        cedula: empleado.ced, // Mapear ced a cedula
        fechaNacimiento: empleado.fechaNacimiento, // Mantener formato original
        fechaIngreso: empleado.fechaIngreso, // Mantener formato original
        fechaDesincorporacion: empleado.fechaDesincorporacion, // Incluir fecha de desincorporación
        fotoPerfil: empleado.fotoPerfil, // Incluir foto de perfil
        // Mapear relaciones normalizadas a formato esperado por el frontend
        departamento: organizacionActiva?.departamento || null,
        cargo: organizacionActiva?.cargo || null,
        empresa: organizacionActiva?.empresa || null,
        departamentoId: organizacionActiva?.departamentoId || null,
        cargoId: organizacionActiva?.cargoId || null,
        empresaId: organizacionActiva?.empresaId || null,
        // Mapear equipos asignados
        computadores: computadores,
        dispositivos: dispositivos,
        // Calcular estado basado en fechaDesincorporacion
        estado: empleado.fechaDesincorporacion ? 'Inactivo' : 'Activo',
      };
    });

    // No registrar acceso a listas - ya se registra la navegación en useAuditLogger

    return NextResponse.json(mappedEmpleados, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener usuario' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require create/manage permissions to create empleados
    const deny = await requireAnyPermission(['canCreate','canManageDepartamentos','canManageUsers'])(request as any);
    if (deny) return deny;

    // Support both JSON and FormData (file upload for fotoPerfil)
    const contentType = request.headers.get('content-type') || '';
    let body: any = {};
    let fotoPerfilFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      // Copy fields
      for (const [key, value] of formData.entries()) {
        if (key === 'fotoPerfil' && value instanceof File) {
          fotoPerfilFile = value as File;
        } else if (typeof value === 'string') {
          body[key] = value;
        }
      }
    } else {
      body = await request.json();
    }
    console.log('Datos recibidos en API:', body);
    
    const { cargoId, departamentoId, cedula, empresaId, ...rest } = body;

    // Validación básica
    if (!departamentoId) {
      return NextResponse.json(
        { message: 'El departamento es requerido' },
        { status: 400 }
      );
    }

    // Procesar fechas y excluir empresaId (no existe en el modelo Empleado)
    const { fechaNacimiento, fechaIngreso, fechaDesincorporacion, fotoPerfil, ...otherFields } = rest;

    // If a file was uploaded via FormData, save it to disk and set fotoPerfil accordingly
    let savedFotoPerfil: string | null = null;
    if (fotoPerfilFile) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'usuarios');
      await fs.mkdir(uploadDir, { recursive: true });
      const fileExt = path.extname(fotoPerfilFile.name) || '.jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExt}`;
      const filePath = path.join(uploadDir, fileName);
      const bytes = await fotoPerfilFile.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(bytes));
      savedFotoPerfil = `/api/uploads/usuarios/${fileName}`;
    }
    
    // Función para procesar fechas y evitar problemas de zona horaria
    const processDate = (dateString: string | null): string | null => {
      if (!dateString) return null;
      
      // Si la fecha viene en formato ISO (YYYY-MM-DD), mantenerla tal como está
      if (dateString.includes('-')) {
        // Simplemente retornar la fecha sin procesamiento adicional
        // para evitar problemas de zona horaria
        return dateString;
      }
      
      return dateString;
    };
    
    // Ensure fotoPerfil is either a string (URL/path) or null. If frontend sent an object
    // (e.g. empty object or placeholder), try to extract a plausible string property
    // or fall back to null. This prevents Prisma validation errors when an object
    // is provided where a String | Null is expected.
    let incomingFoto: string | null = null;
    if (savedFotoPerfil) {
      incomingFoto = savedFotoPerfil;
    } else if (typeof fotoPerfil === 'string') {
      incomingFoto = fotoPerfil || null;
    } else if (fotoPerfil && typeof fotoPerfil === 'object') {
      // Try common fields where a frontend might place the URL/path
      // e.g. { url: '/api/uploads/...'}, { path: '/uploads/...'}, { filename: '...' }
      // If none found, treat as null.
      const candidate = (fotoPerfil as any).url || (fotoPerfil as any).path || (fotoPerfil as any).filename || null;
      incomingFoto = typeof candidate === 'string' ? candidate : null;
    } else {
      incomingFoto = null;
    }

    const processedData = {
      ...otherFields,
      // Procesar fechas para evitar problemas de zona horaria
      fechaNacimiento: processDate(fechaNacimiento),
      fechaIngreso: processDate(fechaIngreso),
      fechaDesincorporacion: processDate(fechaDesincorporacion),
      // Ensure fotoPerfil is a string or null
      fotoPerfil: incomingFoto,
    };



    // Crear empleado sin relaciones directas
    const newEmpleado = await prisma.empleado.create({
      data: {
        ced: cedula || '', // Mapear cedula a ced, usar string vacío si no se proporciona
        ...processedData,
      }
    });

    // Crear la relación organizacional si se proporcionan los datos
    if (departamentoId && cargoId && empresaId) {
      await prisma.empleadoEmpresaDepartamentoCargo.create({
        data: {
          empleadoId: newEmpleado.id,
          empresaId: empresaId,
          departamentoId: departamentoId,
          cargoId: cargoId,
          activo: true
        }
      });
    }

    // Obtener el empleado con sus relaciones para la respuesta
    const empleadoCompleto = await prisma.empleado.findUnique({
      where: { id: newEmpleado.id },
      include: {
        organizaciones: {
          where: { activo: true },
          include: {
            empresa: true,
            departamento: true,
            cargo: true
          }
        }
      }
    });


    // Obtener usuario de la sesión para auditoría
    const user = await getServerUser(request);
    
    // Registrar en auditoría
    await AuditLogger.logCreate(
      'empleado',
      newEmpleado.id,
      `Empleado ${newEmpleado.nombre} ${newEmpleado.apellido} creado`,
      user?.id as string
    );

    // Registrar en historial de estado del empleado
    // La fecha debe coincidir con la fecha de ingreso si fue proporcionada
    await prisma.empleadoStatusHistory.create({
      data: {
        empleadoId: newEmpleado.id,
        accion: 'Empleado Creado',
        fecha: (newEmpleado as any).fechaIngreso || new Date().toISOString().split('T')[0],
        motivo: `Empleado ${newEmpleado.nombre} ${newEmpleado.apellido} creado en el sistema`
      }
    });

    // Mapear la respuesta al formato esperado por el frontend
    const organizacionActiva = empleadoCompleto?.organizaciones[0];
    const mappedResponse = {
      ...empleadoCompleto,
      departamento: organizacionActiva?.departamento || null,
      cargo: organizacionActiva?.cargo || null,
      empresa: organizacionActiva?.empresa || null,
      departamentoId: organizacionActiva?.departamentoId || null,
      cargoId: organizacionActiva?.cargoId || null,
      empresaId: organizacionActiva?.empresaId || null,
    };

    return NextResponse.json(mappedResponse, { status: 201 });
  } catch (error: any) {
    console.error('Error creating usuario:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'Ya existe un empleado con esta cédula' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ message: 'Error al crear Empleado' }, { status: 500 });
  }
}
