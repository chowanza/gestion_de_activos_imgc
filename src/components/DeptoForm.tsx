'use client'

import { useState, useEffect, useMemo, FormEvent } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose, // Asegúrate de tener DialogClose si quieres un botón Cancelar explícito
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import CreatableSelect from 'react-select/creatable';
import { reactSelectStyles } from '@/utils/reactSelectStyles';
import { showToast } from 'nextjs-toast-notify'; // Asumo que es la librería que usas (antes sonner)
// Eliminamos los imports de Avatar, ImageIcon y ShadcnSelect ya que no se usarán para imagen o tipo aquí.

// Interfaces
interface Empresa {
    id: string;
    nombre: string;
}

interface OptionType {
    value: string;
    label: string;
    __isNew__?: boolean; // Para CreatableSelect
}


import { DepartamentoFormData } from './depto-table';

interface Empleado {
    id: string;
    nombre: string;
    apellido: string;
}

interface DepartamentoFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: FormData) => void;
    empresas: Empresa[];
    empleados?: Empleado[];
    initialData?: DepartamentoFormData & { empresaId?: string } | null;
}

const DepartamentoForm: React.FC<DepartamentoFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    empresas = [],
    empleados = [],
    initialData,
}) => {
    const [nombre, setNombre] = useState('');
    const [selectedEmpresa, setSelectedEmpresa] = useState<OptionType | null>(null);
    const [allEmpresas, setAllEmpresas] = useState<Empresa[]>(empresas);
    const [isLoadingEmpresas, setIsLoadingEmpresas] = useState(false);
    const [isCreatingEmpresa, setIsCreatingEmpresa] = useState(false);

    // Estabilizar las referencias de los arrays para evitar re-renders infinitos
    const stableEmpresas = useMemo(() => empresas, [empresas.length, empresas.map(e => e.id).join(',')]);

    const isEditing = !!initialData  // Es edición si initialData tiene un ID

    useEffect(() => {
        setAllEmpresas(stableEmpresas);
    }, [stableEmpresas]);

    useEffect(() => {
        if (isOpen) {
            if (isEditing && initialData) {
                setNombre(initialData.nombre || '');

                // Preseleccionar la empresa - esperar a que allEmpresas esté cargado
                if (initialData.empresaId && allEmpresas.length > 0) {
                    const empresaActual = allEmpresas.find(e => e.id === initialData.empresaId);
                    if (empresaActual) {
                        setSelectedEmpresa({ value: empresaActual.id, label: empresaActual.nombre });
                    } else {
                        setSelectedEmpresa(null);
                    }
                } else if (initialData.empresaId && allEmpresas.length === 0) {
                    // Si aún no se han cargado las empresas, mantener null temporalmente
                    setSelectedEmpresa(null);
                } else {
                    setSelectedEmpresa(null);
                }

            } else {
                // Resetear para creación
                setNombre('');
                setSelectedEmpresa(null);
            }
        }
    }, [isOpen, initialData, isEditing, allEmpresas]);

    // Efecto adicional para prellenar cuando los datos estén completamente cargados
    useEffect(() => {
    if (isOpen && isEditing && initialData && allEmpresas.length > 0) {
            // Preseleccionar la empresa si no está ya seleccionada
            if (initialData.empresaId && !selectedEmpresa) {
                const empresaActual = allEmpresas.find(e => e.id === initialData.empresaId);
                if (empresaActual) {
                    setSelectedEmpresa({ value: empresaActual.id, label: empresaActual.nombre });
                }
            }
        }
    }, [isOpen, isEditing, initialData, allEmpresas, selectedEmpresa]);

    const handleCreateEmpresa = async (inputValue: string) => {
            setIsCreatingEmpresa(true);
            // Create a temporary option for the user to see
            const newEmpresaOption: OptionType = {
                value: inputValue, // For a new brand, value and label can be the same initially
                label: inputValue,
                __isNew__: true, // Flag it as a new brand
            };
            setSelectedEmpresa(newEmpresaOption);
            setIsCreatingEmpresa(false); // This is a quick operation, no need for long loading
            showToast.success(`Empresa"${inputValue}" lista para ser creada.`, { position: "top-right" });
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        if (!nombre.trim() || !selectedEmpresa) {
            showToast.warning("El nombre y la empresa son requeridos.", { position: "top-right" });
            return;
        }

        const formDataToSubmit = new FormData();
        formDataToSubmit.append('nombre', nombre.trim());

        if (selectedEmpresa.__isNew__) {
            // If it's a new empresa, send the name for the backend to create
            formDataToSubmit.append('empresaNombre', selectedEmpresa.label);
        } else {
            // If it's an existing empresa, send its ID
            formDataToSubmit.append('empresaId', selectedEmpresa.value);
        }

        // Removido: envío de gerenteId

        onSubmit(formDataToSubmit);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(openValue) => {
            if (!openValue) onClose();
        }}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Departamento" : "Crear Nuevo Departamento"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Modifique los detalles del Departamento aquí." : "Complete los detalles para el nuevo departamento."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-6 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="nombre" className="text-right">Nombre *</Label>
                        <Input 
                            id="nombre" 
                            value={nombre} 
                            onChange={(e) => setNombre(e.target.value)} 
                            className="col-span-3" 
                            placeholder="Nombre del Departamento"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="empresa-select" className="text-right">Empresa *</Label>
                        <div className="col-span-3">
                        <CreatableSelect
                            inputId="empresa-select"
                            className="w-full"
                            options={allEmpresas.map(e => ({ value: e.id, label: e.nombre }))}
                            value={selectedEmpresa}
                            onChange={opt => setSelectedEmpresa(opt as OptionType | null)}
                            onCreateOption={handleCreateEmpresa}
                            placeholder="Seleccionar o crear Empresa"
                            isClearable
                            isLoading={isLoadingEmpresas}
                            formatCreateLabel={val => `Crear "${val}"`}
                            styles={reactSelectStyles}
                        />
                        </div>
                    </div>
                    {/* Removido: campo Gerente */}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">{isEditing ? "Guardar Cambios" : "Crear Departamento"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default DepartamentoForm;