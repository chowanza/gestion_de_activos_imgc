'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Clock, User, Activity, Eye, Edit, Trash2, Plus, ArrowRightLeft, Globe, Monitor, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { PermissionGuard } from '@/components/PermissionGuard';
import { useRouter } from 'next/navigation';

interface AuditLog {
  id: string;
  fecha: string;
  tipo: 'Sistema' | 'Asignación' | 'Modificación';
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
  equipo: {
    id: string;
    serial: string;
    modelo: string;
  } | null;
  targetEmpleado: {
    id: string;
    nombre: string;
    ced: string | null;
  } | null;
  campo: string | null;
  valorAnterior: string | null;
  valorNuevo: string | null;
}

export default function HistorialPage() {
  const router = useRouter();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    porTipo: {} as Record<string, number>,
    porAccion: {} as Record<string, number>,
    porEntidad: {} as Record<string, number>
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, filterType, filterAction, searchTerm]);

  const fetchAuditLogs = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        ...(searchTerm && { search: searchTerm }),
        ...(filterType !== 'all' && { filterType }),
        ...(filterAction !== 'all' && { filterAction }),
      });

      const response = await fetch(`/api/historial/audit?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.data.logs);
        setTotalPages(data.data.pagination.pages);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAccionIcon = (accion: string, tipo: string) => {
    if (tipo === 'Sistema') {
      switch (accion.toLowerCase()) {
        case 'navegacion': return <Globe className="h-4 w-4" />;
        case 'login': return <User className="h-4 w-4" />;
        case 'logout': return <User className="h-4 w-4" />;
        case 'create': return <Plus className="h-4 w-4" />;
        case 'update': return <Edit className="h-4 w-4" />;
        case 'delete': return <Trash2 className="h-4 w-4" />;
        case 'view': return <Eye className="h-4 w-4" />;
        default: return <Activity className="h-4 w-4" />;
      }
    } else if (tipo === 'Asignación') {
      return <ArrowRightLeft className="h-4 w-4" />;
    } else if (tipo === 'Modificación') {
      return <Edit className="h-4 w-4" />;
    }
    return <Activity className="h-4 w-4" />;
  };

  const getAccionColor = (accion: string, tipo: string) => {
    if (tipo === 'Sistema') {
      switch (accion.toLowerCase()) {
        case 'navegacion': return 'bg-blue-100 text-blue-800';
        case 'login': return 'bg-green-100 text-green-800';
        case 'logout': return 'bg-gray-100 text-gray-800';
        case 'create': return 'bg-blue-100 text-blue-800';
        case 'update': return 'bg-yellow-100 text-yellow-800';
        case 'delete': return 'bg-red-100 text-red-800';
        case 'view': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    } else if (tipo === 'Asignación') {
      switch (accion.toLowerCase()) {
        case 'asignación': return 'bg-green-100 text-green-800';
        case 'devolución': return 'bg-red-100 text-red-800';
        case 'reasignación': return 'bg-blue-100 text-blue-800';
        case 'traspaso': return 'bg-purple-100 text-purple-800';
        default: return 'bg-orange-100 text-orange-800';
      }
    } else if (tipo === 'Modificación') {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Sistema': return 'bg-blue-100 text-blue-800';
      case 'Asignación': return 'bg-green-100 text-green-800';
      case 'Modificación': return 'bg-yellow-100 text-yellow-800';
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
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Historial del Sistema</h1>
            <p className="text-sm text-gray-600">Registro completo de auditoría - {stats.total} registros</p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sistema</p>
                <p className="text-2xl font-bold text-blue-600">{stats.porTipo.Sistema || 0}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Asignaciones</p>
                <p className="text-2xl font-bold text-green-600">{stats.porTipo.Asignación || 0}</p>
              </div>
              <ArrowRightLeft className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Modificaciones</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.porTipo.Modificación || 0}</p>
              </div>
              <Edit className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar en todos los registros..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="Sistema">Sistema</SelectItem>
                <SelectItem value="Asignación">Asignación</SelectItem>
                <SelectItem value="Modificación">Modificación</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las acciones</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="view">Visualización</SelectItem>
                <SelectItem value="create">Crear</SelectItem>
                <SelectItem value="update">Actualizar</SelectItem>
                <SelectItem value="delete">Eliminar</SelectItem>
                <SelectItem value="Asignación">Asignación</SelectItem>
                <SelectItem value="Devolución">Devolución</SelectItem>
                <SelectItem value="Modificación">Modificación</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Auditoría */}
      <PermissionGuard permission="canViewAuditLogs">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Registro de Auditoría Completo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">
                        {formatDate(log.fecha)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTipoColor(log.tipo)}>
                          {log.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getAccionIcon(log.accion, log.tipo)}
                          <Badge variant="outline" className={getAccionColor(log.accion, log.tipo)}>
                            {log.accion}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm truncate" title={log.descripcion}>
                          {log.descripcion}
                        </p>
                      </TableCell>
                      <TableCell>
                        {log.usuario ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">{log.usuario.username}</p>
                              <p className="text-xs text-gray-500">{log.usuario.role}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Sistema</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.equipo ? (
                          <div>
                            <p className="text-sm font-medium">{log.equipo.modelo}</p>
                            <p className="text-xs text-gray-500">S/N: {log.equipo.serial}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.targetEmpleado ? (
                          <div>
                            <p className="text-sm font-medium">{log.targetEmpleado.nombre}</p>
                            {log.targetEmpleado.ced && (
                              <p className="text-xs text-gray-500">Cédula: {log.targetEmpleado.ced}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {log.detalles ? (
                          <p className="text-xs text-gray-600 truncate" title={log.detalles}>
                            {log.detalles}
                          </p>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {auditLogs.length === 0 && (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron registros
                </h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay registros de auditoría'}
                </p>
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </PermissionGuard>
    </div>
  );
}
