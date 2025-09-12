"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, Users, Laptop, Smartphone, Edit, Trash2, MapPin } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import Link from "next/link";

interface ModeloDetails {
  id: string;
  nombre: string;
  tipo: string;
  img?: string;
  marca: {
    id: string;
    nombre: string;
  };
  computadores: Array<{
    id: string;
    serial: string;
    estado: string;
    empleado?: {
      id: string;
      nombre: string;
      apellido: string;
      departamento: {
        nombre: string;
        empresa: {
          nombre: string;
        };
      };
    };
    departamento?: {
      nombre: string;
      empresa: {
        nombre: string;
      };
    };
  }>;
  dispositivos: Array<{
    id: string;
    serial: string;
    estado: string;
    empleado?: {
      id: string;
      nombre: string;
      apellido: string;
      departamento: {
        nombre: string;
        empresa: {
          nombre: string;
        };
      };
    };
    departamento?: {
      nombre: string;
      empresa: {
        nombre: string;
      };
    };
  }>;
}

interface UsageStats {
  totalComputadores: number;
  totalDispositivos: number;
  totalEquipos: number;
  estados: {
    asignado: number;
    resguardo: number;
    reparacion: number;
    deBaja: number;
    operativo: number;
  };
  empresas: Array<{
    nombre: string;
    count: number;
  }>;
  departamentos: Array<{
    nombre: string;
    empresa: string;
    count: number;
  }>;
  empleados: Array<{
    id: string;
    nombre: string;
    apellido: string;
    departamento: string;
    empresa: string;
    count: number;
  }>;
  ubicaciones: Array<{
    nombre: string;
    count: number;
  }>;
}

export default function ModeloDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [modelo, setModelo] = useState<ModeloDetails | null>(null);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchModeloDetails();
    }
  }, [params.id]);

  const fetchModeloDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/modelos/${params.id}/details`);
      if (!response.ok) {
        throw new Error('Error al cargar los detalles del modelo');
      }
      const data = await response.json();
      setModelo(data.modelo);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching modelo details:', error);
      showToast.error('Error al cargar los detalles del modelo');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!modelo) return;
    
    if (stats && stats.totalEquipos > 0) {
      showToast.error('No se puede eliminar un modelo que tiene equipos asignados');
      return;
    }

    if (confirm(`¿Estás seguro de que quieres eliminar el modelo "${modelo.nombre}"?`)) {
      try {
        const response = await fetch(`/api/modelos/${modelo.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          showToast.success('Modelo eliminado correctamente');
          router.push('/catalogo');
        } else {
          const error = await response.json();
          showToast.error(error.message || 'Error al eliminar el modelo');
        }
      } catch (error) {
        console.error('Error deleting modelo:', error);
        showToast.error('Error al eliminar el modelo');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!modelo) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Modelo no encontrado</h1>
          <Button asChild>
            <Link href="/catalogo">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Catálogo
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link href="/catalogo">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Catálogo
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{modelo.nombre}</h1>
            <p className="text-gray-600">Modelo de {modelo.tipo}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Perfil del Modelo */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Perfil del Modelo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Imagen del modelo */}
              <div className="flex justify-center">
                {modelo.img ? (
                  <img
                    src={modelo.img}
                    alt={modelo.nombre}
                    className="w-48 h-48 object-cover rounded-lg border"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-100 rounded-lg border flex items-center justify-center">
                    <Laptop className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Información básica */}
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nombre</label>
                  <p className="text-lg font-semibold">{modelo.nombre}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo</label>
                  <Badge variant="secondary" className="ml-2">
                    {modelo.tipo}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Marca</label>
                  <p className="text-lg">{modelo.marca.nombre}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas de Uso */}
        <div className="lg:col-span-2 space-y-6">
          {stats && (
            <>
              {/* Cantidad Total y Estados */}
              <Card>
                <CardHeader>
                  <CardTitle>Cantidad Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="text-6xl font-bold text-primary">{stats.totalEquipos}</div>
                    <div className="text-lg text-gray-500 mt-2">Equipos en total</div>
                  </div>
                  
                  {/* Estados */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.estados.operativo}</div>
                      <div className="text-xs text-green-600 font-medium">Operativo</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{stats.estados.asignado}</div>
                      <div className="text-xs text-blue-600 font-medium">Asignado</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{stats.estados.resguardo}</div>
                      <div className="text-xs text-yellow-600 font-medium">Resguardo</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{stats.estados.reparacion}</div>
                      <div className="text-xs text-orange-600 font-medium">Reparación</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{stats.estados.deBaja}</div>
                      <div className="text-xs text-red-600 font-medium">De Baja</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Uso por Empresa */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    Uso por Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.empresas.length > 0 ? (
                    <div className="space-y-2">
                      {stats.empresas.map((empresa, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">{empresa.nombre}</span>
                          <Badge variant="outline">{empresa.count} equipos</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No hay equipos asignados</p>
                  )}
                </CardContent>
              </Card>

              {/* Uso por Departamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Uso por Departamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.departamentos.length > 0 ? (
                    <div className="space-y-2">
                      {stats.departamentos.map((depto, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">{depto.nombre}</span>
                            <p className="text-sm text-gray-500">{depto.empresa}</p>
                          </div>
                          <Badge variant="outline">{depto.count} equipos</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No hay equipos asignados</p>
                  )}
                </CardContent>
              </Card>

              {/* Empleados que usan este modelo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Empleados que usan este modelo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.empleados.length > 0 ? (
                    <div className="space-y-2">
                      {stats.empleados.map((empleado, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">{empleado.nombre} {empleado.apellido}</span>
                            <p className="text-sm text-gray-500">{empleado.departamento} - {empleado.empresa}</p>
                          </div>
                          <Badge variant="outline">{empleado.count} equipos</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No hay empleados asignados</p>
                  )}
                </CardContent>
              </Card>

              {/* Uso por Ubicación */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Uso por Ubicación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.ubicaciones.length > 0 ? (
                    <div className="space-y-2">
                      {stats.ubicaciones.map((ubicacion, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">{ubicacion.nombre}</span>
                          <Badge variant="outline">{ubicacion.count} equipos</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No hay equipos en ubicaciones específicas</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
