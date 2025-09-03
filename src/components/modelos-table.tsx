"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ColumnsIcon,
  ImageIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from "lucide-react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import { showToast } from "nextjs-toast-notify";
import ModeloForm from "./ModeloForm"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { FilterIcon } from "lucide-react"
import { useIsAdmin } from "@/hooks/useIsAdmin"
import TableRowSkeleton from "@/utils/loading"

export const modeloSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  marca: z.string().min(1, "La Marca es Requerida"),
  tipo: z.string().min(1, "El tipo de dispositivo es requerido"),
  img: z.string().nullable(),
})

export type ModeloFormData = z.infer<typeof modeloSchema>

// Type for Modelo objects from API (assuming it includes an 'id' and 'marca' might be an object)
export interface Modelo {
  id: string; // Or number, depending on your API
  nombre: string;
  marca: { id: string; nombre: string }; // Assuming 'marca' is an object in the fetched data
  tipo: string;
  img?: File | null;
  // Add any other fields that come from your API
}


export interface ModeloFormProps {
  onCreateModel: (data: ModeloFormData) => void;
  marcas: { id: string; nombre: string }[];
  initialData?: {
    nombre: string;
    marca: string;
    tipo: string;
    img: string | null;
  };
}


interface EquiposTableProps {
  data: Modelo[]
}

export function ModelosTable({}: EquiposTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingModelo, setEditingModelo] = React.useState<Modelo | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("")
  const [modelos, setModelos] = React.useState<Modelo[]>([]);
  const [marcas, setMarcas] = React.useState<{ id: string; nombre: string }[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const isAdmin = useIsAdmin();

const columns: ColumnDef<Modelo>[] = [
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
  accessorKey: "marca.nombre",
  header: ({ column }) => (
    <div className="flex items-center">
      <span>Marca</span>
      <Popover>
        <PopoverTrigger asChild> 
          <Button variant="ghost" 
          size="sm" 
          className={`h-5 w-5 p-0 ml-1  ${column.getFilterValue() ? "text-cyan-500" : "text-muted-foreground"}`}>
            <FilterIcon className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-2">
          <select
            value={(column.getFilterValue() as string) ?? ""}
            onChange={(e) => column.setFilterValue(e.target.value)}
            className="h-8 w-full border rounded text-sm px-2 py-1"
          >
            <option value="">Todas las marcas</option>
            {marcas.map((marca) => (
              <option key={marca.id} value={marca.nombre}>
                {marca.nombre}
              </option>
            ))}
          </select>
        </PopoverContent>
      </Popover>
    </div>
  ),
},
 {
  accessorKey: "tipo",
  header: ({ column }) => {
    const currentFilter = (column.getFilterValue() as string) ?? "";
    return (
      <div className="flex items-center">
        <span className="text-sm">Tipo</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" 
              size="sm" 
              className={`h-5 w-5 p-0 ml-1  ${column.getFilterValue() ? "text-cyan-500" : "text-muted-foreground"}`}>
              <FilterIcon className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40">
            <select
              value={currentFilter}
              onChange={(e) => column.setFilterValue(e.target.value)}
              className="w-full p-1 text-xs border rounded"
            >
              <option value="">Todos</option>
              <option value="desktop">Desktop</option>
              <option value="laptop">Laptop</option>
            </select>
          </PopoverContent>
        </Popover>
      </div>
    );
  },
  },
  {
    accessorKey: "img",
    header: "Imagen",
    cell: ({ row }) => (
      <div className="grid grid-cols-4 items-center gap-4">
                <Avatar className="col-span-3 w-24 h-24">
                  <AvatarImage src={row.getValue("img")} alt="Imagen Modelo" />
                  <AvatarFallback>
                    <ImageIcon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
        </div>
    ),
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const modelo = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Ver detalles</DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuItem onClick={() => handleOpenEditModal(modelo)}
                >Editar modelo</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Eliminar modelo</DropdownMenuItem>
              </>      
              )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]


  const table = useReactTable({
    data: modelos,
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

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const modelosResponse = await fetch('/api/modelos');
      const marcasResponse = await fetch('/api/marcas');

      if (!modelosResponse.ok) {
        throw new Error(`Error fetching modelos: ${modelosResponse.status}`);
      }

      if (!marcasResponse.ok) {
        throw new Error(`Error fetching marcas: ${marcasResponse.status}`);
      }

      const modelosData: Modelo[] = await modelosResponse.json();
      const marcasData: { id: string; nombre: string }[] = await marcasResponse.json();

      setModelos(modelosData);
      setMarcas(marcasData);
      setIsLoading(false);
    } catch (error: any) {
      showToast.error("¡Error en Cargar!"+ (error.message), {
          duration: 4000,
          progress: false,
          position: "top-right",
          transition: "popUp",
          icon: '',
          sound: true,
      });
    }
  };

  React.useEffect(() => {
    fetchAllData();
  }, []);

  const handleOpenEditModal = (modelo: Modelo) => {
    setEditingModelo(modelo);
    setIsEditModalOpen(true);
  };

    const handleCreateModel = async (data: FormData) => {
    try {
        const response = await fetch('/api/modelos', {
            method: 'POST',
            body: data, // <--- THIS IS THE ONLY BODY THAT SHOULD BE SENT
        });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `Error creando modelo: ${response.statusText}`);
    }

      showToast.success("Modelo creado correctamente 👍",{
        duration: 4000,
        progress: false,
        position: "top-right",
        transition: "popUp",
        icon: '',
        sound: false,  
      })
      setIsCreateModalOpen(false);
      fetchAllData();
    } catch (error: any) {
       showToast.error("Error en Guardar el Equipo:" + (error.message), {
          duration: 4000,
          progress: false,
          position: "top-right",
          transition: "popUp",
          icon: '',
          sound: false,
      });
    }
  };

   const handleDelete = async ({id}: {id: string}) => {
      setIsLoading(true);
      try {
          const response = await fetch(`/api/modelos/${id}`, {
          method: 'DELETE',
          });
  
          if (!response.ok) {
          throw new Error('Error al eliminar el modelo.');
          }
  
          showToast.success("Modelo eliminado correctamente.");
          fetchAllData();
      } catch (error) {
          console.error(error);
          showToast.error("No se pudo eliminar el Modelo.");
      } finally {
          setIsLoading(false);
      }
      };

  // No se usa
     const handleUpdateModel = async (data: FormData) => {
    if (!editingModelo) return;

    try {
      // 2. Realiza la petición fetch
      const response = await fetch(`/api/modelos/${editingModelo.id}`, {
        method: 'PUT',
        // 3. ¡IMPORTANTE! No establezcas el header 'Content-Type'.
        //    El navegador lo configurará automáticamente a 'multipart/form-data' con el 'boundary' correcto.
        body: data, // 4. Envía el objeto FormData directamente
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Error actualizando modelo: ${response.statusText}`);
      }
      showToast.success("Modelo actualizado correctamente ✨",{
        duration: 4000,
        progress: false,
        position: "top-right",
        transition: "popUp",
        icon: '',
        sound: false,  
      })
      setIsEditModalOpen(false);
      setEditingModelo(null);
      await fetchAllData();
    } catch (error: any) {
     showToast.error("Error en Guardar el Modelo:" + (error.message), {
          duration: 4000,
          progress: false,
          position: "top-right",
          transition: "popUp",
          icon: '',
          sound: false,
      });
    }
  };

  

  // Aplicar filtro de búsqueda
  React.useEffect(() => {
    if (searchQuery) {
      table.getColumn("nombre")?.setFilterValue(searchQuery)
    } else {
      table.getColumn("nombre")?.setFilterValue("")
    }
  }, [table, searchQuery])

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="bg-primary/5 rounded-t-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-2xl font-bold">Modelos</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar modelos..."
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
                          {column.id === "tipo"
                              ? "Tipo"
                              : column.id === "estado"
                                ? "Estado"
                                : column.id === "Modelo"
                                  ? "Modelo"
                                  : column.id === "marca"
                                    ? "Marca"
                                    : column.id === "usuario"
                                      ? "Usuario"
                                      : column.id}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button onClick={() => setIsCreateModalOpen(true)}>
                          <PlusIcon className="mr-2 h-4 w-4" />
                          Agregar Modelo
                        </Button>
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
      <ModeloForm
              isOpen={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
              onSubmit={handleCreateModel}
              marcas={marcas}
            />

            {/* Edit Modal */}
            <ModeloForm
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setEditingModelo(null);
              }}
              onSubmit={handleUpdateModel} // Usamos el handler de actualización
              initialData={editingModelo ? { // Mapeamos los datos del modelo a editar
                nombre: editingModelo.nombre,
                marca: editingModelo.marca.id, // Pasamos solo el ID de la marca
                tipo: editingModelo.tipo,
                img: typeof editingModelo.img === "string" ? editingModelo.img : null,
              } : null}
              marcas={marcas}
              key={editingModelo?.id || 'create'} // La key es crucial para que React reinicie el form
            />
    </Card>
  )
}
