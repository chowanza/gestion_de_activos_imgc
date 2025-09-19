"use client"

import { useState, useRef, useEffect } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useQuery } from "@tanstack/react-query"
import { useIsAdmin } from "@/hooks/useIsAdmin"
import { EstadoDonutChart } from "@/components/EstadoDonutChart"

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

   // Funciones para filtrar datos
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

   const {
    data: dashboardData, // Los datos de la API estarán aquí
    isLoading, // Será `true` mientras se obtienen los datos
    isError, // Será `true` si la petición falla
    error, // Contendrá el objeto de error
  } = useQuery({
    queryKey: ["dashboardData"], // Clave única para esta consulta
    queryFn: fetchDashboardData, // Función que se ejecutará para obtener los datos
    refetchInterval: 300000, // Opcional: Vuelve a cargar los datos cada 5 minutos
  });

   if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return <ErrorDisplay message={error.message} />;
  }
  console.log(dashboardData.totalUsers, dashboardData.totalDevices, dashboardData.totalComputers);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEF6EE] to-[#F0E6D8] text-gray-800 relative overflow-hidden">
      <div className="container mx-auto p-4 relative z-10">
        {/* Dashboard Title */}
        <h1 className="text-sm text-gray-400 mb-6">Dashboard</h1>
        
        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="Total Empleados"
            value={dashboardData.totalUsers}
            trend={dashboardData.trends.users}
            icon={Users}
            color="orange"
            description="Empleados registrados"
          /> 
          <StatCard
            title="Equipos Totales"
            value={dashboardData.totalEquipos}
            trend={dashboardData.trends.equipos}
            icon={Monitor}
            color="blue"
            description="Todos los equipos"
          />
          <StatCard
            title="Equipos en Resguardo"
            value={dashboardData.equiposEnResguardo}
            trend={dashboardData.trends.resguardo}
            icon={Shield}
            color="amber"
            description="Equipos resguardados"
          />
          <StatCard
            title="Computadores Asignados"
            value={dashboardData.assignedComputers}
            trend={dashboardData.trends.assigned}
            icon={UserCheck}
            color="green"
            description="En uso activo"
          />
          <StatCard
            title="Computadores Totales"
            value={dashboardData.totalComputers}
            trend={dashboardData.trends.computers}
            icon={Cpu}
            color="purple"
            description="Total de computadores"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Charts and Analytics */}
          <div className="col-span-12 lg:col-span-8">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-gray-100 p-1 mb-6">
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

              <TabsContent value="overview" className="mt-0">
                <div className="grid gap-6">
                  {/* Estado de Equipos */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  
                  {/* Recent Activity - Horizontal layout */}
                  <Card className="bg-white border-gray-200 shadow-lg">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dashboardData.recentActivity.slice(0, 3).map((activity: {
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
                </div>
              </TabsContent>
              <TabsContent value="empresas" className="mt-0">
                <Card className="bg-white border-gray-200 shadow-lg">
                  <CardHeader className="border-b border-gray-200 pb-3">
                    <CardTitle className="text-gray-900 flex items-center justify-between">
                      <div className="flex items-center">
                        <Building2 className="mr-2 h-5 w-5 text-[#167DBA]" /> 
                        Distribución por Empresas
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={selectedEmpresa}
                          onChange={(e) => setSelectedEmpresa(e.target.value)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#167DBA] focus:border-transparent"
                        >
                          <option value="">Todas las empresas</option>
                          {dashboardData?.empresaStats?.map((empresa: any) => (
                            <option key={empresa.name} value={empresa.name}>
                              {empresa.name}
                            </option>
                          ))}
                        </select>
                        {selectedEmpresa && (
                          <button
                            onClick={() => setSelectedEmpresa("")}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-gray-600"
                          >
                            Limpiar
                          </button>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                      {getFilteredEmpresaStats().map((empresa: any) => (
                        <div key={empresa.name} className="space-y-4">
                          {/* Empresa principal */}
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-800 font-semibold text-lg">{empresa.name}</span>
                              <span className="text-[#167DBA] font-mono text-lg">{empresa.percentage}%</span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                  className="bg-gradient-to-r from-[#167DBA] to-[#EA7704] h-3 rounded-full" 
                                  style={{ width: `${empresa.percentage}%` }}
                                ></div>
                              </div>
                              <div className="flex space-x-4 text-sm text-gray-600">
                                <span>{empresa.computers} comp.</span>
                                <span>{empresa.users} users</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Departamentos de la empresa */}
                          {empresa.departamentos && empresa.departamentos.length > 0 && (
                            <div className="ml-4 space-y-2">
                              <h4 className="text-sm font-medium text-gray-600 mb-2">Departamentos:</h4>
                              {empresa.departamentos.map((dept: any) => (
                                <div key={dept.name} className="space-y-1 pl-4 border-l-2 border-gray-200">
                                  <div className="flex justify-between">
                                    <span className="text-gray-700 text-sm">{dept.name}</span>
                                    <span className="text-[#167DBA] font-mono text-sm">{dept.percentage}%</span>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                      <div 
                                        className="bg-gradient-to-r from-[#167DBA]/60 to-[#EA7704]/60 h-2 rounded-full" 
                                        style={{ width: `${dept.percentage}%` }}
                                      ></div>
                                    </div>
                                    <div className="flex space-x-3 text-xs text-gray-500">
                                      <span>{dept.computers} comp.</span>
                                      <span>{dept.users} users</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {getFilteredEmpresaStats().length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">No hay datos disponibles</p>
                          <p className="text-sm">
                            {selectedEmpresa 
                              ? `No se encontraron datos para "${selectedEmpresa}"`
                              : "No hay empresas registradas"
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ubicaciones" className="mt-0">
                <Card className="bg-white border-gray-200 shadow-lg">
                  <CardHeader className="border-b border-gray-200 pb-3">
                    <CardTitle className="text-gray-900 flex items-center justify-between">
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-5 w-5 text-[#167DBA]" /> 
                        Distribución por Ubicaciones
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={selectedUbicacion}
                          onChange={(e) => setSelectedUbicacion(e.target.value)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#167DBA] focus:border-transparent"
                        >
                          <option value="">Todas las ubicaciones</option>
                          {dashboardData?.ubicacionStats?.map((ubicacion: any) => (
                            <option key={ubicacion.name} value={ubicacion.name}>
                              {ubicacion.name}
                            </option>
                          ))}
                        </select>
                        {selectedUbicacion && (
                          <button
                            onClick={() => setSelectedUbicacion("")}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-gray-600"
                          >
                            Limpiar
                          </button>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                      {getFilteredUbicacionStats().map((ubicacion: any) => (
                        <div key={ubicacion.name} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-800 font-medium">{ubicacion.name}</span>
                            <span className="text-[#167DBA] font-mono">{ubicacion.percentage}%</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-gradient-to-r from-[#167DBA] to-[#EA7704] h-2.5 rounded-full" 
                                style={{ width: `${ubicacion.percentage}%` }}
                              ></div>
                            </div>
                            <div className="flex space-x-4 text-xs text-gray-600">
                              <span>{ubicacion.computers} comp.</span>
                              <span>{ubicacion.devices} disp.</span>
                              <span className="font-medium">{ubicacion.total} total</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {getFilteredUbicacionStats().length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">No hay datos disponibles</p>
                          <p className="text-sm">
                            {selectedUbicacion 
                              ? `No se encontraron datos para "${selectedUbicacion}"`
                              : "No hay ubicaciones registradas"
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Time and Additional Info */}
          <div className="col-span-12 lg:col-span-4">
            <div className="space-y-6">
              {/* System Time */}
              <Card className="bg-white border-gray-200 shadow-lg overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1 font-mono">TIEMPO DEL SISTEMA</div>
                      <div className="text-2xl font-mono text-[#167DBA] mb-1">{formatTime(currentTime)}</div>
                      <div className="text-sm text-gray-600">{formatDate(currentTime)}</div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Última Actualización</div>
                        <div className="text-sm font-mono text-gray-800">Hace 2 min</div>
                      </div>
                      <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Estado</div>
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-1 animate-pulse"></div>
                          <div className="text-sm font-mono text-gray-800">Online</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats Summary */}
              <Card className="bg-white border-gray-200 shadow-lg">
                <CardHeader className="border-b border-gray-200 pb-3">
                  <CardTitle className="text-gray-900 flex items-center">
                    <Users className="mr-2 h-5 w-5 text-[#167DBA]" />
                    Resumen General
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-800">Empresas Activas</h3>
                        <p className="text-xs text-gray-600">
                          {dashboardData.empresaStats?.length || 0} empresas registradas
                        </p>
                      </div>
                      <Badge className="bg-[#167DBA]/20 text-[#167DBA] border-[#167DBA]/50">
                        {dashboardData.empresaStats?.length || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-800">Ubicaciones</h3>
                        <p className="text-xs text-gray-600">
                          {dashboardData.ubicacionStats?.length || 0} ubicaciones configuradas
                        </p>
                      </div>
                      <Badge className="bg-[#167DBA]/20 text-[#167DBA] border-[#167DBA]/50">
                        {dashboardData.ubicacionStats?.length || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-800">Departamentos</h3>
                        <p className="text-xs text-gray-600">
                          {dashboardData.departmentStats?.length || 0} departamentos
                        </p>
                      </div>
                      <Badge className="bg-[#167DBA]/20 text-[#167DBA] border-[#167DBA]/50">
                        {dashboardData.departmentStats?.length || 0}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
  trend: number
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
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">{title}</div>
          <Icon className={`h-5 w-5 ${colorClasses.split(" ")[2]}`} />
        </div>

        <div className="space-y-2">
          <div className="text-4xl font-bold text-gray-700">{value.toLocaleString()}</div>

        </div>
      </CardContent>
    </Card>
  )
}
