"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Plus,
  Search,
  Edit
} from "lucide-react";
import Link from "next/link";
import DepartamentoForm from "@/components/DeptoForm";
import { EmpresaForm } from "@/components/EmpresaForm";

interface EmpresaDetails {
  id: string;
  nombre: string;
  descripcion?: string;
  logo?: string;
  departamentos: Array<{
    id: string;
    nombre: string;
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
    };
  }>;
  _count: {
    departamentos: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function EmpresaDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  
  const [empresa, setEmpresa] = useState<EmpresaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'computadores' | 'dispositivos'>('todos');
  const [filtroNombre, setFiltroNombre] = useState('');
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/empresas/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Empresa no encontrada');
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setEmpresa(data);
      } catch (err: any) {
        setError(err.message);
        showToast.error(`Error al cargar empresa: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEmpresa();
    }
  }, [id]);


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

  const getTotalEmpleados = () => {
    return empresa?.departamentos.reduce((total, depto) => total + depto._count.empleados, 0) || 0;
  };

  const getTotalComputadores = () => {
    if (!empresa?.departamentos) return 0;
    
    let total = 0;
    empresa.departamentos.forEach(depto => {
      // Computadores asignados directamente al departamento
      total += depto._count.computadores;
      
      // Computadores asignados a empleados del departamento
      depto.empleados?.forEach(empleado => {
        total += empleado.computadores?.length || 0;
      });
    });
    
    return total;
  };

  const getTotalDispositivos = () => {
    if (!empresa?.departamentos) return 0;
    
    let total = 0;
    empresa.departamentos.forEach(depto => {
      // Dispositivos asignados directamente al departamento
      total += depto._count.dispositivos;
      
      // Dispositivos asignados a empleados del departamento
      depto.empleados?.forEach(empleado => {
        total += empleado.dispositivos?.length || 0;
      });
    });
    
    return total;
  };

  // Función para obtener computadores de un departamento (incluyendo empleados)
  const getComputadoresDepartamento = (departamento: any) => {
    let total = departamento._count.computadores;
    departamento.empleados?.forEach((empleado: any) => {
      total += empleado.computadores?.length || 0;
    });
    return total;
  };

  // Función para obtener dispositivos de un departamento (incluyendo empleados)
  const getDispositivosDepartamento = (departamento: any) => {
    let total = departamento._count.dispositivos;
    departamento.empleados?.forEach((empleado: any) => {
      total += empleado.dispositivos?.length || 0;
    });
    return total;
  };

  // Función para filtrar departamentos según el filtro activo y nombre
  const getDepartamentosFiltrados = () => {
    if (!empresa?.departamentos) return [];
    
    let departamentosFiltrados = empresa.departamentos;
    
    // Aplicar filtro por tipo de equipo
    switch (filtroActivo) {
      case 'computadores':
        departamentosFiltrados = departamentosFiltrados.filter(depto => getComputadoresDepartamento(depto) > 0);
        break;
      case 'dispositivos':
        departamentosFiltrados = departamentosFiltrados.filter(depto => getDispositivosDepartamento(depto) > 0);
        break;
    }
    
    // Aplicar filtro por nombre
    if (filtroNombre.trim()) {
      departamentosFiltrados = departamentosFiltrados.filter(depto => 
        depto.nombre.toLowerCase().includes(filtroNombre.toLowerCase().trim())
      );
    }
    
    return departamentosFiltrados;
  };

  // Función para obtener el título del filtro
  const getTituloFiltro = () => {
    const departamentosFiltrados = getDepartamentosFiltrados();
    switch (filtroActivo) {
      case 'computadores':
        return `Departamentos con Computadores (${departamentosFiltrados.length})`;
      case 'dispositivos':
        return `Departamentos con Dispositivos (${departamentosFiltrados.length})`;
      default:
        return `Departamentos (${empresa?.departamentos?.length || 0})`;
    }
  };

  // Función para manejar la creación de departamentos
  const handleCreateDepartamento = async (formData: FormData) => {
    try {
      // Convertir FormData a JSON
      const data = {
        nombre: formData.get('nombre'),
        empresaId: formData.get('empresaId'),
        empresaNombre: formData.get('empresaNombre'),
        gerenteId: formData.get('gerenteId')
      };

      const response = await fetch("/api/departamentos", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status.toString()}`);
      }

      // Recargar los datos de la empresa
      window.location.reload();
      showToast.success("Departamento creado exitosamente", { position: "top-right" });
    } catch (error: any) {
      showToast.error(`Error al crear departamento: ${error.message}`, { position: "top-right" });
    }
  };

  const handleEditEmpresa = () => {
    setIsEditModalOpen(true);
  };

  const handleUpdateEmpresa = async (data: { nombre: string; descripcion?: string; logo?: File | null }) => {
    try {
      const formData = new FormData();
      formData.append('nombre', data.nombre);
      if (data.descripcion) {
        formData.append('descripcion', data.descripcion);
      }
      if (data.logo) {
        formData.append('logo', data.logo);
      }

      const response = await fetch(`/api/empresas/${empresa?.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar la empresa');
      }

      setIsEditModalOpen(false);
      showToast.success("Empresa actualizada exitosamente", { position: "top-right" });
      
      // Recargar los datos de la empresa
      const updatedResponse = await fetch(`/api/empresas/${id}`);
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setEmpresa(updatedData);
      }
    } catch (error: any) {
      showToast.error(`Error al actualizar: ${error.message}`, { position: "top-right" });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Spinner className="h-8 w-8" />
          <span className="ml-2">Cargando detalles de la empresa...</span>
        </div>
      </div>
    );
  }

  if (error || !empresa) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
              <p className="text-gray-600 mb-4">{error || 'Empresa no encontrada'}</p>
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
          <div className="flex items-center space-x-4">
            {empresa.logo && (
              <img
                src={empresa.logo}
                alt={`Logo de ${empresa.nombre}`}
                className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">{empresa.nombre}</h1>
              <p className="text-gray-600">Detalles de la empresa</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={handleEditEmpresa}
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
              <label className="text-sm font-medium text-gray-500">Descripción</label>
              <p className="text-lg">{empresa.descripcion || "Sin descripción"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Departamentos</label>
              <p className="text-lg font-semibold">{empresa._count.departamentos} departamento{empresa._count.departamentos !== 1 ? 's' : ''}</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{getTotalEmpleados()}</p>
              <p className="text-sm text-gray-600">Empleados</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold">{empresa._count.departamentos}</p>
              <p className="text-sm text-gray-600">Departamentos</p>
            </div>
            <div className="text-center">
              <button
                onClick={() => setFiltroActivo(filtroActivo === 'computadores' ? 'todos' : 'computadores')}
                className={`w-full p-2 rounded-lg transition-colors ${
                  filtroActivo === 'computadores' 
                    ? 'bg-purple-200 border-2 border-purple-400' 
                    : 'hover:bg-purple-50'
                }`}
              >
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                  <Monitor className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold">{getTotalComputadores()}</p>
                <p className="text-sm text-gray-600">Computadores</p>
                {filtroActivo === 'computadores' && (
                  <p className="text-xs text-purple-600 mt-1">Filtrado activo</p>
                )}
              </button>
            </div>
            <div className="text-center">
              <button
                onClick={() => setFiltroActivo(filtroActivo === 'dispositivos' ? 'todos' : 'dispositivos')}
                className={`w-full p-2 rounded-lg transition-colors ${
                  filtroActivo === 'dispositivos' 
                    ? 'bg-orange-200 border-2 border-orange-400' 
                    : 'hover:bg-orange-50'
                }`}
              >
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-2">
                  <Smartphone className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-2xl font-bold">{getTotalDispositivos()}</p>
                <p className="text-sm text-gray-600">Dispositivos</p>
                {filtroActivo === 'dispositivos' && (
                  <p className="text-xs text-orange-600 mt-1">Filtrado activo</p>
                )}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Departamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              {getTituloFiltro()}
            </div>
            <div className="flex items-center space-x-2">
              {filtroActivo !== 'todos' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiltroActivo('todos')}
                  className="text-xs"
                >
                  Limpiar Filtro
                </Button>
              )}
              <Link href="/departamentos">
                <Button variant="outline" size="sm" className="text-xs">
                  <Building2 className="h-4 w-4 mr-1" />
                  Gestionar Departamentos
                </Button>
              </Link>
              <Dialog open={mostrarModalCrear} onOpenChange={setMostrarModalCrear}>
                <DialogTrigger asChild>
                  <Button size="sm" className="text-xs">
                    <Plus className="h-4 w-4 mr-1" />
                    Crear Departamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Departamento</DialogTitle>
                  </DialogHeader>
                  <DepartamentoForm 
                    isOpen={mostrarModalCrear}
                    onClose={() => setMostrarModalCrear(false)}
                    onSubmit={handleCreateDepartamento}
                    empresas={[{ id: empresa.id, nombre: empresa.nombre }]}
                    empleados={[]}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Campo de búsqueda */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar departamentos..."
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {getDepartamentosFiltrados().length > 0 ? (
            <div className="space-y-4">
              {getDepartamentosFiltrados().map((departamento) => (
                <div key={departamento.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold">{departamento.nombre}</h3>
                      {departamento.gerente && (
                        <p className="text-sm text-gray-600">
                          Gerente: {departamento.gerente.nombre} {departamento.gerente.apellido} 
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {departamento.gerente.cargo.nombre}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{departamento._count.empleados} empleados</Badge>
                      {getComputadoresDepartamento(departamento) > 0 && (
                        <Badge variant="outline" className="text-purple-600 border-purple-300">
                          {getComputadoresDepartamento(departamento)} PC
                        </Badge>
                      )}
                      {getDispositivosDepartamento(departamento) > 0 && (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          {getDispositivosDepartamento(departamento)} Disp
                        </Badge>
                      )}
                      <Link href={`/departamentos/${departamento.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalles
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  {/* Empleados del departamento */}
                  {departamento.empleados && departamento.empleados.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Empleados:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {departamento.empleados.slice(0, 4).map((empleado) => (
                          <div key={empleado.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{empleado.nombre} {empleado.apellido}</p>
                                <p className="text-xs text-gray-600">{empleado.cargo.nombre}</p>
                              </div>
                            </div>
                            <div className="flex space-x-1">
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
                        ))}
                        {departamento.empleados && departamento.empleados.length > 4 && (
                          <div className="p-2 text-center text-sm text-gray-500">
                            +{departamento.empleados.length - 4} empleados más
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg font-medium">
                {filtroNombre.trim() && filtroActivo === 'todos'
                  ? `No se encontraron departamentos que coincidan con "${filtroNombre}"`
                  : filtroActivo === 'computadores' 
                  ? 'No hay departamentos con computadores asignados'
                  : filtroActivo === 'dispositivos'
                  ? 'No hay departamentos con dispositivos asignados'
                  : 'No hay departamentos en esta empresa'
                }
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {(filtroActivo !== 'todos' || filtroNombre.trim()) && 'Intenta cambiar los filtros para ver más departamentos'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Edit Modal */}
      <EmpresaForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateEmpresa}
        isEditing={true}
        initialData={empresa ? {
          nombre: empresa.nombre,
          descripcion: empresa.descripcion || '',
          logo: empresa.logo || null
        } : null}
      />
    </div>
  );
}
