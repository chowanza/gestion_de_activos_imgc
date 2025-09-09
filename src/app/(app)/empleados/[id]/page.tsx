"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { showToast } from "nextjs-toast-notify";
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
  Clock
} from "lucide-react";
import Link from "next/link";

interface EmpleadoDetails {
  id: string;
  nombre: string;
  apellido: string;
  ced: string;
  fechaNacimiento?: string;
  fechaIngreso?: string;
  fotoPerfil?: string;
  departamento: {
    id: string;
    nombre: string;
    empresa: {
      id: string;
      nombre: string;
      descripcion?: string;
      logo?: string;
    };
  };
  cargo: {
    id: string;
    nombre: string;
    descripcion?: string;
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

    if (id) {
      fetchEmpleado();
      fetchHistorialAsignaciones();
    }
  }, [id]);

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
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 flex items-center justify-center bg-gray-50">
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
              <h1 className="text-3xl font-bold">{empleado.nombre} {empleado.apellido}</h1>
              <p className="text-gray-600">Detalles del empleado</p>
            </div>
          </div>
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
                <p className="text-lg font-semibold">{empleado.cargo.nombre}</p>
                {empleado.cargo.descripcion && (
                  <Badge variant="outline">{empleado.cargo.descripcion}</Badge>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Departamento</label>
              <div className="flex items-center space-x-2">
                <p className="text-lg font-semibold">{empleado.departamento.nombre}</p>
                <Link href={`/departamentos/${empleado.departamento.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Departamento
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <label className="text-sm font-medium text-gray-500">Empresa</label>
            <div className="flex items-center space-x-4 mt-2">
              {empleado.departamento.empresa.logo && (
                <img
                  src={empleado.departamento.empresa.logo}
                  alt={`Logo de ${empleado.departamento.empresa.nombre}`}
                  className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                />
              )}
              <div>
                <p className="text-lg font-semibold">{empleado.departamento.empresa.nombre}</p>
                {empleado.departamento.empresa.descripcion && (
                  <p className="text-sm text-gray-600">{empleado.departamento.empresa.descripcion}</p>
                )}
              </div>
              <Link href={`/empresas/${empleado.departamento.empresa.id}`}>
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
            <CardTitle className="flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              Computadores Asignados ({empleado.computadores?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {empleado.computadores && empleado.computadores.length > 0 ? (
              <div className="space-y-3">
                {empleado.computadores.map((computador) => (
                  <div key={computador.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{computador.serial}</p>
                        <p className="text-sm text-gray-600">
                          {computador.modelo.marca.nombre} {computador.modelo.nombre}
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
            <CardTitle className="flex items-center">
              <Smartphone className="h-5 w-5 mr-2" />
              Dispositivos Asignados ({empleado.dispositivos?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {empleado.dispositivos && empleado.dispositivos.length > 0 ? (
              <div className="space-y-3">
                {empleado.dispositivos.map((dispositivo) => (
                  <div key={dispositivo.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{dispositivo.serial}</p>
                        <p className="text-sm text-gray-600">
                          {dispositivo.modelo.marca.nombre} {dispositivo.modelo.nombre}
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

      {/* Resumen de Equipos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Resumen de Equipos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                <Monitor className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{empleado.computadores?.length || 0}</p>
              <p className="text-sm text-gray-600">Computadores</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                <Smartphone className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold">{empleado.dispositivos?.length || 0}</p>
              <p className="text-sm text-gray-600">Dispositivos</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold">{(empleado.computadores?.length || 0) + (empleado.dispositivos?.length || 0)}</p>
              <p className="text-sm text-gray-600">Total Equipos</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-2">
                <UserCheck className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold">
                {(empleado.computadores?.filter(c => c.estado.toLowerCase() === 'activo').length || 0) + 
                 (empleado.dispositivos?.filter(d => d.estado.toLowerCase() === 'activo').length || 0)}
              </p>
              <p className="text-sm text-gray-600">Activos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historial de Asignaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historial de Asignaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistorial ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6" />
              <span className="ml-2">Cargando historial...</span>
            </div>
          ) : historialAsignaciones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hay historial de asignaciones para este empleado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historialAsignaciones.map((asignacion) => (
                <div key={asignacion.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={asignacion.accion === 'Asignacion' ? 'default' : 'secondary'}>
                          {asignacion.accion}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(asignacion.fecha).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      {asignacion.item && (
                        <div className="mb-2">
                          <p className="font-medium">
                            {asignacion.itemType}: {asignacion.item.serial || asignacion.item.numero}
                          </p>
                          {asignacion.item.modelo && (
                            <p className="text-sm text-gray-600">
                              {asignacion.item.marca} {asignacion.item.modelo}
                            </p>
                          )}
                          {asignacion.item.proveedor && (
                            <p className="text-sm text-gray-600">
                              Proveedor: {asignacion.item.proveedor}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {asignacion.motivo && (
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Motivo:</strong> {asignacion.motivo}
                        </p>
                      )}
                      
                      {asignacion.notas && (
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Notas:</strong> {asignacion.notas}
                        </p>
                      )}
                      
                      {asignacion.gerente && (
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Gerente:</strong> {asignacion.gerente}
                        </p>
                      )}
                      
                      {asignacion.localidad && (
                        <p className="text-sm text-gray-600">
                          <strong>Localidad:</strong> {asignacion.localidad}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
