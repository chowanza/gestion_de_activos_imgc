"use client";

import { useState, useEffect, useCallback } from 'react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Select from 'react-select'; // react-select es ideal para buscar en listas largas
import { showToast } from 'nextjs-toast-notify';
import { ArrowRightLeftIcon, Undo2, XCircle } from 'lucide-react';
import { reactSelectStyles } from '@/utils/reactSelectStyles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';

interface Activo {
    value: string; // id
    label: string; // nombre descriptivo
    type: 'Computador' | 'Dispositivo' | 'LineaTelefonica' ; // tipo de activo
    asignadoA?: string;
}
interface Target {
    value: string; // id
    label: string; // nombre
}

interface UsuarioTarget extends Target {
    cargo: string;
}

export default function AsignacionesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
        // --- ESTADOS DE DATOS BASE ---
    const [equiposAsignados, setEquiposAsignados] = useState<Activo[]>([]);
    const [usuarios, setUsuarios] = useState<UsuarioTarget[]>([]);
    const [departamentos, setDepartamentos] = useState<Target[]>([]);
    const [marcas, setMarcas] = useState<Target[]>([]);
    const [proveedores, setProveedores] = useState<{value: string, label: string}[]>([]);
    
    // --- ESTADOS DEL FORMULARIO Y FLUJO GUIADO ---
    const [loading, setLoading] = useState(true);
    const [assetType, setAssetType] = useState<'Computador' | 'Dispositivo' | 'LineaTelefonica' | ''>('');
    
    const [selectedMarca, setSelectedMarca] = useState<Target | null>(null);
    const [modelos, setModelos] = useState<Target[]>([]);
    const [selectedModelo, setSelectedModelo] = useState<Target | null>(null);

    const [selectedProveedor, setSelectedProveedor] = useState<Target | null>(null);
    
    const [activosDisponibles, setActivosDisponibles] = useState<Activo[]>([]);
    const [selectedEquipo, setSelectedEquipo] = useState<Activo | null>(null);
    
    // Estados para campos adicionales del formulario
    const [asignarA, setAsignarA] = useState<'Usuario' | 'Departamento'>('Usuario');
    const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
    const [notas, setNotas] = useState('');
    const [selectedGerente, setSelectedGerente] = useState<Target | null>(null);
    const [motivo, setMotivo] = useState('');
    const [localidad, setLocalidad] = useState('');
    const [modeloC, setModeloC] = useState('');
    const [serialC, setSerialC] = useState('');
    const [listaGerentes, setListaGerentes] = useState<Target[]>([]);
  
    // --- LÓGICA DE CARGA DE DATOS (REFACTORIZADA) ---
    

    useEffect(() => {
    const fetchGerentes = async () => {
        try {
        const res = await fetch('/api/gerentes');
        if (!res.ok) throw new Error('Error al cargar gerentes');
        const data = await res.json();
        setListaGerentes(data);
        } catch (e) {
        console.error(e);
        }
    };
    fetchGerentes();
    }, []);

    // 1. Cargar datos iniciales que son estáticos o para la pestaña "Desvincular"
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const [resMarcas, resProveedores, resUsuarios, resDeptos, resAsignados] = await Promise.all([
                    fetch('/api/marcas'),
                    fetch('/api/proveedores'),
                    fetch('/api/usuarios'),
                    fetch('/api/departamentos'),
                    fetch('/api/activos?estado=asignado'),
                ]);

                // Poblar los estados con los datos iniciales
                setMarcas((await resMarcas.json()).map((m: any) => ({ value: m.id, label: m.nombre })));
                setProveedores((await resProveedores.json()).map((p: string) => ({ value: p, label: p })));
                setUsuarios((await resUsuarios.json()).map((u: any) => ({ 
                    value: u.id, 
                    label: `${u.nombre} ${u.apellido}`,
                    cargo: u.cargo // Guardamos el cargo para poder filtrar
                })));
                setDepartamentos((await resDeptos.json()).map((d: any) => ({ value: d.id, label: d.nombre })));
                setEquiposAsignados(await resAsignados.json());

            } catch (error) {
                console.error("Error fetching initial data:", error);
                showToast.error("Error al cargar datos iniciales.");
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []); // Se ejecuta solo una vez al montar el componente

    // 2. Efecto para limpiar selecciones cuando cambia el TIPO de activo
    useEffect(() => {
        setSelectedMarca(null);
        setSelectedModelo(null);
        setSelectedProveedor(null);
        // No limpiamos 'activosDisponibles' aquí para evitar un parpadeo, se limpiará en los efectos siguientes
    }, [assetType]);

    // 3. Cargar MODELOS cuando se selecciona una MARCA
    useEffect(() => {
        setActivosDisponibles([]); // Limpiar la lista final
        setSelectedEquipo(null);   // Limpiar la selección final
        if (!selectedMarca) {
            setModelos([]);
            return;
        }
        const fetchModelos = async () => {
            const res = await fetch(`/api/modelos/modeloByMarca?marcaId=${selectedMarca.value}`);
            setModelos((await res.json()).map((m: any) => ({ value: m.id, label: m.nombre })));
        };
        fetchModelos();
    }, [selectedMarca]);

    // 4. Cargar ACTIVOS ESPECÍFICOS cuando se selecciona un MODELO
    useEffect(() => {
        setActivosDisponibles([]);
        setSelectedEquipo(null);
        if (!selectedModelo) return;
        
        const fetchActivos = async () => {
            const res = await fetch(`/api/activos?modeloId=${selectedModelo.value}`);
            setActivosDisponibles(await res.json());
        };
        fetchActivos();
    }, [selectedModelo]);

    // 5. Cargar LÍNEAS TELEFÓNICAS cuando se selecciona un PROVEEDOR
    useEffect(() => {
        setActivosDisponibles([]);
        setSelectedEquipo(null);
        if (!selectedProveedor) return;

        const fetchLineas = async () => {
            const res = await fetch(`/api/activos?proveedor=${selectedProveedor.value}`);
            setActivosDisponibles(await res.json());
        };
        fetchLineas();
    }, [selectedProveedor]);

    useEffect(() => {
    const fetchGerenteDefault = async () => {
    if (!selectedTarget) {
      setSelectedGerente(null);
      return;
    }
    try {
      const params = new URLSearchParams({
        type: asignarA,
        id: selectedTarget.value,
      });
      const res = await fetch(`/api/asignaciones/gerente-default?${params.toString()}`);
      if (!res.ok) throw new Error('No se pudo obtener el gerente por defecto');
      const data = await res.json();
      setSelectedGerente(data.gerente ?? null);
    } catch (e) {
      console.error('Error al obtener gerente por defecto:', e);
      setSelectedGerente(null);
    }
  };

    fetchGerenteDefault();
    }, [asignarA, selectedTarget]);

// Nota: Necesitarás una lógica similar para 'LineaTelefonica' que use proveedores en lugar de marcas/modelos.

        // AÑADIDO: Función para limpiar la preselección
    const handleClearPreselection = () => {
        setSelectedEquipo(null);
        router.replace('/asignaciones', { scroll: false });
    };

    // --- LÓGICA DE HANDLERS REFACTORIZADA ---
    const handleAsignar = async () => {
        if (!selectedEquipo || !selectedTarget) {
            showToast.warning("Por favor, selecciona un equipo y un destino.");
            return;
        }

        const body = {
            action: 'asignar' as const,
            itemId: selectedEquipo.value,
            itemType: selectedEquipo.type,
            asignarA_id: selectedTarget.value,
            asignarA_type: asignarA,
            notas: notas,
           gerenteId: selectedGerente?.value ?? null,     // <-- NUEVO: ID del gerente seleccionado
            gerenteNombre: selectedGerente?.label ?? null,
            motivo: motivo,
            serialC: serialC,
            modeloC: modeloC,
            localidad: localidad,
        };

        try {
            const response = await fetch('/api/asignaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!response.ok) throw new Error("La asignación falló.");
            
            showToast.success(`Equipo asignado a ${selectedTarget.label} con éxito.`);
            setSelectedEquipo(null);
            setSelectedTarget(null);
            setSelectedGerente(null);
            setNotas('');
            router.push('/asignaciones')// Redirigi
        } catch (error: any) {
            showToast.error(error.message);
        }
    };


    const handleDesvincular = async (equipo: Activo) => {
        const body = {
            action: 'desvincular' as const,
            itemId: equipo.value,
            itemType: equipo.type,
            notas: `Devolución de ${equipo.asignadoA}`,
        };

        try {
            const response = await fetch('/api/asignaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "La desvinculación falló.");
            }
            
            showToast.success(`Equipo ${equipo.label} desvinculado con éxito.`);
            // fetchInitialData();
        } catch (error: any) {
            showToast.error(error.message);
        }
    };

    // --- RENDERIZADO (sin cambios significativos) ---
    const targetOptions = asignarA === 'Usuario' ? usuarios : departamentos;
    return (
        <div className="p-2 md:p-8">
            <Tabs defaultValue="asignar" className="max-w-2xl mx-auto">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="asignar"><ArrowRightLeftIcon className="mr-2 h-4 w-4" />Asignar Equipo</TabsTrigger>
                    <TabsTrigger value="desvincular"><Undo2 className="mr-2 h-4 w-4" />Desvincular Equipo</TabsTrigger>
                </TabsList>

            <TabsContent value='asignar'>    
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ArrowRightLeftIcon />
                        Realizar Asignación de Equipo
                    </CardTitle>
                    <CardDescription>
                        Selecciona un equipo y asígnalo a un usuario o departamento.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>1. Selecciona el Tipo de Activo</Label>
                        <Select
                            instanceId="asset-type-select"
                            options={[
                                { value: "Computador", label: "Computador" },
                                { value: "Dispositivo", label: "Dispositivo" },
                                { value: "LineaTelefonica", label: "Línea Telefónica" }
                            ]}
                            value={
                                assetType
                                    ? { value: assetType, label: assetType === "LineaTelefonica" ? "Línea Telefónica" : assetType }
                                    : null
                            }
                            onChange={(option) => setAssetType(option ? option.value as typeof assetType : '')}
                            placeholder="Elige un tipo..."
                            isClearable
                            styles={reactSelectStyles}
                        />
                    </div>

                    {/* --- Renderizado Condicional para Computador/Dispositivo --- */}
                    {(assetType === 'Computador' || assetType === 'Dispositivo') && (
                        <div className="space-y-4 animate-in fade-in-0">
                            <div className="space-y-2">
                                <Label>2. Selecciona la Marca</Label>
                                <Select
                                    instanceId="marca-select"
                                    options={marcas}
                                    value={selectedMarca}
                                    onChange={setSelectedMarca}
                                    placeholder="Buscar marca..."
                                    styles={reactSelectStyles}
                                    isClearable
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>3. Selecciona el Modelo</Label>
                                <Select
                                    instanceId="modelo-select"
                                    options={modelos}
                                    value={selectedModelo}
                                    onChange={setSelectedModelo}
                                    placeholder="Buscar modelo..."
                                    isClearable
                                    isDisabled={!selectedMarca}
                                    styles={reactSelectStyles}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>4. Selecciona el Activo Específico (por Serial)</Label>
                                <Select
                                    instanceId="activo-select"
                                   options={activosDisponibles} 
                                   value={selectedEquipo} 
                                   onChange={setSelectedEquipo}
                                    placeholder="Buscar serial..."
                                    isClearable
                                    isDisabled={!selectedModelo}
                                    styles={reactSelectStyles}
                                />
                            </div>
                        </div>
                    )}

                   {assetType === 'LineaTelefonica' && (
                    <div className="space-y-4 animate-in fade-in-0">

                        {/* --- Dropdown para el Proveedor --- */}
                        <div className="space-y-2">
                            <Label>2. Selecciona el Proveedor</Label>
                            <Select
                                instanceId="proveedor-select"
                                options={proveedores}
                                value={selectedProveedor}
                                onChange={setSelectedProveedor}
                                styles={reactSelectStyles}
                                placeholder="Buscar proveedor..."
                                isClearable
                            />
                        </div>

                        {/* --- Dropdown para el Número de Línea --- */}
                        <div className="space-y-2">
                            <Label>3. Selecciona la Línea Específica (Número)</Label>
                            <Select
                                instanceId="linea-select"
                                options={activosDisponibles}
                                value={selectedEquipo}
                                onChange={setSelectedEquipo}
                                styles={reactSelectStyles}
                                placeholder="Elige un número..."
                                isClearable
                                // Se deshabilita hasta que se seleccione un proveedor
                                isDisabled={!selectedProveedor}
                            />
                        </div>
                        
                    </div>
                )}

                    <div className="space-y-2">
                        <Label>2. Elige el Destino de la Asignación</Label>
                        <RadioGroup value={asignarA} onValueChange={(value: any) => setAsignarA(value)} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Usuario" id="r-usuario" />
                                <Label htmlFor="r-usuario">Usuario</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Departamento" id="r-depto" />
                                <Label htmlFor="r-depto">Departamento</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label>3. Selecciona el {asignarA === 'Usuario' ? 'Usuario' : 'Departamento'} Específico</Label>
                         <Select
                         instanceId="search-combo"
                            options={targetOptions}
                            value={selectedTarget}
                            onChange={setSelectedTarget}
                            styles={reactSelectStyles}
                            placeholder={`Buscar ${asignarA}...`}
                            isClearable
                            isSearchable
                            isDisabled={!selectedEquipo}
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                        <Label htmlFor="gerente">Gerente</Label>
                        <Select
                            instanceId="gerente-select"
                            options={listaGerentes}
                            value={selectedGerente}
                            onChange={setSelectedGerente}
                            styles={reactSelectStyles}
                            placeholder="Selecciona un gerente..."
                            isClearable
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="motivo">Motivo<span className="text-destructive">*</span></Label>
                            <select
                                id="motivo"
                                className="w-full h-10 border rounded-md px-2 bg-[hsl(var(--background))] border-[hsl(var(--input))] focus:ring-1 focus:ring-[hsl(var(--ring))] focus:outline-none"
                                value={motivo || ''}
                                onChange={(e) => setMotivo(e.target.value)}
                                required
                            >
                                <option value="" disabled>Seleccionar Motivo...</option>
                                <option value="Nueva Asignacion">Nueva Asignacion</option>
                                <option value="Reposicion por Renovación">Reposicion por Renovación</option>
                                <option value="Reposicion por Pérdida">Reposicion por Pérdida</option>
                                <option value="Reposicion por Robo">Reposicion por Robo</option>
                                <option value="Traspaso">Traspaso</option>
                                <option value="Prestámo IT">Prestámo IT</option>
                            </select>
                    </div>

                    {assetType === 'Computador' && (
                        <>
                            <div className="space-y-2 animate-in fade-in-0">
                                <Label htmlFor="modeloC">Modelo Cargador (Opcional)</Label>
                                <Input id="modeloC" value={modeloC} onChange={(e) => setModeloC(e.target.value)} placeholder="Ej: Lenovo" />
                            </div>

                            <div className="space-y-2 animate-in fade-in-0">
                                <Label htmlFor="serialC">Serial Cargador (Opcional)</Label>
                                <Input id="serialC" value={serialC} onChange={(e) => setSerialC(e.target.value)} placeholder="Ej: CHNN45GHJJ" />
                            </div>
                        </>
                    )}

                    
                    <div className="space-y-2">
                        <Label htmlFor="localidad">Localidad<span className="text-destructive">*</span></Label>
                            <select
                                id="localidad"
                                className="w-full h-10 border rounded-md px-2 bg-[hsl(var(--background))] border-[hsl(var(--input))] focus:ring-1 focus:ring-[hsl(var(--ring))] focus:outline-none"
                                value={localidad || ''}
                                onChange={(e) => setLocalidad(e.target.value)}
                                required
                            >
                                <option value="" disabled>Seleccionar localidad...</option>
                                <option value="MCP">Macapaima</option>
                                <option value="PZO">Puerto Ordaz</option>
                                <option value="CCS">Caracas</option>
                                <option value="ESP">La Esperanza</option>
                            </select>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="notas">Notas Adicionales (Opcional)</Label>
                        <Input id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej: Equipo de reemplazo temporal..." />
                    </div>

                    </div>
                    <Button onClick={handleAsignar} disabled={!selectedEquipo || !selectedTarget} className="w-full">
                        Confirmar Asignación
                    </Button>
                </CardContent>
            </Card>
            </TabsContent>
            <TabsContent value="desvincular">
                     <Card>
                        <CardHeader>
                            <CardTitle>Equipos Asignados</CardTitle>
                            <CardDescription>Selecciona un equipo para desvincularlo y devolverlo a resguardo.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {loading ? <Spinner /> : 
                                equiposAsignados.length > 0 ? (
                                    equiposAsignados.map((equipo) => (
                                        <div key={equipo.value} className="flex items-center justify-between p-3 bg-card rounded-md border">
                                            <div>
                                                <p className="font-medium text-sm">{equipo.label}</p>
                                                <p className="text-xs text-muted-foreground">Asignado a: {equipo.asignadoA}</p>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => handleDesvincular(equipo)}>
                                                <Undo2 className="mr-2 h-4 w-4" />
                                                Desvincular
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-muted-foreground p-4">No hay equipos asignados actualmente.</p>
                                )
                            }
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

        </div>
    );
}