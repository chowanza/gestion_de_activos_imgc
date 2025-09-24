import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Obtener el modelo con sus relaciones
    const modelo = await prisma.modeloDispositivo.findUnique({
      where: { id },
      include: {
        marca: true,
        computadores: {
          include: {
            empleado: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                cargo: true,
                fotoPerfil: true,
                departamento: {
                  include: {
                    empresa: true
                  }
                }
              }
            },
            ubicacion: true
          }
        },
        dispositivos: {
          include: {
            empleado: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                cargo: true,
                fotoPerfil: true,
                departamento: {
                  include: {
                    empresa: true
                  }
                }
              }
            },
            ubicacion: true
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

    // Calcular estados usando el nuevo sistema
    const estadosComputadores = {
      ASIGNADO: modelo.computadores.filter(c => c.estado === 'ASIGNADO').length,
      OPERATIVO: modelo.computadores.filter(c => c.estado === 'OPERATIVO').length,
      EN_MANTENIMIENTO: modelo.computadores.filter(c => c.estado === 'EN_MANTENIMIENTO').length,
      DE_BAJA: modelo.computadores.filter(c => c.estado === 'DE_BAJA').length,
      EN_RESGUARDO: modelo.computadores.filter(c => c.estado === 'EN_RESGUARDO').length,
    };

    const estadosDispositivos = {
      ASIGNADO: modelo.dispositivos.filter(d => d.estado === 'ASIGNADO').length,
      OPERATIVO: modelo.dispositivos.filter(d => d.estado === 'OPERATIVO').length,
      EN_MANTENIMIENTO: modelo.dispositivos.filter(d => d.estado === 'EN_MANTENIMIENTO').length,
      DE_BAJA: modelo.dispositivos.filter(d => d.estado === 'DE_BAJA').length,
      EN_RESGUARDO: modelo.dispositivos.filter(d => d.estado === 'EN_RESGUARDO').length,
    };

    const estadosTotales = {
      ASIGNADO: estadosComputadores.ASIGNADO + estadosDispositivos.ASIGNADO,
      OPERATIVO: estadosComputadores.OPERATIVO + estadosDispositivos.OPERATIVO,
      EN_MANTENIMIENTO: estadosComputadores.EN_MANTENIMIENTO + estadosDispositivos.EN_MANTENIMIENTO,
      DE_BAJA: estadosComputadores.DE_BAJA + estadosDispositivos.DE_BAJA,
      EN_RESGUARDO: estadosComputadores.EN_RESGUARDO + estadosDispositivos.EN_RESGUARDO,
    };

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
    const ubicacionStats = new Map<string, { nombre: string; count: number }>();

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

      // Contar por ubicación
      if (computador.ubicacion) {
        const ubicacionNombre = computador.ubicacion.nombre;
        const current = ubicacionStats.get(ubicacionNombre) || { nombre: ubicacionNombre, count: 0 };
        ubicacionStats.set(ubicacionNombre, { ...current, count: current.count + 1 });
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

      // Contar por ubicación
      if (dispositivo.ubicacion) {
        const ubicacionNombre = dispositivo.ubicacion.nombre;
        const current = ubicacionStats.get(ubicacionNombre) || { nombre: ubicacionNombre, count: 0 };
        ubicacionStats.set(ubicacionNombre, { ...current, count: current.count + 1 });
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
