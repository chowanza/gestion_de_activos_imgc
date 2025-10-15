import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ESTADOS_EQUIPO } from '@/lib/estados-equipo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo'); // 'computador' o 'dispositivo'

    if (!tipo || !['computador', 'dispositivo'].includes(tipo)) {
      return NextResponse.json({ message: 'Tipo de equipo requerido (computador o dispositivo)' }, { status: 400 });
    }

    let equipos;

    if (tipo === 'computador') {
      // Buscar computadores que no tengan asignaciones activas
      const computadoresConAsignaciones = await prisma.asignacionesEquipos.findMany({
        where: {
          activo: true,
          computadorId: { not: null }
        },
        select: {
          computadorId: true
        }
      });

  const computadoresAsignados = computadoresConAsignaciones.map(a => a.computadorId).filter((id): id is string => !!id);

      equipos = await prisma.computador.findMany({
        where: {
          estado: ESTADOS_EQUIPO.OPERATIVO,
          id: {
            notIn: computadoresAsignados
          }
        },
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
        orderBy: {
          serial: 'asc'
        }
      });

      // Mapear a formato esperado por el frontend
      equipos = equipos.map(computador => {
        const modelo = computador.computadorModelos[0]?.modeloEquipo;
        const marca = modelo?.marcaModelos[0]?.marca;
        
        return {
          id: computador.id,
          serial: computador.serial,
          estado: computador.estado,
          codigoImgc: computador.codigoImgc,
          modelo: {
            nombre: modelo?.nombre || 'Sin modelo',
            marca: {
              nombre: marca?.nombre || 'Sin marca'
            }
          }
        };
      });
    } else {
      // Buscar dispositivos que no tengan asignaciones activas
      const dispositivosConAsignaciones = await prisma.asignacionesEquipos.findMany({
        where: {
          activo: true,
          dispositivoId: { not: null }
        },
        select: {
          dispositivoId: true
        }
      });

  const dispositivosAsignados = dispositivosConAsignaciones.map(a => a.dispositivoId).filter((id): id is string => !!id);

      equipos = await prisma.dispositivo.findMany({
        where: {
          estado: ESTADOS_EQUIPO.OPERATIVO,
          id: {
            notIn: dispositivosAsignados
          }
        },
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
        orderBy: {
          serial: 'asc'
        }
      });

      // Mapear a formato esperado por el frontend
      equipos = equipos.map(dispositivo => {
        const modelo = dispositivo.dispositivoModelos[0]?.modeloEquipo;
        const marca = modelo?.marcaModelos[0]?.marca;
        
        return {
          id: dispositivo.id,
          serial: dispositivo.serial,
          estado: dispositivo.estado,
          codigoImgc: dispositivo.codigoImgc,
          modelo: {
            nombre: modelo?.nombre || 'Sin modelo',
            marca: {
              nombre: marca?.nombre || 'Sin marca'
            }
          }
        };
      });
    }

    return NextResponse.json(equipos, { status: 200 });
  } catch (error) {
    console.error('Error al obtener equipos disponibles:', error);
    return NextResponse.json({ message: 'Error al obtener equipos disponibles' }, { status: 500 });
  }
}
