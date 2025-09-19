import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Asegúrate que la ruta a tu cliente Prisma sea correcta

export async function GET(
  request: NextRequest
) {
  await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
  try {
    // --- PASO 1: OBTENER EL DEPARTAMENTO Y TODOS SUS ACTIVOS Y USUARIOS RELACIONADOS ---
    const departamento = await prisma.departamento.findUnique({
      where: { id },
      include: {
        empresa: true, // Para mostrar el nombre de la empresa
        
        // Activos asignados DIRECTAMENTE al departamento
       computadores: { 
          include: { 
            modelo: { include: { marca: true } },
            empleado: true, // <-- AÑADIDO: Trae el empleado si está asignado directamente
          } 
        },
        dispositivos: { 
          include: { 
            modelo: { include: { marca: true } },
            empleado: true, // <-- AÑADIDO: Trae el empleado si está asignado directamente
          } 
        },

        // Empleados del departamento Y los activos de CADA empleado
        empleados: {
          include: {
            computadores: { include: { modelo: { include: { marca: true } } } },
            dispositivos: { include: { modelo: { include: { marca: true } } } },
          },
        },
      },
    });

    if (!departamento) {
      return NextResponse.json({ message: `Departamento con ID ${id} no encontrado` }, { status: 404 });
    }

    // --- PASO 2: OBTENER LAS LÍNEAS TELEFÓNICAS ASIGNADAS ---
    // Nota: Las líneas telefónicas fueron removidas del esquema
    const lineasTelefonicas: any[] = [];


    // --- PASO 3: COMBINAR Y CONTAR TODOS LOS ACTIVOS ---
    
    // Combinar computadores (los del depto + los de cada usuario)
        const todosLosComputadores = [
      ...departamento.computadores,
      ...departamento.empleados.flatMap(empleado => 
        // Para cada computador de este empleado, le añadimos el objeto 'empleado' para consistencia
        empleado.computadores.map(comp => ({
            ...comp,
            empleado: empleado
        }))
      )
    ];

    // Combinar dispositivos (los del depto + los de cada usuario)
    const todosLosDispositivos = [
        ...departamento.dispositivos,
        ...departamento.empleados.flatMap(empleado => 
            empleado.dispositivos.map(disp => ({
                ...disp,
                empleado: empleado
            }))
        )
    ];

    // Usamos un Set para eliminar duplicados si un equipo apareciera en más de una lista
    const computadoresUnicos = [...new Map(todosLosComputadores.map(c => [c.id, c])).values()];
    const dispositivosUnicos = [...new Map(todosLosDispositivos.map(d => [d.id, d])).values()];


    // --- PASO 4: CONSTRUIR LA RESPUESTA FINAL ---
    const responseData = {
      id: departamento.id,
      nombre: departamento.nombre,
      empresa: departamento.empresa.nombre,
      
      // Listas completas de activos
      computadores: computadoresUnicos,
      dispositivos: dispositivosUnicos,
      lineasTelefonicas: lineasTelefonicas,
      
      // Estadísticas completas
      estadisticas: {
        totalComputadores: computadoresUnicos.length,
        totalDispositivos: dispositivosUnicos.length,
        totalLineas: lineasTelefonicas.length,
        totalActivos: computadoresUnicos.length + dispositivosUnicos.length + lineasTelefonicas.length,
      },
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error(`Error al obtener activos para el usuario ${id}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido en el servidor';
    return NextResponse.json({ message: 'Error al obtener los activos asignados', error: errorMessage }, { status: 500 });
  }
}
