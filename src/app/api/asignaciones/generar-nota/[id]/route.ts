import prisma from '@/lib/prisma';
import ExcelJS from 'exceljs';
import path from 'path';
import { PassThrough } from 'stream';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  id: string;
}

export async function GET(
  request: NextRequest  // Formato correcto
) {
  await Promise.resolve();
  
 const id = request.nextUrl.pathname.split('/')[4];


  // Validación del ID
  const assignmentId = parseInt(id);
  if (isNaN(assignmentId)) {
    return NextResponse.json(
      { message: 'ID de asignación inválido' },
      { status: 400 }
    );
  }
     try {
    // 1. Obtener los datos de la asignación y sus relaciones
    const asignacion = await prisma.asignacionesEquipos.findUnique({
      where: { id: id },
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
          },
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
          },
        },
        targetEmpleado: {
          include: {
            organizaciones: {
              include: {
                departamento: true,
                empresa: true,
                cargo: true
              }
            }
          },
        },
        ubicacion: true,
      },
      }) // Asegúrate de que el ID sea un entero si tu campo `id` es `Int`

    if (!asignacion) {
      return NextResponse.json({ message: 'Assignment not found' }, { status: 404 });
    }



    // 2. Cargar la plantilla de Excel
    const templatePath = path.resolve(process.cwd(), 'public', 'nota_entrega_template.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const worksheet = workbook.getWorksheet(1); // Asume que la plantilla tiene una hoja principal

    // 3. Rellenar los campos de la plantilla
    // **ADAPTA ESTAS CELDAS A TU FORMATO DE EXCEL ESPECÍFICO**

    if (!worksheet) {
      return NextResponse.json({ message: 'Excel worksheet not found.' }, { status: 500 });
    }


    // Datos del Empleado/Departamento Asignado (Target)
    if (asignacion.targetType === 'Usuario') {
      worksheet.getCell('B4').value = asignacion.date.toLocaleDateString('es-ES');
      worksheet.getCell('B5').value = `${asignacion.targetEmpleado?.nombre} ${asignacion.targetEmpleado?.apellido}`;
      worksheet.getCell('B6').value = asignacion.targetEmpleado?.ced || '';
      worksheet.getCell('B7').value = asignacion.targetEmpleado?.organizaciones?.[0]?.cargo?.nombre || '';
      worksheet.getCell('B8').value = ''; // legajo removido
      worksheet.getCell('B9').value = asignacion.targetEmpleado?.organizaciones?.[0]?.empresa?.nombre || '';
      worksheet.getCell('B10').value = asignacion.targetEmpleado?.organizaciones?.[0]?.departamento?.nombre || '';
      worksheet.getCell('B11').value = asignacion.ubicacion?.nombre || '';
      worksheet.getCell('B12').value = asignacion.gerenteId || '';
      worksheet.getCell('B13').value = ''; // ceco removido
      worksheet.getCell('B15').value = asignacion.motivo;
    } else { // targetType === 'Departamento'
      worksheet.getCell('B5').value = '';
      worksheet.getCell('B6').value = '';
      worksheet.getCell('B7').value = '';
      worksheet.getCell('B8').value = '';
      worksheet.getCell('B4').value = asignacion.date.toLocaleDateString('es-ES');
      worksheet.getCell('B10').value = '';
      worksheet.getCell('B6').value = '';
      worksheet.getCell('B13').value = ''; // ceco removido
      worksheet.getCell('B9').value = ''; // sociedad removida
      worksheet.getCell('B11').value = asignacion.ubicacion?.nombre || '';
      worksheet.getCell('B12').value = asignacion.gerenteId || '';
    }


    if (asignacion.itemType === 'Computador') {
        const computadorModelo = asignacion.computador?.computadorModelos?.[0]?.modeloEquipo;
        const computadorMarca = computadorModelo?.marcaModelos?.[0]?.marca;
        worksheet.getCell('E4').value = `${computadorMarca?.nombre || ''} ${computadorModelo?.nombre || ''}`; // Marca
        worksheet.getCell('E5').value = asignacion.computador?.serial; // Tipo de equipo (Computador o Dispositivo)
        worksheet.getCell('B16').value = '';
        worksheet.getCell('B14').value = computadorModelo?.tipo || ''; // NSAP (si aplica)
        worksheet.getCell('E6').value = asignacion.computador?.procesador || 'N/A';
        worksheet.getCell('E7').value = asignacion.computador?.ram || 'N/A';
        worksheet.getCell('E8').value = asignacion.computador?.almacenamiento || 'N/A';
        worksheet.getCell('E9').value = 'N/A';
        worksheet.getCell('E10').value = 'N/A';
        worksheet.getCell('E13').value = asignacion.computador?.sisOperativo || 'N/A';
        worksheet.getCell('E15').value = 'N/A';
        worksheet.getCell('E14').value = asignacion.computador?.officeVersion || 'N/A';
        worksheet.getCell('B24').value = asignacion.notes || 'Sin notas.';
    } else if (asignacion.itemType === 'Dispositivo') {
      worksheet.getCell('B16').value = '';
      const dispositivoModelo = asignacion.dispositivo?.dispositivoModelos?.[0]?.modeloEquipo;
      const dispositivoMarca = dispositivoModelo?.marcaModelos?.[0]?.marca;
      worksheet.getCell('B14').value = dispositivoModelo?.tipo || '';
      worksheet.getCell('E4').value = `${dispositivoMarca?.nombre || ''} ${dispositivoModelo?.nombre || ''}`; // Marca
      worksheet.getCell('E5').value = asignacion.dispositivo?.serial;
      worksheet.getCell('E6').value = '';
      worksheet.getCell('E7').value = '';
      worksheet.getCell('E8').value = '';
      worksheet.getCell('B24').value = asignacion.notes || 'Sin notas.';
    } else if (asignacion.itemType === 'LineaTelefonica') {
      worksheet.getCell('B24').value = 'N/A';
      worksheet.getCell('B14').value = 'Linea Telefonica';
    }




    // 4. Escribir el archivo Excel a un buffer
    const stream = new PassThrough();
    await workbook.xlsx.write(stream);
  
    // Convert the stream to a buffer
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });

    // 5. Enviar el archivo como respuesta
    return new NextResponse(new ReadableStream({
      start(controller) {
        controller.enqueue(buffer);
        controller.close();
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Nota_Entrega_${asignacion.id}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Error generating delivery note:', error);
    return NextResponse.json({message:'Error generating delivery note.'}, {status: 500});
  } finally {
    await prisma.$disconnect();
  }

}
