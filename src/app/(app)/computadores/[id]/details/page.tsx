"use client"

import { useEffect, useState, useCallback } from "react"
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Barcode,
  BarcodeIcon,
  Building,
  Calendar,
  Calendar1Icon,
  Cpu,
  Edit,
  EthernetPort,
  HardDrive,
  Hash,
  History,
  Info,
  Landmark,
  MapPin,
  Monitor,
  MoreHorizontal,
  QrCode,
  Shield,
  Tag,
  Trash2,
  Users,
  Wifi,
  Wrench,
  Zap,
  Camera,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useParams, useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner"
import Link from "next/link"
import InterventionModal from "@/components/InterventionModal"
import { formatDate } from "@/utils/formatDate"
import { handleGenerateAndDownloadQR } from "@/utils/qrCode"
import { showToast } from "nextjs-toast-notify"
import { useIsAdmin } from "@/hooks/useIsAdmin"
import { usePermissions } from '@/hooks/usePermissions';
import { EquipmentTimeline } from "@/components/EquipmentTimeline"
import { EquipmentUsersSection } from "@/components/EquipmentUsersSection"
import NuevoEquipmentStatusModal from "@/components/NuevoEquipmentStatusModal"
import { TimelineFilters } from "@/components/TimelineFilters"
import { useTimelineFilters } from "@/hooks/useTimelineFilters"
import { QuickNavigationButton } from "@/components/QuickNavigationButton"


// Define la interfaz para una entrada de modificación
interface HistorialModificacionEntry {
  id: string;
  fecha: string;
  campo: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
}

// Define la interfaz para una entrada de asignación
interface HistorialAsignacionEntry {
  id: number;
  motivo: string; // Ej: 'Assignment' o 'Return'
  targetType: string;
  date: string;
  actionType: string,
  targetEmpleado?: { nombre: string; apellido: string } | null;
  targetDepartamento?: { nombre: string } | null;
}

// Interfaz para una entrada en el historial combinado
interface HistorialCombinadoEntry {
  id: string;
  tipo: 'asignacion' | 'modificacion'; // El campo clave para diferenciar
  fecha: string;
  detalle: HistorialAsignacionEntry | HistorialModificacionEntry;
}
interface ComputadorDetallado {
    id: string;
    serial: string;
    estado: string;
    codigoImgc?: string | null;
    host?: string | null;
    fechaCompra?: string | null;
    numeroFactura?: string | null;
    proveedor?: string | null;
    monto?: number | null;
    ubicacion?: { 
        id: string; 
        nombre: string; 
        descripcion?: string; 
        direccion?: string; 
        piso?: string; 
        sala?: string; 
    } | null;
    sisOperativo?: string | null;
    arquitectura?: string | null;
    ram?: string | null;
    almacenamiento?: string | null;
    macWifi?: string | null;
    macEthernet: string | null;
    procesador?: string | null;
    sapVersion?: string | null;
    officeVersion?: string | null;
    anydesk?: string | null; 
    historial: HistorialCombinadoEntry[];  
    modelo: { // El modelo ahora es un objeto
        id: string;
        nombre: string;
        tipo: string;
        img?: string | null;
        marca: { // La marca está anidada dentro del modelo
            id: string;
            nombre: string;
        };
    };
    empleado?: { // El empleado es opcional
        id: string;
        nombre: string;
        apellido: string;
        cargo: string;
        departamento?: {
          id: string;
          nombre: string;
          empresa?: {
            id: string;
            nombre: string;
          };
        };
        empresa?: {
          id: string;
          nombre: string;
        };
    } | null;
    departamento?: { // El departamento es opcional
        id: string;
        nombre: string;
        ceco?: string | null;
        gerencia: {
          nombre: string;
        };
        empresa?: {
          id: string;
          nombre: string;
        };
    } | null;
    ultimaAsignacion?: { // La última asignación también es opcional
        id: number;
        type: string; // "Assignment" o "Return"
        targetType: string; // "Usuario" o "Departamento"
        date: string; // o Date
    } | null;
}



const statusConfig = {
  OPERATIVO: { 
    label: "Operativo", 
    color: "emerald", 
    bgColor: "bg-emerald-500/20", 
    textColor: "text-emerald-400",
    description: "Equipo disponible para asignación",
    icon: "✅"
  },
  DE_BAJA: { 
    label: "De Baja", 
    color: "red", 
    bgColor: "bg-red-500/20", 
    textColor: "text-red-400",
    description: "Equipo dado de baja, no disponible",
    icon: "❌"
  },
  EN_RESGUARDO: { 
    label: "En Resguardo", 
    color: "blue", 
    bgColor: "bg-blue-500/20", 
    textColor: "text-blue-400",
    description: "Equipo en almacén o resguardo",
    icon: "📦"
  },
  EN_MANTENIMIENTO: { 
    label: "En Mantenimiento", 
    color: "amber", 
    bgColor: "bg-amber-500/20", 
    textColor: "text-amber-400",
    description: "Equipo en proceso de mantenimiento",
    icon: "🔧"
  },
  ASIGNADO: { 
    label: "Asignado", 
    color: "blue", 
    bgColor: "bg-blue-500/20", 
    textColor: "text-blue-400",
    description: "Equipo asignado a un empleado",
    icon: "👤"
  },
  // Mantener compatibilidad con estados antiguos
  Resguardo: { 
    label: "En Resguardo", 
    color: "blue", 
    bgColor: "bg-blue-500/20", 
    textColor: "text-blue-400",
    description: "Equipo en almacén o resguardo",
    icon: "📦"
  },
  Operativo: { 
    label: "Operativo", 
    color: "emerald", 
    bgColor: "bg-emerald-500/20", 
    textColor: "text-emerald-400",
    description: "Equipo disponible para asignación",
    icon: "✅"
  },
  Asignado: { 
    label: "Asignado", 
    color: "blue", 
    bgColor: "bg-blue-500/20", 
    textColor: "text-blue-400",
    description: "Equipo asignado a un empleado",
    icon: "👤"
  },
  Baja: { 
    label: "De Baja", 
    color: "red", 
    bgColor: "bg-red-500/20", 
    textColor: "text-red-400",
    description: "Equipo dado de baja, no disponible",
    icon: "❌"
  },
  Desconocido: { 
    label: "Desconocido", 
    color: "gray", 
    bgColor: "bg-gray-500/20", 
    textColor: "text-gray-600",
    description: "Estado del equipo no determinado",
    icon: "❓"
  },
}



export default function EquipmentDetails() {
  const [activeTab, setActiveTab] = useState("overview")
      const params = useParams();
      const { id } = params;
      const router = useRouter();
      const queryClient = useQueryClient();
  
      const [statusModalOpen, setStatusModalOpen] = useState(false);
      const [interventionModalOpen, setInterventionModalOpen] = useState(false);
  const isAdmin = useIsAdmin();
  const { userRole, hasPermission } = usePermissions();
  const canUpdate = hasPermission('canUpdate') || hasPermission('canManageComputadores');
  const canManageState = canUpdate || hasPermission('canManageAsignaciones') || hasPermission('canAssign');
  const canDelete = hasPermission('canDelete');

      // Hook de TanStack Query para cargar los datos del equipo
      const {
        data: equipo,
        isLoading: loading,
        error,
        refetch: loadEquipoData
      } = useQuery({
        queryKey: ['computador', id],
        queryFn: async () => {
          if (!id) throw new Error('ID no válido');
          const response = await fetch(`/api/computador/${id}`);
          if (!response.ok) throw new Error("No se pudo cargar el computador.");
          return response.json();
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutos
        gcTime: 10 * 60 * 1000, // 10 minutos
      });

      // Hook para filtros de timeline
      const {
        filters,
        historial,
        loading: timelineLoading,
        error: timelineError,
        handleFiltersChange,
      } = useTimelineFilters({
        itemId: id as string,
        itemType: 'computador',
        initialHistorial: equipo?.historial || [],
        equipo: equipo
      });

  // Recargar datos cuando la página se enfoque (al volver de editar)
  useEffect(() => {
    const handleFocus = () => {
      loadEquipoData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadEquipoData]);

const departamentoTag = (
  (equipo?.estado === 'ASIGNADO' || (equipo?.estado === 'EN_MANTENIMIENTO' && equipo?.empleado))
    ? (equipo?.empleado?.departamento?.nombre || '—')
    : '—'
);

        // 1. Mostrar un spinner o mensaje mientras los datos están cargando
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner />
            </div>
        );
    }

    // 2. Mostrar un mensaje si la carga terminó pero no se encontró el equipo (equipo sigue siendo null)
    if (!equipo) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-xl text-destructive">Equipo no encontrado.</p>
            </div>
        );
    }
  
    const { serial, sisOperativo, procesador, arquitectura, ram, 
      almacenamiento, officeVersion, estado, macEthernet, macWifi } = equipo;

    const currentStatus = statusConfig[estado as keyof typeof statusConfig] || {
      label: "Desconocido",
      color: "gray",
      bgColor: "bg-gray-500/20",
      textColor: "text-gray-400"
    };  

  const specs: Record<string, string> = {
    Serial:       serial ?? "—",
    Modelo: equipo.modelo?.nombre ?? "—",
    Marca: equipo.modelo?.marca?.nombre ?? "—",
    "Tipo": equipo.modelo?.tipo ?? "—",
    "Sistema Operativo": sisOperativo ?? "—",
    Procesador:   procesador ?? "—",
    Arquitectura: arquitectura ?? "—",
    RAM:          ram ?? "—",
    Almacenamiento: almacenamiento ?? "—",
    "MAC WiFi": macWifi ?? "—",
    "MAC Ethernet": macEthernet ?? "—",
    "Versión Office": officeVersion ?? "—",
    "Anydesk ID": equipo.anydesk ?? "—",
  };

  // Funciones para los botones del header
  const handleGoBack = () => {
    router.back();
  };

  const handleEdit = () => {
    router.push(`/computadores/${id}/edit`);
  };

  const handleStatusChange = async (newStatus: string, assignmentData: any) => {
    try {
      const requestData = {
        equipoId: equipo?.id,
        tipoEquipo: 'computador',
        nuevoEstado: newStatus,
        motivo: assignmentData.motivo || 'Cambio de estado',
        targetEmpleadoId: assignmentData.targetEmpleadoId || null,
        ubicacionId: assignmentData.ubicacionId || null,
        evidenciaFotos: assignmentData.evidenciaFotos || null
      };
      
      console.log('Enviando datos al API:', requestData);
      
      const response = await fetch('/api/equipos/cambiarEstado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(`Error actualizando estado: ${errorData.message || 'Error desconocido'}`);
      }

      const result = await response.json();
      
      // Invalidar el cache de TanStack Query para forzar la actualización
      await queryClient.invalidateQueries({ queryKey: ['computador', id] });
      
      // También invalidar queries relacionadas si existen
      await queryClient.invalidateQueries({ queryKey: ['computador', 'lista'] });
      await queryClient.invalidateQueries({ queryKey: ['equipos'] });
      
      // Invalidar cache del dashboard para reflejar cambios en métricas
      await queryClient.invalidateQueries({ queryKey: ['dashboardData'] });

      showToast.success(`Estado cambiado a ${newStatus} exitosamente`);
    } catch (error) {
      console.error('Error actualizando estado:', error);
      showToast.error('Error actualizando el estado del equipo');
    }
  };

  const handleGenerateQR = () => {
    if (equipo?.id) {
      handleGenerateAndDownloadQR({ equipoId: equipo.id });
    }
  };

  const handleDelete = async () => {
    if (!equipo?.id) return;
    
    const confirmed = window.confirm('¿Estás seguro de que quieres eliminar esta computadora? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/computador/${equipo.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast.success('Computadora eliminada correctamente');
        router.push('/equipos');
      } else {
        showToast.error('Error al eliminar la computadora');
      }
    } catch (error) {
      console.error('Error al eliminar computadora:', error);
      showToast.error('Error al eliminar la computadora');
    }
  };

  const handleInterventionSuccess = async () => {
    // Recargar datos del equipo y timeline
    await loadEquipoData();
    if (handleFiltersChange) {
      handleFiltersChange(filters); // Recargar timeline
    }
  };





  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEF6EE] to-[#F0E6D8] text-gray-800 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <header className="flex items-center justify-between py-4 border-b border-gray-200 mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-600 hover:text-gray-800"
              onClick={handleGoBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Cpu className="h-8 w-8 text-orange-500" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent">
                  {equipo?.modelo.nombre}
                </h1>
                <p className="text-sm text-gray-600">ID: {equipo.id}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Badge
              className={`${currentStatus.bgColor} ${currentStatus.textColor} border-${currentStatus.color}-500/50`}
            >
              <div className={`h-1.5 w-1.5 rounded-full bg-${currentStatus.color}-500 mr-1 animate-pulse`}></div>
              {currentStatus.label}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="border-gray-300 hover:bg-white">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-gray-300" align="end">
                { userRole !== 'viewer' && (
                  <DropdownMenuItem className="hover:bg-gray-200" onClick={() => setInterventionModalOpen(true)}>
                    <Camera className="h-4 w-4 mr-2" />
                    Registrar Intervención
                  </DropdownMenuItem>
                ) }
                {(canManageState || canUpdate || canDelete) && (
                  <>
                    <DropdownMenuSeparator />
                    {canManageState && (
                      <DropdownMenuItem className="hover:bg-gray-200" onClick={() => setStatusModalOpen(true)}>
                        <Wrench className="h-4 w-4 mr-2" />
                        Gestionar Estado
                      </DropdownMenuItem>
                    )}
                    {canUpdate && (
                      <DropdownMenuItem className="hover:bg-gray-200" onClick={handleEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Equipo
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem className="hover:bg-gray-200 text-red-400" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                <DropdownMenuItem className="hover:bg-gray-200" onClick={handleGenerateQR}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Generar QR
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200" />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Image and Quick Info */}
          <div className="col-span-12 lg:col-span-4">
            <div className="space-y-6">
              {/* Equipment Image */}
              <Card className="bg-white/90 border-gray-200 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={equipo?.modelo.img || "/file.svg"}
                      alt={equipo?.modelo.nombre}
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-gray-800/80 text-white border-gray-400">{equipo.modelo.marca.nombre}</Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Número de Serie</p>
                        <p className="text-gray-800 font-mono">{equipo.serial}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Host</p>
                        <p className="text-gray-800 font-semibold">{equipo.host}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="bg-white/90 border-gray-200 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-800 text-base flex items-center">
                    <Zap className="mr-2 h-4 w-4 text-orange-500" />
                    Sistemas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">SO</span>
                      <span className="text-sm text-orange-400">{equipo.sisOperativo}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Versión de Office</span>
                      <span className="text-sm text-purple-400">{equipo.officeVersion}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 border-gray-200 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-800 text-base flex items-center">
                    <Calendar1Icon className="mr-2 h-4 w-4 text-green-500" />
                    Última Asignación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Fecha</span>
                      <span className="text-sm text-gray-800">
                        {equipo.historial && equipo.historial.length > 0 
                          ? formatDate(equipo.historial[0].fecha) 
                          : "—"}
                      </span>
                    </div>
  
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="col-span-12 lg:col-span-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-gray-50 p-1 mb-6">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-gray-200 data-[state=active]:text-orange-400"
                >
                  Resumen
                </TabsTrigger>
                <TabsTrigger
                  value="specifications"
                  className="data-[state=active]:bg-gray-200 data-[state=active]:text-orange-400"
                >
                  Especificaciones
                </TabsTrigger>
                <TabsTrigger
                  value="users"
                  className="data-[state=active]:bg-gray-200 data-[state=active]:text-orange-400"
                >
                  Usuarios
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-gray-200 data-[state=active]:text-orange-400"
                >
                  Historial
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-0">
                <div className="grid gap-6">
                  {/* General Information */}
                  <Card className="bg-white/90 border-gray-200 backdrop-blur-sm">
                    <CardHeader className="border-b border-gray-200 pb-3">
                      <CardTitle className="text-gray-800 flex items-center">
                        <Monitor className="mr-2 h-5 w-5 text-orange-500" />
                        Información General
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600 uppercase tracking-wider">Ubicación</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 text-gray-600 mr-2" />
                              <div>
                                <p className="text-sm text-gray-800">{equipo.ubicacion?.nombre || 'Sin ubicación'}</p>
                                {equipo.ubicacion?.piso && (
                                  <p className="text-xs text-gray-600">Piso: {equipo.ubicacion.piso}</p>
                                )}
                                {equipo.ubicacion?.sala && (
                                  <p className="text-xs text-gray-600">Sala: {equipo.ubicacion.sala}</p>
                                )}
                              </div>
                            </div>
                            {equipo.ubicacion?.id && (
                              <QuickNavigationButton 
                                id={equipo.ubicacion.id} 
                                type="ubicacion" 
                              />
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-gray-600 uppercase tracking-wider">Código IMGC</p>
                          <div className="flex items-center">
                            <Hash className="h-4 w-4 text-gray-600 mr-2" />
                            <p className="text-sm text-gray-800">
                              {equipo.codigoImgc || "N/A"}
                            </p>
                          </div>
                        </div>

                        {/* Mostrar departamento y empresa si está asignado o en mantenimiento con empleado */}
                        {(equipo.estado === 'ASIGNADO' || (equipo.estado === 'EN_MANTENIMIENTO' && equipo.empleado)) && (
                          <>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-600 uppercase tracking-wider">Departamento</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <Tag className="h-4 w-4 text-gray-600 mr-2" />
                                  <p className="text-sm text-gray-800">{departamentoTag}</p>
                                </div>
                                {equipo.empleado?.departamento?.id && (
                                  <QuickNavigationButton 
                                    id={equipo.empleado.departamento.id} 
                                    type="departamento" 
                                  />
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <p className="text-xs text-gray-600 uppercase tracking-wider">Empresa</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <Building className="h-4 w-4 text-gray-600 mr-2" />
                                  <p className="text-sm text-gray-800">
                                    {equipo.empleado?.empresa?.nombre || "N/A"}
                                  </p>
                                </div>
                                {equipo.empleado?.empresa?.id && (
                                  <QuickNavigationButton 
                                    id={equipo.empleado.empresa.id} 
                                    type="empresa" 
                                  />
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Información de Compra */}
                  <Card className="bg-white/90 border-gray-200 backdrop-blur-sm">
                    <CardHeader className="border-b border-gray-200 pb-3">
                      <CardTitle className="text-gray-800 flex items-center">
                        <Calendar className="mr-2 h-5 w-5 text-[#EA7704]" />
                        Información de Compra
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600 uppercase tracking-wider">Fecha de Compra</p>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-600 mr-2" />
                            <p className="text-sm text-gray-800">
                              {equipo.fechaCompra ? new Date(equipo.fechaCompra).toLocaleDateString('es-ES') : "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-gray-600 uppercase tracking-wider">Número de Factura</p>
                          <div className="flex items-center">
                            <Tag className="h-4 w-4 text-gray-600 mr-2" />
                            <p className="text-sm text-gray-800">
                              {equipo.numeroFactura || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-gray-600 uppercase tracking-wider">Proveedor</p>
                          <div className="flex items-center">
                            <Landmark className="h-4 w-4 text-gray-600 mr-2" />
                            <p className="text-sm text-gray-800">
                              {equipo.proveedor || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-gray-600 uppercase tracking-wider">Monto</p>
                          <div className="flex items-center">
                            <Hash className="h-4 w-4 text-gray-600 mr-2" />
                            <p className="text-sm text-gray-800">
                              {equipo.monto ? `$${equipo.monto.toLocaleString()}` : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                </div>
              </TabsContent>

              <TabsContent value="specifications" className="mt-0">
                <Card className="bg-white/90 border-gray-200 backdrop-blur-sm">
                  <CardHeader className="border-b border-gray-200 pb-3">
                    <CardTitle className="text-gray-800 flex items-center">
                      <Cpu className="mr-2 h-5 w-5 text-orange-500" />
                      Especificaciones Técnicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(specs).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 rounded-md p-4 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">
                                {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                              </p>
                              <p className="text-sm text-gray-800">{value}</p>
                            </div>
                            <div className="text-orange-500">
                              {key === "Serial" && <BarcodeIcon className="h-5 w-5" />}
                              {key === "Modelo" && <Monitor className="h-5 w-5" />}
                              {key === "Marca" && <Tag className="h-5 w-5" />}
                              {key === "Tipo" && <Cpu className="h-5 w-5" />}
                              {key === "Sistema Operativo" && <Monitor className="h-5 w-5" />}
                              {key === "Arquitectura" && <Landmark className="h-5 w-5" />}
                              {key === "Procesador" && <Cpu className="h-5 w-5" />}
                              {key === "RAM" && <HardDrive className="h-5 w-5" />}
                              {key === "Almacenamiento" && <HardDrive className="h-5 w-5" />}
                              {key === "MAC WiFi" && <Wifi className="h-5 w-5" />}
                              {key === "MAC Ethernet" && <EthernetPort className="h-5 w-5" />}
                              {key === "Versión SAP" && <Tag className="h-5 w-5" />}
                              {key === "Versión Office" && <Tag className="h-5 w-5" />}
                              {key === "Anydesk ID" && <Monitor className="h-5 w-5" />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="mt-0">
                <EquipmentUsersSection equipo={equipo} />
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <Card className="bg-white/90 border-gray-200 backdrop-blur-sm">
                  <CardHeader className="border-b border-gray-200 pb-3">
                    <CardTitle className="text-gray-800 flex items-center">
                      <History className="mr-2 h-5 w-5 text-orange-500" />
                      Línea de Tiempo Inteligente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <TimelineFilters 
                      onFiltersChange={handleFiltersChange}
                      initialFilters={filters}
                    />
                    <EquipmentTimeline 
                      equipo={equipo} 
                      externalHistorial={historial}
                      loading={timelineLoading}
                      error={timelineError}
                      onFiltersChange={handleFiltersChange}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Modal de gestión de estado */}
      {equipo && (
        <NuevoEquipmentStatusModal
          isOpen={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          equipment={{
            id: equipo.id,
            serial: equipo.serial,
            estado: equipo.estado,
            tipo: 'Computador',
            modelo: {
              marca: { nombre: equipo.modelo.marca.nombre },
              nombre: equipo.modelo.nombre
            },
            empleado: equipo.empleado ? {
              id: equipo.empleado.id,
              nombre: equipo.empleado.nombre,
              apellido: equipo.empleado.apellido,
              departamento: {
                nombre: equipo.empleado.departamento?.nombre || '',
                empresa: { nombre: equipo.empleado.empresa?.nombre || '' }
              }
            } : undefined,
            ubicacion: equipo.ubicacion ? {
              id: equipo.ubicacion.id,
              nombre: equipo.ubicacion.nombre
            } : undefined
          }}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Modal de Intervención */}
      {equipo && (
        <InterventionModal
          isOpen={interventionModalOpen}
          onClose={() => setInterventionModalOpen(false)}
          onSuccess={handleInterventionSuccess}
          equipmentId={equipo.id}
          equipmentType="computador"
          equipmentSerial={equipo.serial}
        />
      )}
    </div>
  )
}

