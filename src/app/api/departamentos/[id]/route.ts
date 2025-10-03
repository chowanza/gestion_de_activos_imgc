import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getServerUser(request);

    const departamento = await prisma.departamento.findUnique({
      where: { id },
      include: {
        empresaDepartamentos: {
          include: {
            empresa: true
          }
        },
        gerencias: {
          where: {
            activo: true
          },
          include: {
            gerente: {
              select: {
                id: true,
                nombre: true,
                apellido: true
              }
            }
          }
        },
        empleadoOrganizaciones: {
          include: {
            empleado: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                ced: true,
                fechaIngreso: true,
                fotoPerfil: true,
                asignacionesComoTarget: {
                  where: {
                    activo: true
                  },
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
            },
            cargo: {
              select: {
                id: true,
                nombre: true
              }
            }
          },
          orderBy: {
            empleado: {
              nombre: 'asc'
            }
          }
        },
        departamentoCargos: {
          include: {
            cargo: {
              select: {
                id: true,
                nombre: true,
                descripcion: true
              }
            }
          }
        },
        _count: {
          select: {
            empleadoOrganizaciones: true,
            departamentoCargos: true
          }
        }
      }
    });

    if (!departamento) {
      return NextResponse.json({ message: 'Departamento no encontrado' }, { status: 404 });
    }

    // Registrar acceso a detalles del departamento
    if (user) {
      await AuditLogger.logView(
        'departamento',
        id,
        `Usuario ${user.username} accedió a los detalles del departamento "${departamento.nombre}"`,
        user.id as string
      );
    }

    return NextResponse.json(departamento, { status: 200 });
  } catch (error) {
    console.error('Error al obtener departamento:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const user = await getServerUser(request);

    const { nombre, empresaId, gerenteId } = body;

    // Validación básica
    if (!nombre) {
      return NextResponse.json(
        { message: "El campo nombre es requerido." },
        { status: 400 }
      );
    }

    // Obtener el departamento actual para auditoría
    const departamentoActual = await prisma.departamento.findUnique({
      where: { id },
      include: {
        empresaDepartamentos: {
          include: {
            empresa: true
          }
        },
        gerencias: {
          where: {
            activo: true
          },
          include: {
            gerente: {
              select: {
                id: true,
                nombre: true,
                apellido: true
              }
            }
          }
        }
      }
    });

    if (!departamentoActual) {
      return NextResponse.json({ message: 'Departamento no encontrado' }, { status: 404 });
    }

    // Preparar datos para actualización
    const updateData: any = {
      nombre,
    };

    // Manejar asignación de gerente
    if (gerenteId) {
      // Desactivar gerente actual si existe
      await prisma.departamentoGerente.updateMany({
        where: {
          departamentoId: id,
          activo: true
        },
        data: {
          activo: false,
          fechaDesasignacion: new Date()
        }
      });

      // Crear o actualizar asignación de gerente
      await prisma.departamentoGerente.upsert({
        where: {
          departamentoId_gerenteId: {
            departamentoId: id,
            gerenteId: gerenteId
          }
        },
        update: {
          activo: true,
          fechaAsignacion: new Date(),
          fechaDesasignacion: null
        },
        create: {
          departamentoId: id,
          gerenteId: gerenteId,
          activo: true,
          fechaAsignacion: new Date()
        }
      });
    }

    // Actualizar el departamento
    const departamentoActualizado = await prisma.departamento.update({
      where: { id },
      data: updateData,
      include: {
        empresaDepartamentos: {
          include: {
            empresa: true
          }
        },
        gerencias: {
          where: {
            activo: true
          },
          include: {
            gerente: {
              select: {
                id: true,
                nombre: true,
                apellido: true
              }
            }
          }
        },
        departamentoCargos: {
          include: {
            cargo: {
              select: {
                id: true,
                nombre: true,
                descripcion: true
              }
            }
          }
        },
        _count: {
          select: {
            empleadoOrganizaciones: true,
            departamentoCargos: true
          }
        }
      }
    });

    // Auditoría - Registrar cambios
    if (user) {
      const cambios = [];
      
      if (departamentoActual.nombre !== nombre) {
        cambios.push(`Nombre: "${departamentoActual.nombre}" → "${nombre}"`);
      }
      
      // Verificar cambios en empresa (comparar por ID de la primera empresa)
      const empresaAnteriorId = departamentoActual.empresaDepartamentos[0]?.empresaId;
      const empresaNuevaId = departamentoActualizado.empresaDepartamentos[0]?.empresaId;
      
      if (empresaAnteriorId !== empresaId) {
        const empresaAnterior = departamentoActual.empresaDepartamentos[0]?.empresa?.nombre || 'Sin empresa';
        const empresaNueva = departamentoActualizado.empresaDepartamentos[0]?.empresa?.nombre || 'Sin empresa';
        cambios.push(`Empresa: "${empresaAnterior}" → "${empresaNueva}"`);
      }
      
      // Verificar cambios en gerente (comparar por ID del primer gerente activo)
      const gerenteAnteriorId = departamentoActual.gerencias[0]?.gerenteId;
      const gerenteNuevoId = departamentoActualizado.gerencias[0]?.gerenteId;
      
      if (gerenteAnteriorId !== gerenteId) {
        const gerenteAnterior = departamentoActual.gerencias[0]?.gerente 
          ? `${departamentoActual.gerencias[0].gerente.nombre} ${departamentoActual.gerencias[0].gerente.apellido}`
          : 'Sin gerente';
        const gerenteNuevo = departamentoActualizado.gerencias[0]?.gerente 
          ? `${departamentoActualizado.gerencias[0].gerente.nombre} ${departamentoActualizado.gerencias[0].gerente.apellido}`
          : 'Sin gerente';
        cambios.push(`Gerente: "${gerenteAnterior}" → "${gerenteNuevo}"`);
      }

      if (cambios.length > 0) {
        await AuditLogger.logUpdate(
          'departamento',
          id,
          `Departamento "${nombre}" actualizado: ${cambios.join(', ')}`,
          user.id as string,
          {
            cambios,
            departamentoAnterior: {
              nombre: departamentoActual.nombre,
              empresa: departamentoActual.empresaDepartamentos[0]?.empresa?.nombre,
              gerente: departamentoActual.gerencias[0]?.gerente ? `${departamentoActual.gerencias[0].gerente.nombre} ${departamentoActual.gerencias[0].gerente.apellido}` : null
            },
            departamentoActualizado: {
              nombre: departamentoActualizado.nombre,
              empresa: departamentoActualizado.empresaDepartamentos[0]?.empresa?.nombre,
              gerente: departamentoActualizado.gerencias[0]?.gerente ? `${departamentoActualizado.gerencias[0].gerente.nombre} ${departamentoActualizado.gerencias[0].gerente.apellido}` : null
            }
          }
        );
      }
    }

    return NextResponse.json(departamentoActualizado, { status: 200 });

  } catch (error) {
    console.error('Error al actualizar departamento:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor al actualizar el departamento' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getServerUser(request);

    // Obtener el departamento antes de eliminarlo para auditoría
    const departamento = await prisma.departamento.findUnique({
      where: { id },
      include: {
        empresaDepartamentos: {
          include: {
            empresa: true
          }
        },
        gerencias: {
          where: {
            activo: true
          },
          include: {
            gerente: {
              select: {
                id: true,
                nombre: true,
                apellido: true
              }
            }
          }
        },
        _count: {
          select: {
            empleadoOrganizaciones: true,
            departamentoCargos: true
          }
        }
      }
    });

    if (!departamento) {
      return NextResponse.json({ message: 'Departamento no encontrado' }, { status: 404 });
    }

    // Verificar si tiene empleados o equipos asignados
    if (departamento._count.empleadoOrganizaciones > 0) {
      return NextResponse.json(
        { message: 'No se puede eliminar un departamento que tiene empleados asignados' },
        { status: 400 }
      );
    }

    // Eliminar las relaciones primero
    await prisma.empresaDepartamento.deleteMany({
      where: { departamentoId: id }
    });

    await prisma.departamentoGerente.deleteMany({
      where: { departamentoId: id }
    });

    await prisma.departamentoCargo.deleteMany({
      where: { departamentoId: id }
    });

    // Eliminar el departamento
    await prisma.departamento.delete({
      where: { id }
    });

    // Auditoría - Registrar eliminación
    if (user) {
      await AuditLogger.logDelete(
        'departamento',
        id,
        `Departamento "${departamento.nombre}" eliminado de la empresa "${departamento.empresaDepartamentos[0]?.empresa?.nombre || 'Sin empresa'}"`,
        user.id as string,
        {
          departamentoEliminado: {
            nombre: departamento.nombre,
            empresa: departamento.empresaDepartamentos[0]?.empresa?.nombre,
            gerente: departamento.gerencias[0]?.gerente ? `${departamento.gerencias[0].gerente.nombre} ${departamento.gerencias[0].gerente.apellido}` : null,
            empleados: departamento._count.empleadoOrganizaciones,
            cargos: departamento._count.departamentoCargos
          }
        }
      );
    }

    return NextResponse.json({ message: 'Departamento eliminado exitosamente' }, { status: 200 });

  } catch (error) {
    console.error('Error al eliminar departamento:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor al eliminar el departamento' },
      { status: 500 }
    );
  }
}