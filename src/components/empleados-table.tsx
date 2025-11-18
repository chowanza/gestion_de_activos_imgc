"use client"

import { Checkbox } from "@radix-ui/react-checkbox";
import { ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable, VisibilityState } from "@tanstack/react-table";
import React, { useState } from "react";
import {z} from "zod";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
import TableRowSkeleton, { LoadingSpinner } from "@/utils/loading";
import { usePermissions } from "@/hooks/usePermissions";

export const empleadoSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    departamentoId: z.string().min(1, "El departamento es requerido"),
    apellido: z.string().min(1, "El apellido es requerido"),
    cargoId: z.string().optional(),
    cedula: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    fechaNacimiento: z.string().optional(),
    fechaIngreso: z.string().optional(),
})

export type EmpleadoFormData = z.infer<typeof empleadoSchema>

// Type for Empleado objects from API
export interface Empleado {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  fechaIngreso?: string;
  fechaDesincorporacion?: string;
  fotoPerfil?: string;
  estado?: string;
  departamento?: { 
    id: string; 
    nombre: string; 
    empresa?: { nombre: string } 
  };
  cargo?: { 
    id: string; 
    nombre: string; 
    descripcion: string 
  };
  organizaciones?: Array<{
    empresa?: { nombre: string };
    departamento?: { nombre: string };
    cargo?: { nombre: string };
  }>;
}



interface EmpleadoTableProps {
  data: Empleado[]
}

export function EmpleadoTable({ data }: EmpleadoTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    email: false,
    telefono: false,
    direccion: false,
    fechaDesincorporacion: false,
    fechaNacimiento: false,
    edad: false
  })
  const [rowSelection, setRowSelection] = React.useState({})
  const [searchQuery, setSearchQuery] = React.useState("")
  // const [empleados, setEmpleados] = React.useState<Empleado[]>([]);
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const { hasPermission } = usePermissions();
  const canManageUsers = hasPermission('canManageUsers');
  const canCreate = hasPermission('canCreate') || canManageUsers;
  const canEdit = hasPermission('canUpdate') || canManageUsers;
  const canRemove = hasPermission('canDelete') || canManageUsers;

  // Función para manejar la eliminación
  const handleDelete = async ({id}: {id: string}) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Error al eliminar el empleado';
        
        // Manejar diferentes tipos de errores
        if (response.status === 404) {
          showToast.error("Empleado no encontrado.");
        } else if (response.status === 409) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.tipo === 'restriccion_equipos_asignados') {
            const equipos = errorData.detalles?.equipos || [];
            const equiposLista = equipos.map((e: any) => `${e.tipo} ${e.serial}`).join(', ');
            showToast.error(`No se puede desactivar al empleado porque tiene equipos asignados: ${equiposLista}. Primero debe desasignar los equipos.`);
          } else {
            showToast.error("No se puede eliminar al empleado porque tiene activos asignados o roles activos. Desasigne o desactive primero.");
          }
        } else {
          showToast.error(`Error: ${errorMessage}`);
        }
        return;
      }

      const result = await response.json();
      
      // Manejar diferentes tipos de eliminación
      if (result.tipo === 'desincorporacion_logica') {
        showToast.success(`Empleado desincorporado exitosamente. Se desactivaron ${result.detalles?.asignacionesDesactivadas || 0} asignaciones y ${result.detalles?.relacionesDesactivadas || 0} relaciones organizacionales.`);
      } else if (result.tipo === 'eliminacion_fisica') {
        showToast.success("Empleado eliminado permanentemente del sistema.");
      } else {
        showToast.success("Empleado eliminado correctamente.");
      }
      
      // fetchAllData(); // Los datos se actualizarán desde el componente padre
      router.refresh(); // Refresca los datos en la página actual (App Router)
    } catch (error) {
      console.error('Error en eliminación:', error);
      showToast.error("Error de conexión. No se pudo eliminar el empleado.");
    } finally {
      setIsDeleting(false);
    }
  };

const columns: ColumnDef<Empleado>[] = [
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
    accessorKey: "fotoPerfil",
    header: "Foto",
    size: 60,
    cell: ({ row }) => {
      const fotoPerfil = row.getValue("fotoPerfil") as string;
      const nombre = row.getValue("nombre") as string;
      const apellido = row.getValue("apellido") as string;
      
      if (fotoPerfil) {
        return (
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <img 
              src={fotoPerfil} 
              alt={`${nombre} ${apellido}`}
              className="w-full h-full object-cover"
            />
          </div>
        );
      }
      
      // Avatar por defecto con iniciales
      const iniciales = `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
      return (
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-medium text-primary">{iniciales}</span>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "nombre",
    header: "Nombre",
    size: 100,
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue("nombre")}</div>,
    filterFn: (row, id, value) => {
      const nombre = row.getValue(id)?.toString().toLowerCase() || '';
      return nombre.includes(value);
    },
  },
  {
    accessorKey: "apellido",
    header: "Apellido",
    size: 100,
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue("apellido")}</div>,
    filterFn: (row, id, value) => {
      const apellido = row.getValue(id)?.toString().toLowerCase() || '';
      return apellido.includes(value);
    },
  },
  {
    accessorKey: "cedula",
    header: "Cédula",
    size: 90,
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue("cedula")}</div>,
    filterFn: (row, id, value) => {
      const cedula = row.getValue(id)?.toString().toLowerCase() || '';
      return cedula.includes(value);
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    size: 150,
    cell: ({ row }) => {
      const email = row.getValue("email") as string;
      return email ? (
        <div className="flex items-center max-w-[180px] truncate">
          <a 
            href={`mailto:${email}`}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            <span className="truncate inline-block max-w-full align-top">{email}</span>
          </a>
        </div>
      ) : (
        <span className="text-muted-foreground italic">Sin email</span>
      );
    },
    filterFn: (row, id, value) => {
      const email = row.getValue(id)?.toString().toLowerCase() || '';
      return email.includes(value);
    },
  },
  {
    accessorKey: "telefono",
    header: "Teléfono",
    size: 100,
    cell: ({ row }) => {
      const telefono = row.getValue("telefono") as string;
      return telefono ? (
        <div className="flex items-center max-w-[140px] truncate">
          <a 
            href={`tel:${telefono}`}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            <span className="truncate inline-block max-w-full align-top">{telefono}</span>
          </a>
        </div>
      ) : (
        <span className="text-muted-foreground italic">Sin teléfono</span>
      );
    },
    filterFn: (row, id, value) => {
      const telefono = row.getValue(id)?.toString().toLowerCase() || '';
      return telefono.includes(value);
    },
  },
  {
    accessorKey: "direccion",
    header: "Dirección",
    size: 150,
    cell: ({ row }) => {
      const direccion = row.getValue("direccion") as string;
      return direccion ? (
        <div className="max-w-[220px] truncate break-words" title={direccion}>
          {direccion}
        </div>
      ) : (
        <span className="text-muted-foreground italic">Sin dirección</span>
      );
    },
    filterFn: (row, id, value) => {
      const direccion = row.getValue(id)?.toString().toLowerCase() || '';
      return direccion.includes(value);
    },
  },
  {
    accessorKey: "fechaNacimiento",
    header: "Cumpleaños",
    size: 90,
    cell: ({ row }) => {
      const fecha = row.getValue("fechaNacimiento") as string;
      if (!fecha) return <div>-</div>;
      
      // Si la fecha ya está en formato dd/mm/yy, mostrarla directamente
      if (fecha.includes('/')) {
        const [dia, mes] = fecha.split('/');
        return <div>{`${dia}/${mes}`}</div>;
      }
      
      // Si está en formato ISO, convertirla correctamente evitando problemas de zona horaria
      if (fecha.includes('-')) {
        const [year, month, day] = fecha.split('-');
        return <div>{`${day}/${month}`}</div>;
      }
      
      // Fallback para otros formatos
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) return <div>-</div>;
      
      const dia = fechaObj.getDate().toString().padStart(2, '0');
      const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
      
      return <div>{`${dia}/${mes}`}</div>;
    },
  },
  {
    accessorKey: "fechaNacimiento",
    id: "edad",
    header: "Edad",
    size: 60,
    cell: ({ row }) => {
      const fecha = row.getValue("fechaNacimiento") as string;
      if (!fecha) return <div>-</div>;
      
      let fechaNacimiento: Date;
      
      // Si la fecha está en formato dd/mm/yy, convertirla a Date
      if (fecha.includes('/')) {
        const [dia, mes, año] = fecha.split('/');
        const añoCompleto = año.length === 2 ? `20${año}` : año;
        fechaNacimiento = new Date(parseInt(añoCompleto), parseInt(mes) - 1, parseInt(dia));
      } else if (fecha.includes('-')) {
        // Si está en formato ISO, crear la fecha correctamente
        const [year, month, day] = fecha.split('-');
        fechaNacimiento = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        // Fallback para otros formatos
        fechaNacimiento = new Date(fecha);
      }
      
      if (isNaN(fechaNacimiento.getTime())) return <div>-</div>;
      
      const hoy = new Date();
      let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
      const mes = hoy.getMonth() - fechaNacimiento.getMonth();
      
      if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
        edad--;
      }
      
      return <div>{edad} años</div>;
    },
  },
  {
    accessorKey: "fechaIngreso",
    header: "Fecha de Ingreso",
    size: 100,
    cell: ({ row }) => {
      const fecha = row.getValue("fechaIngreso") as string;
      if (!fecha) return <div>-</div>;
      
      // Si la fecha ya está en formato dd/mm/yy, mostrarla directamente
      if (fecha.includes('/')) {
        return <div>{fecha}</div>;
      }
      
      // Si está en formato ISO, convertirla correctamente evitando problemas de zona horaria
      if (fecha.includes('-')) {
        const [year, month, day] = fecha.split('-');
        return <div>{`${day}/${month}/${year}`}</div>;
      }
      
      // Fallback para otros formatos
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) return <div>-</div>;
      
      const dia = fechaObj.getDate().toString().padStart(2, '0');
      const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
      const año = fechaObj.getFullYear();
      
      return <div>{`${dia}/${mes}/${año}`}</div>;
    },
  },
  {
    accessorKey: "fechaDesincorporacion",
    header: "Fecha de Desincorporación",
    size: 120,
    cell: ({ row }) => {
      const fecha = row.getValue("fechaDesincorporacion") as string;
      if (!fecha) return <div>-</div>;
      
      // Si la fecha ya está en formato dd/mm/yy, mostrarla directamente
      if (fecha.includes('/')) {
        return <div>{fecha}</div>;
      }
      
      // Si está en formato ISO, convertirla correctamente evitando problemas de zona horaria
      if (fecha.includes('-')) {
        const [year, month, day] = fecha.split('-');
        return <div>{`${day}/${month}/${year}`}</div>;
      }
      
      // Fallback para otros formatos
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) return <div>-</div>;
      
      const dia = fechaObj.getDate().toString().padStart(2, '0');
      const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
      const año = fechaObj.getFullYear();
      
      return <div>{`${dia}/${mes}/${año}`}</div>;
    },
  },
  {
    accessorFn: (row) => row.organizaciones?.[0]?.empresa?.nombre ?? "Sin empresa",
    id: "empresaNombre",
    size: 120,
    header: ({ column }) => {
      const isFilterActive = !!column.getFilterValue();
      // Obtener empresas únicas
      const uniqueEmpresas = Array.from(
        new Set(
          data
            .map(u => u.organizaciones?.[0]?.empresa?.nombre)
            .filter(Boolean) as string[]
        )
      ).sort();

      return (
        <div className="flex items-center">
          <span>Empresa</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-5 w-5 p-0 ml-1 ${isFilterActive ? "text-[#EA7704]" : "text-muted-foreground"}`}
              >
                <FilterIcon className="h-3 w-3" />
                {isFilterActive && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#EA7704]"></span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all-empresas"
                    checked={uniqueEmpresas.every(e => 
                      (column.getFilterValue() as string[] || []).includes(e)
                    )}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        column.setFilterValue(uniqueEmpresas);
                      } else {
                        column.setFilterValue([]);
                      }
                    }}
                  />
                  <label htmlFor="select-all-empresas" className="text-sm">
                    Seleccionar todas
                  </label>
                </div>
                {uniqueEmpresas.map((empresa) => (
                  <div key={empresa} className="flex items-center space-x-2">
                    <Checkbox
                      id={`empresa-${empresa}`}
                      checked={(column.getFilterValue() as string[] || []).includes(empresa)}
                      onCheckedChange={(checked) => {
                        const currentFilters = (column.getFilterValue() as string[] || []);
                        if (checked) {
                          column.setFilterValue([...currentFilters, empresa]);
                        } else {
                          column.setFilterValue(currentFilters.filter(e => e !== empresa));
                        }
                      }}
                    />
                    <label htmlFor={`empresa-${empresa}`} className="text-sm">
                      {empresa}
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
      const empresaNombre = row.original.organizaciones?.[0]?.empresa?.nombre;
      return <div className="whitespace-nowrap">{empresaNombre || "Sin empresa"}</div>;
    },
    filterFn: (row, id, value) => {
      if (!value || value.length === 0) return true;
      const empresa = row.original.organizaciones?.[0]?.empresa?.nombre;
      return value.includes(empresa);
    },
  },
  {
    accessorFn: (row) => row.organizaciones?.[0]?.departamento?.nombre ?? "Sin departamento",
    id: "departamentoNombre",
    size: 120,
    header: ({ column }) => {
      const isFilterActive = !!column.getFilterValue();
      // Obtener departamentos únicos
      const uniqueDepartamentos = Array.from(
        new Set(
          data
            .map(u => u.organizaciones?.[0]?.departamento?.nombre)
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
                className={`h-5 w-5 p-0 ml-1 ${isFilterActive ? "text-[#EA7704]" : "text-muted-foreground"}`}
              >
                <FilterIcon className="h-3 w-3" />
                {isFilterActive && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#EA7704]"></span>
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
      const departamentoNombre = row.original.organizaciones?.[0]?.departamento?.nombre;
      return <div className="whitespace-nowrap">{departamentoNombre || "Sin departamento"}</div>;
    },
    filterFn: (row, id, value) => {
      if (!value || value.length === 0) return true;
      const departamento = row.original.organizaciones?.[0]?.departamento?.nombre;
      return value.includes(departamento);
    },
  },
  {
    accessorKey: "estado",
    header: "Estado",
    size: 80,
    cell: ({ row }) => {
      const estado = row.getValue("estado") as string;
      const isActivo = estado === 'Activo';
      
      return (
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActivo 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-1.5 ${
            isActivo ? 'bg-green-400' : 'bg-red-400'
          }`} />
          {estado || 'Activo'}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (!value || value.length === 0) return true;
      const estado = row.getValue(id) as string;
      return value.includes(estado || 'Activo');
    },
  },
    {
      accessorKey: "cargo",
      header: "Cargo",
      size: 100,
      cell: ({ row }) => {
        const cargo = row.original.organizaciones?.[0]?.cargo;
        return <div className="whitespace-nowrap">{cargo ? cargo.nombre : "Sin cargo"}</div>;
      },
    },
  {
    id: "actions",
    size: 100,
    cell: ({ row }) => {
      const empleado = row.original

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
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(empleado.cedula)}>
                Copiar Cédula
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/empleados/${empleado.id}`}>
                  Ver Detalles
                </Link>
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem asChild>
                  <Link href={`/empleados/${empleado.id}/editar`}>
                      Editar Empleado
                  </Link>
                </DropdownMenuItem>
              )}
              {canRemove && <DropdownMenuSeparator />}
              {canRemove && (
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                    Eliminar Empleado
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Contenido del Diálogo de Confirmación */}
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente al empleado
                y borrará sus datos de nuestros servidores.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeleting}
                onClick={() => handleDelete({ id: empleado.id })}
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
    data: data,
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
    const cedula = row.getValue('cedula')?.toString().toLowerCase() || '';
    const telefono = row.getValue('telefono')?.toString().toLowerCase() || '';
    const direccion = row.getValue('direccion')?.toString().toLowerCase() || '';
    
    return nombre.includes(search) || apellido.includes(search) || cedula.includes(search) || 
           telefono.includes(search) || direccion.includes(search);
  },
  });

    // const fetchAllData = async () => {
    //   setLoading(true);
    //   try {
    //     const empleadosResponse = await fetch('/api/usuarios');

  
    //     if (!empleadosResponse.ok) {
    //       throw new Error(`Error fetching empleados: ${empleadosResponse.status}`);
    //     }
  
    //     const empleadosData: Empleado[] = await empleadosResponse.json();
        
        
    //     setEmpleados(empleadosData);
    //     setLoading(false);

    //   } catch (error: any) {
    //     showToast.error("¡Error en Cargar!"+ (error.message), {
    //         duration: 4000,
    //         progress: false,
    //         position: "top-right",
    //         transition: "popUp",
    //         icon: '',
    //         sound: true,
    //     });
    //   }
    // };
  
    React.useEffect(() => {
      // Los datos vienen como props, no necesitamos cargarlos aquí
      setLoading(false);
    }, [data]);
  

React.useEffect(() => {
  table.setGlobalFilter(searchQuery);
}, [table, searchQuery]);

// Verificar que la tabla esté lista antes de renderizar
if (!table || !columns || columns.length === 0 || isLoading) {
  return (
    <Card className="border-none shadow-md">
      <CardHeader className="bg-primary/5 rounded-t-lg">
        <CardTitle className="text-2xl font-bold">Empleados</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <LoadingSpinner message="Cargando tabla..." />
      </CardContent>
    </Card>
  );
}

return (
    <div className="w-full max-w-full overflow-hidden">
      <Card className="border-none shadow-md">
        <CardHeader className="bg-primary/5 rounded-t-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-2xl font-bold">Empleados</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Input
                placeholder="Buscar por nombre, apellido, cédula, teléfono o dirección..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:max-w-sm border-primary/20"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-w-[120px] justify-between">
                    <FilterIcon className="h-4 w-4 mr-2" />
                    Estado
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[150px]">
                  <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={!table.getColumn("estado")?.getFilterValue()}
                    onCheckedChange={() => table.getColumn("estado")?.setFilterValue(undefined)}
                  >
                    Todos
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={table.getColumn("estado")?.getFilterValue() === "Activo"}
                    onCheckedChange={() => table.getColumn("estado")?.setFilterValue("Activo")}
                  >
                    Activo
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={table.getColumn("estado")?.getFilterValue() === "Inactivo"}
                    onCheckedChange={() => table.getColumn("estado")?.setFilterValue("Inactivo")}
                  >
                    Inactivo
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                          {column.id === "cedula"
                              ? "Cédula"
                              : column.id === "telefono"
                                ? "Teléfono"
                                    : column.id === "direccion"
                                        ? "Dirección"
                                            : column.id === "departamento"
                                                ? "Departamento"
                                                    : column.id === "cargo"
                                                        ? "Cargo"
                                                            : column.id === "fechaIngreso"
                                                                ? "Fecha de Ingreso"
                                                                    : column.id === "fechaDesincorporacion"
                                                                        ? "Fecha de Desincorporación"
                                                                            : column.id}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {canCreate && (
              <Button asChild>
                  <Link href="/empleados/new">
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Agregar Empleado
                  </Link>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-md border overflow-x-auto">
          {/* Responsive adjustments: hide secondary columns on small screens */}
          <Table className="min-w-full table-fixed">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const smHiddenCols = new Set([
                      'email','telefono','direccion','fechaNacimiento','edad','fechaIngreso','fechaDesincorporacion','empresaNombre','departamentoNombre','cargo'
                    ]);
                    return (
                      <TableHead
                        key={header.id}
                        className={smHiddenCols.has(header.column.id as string) ? 'hidden md:table-cell' : ''}
                      >
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
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => {
                      const smHiddenCols = new Set([
                        'email','telefono','direccion','fechaNacimiento','edad','fechaIngreso','fechaDesincorporacion','empresaNombre','departamentoNombre','cargo'
                      ]);
                      const cellClass = smHiddenCols.has(cell.column.id as string) ? 'hidden md:table-cell' : '';
                      return (
                        <TableCell key={cell.id} className={`${cellClass} align-top`}> 
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {searchQuery ? "No se encontraron empleados con ese filtro." : "No hay empleados registrados."}
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
    </div>
  )

}
