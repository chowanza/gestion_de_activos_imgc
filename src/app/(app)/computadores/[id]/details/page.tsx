"use client"

import { useEffect, useState } from "react"
import {
  ArrowLeft,
  Barcode,
  BarcodeIcon,
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
import { formatDate } from "@/utils/formatDate"
import { handleGenerateAndDownloadQR } from "@/utils/qrCode"
import { useIsAdmin } from "@/hooks/useIsAdmin"


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
  targetUsuario?: { nombre: string; apellido: string } | null;
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
    nsap?: string | null;
    host?: string | null;
    ubicacion?: string | null;
    sisOperativo?: string | null;
    arquitectura?: string | null;
    ram?: string | null;
    almacenamiento?: string | null;
    macWifi?: string | null;
    macEthernet: string | null;
    procesador?: string | null;
    sapVersion?: string | null;
    officeVersion?: string | null; 
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
    usuario?: { // El usuario es opcional
        id: string;
        nombre: string;
        apellido: string;
        cargo: string;
        departamento: {
          nombre: string;
        }
    } | null;
    departamento?: { // El departamento es opcional
        id: string;
        nombre: string;
        ceco?: string | null;
        gerencia: {
          nombre: string;
        }
    } | null;
    ultimaAsignacion?: { // La última asignación también es opcional
        id: number;
        type: string; // "Assignment" o "Return"
        targetType: string; // "Usuario" o "Departamento"
        date: string; // o Date
    } | null;
}



const statusConfig = {
  Resguardo: { label: "Resguardo", color: "green", bgColor: "bg-green-500/20", textColor: "text-green-400" },
  Reparacion: { label: "En Reparacion", color: "amber", bgColor: "bg-amber-500/20", textColor: "text-amber-400" },
  repair: { label: "En Reparación", color: "orange", bgColor: "bg-orange-500/20", textColor: "text-orange-400" },
  Asignado: { label: "Asignado", color: "blue", bgColor: "bg-blue-500/20", textColor: "text-blue-400" },
  Baja: { label: "De Baja", color: "red", bgColor: "bg-red-500/20", textColor: "text-red-400" },
}



export default function EquipmentDetails() {
  const [activeTab, setActiveTab] = useState("overview")
      const params = useParams();
      const { id } = params;
  
      const [equipo, setEquipo] = useState<ComputadorDetallado| null>(null);
      const [loading, setLoading] = useState(true);
      const isAdmin = useIsAdmin();
  
     useEffect(() => {
        if (id) {
            const fetchComputador = async () => {
                setLoading(true); // Asegurarse de poner loading en true al empezar
                try {
                    const response = await fetch(`/api/computador/${id}`);
                    console.log(id);
                    if (!response.ok) throw new Error("No se pudo cargar el computador.");
                    const data = await response.json();
                    setEquipo(data);
                } catch (error: any) {
                    console.error(error);
                    // Aquí puedes usar un toast para notificar al usuario del error
                } finally {
                    setLoading(false); // Poner loading en false cuando la petición termina (con éxito o error)
                }
            };
            fetchComputador();
        }
    }, [id]);

const departamentoTag = (
  equipo?.estado === 'Resguardo'
    ? 'Jefatura de IT y Comunicaciones'
    : equipo?.departamento?.nombre
    ? equipo?.departamento.nombre
    : equipo?.usuario?.departamento?.nombre
    ? equipo?.usuario?.departamento?.nombre
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
      almacenamiento, sapVersion, officeVersion, estado, macEthernet, macWifi } = equipo;

    const currentStatus = statusConfig[estado as keyof typeof statusConfig] || {
      label: "Desconocido",
      color: "gray",
      bgColor: "bg-gray-500/20",
      textColor: "text-gray-400"
    };  

  const specs: Record<string, string> = {
    Serial:       serial ?? "—",
    "Sistema Operativo": sisOperativo ?? "—",
    Procesador:   procesador ?? "—",
    Arquitectura: arquitectura ?? "—",
    RAM:          ram ?? "—",
    Almacenamiento: almacenamiento ?? "—",
    macWifi: macWifi ?? "—",
    macEthernet: macEthernet ?? "—",
    "Versión SAP": sapVersion ?? "—",
    "Versión Office": officeVersion ?? "—",
  };





  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-slate-900 text-slate-100 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <header className="flex items-center justify-between py-4 border-b border-slate-700/50 mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Cpu className="h-8 w-8 text-cyan-500" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  {equipo?.modelo.nombre}
                </h1>
                <p className="text-sm text-slate-400">ID: {equipo.id}</p>
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
                <Button variant="outline" size="icon" className="border-slate-700 hover:bg-slate-800">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700" align="end">
                {isAdmin && (
                  <>
                    <DropdownMenuItem className="hover:bg-slate-700">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Equipo
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-slate-700 text-red-400">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem className="hover:bg-slate-700">
                  <QrCode className="h-4 w-4 mr-2" />
                  Generar QR
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
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
              <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={equipo?.modelo.img || "/placeholder.svg"}
                      alt={equipo?.modelo.nombre}
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-black/60 text-white border-slate-600">{equipo.modelo.marca.nombre}</Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Número de Serie</p>
                        <p className="text-slate-200 font-mono">{equipo.serial}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Host</p>
                        <p className="text-slate-200 font-semibold">{equipo.host}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-100 text-base flex items-center">
                    <Zap className="mr-2 h-4 w-4 text-cyan-500" />
                    Sistemas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-400">SO</span>
                      <span className="text-sm text-cyan-400">{equipo.sisOperativo}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-400">Versión de SAP</span>
                      <span className="text-sm text-green-400">{equipo.sapVersion}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-400">Versión de Office</span>
                      <span className="text-sm text-purple-400">{equipo.officeVersion}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-100 text-base flex items-center">
                    <Calendar1Icon className="mr-2 h-4 w-4 text-green-500" />
                    última Asignación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Fecha</span>
                      <span className="text-sm text-slate-200">
                        {equipo.ultimaAsignacion?.date ? formatDate(equipo.ultimaAsignacion.date) : "—"}
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
              <TabsList className="bg-slate-800/50 p-1 mb-6">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400"
                >
                  Resumen
                </TabsTrigger>
                <TabsTrigger
                  value="specifications"
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400"
                >
                  Especificaciones
                </TabsTrigger>
                <TabsTrigger
                  value="users"
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400"
                >
                  Usuarios
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400"
                >
                  Historial
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-0">
                <div className="grid gap-6">
                  {/* General Information */}
                  <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-700/50 pb-3">
                      <CardTitle className="text-slate-100 flex items-center">
                        <Monitor className="mr-2 h-5 w-5 text-cyan-500" />
                        Información General
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-1">
                          <p className="text-xs text-slate-400 uppercase tracking-wider">Ubicación</p>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-slate-400 mr-2" />
                            <p className="text-sm text-slate-200">{equipo.ubicacion}</p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-slate-400 uppercase tracking-wider">Departamento</p>
                          <div className="flex items-center">
                            <Tag className="h-4 w-4 text-slate-400 mr-2" />
                            <p className="text-sm text-slate-200">{departamentoTag}</p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-slate-400 uppercase tracking-wider">N° Ficha en SAP</p>
                          <div className="flex items-center">
                            <Hash className="h-4 w-4 text-slate-400 mr-2" />
                            <p className="text-sm text-slate-200">
                              {equipo.nsap || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-700/50 pb-3">
                      <CardTitle className="text-slate-100 text-base">Acciones Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/computadores/${equipo.id}/editar`}
                               className="h-auto py-4 px-4 border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 flex flex-col items-center space-y-2"
                              >
                                <Edit className="h-6 w-6 text-cyan-500" />
                                <span className="text-xs">Editar</span>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar información del equipo</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                className="h-auto py-4 px-4 border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 flex flex-col items-center space-y-2"
                               onClick={() => {
                                  handleGenerateAndDownloadQR({ equipoId: equipo.id });
                                }}
                              >
                                <QrCode className="h-6 w-6 text-purple-500" />
                                <span className="text-xs">QR Code</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Generar código QR</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/asignaciones/new?equipoId=${equipo.id}`}
                             className="h-auto py-4 px-4 border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 flex flex-col items-center space-y-2">
                                <Users className="h-6 w-6 text-blue-500" />
                                <span className="text-xs">Asignar</span>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Asignar este equipo a un usuario</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                className="h-auto py-4 px-4 border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 flex flex-col items-center space-y-2"
                              >
                                <History className="h-6 w-6 text-green-500" />
                                <span className="text-xs">Historial</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ver historial completo</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="specifications" className="mt-0">
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                  <CardHeader className="border-b border-slate-700/50 pb-3">
                    <CardTitle className="text-slate-100 flex items-center">
                      <Cpu className="mr-2 h-5 w-5 text-cyan-500" />
                      Especificaciones Técnicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(specs).map(([key, value]) => (
                        <div key={key} className="bg-slate-800/50 rounded-md p-4 border border-slate-700/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                                {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                              </p>
                              <p className="text-sm text-slate-200">{value}</p>
                            </div>
                            <div className="text-cyan-500">
                              {key === "Serial" && <BarcodeIcon className="h-5 w-5" />}
                              {key === "Arquitectura" && <Landmark className="h-5 w-5" />}
                              {key === "Procesador" && <Cpu className="h-5 w-5" />}
                              {key === "RAM" && <HardDrive className="h-5 w-5" />}
                              {key === "Almacenamiento" && <HardDrive className="h-5 w-5" />}
                              {key === "display" && <Monitor className="h-5 w-5" />}
                              {key === "macWifi" && <Wifi className="h-5 w-5" />}
                              {key === "macEthernet" && <EthernetPort className="h-5 w-5" />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="mt-0">
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-700/50 pb-3">
                    <CardTitle className="text-slate-100 flex items-center">
                        <Users className="mr-2 h-5 w-5 text-cyan-500" />
                        Asignación Actual
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {/* CASO 1: El equipo está asignado a un USUARIO */}
                    {equipo.usuario && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src="/placeholder-user.jpg" alt={`${equipo.usuario.nombre} ${equipo.usuario.apellido}`} />
                                    <AvatarFallback className="bg-slate-700 text-cyan-500">
                                        {equipo.usuario.nombre[0]}{equipo.usuario.apellido[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-sm font-medium text-slate-200">{equipo.usuario.nombre} {equipo.usuario.apellido}</h3>
                                    <p className="text-xs text-slate-400">{equipo.usuario.cargo}</p>
                                    {/* Mostramos el depto del usuario si está disponible */}
                                    {equipo.usuario.departamento && (
                                        <p className="text-xs text-slate-500">Dpto: {equipo.usuario.departamento.nombre}</p>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400">Asignado desde</p>
                                <p className="text-sm text-slate-200">
                                    {equipo.ultimaAsignacion ? new Date(equipo.ultimaAsignacion.date).toLocaleDateString() : 'N/A'}
                                </p>
                                <Badge className="mt-1 bg-green-500/20 text-green-400 border-green-500/50">
                                    Usuario
                                </Badge>
                            </div>
                        </div>
                    )}

                    {/* CASO 2: El equipo está asignado a un DEPARTAMENTO (y no a un usuario) */}
                    {equipo.departamento && !equipo.usuario && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-12 w-12">
                                    {/* Puedes tener un placeholder para departamentos */}
                                    <AvatarImage src="/placeholder-dept.jpg" alt={equipo.departamento.nombre} />
                                    <AvatarFallback className="bg-slate-700 text-cyan-500">
                                      {equipo.departamento.nombre.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-sm font-medium text-slate-200">{equipo.departamento.nombre}</h3>
                                    <p className="text-xs text-slate-400">CECO: {equipo.departamento.ceco}</p>
                                    {equipo.departamento.gerencia && (
                                        <p className="text-xs text-slate-500">Gerencia: {equipo.departamento.gerencia.nombre}</p>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400">Asignado desde</p>
                                <p className="text-sm text-slate-200">
                                    {equipo.ultimaAsignacion ? new Date(equipo.ultimaAsignacion.date).toLocaleDateString() : 'N/A'}
                                </p>
                                <Badge className="mt-1 bg-blue-500/20 text-blue-400 border-blue-500/50">
                                    Departamento
                                </Badge>
                            </div>
                        </div>
                    )}

                    {/* CASO 3: El equipo NO ESTÁ ASIGNADO */}
                    {!equipo.usuario && !equipo.departamento && (
                        <div className="text-center text-slate-400">
                            <p>Este equipo se encuentra actualmente en resguardo y no está asignado.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                  <CardHeader className="border-b border-slate-700/50 pb-3">
                    <CardTitle className="text-slate-100 flex items-center">
                      <History className="mr-2 h-5 w-5 text-cyan-500" />
                      Historial Completo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {equipo.historial && equipo.historial.length > 0 ? (
                        equipo.historial.map((entry, index) => {
                          const isLast = index === equipo.historial.length - 1;

                          return (
                            <div key={entry.id} className="flex items-start space-x-4">
                              {/* Timeline decorator (punto y línea) */}
                              <div className="flex flex-col items-center">
                                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                                  <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                                </div>
                                {!isLast && <div className="w-px h-24 bg-slate-700 mt-2"></div>}
                              </div>

                              {/* Contenido de la tarjeta */}
                              <div className="flex-1 min-w-0 pt-1">
                                <div className="bg-slate-800/50 rounded-md p-4 border border-slate-700/50">
                                  {/* RENDERIZADO CONDICIONAL BASADO EN el TIPO */}

                                  {entry.tipo === 'modificacion' && (() => {
                                    const modificacion = entry.detalle as HistorialModificacionEntry;
                                    return (
                                      <div>
                                        <div className="flex items-center justify-between mb-2">
                                          <h3 className="text-sm font-medium text-slate-200 flex items-center">
                                            <Wrench className="mr-2 h-4 w-4 text-amber-400" />
                                            Modificación de Componente
                                          </h3>
                                          <p className="text-xs text-slate-400">{formatDate(entry.fecha)}</p>
                                        </div>
                                        <p className="text-sm text-slate-300">
                                          Se actualizó el campo <span className="font-semibold text-amber-400">{modificacion.campo}</span>.
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                          Valor anterior: <span className="font-mono bg-slate-700 px-1 rounded">{modificacion.valorAnterior || 'Vacío'}</span>
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                          Valor nuevo: <span className="font-mono bg-slate-700 px-1 rounded">{modificacion.valorNuevo || 'Vacío'}</span>
                                        </p>
                                      </div>
                                    );
                                  })()}

                                  {entry.tipo === 'asignacion' && (() => {
                                    const asig = entry.detalle as HistorialAsignacionEntry;
                                    const actionLabel = asig.motivo;
                                    const targetName = asig.targetUsuario
                                      ? `${asig.targetUsuario.nombre} ${asig.targetUsuario.apellido}`
                                      : asig.targetDepartamento?.nombre || 'N/A';

                                    return (
                                      <div>
                                        <div className="flex items-center justify-between mb-2">
                                          <h3 className="text-sm font-medium text-slate-200 flex items-center">
                                            <Info className="mr-2 h-4 w-4 text-green-400"/>
                                            {actionLabel}
                                            </h3>
                                          <p className="text-xs text-slate-400">{formatDate(entry.fecha)}</p>
                                        </div>
                                        <p className="text-sm text-slate-300 mb-2">Destino: <span className="font-semibold">{targetName}</span></p>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-center text-slate-400">No hay historial de movimientos para este equipo.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
