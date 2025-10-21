import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/auditLogger';
import { promises as fs } from 'fs';
import path from 'path';
import { sanitizeStringOrNull } from '@/lib/sanitize';

export async function GET() {
  try {
    const empresas = await prisma.empresa.findMany({
      include: {
        empresaDepartamentos: {
          include: {
            departamento: {
              include: {
                _count: {
                  select: {
                    empleadoOrganizaciones: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            empresaDepartamentos: true
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
    // Detectar si es FormData o JSON
    const contentType = request.headers.get('content-type') || '';
    let nombre: string;
    let descripcion: string;
    let logoFile: File | null = null;
    
    if (contentType.includes('application/json')) {
      // Manejar JSON
      const body = await request.json();
      nombre = body.nombre;
      descripcion = body.descripcion;
      // If a logo is supplied as string in JSON, sanitize it
      logoFile = null; // keep null
      var logoFromJson = sanitizeStringOrNull(body.logo);
      if (logoFromJson) {
        // assign to logoPath below via variable capture
      }
    } else {
      // Manejar FormData
      const formData = await request.formData();
      nombre = formData.get('nombre') as string;
      descripcion = formData.get('descripcion') as string;
      logoFile = formData.get('logo') as File;
    }

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

  // Use API streaming URL so the file is immediately accessible without needing server restart
  logoPath = `/api/uploads/empresas/${fileName}`;
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
    // await AuditLogger.logCreate(
    //   'empresa',
    //   nuevaEmpresa.id,
    //   `Empresa "${nuevaEmpresa.nombre}" creada`,
    //   'system' // Usar 'system' como fallback
    // );

    return NextResponse.json(nuevaEmpresa, { status: 201 });
  } catch (error) {
    console.error('Error creando empresa:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}