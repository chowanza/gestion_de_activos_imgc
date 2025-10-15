import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ESTADOS_EQUIPO } from '@/lib/estados-equipo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo'); // 'todos', 'computador', 'dispositivo'

    let equipos: any[] = [];

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

    // Obtener computadores disponibles
    if (!tipo || tipo === 'todos' || tipo === 'computador') {
      const computadores = await prisma.computador.findMany({
        where: {
          estado: {
            in: [ESTADOS_EQUIPO.OPERATIVO, ESTADOS_EQUIPO.EN_MANTENIMIENTO]
          },
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

      // Mapear computadores a formato unificado
      const computadoresMapeados = computadores.map(computador => {
        const modelo = computador.computadorModelos[0]?.modeloEquipo;
        const marca = modelo?.marcaModelos[0]?.marca;
        
        return {
          id: computador.id,
          serial: computador.serial,
          estado: computador.estado,
          codigoImgc: computador.codigoImgc,
          tipo: 'computador',
          modelo: {
            nombre: modelo?.nombre || 'Sin modelo',
            marca: {
              nombre: marca?.nombre || 'Sin marca'
            }
          }
        };
      });

      equipos = [...equipos, ...computadoresMapeados];
    }

    // Obtener dispositivos disponibles
    if (!tipo || tipo === 'todos' || tipo === 'dispositivo') {
      const dispositivos = await prisma.dispositivo.findMany({
        where: {
          estado: {
            in: [ESTADOS_EQUIPO.OPERATIVO, ESTADOS_EQUIPO.EN_MANTENIMIENTO]
          },
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

      // Mapear dispositivos a formato unificado
      const dispositivosMapeados = dispositivos.map(dispositivo => {
        const modelo = dispositivo.dispositivoModelos[0]?.modeloEquipo;
        const marca = modelo?.marcaModelos[0]?.marca;
        
        return {
          id: dispositivo.id,
          serial: dispositivo.serial,
          estado: dispositivo.estado,
          codigoImgc: dispositivo.codigoImgc,
          tipo: 'dispositivo',
          modelo: {
            nombre: modelo?.nombre || 'Sin modelo',
            marca: {
              nombre: marca?.nombre || 'Sin marca'
            }
          }
        };
      });

      equipos = [...equipos, ...dispositivosMapeados];
    }

    // Ordenar por tipo y luego por serial
    equipos.sort((a, b) => {
      if (a.tipo !== b.tipo) {
        return a.tipo.localeCompare(b.tipo);
      }
      return a.serial.localeCompare(b.serial);
    });

    return NextResponse.json(equipos, { status: 200 });
  } catch (error) {
    console.error('Error al obtener equipos disponibles:', error);
    return NextResponse.json({ message: 'Error al obtener equipos disponibles' }, { status: 500 });
  }
}

