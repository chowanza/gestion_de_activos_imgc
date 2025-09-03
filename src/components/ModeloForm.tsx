'use client';

import { useState, useEffect, FormEvent } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';



import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import CreatableSelect from 'react-select/creatable';
import { ImageIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { showToast } from 'nextjs-toast-notify';
import {
    Select as ShadcnSelect,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ModeloFormData } from './modelos-table';
import { reactSelectStyles } from '@/utils/reactSelectStyles';

// Interfaces
interface Marca {
    id: string;
    nombre: string;
}

interface OptionType {
    value: string;
    label:string;
    __isNew__?: boolean; // Flag for newly created options
}

interface ModeloFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: FormData) => void;
    marcas: Marca[];
    initialData?: ModeloFormData | null;
}


const ModeloForm: React.FC<ModeloFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    marcas = [], // Default to empty array to prevent .map error
    initialData,
}) => {
    // State management
    const [nombre, setNombre] = useState('');
    const [selectedMarca, setSelectedMarca] = useState<OptionType | null>(null);
    const [selectedTipo, setSelectedTipo] = useState<string>('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
    const [isCreatingMarca, setIsCreatingMarca] = useState(false);

    const isEditing = !!initialData;

    // Effect to populate form for editing or reset for creation
    useEffect(() => {
        if (isOpen) {
            if (isEditing && initialData) {
                setNombre(initialData.nombre || '');
                const marcaInicial = marcas.find(m => m.id === initialData.marca);
                setSelectedMarca(marcaInicial ? { value: marcaInicial.id, label: marcaInicial.nombre } : null);
                setSelectedTipo(initialData.tipo || '');
                setSelectedImagePreview(initialData.img || null);
                setSelectedImage(null);
            } else {
                // Reset form for creation
                setNombre('');
                setSelectedMarca(null);
                setSelectedTipo('');
                setSelectedImage(null);
                setSelectedImagePreview(null);
            }
        }
    }, [isOpen, initialData, isEditing, marcas]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);
            setSelectedImagePreview(URL.createObjectURL(file));
        } else {
            setSelectedImage(null);
            setSelectedImagePreview(null);
        }
    };

    // --- FIX 1: Handler for creating a new brand on the client-side ---
    const handleCreateMarca = (inputValue: string) => {
        setIsCreatingMarca(true);
        // Create a temporary option for the user to see
        const newMarcaOption: OptionType = {
            value: inputValue, // For a new brand, value and label can be the same initially
            label: inputValue,
            __isNew__: true, // Flag it as a new brand
        };
        setSelectedMarca(newMarcaOption);
        setIsCreatingMarca(false); // This is a quick operation, no need for long loading
        showToast.success(`Marca "${inputValue}" lista para ser creada.`, { position: "top-right" });
    };

    // --- FIX 2: Correctly prepare FormData in handleSubmit ---
    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        if (!selectedMarca || !selectedTipo || !nombre.trim()) {
            showToast.warning("Por favor complete Marca, Nombre, y Tipo.", { position: "top-right" });
            return;
        }

        const formDataToSubmit = new FormData();
        formDataToSubmit.append('nombre', nombre.trim());
        formDataToSubmit.append('tipo', selectedTipo);

        // This is the crucial logic change
        if (selectedMarca.__isNew__) {
            // If it's a new brand, send the name for the backend to create
            formDataToSubmit.append('marcaNombre', selectedMarca.label);
        } else {
            // If it's an existing brand, send its ID
            formDataToSubmit.append('marcaId', selectedMarca.value);
        }

        if (selectedImage) {
            console.log('ESTA ES LA IMG:', selectedImage); // Debugging line to check if image is being set
            formDataToSubmit.append('img', selectedImage);
        }
        console.log("imagen desde front:" ,formDataToSubmit.get('img')); // Debugging line to check if image is being added
        onSubmit(formDataToSubmit);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(openValue) => !openValue && onClose()}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Modelo" : "Crear Nuevo Modelo"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Modifique los detalles del modelo aquí." : "Complete los detalles para el nuevo modelo."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* --- FIX 3: Add onCreateOption prop to CreatableSelect --- */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="marca-select" className="text-right">Marca</Label>
                            <CreatableSelect
                                inputId="marca-select"
                                className="col-span-3"
                                isClearable
                                isLoading={isCreatingMarca}
                                placeholder="Seleccione o cree una marca"
                                options={marcas.map(m => ({ value: m.id, label: m.nombre }))}
                                value={selectedMarca}
                                onChange={(option) => setSelectedMarca(option as OptionType)}
                                onCreateOption={handleCreateMarca}
                                formatCreateLabel={(inputValue) => `Crear "${inputValue}"`}
                                styles={reactSelectStyles}
                            />
                        </div>
                        
                        {/* Other form fields remain the same */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="nombre" className="text-right">Nombre</Label>
                            <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="col-span-3" placeholder="Ej: LaserJet Pro M404dn"/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="img" className="text-right">Imagen</Label>
                            <Input
                                type="file"
                                id="img"
                                name="img"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleImageChange}
                                className="col-span-3 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                        </div>
                        {selectedImagePreview && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Vista previa</Label>
                                <div className="col-span-3 flex items-center gap-2">
                                    <Avatar className="w-24 h-24 rounded-md"><AvatarImage src={selectedImagePreview} alt="Vista previa" className="object-cover rounded-md"/><AvatarFallback className="rounded-md"><ImageIcon className="h-8 w-8 text-muted-foreground" /></AvatarFallback></Avatar>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => {
                                        setSelectedImage(null); setSelectedImagePreview(null);
                                        const fileInput = document.getElementById('img') as HTMLInputElement;
                                        if (fileInput) fileInput.value = "";
                                    }}>Quitar</Button>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="tipo-select" className="text-right">Tipo de Equipo</Label>
                            <ShadcnSelect value={selectedTipo} onValueChange={setSelectedTipo}>
                                <SelectTrigger id="tipo-select" className="col-span-3"><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Telefono IP">Teléfono IP</SelectItem>
                                    <SelectItem value="Switch">Switch</SelectItem>
                                    <SelectItem value="Mouse">Mouse</SelectItem>
                                    <SelectItem value="Teclado">Teclado</SelectItem>
                                    <SelectItem value="Impresora">Impresora</SelectItem>
                                    <SelectItem value="Laptop">Laptop</SelectItem>
                                    <SelectItem value="Desktop">Desktop</SelectItem>
                                    <SelectItem value="Monitor">Monitor</SelectItem>
                                    <SelectItem value="Router">Router</SelectItem>
                                    <SelectItem value="Access Point">Access Point</SelectItem>
                                    <SelectItem value="Otro">Otro</SelectItem>
                                </SelectContent>
                            </ShadcnSelect>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={isCreatingMarca}>{isEditing ? "Guardar Cambios" : "Crear Modelo"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ModeloForm;