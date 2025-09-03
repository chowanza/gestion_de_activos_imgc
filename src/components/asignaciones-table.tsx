"use client"

import { Checkbox } from "@radix-ui/react-checkbox";
import { ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable, VisibilityState } from "@tanstack/react-table";
import React from "react";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { ArchiveRestore, ChevronLeftIcon, ChevronRightIcon, ColumnsIcon, ImageIcon, MoreHorizontalIcon, PlusIcon, User2Icon, WrenchIcon, XCircleIcon } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FilterIcon } from "lucide-react"
import Link from "next/link";
import { formatDate } from "@/utils/formatDate";




// Type for Modelo objects from API (assuming it includes an 'id' and 'marca' might be an object)
export interface Asignaciones {
  id: string,
  date: string,
  action: string,
  item: {tipo: string, serial: string, descripcion: string},
  asignadoA: {nombre: string},
  notes: string,
  gerente: string,
  serialC: string,
  modeloC: string,
  motivo: string,
  localidad: string, // Assuming 'marca' is an object in the fetched data
}



interface AsignacionesTableProps {
  data: Asignaciones[]
}

export function AsignacionesTable({}: AsignacionesTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [searchQuery, setSearchQuery] = React.useState("")
  const [asignaciones, setAsignaciones] = React.useState<Asignaciones[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);



 const handleDownload = React.useCallback(async (assignmentId: string) => {
    setLoading(true);
    setError(null);

    try {
      // La URL incluye el ID de la asignación.
      const response = await fetch(`/api/asignaciones/generar-nota/${assignmentId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al generar la nota de entrega.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Nota_Entrega_${assignmentId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err: any) {
      console.error('Error durante la descarga:', err);
      setError(err.message);
      // Opcional: mostrar una notificación de error al usuario
    } finally {
      setLoading(false);
    }
  }, []);


const columns: ColumnDef<Asignaciones>[] = [
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
      id: "serial", // <--- 1. AÑADE UN ID EXPLÍCITO Y SIMPLE
      accessorKey: "item.serial",
      header: ({ column }) => (
        <div className="flex items-center">
          <span>Serial</span>
          <Input
            placeholder="Buscar serial..."
            value={(column.getFilterValue() as string) ?? ""}
            onChange={(e) => column.setFilterValue(e.target.value)}
            className="h-8 ml-2 w-40"
          />
        </div>
      ),
    },
  {
    accessorKey: "motivo",
    header: "Motivo",
    cell: ({ row }) => <div>{row.getValue("motivo")}</div>,
  },
    {
      accessorFn: (row) => row.item.descripcion,
      id: "itemNombre", // El ID único para la columna sigue siendo importante
      header: "Equipo",
      // CORRECCIÓN: Usamos `row.original` dentro de la celda para una mayor fiabilidad
      cell: ({ row }) => {
          // `row.original` es el objeto `Dispositivo` completo para esta fila
          const itemNombre = row.original.item.descripcion;
          return <div>{itemNombre || "Sin marca"}</div>;
      },
    },
    {
    accessorKey: "asignadoA.nombre",
    header: ({ column }) => {
      const isFilterActive = !!column.getFilterValue();
      
      return (
        <div className="flex items-center">
          <span>Usuario</span>
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
              <Input
                placeholder="Buscar usuario..."
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(e) => column.setFilterValue(e.target.value)}
                className="h-8"
              />
            </PopoverContent>
          </Popover>
        </div>
      );
    },
    cell: ({ row }) => {
      const usuario = row.original.asignadoA;
      return <div>{`${usuario.nombre}`}</div>;
    },
    filterFn: (row, id, value) => {
      if (!value) return true;
      const usuario = row.original.asignadoA;
      const searchStr = `${usuario.nombre}`.toLowerCase();
      return searchStr.includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "date",
    header: "Fecha de Asignación",
    cell: ({ row }) => {
      const date = formatDate(row.getValue("date"));
      return <div>{date}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const asignacion = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(asignacion.item.serial.toString())}>
              Copiar Serial
            </DropdownMenuItem>
               <DropdownMenuItem
                onClick={() => handleDownload(asignacion.id)}
                disabled={loading} // Se deshabilita mientras carga
              >
                {loading ? 'Generando...' : 'Descargar Excel'}
              </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/asignaciones/${asignacion.id}/editar`}>
                  Editar Usuario
              </Link>
              </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Eliminar equipo</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

  const table = useReactTable({
    data: asignaciones,
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
      try {
        const usuariosResponse = await fetch('/api/asignaciones');

  
        if (!usuariosResponse.ok) {
          throw new Error(`Error fetching usuarios: ${usuariosResponse.status}`);
        }
  
        const usuariosData: Asignaciones[] = await usuariosResponse.json();
        
        setAsignaciones(usuariosData);

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
  table.getColumn("serial")?.setFilterValue(searchQuery ?? "");
}, [table, searchQuery]);;

return (
    <Card className="border-none shadow-md">
      <CardHeader className="bg-primary/5 rounded-t-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-2xl font-bold">Asignaciones</CardTitle>
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
                <Link href="/asignaciones/new">
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Nueva Asignación
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
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No se encontraron resultados.
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
