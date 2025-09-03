import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const modeloId = searchParams.get("modeloId");
        const proveedor = searchParams.get("proveedor");
        const estado = searchParams.get("estado");

        // Console log para ver los parámetros de entrada
        console.log("=============== INICIO DE PETICIÓN ===============");
        console.log(`Petición recibida con params:`, { modeloId, proveedor, estado });

        // =================================================================================
        // Bloque 1: REFACTORIZADO - Búsqueda de activos disponibles por Modelo
        // =================================================================================
        if (modeloId) {
            console.log(`[Bloque 1] Buscando activos disponibles para modeloId: ${modeloId}`);
            
            // Primero, encontramos todos los activos que coinciden con el modelo.
            const [computadores, dispositivos] = await Promise.all([
                prisma.computador.findMany({ where: { modeloId } }),
                prisma.dispositivo.findMany({ where: { modeloId } }),
            ]);

            const activosDelModelo = [
                ...computadores.map(c => ({ id: c.id, serial: c.serial, itemType: "Computador" as const })),
                ...dispositivos.map(d => ({ id: d.id, serial: d.serial, itemType: "Dispositivo" as const }))
            ];
            const idsActivosDelModelo = activosDelModelo.map(a => a.id);
            
            if (idsActivosDelModelo.length === 0) {
                 console.log("[Bloque 1] No se encontraron activos para este modelo.");
                 return NextResponse.json([]);
            }

            // Ahora, buscamos la última acción SOLO para esos activos.
            const ultimasAcciones = await prisma.asignaciones.findMany({
                where: {
                    OR: [
                        { computadorId: { in: idsActivosDelModelo } },
                        { dispositivoId: { in: idsActivosDelModelo } },
                    ],
                },
                orderBy: { date: "desc" },
                distinct: ["computadorId", "dispositivoId"],
            });
            console.log("[Bloque 1] Últimas acciones encontradas para estos activos:", ultimasAcciones);

            const mapaAcciones = new Map(
                ultimasAcciones.map(a => [a.computadorId || a.dispositivoId, a.actionType])
            );

            // Un activo está disponible si NO tiene una última acción, o si su última acción es "Devolucion".
            const activosDisponibles = activosDelModelo
                .filter(activo => {
                    const ultimaAccion = mapaAcciones.get(activo.id);
                    return !ultimaAccion || ultimaAccion === "Devolucion";
                })
                .map(activo => ({
                    value: activo.id,
                    label: `Serial: ${activo.serial} (${activo.itemType})`,
                    type: activo.itemType,
                }));

            console.log("[Bloque 1] Activos disponibles filtrados y devueltos:", activosDisponibles);
            return NextResponse.json(activosDisponibles);
        }
       if (proveedor) {
            // 1. Encontrar todas las líneas para el proveedor.
            const lineasDelProveedor = await prisma.lineaTelefonica.findMany({
                where: { proveedor },
            });

            const idsLineas = lineasDelProveedor.map(l => l.id);
            if (idsLineas.length === 0) {
                return NextResponse.json([]);
            }

            // 2. Encontrar la última acción solo para esas líneas.
            const ultimasAcciones = await prisma.asignaciones.findMany({
                where: { lineaTelefonicaId: { in: idsLineas } },
                orderBy: { date: 'desc' },
                distinct: ['lineaTelefonicaId'],
            });

            const mapaAcciones = new Map(
                ultimasAcciones.map(a => [a.lineaTelefonicaId, a.actionType])
            );

            // 3. Filtrar las líneas que están disponibles.
            const lineasDisponibles = lineasDelProveedor
                .filter(linea => {
                    const accion = mapaAcciones.get(linea.id);
                    return !accion || accion === "Devolucion";
                })
                .map(linea => ({
                    value: linea.id,
                    label: `Línea ${linea.proveedor} (${linea.numero})`,
                    type: "LineaTelefonica",
                }));

            return NextResponse.json(lineasDisponibles);
        }

        // =================================================================================
        // Bloque 3: Lógica principal de filtrado por estado (CON DEBUGGING)
        // =================================================================================
        if (estado && (estado.toLowerCase() === "asignado" || estado.toLowerCase() === "disponible")) {
            console.log(`[Bloque 3] Filtrando todos los activos por estado: ${estado}`);
            
            const computadores = await prisma.computador.findMany({ include: { modelo: { include: { marca: true } } } });
            const dispositivos = await prisma.dispositivo.findMany({ include: { modelo: { include: { marca: true } } } });
            const lineas = await prisma.lineaTelefonica.findMany();

            const todosLosActivos = [
                ...computadores.map(c => ({ ...c, itemType: "Computador" as const })),
                ...dispositivos.map(d => ({ ...d, itemType: "Dispositivo" as const })),
                ...lineas.map(l => ({ ...l, itemType: "LineaTelefonica" as const })),
            ];

            const idsActivos = todosLosActivos.map(a => a.id);

            // ¡¡ESTA ES LA CONSULTA CRÍTICA A DEPURAR!!
            const ultimasAcciones = await prisma.asignaciones.findMany({
                where: {
                    OR: [
                        { computadorId: { in: idsActivos } },
                        { dispositivoId: { in: idsActivos } },
                        { lineaTelefonicaId: { in: idsActivos } }
                    ]
                },
                orderBy: { date: "desc" },
                distinct: ["computadorId", "dispositivoId", "lineaTelefonicaId"],
                include: {
                    targetUsuario: true,
                    targetDepartamento: true
                }
            });
            
            // Imprime los resultados de la consulta para ver qué está trayendo
            console.log("[Bloque 3] Resultado de la consulta 'ultimasAcciones':", JSON.stringify(ultimasAcciones, null, 2));

            const mapaAcciones = new Map(
                ultimasAcciones.map(a => [a.computadorId || a.dispositivoId || a.lineaTelefonicaId, a])
            );
            
            console.log(`[Bloque 3] Mapa de acciones construido con ${mapaAcciones.size} elementos.`);

            let activosFiltrados = [];
            if (estado.toLowerCase() === "asignado") {
            activosFiltrados = todosLosActivos
                .filter(activo => {
                    // Este filtro es correcto: solo deja pasar activos cuya
                    // última acción registrada sea una "Asignacion".
                    const accion = mapaAcciones.get(activo.id);
                    return accion?.actionType === "Asignacion";
                })
                .map(activo => {
                    // Una vez filtrado, aquí solo tenemos activos que GARANTIZADO tienen una acción.
                    const accion = mapaAcciones.get(activo.id)!; // Usamos '!' porque sabemos que existe.

                    // Construimos el string de a quién fue asignado.
                    const asignadoA = accion.targetType === "Usuario"
                        ? `${accion.targetUsuario?.nombre} ${accion.targetUsuario?.apellido}`
                        : accion.targetDepartamento?.nombre;

                    // Construimos la etiqueta descriptiva del activo.
                    // AGREGAMOS "?." (optional chaining) para evitar errores si un modelo o marca es null.
                    const label = activo.itemType === 'LineaTelefonica'
                        ? `Línea ${activo.proveedor} (${activo.numero})`
                        : `${activo.modelo?.marca?.nombre ?? 'Marca Desconocida'} ${activo.modelo?.nombre ?? 'Modelo Desconocido'} (Serial: ${activo.serial})`;

                    // Devolvemos el objeto con la estructura que el frontend espera.
                    return {
                        value: activo.id,
                        label: label,
                        type: activo.itemType,
                        asignadoA: asignadoA ?? "Destino desconocido",
                    };
                });
            } else { // estado === "disponible"
                activosFiltrados = todosLosActivos
                    .filter(activo => {
                        const accion = mapaAcciones.get(activo.id);
                        // El activo está disponible si NO hay acción o si la última fue "Devolucion"
                        return !accion || accion.actionType === "Devolucion";
                    })
                     .map(activo => {
                        // ... (el resto de tu lógica de mapeo es correcta)
                    });
            }
            
            console.log(`[Bloque 3] Total de activos filtrados para '${estado}': ${activosFiltrados.length}`);
            return NextResponse.json(activosFiltrados);
        }

        return NextResponse.json(
            { error: "Se requiere un parámetro de filtro válido ('estado', 'modeloId', o 'proveedor')." },
            { status: 400 }
        );
    } catch (error) {
        console.error(`Error fatal en /api/activos:`, error);
        return NextResponse.json(
            { error: "Failed to fetch activos" },
            { status: 500 }
        );
    }
}