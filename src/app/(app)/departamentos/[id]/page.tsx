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
  Search,
  Trash2
} from "lucide-react";
import Link from "next/link";
import DepartamentoForm from "@/components/DeptoForm";
import EmpleadoForm from "@/components/EmpleadoForm";
import CargoForm from "@/components/CargoForm";

interface DepartamentoDetails {
  id: string;
  nombre: string;
  empresaDepartamentos: Array<{
    empresa: {
      id: string;
      nombre: string;
      descripcion?: string;
    };
  }>;
  gerencias: Array<{
    gerente: {
      id: string;
      nombre: string;
      apellido: string;
      ced: string;
    };
  }>;
  empleadoOrganizaciones: Array<{
    empleado: {
      id: string;
      nombre: string;
      apellido: string;
      ced: string;
      fechaIngreso?: string;
      fotoPerfil?: string;
      asignacionesComoTarget: Array<{
        id: string;
        computador?: {
          id: string;
          serial: string;
          estado: string;
          computadorModelos: Array<{
            modeloEquipo: {
              nombre: string;
              marcaModelos: Array<{
                marca: {
                  nombre: string;
                };
              }>;
            };
          }>;
        };
        dispositivo?: {
          id: string;
          serial: string;
          estado: string;
          dispositivoModelos: Array<{
            modeloEquipo: {
              nombre: string;
              marcaModelos: Array<{
                marca: {
                  nombre: string;
                };
              }>;
            };
          }>;
        };
      }>;
    };
    cargo: {
      id: string;
      nombre: string;
    };
  }>;
  departamentoCargos: Array<{
    cargo: {
      id: string;
      nombre: string;
      descripcion?: string;
      _count?: {
        empleadoOrganizaciones: number;
      };
    };
  }>;
  _count: {
    empleadoOrganizaciones: number;
    departamentoCargos: number;
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
  const [isCargoModalOpen, setIsCargoModalOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<any>(null);
  
  // Estados para datos del formulario
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);

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

  useEffect(() => {
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

  // Funciones para manejar cargos
  const handleCreateCargo = () => {
    setEditingCargo(null);
    setIsCargoModalOpen(true);
  };

  const handleEditCargo = (cargo: any) => {
    setEditingCargo(cargo);
    setIsCargoModalOpen(true);
  };

  const handleDeleteCargo = async (cargoId: string, cargoNombre: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el cargo "${cargoNombre}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/departamentos/${id}/cargos/${cargoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar el cargo');
      }

      showToast.success('Cargo eliminado exitosamente');
      // Recargar los datos del departamento
      if (id) {
        fetchDepartamento();
      }
    } catch (error: any) {
      console.error('Error al eliminar cargo:', error);
      showToast.error(error.message || 'Error al eliminar el cargo');
    }
  };

  const handleCargoSuccess = () => {
    setIsCargoModalOpen(false);
    setEditingCargo(null);
    // Recargar los datos del departamento
    if (id) {
      fetchDepartamento();
    }
  };

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
    if (!departamento?.empleadoOrganizaciones) return [];
    
    let empleadosFiltrados = departamento.empleadoOrganizaciones;
    
    // Filtrar por tipo de equipo
    if (filtroActivo === "computadores") {
      empleadosFiltrados = empleadosFiltrados.filter(empOrg => 
        empOrg.empleado.asignacionesComoTarget.some(asignacion => asignacion.computador)
      );
    } else if (filtroActivo === "dispositivos") {
      empleadosFiltrados = empleadosFiltrados.filter(empOrg => 
        empOrg.empleado.asignacionesComoTarget.some(asignacion => asignacion.dispositivo)
      );
    }
    
    // Filtrar por nombre
    if (filtroNombre) {
      empleadosFiltrados = empleadosFiltrados.filter(empOrg =>
        `${empOrg.empleado.nombre} ${empOrg.empleado.apellido}`.toLowerCase().includes(filtroNombre.toLowerCase())
      );
    }
    
    return empleadosFiltrados;
  };

  const getTituloFiltro = () => {
    if (filtroActivo === "computadores") return "Empleados con Computadores";
    if (filtroActivo === "dispositivos") return "Empleados con Dispositivos";
    return "Empleados";
  };

  // Función para calcular el total de computadores
  const getTotalComputadores = () => {
    if (!departamento?.empleadoOrganizaciones) return 0;
    
    let total = 0;
    departamento.empleadoOrganizaciones.forEach(empOrg => {
      empOrg.empleado.asignacionesComoTarget.forEach(asignacion => {
        if (asignacion.computador) {
          total++;
        }
      });
    });
    
    return total;
  };

  // Función para calcular el total de dispositivos
  const getTotalDispositivos = () => {
    if (!departamento?.empleadoOrganizaciones) return 0;
    
    let total = 0;
    departamento.empleadoOrganizaciones.forEach(empOrg => {
      empOrg.empleado.asignacionesComoTarget.forEach(asignacion => {
        if (asignacion.dispositivo) {
          total++;
        }
      });
    });
    
    return total;
  };

  // Función para obtener todos los computadores del departamento
  const getAllComputadores = () => {
    if (!departamento?.empleadoOrganizaciones) return [];
    
    const computadores: any[] = [];
    departamento.empleadoOrganizaciones.forEach(empOrg => {
      empOrg.empleado.asignacionesComoTarget.forEach(asignacion => {
        if (asignacion.computador) {
          computadores.push({
            id: asignacion.computador.id,
            serial: asignacion.computador.serial,
            empleado: empOrg.empleado,
            estado: asignacion.computador.estado,
            modelo: asignacion.computador.computadorModelos[0]?.modeloEquipo,
            marca: asignacion.computador.computadorModelos[0]?.modeloEquipo?.marcaModelos[0]?.marca
          });
        }
      });
    });
    
    return computadores;
  };

  // Función para obtener todos los dispositivos del departamento
  const getAllDispositivos = () => {
    if (!departamento?.empleadoOrganizaciones) return [];
    
    const dispositivos: any[] = [];
    departamento.empleadoOrganizaciones.forEach(empOrg => {
      empOrg.empleado.asignacionesComoTarget.forEach(asignacion => {
        if (asignacion.dispositivo) {
          dispositivos.push({
            id: asignacion.dispositivo.id,
            serial: asignacion.dispositivo.serial,
            empleado: empOrg.empleado,
            estado: asignacion.dispositivo.estado,
            modelo: asignacion.dispositivo.dispositivoModelos[0]?.modeloEquipo,
            marca: asignacion.dispositivo.dispositivoModelos[0]?.modeloEquipo?.marcaModelos[0]?.marca
          });
        }
      });
    });
    
    return dispositivos;
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
        empresaId: departamento?.empresaDepartamentos && departamento.empresaDepartamentos.length > 0 
          ? departamento.empresaDepartamentos[0].empresa.id 
          : '',
        gerenteId: formData.get('gerenteId') || null
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

  const handleCreateEmpleado = async (data: any) => {
    try {
      const response = await fetch('/api/usuarios', {
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
                <p className="text-lg font-semibold">
                  {departamento.empresaDepartamentos && departamento.empresaDepartamentos.length > 0 
                    ? departamento.empresaDepartamentos[0].empresa.nombre 
                    : 'Sin empresa'}
                </p>
                {departamento.empresaDepartamentos && departamento.empresaDepartamentos.length > 0 && (
                  <Link href={`/empresas/${departamento.empresaDepartamentos[0].empresa.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Empresa
                    </Button>
                  </Link>
                )}
              </div>
              {departamento.empresaDepartamentos && departamento.empresaDepartamentos.length > 0 && departamento.empresaDepartamentos[0].empresa.descripcion && (
                <p className="text-sm text-gray-600">{departamento.empresaDepartamentos[0].empresa.descripcion}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Gerente</label>
              {departamento.gerencias && departamento.gerencias.length > 0 ? (
                <div>
                  <p className="text-lg font-semibold">
                    {departamento.gerencias[0].gerente.nombre} {departamento.gerencias[0].gerente.apellido}
                  </p>
                  <p className="text-sm text-gray-600">
                    Cédula: {departamento.gerencias[0].gerente.ced}
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
              <p className="text-2xl font-bold">{departamento._count.empleadoOrganizaciones}</p>
              <p className="text-sm text-gray-600">Empleados</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold">{departamento._count.departamentoCargos}</p>
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
              {getEmpleadosFiltrados().map((empleadoOrganizacion) => (
                  <div key={empleadoOrganizacion.empleado.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                        {empleadoOrganizacion.empleado.fotoPerfil ? (
                          <img
                            src={empleadoOrganizacion.empleado.fotoPerfil}
                            alt={`${empleadoOrganizacion.empleado.nombre} ${empleadoOrganizacion.empleado.apellido}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Si la imagen falla al cargar, mostrar el ícono por defecto
                              e.currentTarget.style.display = 'none';
                              const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                              if (nextElement) {
                                nextElement.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-full h-full flex items-center justify-center ${empleadoOrganizacion.empleado.fotoPerfil ? 'hidden' : 'flex'}`}
                        >
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold">{empleadoOrganizacion.empleado.nombre} {empleadoOrganizacion.empleado.apellido}</p>
                        <p className="text-sm text-gray-600">
                          {empleadoOrganizacion.cargo?.nombre || 'Sin cargo'} • Cédula: {empleadoOrganizacion.empleado.ced}
                        </p>
                        <div className="flex space-x-2 mt-1">
                          {empleadoOrganizacion.empleado.asignacionesComoTarget?.filter(a => a.computador).length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {empleadoOrganizacion.empleado.asignacionesComoTarget.filter(a => a.computador).length} PC
                            </Badge>
                          )}
                          {empleadoOrganizacion.empleado.asignacionesComoTarget?.filter(a => a.dispositivo).length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {empleadoOrganizacion.empleado.asignacionesComoTarget.filter(a => a.dispositivo).length} Disp
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {empleadoOrganizacion.empleado.fechaIngreso && (
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Fecha de ingreso</p>
                          <p className="text-sm font-medium">{formatDate(empleadoOrganizacion.empleado.fechaIngreso)}</p>
                        </div>
                      )}
                      <Link href={`/empleados/${empleadoOrganizacion.empleado.id}`}>
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              Cargos ({departamento.departamentoCargos?.length || 0})
            </CardTitle>
            <Button onClick={handleCreateCargo} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Crear Cargo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {departamento.departamentoCargos && departamento.departamentoCargos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departamento.departamentoCargos.map((deptCargo) => (
                <div key={deptCargo.cargo.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold">{deptCargo.cargo.nombre}</h4>
                      <Badge variant="secondary" className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {deptCargo.cargo._count?.empleadoOrganizaciones || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCargo(deptCargo.cargo)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCargo(deptCargo.cargo.id, deptCargo.cargo.nombre)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {deptCargo.cargo.descripcion && (
                    <p className="text-sm text-gray-600">{deptCargo.cargo.descripcion}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No hay cargos definidos en este departamento</p>
              <Button onClick={handleCreateCargo} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Cargo
              </Button>
            </div>
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
                          {computador.marca?.nombre || 'Sin marca'} {computador.modelo?.nombre || 'Sin modelo'}
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
                          {dispositivo.marca?.nombre || 'Sin marca'} {dispositivo.modelo?.nombre || 'Sin modelo'}
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
          empresaId: departamento.empresaDepartamentos && departamento.empresaDepartamentos.length > 0 
            ? departamento.empresaDepartamentos[0].empresa.id 
            : '',
          gerenteId: departamento.gerencias && departamento.gerencias.length > 0 
            ? departamento.gerencias[0].gerente.id 
            : undefined
        } : null}
      />

      {/* Modal para agregar empleado */}
      <Dialog open={isEmpleadoModalOpen} onOpenChange={setIsEmpleadoModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar Empleado</DialogTitle>
          </DialogHeader>
          <EmpleadoForm
            onSubmit={handleCreateEmpleado}
            initialData={{
              departamentoId: departamento?.id || '',
              empresaId: departamento?.empresaDepartamentos && departamento.empresaDepartamentos.length > 0 
                ? departamento.empresaDepartamentos[0].empresa.id 
                : '',
              nombre: '',
              apellido: '',
              cedula: '',
              email: '',
              telefono: '',
              direccion: '',
              fechaNacimiento: '',
              fechaIngreso: '',
              fechaDesincorporacion: '',
              fotoPerfil: '',
              cargoId: ''
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Cargo Modal */}
      <CargoForm
        isOpen={isCargoModalOpen}
        onClose={() => {
          setIsCargoModalOpen(false);
          setEditingCargo(null);
        }}
        onSuccess={handleCargoSuccess}
        departamentoId={id as string}
        cargo={editingCargo}
      />
    </div>
  );
}
