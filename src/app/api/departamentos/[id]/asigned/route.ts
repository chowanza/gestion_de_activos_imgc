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
        gerencia: true, // Para mostrar el nombre de la gerencia
        
        // Activos asignados DIRECTAMENTE al departamento
       computadores: { 
          include: { 
            modelo: { include: { marca: true } },
            usuario: true, // <-- AÑADIDO: Trae el usuario si está asignado directamente
          } 
        },
        dispositivos: { 
          include: { 
            modelo: { include: { marca: true } },
            usuario: true, // <-- AÑADIDO: Trae el usuario si está asignado directamente
          } 
        },

        // Usuarios del departamento Y los activos de CADA usuario
        usuarios: {
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
    // Necesitamos los IDs de los usuarios de este departamento para la consulta
    const idsDeUsuariosDelDepto = departamento.usuarios.map(u => u.id);

    const lineasAsignadas = await prisma.asignaciones.findMany({
      where: {
        itemType: 'LineaTelefonica',
        actionType: 'Asignacion',
        // Condición: La línea está asignada AL DEPARTAMENTO O A UNO DE SUS USUARIOS
        OR: [
          { targetDepartamentoId: id },
          { targetUsuarioId: { in: idsDeUsuariosDelDepto } },
        ],
      },
      include: {
        lineaTelefonica: true,
      },
    });
    
    // Extraemos solo los objetos de LineaTelefonica
    const lineasTelefonicas = lineasAsignadas
        .map(a => a.lineaTelefonica)
        .filter((l): l is NonNullable<typeof l> => l !== null);


    // --- PASO 3: COMBINAR Y CONTAR TODOS LOS ACTIVOS ---
    
    // Combinar computadores (los del depto + los de cada usuario)
        const todosLosComputadores = [
      ...departamento.computadores,
      ...departamento.usuarios.flatMap(usuario => 
        // Para cada computador de este usuario, le añadimos el objeto 'usuario' para consistencia
        usuario.computadores.map(comp => ({
            ...comp,
            usuario: usuario
        }))
      )
    ];

    // Combinar dispositivos (los del depto + los de cada usuario)
    const todosLosDispositivos = [
        ...departamento.dispositivos,
        ...departamento.usuarios.flatMap(usuario => 
            usuario.dispositivos.map(disp => ({
                ...disp,
                usuario: usuario
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
      gerencia: departamento.gerencia.nombre,
      ceco: departamento.ceco,
      sociedad: departamento.sociedad,
      
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
