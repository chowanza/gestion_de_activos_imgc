"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  MapPin,
  Building,
  Laptop,
  Printer,
  ArrowLeft
} from 'lucide-react';
import { UbicacionForm } from '@/components/ubicacion-form';
import { useRouter } from 'next/navigation';

interface Ubicacion {
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
    activo: boolean;
    computador?: {
      id: string;
    };
    dispositivo?: {
      id: string;
    };
  }>;
  _count: {
    asignacionesEquipos: number;
  };
}

export default function UbicacionesPage() {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUbicacion, setEditingUbicacion] = useState<Ubicacion | null>(null);
  // Removido equiposCounts - ahora se calcula directamente de los datos
  const router = useRouter();

  const fetchUbicaciones = async () => {
    try {
      const response = await fetch('/api/ubicaciones');
      if (response.ok) {
        const data = await response.json();
        setUbicaciones(data);
      }
    } catch (error) {
      console.error('Error fetching ubicaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUbicaciones();
  }, []);

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la ubicación "${nombre}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/ubicaciones/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchUbicaciones();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al eliminar la ubicación');
      }
    } catch (error) {
      console.error('Error deleting ubicacion:', error);
      alert('Error al eliminar la ubicación');
    }
  };

  const handleEdit = (ubicacion: Ubicacion) => {
    setEditingUbicacion(ubicacion);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingUbicacion(null);
  };

  const handleFormSubmit = async () => {
    await fetchUbicaciones();
    handleFormClose();
  };

  const filteredUbicaciones = ubicaciones.filter(ubicacion =>
    ubicacion.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ubicacion.descripcion && ubicacion.descripcion.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (ubicacion.direccion && ubicacion.direccion.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Función auxiliar para obtener conteos únicos de equipos por ubicación
  const getEquiposCount = (ubicacion: Ubicacion) => {
    if (!ubicacion.asignacionesEquipos) {
      return { computadores: 0, dispositivos: 0 };
    }

    // Crear sets para evitar duplicados
    const computadoresUnicos = new Set();
    const dispositivosUnicos = new Set();

    ubicacion.asignacionesEquipos.forEach((asignacion: any) => {
      if (asignacion.computador) {
        computadoresUnicos.add(asignacion.computador.id);
      }
      if (asignacion.dispositivo) {
        dispositivosUnicos.add(asignacion.dispositivo.id);
      }
    });

    return { 
      computadores: computadoresUnicos.size, 
      dispositivos: dispositivosUnicos.size 
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando ubicaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ubicaciones</h1>
            <p className="text-muted-foreground">
              Gestiona las ubicaciones físicas de los equipos
            </p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Ubicación
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Ubicaciones</CardTitle>
          <CardDescription>
            Encuentra ubicaciones por nombre, descripción o dirección
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ubicaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Ubicaciones</CardTitle>
          <CardDescription>
            {filteredUbicaciones.length} ubicación(es) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUbicaciones.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchQuery ? 'No se encontraron ubicaciones' : 'No hay ubicaciones'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Comienza creando una nueva ubicación'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Piso/Sala</TableHead>
                  <TableHead>Equipos</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUbicaciones.map((ubicacion) => (
                  <TableRow key={ubicacion.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        {ubicacion.nombre}
                      </div>
                    </TableCell>
                    <TableCell>
                      {ubicacion.descripcion || (
                        <span className="text-gray-400 italic">Sin descripción</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {ubicacion.direccion || (
                        <span className="text-gray-400 italic">Sin dirección</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {ubicacion.piso && (
                          <Badge variant="outline" className="text-xs">
                            Piso: {ubicacion.piso}
                          </Badge>
                        )}
                        {ubicacion.sala && (
                          <Badge variant="outline" className="text-xs">
                            Sala: {ubicacion.sala}
                          </Badge>
                        )}
                        {!ubicacion.piso && !ubicacion.sala && (
                          <span className="text-gray-400 italic text-sm">No especificado</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {(() => {
                          const counts = getEquiposCount(ubicacion);
                          return (
                            <>
                              {counts.computadores > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  <Laptop className="h-3 w-3 mr-1" />
                                  {counts.computadores}
                                </Badge>
                              )}
                              {counts.dispositivos > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  <Printer className="h-3 w-3 mr-1" />
                                  {counts.dispositivos}
                                </Badge>
                              )}
                              {counts.computadores === 0 && counts.dispositivos === 0 && (
                                <span className="text-gray-400 italic text-sm">Sin equipos</span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/ubicaciones/${ubicacion.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(ubicacion)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(ubicacion.id, ubicacion.nombre)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <UbicacionForm
          ubicacion={editingUbicacion}
          onClose={handleFormClose}
          onSuccess={handleFormSubmit}
        />
      )}
    </div>
  );
}
