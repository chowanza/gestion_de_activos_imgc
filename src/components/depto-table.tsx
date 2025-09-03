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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import CreatableSelect from 'react-select/creatable'; // For CreatableSelect
import { ChevronLeftIcon, ChevronRightIcon, ColumnsIcon, FilterIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react"; // Assuming lucide-react for icons
import { toast as showToast } from "sonner"; // Assuming sonner for toasts
import TableRowSkeleton from '@/utils/loading';
import { AlertDialog } from '@radix-ui/react-alert-dialog';
import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import Link from 'next/link';

// Zod Schema for form validation
export const deptoSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    ceco: z.string().min(1, "El CECO es requerido"),
    sociedad: z.string().min(1, "La sociedad es requerida"),
    gerencia: z.string().min(1, "La gerencia es requerida"), // This implies gerencia is an ID string
});

export type DepartamentoFormData = z.infer<typeof deptoSchema>;

// Type for Departamento objects from API / for Table
export interface Departamento {
    id: string;
    nombre: string;
    gerencia: { id: string; nombre: string }; // Table expects gerencia as an object
    ceco: string;
    sociedad: string;
}

// Type for Gerencia objects (used in form and for data fetching)
export interface Gerencia {
    id: string;
    nombre: string;
}

// Props for DepartamentoForm
export interface DepartamentoFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: FormData) => void; // Form currently submits FormData
    gerencias: Gerencia[];
    initialData?: { // Data to pre-fill the form for editing
        nombre: string;
        sociedad: string;
        ceco: string;
        gerenciaId: string; // ID of the selected gerencia
    } | null; // Allow null for clarity when not editing
    isEditing?: boolean; // Explicitly pass if it's an edit operation
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
    gerencias,
    initialData,
    isEditing: propIsEditing // Renamed to avoid conflict
}) => {
    const [nombre, setNombre] = useState('');
    const [ceco, setCeco] = useState('');
    const [sociedad, setSociedad] = useState('');
    const [selectedGerencia, setSelectedGerencia] = useState<OptionType | null>(null);
    const [allGerencias, setAllGerencias] = useState<Gerencia[]>([]);
    const [isLoadingGerencias, setIsLoadingGerencias] = useState(false); // Example state for loading
    // const [isCreatingGerencia, setIsCreatingGerencia] = useState(false); // Not strictly needed if optimistic

    const isEditing = !!initialData && propIsEditing;

    useEffect(() => {
        setAllGerencias(gerencias);
    }, [gerencias]);

    useEffect(() => {
        if (isOpen) {
            if (isEditing && initialData) {
                setNombre(initialData.nombre || '');
                setCeco(initialData.ceco || '');
                setSociedad(initialData.sociedad || '');
                if (initialData.gerenciaId) {
                    const gerenciaActual = allGerencias.find(g => g.id === initialData.gerenciaId);
                    if (gerenciaActual) {
                        setSelectedGerencia({ value: gerenciaActual.id, label: gerenciaActual.nombre });
                    } else {
                        setSelectedGerencia(null);
                    }
                } else {
                    setSelectedGerencia(null);
                }
            } else {
                // Reset for creation
                setNombre('');
                setCeco('');
                setSociedad('');
                setSelectedGerencia(null);
            }
        }
    }, [isOpen, initialData, isEditing, allGerencias]);

    const handleCreateGerencia = async (inputValue: string) => {
        // setIsCreatingGerencia(true); // UI feedback if needed
        const newGerenciaOption: OptionType = {
            value: inputValue, // For a new brand, value might be temporary or same as label
            label: inputValue,
            __isNew__: true,
        };
        setSelectedGerencia(newGerenciaOption);
        // setIsCreatingGerencia(false);
        showToast.info(`Gerencia "${inputValue}" lista para ser creada junto con el departamento.`, { position: "top-right" });
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        // Basic validation (Zod could be integrated more deeply here)
        if (!nombre.trim() || !ceco.trim() || !sociedad.trim() || !selectedGerencia) {
            showToast.warning("Todos los campos son requeridos, incluyendo la gerencia.", { position: "top-right" });
            return;
        }

        const formDataToSubmit = new FormData();
        formDataToSubmit.append('nombre', nombre.trim());
        formDataToSubmit.append('ceco', ceco.trim());
        formDataToSubmit.append('sociedad', sociedad.trim());

        if (selectedGerencia) { // Ensure selectedGerencia is not null
            if (selectedGerencia.__isNew__) {
                formDataToSubmit.append('gerenciaNombre', selectedGerencia.label); // Send name for new gerencia
            } else {
                formDataToSubmit.append('gerenciaId', selectedGerencia.value); // Send ID for existing gerencia
            }
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
                        <Label htmlFor="nombre" className="text-right">Nombre</Label>
                        <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="col-span-3" placeholder="Nombre del Departamento" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="ceco" className="text-right">CECO</Label>
                        <Input id="ceco" value={ceco} onChange={(e) => setCeco(e.target.value)} className="col-span-3" placeholder="Centro de Costo" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="sociedad" className="text-right">Sociedad</Label>
                        <Input id="sociedad" value={sociedad} onChange={(e) => setSociedad(e.target.value)} className="col-span-3" placeholder="Sociedad a la que pertenece" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="gerencia-select" className="text-right">Gerencia</Label>
                        <div className="col-span-3">
                            <CreatableSelect
                                instanceId="gerencia-creatable-select"
                                styles={reactSelectStyles}
                                options={allGerencias.map(g => ({ value: g.id, label: g.nombre }))}
                                value={selectedGerencia}
                                onChange={(option) => setSelectedGerencia(option as OptionType | null)}
                                onCreateOption={handleCreateGerencia}
                                placeholder="Seleccionar o crear Gerencia"
                                isClearable
                                isLoading={isLoadingGerencias}
                                formatCreateLabel={(inputValue) => `Crear nueva gerencia: "${inputValue}"`}
                            />
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
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [editingDepartamento, setEditingDepartamento] = React.useState<Departamento | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("")
    const [departamentos, setDepartamentos] = React.useState<Departamento[]>([]);
    const [gerencias, setGerencias] = React.useState<Gerencia[]>([]);
    const [isLoading, setLoading] = React.useState(false) // Gerencia[] type

    // API Data type for Departamento if gerencia is just an ID from backend
    interface DepartamentoFromAPI {
        id: string;
        nombre: string;
        gerenciaId: string; // Assuming API returns gerenciaId
        ceco: string;
        sociedad: string;
    }


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
            accessorKey: "gerencia.nombre",
            header: ({ column }) => {
            const isFilterActive = !!column.getFilterValue();
            
            // Obtener modelos únicos de los computadores
            const uniqueModelos = Array.from(
                new Set(departamentos
                .map(c => c.gerencia?.nombre)
                .filter(Boolean) as string[]
                )
            ).sort();

            return (
                <div className="flex items-center">
                <span>Modelo</span>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-5 w-5 p-0 ml-1 ${isFilterActive ? "text-[#00FFFF]" : "text-muted-foreground"}`}
                    >
                        <FilterIcon className="h-3 w-3" />
                        {isFilterActive && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#00FFFF]"></span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-2">
                    <select
                        value={(column.getFilterValue() as string) ?? ""}
                        onChange={(e) => column.setFilterValue(e.target.value)}
                        className="h-8 w-full border rounded text-sm px-2 py-1"
                    >
                        <option value="">Todos los modelos</option>
                        {uniqueModelos.map((modelo) => (
                        <option key={modelo} value={modelo}>
                            {modelo}
                        </option>
                        ))}
                    </select>
                    </PopoverContent>
                </Popover>
                </div>
            );
            },
        },
        {
            accessorKey: "ceco",
            header: "CECO",
        },
        {
            accessorKey: "sociedad",
            header: "Sociedad"
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
                            <DropdownMenuItem asChild>
                                <Link href={`/departamentos/${depto.id}/asigned`}>
                                    Ver Asignados
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEditModal(depto)}>
                                Editar departamento
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                    Eliminar departamento
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
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

    const table = useReactTable({
        data: departamentos, // Use the processed 'departamentos' state
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
            const [departamentosResponse, gerenciasResponse] = await Promise.all([
                fetch('/api/departamentos'),
                fetch('/api/gerencias')
            ]);

            if (!departamentosResponse.ok) {
                throw new Error(`Error fetching departamentos: ${departamentosResponse.statusText}`);
            }
            if (!gerenciasResponse.ok) {
                throw new Error(`Error fetching gerencias: ${gerenciasResponse.statusText}`);
            }

            const departamentosDataFromAPI: DepartamentoFromAPI[] = await departamentosResponse.json();
            const gerenciasData: Gerencia[] = await gerenciasResponse.json();

            // Create a map for quick lookup of gerencia names
            const gerenciasMap = new Map(gerenciasData.map(g => [g.id, g.nombre]));

            // Enrich departamentos data with gerencia object
            const processedDepartamentos: Departamento[] = departamentosDataFromAPI.map(d => ({
                ...d,
                gerencia: {
                    id: d.gerenciaId,
                    nombre: gerenciasMap.get(d.gerenciaId) || "N/A", // Fallback for missing gerencia
                },
            }));

            setDepartamentos(processedDepartamentos);
            setGerencias(gerenciasData);
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

    React.useEffect(() => {
        if (searchQuery) {
          table.getColumn("nombre")?.setFilterValue(searchQuery);
        } else {
          table.getColumn("nombre")?.setFilterValue("");
        }
      }, [table, searchQuery]);
    

    const handleDelete = async ({id}: {id: string}) => {
    setLoading(true);
    try {
        const response = await fetch(`/api/departamentos/${id}`, {
        method: 'DELETE',
        });

        if (!response.ok) {
        throw new Error('Error al eliminar el depto.');
        }

        showToast.success("Departamento eliminado correctamente.");
        fetchAllData();
    } catch (error) {
        console.error(error);
        showToast.error("No se pudo eliminar el depto.");
    } finally {
        setLoading(false);
    }
    };
    

    const handleOpenEditModal = (departamento: Departamento) => {
        setEditingDepartamento(departamento);
        setIsEditModalOpen(true);
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
        } catch (error: any) {
            showToast.error(`Error al actualizar el departamento: ${error.message}`, { duration: 4000, position: "top-right" });
        }
    };



    return (
        <Card className="border-none shadow-md">
            <CardHeader className="bg-primary/5 rounded-t-lg">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-2xl font-bold">Departamentos</CardTitle>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Filtrar por nombre..." // Update placeholder
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="max-w-sm border-primary/20"
                            />
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
                                                {/* Custom display names for columns */}
                                                {column.id === "gerencia.nombre" ? "Gerencia" :
                                                 column.id === "ceco" ? "CECO" :
                                                 column.id}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <Button onClick={() => setIsCreateModalOpen(true)}>
                            <PlusIcon className="mr-2 h-4 w-4" />
                            Agregar Departamento
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="rounded-md border overflow-x-auto"> {/* Added overflow for responsiveness */}
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
                                // Mostrar datos cuando están cargados
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
                                // Mostrar mensaje si no hay resultados
                                <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    {searchQuery ? "No se encontraron departamentos con ese filtro." : "No hay departamentos registrados."}
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
                gerencias={gerencias}
                key="create-departamento-form" // Explicit key for create
            />

            {/* Edit Modal */}
            {editingDepartamento && ( // Conditionally render to ensure initialData is available
                <DepartamentoForm
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingDepartamento(null);
                    }}
                    onSubmit={handleUpdateDepartamento}
                    initialData={{ // Map data for the edit form
                        nombre: editingDepartamento.nombre,
                        gerenciaId: editingDepartamento.gerencia.id, // Pass the ID of the gerencia
                        ceco: editingDepartamento.ceco,
                        sociedad: editingDepartamento.sociedad,
                    }}
                    gerencias={gerencias}
                    isEditing={true} // Explicitly set isEditing
                    key={editingDepartamento.id} // Crucial for React to reinitialize/reset the form state
                />
            )}
        </Card>
    );
}