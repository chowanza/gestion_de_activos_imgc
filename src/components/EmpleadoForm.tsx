'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { showToast } from "nextjs-toast-notify"; // Usando el componente de scroll de Shadcn
import Link from 'next/link';
import { reactSelectStyles } from '@/utils/reactSelectStyles';



interface Empresa {
    id: string;
    nombre: string;
}

interface Departamento {
    id: string;
    nombre: string;
    empresaId: string;
}

interface Cargo {
    id: string;
    nombre: string;
    descripcion: string;
}

export interface EmpleadoFormData {
    id?: string;
    empresaId: string;
    departamentoId: string;
    nombre: string;
    apellido: string;
    cedula: string;
    fechaNacimiento: string;
    fechaIngreso: string;
    cargoId: string;
}

interface EmpleadoFormProps {
    onSubmit: (data: EmpleadoFormData) => Promise<void>;
    initialData?: EmpleadoFormData | null;
    isEditing?: boolean; // Añadido para manejar el modo de edición
}

interface OptionType {
    value: string;
    label: string;
}

// Estado inicial limpio para el formulario de creación
const initialState: EmpleadoFormData = {
    empresaId: '',
    departamentoId: '',
    nombre: '',
    apellido: '',
    cedula: '',
    fechaNacimiento: '',
    fechaIngreso: '',
    cargoId: '',
};

const EmpleadoForm: React.FC<EmpleadoFormProps> = ({
    isEditing = false, // Por defecto es false
    onSubmit,
    initialData,
}) => {

    const [formData, setFormData] = useState<EmpleadoFormData>(initialState);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [isLoadingEmpresas, setIsLoadingEmpresas] = useState(false);
    const [isLoadingDepartamentos, setIsLoadingDepartamentos] = useState(false);
    const [isLoadingCargos, setIsLoadingCargos] = useState(false);

    // --- useEffect para cargar datos iniciales ---
    useEffect(() => {
        const fetchEmpresas = async () => {
            setIsLoadingEmpresas(true);
            try {
                const response = await fetch('/api/empresas');
                if (!response.ok) throw new Error('Error al cargar empresas');
                const data: Empresa[] = await response.json();
                setEmpresas(data);
            } catch (error) {
                showToast.error("¡Error en Cargar Empresas!", { position: "top-right" });
            } finally {
                setIsLoadingEmpresas(false);
            }
        };

        const fetchDepartamentos = async () => {
            setIsLoadingDepartamentos(true);
            try {
                const response = await fetch('/api/departamentos');
                if (!response.ok) throw new Error('Error al cargar departamentos');
                const data: Departamento[] = await response.json();
                setDepartamentos(data);
            } catch (error) {
                showToast.error("¡Error en Cargar Departamentos!", { position: "top-right" });
            } finally {
                setIsLoadingDepartamentos(false);
            }
        };

        const fetchCargos = async () => {
            setIsLoadingCargos(true);
            try {
                const response = await fetch('/api/cargos');
                if (!response.ok) throw new Error('Error al cargar cargos');
                const data: Cargo[] = await response.json();
                setCargos(data);
            } catch (error) {
                showToast.error("¡Error en Cargar Cargos!", { position: "top-right" });
            } finally {
                setIsLoadingCargos(false);
            }
        };

        fetchEmpresas();
        fetchDepartamentos();
        fetchCargos();
    }, []); // Solo ejecutar una vez al montar

    // --- useEffect para manejar initialData ---
    useEffect(() => {
        if (initialData) {
            console.log('Cargando initialData:', initialData);
            setFormData(initialData);
        }
    }, [initialData]);

    // --- Handlers para los cambios en los inputs ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        
        // Para campos de fecha, ajustar la zona horaria para evitar el problema del día anterior
        if (id === 'fechaNacimiento' || id === 'fechaIngreso') {
            if (value) {
                // Crear una fecha en la zona horaria local para evitar el offset de UTC
                const date = new Date(value + 'T00:00:00');
                const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
                const isoDate = localDate.toISOString().split('T')[0];
                
                setFormData(prev => ({
                    ...prev,
                    [id]: isoDate
                }));
                return;
            }
        }
        
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleEmpresaChange = (option: OptionType | null) => {
        const empresaId = option?.value ?? '';
        setFormData(prev => ({ 
            ...prev, 
            empresaId,
            departamentoId: '', // Reset departamento cuando cambia empresa
            cargoId: '' // Reset cargo cuando cambia empresa
        }));
    };

    const handleDepartamentoChange = (option: OptionType | null) => {
        setFormData(prev => ({ 
            ...prev, 
            departamentoId: option?.value ?? '',
            cargoId: '' // Reset cargo cuando cambia departamento
        }));
    };

    const handleCreateCargo = async (inputValue: string) => {
        if (!formData.departamentoId) {
            showToast.warning("Debe seleccionar un departamento antes de crear un cargo", { position: "top-right" });
            return;
        }

        try {
            const response = await fetch('/api/cargos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    nombre: inputValue, 
                    descripcion: '',
                    departamentoId: formData.departamentoId
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al crear cargo');
            }

            const newCargo = await response.json();
            setCargos(prev => [...prev, newCargo]);
            setFormData(prev => ({ ...prev, cargoId: newCargo.id }));
            showToast.success(`Cargo "${inputValue}" creado correctamente`, { position: "top-right" });
        } catch (error: any) {
            showToast.error(error.message || "Error al crear el cargo", { position: "top-right" });
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (!formData.empresaId || !formData.departamentoId || !formData.nombre || !formData.apellido || !formData.cedula || !formData.cargoId || !formData.fechaIngreso) {
            showToast.warning("Introduzca todos los campos obligatorios.", { position: "top-right" });
            return;
        }
        await onSubmit(formData);
    };
    
    // Preparar opciones para react-select
    const empresaOptions = empresas.map(empresa => ({ value: empresa.id, label: empresa.nombre }));
    const departamentoOptions = departamentos
        .filter(departamento => !formData.empresaId || departamento.empresaId === formData.empresaId)
        .map(departamento => ({ value: departamento.id, label: departamento.nombre }));
    const cargoOptions = cargos.map(cargo => ({ value: cargo.id, label: cargo.nombre }));
    
    const selectedEmpresaValue = empresaOptions.find(option => option.value === formData.empresaId) || null;
    const selectedDepartamentoValue = departamentoOptions.find(option => option.value === formData.departamentoId) || null;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fila 1: Empresa y Departamento */}
                <div className="grid gap-2">
                    <Label htmlFor="empresaId">Empresa <span className="text-destructive">*</span></Label>
                    <Select
                        id="empresaId"
                        value={selectedEmpresaValue}
                        onChange={handleEmpresaChange}
                        options={empresaOptions}
                        placeholder="Seleccionar empresa"
                        styles={reactSelectStyles}
                        isClearable
                        isLoading={isLoadingEmpresas}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="departamentoId">Departamento <span className="text-destructive">*</span></Label>
                    <Select
                        id="departamentoId"
                        options={departamentoOptions}
                        value={selectedDepartamentoValue}
                        onChange={handleDepartamentoChange}
                        placeholder="Seleccionar departamento"
                        isSearchable
                        isLoading={isLoadingDepartamentos}
                        styles={reactSelectStyles}
                        isDisabled={!formData.empresaId}
                    />
                </div>

                {/* Fila 2: Nombre y Apellido */}
                <div className="grid gap-2">
                    <Label htmlFor="nombre">Nombre <span className="text-destructive">*</span></Label>
                    <Input
                        id="nombre"
                        value={formData.nombre || ''}
                        onChange={handleInputChange}
                        placeholder="Nombre"
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="apellido">Apellido <span className="text-destructive">*</span></Label>
                    <Input
                        id="apellido"
                        value={formData.apellido || ''}
                        onChange={handleInputChange}
                        placeholder="Apellido"
                        required
                    />
                </div>

                {/* Fila 3: Cargo y Cédula */}
                <div className="grid gap-2">
                    <Label htmlFor="cargoId">Cargo <span className="text-destructive">*</span></Label>
                    <CreatableSelect
                        value={cargoOptions.find(option => option.value === formData.cargoId) || null}
                        onChange={(option) => setFormData(prev => ({ ...prev, cargoId: option?.value ?? '' }))}
                        onCreateOption={handleCreateCargo}
                        options={cargoOptions}
                        placeholder="Seleccionar o crear cargo"
                        styles={reactSelectStyles}
                        isClearable
                        isLoading={isLoadingCargos}
                        isDisabled={!formData.departamentoId}
                        formatCreateLabel={(inputValue) => `Crear cargo: "${inputValue}"`}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="cedula">Cédula <span className="text-destructive">*</span></Label>
                    <Input 
                        id="cedula" 
                        value={formData.cedula || ''} 
                        onChange={handleInputChange} 
                        placeholder="Ej: V-28031705"
                        required
                    />
                </div>

                {/* Fila 4: Fecha de Nacimiento y Fecha de Ingreso */}
                <div className="grid gap-2">
                    <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                    <Input 
                        id="fechaNacimiento" 
                        type="date" 
                        value={formData.fechaNacimiento || ''} 
                        onChange={handleInputChange} 
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="fechaIngreso">Fecha de Ingreso <span className="text-destructive">*</span></Label>
                    <Input 
                        id="fechaIngreso" 
                        type="date" 
                        value={formData.fechaIngreso || ''} 
                        onChange={handleInputChange}
                        required
                    />
                </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-4 pt-6">
                <Button type="button" variant="outline" asChild>
                    <Link href="/empleados">Cancelar</Link>
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                    {isEditing ? 'GUARDAR CAMBIOS' : 'GUARDAR EMPLEADO'}
                </Button>
            </div>
        </form>
    );
}

export default EmpleadoForm;
