"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import {
  Users,
  Monitor,
  Cpu,
  UserCheck,
  Shield,
  Activity,
  CheckCircle,
  TrendingUp,
  Clock,
  AlertTriangle,
  Building2,
  MapPin,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// Componente de carga
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEF6EE] to-[#F0E6D8] text-gray-800 relative overflow-hidden">
      <div className="container mx-auto p-4 relative z-10">
        <h1 className="text-sm text-gray-400 mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-white border-gray-200 shadow-lg">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// Componente de error
function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEF6EE] to-[#F0E6D8] text-gray-800 relative overflow-hidden">
      <div className="container mx-auto p-4 relative z-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="bg-white border-red-200 shadow-lg max-w-md">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Error al cargar el dashboard</h2>
              <p className="text-sm text-gray-600">{message}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Función para obtener datos del dashboard
async function fetchDashboardData() {
  const response = await fetch('/api/dashboard')
  if (!response.ok) {
    throw new Error('Error al cargar los datos del dashboard')
  }
  return response.json()
}

export default function InventoryDashboard() {
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("");
  const [selectedUbicacion, setSelectedUbicacion] = useState<string>("");
  const [selectedEmpresaForDetails, setSelectedEmpresaForDetails] = useState<string>("");
  const [equipmentTypeFilter, setEquipmentTypeFilter] = useState<string>("todos");

  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: fetchDashboardData,
    refetchInterval: 300000,
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return <ErrorDisplay message={error.message} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEF6EE] to-[#F0E6D8] text-gray-800 relative overflow-hidden">
      <div className="container mx-auto p-4 relative z-10">
        {/* Dashboard Title */}
        <h1 className="text-sm text-gray-400 mb-6">Dashboard Simple</h1>
        
        {/* Test simple */}
        <div className="bg-white p-4 rounded-lg">
          <h2>Test Simple - Sin Gráficos</h2>
          <p>Datos cargados correctamente</p>
          <p>Total equipos: {dashboardData?.totalEquipos || 0}</p>
        </div>
      </div>
    </div>
  );
}
