"use client"

import { Checkbox } from "@radix-ui/react-checkbox";
import { ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable, VisibilityState } from "@tanstack/react-table";
import React, { useState } from "react";
import {z} from "zod";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { AlertDialog, AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { FilterIcon } from "lucide-react";
import { ArchiveRestore, ChevronLeftIcon, ChevronRightIcon, ColumnsIcon, ImageIcon, MoreHorizontalIcon, PlusIcon, User2Icon, WrenchIcon, XCircleIcon } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TableRowSkeleton from "@/utils/loading";

export const usuarioSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    departamentoId: z.string().min(1, "La Marca es Requerida"),
    apellido: z.string().min(1, "El Estado de dispositivo es requerido"),
    cargo: z.string().nullable(),
    ced: z.string().nullable(),
    legajo: z.number().nullable(),
})

export type UsuarioFormData = z.infer<typeof usuarioSchema>

// Type for Modelo objects from API (assuming it includes an 'id' and 'marca' might be an object)
export interface Usuario {
    id: string; // Or number, depending on your API
    nombre: string;
    apellido: string;
    cargo: string;
    ced: string;
    legajo: number;
    departamento: { id: string; nombre: string;  gerencia: { nombre?: string } }; // Assuming 'marca' is an object in the fetched data
}



interface UsuarioTableProps {
  data: Usuario[]
}

export function UsuarioTable({}: UsuarioTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [searchQuery, setSearchQuery] = React.useState("")
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setLoading] = useState(false);

  // Función para manejar la eliminación
  const handleDelete = async ({id}: {id: string}) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el usuario.');
      }

      showToast.success("Usuario eliminado correctamente.");
      fetchAllData();
      router.refresh(); // Refresca los datos en la página actual (App Router)
    } catch (error) {
      console.error(error);
      showToast.error("No se pudo eliminar el usuario.");
    } finally {
      setIsDeleting(false);
    }
  };

const columns: ColumnDef<Usuario>[] = [
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
    cell: ({ row }) => <div>{row.getValue("nombre")}</div>,
    filterFn: (row, id, value) => {
      const nombre = row.getValue(id)?.toString().toLowerCase() || '';
      return nombre.includes(value);
    },
  },
  {
    accessorKey: "apellido",
    header: "Apellido",
    cell: ({ row }) => <div>{row.getValue("apellido")}</div>,
    filterFn: (row, id, value) => {
      const apellido = row.getValue(id)?.toString().toLowerCase() || '';
      return apellido.includes(value);
    },
  },  
  {
    accessorFn: (row) => row.departamento?.gerencia?.nombre ?? "Sin gerencia",
    id: "gerenciaNombre",
    header: ({ column }) => {
      const isFilterActive = !!column.getFilterValue();
      // Obtener gerencias únicas
      const uniqueGerencias = Array.from(
        new Set(
          usuarios
            .map(u => u.departamento?.gerencia?.nombre)
            .filter(Boolean) as string[]
        )
      ).sort();

      return (
        <div className="flex items-center">
          <span>Gerencia</span>
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
            <PopoverContent className="w-48 p-2">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all-gerencias"
                    checked={uniqueGerencias.every(g => 
                      (column.getFilterValue() as string[] || []).includes(g)
                    )}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        column.setFilterValue(uniqueGerencias);
                      } else {
                        column.setFilterValue([]);
                      }
                    }}
                  />
                  <label htmlFor="select-all-gerencias" className="text-sm">
                    Seleccionar todas
                  </label>
                </div>
                {uniqueGerencias.map((gerencia) => (
                  <div key={gerencia} className="flex items-center space-x-2">
                    <Checkbox
                      id={`gerencia-${gerencia}`}
                      checked={(column.getFilterValue() as string[] || []).includes(gerencia)}
                      onCheckedChange={(checked) => {
                        const currentFilters = (column.getFilterValue() as string[] || []);
                        if (checked) {
                          column.setFilterValue([...currentFilters, gerencia]);
                        } else {
                          column.setFilterValue(currentFilters.filter(g => g !== gerencia));
                        }
                      }}
                    />
                    <label htmlFor={`gerencia-${gerencia}`} className="text-sm">
                      {gerencia}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      );
    },
    cell: ({ row }) => {
      const gerenciaNombre = row.original.departamento?.gerencia?.nombre;
      return <div>{gerenciaNombre || "Sin gerencia"}</div>;
    },
    filterFn: (row, id, value) => {
      if (!value || value.length === 0) return true;
      const gerencia = row.original.departamento?.gerencia?.nombre;
      return value.includes(gerencia);
    },
  },
  {
    accessorFn: (row) => row.departamento?.nombre ?? "Sin departamento",
    id: "departamentoNombre",
    header: ({ column }) => {
      const isFilterActive = !!column.getFilterValue();
      // Obtener departamentos únicos
      const uniqueDepartamentos = Array.from(
        new Set(
          usuarios
            .map(u => u.departamento?.nombre)
            .filter(Boolean) as string[]
        )
      ).sort();

      return (
        <div className="flex items-center">
          <span>Departamento</span>
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
            <PopoverContent className="w-48 p-2">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all-departamentos"
                    checked={uniqueDepartamentos.every(d => 
                      (column.getFilterValue() as string[] || []).includes(d)
                    )}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        column.setFilterValue(uniqueDepartamentos);
                      } else {
                        column.setFilterValue([]);
                      }
                    }}
                  />
                  <label htmlFor="select-all-departamentos" className="text-sm">
                    Seleccionar todos
                  </label>
                </div>
                {uniqueDepartamentos.map((departamento) => (
                  <div key={departamento} className="flex items-center space-x-2">
                    <Checkbox
                      id={`departamento-${departamento}`}
                      checked={(column.getFilterValue() as string[] || []).includes(departamento)}
                      onCheckedChange={(checked) => {
                        const currentFilters = (column.getFilterValue() as string[] || []);
                        if (checked) {
                          column.setFilterValue([...currentFilters, departamento]);
                        } else {
                          column.setFilterValue(currentFilters.filter(d => d !== departamento));
                        }
                      }}
                    />
                    <label htmlFor={`departamento-${departamento}`} className="text-sm">
                      {departamento}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      );
    },
    cell: ({ row }) => {
      const departamentoNombre = row.original.departamento?.nombre;
      return <div>{departamentoNombre || "Sin departamento"}</div>;
    },
    filterFn: (row, id, value) => {
      if (!value || value.length === 0) return true;
      const departamento = row.original.departamento?.nombre;
      return value.includes(departamento);
    },
  },
    {
      accessorKey: "legajo",
      header: "Legajo",
    },
    {
      accessorKey: "cargo",
      header: "Cargo",
    },
  {
    id: "actions",
    cell: ({ row }) => {
      const usuario = row.original

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
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(usuario.legajo.toString())}>
                Copiar Legajo
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/usuarios/${usuario.id}/asigned`}>
                  Ver Asignados
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/usuarios/${usuario.id}/editar`}>
                    Editar Usuario
                </Link>
                </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                  Eliminar Usuario
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Contenido del Diálogo de Confirmación */}
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario
                y borrará sus datos de nuestros servidores.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeleting}
                onClick={() => handleDelete({ id: usuario.id })}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Eliminando..." : "Sí, eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
      )
    },
  },
]

  const table = useReactTable({
    data: usuarios,
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
    globalFilterFn: (row, columnId, filterValue) => {
    if (!filterValue) return true;
    
    const search = filterValue.toLowerCase();
    const nombre = row.getValue('nombre')?.toString().toLowerCase() || '';
    const apellido = row.getValue('apellido')?.toString().toLowerCase() || '';
    
    return nombre.includes(search) || apellido.includes(search);
  },
  });

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const usuariosResponse = await fetch('/api/usuarios');

  
        if (!usuariosResponse.ok) {
          throw new Error(`Error fetching usuarios: ${usuariosResponse.status}`);
        }
  
        const usuariosData: Usuario[] = await usuariosResponse.json();
        
        setUsuarios(usuariosData);
        setLoading(false);

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
  

React.useEffect(() => {
  table.setGlobalFilter(searchQuery);
}, [table, searchQuery]);

return (
    <Card className="border-none shadow-md">
      <CardHeader className="bg-primary/5 rounded-t-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-2xl font-bold">Usuarios</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar por nombre..."
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
                          {column.id === "legajo"
                              ? "Legajo"
                              : column.id === "ced"
                                ? "Cedula"
                                : column.id === "departamento"
                                  ? "Departamento"
                                    : column.id === "cargo"
                                        ? "Cargo" 
                                                    : column.id}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button asChild>
                <Link href="/usuarios/new">
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Agregar Usuario
                </Link>
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
    </Card>
  )

}
