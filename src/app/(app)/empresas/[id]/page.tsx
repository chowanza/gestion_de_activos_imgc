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

  const getTotalEmpleados = () => {
    return empresa?.departamentos.reduce((total, depto) => total + depto._count.empleados, 0) || 0;
  };

  const getTotalComputadores = () => {
    return empresa?.departamentos.reduce((total, depto) => total + depto._count.computadores, 0) || 0;
  };

  const getTotalDispositivos = () => {
    return empresa?.departamentos.reduce((total, depto) => total + depto._count.dispositivos, 0) || 0;
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
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div className="flex items-center space-x-4">
            {empresa.logo && (
              <img
                src={empresa.logo}
                alt={`Logo de ${empresa.nombre}`}
                className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">{empresa.nombre}</h1>
              <p className="text-gray-600">Detalles de la empresa</p>
            </div>
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
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                <Monitor className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold">{getTotalComputadores()}</p>
              <p className="text-sm text-gray-600">Computadores</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-2">
                <Smartphone className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold">{getTotalDispositivos()}</p>
              <p className="text-sm text-gray-600">Dispositivos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Departamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Departamentos ({empresa.departamentos?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {empresa.departamentos && empresa.departamentos.length > 0 ? (
            <div className="space-y-4">
              {empresa.departamentos.map((departamento) => (
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
            <p className="text-gray-500 text-center py-4">No hay departamentos en esta empresa</p>
          )}
        </CardContent>
      </Card>

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
              <p className="text-sm">{formatDate(empresa.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Última actualización</label>
              <p className="text-sm">{formatDate(empresa.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
