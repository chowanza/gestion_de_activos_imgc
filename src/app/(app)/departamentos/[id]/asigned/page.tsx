"use client"

import { useState, useRef, useEffect } from "react"
import {
  ArrowLeft,
  Monitor,
  Smartphone,
  Phone,
  Calendar,
  MapPin,
  Building,
  Mail,
  Shield,
  Activity,
  Edit,
  MoreHorizontal,
  Download,
  RefreshCw,
  Hexagon,
  PhoneIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useParams } from "next/navigation"
import Loading from "@/utils/loading"
import { formatDate } from "@/utils/formatDate"


interface DeptoProfileData {
  id: string;
  nombre: string;
  gerencia: string;
  ceco: string;
  sociedad: string;
  estadisticas: {
    totalComputadores: number;
    totalDispositivos: number;
    totalLineas: number;
    totalActivos: number;
  };
  computadores: any[]; // Deberías tipar esto más estrictamente
  dispositivos: any[];
  lineasTelefonicas: any[];
}


const statusConfig = {
  operativo: { label: "Operativo", color: "green", bgColor: "bg-green-500/20", textColor: "text-green-400" },
  mantenimiento: { label: "En Mantenimiento", color: "amber", bgColor: "bg-amber-500/20", textColor: "text-amber-400" },
  reparacion: { label: "En Reparación", color: "orange", bgColor: "bg-orange-500/20", textColor: "text-orange-400" },
  inactivo: { label: "Inactivo", color: "red", bgColor: "bg-red-500/20", textColor: "text-red-400" },
  activo: { label: "Activo", color: "green", bgColor: "bg-green-500/20", textColor: "text-green-400" },
}

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState("computers")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const params = useParams();
  const deptoId = params.id; // Obtiene el ID del usuario desde la URL

  const [deptoData, setDeptoData] = useState<DeptoProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (deptoId) {
      const fetchDeptoData = async () => {
        try {
          const response = await fetch(`/api/departamentos/${deptoId}/asigned`);
          if (!response.ok) {
            throw new Error('No se pudo cargar la información del usuario.');
          }
          const data = await response.json();
          setDeptoData(data);
        } catch (error) {
          console.error(error);
          // Manejar el error, quizás mostrar un toast o un mensaje
        } finally {
          setLoading(false);
        }
      };
      fetchDeptoData();
    }
  }, [deptoId]);

   useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const particles: Particle[] = []
    const particleCount = 60

    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      color: string

      constructor() {
        this.x = Math.random() * canvas!.width
        this.y = Math.random() * canvas!.height
        this.size = Math.random() * 2 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.3
        this.speedY = (Math.random() - 0.5) * 0.3
        this.color = `rgba(${Math.floor(Math.random() * 100) + 100}, ${Math.floor(Math.random() * 100) + 150}, ${Math.floor(Math.random() * 55) + 200}, ${Math.random() * 0.3 + 0.1})`
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (this.x > canvas!.width) this.x = 0
        if (this.x < 0) this.x = canvas!.width
        if (this.y > canvas!.height) this.y = 0
        if (this.y < 0) this.y = canvas!.height
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
  }, []);

  if (loading) {
    return <Loading  />;
  }

  if (!deptoData) {
    return <div>Departamento no encontrado.</div>;
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-slate-900 text-slate-100 relative overflow-hidden">
      {/* Background particle effect */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-20" />

      <div className="container mx-auto p-4 relative z-10">

        {/* depto Info Section */}
        <div className="grid grid-cols-12 gap-6 mb-8">
          {/* depto Profile Card */}
          <div className="col-span-12 lg:col-span-4">
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 border-b border-slate-700/50">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4 border-2 border-cyan-500/50">
                      <AvatarFallback className="bg-slate-700 text-cyan-500 text-2xl">
                        {deptoData.nombre[0]}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold text-slate-100 mb-1">
                      {deptoData.nombre}
                    </h2>
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">{deptoData.gerencia}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics Cards */}
          <div className="col-span-12 lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                title="Total Activos"
                value={deptoData.estadisticas.totalActivos}
                icon={Monitor}
                color="cyan"
                description="Asignados"
              />
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-800/50 p-1 mb-6">
            <TabsTrigger
              value="computers"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400"
            >
              Computadores ({deptoData.computadores.length})
            </TabsTrigger>
            <TabsTrigger value="devices" className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400">
              Dispositivos ({deptoData.dispositivos.length})
            </TabsTrigger>
            <TabsTrigger value="phones" className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400">
              Líneas Telefónicas ({deptoData.lineasTelefonicas.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="computers" className="mt-0">
            <div className="grid gap-6">
              {deptoData.computadores.map((computador) => (
                <Card key={computador.id} className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-1">
                        <img
                          src={computador.modelo.img || "/placeholder.svg"}
                          alt={computador.modelo.nombre}
                          className="w-full h-48 object-cover rounded-md border border-slate-700/50"
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-100">
                              {computador.modelo.nombre}
                            </h3>
                            <p className="text-sm text-slate-400">ID: {computador.id}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Número de Serie</p>
                            <p className="text-sm text-slate-200 font-mono">{computador.serial}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Fecha de Asignación</p>
                            <p className="text-sm text-slate-200">{formatDate(computador.fechaAsignacion)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Ubicación</p>
                            <p className="text-sm text-slate-200">{computador.ubicacion}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Asignado A</p>
                            <p className="text-sm text-slate-200 font-semibold">
                              {/* Lógica condicional para mostrar el asignado */}
                              {computador.usuario 
                                ? `${computador.usuario.nombre} ${computador.usuario.apellido}`
                                : computador.departamentoId 
                                  ? `Asignado directamente al departamento`
                                  : "En resguardo / Sin asignar"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="devices" className="mt-0">
            <div className="grid gap-6">
              {deptoData.dispositivos.map((dispositivo) => {
                // No DeviceIcon needed
                return (
                  <Card key={dispositivo.id} className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                          <img
                            src={dispositivo.modelo.img || "/placeholder.svg"}
                            alt={dispositivo.modelo}
                            className="w-full h-48 object-cover rounded-md border border-slate-700/50"
                          />
                        </div>
                        <div className="lg:col-span-2">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <PhoneIcon className="h-6 w-6 text-cyan-500 mr-2" />
                              <div>
                                <h3 className="text-lg font-semibold text-slate-100">
                                  {dispositivo.marca} {dispositivo.modelo}
                                </h3>
                                <p className="text-sm text-slate-400">
                                  {dispositivo.tipo} • ID: {dispositivo.id}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Número de Serie</p>
                              <p className="text-sm text-slate-200 font-mono">{dispositivo.serial}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Fecha de Asignación</p>
                              <p className="text-sm text-slate-200">{formatDate(dispositivo.fechaAsignacion)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Ubicación</p>
                              <p className="text-sm text-slate-200">{dispositivo.ubicacion}</p>
                            </div>
                            <div>
                            <p className="text-xs text-slate-400 mb-1">Asignado A</p>
                            <p className="text-sm text-slate-200 font-semibold">
                              {dispositivo.usuario 
                                ? `${dispositivo.usuario.nombre} ${dispositivo.usuario.apellido}`
                                : dispositivo.departamentoId 
                                  ? `Asignado directamente al departamento`
                                  : "En resguardo / Sin asignar"}
                            </p>
                          </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="phones" className="mt-0">
            <div className="grid gap-6">
              {deptoData.lineasTelefonicas.map((linea) => {

                return (
                  <Card key={linea.id} className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <PhoneIcon className="h-6 w-6 text-cyan-500 mr-2" />
                          <div>
                            <h3 className="text-lg font-semibold text-slate-100">{linea.numero}</h3>
                            <p className="text-sm text-slate-400">
                              {linea.tipo} • ID: {linea.id}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Fecha de Asignación</p>
                          <p className="text-sm text-slate-200">{formatDate(linea.fechaAsignacion)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Componente para las tarjetas de estadísticas
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  description,
}: {
  title: string
  value: number
  icon: any
  color: string
  description: string
}) {
  const getColorClasses = () => {
    switch (color) {
      case "cyan":
        return "text-cyan-500"
      case "green":
        return "text-green-500"
      case "purple":
        return "text-purple-500"
      case "amber":
        return "text-amber-500"
      default:
        return "text-cyan-500"
    }
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-slate-400">{title}</div>
          <Icon className={`h-4 w-4 ${getColorClasses()}`} />
        </div>
        <div className="text-xl font-bold text-slate-100 mb-1">{value.toLocaleString()}</div>
        <div className="text-xs text-slate-500">{description}</div>
      </CardContent>
    </Card>
  )
}
