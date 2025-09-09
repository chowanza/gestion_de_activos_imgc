import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';

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
    // Obtener usuario de la sesión para auditoría
    const user = await getServerUser(request);
    
    const empleados = await prisma.empleado.findMany({
      include: {
        departamento: {
          include: {
            empresa: true
          }
        },
        cargo: true,
        computadores: {
          include: {
            modelo: {
              include: {
                marca: true
              }
            }
          }
        },
        dispositivos: {
          include: {
            modelo: {
              include: {
                marca: true
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
    const mappedEmpleados = empleados.map(empleado => ({
      ...empleado,
      cedula: empleado.ced, // Mapear ced a cedula
      fechaNacimiento: empleado.fechaNacimiento, // Mantener formato original
      fechaIngreso: empleado.fechaIngreso, // Mantener formato original
      fechaDesincorporacion: empleado.fechaDesincorporacion, // Incluir fecha de desincorporación
      departamentoId: empleado.departamentoId, // Incluir departamentoId para filtrado
      // Calcular estado basado en fechaDesincorporacion
      estado: empleado.fechaDesincorporacion ? 'Inactivo' : 'Activo',
    }));

    // Registrar acceso a la lista de usuarios
    if (user) {
      await AuditLogger.logView(
        'usuarios',
        'lista',
        `Usuario ${user.username} accedió a la lista de usuarios`,
        user.id as string
      );
    }

    return NextResponse.json(mappedEmpleados, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener usuario' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Datos recibidos en API:', body);
    
    const { cargoId, departamentoId, cedula, empresaId, ...rest } = body;

    // Validación básica
    if (!cargoId || !departamentoId) {
      return NextResponse.json(
        { message: 'El cargo y departamento son requeridos' },
        { status: 400 }
      );
    }

    // Procesar fechas y excluir empresaId (no existe en el modelo Empleado)
    const { fechaNacimiento, fechaIngreso, fechaDesincorporacion, ...otherFields } = rest;
    
    // Función para procesar fechas y evitar problemas de zona horaria
    const processDate = (dateString: string | null): string | null => {
      if (!dateString) return null;
      
      // Si la fecha viene en formato ISO (YYYY-MM-DD), procesarla correctamente
      if (dateString.includes('-')) {
        // Crear una fecha en la zona horaria local para evitar el offset de UTC
        const date = new Date(dateString + 'T00:00:00');
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        return localDate.toISOString().split('T')[0];
      }
      
      return dateString;
    };
    
    const processedData = {
      ...otherFields,
      // Procesar fechas para evitar problemas de zona horaria
      fechaNacimiento: processDate(fechaNacimiento),
      fechaIngreso: processDate(fechaIngreso),
      fechaDesincorporacion: processDate(fechaDesincorporacion),
    };



    const newEmpleado = await prisma.empleado.create({
      data: {
        cargoId,
        departamentoId,
        ced: cedula, // Mapear cedula a ced
        ...processedData,
      },
      include: {
        departamento: {
          include: {
            empresa: true
          }
        },
        cargo: true
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

    return NextResponse.json(newEmpleado, { status: 201 });
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
