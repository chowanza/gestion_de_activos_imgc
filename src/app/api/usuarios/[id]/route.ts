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

        // Obtener datos originales del empleado para comparar
        const empleadoOriginal = await prisma.empleado.findUnique({
            where: { id }
        });

        if (!empleadoOriginal) {
            return NextResponse.json({ message: 'Empleado no encontrado' }, { status: 404 });
        }

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
        
        // Actualizar el empleado básico
        const updatedEmpleado = await prisma.empleado.update({
            where: {
                id: id,
            },
            data: dataToUpdate,
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
            }
        });

        // Si se proporciona departamentoId o cargoId, actualizar la organización
        if (departamentoId || cargoId) {
            // Buscar la organización activa del empleado
            const organizacionActiva = await prisma.empleadoEmpresaDepartamentoCargo.findFirst({
                where: {
                    empleadoId: id,
                    activo: true
                }
            });

            if (organizacionActiva) {
                const updateData: any = {};
                if (departamentoId) updateData.departamentoId = departamentoId;
                if (cargoId) updateData.cargoId = cargoId;

                await prisma.empleadoEmpresaDepartamentoCargo.update({
                    where: {
                        id: organizacionActiva.id
                    },
                    data: updateData
                });
            }
        }

        // Registrar en historial de estado del empleado si hubo cambios
        const camposModificados = [];
        if (nombre && nombre !== empleadoOriginal?.nombre) camposModificados.push('nombre');
        if (apellido && apellido !== empleadoOriginal?.apellido) camposModificados.push('apellido');
        if (email !== undefined && email !== empleadoOriginal?.email) camposModificados.push('email');
        if (telefono !== undefined && telefono !== empleadoOriginal?.telefono) camposModificados.push('teléfono');
        if (direccion !== undefined && direccion !== empleadoOriginal?.direccion) camposModificados.push('dirección');
        if (fechaNacimiento && fechaNacimiento !== empleadoOriginal?.fechaNacimiento) camposModificados.push('fecha de nacimiento');
        if (fechaIngreso && fechaIngreso !== empleadoOriginal?.fechaIngreso) camposModificados.push('fecha de ingreso');
        if (fechaDesincorporacion !== undefined && fechaDesincorporacion !== empleadoOriginal?.fechaDesincorporacion) camposModificados.push('fecha de desincorporación');

        if (camposModificados.length > 0) {
            await prisma.empleadoStatusHistory.create({
                data: {
                    empleadoId: id,
                    accion: 'Datos Actualizados',
                    fecha: new Date().toISOString().split('T')[0],
                    motivo: `Se modificaron los siguientes campos: ${camposModificados.join(', ')}`
                }
            });
        }

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
    
    // Verificar si el empleado existe
    const empleado = await prisma.empleado.findUnique({
      where: { id },
      include: {
        asignacionesComoTarget: {
          where: { activo: true },
          include: {
            computador: {
              select: { serial: true }
            },
            dispositivo: {
              select: { serial: true }
            }
          }
        },
        organizaciones: {
          where: { activo: true }
        }
      }
    });

    if (!empleado) {
      return NextResponse.json({ message: 'Empleado no encontrado' }, { status: 404 });
    }

    // Verificar dependencias activas
    const tieneAsignacionesActivas = empleado.asignacionesComoTarget.length > 0;
    const tieneRelacionesActivas = empleado.organizaciones.length > 0;

    // Restricción: No permitir desactivación si tiene equipos asignados
    if (tieneAsignacionesActivas) {
      return NextResponse.json({ 
        message: 'No se puede desactivar al empleado; primero debe desasignar los equipos activos.',
        tipo: 'restriccion_equipos_asignados',
        detalles: {
          asignacionesActivas: empleado.asignacionesComoTarget.length,
          equipos: empleado.asignacionesComoTarget.map(a => ({
            tipo: a.itemType,
            serial: a.computador?.serial || a.dispositivo?.serial
          }))
        }
      }, { status: 409 });
    }

    // Si tiene relaciones activas pero no asignaciones, hacer eliminación lógica
    if (tieneRelacionesActivas && !tieneAsignacionesActivas) {
      // Implementar eliminación lógica
      const empleadoActualizado = await prisma.empleado.update({
        where: { id },
        data: {
          fechaDesincorporacion: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
        }
      });

      // Registrar en historial de estado del empleado
      await prisma.empleadoStatusHistory.create({
        data: {
          empleadoId: id,
          accion: 'Empleado Desincorporado',
          fecha: new Date().toISOString().split('T')[0],
          motivo: `Empleado desincorporado del sistema. Se desactivaron ${empleado.asignacionesComoTarget.length} asignaciones y ${empleado.organizaciones.length} relaciones organizacionales.`
        }
      });

      // Desactivar relaciones organizacionales
      if (tieneRelacionesActivas) {
        await prisma.empleadoEmpresaDepartamentoCargo.updateMany({
          where: {
            empleadoId: id,
            activo: true
          },
          data: {
            activo: false
          }
        });
      }

      // Desactivar asignaciones activas
      if (tieneAsignacionesActivas) {
        await prisma.asignacionesEquipos.updateMany({
          where: {
            targetEmpleadoId: id,
            activo: true
          },
          data: {
            activo: false
          }
        });

        // Crear registros de devolución para las asignaciones
        for (const asignacion of empleado.asignacionesComoTarget) {
          await prisma.asignacionesEquipos.create({
            data: {
              actionType: 'Return',
              targetType: 'Usuario',
              targetEmpleadoId: id,
              itemType: asignacion.itemType,
              computadorId: asignacion.computadorId,
              dispositivoId: asignacion.dispositivoId,
              motivo: 'Desincorporación del empleado',
              notes: 'Devolución automática por desincorporación del empleado',
              activo: true,
              date: new Date()
            }
          });
        }
      }

      return NextResponse.json({ 
        message: 'Empleado desincorporado exitosamente',
        tipo: 'desincorporacion_logica',
        detalles: {
          asignacionesDesactivadas: empleado.asignacionesComoTarget.length,
          relacionesDesactivadas: empleado.organizaciones.length
        }
      }, { status: 200 });
    } else {
      // Si no tiene dependencias activas, eliminar físicamente
      console.log('Eliminando empleado físicamente:', empleado.nombre, empleado.apellido);
      
      // Primero eliminar el historial de estado
      await prisma.empleadoStatusHistory.deleteMany({
        where: { empleadoId: id }
      });

      // Eliminar todas las relaciones organizacionales (activas e inactivas)
      await prisma.empleadoEmpresaDepartamentoCargo.deleteMany({
        where: { empleadoId: id }
      });

      // Eliminar todas las asignaciones (activas e inactivas)
      await prisma.asignacionesEquipos.deleteMany({
        where: { 
          OR: [
            { targetEmpleadoId: id },
            { gerenteEmpleado: { id: id } }
          ]
        }
      });

      // Eliminar todas las gerencias
      await prisma.departamentoGerente.deleteMany({
        where: { gerenteId: id }
      });

      // Finalmente eliminar el empleado
      await prisma.empleado.delete({
        where: { id }
      });
      
      return NextResponse.json({ 
        message: 'Empleado eliminado permanentemente',
        tipo: 'eliminacion_fisica'
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error al eliminar empleado:', error);
    return NextResponse.json({ 
      message: 'Error al eliminar empleado',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
