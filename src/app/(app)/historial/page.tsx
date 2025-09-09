'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Clock, User, Activity, Eye, Edit, Trash2, Plus, ArrowRightLeft, Globe, Monitor } from 'lucide-react';
import { PermissionGuard } from '@/components/PermissionGuard';

interface HistorialMovimiento {
  id: string;
  fecha: string;
  accion: string;
  entidad: string;
  entidadId: string | null;
  descripcion: string;
  detalles: string | null;
  usuario: {
    id: string;
    username: string;
    role: string;
  } | null;
  ipAddress: string | null;
  userAgent: string | null;
}

interface HistorialModificacion {
  id: string;
  fecha: string;
  campo: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
  computador: {
    id: string;
    serial: string;
    modelo: {
      nombre: string;
      marca: {
        nombre: string;
      };
    };
  };
}

interface HistorialAsignacion {
  id: number;
  fecha: string;
  accion: string;
  motivo: string | null;
  notas: string | null;
  localidad: string | null;
  gerente: string | null;
  gerenteUsuario: {
    id: string;
    nombre: string;
    apellido: string;
    legajo: number;
  } | null;
  item: {
    tipo: string;
    serial?: string;
    numero?: string;
    modelo?: string;
    proveedor?: string;
    id: string;
  } | null;
  target: {
    tipo: string;
    nombre: string;
    legajo?: string;
    departamento?: string;
    empresa?: string;
    id: string;
  } | null;
  serialC: string | null;
  modeloC: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function HistorialPage() {
  const [movimientos, setMovimientos] = useState<HistorialMovimiento[]>([]);
  const [modificaciones, setModificaciones] = useState<HistorialModificacion[]>([]);
  const [asignaciones, setAsignaciones] = useState<HistorialAsignacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccion, setFilterAccion] = useState('');
  const [filterEntidad, setFilterEntidad] = useState('');
  const [filterAsignacionAccion, setFilterAsignacionAccion] = useState('');
  const [filterAsignacionItem, setFilterAsignacionItem] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchMovimientos();
    fetchModificaciones();
    fetchAsignaciones();
  }, [currentPage, filterAccion, filterEntidad, filterAsignacionAccion, filterAsignacionItem]);

  const fetchMovimientos = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filterAccion && filterAccion !== 'all' && { accion: filterAccion }),
        ...(filterEntidad && filterEntidad !== 'all' && { entidad: filterEntidad }),
      });

      const response = await fetch(`/api/historial-movimientos?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMovimientos(data.movimientos);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching movimientos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModificaciones = async () => {
    try {
      const response = await fetch('/api/computador/modificaciones');
      if (response.ok) {
        const data = await response.json();
        setModificaciones(data);
      }
    } catch (error) {
      console.error('Error fetching modificaciones:', error);
    }
  };

  const fetchAsignaciones = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filterAsignacionAccion && filterAsignacionAccion !== 'all' && { actionType: filterAsignacionAccion }),
        ...(filterAsignacionItem && filterAsignacionItem !== 'all' && { itemType: filterAsignacionItem }),
      });

      const response = await fetch(`/api/historial-asignaciones?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAsignaciones(data.asignaciones);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching asignaciones:', error);
    }
  };

  const getAccionIcon = (accion: string) => {
    switch (accion) {
      case 'navegacion': return <Globe className="h-4 w-4" />;
      case 'login': return <User className="h-4 w-4" />;
      case 'logout': return <User className="h-4 w-4" />;
      case 'create': return <Plus className="h-4 w-4" />;
      case 'update': return <Edit className="h-4 w-4" />;
      case 'delete': return <Trash2 className="h-4 w-4" />;
      case 'view': return <Eye className="h-4 w-4" />;
      case 'assign': return <ArrowRightLeft className="h-4 w-4" />;
      case 'unassign': return <ArrowRightLeft className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getAccionColor = (accion: string) => {
    switch (accion) {
      case 'navegacion': return 'bg-blue-100 text-blue-800';
      case 'login': return 'bg-green-100 text-green-800';
      case 'logout': return 'bg-gray-100 text-gray-800';
      case 'create': return 'bg-blue-100 text-blue-800';
      case 'update': return 'bg-yellow-100 text-yellow-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'view': return 'bg-purple-100 text-purple-800';
      case 'assign': return 'bg-orange-100 text-orange-800';
      case 'unassign': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAsignacionIcon = (accion: string) => {
    switch (accion.toLowerCase()) {
      case 'asignación': return <ArrowRightLeft className="h-4 w-4" />;
      case 'devolución': return <ArrowRightLeft className="h-4 w-4" />;
      case 'reasignación': return <ArrowRightLeft className="h-4 w-4" />;
      case 'traspaso': return <ArrowRightLeft className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getAsignacionColor = (accion: string) => {
    switch (accion.toLowerCase()) {
      case 'asignación': return 'bg-green-100 text-green-800';
      case 'devolución': return 'bg-red-100 text-red-800';
      case 'reasignación': return 'bg-blue-100 text-blue-800';
      case 'traspaso': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredMovimientos = movimientos.filter(movimiento =>
    movimiento.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movimiento.usuario?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movimiento.entidad.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Historial del Sistema</h1>
      </div>

      <Tabs defaultValue="movimientos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="movimientos">Movimientos del Sistema</TabsTrigger>
          <TabsTrigger value="asignaciones">Historial de Asignaciones</TabsTrigger>
          <TabsTrigger value="modificaciones">Modificaciones de Equipos</TabsTrigger>
        </TabsList>

        <TabsContent value="movimientos" className="space-y-6">
          <PermissionGuard permission="canViewAuditLogs">
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Registro de navegación del sistema, login/logout y acciones administrativas
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar movimientos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterAccion} onValueChange={setFilterAccion}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por acción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las acciones</SelectItem>
                  <SelectItem value="navegacion">Navegación</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="create">Crear</SelectItem>
                  <SelectItem value="update">Actualizar</SelectItem>
                  <SelectItem value="delete">Eliminar</SelectItem>
                  <SelectItem value="unassign">Desasignar</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterEntidad} onValueChange={setFilterEntidad}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por entidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las entidades</SelectItem>
                  <SelectItem value="sistema">Sistema</SelectItem>
                  <SelectItem value="usuario">Usuario</SelectItem>
                  <SelectItem value="empresa">Empresa</SelectItem>
                  <SelectItem value="departamento">Departamento</SelectItem>
                  <SelectItem value="cargo">Cargo</SelectItem>
                  <SelectItem value="computador">Computador</SelectItem>
                  <SelectItem value="dispositivo">Dispositivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {filteredMovimientos.map((movimiento) => (
                <Card key={movimiento.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getAccionIcon(movimiento.accion)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-3">
                            <Badge className={getAccionColor(movimiento.accion)}>
                              {movimiento.accion.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="bg-gray-100">
                              {movimiento.entidad.toUpperCase()}
                            </Badge>
                            {movimiento.entidadId && (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                ID: {movimiento.entidadId}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="mb-3">
                            <h4 className="font-semibold text-gray-900 mb-1">Descripción:</h4>
                            <p className="text-gray-700 text-sm leading-relaxed">{movimiento.descripcion}</p>
                          </div>
                          
                          {movimiento.detalles && (
                            <div className="mb-3">
                              <h4 className="font-semibold text-gray-600 mb-1">Detalles adicionales:</h4>
                              <p className="text-gray-600 text-sm bg-gray-50 p-2 rounded border">{movimiento.detalles}</p>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <div>
                                <span className="font-medium">Fecha y hora:</span>
                                <p className="text-gray-700">{formatDate(movimiento.fecha)}</p>
                              </div>
                            </div>
                            
                            {movimiento.usuario && (
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4" />
                                <div>
                                  <span className="font-medium">Usuario:</span>
                                  <p className="text-gray-700">
                                    {movimiento.usuario.username} 
                                    <span className="ml-1 px-1 py-0.5 bg-gray-200 rounded text-xs">
                                      {movimiento.usuario.role}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            {movimiento.ipAddress && (
                              <div className="flex items-center space-x-2">
                                <Globe className="h-4 w-4" />
                                <div>
                                  <span className="font-medium">IP:</span>
                                  <p className="text-gray-700 font-mono">{movimiento.ipAddress}</p>
                                </div>
                              </div>
                            )}
                            
                            {movimiento.userAgent && (
                              <div className="flex items-center space-x-2">
                                <Monitor className="h-4 w-4" />
                                <div>
                                  <span className="font-medium">Navegador:</span>
                                  <p className="text-gray-700 text-xs truncate max-w-xs" title={movimiento.userAgent}>
                                    {movimiento.userAgent.length > 50 
                                      ? `${movimiento.userAgent.substring(0, 50)}...` 
                                      : movimiento.userAgent}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredMovimientos.length === 0 && (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No se encontraron movimientos
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay movimientos registrados'}
                  </p>
                </div>
              )}
            </div>
          </PermissionGuard>
        </TabsContent>

        <TabsContent value="asignaciones" className="space-y-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Registro completo de asignaciones y devoluciones de equipos
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar asignaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterAsignacionAccion} onValueChange={setFilterAsignacionAccion}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las acciones</SelectItem>
                <SelectItem value="Asignación">Asignación</SelectItem>
                <SelectItem value="Devolución">Devolución</SelectItem>
                <SelectItem value="Reasignación">Reasignación</SelectItem>
                <SelectItem value="Traspaso">Traspaso</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAsignacionItem} onValueChange={setFilterAsignacionItem}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por ítem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los ítems</SelectItem>
                <SelectItem value="Computador">Computador</SelectItem>
                <SelectItem value="Dispositivo">Dispositivo</SelectItem>
                <SelectItem value="LineaTelefonica">Línea Telefónica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {asignaciones.map((asignacion) => (
              <Card key={asignacion.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getAsignacionIcon(asignacion.accion)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getAsignacionColor(asignacion.accion)}>
                            {asignacion.accion}
                          </Badge>
                          {asignacion.item && (
                            <Badge variant="outline">
                              {asignacion.item.tipo}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <span className="font-medium text-gray-700">Ítem:</span>
                            <p className="text-gray-600">
                              {asignacion.item ? (
                                <>
                                  {asignacion.item.modelo && `${asignacion.item.modelo} `}
                                  {asignacion.item.serial && `(S/N: ${asignacion.item.serial})`}
                                  {asignacion.item.numero && `(Número: ${asignacion.item.numero})`}
                                </>
                              ) : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Destinatario:</span>
                            <p className="text-gray-600">
                              {asignacion.target ? (
                                <>
                                  {asignacion.target.nombre}
                                  {asignacion.target.legajo && ` (Legajo: ${asignacion.target.legajo})`}
                                  {asignacion.target.departamento && ` - ${asignacion.target.departamento}`}
                                  {asignacion.target.empresa && ` (${asignacion.target.empresa})`}
                                </>
                              ) : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {asignacion.motivo && (
                          <div className="mb-2">
                            <span className="font-medium text-gray-700">Motivo:</span>
                            <p className="text-gray-600">{asignacion.motivo}</p>
                          </div>
                        )}

                        {asignacion.notas && (
                          <div className="mb-2">
                            <span className="font-medium text-gray-700">Notas:</span>
                            <p className="text-gray-600">{asignacion.notas}</p>
                          </div>
                        )}

                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(asignacion.fecha)}</span>
                          </div>
                          {asignacion.gerenteUsuario && (
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{asignacion.gerenteUsuario.nombre} {asignacion.gerenteUsuario.apellido} (Legajo: {asignacion.gerenteUsuario.legajo})</span>
                            </div>
                          )}
                          {asignacion.localidad && (
                            <span>Localidad: {asignacion.localidad}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {asignaciones.length === 0 && (
              <div className="text-center py-12">
                <ArrowRightLeft className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron asignaciones
                </h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay asignaciones registradas'}
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="modificaciones" className="space-y-6">
          <div className="space-y-4">
            {modificaciones.map((modificacion) => (
              <Card key={modificacion.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline">
                          {modificacion.computador.modelo.marca.nombre} {modificacion.computador.modelo.nombre}
                        </Badge>
                        <Badge variant="secondary">
                          {modificacion.computador.serial}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-900 mb-2">
                        <span className="font-medium">Campo modificado:</span> {modificacion.campo}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-red-600">Valor anterior:</span>
                          <p className="text-gray-600">{modificacion.valorAnterior || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-green-600">Valor nuevo:</span>
                          <p className="text-gray-600">{modificacion.valorNuevo || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500 mt-2">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(modificacion.fecha)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {modificaciones.length === 0 && (
              <div className="text-center py-12">
                <Edit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay modificaciones registradas
                </h3>
                <p className="text-gray-600">
                  Las modificaciones de equipos aparecerán aquí cuando se realicen cambios
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
