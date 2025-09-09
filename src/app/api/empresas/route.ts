import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { getServerUser } from '@/lib/auth-server';
import { promises as fs } from 'fs';
import path from 'path';

// GET /api/empresas - Obtener todas las empresas
export async function GET(request: NextRequest) {
  try {
    const empresas = await prisma.empresa.findMany({
      include: {
        departamentos: {
          include: {
            empleados: true,
            computadores: true,
            dispositivos: true,
          }
        },
        _count: {
          select: {
            departamentos: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    // Obtener usuario de la sesión para auditoría
    const user = await getServerUser(request);
    
    // Registrar acceso a la lista de empresas
    if (user) {
      await AuditLogger.logView(
        'empresas',
        'lista',
        `Usuario ${user.username} accedió a la lista de empresas`,
        user.id as string
      );
    }

    return NextResponse.json(empresas);
  } catch (error) {
    console.error('Error fetching empresas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/empresas - Crear nueva empresa
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const nombre = formData.get('nombre') as string;
    const descripcion = formData.get('descripcion') as string;
    const logoFile = formData.get('logo') as File;

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    let logoPath = null;
    if (logoFile && logoFile.size > 0) {
      // Crear directorio si no existe
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'empresas');
      await fs.mkdir(uploadDir, { recursive: true });

      // Generar nombre único para el archivo
      const fileExtension = path.extname(logoFile.name);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      // Guardar archivo
      const bytes = await logoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await fs.writeFile(filePath, buffer);

      logoPath = `/uploads/empresas/${fileName}`;
    }

    const empresa = await prisma.empresa.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        logo: logoPath,
      },
    });

    // Obtener usuario de la sesión para auditoría
    const user = await getServerUser(request);
    
    // Registrar en auditoría
    await AuditLogger.logCreate(
      'empresa',
      empresa.id,
      `Empresa "${empresa.nombre}" creada`,
      user?.id as string
    );

    return NextResponse.json(empresa, { status: 201 });
  } catch (error: any) {
    console.error('Error creating empresa:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una empresa con ese nombre' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
