"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { showToast } from "nextjs-toast-notify";
import EmpleadoForm from "@/components/EmpleadoForm";
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  UserCheck, 
  Briefcase, 
  Monitor, 
  Smartphone,
  Calendar,
  MapPin,
  User,
  ExternalLink,
  Eye,
  IdCard,
  Clock,
  Search,
  Edit,
  UserX,
  History,
  Plus
} from "lucide-react";
import EmpleadoStatusModal from "@/components/EmpleadoStatusModal";
import AsignarEquipoUnificadoModal from "@/components/AsignarEquipoUnificadoModal";
import { EmployeeAssignmentHistory } from "@/components/EmployeeAssignmentHistory";
import { EmployeeTimeline } from "@/components/EmployeeTimeline";
import Link from "next/link";

interface EmpleadoDetails {
  id: string;
  nombre: string;
  apellido: string;
  ced: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  fechaIngreso?: string;
  fechaDesincorporacion?: string;
  fotoPerfil?: string;
  organizaciones?: Array<{
    empresa: {
      id: string;
      nombre: string;
      descripcion?: string;
      logo?: string;
    };
    departamento: {
      id: string;
      nombre: string;
    };
    cargo: {
      id: string;
      nombre: string;
      descripcion?: string;
    };
  }>;
  asignacionesComoTarget?: Array<{
    id: string;
    computador?: {
      id: string;
      serial: string;
      estado: string;
      computadorModelos?: Array<{
        modeloEquipo: {
          nombre: string;
          marcaModelos?: Array<{
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
      dispositivoModelos?: Array<{
        modeloEquipo: {
          nombre: string;
          marcaModelos?: Array<{
            marca: {
              nombre: string;
            };
          }>;
        };
      }>;
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
}

export default function EmpleadoDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  
  const [empleado, setEmpleado] = useState<EmpleadoDetails | null>(null);
  const [historialAsignaciones, setHistorialAsignaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchHistorial, setSearchHistorial] = useState("");
  const [searchComputadores, setSearchComputadores] = useState("");
  const [searchDispositivos, setSearchDispositivos] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [loadingStatusHistory, setLoadingStatusHistory] = useState(false);
  const [isAsignarEquipoModalOpen, setIsAsignarEquipoModalOpen] = useState(false);

  // Función para cargar historial de asignaciones
  const fetchHistorialAsignaciones = async () => {
    try {
      setLoadingHistorial(true);
      const response = await fetch(`/api/historial-asignaciones?empleadoId=${id}`);
      
      if (response.ok) {
        const data = await response.json();
        setHistorialAsignaciones(data);
      }
    } catch (err: any) {
      console.error('Error al cargar historial de asignaciones:', err);
    } finally {
      setLoadingHistorial(false);
    }
  };

  useEffect(() => {
    const fetchEmpleado = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/usuarios/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Empleado no encontrado');
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setEmpleado(data);
      } catch (err: any) {
        setError(err.message);
        showToast.error(`Error al cargar empleado: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEmpleado();
      fetchHistorialAsignaciones();
      loadStatusHistory();
    }
  }, [id]);

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'Fecha no disponible';
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleDateString('es-ES', {
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

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // Funciones de filtrado
  const getHistorialFiltrado = () => {
    if (!historialAsignaciones) return [];
    if (!searchHistorial) return historialAsignaciones;
    
    return historialAsignaciones.filter(asignacion => {
      const searchLower = searchHistorial.toLowerCase();
      return (
        asignacion.accion?.toLowerCase().includes(searchLower) ||
        asignacion.item?.serial?.toLowerCase().includes(searchLower) ||
        asignacion.item?.numero?.toLowerCase().includes(searchLower) ||
        asignacion.item?.marca?.toLowerCase().includes(searchLower) ||
        asignacion.item?.modelo?.toLowerCase().includes(searchLower) ||
        asignacion.motivo?.toLowerCase().includes(searchLower) ||
        asignacion.notas?.toLowerCase().includes(searchLower) ||
        asignacion.gerente?.toLowerCase().includes(searchLower) ||
        asignacion.localidad?.toLowerCase().includes(searchLower)
      );
    });
  };

  const getComputadoresFiltrados = () => {
    if (!empleado?.asignacionesComoTarget) return [];
    if (!searchComputadores) return empleado.asignacionesComoTarget.filter(a => a.computador);
    
    return empleado.asignacionesComoTarget.filter(a => a.computador).filter(asignacion => {
      const computador = asignacion.computador;
      const searchLower = searchComputadores.toLowerCase();
      const modelo = computador?.computadorModelos?.[0]?.modeloEquipo;
      const marca = modelo?.marcaModelos?.[0]?.marca;
      
      return (
        computador?.serial?.toLowerCase().includes(searchLower) ||
        computador?.estado?.toLowerCase().includes(searchLower) ||
        modelo?.nombre?.toLowerCase().includes(searchLower) ||
        marca?.nombre?.toLowerCase().includes(searchLower)
      );
    });
  };

  const getDispositivosFiltrados = () => {
    if (!empleado?.asignacionesComoTarget) return [];
    if (!searchDispositivos) return empleado.asignacionesComoTarget.filter(a => a.dispositivo);
    
    return empleado.asignacionesComoTarget.filter(a => a.dispositivo).filter(asignacion => {
      const dispositivo = asignacion.dispositivo;
      const searchLower = searchDispositivos.toLowerCase();
      const modelo = dispositivo?.dispositivoModelos?.[0]?.modeloEquipo;
      const marca = modelo?.marcaModelos?.[0]?.marca;
      
      return (
        dispositivo?.serial?.toLowerCase().includes(searchLower) ||
        dispositivo?.estado?.toLowerCase().includes(searchLower) ||
        modelo?.nombre?.toLowerCase().includes(searchLower) ||
        marca?.nombre?.toLowerCase().includes(searchLower)
      );
    });
  };

  // Función para determinar el estado del empleado
  const getEstadoEmpleado = () => {
    if (empleado?.fechaDesincorporacion) {
      return {
        estado: 'Inactivo',
        color: 'bg-red-100 text-red-800',
        dotColor: 'bg-red-400'
      };
    }
    return {
      estado: 'Activo',
      color: 'bg-green-100 text-green-800',
      dotColor: 'bg-green-400'
    };
  };

  // Función para manejar la actualización del empleado
  const handleUpdateEmpleado = async (data: any) => {
    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar empleado");
      }

      showToast.success("Empleado actualizado con éxito");
      setIsEditModalOpen(false);
      
      // Refrescar los datos del empleado
      const fetchEmpleado = async () => {
        try {
          const response = await fetch(`/api/usuarios/${id}`);
          if (response.ok) {
            const data = await response.json();
            setEmpleado(data);
          }
        } catch (err) {
          console.error('Error al refrescar datos del empleado:', err);
        }
      };
      
      fetchEmpleado();
    } catch (error: any) {
      showToast.error(`Error: ${error.message}`);
    }
  };

  // Función para manejar el cambio de estado del empleado
  const handleStatusChange = async (fecha: string, accion: 'activar' | 'desactivar') => {
    try {
      // Validación: No permitir desactivar empleados con equipos asignados
      if (accion === 'desactivar' && empleado) {
        const totalEquipos = (empleado.asignacionesComoTarget?.filter(a => a.computador).length || 0) + (empleado.asignacionesComoTarget?.filter(a => a.dispositivo).length || 0);
        
        if (totalEquipos > 0) {
          showToast.error(
            `No se puede desactivar el empleado. Tiene ${totalEquipos} equipo(s) asignado(s). Debe desasignar todos los equipos primero.`,
            { position: "top-right", duration: 6000 }
          );
          setIsStatusModalOpen(false);
          return;
        }
      }

      const response = await fetch(`/api/usuarios/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion, fecha }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al cambiar estado del empleado");
      }

      const updatedEmpleado = await response.json();
      setEmpleado(updatedEmpleado);
      
      // Recargar historial de estado
      loadStatusHistory();
      
      showToast.success(`Empleado ${accion === 'activar' ? 'reactivado' : 'desactivado'} con éxito`);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      showToast.error("Error al cambiar estado del empleado");
    }
  };

  // Función para cargar el historial de estado
  const loadStatusHistory = async () => {
    try {
      setLoadingStatusHistory(true);
      const response = await fetch(`/api/usuarios/${id}/status`);
      if (response.ok) {
        const data = await response.json();
        setStatusHistory(data);
      }
    } catch (error) {
      console.error('Error al cargar historial de estado:', error);
    } finally {
      setLoadingStatusHistory(false);
    }
  };


  // Función para asignar equipo
  const handleAsignarEquipo = async (equipoId: string, motivo: string, tipoEquipo: 'computador' | 'dispositivo', ubicacionId?: string) => {
    try {
      const response = await fetch('/api/equipos/asignar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empleadoId: id,
          equipoId,
          tipoEquipo,
          motivo,
          ubicacionId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast.success(data.message);
        
        // Recargar datos del empleado
        const empleadoResponse = await fetch(`/api/usuarios/${id}`);
        if (empleadoResponse.ok) {
          const empleadoData = await empleadoResponse.json();
          setEmpleado(empleadoData);
        }
        
        // Recargar historial de asignaciones
        fetchHistorialAsignaciones();
        
        // Cerrar modal
        setIsAsignarEquipoModalOpen(false);
      } else {
        const errorData = await response.json();
        showToast.error(errorData.message || 'Error al asignar equipo');
      }
    } catch (error) {
      console.error('Error al asignar equipo:', error);
      showToast.error('Error al asignar equipo');
    }
  };

  // Función para abrir modal de asignación
  const openAsignarModal = () => {
    setIsAsignarEquipoModalOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Spinner className="h-8 w-8" />
          <span className="ml-2">Cargando detalles del empleado...</span>
        </div>
      </div>
    );
  }

  if (error || !empleado) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
              <p className="text-gray-600 mb-4">{error || 'Empleado no encontrado'}</p>
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
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 flex items-center justify-center bg-gray-50">
              {empleado.fotoPerfil ? (
                <img 
                  src={empleado.fotoPerfil} 
                  alt={`${empleado.nombre} ${empleado.apellido}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{empleado.nombre} {empleado.apellido}</h1>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoEmpleado().color}`}>
                  <div className={`w-2 h-2 rounded-full mr-1.5 ${getEstadoEmpleado().dotColor}`} />
                  {getEstadoEmpleado().estado}
                </div>
              </div>
              <p className="text-gray-600">Detalles del empleado</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={getEstadoEmpleado().estado === 'Activo' ? "destructive" : "default"}
            size="sm" 
            onClick={() => setIsStatusModalOpen(true)}
            className={getEstadoEmpleado().estado === 'Activo' ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
          >
            {getEstadoEmpleado().estado === 'Activo' ? (
              <>
                <UserX className="h-4 w-4 mr-2" />
                Desactivar
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Reactivar
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Información Personal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <IdCard className="h-5 w-5 mr-2" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Cédula</label>
              <p className="text-lg font-semibold">{empleado.ced}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Edad</label>
              <p className="text-lg font-semibold">
                {empleado.fechaNacimiento ? `${calculateAge(empleado.fechaNacimiento)} años` : 'No especificada'}
              </p>
            </div>
          </div>
          
          {empleado.fechaDesincorporacion && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de Desincorporación</label>
                <p className="text-lg text-red-600 font-semibold">
                  {formatDate(empleado.fechaDesincorporacion)}
                </p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-lg">
                {empleado.email ? (
                  <a 
                    href={`mailto:${empleado.email}`}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {empleado.email}
                  </a>
                ) : 'No especificado'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Teléfono</label>
              <p className="text-lg">
                {empleado.telefono ? (
                  <a 
                    href={`tel:${empleado.telefono}`}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {empleado.telefono}
                  </a>
                ) : 'No especificado'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Dirección</label>
              <p className="text-lg">
                {empleado.direccion || 'No especificada'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Fecha de Nacimiento</label>
              <p className="text-lg">
                {empleado.fechaNacimiento ? formatDate(empleado.fechaNacimiento) : 'No especificada'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Fecha de Ingreso</label>
              <p className="text-lg">
                {empleado.fechaIngreso ? formatDate(empleado.fechaIngreso) : 'No especificada'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información Laboral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Briefcase className="h-5 w-5 mr-2" />
            Información Laboral
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Cargo</label>
              <div className="flex items-center space-x-2">
                <p className="text-lg font-semibold">{empleado.organizaciones?.[0]?.cargo?.nombre || 'Sin cargo asignado'}</p>
                {empleado.organizaciones?.[0]?.cargo?.descripcion && (
                  <Badge variant="outline">{empleado.organizaciones[0].cargo.descripcion}</Badge>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Departamento</label>
              <div className="flex items-center space-x-2">
                <p className="text-lg font-semibold">{empleado.organizaciones?.[0]?.departamento?.nombre || 'Sin departamento asignado'}</p>
                {empleado.organizaciones?.[0]?.departamento?.id && (
                  <Link href={`/departamentos/${empleado.organizaciones[0].departamento.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Departamento
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <label className="text-sm font-medium text-gray-500">Empresa</label>
            <div className="flex items-center space-x-4 mt-2">
              {empleado.organizaciones?.[0]?.empresa?.logo && (
                <img
                  src={empleado.organizaciones[0].empresa.logo}
                  alt={`Logo de ${empleado.organizaciones[0].empresa.nombre}`}
                  className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                />
              )}
              <div>
                <p className="text-lg font-semibold">{empleado.organizaciones?.[0]?.empresa?.nombre || 'Sin empresa'}</p>
                {empleado.organizaciones?.[0]?.empresa?.descripcion && (
                  <p className="text-sm text-gray-600">{empleado.organizaciones[0].empresa.descripcion}</p>
                )}
              </div>
              <Link href={`/empresas/${empleado.organizaciones?.[0]?.empresa?.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Empresa
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipos Asignados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Computadores */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Monitor className="h-5 w-5 mr-2" />
                Computadores Asignados ({getComputadoresFiltrados().length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={openAsignarModal}
                className="h-8 px-3"
              >
                <Plus className="h-3 w-3 mr-1" />
                Asignar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Barra de búsqueda */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar computadores por serial, marca, modelo o estado..."
                  value={searchComputadores}
                  onChange={(e) => setSearchComputadores(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {getComputadoresFiltrados().length > 0 ? (
              <div className="space-y-3">
                {getComputadoresFiltrados().map((asignacion) => {
                  const computador = asignacion.computador;
                  if (!computador) return null;
                  
                  const modelo = computador.computadorModelos?.[0]?.modeloEquipo;
                  const marca = modelo?.marcaModelos?.[0]?.marca;
                  
                  return (
                    <div key={computador.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{computador.serial}</p>
                          <p className="text-sm text-gray-600">
                            {marca?.nombre || 'Sin marca'} {modelo?.nombre || 'Sin modelo'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getEstadoColor(computador.estado)}>
                            {computador.estado}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/computadores/${computador.id}/details`)}
                            className="h-8 px-2"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                  })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hay computadores asignados</p>
            )}
          </CardContent>
        </Card>

        {/* Dispositivos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Smartphone className="h-5 w-5 mr-2" />
                Dispositivos Asignados ({getDispositivosFiltrados().length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={openAsignarModal}
                className="h-8 px-3"
              >
                <Plus className="h-3 w-3 mr-1" />
                Asignar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Barra de búsqueda */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar dispositivos por serial, marca, modelo o estado..."
                  value={searchDispositivos}
                  onChange={(e) => setSearchDispositivos(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {getDispositivosFiltrados().length > 0 ? (
              <div className="space-y-3">
                {getDispositivosFiltrados().map((asignacion) => {
                  const dispositivo = asignacion.dispositivo;
                  if (!dispositivo) return null;
                  
                  const modelo = dispositivo.dispositivoModelos?.[0]?.modeloEquipo;
                  const marca = modelo?.marcaModelos?.[0]?.marca;
                  
                  return (
                    <div key={dispositivo.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{dispositivo.serial}</p>
                          <p className="text-sm text-gray-600">
                            {marca?.nombre || 'Sin marca'} {modelo?.nombre || 'Sin modelo'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getEstadoColor(dispositivo.estado)}>
                            {dispositivo.estado}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dispositivos/${dispositivo.id}/details`)}
                          className="h-8 px-2"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        </div>
                      </div>
                    </div>
                  );
                  })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hay dispositivos asignados</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumen de Equipos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Resumen de Equipos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold">{(empleado.asignacionesComoTarget?.filter(a => a.computador).length || 0) + (empleado.asignacionesComoTarget?.filter(a => a.dispositivo).length || 0)}</p>
              <p className="text-sm text-gray-600">Total Equipos</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                <Monitor className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{empleado.asignacionesComoTarget?.filter(a => a.computador).length || 0}</p>
              <p className="text-sm text-gray-600">Computadores</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                <Smartphone className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold">{empleado.asignacionesComoTarget?.filter(a => a.dispositivo).length || 0}</p>
              <p className="text-sm text-gray-600">Dispositivos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historial de Asignaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historial de Asignaciones ({historialAsignaciones.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeAssignmentHistory 
            historial={historialAsignaciones} 
            loading={loadingHistorial}
          />
        </CardContent>
      </Card>

      {/* Historial de Estado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            Historial de Estado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeTimeline 
            empleado={empleado} 
            statusHistory={statusHistory}
            loading={loadingStatusHistory}
          />
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Empleado</DialogTitle>
          </DialogHeader>
          {empleado && (
            <EmpleadoForm
              onSubmit={handleUpdateEmpleado}
              initialData={{
                id: empleado.id,
                empresaId: empleado.departamento?.empresa?.id || '',
                departamentoId: empleado.departamento?.id || '',
                nombre: empleado.nombre,
                apellido: empleado.apellido,
                cedula: empleado.ced,
                email: empleado.email || '',
                telefono: empleado.telefono || '',
                direccion: empleado.direccion || '',
                fechaNacimiento: empleado.fechaNacimiento || '',
                fechaIngreso: empleado.fechaIngreso || '',
                fechaDesincorporacion: empleado.fechaDesincorporacion || '',
                fotoPerfil: empleado.fotoPerfil || '',
                cargoId: empleado.cargo?.id || '',
              }}
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Status Modal */}
      {empleado && (
        <EmpleadoStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          onConfirm={handleStatusChange}
          empleado={empleado}
        />
      )}

      {/* Modal unificado para asignar equipos */}
      <AsignarEquipoUnificadoModal
        isOpen={isAsignarEquipoModalOpen}
        onClose={() => setIsAsignarEquipoModalOpen(false)}
        onConfirm={handleAsignarEquipo}
        empleadoId={id as string}
      />
    </div>
  );
}
