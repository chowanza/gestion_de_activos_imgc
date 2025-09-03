'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Select from 'react-select'; // Usando react-select para modelos
import { showToast } from "nextjs-toast-notify"; // Usando el componente de scroll de Shadcn
import Link from 'next/link';
import { reactSelectStyles } from '@/utils/reactSelectStyles';



interface Departamento {
    id: string;
    nombre: string;
}

export interface UsuarioFormData {
    id?: string;
    departamentoId: string;
    nombre: string;
    apellido: string;
    ced: string;
    legajo: number;
    cargo: string;
    
}

interface UsuarioFormProps {
    onSubmit: (data: UsuarioFormData) => Promise<void>;
    initialData?: UsuarioFormData | null;
    isEditing?: boolean; // Añadido para manejar el modo de edición
}

interface OptionType {
    value: string;
    label: string;
}

// Estado inicial limpio para el formulario de creación
const initialState: UsuarioFormData = {
    departamentoId: '',
    nombre: '',
    apellido: '',
    legajo: 0,
    ced: '',
    cargo: '',
};

const UsuarioForm: React.FC<UsuarioFormProps> = ({
    isEditing = false, // Por defecto es false
    onSubmit,
    initialData,
}) => {

    const [formData, setFormData] = useState<UsuarioFormData>(initialState);
    const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
    const [isLoadingDepartamentos, setIsLoadingDepartamentos] = useState(false);

    // --- useEffect CORREGIDO para manejar el estado del formulario ---
        useEffect(() => {
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
            fetchDepartamentos();
    
           if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]); // Dependencias correctas

    // --- Handlers para los cambios en los inputs ---
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
        ...prev,
        [id]: id === 'legajo' ? Number(value) : value
    }));
};

    const handleSelectChange = (option: OptionType | null) => {
        setFormData(prev => ({ ...prev, departamentoId: option?.value ?? '' }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!formData.departamentoId || !formData.nombre || !formData.apellido || !formData.legajo) {
            showToast.warning("Introduzca los campos obligatorios.", { position: "top-right" });
            return;
        }
        await onSubmit(formData); // Llama a la función del padre para manejar la lógica de API
    };
    
    // Preparar opciones para react-select
    const departamentoOptions = departamentos.map(departamento => ({ value: departamento.id, label: departamento.nombre }));
    const selectedDepartamentoValue = departamentoOptions.find(option => option.value === formData.departamentoId) || null;

    return (
                <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="py-4 grid gap-y-4 gap-x-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div className="grid gap-2">
                                <Label htmlFor="departamentoId">Departamento</Label>
                                    <Select
                                        id="departamentoId"
                                        options={departamentoOptions}
                                        value={selectedDepartamentoValue}
                                        onChange={handleSelectChange}
                                        placeholder="Seleccionar departamento"
                                        isSearchable
                                        isLoading={isLoadingDepartamentos}
                                        styles={reactSelectStyles}
                                    />
                                </div>
                                 <div className="grid gap-2">
                                     <Label htmlFor="nombre">Nombre <span className="text-destructive">*</span></Label>
                                     <Input
                                        id="nombre"
                                        value={formData.nombre || ''}
                                        onChange={handleInputChange}
                                        placeholder="Nombre"
                                     />
                                </div>
                                <div className="grid gap-2">
                                     <Label htmlFor="apellido">Apellido <span className="text-destructive">*</span></Label>
                                     <Input
                                        id="apellido"
                                        value={formData.apellido || ''}
                                        onChange={handleInputChange}
                                        placeholder="Apellido"
                                     />
                                <div className="grid gap-2">
                                     <Label htmlFor="legajo">Legajo <span className="text-destructive">*</span></Label>
                                     <Input
                                        id="legajo"
                                        value={formData.legajo || 0}
                                        onChange={handleInputChange}
                                        placeholder="Legajo"
                                        type='number'
                                     />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="cargo">Cargo</Label>
                                    <Input id="cargo" value={formData.cargo || ''} onChange={handleInputChange} placeholder="Ej: Gerente de Operaciones"/>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="ced">Cédula</Label>
                                    <Input id="ced" value={formData.ced || ''} onChange={handleInputChange} placeholder="Ej: V-28031705"/>
                                </div>
                            </div>
                            </div>
                        </div>
                   <div className="flex justify-end gap-4 pt-6">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/computadores">Cancelar</Link>
                        </Button>
                        <Button type="submit" className="cyber-button text-black font-semibold">
                            {isEditing ? 'GUARDAR CAMBIOS' : 'GUARDAR USUARIO'}
                        </Button>
                    </div>
                </form>
    );
}

export default UsuarioForm;
