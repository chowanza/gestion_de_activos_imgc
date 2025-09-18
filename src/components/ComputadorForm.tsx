'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
}

interface ComputadorFormProps {
    onSubmit: (data: ComputadorFormData) => Promise<void>;
    initialData?: ComputadorFormData | null;
    isEditing?: boolean; // Añadido para manejar el modo de edición
}

interface OptionType {
    value: string;
    label: string;
}


// Estado inicial limpio para el formulario de creación
const initialState: ComputadorFormData = {
    modeloId: '',
    serial: '',
    estado: '',
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
}) => {

    const [formData, setFormData] = useState<ComputadorFormData>(initialState);
    const [modelos, setModelos] = useState<Modelo[]>([]);
    const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
    const [isLoadingModelos, setIsLoadingModelos] = useState(false);
    const [isLoadingUbicaciones, setIsLoadingUbicaciones] = useState(false);

    // --- useEffect CORREGIDO para manejar el estado del formulario ---
        useEffect(() => {
            const fetchModelos = async () => {
                setIsLoadingModelos(true);
                try {
                    const response = await fetch('/api/modelos');
                    if (!response.ok) throw new Error('Error al cargar modelos');
                    const data: Modelo[] = await response.json();
                    setModelos(data);
                } catch (error) {
                    showToast.error("¡Error en Cargar Modelos!", { position: "top-right" });
                } finally {
                    setIsLoadingModelos(false);
                }
            };

            const fetchUbicaciones = async () => {
                setIsLoadingUbicaciones(true);
                try {
                    const response = await fetch('/api/ubicaciones');
                    if (!response.ok) throw new Error('Error al cargar ubicaciones');
                    const data: Ubicacion[] = await response.json();
                    setUbicaciones(data);
                } catch (error) {
                    showToast.error("¡Error en Cargar Ubicaciones!", { position: "top-right" });
                } finally {
                    setIsLoadingUbicaciones(false);
                }
            };

            fetchModelos();
            fetchUbicaciones();
    
           if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]); // Dependencias correctas

    // --- Handlers para los cambios en los inputs ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleSelectChange = (option: OptionType | null) => {
        setFormData(prev => ({ ...prev, modeloId: option?.value ?? '' }));
    };

    const handleUbicacionChange = (option: OptionType | null) => {
        setFormData(prev => ({ ...prev, ubicacionId: option?.value ?? '' }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!formData.modeloId || !formData.serial || !formData.estado || !formData.codigoImgc) {
            showToast.warning("Modelo, Serial, Estado y Código IMGC son obligatorios.", { position: "top-right" });
            return;
        }
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

    return (
                <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="py-4 grid gap-y-4 gap-x-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div className="grid gap-2">
                                <Label htmlFor="modeloId">Modelo</Label>
                                    <Select
                                        id="modeloId"
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
                                    <Input id="codigoImgc" value={formData.codigoImgc || ''} onChange={handleInputChange} placeholder="Código IMGC" required/>
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

                            {/* Sección Estado */}
                            <h3 className="text-lg font-medium mt-4 glow-text border-b pb-1">Estado del Equipo</h3>
                            <div className="grid grid-cols-1">
                                <div className="grid gap-2">
                                    <Label htmlFor="estado">Estado <span className="text-destructive">*</span></Label>
                                    <select
                                        id="estado"
                                        className="w-full h-10 border rounded-md px-2 bg-[hsl(var(--background))] border-[hsl(var(--input))] focus:ring-1 focus:ring-[hsl(var(--ring))] focus:outline-none"
                                        value={formData.estado || ''}
                                        onChange={handleInputChange}
                                    >
                                        <option value="" disabled>Seleccionar estado...</option>
                                        <option value="Resguardo">Resguardo</option>
                                        <option value="Asignado">Asignado</option>
                                        <option value="Operativo">Operativo</option>
                                        <option value="De Baja">De Baja</option>
                                        <option value="En Reparación">En Reparación</option>
                                    </select>
                                </div>
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
                        <Button type="button" variant="outline" asChild>
                            <Link href="/computadores">Cancelar</Link>
                        </Button>
                        <Button type="submit" className="cyber-button text-white font-semibold">
                            {isEditing ? 'GUARDAR CAMBIOS' : 'GUARDAR EQUIPO'}
                        </Button>
                    </div>
                </form>
    );
}

export default ComputadorForm;