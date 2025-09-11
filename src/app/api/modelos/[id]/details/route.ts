import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split('/')[3];

    // Obtener el modelo con sus relaciones
    const modelo = await prisma.modeloDispositivo.findUnique({
      where: { id },
      include: {
        marca: true,
        computadores: {
          include: {
            empleado: {
              include: {
                departamento: {
                  include: {
                    empresa: true
                  }
                }
              }
            },
            departamento: {
              include: {
                empresa: true
              }
            }
          }
        },
        dispositivos: {
          include: {
            empleado: {
              include: {
                departamento: {
                  include: {
                    empresa: true
                  }
                }
              }
            },
            departamento: {
              include: {
                empresa: true
              }
            }
          }
        }
      }
    });

    if (!modelo) {
      return NextResponse.json({ message: "Modelo not found" }, { status: 404 });
    }

    // Calcular estadísticas
    const totalComputadores = modelo.computadores.length;
    const totalDispositivos = modelo.dispositivos.length;
    const totalEquipos = totalComputadores + totalDispositivos;

    // Calcular estados
    const estadosComputadores = {
      asignado: modelo.computadores.filter(c => c.empleado !== null).length,
      resguardo: modelo.computadores.filter(c => c.empleado === null && c.departamento !== null).length,
      reparacion: modelo.computadores.filter(c => c.estado === 'reparacion').length,
      deBaja: modelo.computadores.filter(c => c.estado === 'de baja').length,
      operativo: modelo.computadores.filter(c => c.estado === 'operativo' && c.empleado !== null).length,
    };

    const estadosDispositivos = {
      asignado: modelo.dispositivos.filter(d => d.empleado !== null).length,
      resguardo: modelo.dispositivos.filter(d => d.empleado === null && d.departamento !== null).length,
      reparacion: modelo.dispositivos.filter(d => d.estado === 'reparacion').length,
      deBaja: modelo.dispositivos.filter(d => d.estado === 'de baja').length,
      operativo: modelo.dispositivos.filter(d => d.estado === 'operativo' && d.empleado !== null).length,
    };

    const estadosTotales = {
      asignado: estadosComputadores.asignado + estadosDispositivos.asignado,
      resguardo: estadosComputadores.resguardo + estadosDispositivos.resguardo,
      reparacion: estadosComputadores.reparacion + estadosDispositivos.reparacion,
      deBaja: estadosComputadores.deBaja + estadosDispositivos.deBaja,
      operativo: estadosComputadores.operativo + estadosDispositivos.operativo,
    };

    // Debug logs (comentados para producción)
    // console.log('=== DEBUG MODELO ESTADOS ===');
    // console.log('Modelo:', modelo.nombre);
    // console.log('Estados totales:', estadosTotales);

    // Estadísticas por empresa
    const empresaStats = new Map<string, number>();
    const departamentoStats = new Map<string, { nombre: string; empresa: string; count: number }>();
    const empleadoStats = new Map<string, { 
      id: string; 
      nombre: string; 
      apellido: string; 
      departamento: string; 
      empresa: string; 
      count: number 
    }>();

    // Procesar computadores
    modelo.computadores.forEach(computador => {
      let empresaNombre = '';
      let departamentoNombre = '';
      let empleadoInfo = null;

      if (computador.empleado) {
        empresaNombre = computador.empleado.departamento.empresa.nombre;
        departamentoNombre = computador.empleado.departamento.nombre;
        empleadoInfo = {
          id: computador.empleado.id,
          nombre: computador.empleado.nombre,
          apellido: computador.empleado.apellido,
          departamento: departamentoNombre,
          empresa: empresaNombre
        };
      } else if (computador.departamento) {
        empresaNombre = computador.departamento.empresa.nombre;
        departamentoNombre = computador.departamento.nombre;
      }

      // Contar por empresa
      if (empresaNombre) {
        empresaStats.set(empresaNombre, (empresaStats.get(empresaNombre) || 0) + 1);
      }

      // Contar por departamento
      if (departamentoNombre && empresaNombre) {
        const key = `${departamentoNombre}-${empresaNombre}`;
        const current = departamentoStats.get(key) || { nombre: departamentoNombre, empresa: empresaNombre, count: 0 };
        departamentoStats.set(key, { ...current, count: current.count + 1 });
      }

      // Contar por empleado
      if (empleadoInfo) {
        const key = empleadoInfo.id;
        const current = empleadoStats.get(key) || { ...empleadoInfo, count: 0 };
        empleadoStats.set(key, { ...current, count: current.count + 1 });
      }
    });

    // Procesar dispositivos
    modelo.dispositivos.forEach(dispositivo => {
      let empresaNombre = '';
      let departamentoNombre = '';
      let empleadoInfo = null;

      if (dispositivo.empleado) {
        empresaNombre = dispositivo.empleado.departamento.empresa.nombre;
        departamentoNombre = dispositivo.empleado.departamento.nombre;
        empleadoInfo = {
          id: dispositivo.empleado.id,
          nombre: dispositivo.empleado.nombre,
          apellido: dispositivo.empleado.apellido,
          departamento: departamentoNombre,
          empresa: empresaNombre
        };
      } else if (dispositivo.departamento) {
        empresaNombre = dispositivo.departamento.empresa.nombre;
        departamentoNombre = dispositivo.departamento.nombre;
      }

      // Contar por empresa
      if (empresaNombre) {
        empresaStats.set(empresaNombre, (empresaStats.get(empresaNombre) || 0) + 1);
      }

      // Contar por departamento
      if (departamentoNombre && empresaNombre) {
        const key = `${departamentoNombre}-${empresaNombre}`;
        const current = departamentoStats.get(key) || { nombre: departamentoNombre, empresa: empresaNombre, count: 0 };
        departamentoStats.set(key, { ...current, count: current.count + 1 });
      }

      // Contar por empleado
      if (empleadoInfo) {
        const key = empleadoInfo.id;
        const current = empleadoStats.get(key) || { ...empleadoInfo, count: 0 };
        empleadoStats.set(key, { ...current, count: current.count + 1 });
      }
    });

    // Convertir Maps a Arrays y ordenar
    const empresas = Array.from(empresaStats.entries())
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => b.count - a.count);

    const departamentos = Array.from(departamentoStats.values())
      .sort((a, b) => b.count - a.count);

    const empleados = Array.from(empleadoStats.values())
      .sort((a, b) => b.count - a.count);

    const stats = {
      totalComputadores,
      totalDispositivos,
      totalEquipos,
      estados: estadosTotales,
      empresas,
      departamentos,
      empleados
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
