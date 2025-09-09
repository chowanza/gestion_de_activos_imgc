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
        empresa: true,
        gerente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            ced: true,
            cargo: {
              select: {
                nombre: true
              }
            }
          }
        },
        empleados: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            ced: true,
            fechaIngreso: true,
            cargo: {
              select: {
                nombre: true
              }
            },
            computadores: {
              select: {
                id: true
              }
            },
            dispositivos: {
              select: {
                id: true
              }
            }
          },
          orderBy: {
            nombre: 'asc'
          }
        },
        cargos: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            _count: {
              select: {
                empleados: true
              }
            }
          },
          orderBy: {
            nombre: 'asc'
          }
        },
        computadores: {
          select: {
            id: true,
            serial: true,
            estado: true,
            modelo: {
              select: {
                nombre: true,
                marca: {
                  select: {
                    nombre: true
                  }
                }
              }
            }
          }
        },
        dispositivos: {
          select: {
            id: true,
            serial: true,
            estado: true,
            modelo: {
              select: {
                nombre: true,
                marca: {
                  select: {
                    nombre: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            empleados: true,
            computadores: true,
            dispositivos: true,
            cargos: true
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
        empresa: true,
        gerente: {
          select: {
            id: true,
            nombre: true,
            apellido: true
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
      empresaId: empresaId || departamentoActual.empresaId,
      gerenteId: gerenteId || null,
    };

    // Actualizar el departamento
    const departamentoActualizado = await prisma.departamento.update({
      where: { id },
      data: updateData,
      include: {
        empresa: true,
        gerente: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        _count: {
          select: {
            empleados: true
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
      
      if (departamentoActual.empresaId !== empresaId) {
        const empresaAnterior = departamentoActual.empresa?.nombre || 'Sin empresa';
        const empresaNueva = departamentoActualizado.empresa?.nombre || 'Sin empresa';
        cambios.push(`Empresa: "${empresaAnterior}" → "${empresaNueva}"`);
      }
      
      if (departamentoActual.gerenteId !== gerenteId) {
        const gerenteAnterior = departamentoActual.gerente 
          ? `${departamentoActual.gerente.nombre} ${departamentoActual.gerente.apellido}`
          : 'Sin gerente';
        const gerenteNuevo = departamentoActualizado.gerente 
          ? `${departamentoActualizado.gerente.nombre} ${departamentoActualizado.gerente.apellido}`
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
              empresa: departamentoActual.empresa?.nombre,
              gerente: departamentoActual.gerente ? `${departamentoActual.gerente.nombre} ${departamentoActual.gerente.apellido}` : null
            },
            departamentoActualizado: {
              nombre: departamentoActualizado.nombre,
              empresa: departamentoActualizado.empresa?.nombre,
              gerente: departamentoActualizado.gerente ? `${departamentoActualizado.gerente.nombre} ${departamentoActualizado.gerente.apellido}` : null
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
        empresa: true,
        gerente: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        _count: {
          select: {
            empleados: true,
            computadores: true,
            dispositivos: true,
            cargos: true
          }
        }
      }
    });

    if (!departamento) {
      return NextResponse.json({ message: 'Departamento no encontrado' }, { status: 404 });
    }

    // Verificar si tiene empleados o equipos asignados
    if (departamento._count.empleados > 0) {
      return NextResponse.json(
        { message: 'No se puede eliminar un departamento que tiene empleados asignados' },
        { status: 400 }
      );
    }

    if (departamento._count.computadores > 0 || departamento._count.dispositivos > 0) {
      return NextResponse.json(
        { message: 'No se puede eliminar un departamento que tiene equipos asignados' },
        { status: 400 }
      );
    }

    // Eliminar el departamento
    await prisma.departamento.delete({
      where: { id }
    });

    // Auditoría - Registrar eliminación
    if (user) {
      await AuditLogger.logDelete(
        'departamento',
        id,
        `Departamento "${departamento.nombre}" eliminado de la empresa "${departamento.empresa?.nombre}"`,
        user.id as string,
        {
          departamentoEliminado: {
            nombre: departamento.nombre,
            empresa: departamento.empresa?.nombre,
            gerente: departamento.gerente ? `${departamento.gerente.nombre} ${departamento.gerente.apellido}` : null,
            empleados: departamento._count.empleados,
            computadores: departamento._count.computadores,
            dispositivos: departamento._count.dispositivos,
            cargos: departamento._count.cargos
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