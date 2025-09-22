"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { showToast } from "nextjs-toast-notify";
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  UserCheck, 
  Briefcase, 
  Monitor, 
  Smartphone,
  MapPin,
  User,
  ExternalLink,
  Eye,
  Edit,
  Plus,
  Search
} from "lucide-react";
import Link from "next/link";
import DepartamentoForm from "@/components/DeptoForm";
import EmpleadoForm from "@/components/EmpleadoForm";

interface DepartamentoDetails {
  id: string;
  nombre: string;
  empresa: {
    id: string;
    nombre: string;
    descripcion?: string;
  };
  gerente?: {
    id: string;
    nombre: string;
    apellido: string;
    ced: string;
    cargo: {
      nombre: string;
    };
  } | null;
  empleados: Array<{
    id: string;
    nombre: string;
    apellido: string;
    ced: string;
    fechaIngreso?: string;
    cargo: {
      nombre: string;
    };
    computadores?: Array<{
      id: string;
      serial: string;
      estado: string;
      modelo: {
        nombre: string;
        marca: {
          nombre: string;
        };
      };
    }>;
    dispositivos?: Array<{
      id: string;
      serial: string;
      estado: string;
      modelo: {
        nombre: string;
        marca: {
          nombre: string;
        };
      };
    }>;
  }>;
  cargos: Array<{
    id: string;
    nombre: string;
    descripcion?: string;
    _count: {
      empleados: number;
    };
  }>;
  computadores: Array<{
    id: string;
    serial: string;
    estado: string;
    modelo: {
      nombre: string;
      marca: {
        nombre: string;
      };
    };
  }>;
  dispositivos: Array<{
    id: string;
    serial: string;
    estado: string;
    modelo: {
      nombre: string;
      marca: {
        nombre: string;
      };
    };
  }>;
  _count: {
    empleados: number;
    computadores: number;
    dispositivos: number;
    cargos: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function DepartamentoDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  
  const [departamento, setDepartamento] = useState<DepartamentoDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros
  const [filtroActivo, setFiltroActivo] = useState<string>("");
  const [filtroNombre, setFiltroNombre] = useState<string>("");
  
  // Estados para modales
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEmpleadoModalOpen, setIsEmpleadoModalOpen] = useState(false);
  
  // Estados para datos del formulario
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);

  useEffect(() => {
    const fetchDepartamento = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/departamentos/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Departamento no encontrado');
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setDepartamento(data);
      } catch (err: any) {
        setError(err.message);
        showToast.error(`Error al cargar departamento: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDepartamento();
    }
  }, [id]);

  // Cargar empresas y empleados para el formulario
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        // Cargar empresas
        const empresasResponse = await fetch('/api/empresas');
        if (empresasResponse.ok) {
          const empresasData = await empresasResponse.json();
          setEmpresas(empresasData);
        }

        // Cargar empleados
        const empleadosResponse = await fetch('/api/usuarios');
        if (empleadosResponse.ok) {
          const empleadosData = await empleadosResponse.json();
          setEmpleados(empleadosData);
        }
      } catch (err) {
        console.error('Error al cargar datos del formulario:', err);
      }
    };

    fetchFormData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'inactivo':
        return 'bg-red-100 text-red-800';
      case 'mantenimiento':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Funciones para filtros
  const getEmpleadosFiltrados = () => {
    if (!departamento?.empleados) return [];
    
    let empleadosFiltrados = departamento.empleados;
    
    // Filtrar por tipo de equipo
    if (filtroActivo === "computadores") {
      empleadosFiltrados = empleadosFiltrados.filter(emp => 
        emp.computadores && emp.computadores.length > 0
      );
    } else if (filtroActivo === "dispositivos") {
      empleadosFiltrados = empleadosFiltrados.filter(emp => 
        emp.dispositivos && emp.dispositivos.length > 0
      );
    }
    
    // Filtrar por nombre
    if (filtroNombre) {
      empleadosFiltrados = empleadosFiltrados.filter(emp =>
        `${emp.nombre} ${emp.apellido}`.toLowerCase().includes(filtroNombre.toLowerCase())
      );
    }
    
    return empleadosFiltrados;
  };

  const getTituloFiltro = () => {
    if (filtroActivo === "computadores") return "Empleados con Computadores";
    if (filtroActivo === "dispositivos") return "Empleados con Dispositivos";
    return "Empleados";
  };

  // Función para calcular el total de computadores (directos + de empleados)
  const getTotalComputadores = () => {
    if (!departamento) return 0;
    
    // Computadores asignados directamente al departamento
    const computadoresDirectos = departamento.computadores?.length || 0;
    
    // Computadores asignados a empleados del departamento
    const computadoresEmpleados = departamento.empleados?.reduce((total, empleado) => {
      return total + (empleado.computadores?.length || 0);
    }, 0) || 0;
    
    return computadoresDirectos + computadoresEmpleados;
  };

  // Función para calcular el total de dispositivos (directos + de empleados)
  const getTotalDispositivos = () => {
    if (!departamento) return 0;
    
    // Dispositivos asignados directamente al departamento
    const dispositivosDirectos = departamento.dispositivos?.length || 0;
    
    // Dispositivos asignados a empleados del departamento
    const dispositivosEmpleados = departamento.empleados?.reduce((total, empleado) => {
      return total + (empleado.dispositivos?.length || 0);
    }, 0) || 0;
    
    return dispositivosDirectos + dispositivosEmpleados;
  };

  // Función para obtener todos los computadores del departamento (directos + de empleados)
  const getAllComputadores = () => {
    if (!departamento) return [];
    
    const computadoresDirectos = departamento.computadores?.map(comp => ({
      ...comp,
      asignadoA: 'Departamento'
    })) || [];
    
    const computadoresEmpleados = departamento.empleados?.flatMap(empleado => 
      empleado.computadores?.map(comp => ({
        ...comp,
        asignadoA: empleado.nombre + ' ' + empleado.apellido
      })) || []
    ) || [];
    
    return [...computadoresDirectos, ...computadoresEmpleados];
  };

  // Función para obtener todos los dispositivos del departamento (directos + de empleados)
  const getAllDispositivos = () => {
    if (!departamento) return [];
    
    const dispositivosDirectos = departamento.dispositivos?.map(disp => ({
      ...disp,
      asignadoA: 'Departamento'
    })) || [];
    
    const dispositivosEmpleados = departamento.empleados?.flatMap(empleado => 
      empleado.dispositivos?.map(disp => ({
        ...disp,
        asignadoA: empleado.nombre + ' ' + empleado.apellido
      })) || []
    ) || [];
    
    return [...dispositivosDirectos, ...dispositivosEmpleados];
  };

  // Funciones para modales
  const handleEditDepartamento = () => {
    setIsEditModalOpen(true);
  };

  const handleUpdateDepartamento = async (formData: FormData) => {
    try {
      const data = {
        nombre: formData.get('nombre'),
        descripcion: formData.get('descripcion'),
        empresaId: departamento?.empresa.id
      };

      const response = await fetch(`/api/departamentos/${departamento?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el departamento');
      }

      setIsEditModalOpen(false);
      showToast.success("Departamento actualizado exitosamente", { position: "top-right" });
      
      // Recargar los datos del departamento
      const updatedResponse = await fetch(`/api/departamentos/${id}`);
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setDepartamento(updatedData);
      }
    } catch (error: any) {
      showToast.error(`Error al actualizar: ${error.message}`, { position: "top-right" });
    }
  };

  const handleAddEmpleado = () => {
    setIsEmpleadoModalOpen(true);
  };

  const handleCreateEmpleado = async (formData: FormData) => {
    try {
      const data = {
        nombre: formData.get('nombre'),
        apellido: formData.get('apellido'),
        ced: formData.get('ced'),
        fechaIngreso: formData.get('fechaIngreso'),
        cargoId: formData.get('cargoId'),
        departamentoId: departamento?.id
      };

      const response = await fetch('/api/empleados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el empleado');
      }

      setIsEmpleadoModalOpen(false);
      showToast.success("Empleado creado exitosamente", { position: "top-right" });
      
      // Recargar los datos del departamento
      const updatedResponse = await fetch(`/api/departamentos/${id}`);
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setDepartamento(updatedData);
      }
    } catch (error: any) {
      showToast.error(`Error al crear empleado: ${error.message}`, { position: "top-right" });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Spinner className="h-8 w-8" />
          <span className="ml-2">Cargando detalles del departamento...</span>
        </div>
      </div>
    );
  }

  if (error || !departamento) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
              <p className="text-gray-600 mb-4">{error || 'Departamento no encontrado'}</p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{departamento.nombre}</h1>
            <p className="text-gray-600">Detalles del departamento</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={handleEditDepartamento}
            className="flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Editar</span>
          </Button>
        </div>
      </div>

      {/* Información General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Empresa</label>
              <div className="flex items-center space-x-2">
                <p className="text-lg font-semibold">{departamento.empresa.nombre}</p>
                <Link href={`/empresas/${departamento.empresa.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Empresa
                  </Button>
                </Link>
              </div>
              {departamento.empresa.descripcion && (
                <p className="text-sm text-gray-600">{departamento.empresa.descripcion}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Gerente</label>
              {departamento.gerente ? (
                <div>
                  <p className="text-lg font-semibold">
                    {departamento.gerente.nombre} {departamento.gerente.apellido}
                  </p>
                  <p className="text-sm text-gray-600">
                    {departamento.gerente.cargo.nombre} • Cédula: {departamento.gerente.ced}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">Sin gerente asignado</p>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{departamento._count.empleados}</p>
              <p className="text-sm text-gray-600">Empleados</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold">{departamento._count.cargos}</p>
              <p className="text-sm text-gray-600">Cargos</p>
            </div>
            <div 
              className={`text-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors ${
                filtroActivo === "computadores" ? "bg-purple-50 border-2 border-purple-200" : ""
              }`}
              onClick={() => setFiltroActivo(filtroActivo === "computadores" ? "" : "computadores")}
            >
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                <Monitor className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold">{getTotalComputadores()}</p>
              <p className="text-sm text-gray-600">Computadores</p>
            </div>
            <div 
              className={`text-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors ${
                filtroActivo === "dispositivos" ? "bg-orange-50 border-2 border-orange-200" : ""
              }`}
              onClick={() => setFiltroActivo(filtroActivo === "dispositivos" ? "" : "dispositivos")}
            >
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-2">
                <Smartphone className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold">{getTotalDispositivos()}</p>
              <p className="text-sm text-gray-600">Dispositivos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empleados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              {getTituloFiltro()} ({getEmpleadosFiltrados().length})
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/empleados">
                <Button variant="outline" size="sm" className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>Gestionar Empleados</span>
                </Button>
              </Link>
              <Button 
                variant="default" 
                onClick={handleAddEmpleado}
                size="sm"
                className="flex items-center space-x-1 bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar Empleado</span>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Barra de búsqueda */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar empleado por nombre..."
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {getEmpleadosFiltrados().length > 0 ? (
            <div className="space-y-3">
              {getEmpleadosFiltrados().map((empleado) => (
                  <div key={empleado.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{empleado.nombre} {empleado.apellido}</p>
                        <p className="text-sm text-gray-600">
                          {empleado.cargo.nombre} • Cédula: {empleado.ced}
                        </p>
                        <div className="flex space-x-2 mt-1">
                          {empleado.computadores && empleado.computadores.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {empleado.computadores.length} PC
                            </Badge>
                          )}
                          {empleado.dispositivos && empleado.dispositivos.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {empleado.dispositivos.length} Disp
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {empleado.fechaIngreso && (
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Fecha de ingreso</p>
                          <p className="text-sm font-medium">{formatDate(empleado.fechaIngreso)}</p>
                        </div>
                      )}
                      <Link href={`/empleados/${empleado.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalles
                        </Button>
                      </Link>
                    </div>
                  </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No hay empleados en este departamento</p>
          )}
        </CardContent>
      </Card>

      {/* Cargos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Briefcase className="h-5 w-5 mr-2" />
            Cargos ({departamento.cargos?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {departamento.cargos && departamento.cargos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departamento.cargos.map((cargo) => (
                <div key={cargo.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{cargo.nombre}</h4>
                    <Badge variant="secondary">{cargo._count.empleados} empleados</Badge>
                  </div>
                  {cargo.descripcion && (
                    <p className="text-sm text-gray-600">{cargo.descripcion}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No hay cargos definidos en este departamento</p>
          )}
        </CardContent>
      </Card>

      {/* Equipos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Computadores */}
        <Card>
          <CardHeader>
            <CardTitle 
              className="flex items-center cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => setFiltroActivo(filtroActivo === "computadores" ? "" : "computadores")}
            >
              <Monitor className="h-5 w-5 mr-2" />
              Computadores ({getTotalComputadores()})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getAllComputadores().length > 0 ? (
              <div className="space-y-3">
                {getAllComputadores().map((computador) => (
                  <div key={computador.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{computador.serial}</p>
                        <p className="text-sm text-gray-600">
                          {computador.modelo.marca.nombre} {computador.modelo.nombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          Asignado a: {(computador as any).asignadoA}
                        </p>
                      </div>
                      <Badge className={getEstadoColor(computador.estado)}>
                        {computador.estado}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hay computadores asignados</p>
            )}
          </CardContent>
        </Card>

        {/* Dispositivos */}
        <Card>
          <CardHeader>
            <CardTitle 
              className="flex items-center cursor-pointer hover:text-orange-600 transition-colors"
              onClick={() => setFiltroActivo(filtroActivo === "dispositivos" ? "" : "dispositivos")}
            >
              <Smartphone className="h-5 w-5 mr-2" />
              Dispositivos ({getTotalDispositivos()})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getAllDispositivos().length > 0 ? (
              <div className="space-y-3">
                {getAllDispositivos().map((dispositivo) => (
                  <div key={dispositivo.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{dispositivo.serial}</p>
                        <p className="text-sm text-gray-600">
                          {dispositivo.modelo.marca.nombre} {dispositivo.modelo.nombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          Asignado a: {(dispositivo as any).asignadoA}
                        </p>
                      </div>
                      <Badge className={getEstadoColor(dispositivo.estado)}>
                        {dispositivo.estado}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hay dispositivos asignados</p>
            )}
          </CardContent>
        </Card>
      </div>


      {/* Edit Modal */}
      <DepartamentoForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateDepartamento}
        empresas={empresas}
        empleados={empleados}
        initialData={departamento ? {
          nombre: departamento.nombre,
          descripcion: '',
          empresaId: departamento.empresa.id,
          gerenteId: departamento.gerente?.id
        } : null}
      />
    </div>
  );
}
