import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser(request);
    
    const departamentos = await prisma.departamento.findMany({
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
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    // Registrar acceso a la lista de departamentos
    if (user) {
      await AuditLogger.logView(
        'departamentos',
        'lista',
        `Usuario ${user.username} accedió a la lista de departamentos`,
        user.id as string
      );
    }

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

    let dataForDepartamento: any = {
      nombre,
      gerenteId: gerenteId || null,
    };

    // Lógica para manejar la Empresa
    if (empresaNombre) {
      // Caso 1: Se está creando una nueva empresa.
      const newEmpresa = await prisma.empresa.create({
        data: {
          nombre: empresaNombre,
          descripcion: null,
        },
      });
      dataForDepartamento.empresaId = newEmpresa.id;

    } else {
      // Caso 2: Se está conectando a una empresa existente.
      dataForDepartamento.empresaId = empresaId;
    }

    // Crear el departamento
    const newDepartamento = await prisma.departamento.create({
      data: dataForDepartamento,
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

    // Auditoría - Registrar creación
    if (user) {
      await AuditLogger.logCreate(
        'departamento',
        newDepartamento.id,
        `Departamento "${nombre}" creado en la empresa "${newDepartamento.empresa.nombre}"`,
        user.id as string,
        {
          departamentoCreado: {
            nombre: newDepartamento.nombre,
            empresa: newDepartamento.empresa.nombre,
            gerente: newDepartamento.gerente ? `${newDepartamento.gerente.nombre} ${newDepartamento.gerente.apellido}` : null,
            empleados: newDepartamento._count.empleados
          }
        }
      );
    }

    return NextResponse.json(newDepartamento, { status: 201 });

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
