import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/auditLogger';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const empresas = await prisma.empresa.findMany({
      include: {
        departamentos: {
          include: {
            _count: {
              select: {
                empleados: true,
                computadores: true,
                dispositivos: true
              }
            }
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

    return NextResponse.json(empresas);
  } catch (error) {
    console.error('Error obteniendo empresas:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const nombre = formData.get('nombre') as string;
    const descripcion = formData.get('descripcion') as string;
    const logoFile = formData.get('logo') as File;

    // Validar que el nombre no esté vacío
    if (!nombre || nombre.trim() === '') {
      return NextResponse.json(
        { message: 'El nombre de la empresa es requerido' },
        { status: 400 }
      );
    }

    // Verificar que no exista una empresa con el mismo nombre
    const empresaExistente = await prisma.empresa.findUnique({
      where: { nombre: nombre.trim() }
    });

    if (empresaExistente) {
      return NextResponse.json(
        { message: 'Ya existe una empresa con ese nombre' },
        { status: 409 }
      );
    }

    // Manejar el archivo de logo si existe
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

    // Crear la empresa
    const nuevaEmpresa = await prisma.empresa.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        logo: logoPath
      }
    });

    // Registrar en auditoría
    await AuditLogger.logCreate(
      'empresa',
      nuevaEmpresa.id,
      `Empresa "${nuevaEmpresa.nombre}" creada`,
      undefined // TODO: Obtener userId del token/sesión
    );

    return NextResponse.json(nuevaEmpresa, { status: 201 });
  } catch (error) {
    console.error('Error creando empresa:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}