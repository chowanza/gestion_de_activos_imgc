import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/auditLogger';
import { getServerUser } from '@/lib/auth-server';
import { promises as fs } from 'fs';
import path from 'path';

// GET /api/empresas/[id] - Obtener una empresa específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const empresa = await prisma.empresa.findUnique({
      where: { id },
      include: {
        departamentos: {
          include: {
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
                }
              },
              orderBy: {
                nombre: 'asc'
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
        },
        _count: {
          select: {
            departamentos: true
          }
        }
      }
    });

    if (!empresa) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(empresa);
  } catch (error) {
    console.error('Error fetching empresa:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/empresas/[id] - Actualizar una empresa
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Detectar si es FormData o JSON
    const contentType = request.headers.get('content-type') || '';
    let nombre: string;
    let descripcion: string;
    let logo: string | undefined;
    
    if (contentType.includes('application/json')) {
      // Manejar JSON (para el formulario de edición)
      const body = await request.json();
      nombre = body.nombre;
      descripcion = body.descripcion;
      logo = body.logo;
    } else {
      // Manejar FormData (para el formulario original)
      const formData = await request.formData();
      nombre = formData.get('nombre') as string;
      descripcion = formData.get('descripcion') as string;
      const logoFile = formData.get('logo') as File;
      
      // Si hay un archivo de logo, manejarlo
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

        logo = `/uploads/empresas/${fileName}`;
      }
    }

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    // Verificar que la empresa existe
    const existingEmpresa = await prisma.empresa.findUnique({
      where: { id }
    });

    if (!existingEmpresa) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    let logoPath = existingEmpresa.logo;
    
    // Si se proporciona un nuevo logo (URL o archivo)
    if (logo) {
      logoPath = logo;
      
      // Si es un archivo subido (FormData), ya se manejó arriba
      // Si es una URL (JSON), usar directamente
      
      // Eliminar archivo anterior si existe y el nuevo no es una URL externa
      if (existingEmpresa.logo && !logo.startsWith('http')) {
        const oldFilePath = path.join(process.cwd(), 'public', existingEmpresa.logo);
        try {
          await fs.unlink(oldFilePath);
        } catch (error) {
          console.log('No se pudo eliminar el archivo anterior:', error);
        }
      }
    }

    const empresa = await prisma.empresa.update({
      where: { id },
      data: {
        nombre,
        descripcion: descripcion || null,
        logo: logoPath,
      },
    });

    // Obtener usuario de la sesión para auditoría
    const user = await getServerUser(request);
    
    // Registrar en auditoría
    await AuditLogger.logUpdate(
      'empresa',
      empresa.id,
      `Empresa "${empresa.nombre}" actualizada`,
      user?.id as string as string
    );

    return NextResponse.json(empresa);
  } catch (error: any) {
    console.error('Error updating empresa:', error);
    
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

// DELETE /api/empresas/[id] - Eliminar una empresa
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verificar que la empresa existe
    const existingEmpresa = await prisma.empresa.findUnique({
      where: { id },
      include: {
        departamentos: {
          include: {
            empleados: true,
            computadores: true,
            dispositivos: true,
          }
        }
      }
    });

    if (!existingEmpresa) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si la empresa tiene departamentos asociados
    if (existingEmpresa.departamentos.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar la empresa porque tiene departamentos asociados' },
        { status: 400 }
      );
    }

    // Obtener usuario de la sesión para auditoría
    const user = await getServerUser(request);
    
    // Registrar en auditoría antes de eliminar
    await AuditLogger.logDelete(
      'empresa',
      existingEmpresa.id,
      `Empresa "${existingEmpresa.nombre}" eliminada`,
      user?.id as string
    );

    // Eliminar la empresa
    await prisma.empresa.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Empresa eliminada correctamente' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting empresa:', error);
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'No se puede eliminar la empresa porque tiene datos relacionados' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}