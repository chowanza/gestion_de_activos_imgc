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
    
    // Estados para la lógica de asignación
    const [asignarA, setAsignarA] = useState<'Usuario' | 'Departamento'>('Usuario');
    const [selectedTarget, setSelectedTarget] = useState<any>(null);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
    const [motivo, setMotivo] = useState('');
    const [notas, setNotas] = useState('');
    const [selectedGerente, setSelectedGerente] = useState<any>(null);
    const [selectedUbicacionAsignacion, setSelectedUbicacionAsignacion] = useState<any>(null);

    // --- useEffect CORREGIDO para manejar el estado del formulario ---
        useEffect(() => {
            const fetchData = async () => {
                setIsLoadingModelos(true);
                setIsLoadingUbicaciones(true);
                try {
                    const [modelosRes, ubicacionesRes, usuariosRes, departamentosRes] = await Promise.all([
                        fetch('/api/modelos'),
                        fetch('/api/ubicaciones'),
                        fetch('/api/usuarios'),
                        fetch('/api/departamentos')
                    ]);

                    const [modelosData, ubicacionesData, usuariosData, departamentosData] = await Promise.all([
                        modelosRes.json(),
                        ubicacionesRes.json(),
                        usuariosRes.json(),
                        departamentosRes.json()
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
                        empresa: user.departamento?.empresa?.nombre || 'N/A'
                    }));

                    // Procesar departamentos
                    const departamentosFormatted = departamentosData.map((dept: any) => ({
                        value: dept.id,
                        label: dept.nombre,
                        empresa: dept.empresa?.nombre || 'N/A'
                    }));

                    setUsuarios(usuariosFormatted);
                    setDepartamentos(departamentosFormatted);
                } catch (error) {
                    showToast.error("¡Error en Cargar Datos!", { position: "top-right" });
                } finally {
                    setIsLoadingModelos(false);
                    setIsLoadingUbicaciones(false);
                }
            };

            fetchData();
    
           if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]); // Dependencias correctas

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
        if (!formData.modeloId || !formData.serial || !formData.estado || !formData.codigoImgc) {
            showToast.warning("Modelo, Serial, Estado y Código IMGC son obligatorios.", { position: "top-right" });
            return;
        }

        // Validaciones adicionales según el estado
        if (formData.estado === 'Asignado' && !selectedTarget) {
            showToast.error('Debe seleccionar un usuario o departamento para asignar');
            return;
        }

        if (formData.estado === 'Mantenimiento' && !motivo.trim()) {
            showToast.error('Debe especificar el motivo del mantenimiento');
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
                                        <option value="En resguardo">En resguardo (Guardado, no operativo)</option>
                                        <option value="Operativo">Operativo (Disponible para uso)</option>
                                        <option value="Asignado">Asignado (Vinculado a empleado)</option>
                                        <option value="Mantenimiento">Mantenimiento (En reparación)</option>
                                        <option value="De baja">De baja (Dañado, en sistema)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Debug: Mostrar el estado actual */}
                            <div className="text-xs text-gray-500 p-2 bg-yellow-100 border rounded mt-2">
                                Estado actual: "{formData.estado || 'vacío'}" | ¿Es Asignado?: {formData.estado === 'Asignado' ? 'SÍ' : 'NO'}
                            </div>

                            {/* Campos de Asignación - Solo se muestran si el estado es "Asignado" */}
                            {formData.estado === 'Asignado' && (
                                <div className="grid gap-4 p-4 border rounded-lg bg-gray-50 mt-4">
                                    <h4 className="text-sm font-medium text-gray-700">Información de Asignación</h4>
                                    
                                    {/* Selector de tipo de asignación */}
                                    <div className="grid gap-2">
                                        <Label>Asignar a:</Label>
                                        <RadioGroup value={asignarA} onValueChange={(value) => setAsignarA(value as 'Usuario' | 'Departamento')}>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="Usuario" id="usuario" />
                                                <Label htmlFor="usuario">Usuario</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="Departamento" id="departamento" />
                                                <Label htmlFor="departamento">Departamento</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    {/* Selector de usuario o departamento */}
                                    <div className="grid gap-2">
                                        <Label>{asignarA === 'Usuario' ? 'Usuario' : 'Departamento'}</Label>
                                        <Select
                                            options={asignarA === 'Usuario' ? usuarios : departamentos}
                                            value={selectedTarget}
                                            onChange={setSelectedTarget}
                                            placeholder={`Seleccionar ${asignarA.toLowerCase()}`}
                                            isSearchable
                                            styles={reactSelectStyles}
                                            formatOptionLabel={(option: any) => (
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{option.label}</span>
                                                    <span className="text-sm text-gray-500">
                                                        {asignarA === 'Usuario' ? `${option.cargo} - ${option.departamento}` : option.empresa}
                                                    </span>
                                                </div>
                                            )}
                                        />
                                    </div>

                                    {/* Gerente responsable */}
                                    <div className="grid gap-2">
                                        <Label>Gerente Responsable</Label>
                                        <Select
                                            options={usuarios}
                                            value={selectedGerente}
                                            onChange={setSelectedGerente}
                                            placeholder="Seleccionar gerente"
                                            isSearchable
                                            isClearable
                                            styles={reactSelectStyles}
                                        />
                                    </div>

                                    {/* Ubicación de Asignación */}
                                    <div className="grid gap-2">
                                        <Label>Ubicación de Asignación</Label>
                                        <Select
                                            options={ubicacionOptions}
                                            value={selectedUbicacionAsignacion}
                                            onChange={setSelectedUbicacionAsignacion}
                                            placeholder="Seleccionar ubicación específica"
                                            isSearchable
                                            isClearable
                                            styles={reactSelectStyles}
                                        />
                                    </div>

                                    {/* Notas */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="notas">Notas</Label>
                                        <Input 
                                            id="notas" 
                                            value={notas} 
                                            onChange={(e) => setNotas(e.target.value)}
                                            placeholder="Notas adicionales"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Campo de motivo para mantenimiento */}
                            {formData.estado === 'Mantenimiento' && (
                                <div className="grid gap-2 mt-4">
                                    <Label htmlFor="motivo">Motivo del Mantenimiento <span className="text-destructive">*</span></Label>
                                    <Input 
                                        id="motivo" 
                                        value={motivo} 
                                        onChange={(e) => setMotivo(e.target.value)}
                                        placeholder="Especificar motivo del mantenimiento"
                                        required
                                    />
                                </div>
                            )}
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