import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Obtener el modelo con sus relaciones básicas
    const modelo = await prisma.modeloEquipo.findUnique({
      where: { id },
      include: {
        marcaModelos: {
          include: {
            marca: true
          }
        },
        computadorModelos: {
          include: {
            computador: true
          }
        },
        dispositivoModelos: {
          include: {
            dispositivo: true
          }
        }
      }
    });

    if (!modelo) {
      return NextResponse.json({ message: "Modelo not found" }, { status: 404 });
    }

    // Calcular estadísticas usando la estructura normalizada
    const computadores = modelo.computadorModelos.map(cm => cm.computador);
    const dispositivos = modelo.dispositivoModelos.map(dm => dm.dispositivo);
    
    const totalComputadores = computadores.length;
    const totalDispositivos = dispositivos.length;
    const totalEquipos = totalComputadores + totalDispositivos;

    // Calcular estados usando el nuevo sistema
    const estadosComputadores = {
      ASIGNADO: computadores.filter(c => c.estado === 'ASIGNADO').length,
      OPERATIVO: computadores.filter(c => c.estado === 'OPERATIVO').length,
      EN_MANTENIMIENTO: computadores.filter(c => c.estado === 'EN_MANTENIMIENTO').length,
      DE_BAJA: computadores.filter(c => c.estado === 'DE_BAJA').length,
      EN_RESGUARDO: computadores.filter(c => c.estado === 'EN_RESGUARDO').length,
    };

    const estadosDispositivos = {
      ASIGNADO: dispositivos.filter(d => d.estado === 'ASIGNADO').length,
      OPERATIVO: dispositivos.filter(d => d.estado === 'OPERATIVO').length,
      EN_MANTENIMIENTO: dispositivos.filter(d => d.estado === 'EN_MANTENIMIENTO').length,
      DE_BAJA: dispositivos.filter(d => d.estado === 'DE_BAJA').length,
      EN_RESGUARDO: dispositivos.filter(d => d.estado === 'EN_RESGUARDO').length,
    };

    const estadosTotales = {
      ASIGNADO: estadosComputadores.ASIGNADO + estadosDispositivos.ASIGNADO,
      OPERATIVO: estadosComputadores.OPERATIVO + estadosDispositivos.OPERATIVO,
      EN_MANTENIMIENTO: estadosComputadores.EN_MANTENIMIENTO + estadosDispositivos.EN_MANTENIMIENTO,
      DE_BAJA: estadosComputadores.DE_BAJA + estadosDispositivos.DE_BAJA,
      EN_RESGUARDO: estadosComputadores.EN_RESGUARDO + estadosDispositivos.EN_RESGUARDO,
    };

    // Estadísticas por empresa
    const empresaStats = new Map<string, { id: string; nombre: string; count: number }>();
    const departamentoStats = new Map<string, { id: string; nombre: string; empresa: string; count: number }>();
    const empleadoStats = new Map<string, { 
      id: string; 
      nombre: string; 
      apellido: string; 
      departamento: string; 
      empresa: string; 
      count: number 
    }>();
    const ubicacionStats = new Map<string, { id: string; nombre: string; count: number }>();

    // Obtener asignaciones reales para computadores (solo las que tienen empleados asignados)
    const asignacionesComputadores = await prisma.asignacionesEquipos.findMany({
      where: {
        computadorId: { in: computadores.map(c => c.id) },
        activo: true,
        targetEmpleadoId: { not: null } // Solo asignaciones a empleados
      },
      include: {
        targetEmpleado: {
          include: {
            organizaciones: {
              include: {
                departamento: {
                  include: {
                    empresaDepartamentos: {
                      include: {
                        empresa: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        ubicacion: true
      }
    });

    // Obtener asignaciones reales para dispositivos (solo las que tienen empleados asignados)
    const asignacionesDispositivos = await prisma.asignacionesEquipos.findMany({
      where: {
        dispositivoId: { in: dispositivos.map(d => d.id) },
        activo: true,
        targetEmpleadoId: { not: null } // Solo asignaciones a empleados
      },
      include: {
        targetEmpleado: {
          include: {
            organizaciones: {
              include: {
                departamento: {
                  include: {
                    empresaDepartamentos: {
                      include: {
                        empresa: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        ubicacion: true
      }
    });

    // Obtener ubicaciones de equipos (incluso sin asignaciones a empleados)
    const ubicacionesEquipos = await prisma.asignacionesEquipos.findMany({
      where: {
        OR: [
          { computadorId: { in: computadores.map(c => c.id) } },
          { dispositivoId: { in: dispositivos.map(d => d.id) } }
        ],
        ubicacionId: { not: null } // Solo los que tienen ubicación (activos e inactivos)
      },
      include: {
        ubicacion: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Procesar asignaciones de computadores
    asignacionesComputadores.forEach(asignacion => {
      if (asignacion.targetEmpleado) {
        const empleado = asignacion.targetEmpleado;
        const organizacion = empleado.organizaciones[0];
        if (organizacion) {
          const departamento = organizacion.departamento;
          const empresa = departamento.empresaDepartamentos[0]?.empresa;
          
          if (empresa) {
            // Estadísticas por empresa
            const empresaCurrent = empresaStats.get(empresa.nombre) || { 
              id: empresa.id, 
              nombre: empresa.nombre, 
              count: 0 
            };
            empresaStats.set(empresa.nombre, { ...empresaCurrent, count: empresaCurrent.count + 1 });
            
            // Estadísticas por departamento
            const deptoKey = `${departamento.nombre}-${empresa.nombre}`;
            const deptoCurrent = departamentoStats.get(deptoKey) || { 
              id: departamento.id,
              nombre: departamento.nombre, 
              empresa: empresa.nombre, 
              count: 0 
            };
            departamentoStats.set(deptoKey, { ...deptoCurrent, count: deptoCurrent.count + 1 });
            
            // Estadísticas por empleado
            const empleadoCurrent = empleadoStats.get(empleado.id) || { 
              id: empleado.id,
              nombre: empleado.nombre, 
              apellido: empleado.apellido,
              departamento: departamento.nombre, 
              empresa: empresa.nombre, 
              count: 0 
            };
            empleadoStats.set(empleado.id, { ...empleadoCurrent, count: empleadoCurrent.count + 1 });
          }
        }
      }
      
      // NO procesar ubicaciones aquí para evitar duplicados
      // Se procesarán todas las ubicaciones al final
    });

    // Procesar asignaciones de dispositivos
    asignacionesDispositivos.forEach(asignacion => {
      if (asignacion.targetEmpleado) {
        const empleado = asignacion.targetEmpleado;
        const organizacion = empleado.organizaciones[0];
        if (organizacion) {
          const departamento = organizacion.departamento;
          const empresa = departamento.empresaDepartamentos[0]?.empresa;
          
          if (empresa) {
            // Estadísticas por empresa
            const empresaCurrent = empresaStats.get(empresa.nombre) || { 
              id: empresa.id, 
              nombre: empresa.nombre, 
              count: 0 
            };
            empresaStats.set(empresa.nombre, { ...empresaCurrent, count: empresaCurrent.count + 1 });
            
            // Estadísticas por departamento
            const deptoKey = `${departamento.nombre}-${empresa.nombre}`;
            const deptoCurrent = departamentoStats.get(deptoKey) || { 
              id: departamento.id,
              nombre: departamento.nombre, 
              empresa: empresa.nombre, 
              count: 0 
            };
            departamentoStats.set(deptoKey, { ...deptoCurrent, count: deptoCurrent.count + 1 });
            
            // Estadísticas por empleado
            const empleadoCurrent = empleadoStats.get(empleado.id) || { 
              id: empleado.id,
              nombre: empleado.nombre, 
              apellido: empleado.apellido,
              departamento: departamento.nombre, 
              empresa: empresa.nombre, 
              count: 0 
            };
            empleadoStats.set(empleado.id, { ...empleadoCurrent, count: empleadoCurrent.count + 1 });
          }
        }
      }
      
      // NO procesar ubicaciones aquí para evitar duplicados
      // Se procesarán todas las ubicaciones al final
    });

    // Procesar ubicaciones de equipos (incluso sin asignaciones a empleados)
    // Solo contar equipos que pertenecen a este modelo específico
    const equiposProcesados = new Set<string>();
    
    ubicacionesEquipos.forEach(asignacion => {
      if (asignacion.ubicacion) {
        // Obtener el ID del equipo (computador o dispositivo)
        const equipoId = asignacion.computadorId || asignacion.dispositivoId;
        
        // Verificar que el equipo pertenece a este modelo específico
        const esComputadorDelModelo = asignacion.computadorId && computadores.some(c => c.id === asignacion.computadorId);
        const esDispositivoDelModelo = asignacion.dispositivoId && dispositivos.some(d => d.id === asignacion.dispositivoId);
        
        if (equipoId && !equiposProcesados.has(equipoId) && (esComputadorDelModelo || esDispositivoDelModelo)) {
          equiposProcesados.add(equipoId);
          
          const ubicacionCurrent = ubicacionStats.get(asignacion.ubicacion.nombre) || { 
            id: asignacion.ubicacion.id,
            nombre: asignacion.ubicacion.nombre, 
            count: 0 
          };
          ubicacionStats.set(asignacion.ubicacion.nombre, { ...ubicacionCurrent, count: ubicacionCurrent.count + 1 });
        }
      }
    });

    // Convertir Maps a Arrays y ordenar
    const empresas = Array.from(empresaStats.values())
      .sort((a, b) => b.count - a.count);

    const departamentos = Array.from(departamentoStats.values())
      .sort((a, b) => b.count - a.count);

    const empleados = Array.from(empleadoStats.values())
      .sort((a, b) => b.count - a.count);

    const ubicaciones = Array.from(ubicacionStats.values())
      .sort((a, b) => b.count - a.count);

    const stats = {
      totalComputadores,
      totalDispositivos,
      totalEquipos,
      estados: estadosTotales,
      empresas,
      departamentos,
      empleados,
      ubicaciones
    };

    return NextResponse.json({ modelo, stats });
  } catch (error) {
    console.error("Error fetching modelo details:", error);
    return NextResponse.json(
      { message: "Error fetching modelo details" },
      { status: 500 }
    );
  }
}