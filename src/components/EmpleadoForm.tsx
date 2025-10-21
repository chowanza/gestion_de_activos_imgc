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
    empresaDepartamentos?: Array<{
        empresa: {
            id: string;
            nombre: string;
        };
    }>;
}

interface Cargo {
    id: string;
    nombre: string;
    descripcion: string;
    departamentoCargos?: Array<{
        departamentoId: string;
    }>;
}

export interface EmpleadoFormData {
    id?: string;
    empresaId: string;
    departamentoId: string;
    nombre: string;
    apellido: string;
    cedula: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    fechaNacimiento: string;
    fechaIngreso: string;
    fechaDesincorporacion?: string;
    fotoPerfil?: string | File | null;
    cargoId: string;
}

interface EmpleadoFormProps {
    onSubmit: (data: EmpleadoFormData) => Promise<void>;
    initialData?: EmpleadoFormData | null;
    isEditing?: boolean; // Añadido para manejar el modo de edición
    isEmpleadoDesactivado?: boolean; // Indica si el empleado está desactivado
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
    email: '',
    telefono: '',
    direccion: '',
    fechaNacimiento: '',
    fechaIngreso: '',
    fechaDesincorporacion: '',
    fotoPerfil: '',
    cargoId: '',
};

const EmpleadoForm: React.FC<EmpleadoFormProps> = ({
    isEditing = false, // Por defecto es false
    onSubmit,
    initialData,
    isEmpleadoDesactivado = false, // Por defecto es false
}) => {

    // formData holds string fields; fotoPerfilFile holds the selected File when present
    const [formData, setFormData] = useState<EmpleadoFormData>(initialState);
    const [fotoPerfilFile, setFotoPerfilFile] = useState<File | null>(null);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [isLoadingEmpresas, setIsLoadingEmpresas] = useState(false);
    const [isLoadingDepartamentos, setIsLoadingDepartamentos] = useState(false);
    const [isLoadingCargos, setIsLoadingCargos] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

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
            // Only set previewImage when fotoPerfil is a string (URL). If it's a File, we keep previewImage null
            if (initialData.fotoPerfil && typeof initialData.fotoPerfil === 'string') {
                setPreviewImage(initialData.fotoPerfil);
            }
        }
    }, [initialData]);

    // --- Handlers para los cambios en los inputs ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        
        // Para campos de fecha, usar el valor directamente sin conversión de zona horaria
        if (id === 'fechaNacimiento' || id === 'fechaIngreso' || id === 'fechaDesincorporacion') {
            setFormData(prev => ({
                ...prev,
                [id]: value
            }));
            return;
        }
        
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    // Handler para manejar la carga de imágenes
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar que sea una imagen
            if (!file.type.startsWith('image/')) {
                showToast.error("Por favor seleccione un archivo de imagen válido.", { position: "top-right" });
                return;
            }
            
            // Validar tamaño (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showToast.error("La imagen debe ser menor a 5MB.", { position: "top-right" });
                return;
            }
            
            // Crear preview
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setPreviewImage(result);
            };
            reader.readAsDataURL(file);
            setFotoPerfilFile(file);
            // Do not set formData.fotoPerfil to the data URL; we will upload the File itself on submit
        }
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

    // Recargar cargos cuando cambia el departamento
    useEffect(() => {
        const fetchCargosByDepartamento = async () => {
            if (!formData.departamentoId) {
                return;
            }

            setIsLoadingCargos(true);
            try {
                const response = await fetch(`/api/cargos?departamentoId=${formData.departamentoId}`);
                if (!response.ok) throw new Error('Error al cargar cargos');
                const data: Cargo[] = await response.json();
                setCargos(data);
            } catch (error) {
                showToast.error("¡Error en Cargar Cargos!", { position: "top-right" });
            } finally {
                setIsLoadingCargos(false);
            }
        };

        fetchCargosByDepartamento();
    }, [formData.departamentoId]);

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
        
        if (!formData.empresaId || !formData.departamentoId || !formData.nombre || !formData.apellido) {
            showToast.warning("Introduzca todos los campos obligatorios.", { position: "top-right" });
            return;
        }
            // Ensure fotoPerfil is a valid type: File | string | null | undefined
            let fotoValor: string | File | null | undefined = fotoPerfilFile ?? formData.fotoPerfil;
            if (fotoValor && typeof fotoValor !== 'string' && !(fotoValor instanceof File)) {
                // Avoid sending objects like {} which break server validation
                fotoValor = undefined;
            }

            const submitData: EmpleadoFormData = {
                ...formData,
                fotoPerfil: fotoValor as any,
            };

            await onSubmit(submitData);
    };
    
    // Preparar opciones para react-select
    const empresaOptions = empresas.map(empresa => ({ value: empresa.id, label: empresa.nombre }));
    const departamentoOptions = departamentos
        .filter(departamento => !formData.empresaId || departamento.empresaDepartamentos?.some(ed => ed.empresa.id === formData.empresaId))
        .map(departamento => ({ value: departamento.id, label: departamento.nombre }));
    const cargoOptions = cargos
        .filter(cargo =>
            !formData.departamentoId ||
            (Array.isArray(cargo.departamentoCargos) && cargo.departamentoCargos.some(dc => dc.departamentoId === formData.departamentoId))
        )
        .map(cargo => ({ value: cargo.id, label: cargo.nombre }));
    
    const selectedEmpresaValue = empresaOptions.find(option => option.value === formData.empresaId) || null;
    const selectedDepartamentoValue = departamentoOptions.find(option => option.value === formData.departamentoId) || null;

    // Compute a safe image src for the preview: prefer the data-url previewImage, otherwise use the stored string URL
    const imageSrc: string | undefined = previewImage ?? (typeof formData.fotoPerfil === 'string' ? formData.fotoPerfil : undefined);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fila 1: Empresa y Departamento */}
                <div className="grid gap-2">
                    <Label htmlFor="empresaId">Empresa <span className="text-destructive">*</span></Label>
                    <Select
                        id="empresaId"
                        instanceId="empleado-empresaId"
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
                        instanceId="empleado-departamentoId"
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
                    <Label htmlFor="cargoId">Cargo</Label>
                    <CreatableSelect
                        instanceId="empleado-cargoId"
                        value={cargoOptions.find(option => option.value === formData.cargoId) || null}
                        onChange={(option) => setFormData(prev => ({ ...prev, cargoId: option?.value ?? '' }))}
                        onCreateOption={handleCreateCargo}
                        options={cargoOptions}
                        placeholder={!formData.departamentoId ? "Primero seleccione un departamento" : "Seleccionar o crear cargo"}
                        styles={reactSelectStyles}
                        isClearable
                        isLoading={isLoadingCargos}
                        isDisabled={!formData.departamentoId}
                        formatCreateLabel={(inputValue) => `Crear cargo: "${inputValue}"`}
                        noOptionsMessage={() => !formData.departamentoId ? "Seleccione un departamento primero" : "No hay cargos disponibles"}
                    />
                    {!formData.departamentoId && (
                        <p className="text-sm text-muted-foreground">
                            Seleccione un departamento para habilitar la selección de cargos
                        </p>
                    )}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="cedula">Cédula</Label>
                    <Input 
                        id="cedula" 
                        value={formData.cedula || ''} 
                        onChange={handleInputChange} 
                        placeholder="Ej: V-28031705"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                        id="email" 
                        type="email"
                        value={formData.email || ''} 
                        onChange={handleInputChange} 
                        placeholder="Ej: empleado@empresa.com"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input 
                        id="telefono" 
                        type="tel"
                        value={formData.telefono || ''} 
                        onChange={handleInputChange} 
                        placeholder="Ej: +58 424-1234567"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input 
                        id="direccion" 
                        value={formData.direccion || ''} 
                        onChange={handleInputChange} 
                        placeholder="Ej: Av. Principal, Edificio ABC, Piso 2"
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
                    <Label htmlFor="fechaIngreso">Fecha de Ingreso</Label>
                    <Input 
                        id="fechaIngreso" 
                        type="date" 
                        value={formData.fechaIngreso || ''} 
                        onChange={handleInputChange}
                    />
                </div>
                {isEmpleadoDesactivado && (
                    <div className="grid gap-2">
                        <Label htmlFor="fechaDesincorporacion">Fecha de Desincorporación</Label>
                        <Input 
                            id="fechaDesincorporacion" 
                            type="date" 
                            value={formData.fechaDesincorporacion || ''} 
                            onChange={handleInputChange}
                        />
                    </div>
                )}
            </div>

            {/* Campo de Foto de Perfil */}
            <div className="grid gap-2">
                <Label htmlFor="fotoPerfil">Foto de Perfil</Label>
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 flex items-center justify-center bg-gray-50">
                        {imageSrc ? (
                            <img 
                                src={imageSrc} 
                                alt="Preview" 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-gray-400 text-sm text-center">
                                Sin foto
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <Input 
                            id="fotoPerfil" 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageChange}
                            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Formatos soportados: JPG, PNG, GIF. Tamaño máximo: 5MB
                        </p>
                    </div>
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
