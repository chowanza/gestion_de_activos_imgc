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
  Eye
} from "lucide-react";
import Link from "next/link";

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
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{departamento.nombre}</h1>
            <p className="text-gray-600">Detalles del departamento</p>
          </div>
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
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                <Monitor className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold">{departamento._count.computadores}</p>
              <p className="text-sm text-gray-600">Computadores</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-2">
                <Smartphone className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold">{departamento._count.dispositivos}</p>
              <p className="text-sm text-gray-600">Dispositivos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empleados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Empleados ({departamento.empleados?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {departamento.empleados && departamento.empleados.length > 0 ? (
            <div className="space-y-3">
              {departamento.empleados.map((empleado) => (
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
                          {(empleado as any).computadores && (empleado as any).computadores.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {(empleado as any).computadores.length} PC
                            </Badge>
                          )}
                          {(empleado as any).dispositivos && (empleado as any).dispositivos.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {(empleado as any).dispositivos.length} Disp
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
            <CardTitle className="flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              Computadores ({departamento.computadores?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {departamento.computadores && departamento.computadores.length > 0 ? (
              <div className="space-y-3">
                {departamento.computadores.map((computador) => (
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
              Dispositivos ({departamento.dispositivos?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {departamento.dispositivos && departamento.dispositivos.length > 0 ? (
              <div className="space-y-3">
                {departamento.dispositivos.map((dispositivo) => (
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

      {/* Información de Auditoría */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Información de Auditoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Fecha de creación</label>
              <p className="text-sm">{formatDate(departamento.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Última actualización</label>
              <p className="text-sm">{formatDate(departamento.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
