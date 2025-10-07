"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ArrowLeft, 
  MapPin, 
  Building, 
  Laptop, 
  Printer, 
  User, 
  Globe,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { UbicacionForm } from '@/components/ubicacion-form';

interface Computador {
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
}

interface Dispositivo {
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
}

interface UbicacionDetails {
  id: string;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  piso?: string;
  sala?: string;
  createdAt: string;
  updatedAt: string;
  asignacionesEquipos?: Array<{
    id: string;
    date: string;
    notes?: string;
    actionType: string;
    motivo?: string;
    targetType: string;
    itemType: string;
    activo: boolean;
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
    targetEmpleado?: {
      id: string;
      nombre: string;
      apellido: string;
      organizaciones: Array<{
        departamento: {
          nombre: string;
        };
        empresa: {
          nombre: string;
        };
      }>;
    };
  }>;
}

export default function UbicacionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [ubicacion, setUbicacion] = useState<UbicacionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);

  const fetchUbicacion = async () => {
    try {
      const response = await fetch(`/api/ubicaciones/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setUbicacion(data);
      } else {
        console.error('Error fetching ubicacion');
      }
    } catch (error) {
      console.error('Error fetching ubicacion:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchUbicacion();
    }
  }, [params.id]);

  const handleDelete = async () => {
    if (!ubicacion) return;
    
    if (!confirm(`¿Estás seguro de que quieres eliminar la ubicación "${ubicacion.nombre}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/ubicaciones/${ubicacion.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/ubicaciones');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al eliminar la ubicación');
      }
    } catch (error) {
      console.error('Error deleting ubicacion:', error);
      alert('Error al eliminar la ubicación');
    }
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    fetchUbicacion();
  };

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'operativo':
        return 'default';
      case 'asignado':
        return 'secondary';
      case 'resguardo':
        return 'outline';
      case 'reparacion':
        return 'destructive';
      case 'de baja':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando ubicación...</p>
        </div>
      </div>
    );
  }

  if (!ubicacion) {
    return (
      <div className="text-center py-8">
        <MapPin className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Ubicación no encontrada</h3>
        <p className="mt-1 text-sm text-gray-500">
          La ubicación que buscas no existe o ha sido eliminada.
        </p>
        <Button onClick={() => router.push('/ubicaciones')} className="mt-4">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Calcular total de equipos únicos después de obtener las listas
  
  // Funciones auxiliares para obtener equipos únicos de las asignaciones
  const getComputadores = () => {
    if (!ubicacion.asignacionesEquipos) return [];
    
    // Crear un mapa para evitar duplicados, manteniendo la asignación más reciente
    const computadoresMap = new Map();
    
    ubicacion.asignacionesEquipos
      .filter(asignacion => asignacion.computador)
      .forEach(asignacion => {
        const computadorId = asignacion.computador!.id;
        if (!computadoresMap.has(computadorId)) {
          computadoresMap.set(computadorId, {
            ...asignacion.computador!,
            empleado: asignacion.targetEmpleado ? {
              id: asignacion.targetEmpleado.id,
              nombre: asignacion.targetEmpleado.nombre,
              apellido: asignacion.targetEmpleado.apellido,
              departamento: {
                nombre: asignacion.targetEmpleado.organizaciones?.[0]?.departamento?.nombre || 'Sin departamento',
                empresa: {
                  nombre: asignacion.targetEmpleado.organizaciones?.[0]?.empresa?.nombre || 'Sin empresa'
                }
              }
            } : undefined
          });
        }
      });
    
    return Array.from(computadoresMap.values());
  };

  const getDispositivos = () => {
    if (!ubicacion.asignacionesEquipos) return [];
    
    // Crear un mapa para evitar duplicados, manteniendo la asignación más reciente
    const dispositivosMap = new Map();
    
    ubicacion.asignacionesEquipos
      .filter(asignacion => asignacion.dispositivo)
      .forEach(asignacion => {
        const dispositivoId = asignacion.dispositivo!.id;
        if (!dispositivosMap.has(dispositivoId)) {
          dispositivosMap.set(dispositivoId, {
            ...asignacion.dispositivo!,
            empleado: asignacion.targetEmpleado ? {
              id: asignacion.targetEmpleado.id,
              nombre: asignacion.targetEmpleado.nombre,
              apellido: asignacion.targetEmpleado.apellido,
              departamento: {
                nombre: asignacion.targetEmpleado.organizaciones?.[0]?.departamento?.nombre || 'Sin departamento',
                empresa: {
                  nombre: asignacion.targetEmpleado.organizaciones?.[0]?.empresa?.nombre || 'Sin empresa'
                }
              }
            } : undefined
          });
        }
      });
    
    return Array.from(dispositivosMap.values());
  };

  const computadores = getComputadores();
  const dispositivos = getDispositivos();
  const totalEquipos = computadores.length + dispositivos.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <MapPin className="h-8 w-8" />
              {ubicacion.nombre}
            </h1>
            <p className="text-muted-foreground">
              Detalles de la ubicación y equipos asignados
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowEditForm(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Ubicación Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Ubicación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Descripción</Label>
                <p className="mt-1">
                  {ubicacion.descripcion || (
                    <span className="text-gray-400 italic">Sin descripción</span>
                  )}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Dirección</Label>
                <p className="mt-1">
                  {ubicacion.direccion || (
                    <span className="text-gray-400 italic">Sin dirección</span>
                  )}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Piso</Label>
                <p className="mt-1">
                  {ubicacion.piso || (
                    <span className="text-gray-400 italic">No especificado</span>
                  )}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Sala</Label>
                <p className="mt-1">
                  {ubicacion.sala || (
                    <span className="text-gray-400 italic">No especificado</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de Equipos */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Equipos</CardTitle>
          <CardDescription>
            Total de equipos asignados a esta ubicación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Laptop className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold">{computadores.length}</span>
              </div>
              <p className="text-sm text-gray-600">Computadoras</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Printer className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold">{dispositivos.length}</span>
              </div>
              <p className="text-sm text-gray-600">Dispositivos</p>
            </div>
            <div className="text-center p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Building className="h-5 w-5 text-gray-600" />
                <span className="text-2xl font-bold">{totalEquipos}</span>
              </div>
              <p className="text-sm text-gray-600">Total Equipos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Computadoras */}
      {computadores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Laptop className="h-5 w-5" />
              Computadoras ({computadores.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Asignado a</TableHead>
                  <TableHead>Empresa/Departamento</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {computadores.map((computador) => (
                  <TableRow key={computador.id}>
                    <TableCell className="font-mono">{computador.serial}</TableCell>
                    <TableCell>
                      {computador.computadorModelos[0]?.modeloEquipo?.marcaModelos[0]?.marca?.nombre} {computador.computadorModelos[0]?.modeloEquipo?.nombre}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getEstadoBadgeVariant(computador.estado)}>
                        {computador.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {computador.empleado ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          {computador.empleado.nombre} {computador.empleado.apellido}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Sin asignar</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {computador.empleado ? (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-gray-500" />
                          {computador.empleado.departamento.empresa.nombre} / {computador.empleado.departamento.nombre}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/computadores/${computador.id}/details`)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {computador.empleado && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/empleados/${computador.empleado?.id}`)}
                            className="h-8 w-8 p-0"
                          >
                            <User className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dispositivos */}
      {dispositivos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Dispositivos ({dispositivos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Asignado a</TableHead>
                  <TableHead>Empresa/Departamento</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dispositivos.map((dispositivo) => (
                  <TableRow key={dispositivo.id}>
                    <TableCell className="font-mono">{dispositivo.serial}</TableCell>
                    <TableCell>
                      {dispositivo.dispositivoModelos[0]?.modeloEquipo?.marcaModelos[0]?.marca?.nombre} {dispositivo.dispositivoModelos[0]?.modeloEquipo?.nombre}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getEstadoBadgeVariant(dispositivo.estado)}>
                        {dispositivo.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {dispositivo.empleado ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          {dispositivo.empleado.nombre} {dispositivo.empleado.apellido}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Sin asignar</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {dispositivo.empleado ? (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-gray-500" />
                          {dispositivo.empleado.departamento.empresa.nombre} / {dispositivo.empleado.departamento.nombre}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dispositivos/${dispositivo.id}/details`)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {dispositivo.empleado && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/empleados/${dispositivo.empleado?.id}`)}
                            className="h-8 w-8 p-0"
                          >
                            <User className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Sin equipos */}
      {totalEquipos === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay equipos asignados
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Esta ubicación no tiene computadoras ni dispositivos asignados.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Form Modal */}
      {showEditForm && (
        <UbicacionForm
          ubicacion={ubicacion}
          onClose={() => setShowEditForm(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

// Helper component for Label
function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props}>
      {children}
    </label>
  );
}
