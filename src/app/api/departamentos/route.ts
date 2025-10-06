import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser(request);
    
    const departamentos = await prisma.departamento.findMany({
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
            empleadoOrganizaciones: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    // No registrar acceso a listas - ya se registra la navegación en useAuditLogger

    return NextResponse.json(departamentos, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener departamentos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await getServerUser(request);
    console.log("Cuerpo parseado:", body);
    console.log("Usuario autenticado:", user ? user.username : "No autenticado");

    const { nombre, empresaId, empresaNombre, gerenteId } = body;

    // Validación básica
    if (!nombre) {
      return NextResponse.json(
        { message: "El campo nombre es requerido." },
        { status: 400 }
      );
    }
    
    // Si no se provee ni un ID de empresa ni un nombre para crear una nueva
    if (!empresaId && !empresaNombre) {
        return NextResponse.json(
          { message: "Debe proporcionar una empresa existente (empresaId) o crear una nueva (empresaNombre)." },
          { status: 400 }
        );
    }

    // Crear el departamento
    const newDepartamento = await prisma.departamento.create({
      data: {
        nombre,
      }
    });

    // Lógica para manejar la Empresa
    let empresaIdFinal: string;
    if (empresaNombre) {
      // Caso 1: Se está creando una nueva empresa.
      const newEmpresa = await prisma.empresa.create({
        data: {
          nombre: empresaNombre,
          descripcion: null,
        },
      });
      empresaIdFinal = newEmpresa.id;
    } else {
      // Caso 2: Se está conectando a una empresa existente.
      empresaIdFinal = empresaId!;
    }

    // Crear la relación empresa-departamento
    await prisma.empresaDepartamento.create({
      data: {
        empresaId: empresaIdFinal,
        departamentoId: newDepartamento.id,
        activo: true,
        fechaAsignacion: new Date()
      }
    });

    // Crear la relación gerente-departamento si se proporciona un gerente
    if (gerenteId) {
      await prisma.departamentoGerente.create({
        data: {
          departamentoId: newDepartamento.id,
          gerenteId: gerenteId,
          activo: true,
          fechaAsignacion: new Date()
        }
      });
    }

    // Obtener el departamento completo con todas las relaciones
    const departamentoCompleto = await prisma.departamento.findUnique({
      where: { id: newDepartamento.id },
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
            empleadoOrganizaciones: true
          }
        }
      }
    });

    // Auditoría - Registrar creación
    if (user && departamentoCompleto) {
      await AuditLogger.logCreate(
        'departamento',
        departamentoCompleto.id,
        `Departamento "${nombre}" creado en la empresa "${departamentoCompleto.empresaDepartamentos[0]?.empresa?.nombre || 'Sin empresa'}"`,
        user.id as string,
        {
          departamentoCreado: {
            nombre: departamentoCompleto.nombre,
            empresa: departamentoCompleto.empresaDepartamentos[0]?.empresa?.nombre,
            gerente: departamentoCompleto.gerencias[0]?.gerente ? `${departamentoCompleto.gerencias[0].gerente.nombre} ${departamentoCompleto.gerencias[0].gerente.apellido}` : null,
            empleados: departamentoCompleto._count.empleadoOrganizaciones
          }
        }
      );
    }

    return NextResponse.json(departamentoCompleto, { status: 201 });

  } catch (error) {
    console.error("Error al crear departamento:", error);
    if (error instanceof Error) {
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
    }
    return NextResponse.json(
      { message: "Error interno del servidor al crear el departamento" },
      { status: 500 }
    );
  }
}
