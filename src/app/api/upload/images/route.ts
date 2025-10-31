export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import { requirePermission } from '@/lib/role-middleware';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    // Require create permission for uploads
    const deny = await requirePermission('canCreate')(request as any);
    if (deny) return deny;

    const user = await getServerUser(request);
    if (!user) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { message: 'No se proporcionaron imágenes' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'interventions');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

  const uploadedUrls: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        continue; // Skip non-image files
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `${timestamp}_${randomString}.${extension}`;
      
      // Save file to disk
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filepath = join(uploadsDir, filename);
      
      await writeFile(filepath, buffer);
      
  // Generate URL (serve via streaming endpoint)
  const url = `/api/uploads/interventions/${filename}`;
      uploadedUrls.push(url);
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { message: 'No se pudieron procesar las imágenes' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: `${uploadedUrls.length} imagen(es) subida(s) exitosamente`,
      images: uploadedUrls
    });

  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

