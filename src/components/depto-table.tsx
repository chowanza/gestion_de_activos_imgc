import React, { FormEvent, useEffect, useState } from 'react';
import { set, z } from 'zod';
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"; // Assuming shadcn/ui components
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import CreatableSelect from 'react-select/creatable'; // For CreatableSelect
import { ChevronLeftIcon, ChevronRightIcon, ColumnsIcon, FilterIcon, MoreHorizontalIcon, PlusIcon, XIcon } from "lucide-react"; // Assuming lucide-react for icons
import { toast as showToast } from "sonner"; // Assuming sonner for toasts
import TableRowSkeleton, { LoadingSpinner } from '@/utils/loading';
import { AlertDialog } from '@radix-ui/react-alert-dialog';
import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDepartamentoRefresh } from '@/hooks/useDataRefresh';
import { usePermissions } from '@/hooks/usePermissions';

// Zod Schema for form validation
export const deptoSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    empresaId: z.string().min(1, "La empresa es requerida"),
    gerenteId: z.string().optional(),
});

export type DepartamentoFormData = z.infer<typeof deptoSchema>;

// Type for Departamento objects from API / for Table
export interface Departamento {
    id: string;
    nombre: string;
    empresaDepartamentos: Array<{
        empresa: { id: string; nombre: string };
    }>;
    gerencias: Array<{
        gerente: { id: string; nombre: string; apellido: string };
    }>;
    _count: { empleadoOrganizaciones: number };
}

// Type for Empresa objects (used in form and for data fetching)
export interface Empresa {
    id: string;
    nombre: string;
}

// Props for DepartamentoForm
export interface DepartamentoFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: FormData) => void;
    empresas: Empresa[];
    empleados?: { id: string; nombre: string; apellido: string; departamentoId?: string; }[];
    initialData?: {
        nombre: string;
        empresaId: string;
        gerenteId?: string;
        departamentoId?: string;
    } | null;
    isEditing?: boolean;
}

// Props for DepartamentoTable
interface DepartamentoTableProps {
    // data prop removed as it's fetched internally
}

interface OptionType {
    value: string;
    label: string;
    __isNew__?: boolean;
}

// Styles for react-select (example, adjust as needed)
const reactSelectStyles = {
    control: (provided: any) => ({
        ...provided,
        borderColor: 'hsl(var(--input))',
        '&:hover': {
            borderColor: 'hsl(var(--input))',
        },
        boxShadow: 'none',
    }),
    menu: (provided: any) => ({
        ...provided,
        zIndex: 50, // Ensure dropdown is above other elements if needed
    }),
};


// DepartamentoForm Component
const DepartamentoForm: React.FC<DepartamentoFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    empresas,
    empleados = [],
    initialData,
    isEditing: propIsEditing
}) => {
    const [nombre, setNombre] = useState('');
    const [selectedEmpresa, setSelectedEmpresa] = useState<OptionType | null>(null);
    const [selectedGerente, setSelectedGerente] = useState<OptionType | null>(null);
    const [allEmpresas, setAllEmpresas] = useState<Empresa[]>([]);
    const [allEmpleados, setAllEmpleados] = useState<{ id: string; nombre: string; apellido: string; departamentoId?: string; }[]>([]);
    const [isLoadingEmpresas, setIsLoadingEmpresas] = useState(false);

    const isEditing = !!initialData && propIsEditing;

    // Filtrar empleados según el departamento cuando se está editando
    const empleadosFiltrados = React.useMemo(() => {
        if (isEditing && initialData?.departamentoId) {
            // Solo mostrar empleados del departamento actual
            return allEmpleados.filter(emp => emp.departamentoId === initialData.departamentoId);
        }
        // Para creación, mostrar todos los empleados
        return allEmpleados;
    }, [allEmpleados, isEditing, initialData?.departamentoId]);

    useEffect(() => {
        setAllEmpresas(empresas || []);
        setAllEmpleados(empleados || []);
    }, [empresas, empleados]);

    useEffect(() => {
        if (isOpen) {
            if (isEditing && initialData) {
                setNombre(initialData.nombre || '');
                
                // Preseleccionar la empresa
                if (initialData.empresaId && allEmpresas) {
                    const empresaActual = allEmpresas.find(e => e.id === initialData.empresaId);
                    if (empresaActual) {
                        setSelectedEmpresa({ value: empresaActual.id, label: empresaActual.nombre });
                    } else {
                        setSelectedEmpresa(null);
                    }
                } else {
                    setSelectedEmpresa(null);
                }

                // Preseleccionar el gerente
                if (initialData.gerenteId && empleadosFiltrados) {
                    const gerenteActual = empleadosFiltrados.find(e => e.id === initialData.gerenteId);
                    if (gerenteActual) {
                        setSelectedGerente({ 
                            value: gerenteActual.id, 
                            label: `${gerenteActual.nombre} ${gerenteActual.apellido}` 
                        });
                    } else {
                        setSelectedGerente(null);
                    }
                } else {
                    setSelectedGerente(null);
                }
            } else {
                // Reset for creation
                setNombre('');
                setSelectedEmpresa(null);
                setSelectedGerente(null);
            }
        }
    }, [isOpen, initialData, isEditing, allEmpresas, allEmpleados, empleadosFiltrados]);

    const handleCreateEmpresa = async (inputValue: string) => {
        const newEmpresaOption: OptionType = {
            value: inputValue,
            label: inputValue,
            __isNew__: true,
        };
        setSelectedEmpresa(newEmpresaOption);
        showToast.info(`Empresa "${inputValue}" lista para ser creada junto con el departamento.`, { position: "top-right" });
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        if (!nombre.trim() || !selectedEmpresa) {
            showToast.warning("El nombre y la empresa son requeridos.", { position: "top-right" });
            return;
        }

        const formDataToSubmit = new FormData();
        formDataToSubmit.append('nombre', nombre.trim());

        if (selectedEmpresa) {
            if (selectedEmpresa.__isNew__) {
                formDataToSubmit.append('empresaNombre', selectedEmpresa.label);
            } else {
                formDataToSubmit.append('empresaId', selectedEmpresa.value);
            }
        }

        // Agregar gerente si está seleccionado
        if (selectedGerente) {
            formDataToSubmit.append('gerenteId', selectedGerente.value);
        }
        
        onSubmit(formDataToSubmit);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(openValue) => { if (!openValue) onClose(); }}>
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
                                instanceId="empresa-creatable-select"
                                styles={reactSelectStyles}
                                options={allEmpresas?.map(e => ({ value: e.id, label: e.nombre })) || []}
                                value={selectedEmpresa}
                                onChange={(option) => setSelectedEmpresa(option as OptionType | null)}
                                onCreateOption={handleCreateEmpresa}
                                placeholder="Seleccionar o crear Empresa"
                                isClearable
                                isLoading={isLoadingEmpresas}
                                formatCreateLabel={(inputValue) => `Crear nueva empresa: "${inputValue}"`}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="gerente-select" className="text-right">Gerente</Label>
                        <div className="col-span-3">
                            <CreatableSelect
                                instanceId="gerente-creatable-select"
                                styles={reactSelectStyles}
                                options={empleadosFiltrados?.map(e => ({ 
                                    value: e.id, 
                                    label: `${e.nombre} ${e.apellido}` 
                                })) || []}
                                value={selectedGerente}
                                onChange={(option) => setSelectedGerente(option as OptionType | null)}
                                placeholder={
                                    isEditing && empleadosFiltrados.length === 0 
                                        ? "No hay empleados en este departamento" 
                                        : "Seleccionar Gerente (opcional)"
                                }
                                isClearable
                                isDisabled={isEditing && empleadosFiltrados.length === 0}
                            />
                            {isEditing && empleadosFiltrados.length === 0 && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    No hay empleados registrados en este departamento. 
                                    Agregue empleados al departamento para poder asignar un gerente.
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">{isEditing ? "Guardar Cambios" : "Crear Departamento"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};


// DepartamentoTable Component
export function DepartamentoTable({}: DepartamentoTableProps) {
    const router = useRouter();
    const notifyDepartamentoChange = useDepartamentoRefresh();
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [editingDepartamento, setEditingDepartamento] = React.useState<Departamento | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("")
    const [empresaFilter, setEmpresaFilter] = React.useState<string>("")
    const [departamentos, setDepartamentos] = React.useState<Departamento[]>([]);
    const [empresas, setEmpresas] = React.useState<Empresa[]>([]);
    const [empleados, setEmpleados] = React.useState<{ id: string; nombre: string; apellido: string; }[]>([]);
    const [isLoading, setLoading] = React.useState(true)
    const { hasAnyPermission } = usePermissions();
    const canManageDepartamentos = hasAnyPermission(['canManageDepartamentos','canManageEmpresas','canCreate','canUpdate','canDelete']);



    const columns: ColumnDef<Departamento>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Seleccionar todo"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Seleccionar fila"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "nombre",
            header: "Nombre",
        },
        {
            accessorKey: "empresa.nombre",
            header: "Empresa",
            cell: ({ row }) => {
                const empresas = row.original.empresaDepartamentos;
                if (empresas && empresas.length > 0) {
                    return <div>{empresas[0].empresa.nombre}</div>;
                }
                return <div>N/A</div>;
            },
        },
        {
            accessorKey: "gerente",
            header: "Gerente",
            cell: ({ row }) => {
                const gerencias = row.original.gerencias;
                if (gerencias && gerencias.length > 0) {
                    const gerente = gerencias[0].gerente;
                    return <div>{gerente ? `${gerente.nombre} ${gerente.apellido}` : "Sin asignar"}</div>;
                }
                return <div>Sin asignar</div>;
            },
        },
        {
            accessorKey: "_count.empleadoOrganizaciones",
            header: "Empleados",
            cell: ({ row }) => {
                const count = row.original._count?.empleadoOrganizaciones || 0;
                return (
                    <Badge variant={count > 0 ? "default" : "secondary"}>
                        {count} empleado{count !== 1 ? 's' : ''}
                    </Badge>
                );
            },
        },
        {
            id: "actions",
            header: "Acciones",
            cell: ({ row }) => {
                const depto = row.original;
                return (
                    <AlertDialog>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontalIcon className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => navigator.clipboard.writeText(depto.id)}
                            >
                                Copiar ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewDetails(depto)}>
                                Ver Detalles
                            </DropdownMenuItem>
                            {canManageDepartamentos && (
                                <>
                                    <DropdownMenuItem onClick={() => handleOpenEditModal(depto)}>
                                        Editar Departamento
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                            Eliminar Departamento
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el departamento
                            y borrará sus datos de nuestros servidores.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                            disabled={isLoading}
                            onClick={() => handleDelete({ id: depto.id })}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                            {isLoading ? "Eliminando..." : "Sí, eliminar"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                </AlertDialog>
                );
            },
        },
    ];

    // Filtrar departamentos por empresa y búsqueda usando el estado local
    const departamentosFiltrados = React.useMemo(() => {
        let filtered = departamentos;
        
        // Filtrar por empresa
        if (empresaFilter) {
            filtered = filtered.filter(depto => 
                depto.empresaDepartamentos?.some(ed => ed.empresa.id === empresaFilter)
            );
        }
        
        // Filtrar por búsqueda de nombre
        if (searchQuery) {
            filtered = filtered.filter(depto => 
                depto.nombre.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        return filtered;
    }, [departamentos, empresaFilter, searchQuery]);

    const table = useReactTable({
        data: departamentosFiltrados, // Use the filtered departamentos
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setSearchQuery,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        // Enable global filter if you want the single search input to filter across multiple specified columns
        // globalFilterFn: 'auto', // or your custom function
        // onGlobalFilterChange: setSearchQuery, // if you want to control global filter directly
    });

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [departamentosResponse, empresasResponse, empleadosResponse] = await Promise.all([
                fetch('/api/departamentos'),
                fetch('/api/empresas'),
                fetch('/api/usuarios')
            ]);

            if (departamentosResponse.status === 403) {
                showToast.error('No tienes permisos para ver los departamentos', { position: 'top-right' });
                setDepartamentos([]);
                setLoading(false);
                return;
            }
            if (!departamentosResponse.ok) {
                throw new Error(`Error fetching departamentos: ${departamentosResponse.statusText}`);
            }
            if (!empresasResponse.ok) {
                throw new Error(`Error fetching empresas: ${empresasResponse.statusText}`);
            }
            if (!empleadosResponse.ok) {
                throw new Error(`Error fetching empleados: ${empleadosResponse.statusText}`);
            }

            const departamentosData: Departamento[] = await departamentosResponse.json();
            const empresasData: Empresa[] = await empresasResponse.json();
            const empleadosData: { id: string; nombre: string; apellido: string; }[] = await empleadosResponse.json();


            setDepartamentos(departamentosData);
            setEmpresas(empresasData);
            setEmpleados(empleadosData);
            setLoading(false);
        } catch (error: any) {
            showToast.error(`¡Error al cargar datos!: ${error.message}`, {
                duration: 4000, position: "top-right",
            });
        }
    };

    React.useEffect(() => {
        fetchAllData();
    }, []);

    // Removido: Ya no necesitamos filtrar por columnas individuales
    // El filtrado se maneja en departamentosFiltrados
    
    // Verificar que la tabla esté lista antes de renderizar
    if (!table || !columns || columns.length === 0 || isLoading) {
        return (
            <Card className="border-none shadow-md">
                <CardHeader className="bg-primary/5 rounded-t-lg">
                    <CardTitle className="text-2xl font-bold">Departamentos</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <LoadingSpinner message="Cargando tabla..." />
                </CardContent>
            </Card>
        );
    }

    const handleDelete = async ({id}: {id: string}) => {
    setLoading(true);
    try {
        const response = await fetch(`/api/departamentos/${id}`, {
        method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al eliminar el departamento');
        }

        const result = await response.json();
        
        showToast.success("✅ Departamento eliminado exitosamente", {
            duration: 4000,
            position: "top-right"
        });
        fetchAllData();
        notifyDepartamentoChange(); // Notificar cambios
    } catch (error: any) {
        console.error(error);
        showToast.error(`❌ ${error.message || "No se pudo eliminar el departamento"}`, {
            duration: 5000,
            position: "top-right"
        });
    } finally {
        setLoading(false);
    }
    };
    

    const handleOpenEditModal = (departamento: Departamento) => {
        setEditingDepartamento(departamento);
        setIsEditModalOpen(true);
    };

    const handleViewDetails = (departamento: Departamento) => {
        // Navegar a la página de detalles del departamento
        router.push(`/departamentos/${departamento.id}`);
    };

    const handleCreateDepartamento = async (data: FormData) => {
        try {
            const formDataObj = Object.fromEntries(data.entries());
            // console.log("Creating Departamento with:", formDataObj);

            const response = await fetch('/api/departamentos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formDataObj),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Error ${response.status}: ${response.statusText}` }));
                throw new Error(errorData.message || `Error creando departamento`);
            }

            showToast.success("Departamento creado correctamente 👍", { duration: 4000, position: "top-right" });
            setIsCreateModalOpen(false);
            await fetchAllData(); // Refresh data
            notifyDepartamentoChange(); // Notificar cambios
        } catch (error: any) {
            showToast.error(`Error al guardar el departamento: ${error.message}`, { duration: 4000, position: "top-right" });
        }
    };

    const handleUpdateDepartamento = async (data: FormData) => {
        if (!editingDepartamento) return;

        try {
            const formDataObj = Object.fromEntries(data.entries());
            // console.log("Updating Departamento with:", formDataObj);

            const response = await fetch(`/api/departamentos/${editingDepartamento.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }, // Essential for JSON body
                body: JSON.stringify(formDataObj),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Error ${response.status}: ${response.statusText}` }));
                throw new Error(errorData.message || `Error actualizando departamento`);
            }

            showToast.success("Departamento actualizado correctamente ✨", { duration: 4000, position: "top-right" });
            setIsEditModalOpen(false);
            setEditingDepartamento(null);
            await fetchAllData(); // Refresh data
            notifyDepartamentoChange(); // Notificar cambios
        } catch (error: any) {
            showToast.error(`Error al actualizar el departamento: ${error.message}`, { duration: 4000, position: "top-right" });
        }
    };

    const clearFilters = () => {
        setSearchQuery("");
        setEmpresaFilter("");
    };

    const hasActiveFilters = searchQuery || empresaFilter;

    return (
        <Card className="border-none shadow-md">
            <CardHeader className="bg-primary/5 rounded-t-lg">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-2xl font-bold">Departamentos</CardTitle>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Filtrar por nombre..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="max-w-sm border-primary/20"
                            />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="min-w-[140px] justify-between">
                                        <FilterIcon className="h-4 w-4 mr-2" />
                                        {empresaFilter ? empresas.find(e => e.id === empresaFilter)?.nombre || "Empresa" : "Empresas"}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-[200px]">
                                    <DropdownMenuLabel>Filtrar por empresa</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => setEmpresaFilter("")}
                                        className={!empresaFilter ? "bg-accent" : ""}
                                    >
                                        Todas las empresas
                                    </DropdownMenuItem>
                                    {empresas.map((empresa) => (
                                        <DropdownMenuItem
                                            key={empresa.id}
                                            onClick={() => setEmpresaFilter(empresa.id)}
                                            className={empresaFilter === empresa.id ? "bg-accent" : ""}
                                        >
                                            {empresa.nombre}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {hasActiveFilters && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <XIcon className="h-4 w-4 mr-1" />
                                    Limpiar filtros
                                </Button>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="ml-auto">
                                        <ColumnsIcon className="h-4 w-4 mr-2" />
                                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Columnas</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {table
                                        .getAllColumns()
                                        .filter((column) => column.getCanHide())
                                        .map((column) => (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                            >
                                                {column.id === "empresa.nombre" ? "Empresa" :
                                                 column.id === "gerente" ? "Gerente" :
                                                 column.id === "_count.empleadoOrganizaciones" ? "Empleados" :
                                                 column.id}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        {canManageDepartamentos && (
                            <Button onClick={() => setIsCreateModalOpen(true)}>
                                <PlusIcon className="mr-2 h-4 w-4" />
                                Agregar Departamento
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <TableRowSkeleton 
                                        key={`skeleton-${index}`} 
                                        columnCount={columns.length || 5} 
                                    />
                                ))
                            ) : table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        {hasActiveFilters ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <span>No se encontraron departamentos con los filtros aplicados.</span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={clearFilters}
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    <XIcon className="h-4 w-4 mr-1" />
                                                    Limpiar filtros
                                                </Button>
                                            </div>
                                        ) : (
                                            "No hay departamentos registrados."
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-between space-x-2 py-4 px-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                        {table.getFilteredSelectedRowModel().rows.length} de {table.getFilteredRowModel().rows.length} fila(s) seleccionada(s).
                    </div>
                    <div className="space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeftIcon className="h-4 w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Anterior</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="hidden sm:inline">Siguiente</span>
                            <ChevronRightIcon className="h-4 w-4 ml-1 sm:ml-2" />
                        </Button>
                    </div>
                </div>
            </CardContent>

            {/* Create Modal */}
            <DepartamentoForm
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateDepartamento}
                empresas={empresas}
                empleados={empleados}
                key="create-departamento-form"
            />

            {/* Edit Modal */}
            {editingDepartamento && (
                <DepartamentoForm
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingDepartamento(null);
                    }}
                    onSubmit={handleUpdateDepartamento}
                    initialData={{
                        nombre: editingDepartamento.nombre,
                        empresaId: editingDepartamento.empresaDepartamentos[0]?.empresa?.id,
                        gerenteId: editingDepartamento.gerencias[0]?.gerente?.id,
                        departamentoId: editingDepartamento.id,
                    }}
                    empresas={empresas}
                    empleados={empleados}
                    isEditing={true}
                    key={editingDepartamento.id}
                />
            )}
        </Card>
    );
}