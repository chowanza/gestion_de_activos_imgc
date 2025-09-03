"use client"

import { Checkbox } from "@radix-ui/react-checkbox";
import { ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable, VisibilityState } from "@tanstack/react-table";
import React from "react";
import {z} from "zod";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { ArchiveRestore, CheckCircle2Icon, ChevronLeftIcon, ChevronRightIcon, ColumnsIcon, ImageIcon, MoreHorizontalIcon, PlusIcon, User2Icon, WrenchIcon, XCircleIcon, EyeIcon } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FilterIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DispositivoForm from "./EquipoForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import TableRowSkeleton from "@/utils/loading";


export const dispositivoSchema = z.object({
  id: z.string().optional(), // Es buena idea tener el id en el schema para la lógica unificada
  serial: z.string().min(1, "El serial es requerido"),
  modeloId: z.string().min(1, "El Modelo es Requerido"),
  estado: z.string().min(1, "El estado es requerido"),
  nsap: z.string().nullable(),
  ubicacion: z.string().nullable(),
  mac: z.string().nullable()
});

export type DispositivoFormData = z.infer<typeof dispositivoSchema>;



// Type for Modelo objects from API (assuming it includes an 'id' and 'marca' might be an object)
export interface Dispositivo {
  id?: string;
  modeloId: string; // Or number, depending on your API
  serial: string;
  estado: string;
  nsap?: string;
  ubicacion?: string;
  mac?: string; // Optional, as it might not be present in all devices
  modelo: { id: string; nombre: string; img?: string; marca?: { nombre?: string } }; // Added img and marca properties
}

export interface DispositivoFormProps {
  onCreateModel: (data: DispositivoFormData) => void;
  modelo: { id: string; nombre: string }[];
  initialData?: {
    id?: string;
    serial: string;
    estado: string;
    nsap: string | null;
    ubicacion: string | null;
    mac: string | null;
  };
}

interface DispositivoTableProps {
  data: Dispositivo[]
}

export function DispositivoTable({}: DispositivoTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingDispositivo, setEditingDispositivo] = React.useState<Dispositivo | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("")
  const [dispositivos, setDispositivos] = React.useState<Dispositivo[]>([]);
  const [modelos, setModelos] = React.useState<{ id: string; nombre: string }[]>([]);
  const [isLoading, setIsLoading] = React.useState(true); 
  const isAdmin = useIsAdmin();
  const [isImageModalOpen, setIsImageModalOpen] = React.useState(false);
  const [currentImage, setCurrentImage] = React.useState<string | null>(null);

const columns: ColumnDef<Dispositivo>[] = [
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
    accessorKey: "serial",
    header: "Serial",
    cell: ({ row }) => <div>{row.getValue("serial")}</div>,
  },
{
  accessorFn: (row) => row.modelo?.marca?.nombre ?? "Sin marca",
  id: "marcaNombre",
  header: ({ column }) => {
    const isFilterActive = !!column.getFilterValue();
    
    // Obtener marcas únicas de los computadores
    const uniqueMarcas = Array.from(
      new Set(dispositivos
        .map(c => c.modelo?.marca?.nombre)
        .filter(Boolean) as string[]
      )
    ).sort();

    return (
      <div className="flex items-center">
        <span>Marca</span>
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
              <option value="">Todas las marcas</option>
              {uniqueMarcas.map((marca) => (
                <option key={marca} value={marca}>
                  {marca}
                </option>
              ))}
            </select>
          </PopoverContent>
        </Popover>
      </div>
    );
  },
  cell: ({ row }) => {
    const marcaNombre = row.original.modelo?.marca?.nombre;
    return <div>{marcaNombre || "Sin marca"}</div>;
  },
},
  {
    accessorKey: "modelo.nombre",
    header: ({ column }) => {
      const isFilterActive = !!column.getFilterValue();
      
      // Obtener modelos únicos de los computadores
      const uniqueModelos = Array.from(
        new Set(dispositivos
          .map(c => c.modelo?.nombre)
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
     id: "modelo.img",
    header: "Imagen",
    accessorFn: (row) => row.modelo?.img,
    cell: ({ row }) => {
      const imageUrl = row.getValue("modelo.img") as string | undefined;
      return (
        <div className="flex items-center justify-center">
          {imageUrl ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setCurrentImage(imageUrl);
                setIsImageModalOpen(true);
              }}
            >
              <EyeIcon className="h-5 w-5 text-primary" />
            </Button>
          ) : (
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "estado",
    header: ({ column }) => {
      const isFilterActive = !!column.getFilterValue();
      const estadosUnicos = ["Resguardo", "En reparación", "Asignado", "Otro"]; // Ajusta según tus estados
      
      return (
        <div className="flex items-center">
          <span>Estado</span>
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
                <option value="">Todos</option>
                {estadosUnicos.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </PopoverContent>
          </Popover>
        </div>
      );
    },
    cell: ({ row }) => {
      const estado = row.getValue("estado") as string;
      return (
        <div className="flex items-center gap-2">
          {estado === "Resguardo" ? (
            <ArchiveRestore className="h-4 w-4 text-blue-300" />
          ) : estado === "En reparación" ? (
            <WrenchIcon className="h-4 w-4 text-amber-500" />
          ) : estado === "Asignado" ? (
            <User2Icon className="h-4 w-4 text-green-500" />
          ) : (
            <XCircleIcon className="h-4 w-4 text-destructive" />
          )}
          <span>{estado}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const dispositivo = row.original

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
                <DropdownMenuItem onClick={() => {
                              navigator.clipboard.writeText(dispositivo.serial.toString());
                                showToast.success("¡Serial copiado!", { progress: false,
                                                  position: "bottom-center",
                                                  transition: "popUp"});
                            }}>
                  Copiar Serial
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dispositivos/${dispositivo.id}/details`}>
                    Ver detalles
                  </Link>
                </DropdownMenuItem>
                { isAdmin && (
                  <>
                    <DropdownMenuItem
                      onClick={() => handleOpenEditModal(dispositivo)}
                    >
                      Editar equipo
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">Eliminar equipo</DropdownMenuItem>
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
                  onClick={() => handleDelete({ id: dispositivo.id! })}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                  {isLoading ? "Eliminando..." : "Sí, eliminar"}
                  </AlertDialogAction>
              </AlertDialogFooter>
              </AlertDialogContent>
        </AlertDialog>
      )
    },
  },
]

  const table = useReactTable({
    data: dispositivos,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const handleDelete = async ({id}: {id: string}) => {
      setIsLoading(true);
      try {
          const response = await fetch(`/api/dispositivos/${id}`, {
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
          setIsLoading(false);
      }
      };

   const fetchAllData = async () => {
    setIsLoading(true);  
    try {
        // Hacemos ambas peticiones en paralelo para mejorar la velocidad
        const [dispositivosResponse, modelosResponse] = await Promise.all([
            fetch('/api/dispositivos'),
            fetch('/api/modelos') 
        ]);
  
        if (!dispositivosResponse.ok) {
          throw new Error(`Error fetching dispositivos: ${dispositivosResponse.status}`);
        }
        if (!modelosResponse.ok) {
            throw new Error(`Error fetching modelos: ${modelosResponse.status}`);
        }
        
        const dispositivosData: Dispositivo[] = await dispositivosResponse.json();
        const modelosData = await modelosResponse.json();
        
        setDispositivos(dispositivosData);
        setModelos(modelosData); // CAMBIO 2: Guarda la lista de modelos en el estado
        setIsLoading(false);
  
      } catch (error: any) {
        showToast.error("¡Error en Cargar!"+ (error.message), {
            position: "top-right",
        });
      }
    };
  
    React.useEffect(() => {
      fetchAllData();
    }, []);
  
    const handleOpenEditModal = (dispositivos: Dispositivo) => {
    setEditingDispositivo(dispositivos);
    setIsEditModalOpen(true);
  };

  // ==================================================================
  // CAMBIO 1: Lógica Unificada para Guardar (Crear y Actualizar)
  // Reemplaza tus funciones handleCreateDispositivo y handleUpdateDispositivo con esta.
  // ==================================================================
  const handleSaveDispositivo = async (data: DispositivoFormData) => {
    // CAMBIO 2: Determinamos si es una edición si los datos incluyen un 'id'.
    console.log("Datos recibidos en handleSaveDispositivo:", data);

    const isEditing = !!data.id;
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `/api/dispositivos/${data.id}` : '/api/dispositivos';

    // El 'serial' no debería cambiarse al editar, pero lo incluimos por si acaso.
    // El backend debe validar que el 'serial' no se duplique.
    // El 'id' no se debe enviar en el cuerpo de la petición PUT.
    const bodyPayload: Omit<DispositivoFormData, 'id'> = {
      serial: data.serial,
      modeloId: data.modeloId,
      estado: data.estado,
      nsap: data.nsap,
      ubicacion: data.ubicacion,
      mac: data.mac,
    };

    try {
      console.log(`Enviando ${method} a ${url} con payload:`, bodyPayload);

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Error en la operación: ${response.statusText}`);
      }

      showToast.success(`Dispositivo ${isEditing ? 'actualizado' : 'creado'} correctamente ${isEditing ? '✨' : '👍'}`, {
        position: "top-right",
      });

      // Cerramos el modal correspondiente y refrescamos los datos
      if (isEditing) {
        setIsEditModalOpen(false);
        setEditingDispositivo(null);
      } else {
        setIsCreateModalOpen(false);
      }
      
      await fetchAllData();

    } catch (error: any) {
      showToast.error("Error al guardar el Dispositivo: " + error.message, {
        position: "top-right",
      });
    }
  };

React.useEffect(() => {
    if (searchQuery) {
      table.getColumn("serial")?.setFilterValue(searchQuery)
    } else {
      table.getColumn("serial")?.setFilterValue("")
    }
  }, [table, searchQuery])

return (
    <Card className="border-none shadow-md">
      <CardHeader className="bg-primary/5 rounded-t-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-2xl font-bold">Dispositivos</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar por serial..."
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
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                          {column.id === "serial"
                              ? "Serial"
                              : column.id === "estado"
                                ? "Estado"
                                : column.id === "Modelo"
                                  ? "Modelo"
                                      : column.id}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
                {isAdmin && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Agregar Dispositivo
                    </Button>
                )}            
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
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
            {table.getFilteredSelectedRowModel().rows.length} de {table.getFilteredRowModel().rows.length} fila(s)
            seleccionada(s).
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
     <DispositivoForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleSaveDispositivo} // CAMBIO 4: Usamos el nuevo handler unificado
        initialData={null}
        modelos={modelos} // CAMBIO 3: Pasa la lista de modelos al formulario // Para crear, no hay datos iniciales
      />

      {/* Modal para Editar */}
      <DispositivoForm
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingDispositivo(null);
        }}
        onSubmit={handleSaveDispositivo} // CAMBIO 5: Usamos el mismo handler unificado
        initialData={editingDispositivo ? { // CAMBIO 3: ASEGÚRATE DE PASAR EL ID
          id: editingDispositivo.id, // ¡ESTA LÍNEA ES CRUCIAL!
          serial: editingDispositivo.serial,
          modeloId: editingDispositivo.modeloId,
          estado: editingDispositivo.estado,
          ubicacion: editingDispositivo.ubicacion ?? null,
          nsap: editingDispositivo.nsap ?? null,
          mac: editingDispositivo.mac ?? null,
        } : null}
        modelos={modelos} 
        // La key es importante para que React reinicie el estado del formulario al cambiar de un dispositivo a otro
        key={editingDispositivo?.id || 'create'} 
      />

      {/* Modal para mostrar la imagen */}
      <AlertDialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Imagen del Modelo</AlertDialogTitle>
            <AlertDialogDescription>
              {currentImage ? (
                <img src={currentImage} alt="Imagen del Modelo" className="max-w-full h-auto object-contain" />
              ) : (
                "No hay imagen disponible."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsImageModalOpen(false)}>Cerrar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )

}
