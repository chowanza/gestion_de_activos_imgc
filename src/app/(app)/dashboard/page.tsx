"use client";
export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import {
  Users,
  Monitor,
  Cpu,
  UserCheck,
  Shield,
  TrendingUp,
  TrendingDown,
  Activity,
  PieChart,
  Building,
  MapPin,
  Building2,
  XCircle,
  Wrench,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useQuery } from "@tanstack/react-query"
import { useIsAdmin } from "@/hooks/useIsAdmin"
import { EstadoDonutChart } from "@/components/EstadoDonutChart"
import { BarChart } from "@/components/BarChart"
import { BarChartVertical } from "@/components/BarChartVertical"

const fetchDashboardData = async () => {
  // La URL debe coincidir con la ruta de tu API.
  const response = await fetch("/api/dashboard/");
  if (!response.ok) {
    throw new Error("Error al cargar los datos del dashboard.");
  }
  return response.json();
};

// --- Componentes para estados de UI ---
const LoadingSkeleton = () => (
  <div className="flex items-center justify-center min-h-screen bg-white text-[#167DBA]">
    <div className="text-center">
      <Cpu className="h-12 w-12 mx-auto animate-pulse" />
      <p className="mt-4 text-lg">Cargando estadísticas del sistema...</p>
    </div>
  </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center min-h-screen bg-white text-red-600">
    <div className="text-center">
      <p className="text-lg font-bold">¡Oops! Algo salió mal.</p>
      <p className="mt-2">{message}</p>
    </div>
  </div>
);

export default function InventoryDashboard() {
  const [timeRange, setTimeRange] = useState("30d")
  const [refreshKey, setRefreshKey] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isAdmin = useIsAdmin();

  // Update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Auto-refresh dashboard data every 30 seconds
  useEffect(() => {
    const refreshTimer = setInterval(() => {
      setRefreshKey(prev => prev + 1)
      console.log('🔄 Dashboard auto-refresh triggered')
    }, 30000) // 30 seconds
    
    return () => clearInterval(refreshTimer)
  }, [])

  // Manual refresh function
  const handleManualRefresh = () => {
    setRefreshKey(prev => prev + 1)
    console.log('🔄 Dashboard manual refresh triggered')
  }


  // Particle effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const particles: Particle[] = []
    const particleCount = 80

    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      color: string

      constructor() {
        this.x = Math.random() * (canvas?.width ?? 0)
        this.y = Math.random() * (canvas?.height ?? 0)
        this.size = Math.random() * 2 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.3
        this.speedY = (Math.random() - 0.5) * 0.3
        this.color = `rgba(${Math.floor(Math.random() * 100) + 100}, ${Math.floor(Math.random() * 100) + 150}, ${Math.floor(Math.random() * 55) + 200}, ${Math.random() * 0.3 + 0.1})`
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (!canvas) return

        if (this.x > canvas.width) this.x = 0
        if (this.x < 0) this.x = canvas.width
        if (this.y > canvas.height) this.y = 0
        if (this.y < 0) this.y = canvas.height
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const particle of particles) {
        particle.update()
        particle.draw()
      }

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-ES", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "registration":
        return Monitor
      case "assignment":
        return UserCheck
      case "maintenance":
        return Shield
      case "user":
        return Users
      default:
        return Activity
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "registration":
        return "text-green-500"
      case "assignment":
        return "text-blue-500"
      case "maintenance":
        return "text-amber-500"
      case "user":
        return "text-purple-500"
      default:
        return "text-slate-500"
    }
  }

   // Estados para filtros
   const [selectedEmpresa, setSelectedEmpresa] = useState<string>("");
   const [selectedUbicacion, setSelectedUbicacion] = useState<string>("");
   const [selectedEmpresaForDetails, setSelectedEmpresaForDetails] = useState<string>("");
   const [equipmentTypeFilter, setEquipmentTypeFilter] = useState<string>("todos");

   const {
    data: dashboardData, // Los datos de la API estarán aquí
    isLoading, // Será `true` mientras se obtienen los datos
    isError, // Será `true` si la petición falla
    error, // Contendrá el objeto de error
  } = useQuery({
    queryKey: ["dashboardData", refreshKey], // Clave única para esta consulta con refresh
    queryFn: fetchDashboardData, // Función que se ejecutará para obtener los datos
    refetchInterval: 30000, // Vuelve a cargar los datos cada 30 segundos
    refetchIntervalInBackground: true, // Refetch incluso cuando la ventana no está activa
  });

  // Debug: log dashboard data when it changes
  useEffect(() => {
    if (dashboardData) {
      console.log('Dashboard - Datos recibidos:', {
        computadorEstadoStats: dashboardData.computadorEstadoStats,
        dispositivoEstadoStats: dashboardData.dispositivoEstadoStats,
        totalComputers: dashboardData.totalComputers,
        totalDevices: dashboardData.totalDevices,
        refreshKey
      })
    }
  }, [dashboardData, refreshKey])

   // Funciones para filtrar datos - sin useMemo para evitar bucles infinitos
   const getFilteredEmpresaStats = () => {
     if (!dashboardData?.empresaStats) return [];
     if (!selectedEmpresa) return dashboardData.empresaStats;
     return dashboardData.empresaStats.filter((empresa: any) => empresa.name === selectedEmpresa);
   };

   const getFilteredUbicacionStats = () => {
     if (!dashboardData?.ubicacionStats) return [];
     if (!selectedUbicacion) return dashboardData.ubicacionStats;
     return dashboardData.ubicacionStats.filter((ubicacion: any) => ubicacion.name === selectedUbicacion);
   };

   // Funciones para filtrar por tipo de equipo - sin useMemo
   const getFilteredEmpresaStatsByEquipment = () => {
     if (!dashboardData?.empresaStats) return [];
     
     return dashboardData.empresaStats.map((empresa: any) => {
       let displayValue: number;
       let totalForPercentage: number;
       
       if (equipmentTypeFilter === 'computadores') {
         displayValue = empresa.computers;
         totalForPercentage = dashboardData.totalComputers;
       } else if (equipmentTypeFilter === 'dispositivos') {
         displayValue = empresa.devices;
         totalForPercentage = dashboardData.totalDevices;
       } else {
         displayValue = empresa.total;
         totalForPercentage = dashboardData.totalComputers + dashboardData.totalDevices;
       }
       
       const percentage = totalForPercentage > 0 
         ? parseFloat(((displayValue / totalForPercentage) * 100).toFixed(1))
         : 0;
       
       return {
         ...empresa,
         displayValue,
         percentage,
         departamentos: empresa.departamentos?.map((dept: any) => {
           let deptDisplayValue: number;
           if (equipmentTypeFilter === 'computadores') {
             deptDisplayValue = dept.computers;
           } else if (equipmentTypeFilter === 'dispositivos') {
             deptDisplayValue = dept.devices;
           } else {
             deptDisplayValue = dept.total;
           }
           
           const deptPercentage = displayValue > 0 
             ? parseFloat(((deptDisplayValue / displayValue) * 100).toFixed(1))
             : 0;
           
           return {
             ...dept,
             displayValue: deptDisplayValue,
             percentage: deptPercentage,
           };
         }) || [],
       };
     });
   };

   const getFilteredUbicacionStatsByEquipment = () => {
     if (!dashboardData?.ubicacionStats) return [];
     
     return dashboardData.ubicacionStats.map((ubicacion: any) => {
       let displayValue: number;
       let totalForPercentage: number;
       
       if (equipmentTypeFilter === 'computadores') {
         displayValue = ubicacion.computers;
         totalForPercentage = dashboardData.totalComputers;
       } else if (equipmentTypeFilter === 'dispositivos') {
         displayValue = ubicacion.devices;
         totalForPercentage = dashboardData.totalDevices;
       } else {
         displayValue = ubicacion.total;
         totalForPercentage = dashboardData.totalComputers + dashboardData.totalDevices;
       }
       
       const percentage = totalForPercentage > 0 
         ? parseFloat(((displayValue / totalForPercentage) * 100).toFixed(1))
         : 0;
       
       return {
         ...ubicacion,
         displayValue,
         percentage,
       };
     });
   };

   if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return <ErrorDisplay message={error.message} />;
  }
  console.log('Dashboard Data:', {
    totalUsers: dashboardData.totalUsers,
    totalDevices: dashboardData.totalDevices, 
    totalComputers: dashboardData.totalComputers,
    assignedEquipos: dashboardData.assignedEquipos,
    totalEquipos: dashboardData.totalEquipos,
    equiposOperativos: dashboardData.equiposOperativos
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEF6EE] to-[#F0E6D8] text-gray-800 relative overflow-hidden">
      <div className="container mx-auto p-4 relative z-10">
        {/* Dashboard Header with System Time */}
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-sm text-gray-400">Dashboard</h1>
          
          {/* System Time Card - Single Line */}
          <Card className="bg-white border-gray-200 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-mono text-[#167DBA]">{formatTime(currentTime)}</div>
                    <div className="text-xs text-gray-600">{formatDate(currentTime)}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs text-gray-500"></div>
                    <div className="text-xs text-gray-600">Online</div>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Equipos Totales"
            value={dashboardData.totalEquipos}
            icon={Monitor}
            color="blue"
            description="Todos los equipos"
          />
          <StatCard
            title="Equipos Asignados"
            value={dashboardData.assignedEquipos}
            icon={UserCheck}
            color="green"
            description="En uso activo"
          />
          <StatCard
            title="Equipos en Resguardo"
            value={dashboardData.equiposEnResguardo}
            icon={Shield}
            color="amber"
            description="Equipos resguardados"
          />
          <StatCard
            title="Equipos Operativos"
            value={dashboardData.equiposOperativos}
            icon={Activity}
            color="purple"
            description="Equipos en operación"
          />
          <StatCard
            title="Equipos de Baja"
            value={dashboardData.equiposDeBaja}
            icon={XCircle}
            color="red"
            description="Equipos dados de baja"
          />
          <StatCard
            title="En Mantenimiento"
            value={dashboardData.equiposEnMantenimiento}
            icon={Wrench}
            color="orange"
            description="Equipos en reparación"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Main Column - Charts and Analytics */}
          <div className="col-span-12">
            <Tabs defaultValue="overview" className="w-full">
              <div className="flex justify-between items-center mb-6">
                <TabsList className="bg-gray-100 p-1">
                  <TabsTrigger
                    value="overview"
                    className="data-[state=active]:bg-white data-[state=active]:text-[#167DBA]"
                  >
                    Resumen
                  </TabsTrigger>
                  <TabsTrigger
                    value="empresas"
                    className="data-[state=active]:bg-white data-[state=active]:text-[#167DBA]"
                  >
                    Empresas
                  </TabsTrigger>
                  <TabsTrigger
                    value="ubicaciones"
                    className="data-[state=active]:bg-white data-[state=active]:text-[#167DBA]"
                  >
                    Ubicaciones
                  </TabsTrigger>
                </TabsList>
                
                {/* Botón de refresh manual */}
                <Button
                  onClick={handleManualRefresh}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Activity className="h-4 w-4" />
                  Actualizar
                </Button>
              </div>

              <TabsContent value="overview" className="mt-0">
                <div className="grid gap-6">
                  {/* Estado de Equipos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <EstadoDonutChart
                      data={dashboardData.computadorEstadoStats || []}
                      title="Computadores"
                      total={dashboardData.totalComputers}
                    />
                    <EstadoDonutChart
                      data={dashboardData.dispositivoEstadoStats || []}
                      title="Dispositivos"
                      total={dashboardData.totalDevices}
                    />
                  </div>
                  
                  {/* Bottom Section - Activity and Summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Recent Activity */}
                    <Card className="bg-white border-gray-200 shadow-lg lg:col-span-2">
                    <CardHeader className="border-b border-gray-200 pb-3">
                      <CardTitle className="text-gray-900 text-base flex items-center justify-between">
                        <div className="flex items-center">
                          <Activity className="mr-2 h-4 w-4 text-[#167DBA]" />
                          Actividad Reciente
                        </div>
                        <Badge variant="outline" className="bg-gray-50 text-[#167DBA] border-[#167DBA]/50">
                          {dashboardData.recentActivity.length} Nuevas
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {dashboardData.recentActivity.slice(0, 4).map((activity: {
                          id: string | number
                          type: string
                          action: string
                          device: string
                          user: string
                          time: string
                        }) => {
                          const ActivityIcon = getActivityIcon(activity.type)
                          const activityColor = getActivityColor(activity.type)

                          return (
                            <div
                              key={activity.id}
                              className="flex flex-col space-y-2 p-3 bg-gray-50 rounded-md border border-gray-200"
                            >
                              <div className="flex items-start">
                                <div className={`mt-0.5 p-1 rounded-full bg-gray-100 border border-gray-300`}>
                                  <ActivityIcon className={`h-3 w-3 ${activityColor}`} />
                                </div>
                                <div className="flex-1 min-w-0 ml-2">
                                  <p className="text-xs font-medium text-gray-800">{activity.action}</p>
                                  <p className="text-xs text-gray-600">{activity.device}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">{activity.user}</p>
                                <p className="text-xs text-gray-500">{activity.time}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Resumen General */}
                  <Card className="bg-white border-gray-200 shadow-lg">
                    <CardHeader className="border-b border-gray-200 pb-2">
                      <CardTitle className="text-gray-900 flex items-center text-sm">
                        <Users className="mr-2 h-4 w-4 text-[#167DBA]" />
                        Resumen General
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xs font-medium text-gray-800">Empresas Activas</h3>
                            <p className="text-xs text-gray-600">
                              {dashboardData.empresaStats?.length || 0} empresas registradas
                            </p>
                          </div>
                          <Badge className="bg-[#167DBA]/20 text-[#167DBA] border-[#167DBA]/50 text-xs">
                            {dashboardData.empresaStats?.length || 0}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xs font-medium text-gray-800">Ubicaciones</h3>
                            <p className="text-xs text-gray-600">
                              {dashboardData.ubicacionStats?.length || 0} ubicaciones configuradas
                            </p>
                          </div>
                          <Badge className="bg-[#167DBA]/20 text-[#167DBA] border-[#167DBA]/50 text-xs">
                            {dashboardData.ubicacionStats?.length || 0}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xs font-medium text-gray-800">Departamentos</h3>
                            <p className="text-xs text-gray-600">
                              {dashboardData.totalDepartamentos} departamentos
                            </p>
                          </div>
                          <Badge className="bg-[#167DBA]/20 text-[#167DBA] border-[#167DBA]/50 text-xs">
                            {dashboardData.totalDepartamentos}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xs font-medium text-gray-800">Empleados</h3>
                            <p className="text-xs text-gray-600">
                              {dashboardData.totalEmpleados} empleados registrados
                            </p>
                          </div>
                          <Badge className="bg-[#167DBA]/20 text-[#167DBA] border-[#167DBA]/50 text-xs">
                            {dashboardData.totalEmpleados}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="empresas" className="mt-0">
                <div className="grid gap-6">
                  {/* Filtros */}
                  <Card className="bg-white border-gray-200 shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Label className="text-sm font-medium text-gray-700">Filtrar por tipo de equipo:</Label>
                          <div className="flex space-x-2">
                            <Button
                              variant={equipmentTypeFilter === "todos" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setEquipmentTypeFilter("todos")}
                              className="text-xs"
                            >
                              Todos
                            </Button>
                            <Button
                              variant={equipmentTypeFilter === "computadores" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setEquipmentTypeFilter("computadores")}
                              className="text-xs"
                            >
                              Computadores
                            </Button>
                            <Button
                              variant={equipmentTypeFilter === "dispositivos" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setEquipmentTypeFilter("dispositivos")}
                              className="text-xs"
                            >
                              Dispositivos
                            </Button>
                            </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          Mostrando: {equipmentTypeFilter === "todos" ? "Todos los equipos" : 
                                     equipmentTypeFilter === "computadores" ? "Solo computadores" : 
                                     "Solo dispositivos"}
                        </div>
                    </div>
                  </CardContent>
                </Card>

                  <BarChartVertical
                    data={getFilteredEmpresaStatsByEquipment().map((empresa: any, index: number) => ({
                      name: empresa.name,
                      value: empresa.displayValue,
                      percentage: empresa.percentage,
                      coveragePercentage: empresa.coveragePercentage,
                      departments: empresa.departamentos || [],
                      color: undefined // Se generará automáticamente
                    }))}
                    title={`Distribución de ${equipmentTypeFilter === "todos" ? "Equipos" : 
                                           equipmentTypeFilter === "computadores" ? "Computadores" : 
                                           "Dispositivos"} por Empresa`}
                    subtitle={`${equipmentTypeFilter === "todos" ? "Computadores y dispositivos" : 
                             equipmentTypeFilter === "computadores" ? "Solo computadores" : 
                             "Solo dispositivos"} por empresa`}
                    showPercentage={true}
                    maxValue={Math.max(...dashboardData.empresaStats.map((e: any) => e.total))}
                    equipmentTypeFilter={equipmentTypeFilter}
                    onBarClick={(barData) => {
                      setSelectedEmpresaForDetails(barData.name);
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="ubicaciones" className="mt-0">
                <div className="grid gap-4 sm:gap-6">
                  {/* Filtros */}
                  <Card className="bg-white border-gray-200 shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <Label className="text-sm font-medium text-gray-700">Filtrar por tipo de equipo:</Label>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant={equipmentTypeFilter === "todos" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setEquipmentTypeFilter("todos")}
                              className="text-xs"
                            >
                              Todos
                            </Button>
                            <Button
                              variant={equipmentTypeFilter === "computadores" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setEquipmentTypeFilter("computadores")}
                              className="text-xs"
                            >
                              Computadores
                            </Button>
                            <Button
                              variant={equipmentTypeFilter === "dispositivos" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setEquipmentTypeFilter("dispositivos")}
                              className="text-xs"
                            >
                              Dispositivos
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          Mostrando: {equipmentTypeFilter === "todos" ? "Todos los equipos" : 
                                     equipmentTypeFilter === "computadores" ? "Solo computadores" : 
                                     "Solo dispositivos"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <BarChart
                    data={getFilteredUbicacionStatsByEquipment().map((ubicacion: any) => ({
                      name: ubicacion.name,
                      value: ubicacion.displayValue,
                      percentage: ubicacion.percentage,
                      color: '#000000'
                    }))}
                    title={`Distribución de ${equipmentTypeFilter === "todos" ? "Equipos" : 
                                           equipmentTypeFilter === "computadores" ? "Computadores" : 
                                           "Dispositivos"} por Ubicación`}
                    subtitle={`${equipmentTypeFilter === "todos" ? "Computadores y dispositivos" : 
                             equipmentTypeFilter === "computadores" ? "Solo computadores" : 
                             "Solo dispositivos"} por ubicación física`}
                    showPercentage={true}
                    maxValue={Math.max(...dashboardData.ubicacionStats.map((u: any) => u.total))}
                  />
                  
                  {/* Información adicional de ubicaciones */}
                <Card className="bg-white border-gray-200 shadow-lg">
                  <CardHeader className="border-b border-gray-200 pb-3">
                      <CardTitle className="text-gray-900 flex items-center">
                        <MapPin className="mr-2 h-5 w-5 text-[#167DBA]" /> 
                        Detalles por Ubicación
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-3 sm:space-y-4 max-h-[300px] overflow-y-auto">
                        {dashboardData.ubicacionStats.map((ubicacion: any) => {
                          const totalEquipos = dashboardData.ubicacionStats.reduce((sum: number, u: any) => sum + u.total, 0);
                          const percentage = totalEquipos > 0 ? parseFloat(((ubicacion.total / totalEquipos) * 100).toFixed(1)) : 0;
                          
                          return (
                            <div key={ubicacion.name} className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-800 text-sm sm:text-base">{ubicacion.name}</h4>
                                <span className="text-xs sm:text-sm text-gray-600">{percentage}%</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                  <span className="text-gray-600">{ubicacion.computers} computadores</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                  <span className="text-gray-600">{ubicacion.devices} dispositivos</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                  <span className="text-gray-600">{ubicacion.total} total</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

            </Tabs>
          </div>
          </div>

      </div>
    </div>
  )
}

// Componente para las tarjetas de estadísticas
function StatCard({
  title,
  value,
  trend,
  icon: Icon,
  color,
  description,
}: {
  title: string
  value: number
  trend?: number
  icon: any
  color: string
  description: string
}) {
  const getColorClasses = () => {
    switch (color) {
      case "orange":
        return "from-orange-500 to-orange-600 border-orange-500/30 text-orange-500"
      case "blue":
        return "from-blue-500 to-indigo-500 border-blue-500/30 text-blue-500"
      case "purple":
        return "from-purple-500 to-pink-500 border-purple-500/30 text-purple-500"
      case "green":
        return "from-green-500 to-emerald-500 border-green-500/30 text-green-500"
      case "amber":
        return "from-amber-500 to-orange-500 border-amber-500/30 text-amber-500"
      default:
        return "from-orange-500 to-orange-600 border-orange-500/30 text-orange-500"
    }
  }

  const colorClasses = getColorClasses()

  return (
    <Card className={`bg-gray-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] overflow-hidden relative`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="text-xs sm:text-sm text-gray-600 truncate pr-2">{title}</div>
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${colorClasses.split(" ")[2]} flex-shrink-0`} />
        </div>

        <div className="space-y-1 sm:space-y-2">
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-700">{value.toLocaleString()}</div>
          <div className="text-xs sm:text-sm text-gray-500 truncate">{description}</div>
        </div>
      </CardContent>
    </Card>
  )
}
