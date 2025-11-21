"use client"

import React from "react";
import { ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable, VisibilityState } from "@tanstack/react-table";
import { z } from "zod";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import DispositivoForm from "./EquipoForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { usePermissions } from "@/hooks/usePermissions";
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import TableRowSkeleton from "@/utils/loading";
import { useQueryClient } from "@tanstack/react-query";

// UI primitives
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { showToast } from "nextjs-toast-notify";
import { ChevronLeftIcon, ChevronRightIcon, ColumnsIcon, ImageIcon, MoreHorizontalIcon, PlusIcon, EyeIcon, FilterIcon, CheckCircle2Icon, User2Icon, WrenchIcon, Shield, Trash2, XCircleIcon, ArrowUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dispositivoSchema = z.object({
  id: z.string().optional(),
  serial: z.string().min(1, "El serial es requerido"),
  modeloId: z.string().min(1, "El Modelo es Requerido"),
  estado: z.string().optional(),
  codigoImgc: z.string().min(1, "El Código IMGC es requerido"),
  ubicacionId: z.string().nullable(),
  mac: z.string().nullable(),
  ip: z.string().nullable(),
  descripcion: z.string().nullable(),
  fechaCompra: z.string().nullable(),
  numeroFactura: z.string().nullable(),
  proveedor: z.string().nullable(),
  monto: z.string().transform((val) => val === '' ? null : parseFloat(val)).nullable(),
  empleado: z.object({
    id: z.string(),
    nombre: z.string(),
    apellido: z.string()
  }).optional()
});

export type DispositivoFormData = z.infer<typeof dispositivoSchema>;



// Type for Dispositivo objects from API
export interface Dispositivo {
  id: string;
  serial: string;
  estado: string;
  codigoImgc: string;
  mac?: string;
  ip?: string;
  descripcion?: string | null;
  fechaCompra?: string;
  numeroFactura?: string;
  proveedor?: string;
  monto?: string;
  modelo: { 
    id: string; 
    nombre: string; 
    img?: string; 
    marca: { nombre: string };
    tipo?: string;
  } | null;
  ubicacion?: { 
    id: string; 
    nombre: string; 
    descripcion?: string; 
    direccion?: string; 
    piso?: string; 
    sala?: string 
  } | null;
  empleado?: {
    id: string;
    nombre: string;
    apellido: string;
    departamento: string;
    empresa: string;
  } | null;
}

export interface DispositivoFormProps {
  onCreateModel: (data: DispositivoFormData) => void;
  modelo: { id: string; nombre: string }[];
  initialData?: {
    id?: string;
    serial: string;
    estado: string;
    codigoImgc: string;  // Cambio de nsap a codigoImgc - OBLIGATORIO
    ubicacionId: string | null;
    mac: string | null;
    ip?: string | null;
    descripcion?: string | null;
    // Nuevos campos de compra
    fechaCompra: string | null;
    numeroFactura: string | null;
    proveedor: string | null;
    monto: string | null;
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
  const [modelos, setModelos] = React.useState<{ id: string; nombre: string; tipo: string }[]>([]);
  const [isLoading, setIsLoading] = React.useState(true); 
  const { hasPermission, hasAnyPermission } = usePermissions();
  const canCreateDispositivo = hasAnyPermission(['canCreate', 'canManageDispositivos']);
  const canEditDispositivo = hasAnyPermission(['canUpdate', 'canManageDispositivos']);
  // Eliminar solo para roles con canDelete (Admin). Editor NO elimina.
  const canDeleteDispositivo = hasPermission('canDelete');
  const router = useRouter();
  const queryClient = useQueryClient();
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
    accessorKey: "ip",
    header: "IP",
    cell: ({ row }) => {
      const ip = (row.getValue("ip") as string) || "";
      return (
        <div className="text-sm text-gray-700 truncate max-w-[160px]" title={ip}>
          {ip || <span className="text-muted-foreground italic">Sin IP</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "serial",
    header: "Serial",
    cell: ({ row }) => <div>{row.getValue("serial")}</div>,
  },
  {
    accessorKey: "codigoImgc",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Código IMGC
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const codigo = row.getValue("codigoImgc") as string;
      return (
        <div className="font-mono text-sm bg-gray-50 text-gray-700 px-2 py-1 rounded">
          {codigo}
        </div>
      );
    },
    sortingFn: (rowA, rowB, columnId) => {
      const valA = rowA.getValue(columnId) as string;
      const valB = rowB.getValue(columnId) as string;
      
      // Extraer números (asumiendo formato como "IMGC-123")
      // Buscamos la última secuencia de dígitos
      const numA = parseInt(valA.match(/\d+$/)?.[0] || "0", 10);
      const numB = parseInt(valB.match(/\d+$/)?.[0] || "0", 10);
      
      return numA - numB;
    }
  },
  {
    accessorKey: "descripcion",
    header: "Descripción",
    cell: ({ row }) => {
      const desc = (row.getValue("descripcion") as string) || "";
      return (
        <div className="text-sm text-gray-700 truncate max-w-[240px]" title={desc}>
          {desc || <span className="text-muted-foreground italic">Sin descripción</span>}
        </div>
      );
    },
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
              className={`h-5 w-5 p-0 ml-1 ${isFilterActive ? "text-[#EA7704]" : "text-muted-foreground"}`}
            >
              <FilterIcon className="h-3 w-3" />
              {isFilterActive && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#EA7704]"></span>
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
                className={`h-5 w-5 p-0 ml-1 ${isFilterActive ? "text-[#EA7704]" : "text-muted-foreground"}`}
              >
                <FilterIcon className="h-3 w-3" />
                {isFilterActive && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#EA7704]"></span>
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
    accessorKey: "modelo.tipo",
    header: "Tipo",
    cell: ({ row }) => {
      const tipo = row.original.modelo?.tipo;
      return <div>{tipo || "Sin tipo"}</div>;
    },
  },
  {
    accessorKey: "estado",
    header: ({ column }) => {
      const isFilterActive = !!column.getFilterValue();
      const estadosUnicos = ["ASIGNADO", "OPERATIVO", "EN_MANTENIMIENTO", "EN_RESGUARDO", "DE_BAJA"];
      
      return (
        <div className="flex items-center">
          <span>Estado</span>
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
            <PopoverContent className="w-40 p-2">
              <select
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(e) => column.setFilterValue(e.target.value)}
                className="h-8 w-full border rounded text-sm px-2 py-1"
              >
                <option value="">Todos</option>
                {estadosUnicos.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado === "ASIGNADO" ? "Asignado" :
                     estado === "OPERATIVO" ? "Operativo" :
                     estado === "EN_MANTENIMIENTO" ? "En Mantenimiento" :
                     estado === "EN_RESGUARDO" ? "En Resguardo" :
                     estado === "DE_BAJA" ? "De Baja" : estado}
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
          {estado === "OPERATIVO" ? (
            <CheckCircle2Icon className="h-4 w-4 text-green-600" />
          ) : estado === "ASIGNADO" ? (
            <User2Icon className="h-4 w-4 text-blue-500" />
          ) : estado === "EN_MANTENIMIENTO" ? (
            <WrenchIcon className="h-4 w-4 text-orange-500" />
          ) : estado === "EN_RESGUARDO" ? (
            <Shield className="h-4 w-4 text-blue-500" />
          ) : estado === "DE_BAJA" ? (
            <Trash2 className="h-4 w-4 text-red-500" />
          ) : (
            // Mantener compatibilidad con estados antiguos
            estado === "Operativo" ? (
              <CheckCircle2Icon className="h-4 w-4 text-green-600" />
            ) : estado === "Asignado" ? (
              <User2Icon className="h-4 w-4 text-blue-500" />
            ) : estado === "Mantenimiento" || estado === "En mantenimiento" ? (
              <WrenchIcon className="h-4 w-4 text-orange-500" />
            ) : estado === "Resguardo" || estado === "En resguardo" ? (
              <Shield className="h-4 w-4 text-blue-500" />
            ) : estado === "De baja" ? (
              <Trash2 className="h-4 w-4 text-red-500" />
            ) : (
              <XCircleIcon className="h-4 w-4 text-gray-500" />
            )
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
    accessorKey: "ubicacion.nombre",
    header: "Ubicación",
    cell: ({ row }) => {
      const ubicacion = row.original.ubicacion;
      return (
        <div className="flex items-center">
          {ubicacion ? (
            <div>
              <div className="font-medium">{ubicacion.nombre}</div>
              {ubicacion.piso && (
                <div className="text-xs text-muted-foreground">
                  Piso: {ubicacion.piso}
                </div>
              )}
              {ubicacion.sala && (
                <div className="text-xs text-muted-foreground">
                  Sala: {ubicacion.sala}
                </div>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground italic">Sin ubicación</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "empleado",
    header: "Asignado a",
    cell: ({ row }) => {
      const empleado = row.original.empleado;
      return (
        <div className="flex items-center">
          {empleado ? (
            <div>
              <div className="font-medium">{empleado.nombre} {empleado.apellido}</div>
              <div className="text-xs text-muted-foreground">
                {empleado.departamento} - {empleado.empresa}
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground italic">Sin asignar</span>
          )}
        </div>
      );
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
                <DropdownMenuItem asChild>
                  <Link href={`/dispositivos/${dispositivo.id}/details`}>
                    Gestionar Estado
                  </Link>
                </DropdownMenuItem>
                { canEditDispositivo && (
                  <>
                    <DropdownMenuItem
                      onClick={() => handleOpenEditModal(dispositivo)}
                    >
                      Editar equipo
                    </DropdownMenuItem>
                    {canDeleteDispositivo && (
                      <>
                        <DropdownMenuSeparator />
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            Eliminar equipo
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                      </>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente el dispositivo
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
            if (response.status === 404) {
              showToast.warning("El dispositivo ya no existe. Actualizando la lista...");
              await fetchAllData();
              return;
            }
            throw new Error('Error al eliminar el dispositivo.');
          }
  
          showToast.success("Dispositivo eliminado correctamente.");
          await fetchAllData();
      } catch (error) {
          console.error(error);
          showToast.error("No se pudo eliminar el dispositivo.");
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
    // Navegar a la página de edición responsiva
    router.push(`/dispositivos/${dispositivos.id}/edit`);
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
      codigoImgc: data.codigoImgc,  // Cambio de nsap a codigoImgc
      ubicacionId: data.ubicacionId,
      mac: data.mac,
      ip: (data as any).ip ?? null,
      descripcion: (data as any).descripcion ?? null,
      // Nuevos campos de compra
      fechaCompra: data.fechaCompra,
      numeroFactura: data.numeroFactura,
      proveedor: data.proveedor,
      monto: data.monto,
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

      // Invalidar cache del dashboard para reflejar el nuevo dispositivo
      await queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      await queryClient.invalidateQueries({ queryKey: ['dispositivo', 'lista'] });

      showToast.success(`Dispositivo ${isEditing ? 'actualizado' : 'creado'} correctamente ${isEditing ? '✨' : '👍'}`, {
        position: "top-right",
      });

      // Cerramos el modal correspondiente
      if (isEditing) {
        setIsEditModalOpen(false);
        setEditingDispositivo(null);
        // Para edición, refrescamos los datos
        await fetchAllData();
      } else {
        setIsCreateModalOpen(false);
        // Para creación, obtenemos el dispositivo creado y redirigimos a sus detalles
        const newDispositivo = await response.json();
        // Redirigir a la página de detalles del dispositivo recién creado sin recargar la página
        router.push(`/dispositivos/${newDispositivo.id}/details`);
      }

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
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Input
                placeholder="Buscar por serial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:max-w-sm border-primary/20"
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
                                      : column.id === "ip"
                                          ? "IP"
                                      : column.id === "descripcion"
                                          ? "Descripción"
                                      : column.id === "ubicacion.nombre"
                                          ? "Ubicación"
                                              : column.id}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
                {canCreateDispositivo && (
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
                            {searchQuery ? "No se encontraron equipos con ese filtro." : "No hay equipos registrados."}
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
          modeloId: editingDispositivo.modelo?.id ?? "",
          estado: editingDispositivo.estado,
          codigoImgc: editingDispositivo.codigoImgc,
          ubicacionId: editingDispositivo.ubicacion?.id ?? null,
          mac: editingDispositivo.mac ?? null,
          ip: editingDispositivo.ip ?? null,
          descripcion: editingDispositivo.descripcion ?? null,
          // Nuevos campos de compra
          fechaCompra: editingDispositivo.fechaCompra ?? null,
          numeroFactura: editingDispositivo.numeroFactura ?? null,
          proveedor: editingDispositivo.proveedor ?? null,
          monto: editingDispositivo.monto !== null && editingDispositivo.monto !== undefined ? Number(editingDispositivo.monto) : null,
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

