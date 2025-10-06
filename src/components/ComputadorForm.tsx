'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Select from 'react-select'; // Usando react-select para modelos
import { showToast } from "nextjs-toast-notify"; // Usando el componente de scroll de Shadcn
import Link from 'next/link';
import { RadioGroupItem, RadioGroup } from '@/components/ui/radio-group';
import { reactSelectStyles } from '@/utils/reactSelectStyles';

// --- Interfaces y Tipos (sin cambios) ---
interface Modelo {
    id: string;
    nombre: string;
    tipo: string;
}

interface Ubicacion {
    id: string;
    nombre: string;
}

interface Usuario {
    value: string;
    label: string;
    cargo: string;
    departamento: string;
    empresa: string;
}

interface Departamento {
    value: string;
    label: string;
    empresa: string;
}

export interface ComputadorFormData {
    id?: string;
    modeloId: string;
    serial: string;
    estado: string;
    codigoImgc: string;  // Cambio de nsap a codigoImgc - OBLIGATORIO
    ubicacionId?: string;
    host?: string;
    sisOperativo?: string;
    arquitectura?: "32" | "64" | "";
    ram?: string;
    almacenamiento?: string;
    procesador?: string;
    macWifi?: string;
    macEthernet?: string;
    officeVersion?: string;
    anydesk?: string;
    // Nuevos campos de compra
    fechaCompra?: string;
    numeroFactura?: string;
    proveedor?: string;
    monto?: number;
    // Campo para empleado asignado
    empleado?: {
        id: string;
        nombre: string;
        apellido: string;
    };
}

interface ComputadorFormProps {
    onSubmit: (data: ComputadorFormData) => Promise<void>;
    initialData?: ComputadorFormData | null;
    isEditing?: boolean; // Añadido para manejar el modo de edición
    onCancel?: () => void; // Función opcional para manejar cancelación
}

interface OptionType {
    value: string;
    label: string;
}


// Estado inicial limpio para el formulario de creación
const initialState: ComputadorFormData = {
    modeloId: '',
    serial: '',
    estado: 'OPERATIVO',  // Valor por defecto válido
    codigoImgc: '',  // Cambio de nsap a codigoImgc - OBLIGATORIO
    host: '',
    sisOperativo: '',
    arquitectura: '',
    ram: '',
    almacenamiento: '',
    procesador: '',
    officeVersion: '',
    anydesk: '',
    ubicacionId: '',
    macEthernet: '',
    macWifi: '',
    // Nuevos campos de compra
    fechaCompra: '',
    numeroFactura: '',
    proveedor: '',
    monto: undefined
};

const ComputadorForm: React.FC<ComputadorFormProps> = ({
    isEditing = false, // Por defecto es false
    onSubmit,
    initialData,
    onCancel,
}) => {

    const [formData, setFormData] = useState<ComputadorFormData>(
        initialData || initialState
    );
    const [modelos, setModelos] = useState<Modelo[]>([]);
    const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [selectedTarget, setSelectedTarget] = useState<any>(null);
    const [isLoadingModelos, setIsLoadingModelos] = useState(false);
    const [isLoadingUbicaciones, setIsLoadingUbicaciones] = useState(false);
    
    // Estados para la lógica de asignación (ya no se usan - el estado se maneja desde "Gestionar Estado")

    // --- useEffect CORREGIDO para manejar el estado del formulario ---
        useEffect(() => {
            const fetchData = async () => {
                setIsLoadingModelos(true);
                setIsLoadingUbicaciones(true);
                try {
                    const [modelosRes, ubicacionesRes, usuariosRes] = await Promise.all([
                        fetch('/api/modelos'),
                        fetch('/api/ubicaciones'),
                        fetch('/api/usuarios')
                    ]);

                    const [modelosData, ubicacionesData, usuariosData] = await Promise.all([
                        modelosRes.json(),
                        ubicacionesRes.json(),
                        usuariosRes.json()
                    ]);

                    // Procesar modelos y ubicaciones
                    setModelos(modelosData);
                    setUbicaciones(ubicacionesData);

                    // Procesar usuarios
                    const usuariosFormatted = usuariosData.map((user: any) => ({
                        value: user.id,
                        label: `${user.nombre} ${user.apellido}`,
                        cargo: user.cargo?.nombre || 'N/A',
                        departamento: user.departamento?.nombre || 'N/A',
                        empresa: user.empresa?.nombre || 'N/A'
                    }));

                    setUsuarios(usuariosFormatted);
                } catch (error) {
                    showToast.error("¡Error en Cargar Datos!", { position: "top-right" });
                } finally {
                    setIsLoadingModelos(false);
                    setIsLoadingUbicaciones(false);
                }
            };

            fetchData();
        }, []); // Solo se ejecuta una vez al montar

        // useEffect separado para manejar initialData
        useEffect(() => {
            if (initialData) {
                setFormData({
                    ...initialData,
                    estado: initialData.estado || 'OPERATIVO'  // Asegurar que siempre tenga un estado válido
                });
            }
        }, [initialData]);

        // useEffect separado para pre-seleccionar empleado
        useEffect(() => {
            if (initialData?.empleado && usuarios.length > 0) {
                const empleadoAsignado = usuarios.find(user => user.value === initialData.empleado.id);
                if (empleadoAsignado) {
                    setSelectedTarget(empleadoAsignado);
                }
            }
        }, [initialData?.empleado, usuarios]);

    // --- Handlers para los cambios en los inputs ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const newValue = e.target.value;
        const fieldId = e.target.id;
        
        // Debug: mostrar cambios de estado
        if (fieldId === 'estado') {
            console.log('Estado cambiado a:', newValue);
        }
        
        setFormData(prev => ({ ...prev, [fieldId]: newValue }));
    };

    const handleSelectChange = (option: OptionType | null) => {
        setFormData(prev => ({ ...prev, modeloId: option?.value ?? '' }));
    };

    const handleUbicacionChange = (option: OptionType | null) => {
        setFormData(prev => ({ ...prev, ubicacionId: option?.value ?? '' }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        // Validación diferente para creación vs edición
        if (isEditing) {
            // En modo edición, solo validar que los campos críticos no estén completamente vacíos
            if (!formData.serial?.trim()) {
                showToast.warning("El serial es obligatorio.", { position: "top-right" });
                return;
            }
            if (!formData.codigoImgc?.trim()) {
                showToast.warning("El código IMGC es obligatorio.", { position: "top-right" });
                return;
            }
        } else {
            // En modo creación, validar todos los campos requeridos
            if (!formData.modeloId || !formData.serial || !formData.codigoImgc) {
                showToast.warning("Modelo, Serial y Código IMGC son obligatorios.", { position: "top-right" });
                return;
            }
        }

        // El estado del equipo se maneja desde "Gestionar Estado" en los detalles

        await onSubmit(formData); // Llama a la función del padre para manejar la lógica de API
    };
    
    // Tipos de computadoras permitidos
    const TIPOS_COMPUTADORAS = [
        "Laptop",
        "Desktop", 
        "Servidor",
        "Workstation",
        "All-in-One"
    ];

    // Filtrar solo modelos de computadoras
    const modelosComputadoras = modelos.filter(modelo => 
        TIPOS_COMPUTADORAS.includes(modelo.tipo)
    );

    // Preparar opciones para react-select
    const modeloOptions = modelosComputadoras.map(modelo => ({ value: modelo.id, label: modelo.nombre }));
    const ubicacionOptions = ubicaciones.map(ubicacion => ({ value: ubicacion.id, label: ubicacion.nombre }));
    const selectedModelValue = modeloOptions.find(option => option.value === formData.modeloId) || null;
    const selectedUbicacionValue = ubicacionOptions.find(option => option.value === formData.ubicacionId) || null;
    
    // El estado del equipo se maneja desde "Gestionar Estado" en los detalles

    return (
                <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="py-4 grid gap-y-4 gap-x-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div className="grid gap-2">
                                <Label htmlFor="modeloId">Modelo</Label>
                                    <Select
                                        id="modeloId"
                                        instanceId="modeloId"
                                        options={modeloOptions}
                                        value={selectedModelValue}
                                        onChange={handleSelectChange}
                                        placeholder="Seleccionar modelo"
                                        isSearchable
                                        isLoading={isLoadingModelos}
                                        styles={reactSelectStyles}
                                    />
                                </div>
                                <div className="grid gap-2">
                                     <Label htmlFor="serial">Serial <span className="text-destructive">*</span></Label>
                                     <Input
                                        id="serial"
                                        value={formData.serial || ''}
                                        onChange={handleInputChange}
                                        placeholder="Serial del equipo"
                                     />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="ubicacionId">Ubicación</Label>
                                    <Select
                                        id="ubicacionId"
                                        instanceId="ubicacionId"
                                        options={ubicacionOptions}
                                        value={selectedUbicacionValue}
                                        onChange={handleUbicacionChange}
                                        placeholder="Seleccionar ubicación"
                                        isSearchable
                                        isLoading={isLoadingUbicaciones}
                                        styles={reactSelectStyles}
                                        isClearable
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="codigoImgc">Código IMGC <span className="text-destructive">*</span></Label>
                                    <Input id="codigoImgc" value={formData.codigoImgc || ''} onChange={handleInputChange} placeholder="Código IMGC" required={!isEditing}/>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="host">Host (Opcional)</Label>
                                    <Input id="host" value={formData.host || ''} onChange={handleInputChange} placeholder="Ej: linfante-dsk"/>
                                </div>
                            </div>
                            
                            {/* Sección Especificaciones Técnicas */}
                            <h3 className="text-lg font-medium mt-4 glow-text border-b pb-1">Especificaciones Técnicas</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                {/* ... Todos tus inputs para SO, Procesador, RAM, etc. van aquí, cableados igual que el de serial ... */}
                                <div className="grid gap-2">
                                    <Label htmlFor="sisOperativo">Sistema Operativo</Label>
                                    <Input id="sisOperativo" value={formData.sisOperativo || ''} onChange={handleInputChange} placeholder="Windows 10 Pro"/>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="procesador">Procesador</Label>
                                    <Input id="procesador" value={formData.procesador || ''} onChange={handleInputChange} placeholder="Intel Core i5-8250U"/>
                                </div>
                                 <div className="grid gap-2">
                                    <Label htmlFor="macWifi">Mac Wifi</Label>
                                    <Input id="macWifi" value={formData.macWifi || ''} onChange={handleInputChange} placeholder="Ej: A0:A1:A2:A3:B2"/>
                                </div>
                                 <div className="grid gap-2">
                                    <Label htmlFor="macEthernet">Mac de Ethernet</Label>
                                    <Input id="macEthernet" value={formData.macEthernet || ''} onChange={handleInputChange} placeholder="Ej: A0:A1:A2:A3:B2"/>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="arquitectura">Arquitectura</Label>
                                    <RadioGroup
                                        id="arquitectura"
                                        value={formData.arquitectura || ""}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, arquitectura: value as "" | "32" | "64" }))}
                                        className="flex gap-4"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="32" id="arquitectura-32" />
                                            <Label htmlFor="arquitectura-32">32 bits</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="64" id="arquitectura-64" />
                                            <Label htmlFor="arquitectura-64">64 bits</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="ram">Memoria RAM</Label>
                                    <Input id="ram" value={formData.ram || ''} onChange={handleInputChange} placeholder="Ej: 8GB DDR4"/>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="almacenamiento">Almacenamiento</Label>
                                    <Input id="almacenamiento" value={formData.almacenamiento || ''} onChange={handleInputChange} placeholder="Ej: 256GB SSD NVMe"/>
                                </div>
                            </div>
                            
                            {/* Sección Software */}
                            <h3 className="text-lg font-medium mt-4 glow-text border-b pb-1">Software</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="officeVersion">Versión de Office</Label>
                                    <Input id="officeVersion" value={formData.officeVersion || ''} onChange={handleInputChange} placeholder="Ej: Microsoft 365 Apps"/>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="anydesk">AnyDesk ID</Label>
                                    <Input id="anydesk" value={formData.anydesk || ''} onChange={handleInputChange} placeholder="Ej: 123 456 789"/>
                                </div>
                            </div>

                            {/* Nota informativa sobre el estado del equipo */}
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-blue-800 font-medium">
                                        ℹ️ Estado del Equipo
                                    </span>
                                </div>
                                <p className="text-sm text-blue-700 mt-1">
                                    El estado del equipo se gestiona desde la opción <strong>"Gestionar Estado"</strong> en la pantalla de detalles del equipo.
                                </p>
                            </div>



                        </div>

                        {/* Sección Información de Compra */}
                        <h3 className="text-lg font-medium mt-4 glow-text border-b pb-1">Información de Compra</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="fechaCompra">Fecha de Compra</Label>
                                <Input 
                                    id="fechaCompra" 
                                    type="date"
                                    value={formData.fechaCompra || ''} 
                                    onChange={handleInputChange} 
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="numeroFactura">Número de Factura</Label>
                                <Input 
                                    id="numeroFactura" 
                                    value={formData.numeroFactura || ''} 
                                    onChange={handleInputChange} 
                                    placeholder="Número de factura"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="proveedor">Proveedor</Label>
                                <Input 
                                    id="proveedor" 
                                    value={formData.proveedor || ''} 
                                    onChange={handleInputChange} 
                                    placeholder="A quién fue comprado"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="monto">Monto</Label>
                                <Input 
                                    id="monto" 
                                    type="number"
                                    step="0.01"
                                    value={formData.monto || ''} 
                                    onChange={handleInputChange} 
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                   <div className="flex justify-end gap-4 pt-6">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            {onCancel ? 'Cancelar' : <Link href="/computadores">Cancelar</Link>}
                        </Button>
                        <Button type="submit" className="cyber-button text-white font-semibold">
                            {isEditing ? 'GUARDAR CAMBIOS' : 'GUARDAR EQUIPO'}
                        </Button>
                    </div>
                </form>
    );
}

export default ComputadorForm;