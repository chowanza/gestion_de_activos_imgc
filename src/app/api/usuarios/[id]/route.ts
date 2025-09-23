import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to format date to dd/mm/yy
function formatDateToDDMMYY(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
}


export async function GET(request: NextRequest) {
  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
    const empleado = await prisma.empleado.findUnique({
      where: {
        id: id,
      },
      include: {
        departamento: {
          include: {
            empresa: true
          }
        },
        cargo: true,
        computadores: {
          where: {
            estado: {
              not: 'OPERATIVO' // Solo mostrar computadores que NO estén en estado operativo (no asignados)
            }
          },
          include: {
            modelo: {
              include: {
                marca: true
              }
            }
          }
        },
        dispositivos: {
          where: {
            estado: {
              not: 'OPERATIVO' // Solo mostrar dispositivos que NO estén en estado operativo (no asignados)
            }
          },
          include: {
            modelo: {
              include: {
                marca: true
              }
            }
          }
        },
        statusHistory: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
    if (!empleado) {
      return NextResponse.json({ message: 'empleado no encontrado' }, { status: 404 });
    }
    
    // Agregar estado calculado basado en fechaDesincorporacion
    const empleadoConEstado = {
      ...empleado,
      estado: empleado.fechaDesincorporacion ? 'Inactivo' : 'Activo',
      fotoPerfil: empleado.fotoPerfil,
    };
    
    return NextResponse.json(empleadoConEstado, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener empleado' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
    try {
        const body = await request.json();

        // Extraemos los datos del cuerpo de la petición.
        const { nombre, apellido, cargoId, ced, cedula, departamentoId, email, fechaNacimiento, fechaIngreso, fechaDesincorporacion, telefono, direccion, fotoPerfil } = body;
        

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

        // Construimos el objeto de datos para la actualización.
        const dataToUpdate: { [key: string]: any } = {};
        if (nombre) dataToUpdate.nombre = nombre;
        if (apellido) dataToUpdate.apellido = apellido;
        if (ced) dataToUpdate.ced = ced;
        if (cedula) dataToUpdate.ced = cedula; // Mapear cedula a ced
        if (email !== undefined) dataToUpdate.email = email;
        if (fechaNacimiento) dataToUpdate.fechaNacimiento = processDate(fechaNacimiento);
        if (fechaIngreso) dataToUpdate.fechaIngreso = processDate(fechaIngreso);
        if (fechaDesincorporacion !== undefined) dataToUpdate.fechaDesincorporacion = processDate(fechaDesincorporacion);
        if (telefono !== undefined) dataToUpdate.telefono = telefono;
        if (direccion !== undefined) dataToUpdate.direccion = direccion;
        if (fotoPerfil !== undefined) dataToUpdate.fotoPerfil = fotoPerfil;
        
        // Manejar cargoId usando la relación correcta
        if (cargoId) {
            dataToUpdate.cargo = {
                connect: { id: cargoId }
            };
        }
        
        // Manejar departamentoId usando la relación correcta
        if (departamentoId) {
            dataToUpdate.departamento = {
                connect: { id: departamentoId }
            };
        }
        

        const updatedEmpleado = await prisma.empleado.update({
            where: {
                id: id,
            },
            data: dataToUpdate, // Pasamos el objeto de datos corregido
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
            }
        });

        // Agregar estado calculado basado en fechaDesincorporacion
        const empleadoConEstado = {
            ...updatedEmpleado,
            estado: updatedEmpleado.fechaDesincorporacion ? 'Inactivo' : 'Activo',
            fotoPerfil: updatedEmpleado.fotoPerfil,
        };

        return NextResponse.json(empleadoConEstado, { status: 200 });

    } catch (error) {
        console.error("Error en PUT /api/usuarios/[id]:", error);
        // Devolvemos el error de Prisma para tener más detalles en el cliente
        return NextResponse.json(
            { message: 'Error al actualizar el usuario', error: (error as Error).message },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
    await prisma.empleado.delete({
      where: {
        id: id,
      },
    });
    return NextResponse.json({ message: 'empleado eliminado' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al eliminar empleado' }, { status: 500 });
  }
}
