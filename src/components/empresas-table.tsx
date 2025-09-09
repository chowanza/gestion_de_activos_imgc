"use client";

import * as React from "react";
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
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ColumnsIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { showToast } from "nextjs-toast-notify";
import TableRowSkeleton from "@/utils/loading";
import { EmpresaForm } from "./EmpresaForm";
import { EmpresaDetails } from "./EmpresaDetails";
import { useDataRefresh, DATA_REFRESH_EVENTS } from "@/hooks/useDataRefresh";
import { useRouter } from "next/navigation";

// Types
export interface Empresa {
  id: string;
  nombre: string;
  descripcion?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
  departamentos?: {
    id: string;
    nombre: string;
    gerente?: {
      id: string;
      nombre: string;
      apellido: string;
    } | null;
    empleados: {
      id: string;
      nombre: string;
      apellido: string;
      cargo?: {
        nombre: string;
      } | null;
    }[];
    computadores: any[];
    dispositivos: any[];
  }[];
  _count?: {
    departamentos: number;
  };
}

export interface EmpresaFormData {
  nombre: string;
  descripcion?: string;
  logo?: string | File | null;
}

// Main component
export function EmpresasTable() {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [searchQuery, setSearchQuery] = React.useState("");
  const [empresas, setEmpresas] = React.useState<Empresa[]>([]);
  const [isLoading, setLoading] = React.useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false);
  const [editingEmpresa, setEditingEmpresa] = React.useState<Empresa | null>(null);
  const [selectedEmpresa, setSelectedEmpresa] = React.useState<Empresa | null>(null);

  // Handlers
  const handleViewDetails = (empresa: Empresa) => {
    // Navegar a la página de detalles de la empresa
    router.push(`/empresas/${empresa.id}`);
  };

  const handleEditEmpresa = (empresa: Empresa) => {
    setEditingEmpresa(empresa);
    setIsEditModalOpen(true);
  };

  const handleDeleteEmpresa = async (empresa: Empresa) => {
    if (confirm(`¿Estás seguro de que quieres eliminar la empresa "${empresa.nombre}"?`)) {
      try {
        const response = await fetch(`/api/empresas/${empresa.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Error al eliminar la empresa' }));
          throw new Error(errorData.error || 'Error al eliminar la empresa');
        }

        showToast.success("Empresa eliminada correctamente");
        await fetchEmpresas();
      } catch (error: any) {
        showToast.error(error.message || "No se pudo eliminar la empresa");
      }
    }
  };

  // Columns definition
  const columns: ColumnDef<Empresa>[] = [
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
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("nombre")}</div>
    ),
  },
  {
    accessorKey: "descripcion",
    header: "Descripción",
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate">
        {row.getValue("descripcion") || "Sin descripción"}
      </div>
    ),
  },
  {
    accessorKey: "_count.departamentos",
    header: "Departamentos",
    cell: ({ row }) => {
      const count = row.original._count?.departamentos || 0;
      return (
        <Badge variant={count > 0 ? "default" : "secondary"}>
          {count} departamento{count !== 1 ? 's' : ''}
        </Badge>
      );
    },
  },
  {
    accessorKey: "logo",
    header: "Logo",
    cell: ({ row }) => {
      const logo = row.getValue("logo") as string;
      return (
        <div className="flex items-center">
          {logo ? (
            <img
              src={logo}
              alt="Logo de la empresa"
              className="w-10 h-10 object-cover rounded-lg border"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-xs">
              Sin logo
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const empresa = row.original;

      return (
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
              onClick={() => navigator.clipboard.writeText(empresa.id)}
            >
              Copiar ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleViewDetails(empresa)}>
              Ver Detalles
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleEditEmpresa(empresa)}>
              Editar Empresa
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDeleteEmpresa(empresa)}
              className="text-red-600"
            >
              Eliminar Empresa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

  const fetchEmpresas = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/empresas');
      if (!response.ok) {
        throw new Error(`Error fetching empresas: ${response.status}`);
      }
      const data: Empresa[] = await response.json();
      setEmpresas(data);
    } catch (error: any) {
      showToast.error("¡Error al cargar empresas!" + error.message, {
        duration: 4000,
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const table = useReactTable({
    data: empresas,
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
      const descripcion = row.getValue('descripcion')?.toString().toLowerCase() || '';
      
      return nombre.includes(search) || descripcion.includes(search);
    },
  });

  React.useEffect(() => {
    fetchEmpresas();
  }, []);

  // Escuchar cambios en departamentos para actualizar el conteo
  useDataRefresh(DATA_REFRESH_EVENTS.EMPRESAS_CHANGED, fetchEmpresas);

  React.useEffect(() => {
    table.setGlobalFilter(searchQuery);
  }, [table, searchQuery]);

  const handleCreateEmpresa = async (data: EmpresaFormData) => {
    try {
      const formData = new FormData();
      formData.append('nombre', data.nombre);
      if (data.descripcion) {
        formData.append('descripcion', data.descripcion);
      }
      if (data.logo) {
        formData.append('logo', data.logo);
      }

      const response = await fetch('/api/empresas', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Error ${response.status}: ${response.statusText}` }));
        throw new Error(errorData.message || `Error creando empresa`);
      }

      showToast.success("Empresa creada correctamente 👍", { duration: 4000, position: "top-right" });
      setIsCreateModalOpen(false);
      await fetchEmpresas();
    } catch (error: any) {
      showToast.error(`Error al guardar la empresa: ${error.message}`, { duration: 4000, position: "top-right" });
    }
  };

  const handleUpdateEmpresa = async (data: EmpresaFormData) => {
    if (!editingEmpresa) return;

    try {
      const formData = new FormData();
      formData.append('nombre', data.nombre);
      if (data.descripcion) {
        formData.append('descripcion', data.descripcion);
      }
      if (data.logo) {
        formData.append('logo', data.logo);
      }

      const response = await fetch(`/api/empresas/${editingEmpresa.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Error ${response.status}: ${response.statusText}` }));
        throw new Error(errorData.message || `Error actualizando empresa`);
      }

      showToast.success("Empresa actualizada correctamente 👍", { duration: 4000, position: "top-right" });
      setIsEditModalOpen(false);
      setEditingEmpresa(null);
      await fetchEmpresas();
    } catch (error: any) {
      showToast.error(`Error al actualizar la empresa: ${error.message}`, { duration: 4000, position: "top-right" });
    }
  };

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="bg-primary/5 rounded-t-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-2xl font-bold">Empresas</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar por nombre o descripción..."
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
                          {column.id === "descripcion" ? "Descripción" :
                           column.id === "logo" ? "Logo" :
                           column.id === "_count.departamentos" ? "Departamentos" :
                           column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button onClick={() => setIsCreateModalOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Agregar Empresa
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
                    );
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
                    {searchQuery ? "No se encontraron empresas con ese filtro." : "No hay empresas registradas."}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Create Modal */}
      <EmpresaForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateEmpresa}
      />

      {/* Edit Modal */}
      <EmpresaForm
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingEmpresa(null);
        }}
        onSubmit={handleUpdateEmpresa}
        initialData={editingEmpresa ? {
          nombre: editingEmpresa.nombre,
          descripcion: editingEmpresa.descripcion || undefined,
          logo: editingEmpresa.logo || undefined
        } : null}
        isEditing={true}
      />

      {/* Details Modal */}
      <EmpresaDetails
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedEmpresa(null);
        }}
        empresa={selectedEmpresa}
      />
    </Card>
  );
}
