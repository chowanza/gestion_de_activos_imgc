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
  MoreHorizontalIcon,
  PlusIcon,
  FilterIcon,
  ArchiveRestore,
  WrenchIcon,
  CheckCircle,
  CircleX,
  CircleMinus,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { showToast } from "nextjs-toast-notify";
import LineaForm from "./LineaForm"
import { useIsAdmin } from "@/hooks/useIsAdmin"
import TableRowSkeleton from "@/utils/loading"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog"

export const lineaSchema = z.object({
  numero: z.string().min(1, "El número es requerido"),
  proveedor: z.string().min(1, "El proveedor es requerido"),
  imei: z.string().nullable(),
})

export type LineaFormData = z.infer<typeof lineaSchema>

// Type for Modelo objects from API (assuming it includes an 'id' and 'marca' might be an object)
export interface Asignacion {
  actionType: string;
  targetType: string;
  targetUsuario?: {
    nombre: string;
    apellido: string;
  };
  targetDepartamento?: {
    nombre: string;
  };
}

export interface Linea {
  id: string; // Or number, depending on your API
  numero: string;
  proveedor: string;
  imei?: string | null;
  estado?: string | null;
  destino?: string | null;
  asignaciones?: Asignacion[];
  // Add any other fields that come from your API
}


export interface LineaFormProps {
  onCreateModel: (data: LineaFormData) => void;
  initialData?: {
    numero: string;
    proveedor: string;
    imei: string | null;
    estado?: string | null;
    destino?: string | null;
  };
}


interface LineasTableProps {
  data: Linea[]
}

export function LineasTable({ data }: LineasTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingLinea, setEditingLinea] = React.useState<Linea | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("")
  const [lineas, setLineas] = React.useState<Linea[]>([]);
  const [proveedor, setProveedores] = React.useState<{ id: string; nombre: string }[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const isAdmin = useIsAdmin();

const columns: ColumnDef<Linea>[] = [
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
    accessorKey: "numero",
    header: "Número",
  },
  {
    accessorKey: "proveedor",
    header: ({ column }) => (
    <div className="flex items-center">
      <span>Proveedor</span>
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
            <option value="">Todos</option>
            {proveedor.map((p) => (
              <option key={p.id} value={p.nombre}>
                {p.nombre}
              </option>
            ))}
          </select>
        </PopoverContent>
      </Popover>
    </div>
  ),
  },
  {
    accessorKey: "destino",
    header: "Destino",
  },
 {accessorKey: "estado",
  header: ({ column }) => {
    const isFilterActive = !!column.getFilterValue();
    const estadosUnicos = ["activa", "inactiva"]; // Ajusta según tus estados
    
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
        {estado === "activa" ? (
          <CheckCircle className="h-4 w-4 text-green-300" />
        ) : estado === "inactiva" ? (
          <CircleX className="h-4 w-4 text-red-500" />
        ) : <CircleMinus className="h-4 w-4 text-amber-500" /> }
      </div>
    );
  },
  filterFn: (row, id, value) => {
    return value.includes(row.getValue(id));
  },
},
    {
      id: "asignadoA", // Un ID único para la columna
      header: "Asignado a",
      cell: ({ row }) => {
        const linea = row.original;
        const ultimaAsignacion = linea.asignaciones?.[0]; // Obtenemos la primera (y única) asignación

        if (!ultimaAsignacion || ultimaAsignacion.actionType === 'Devolución') {
          return <span className="text-muted-foreground">Sin Asignar</span>;
        }

        if (ultimaAsignacion.targetType === "Usuario" && ultimaAsignacion.targetUsuario) {
          return `${ultimaAsignacion.targetUsuario.nombre} ${ultimaAsignacion.targetUsuario.apellido}`;
        }

        if (ultimaAsignacion.targetType === "Departamento" && ultimaAsignacion.targetDepartamento) {
          return `Dpto: ${ultimaAsignacion.targetDepartamento.nombre}`;
        }

        return <span className="text-muted-foreground">No disponible</span>;
      },
    },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const linea = row.original

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
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => handleOpenEditModal(linea)}
                      >Editar Linea</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Eliminar Linea</DropdownMenuItem>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            Eliminar Linea
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
                  Esta acción no se puede deshacer. Esto eliminará permanentemente la línea
                  y borrará sus datos de nuestros servidores.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                  disabled={isLoading}
                  onClick={() => handleDelete({ id: linea.id })}
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
    data: lineas,
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
      const lineasResponse = await fetch('/api/lineas');

      if (!lineasResponse.ok) {
        throw new Error(`Error fetching lineas: ${lineasResponse.status}`);
      }


      const lineasData: Linea[] = await lineasResponse.json();
      // Extraer proveedores únicos de las líneas
      const proveedoresUnicos = Array.from(
        new Set(lineasData.map((linea) => linea.proveedor))
      ).map((nombre, idx) => ({
        id: idx.toString(),
        nombre,
      }));

      setLineas(lineasData);
      setProveedores(proveedoresUnicos);
      setIsLoading(false); // <-- Nuevo estado para proveedores únicos
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

  const handleOpenEditModal = (linea: Linea) => {
    setEditingLinea(linea);
    setIsEditModalOpen(true);
  };

    const handleCreateModel = async (data: LineaFormData) => {
    try{
        const response = await fetch('/api/lineas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `Error creando linea: ${response.statusText}`);
    }

      showToast.success("linea creada correctamente 👍",{
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
       showToast.error("Error en Guardar la Linea:" + (error.message), {
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
          const response = await fetch(`/api/lineas/${id}`, {
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

    const handleUpdateModel = async (data: LineaFormData) => {
      if (!editingLinea) return;
  
      try {


      // 2. Realiza la petición fetch
      const response = await fetch(`/api/lineas/${editingLinea.id}`, {
        method: 'PUT',
        // 3. ¡IMPORTANTE! No establezcas el header 'Content-Type'.
        //    El navegador lo configurará automáticamente a 'multipart/form-data' con el 'boundary' correcto.
        body: JSON.stringify(data), // Serializa el objeto a JSON
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Error actualizando linea: ${response.statusText}`);
      }
      showToast.success("linea actualizada correctamente ✨",{
        duration: 4000,
        progress: false,
        position: "top-right",
        transition: "popUp",
        icon: '',
        sound: false,  
      })
      setIsEditModalOpen(false);
      setEditingLinea(null);
      await fetchAllData();
    } catch (error: any) {
     showToast.error("Error en Guardar la linea:" + (error.message), {
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
      table.getColumn("numero")?.setFilterValue(searchQuery)
    } else {
      table.getColumn("numero")?.setFilterValue("")
    }
  }, [table, searchQuery])

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="bg-primary/5 rounded-t-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-2xl font-bold">Líneas Telefónicas</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar lineas..."
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
                          {column.id === "numero"
                              ? "Número"
                              : column.id === "estado"
                                ? "Estado"
                                : column.id === "linea"
                                  ? "Linea"
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
            {isAdmin && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Agregar Linea
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
      <LineaForm
              isOpen={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
              onSubmit={handleCreateModel}
            />
            <LineaForm
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setEditingLinea(null);
              }}
              onSubmit={handleUpdateModel} // Usamos el handler de actualización
              initialData={editingLinea ? { // Mapeamos los datos del linea a editar
                numero: editingLinea.numero,
                proveedor: editingLinea.proveedor, // Pasamos solo el ID de la marca
                imei: typeof editingLinea.imei === "string" ? editingLinea.imei : null,
              } : null}
              key={editingLinea?.id || 'create'} // La key es crucial para que React reinicie el form
            />
    </Card>
  )
}
