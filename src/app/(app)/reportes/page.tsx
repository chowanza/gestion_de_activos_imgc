"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Download, FileText, BarChart3, TrendingUp, Users, Building, Cpu, Monitor } from 'lucide-react';
import { showToast } from 'nextjs-toast-notify';
import { reactSelectStyles } from '@/utils/reactSelectStyles';
import { formatDate } from '@/utils/formatDate';
import { exportToPDF, exportToExcel, ExportData } from '@/utils/exportUtils';

// Componentes dinámicos para evitar problemas de hidratación
const DynamicReactSelect = dynamic(() => import('react-select'), {
  ssr: false,
  loading: () => <div className="h-10 bg-gray-100 rounded animate-pulse" />
});

interface Movement {
  id: number;
  fecha: string;
  accion: string;
  motivo: string;
  notas: string;
  localidad: string;
  gerente: string;
  equipo: {
    tipo: string;
    serial: string;
    modelo: string;
    estado: string;
  };
  destino: {
    tipo: string;
    empleado: string | null;
    departamento: string | null;
    empresa: string | null;
  };
  empresaActual: {
    viaEmpleado: string | null;
    viaDepartamento: string | null;
    nombre: string;
  };
}

interface Stats {
  totalMovimientos: number;
  porTipoAccion: Record<string, number>;
  porTipoEquipo: Record<string, number>;
  porEmpresa: Record<string, number>;
}

interface DateRange {
  inicio: string;
  fin: string;
  dias: number;
}

interface ReportData {
  movimientos: Movement[];
  estadisticas: Stats;
  rangoFechas: DateRange;
  filtros: any;
}

export default function ReportesPage() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  
  // Filtros
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionType, setActionType] = useState('all');
  const [itemType, setItemType] = useState('all');
  const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null);
  const [selectedDepartamento, setSelectedDepartamento] = useState<any>(null);
  const [selectedEmpleado, setSelectedEmpleado] = useState<any>(null);

  // Datos para filtros
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);

  // Establecer fechas por defecto (últimos 30 días)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  // Cargar datos para filtros
  useEffect(() => {
    loadFilterData();
  }, []);

  const loadFilterData = async () => {
    try {
      const [empresasRes, departamentosRes, empleadosRes] = await Promise.all([
        fetch('/api/empresas'),
        fetch('/api/departamentos'),
        fetch('/api/usuarios')
      ]);

      const [empresasData, departamentosData, empleadosData] = await Promise.all([
        empresasRes.json(),
        departamentosRes.json(),
        empleadosRes.json()
      ]);

      setEmpresas(empresasData.map((emp: any) => ({
        value: emp.id,
        label: emp.nombre
      })));

      setDepartamentos(departamentosData.map((dept: any) => ({
        value: dept.id,
        label: dept.nombre,
        empresa: dept.empresa?.nombre
      })));

      setEmpleados(empleadosData.map((emp: any) => ({
        value: emp.id,
        label: `${emp.nombre} ${emp.apellido}`,
        departamento: emp.departamento?.nombre,
        empresa: emp.departamento?.empresa?.nombre
      })));
    } catch (error) {
      console.error('Error cargando datos de filtros:', error);
    }
  };

  const generateReport = async () => {
    if (!startDate || !endDate) {
      showToast.error('Seleccione las fechas de inicio y fin');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(actionType && actionType !== 'all' && { actionType }),
        ...(itemType && itemType !== 'all' && { itemType }),
        ...(selectedEmpresa?.value && { empresaId: selectedEmpresa.value }),
        ...(selectedDepartamento?.value && { departamentoId: selectedDepartamento.value }),
        ...(selectedEmpleado?.value && { empleadoId: selectedEmpleado.value })
      });

      const response = await fetch(`/api/reports/movements?${params}`);
      if (!response.ok) throw new Error('Error generando reporte');

      const data = await response.json();
      // Debug logging removed for production
      setReportData(data.data);
      showToast.success('Reporte generado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Error generando el reporte');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    // Debug logging removed for production
    
    if (!reportData || !reportData.movimientos) {
      showToast.error('Genere un reporte primero');
      return;
    }
    
    try {
      // Preparar datos para exportación
      const exportData: ExportData = {
        movements: reportData.movimientos.map((movement: any) => ({
          id: movement.id,
          fecha: movement.fecha,
          accion: movement.accion,
          equipo: movement.equipo?.modelo || 'N/A',
          serial: movement.equipo?.serial || 'N/A',
          asignadoA: movement.destino?.empleado || movement.destino?.departamento || 'N/A',
          motivo: movement.motivo || '-',
          gerente: movement.gerente || '-'
        })),
        statistics: {
          totalMovements: reportData.estadisticas?.totalMovimientos || 0,
          assignmentsCount: reportData.estadisticas?.porTipoAccion?.['Asignación'] || 0,
          maintenanceCount: reportData.estadisticas?.porTipoAccion?.['Mantenimiento'] || 0,
          returnCount: reportData.estadisticas?.porTipoAccion?.['Devolución'] || 0,
          safeguardCount: reportData.estadisticas?.porTipoAccion?.['Resguardo'] || 0,
          byCompany: Object.entries(reportData.estadisticas?.porEmpresa || {}).map(([empresa, count]) => ({ empresa, count })),
          byDepartment: [],
          byEmployee: []
        },
        filters: {
          startDate,
          endDate,
          actionType: actionType !== 'all' ? actionType : undefined,
          itemType: itemType !== 'all' ? itemType : undefined,
          empresa: selectedEmpresa?.label,
          departamento: selectedDepartamento?.label,
          empleado: selectedEmpleado?.label
        }
      };
      
      if (format === 'pdf') {
        await exportToPDF(exportData);
        showToast.success('Reporte PDF generado exitosamente');
      } else {
        exportToExcel(exportData);
        showToast.success('Reporte Excel generado exitosamente');
      }
    } catch (error) {
      console.error('Error al exportar:', error);
      showToast.error('Error al generar el archivo de exportación');
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'Asignación': return 'bg-green-100 text-green-800';
      case 'Mantenimiento': return 'bg-yellow-100 text-yellow-800';
      case 'Resguardo': return 'bg-blue-100 text-blue-800';
      case 'Devolución': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Asignado': return 'bg-green-100 text-green-800';
      case 'Mantenimiento': return 'bg-yellow-100 text-yellow-800';
      case 'Resguardo': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEF6EE] to-[#F0E6D8] text-gray-800">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reportes de Movimientos</h1>
          <p className="text-gray-600">Análisis detallado de asignaciones y cambios de estado de equipos</p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Filtros del Reporte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <Label htmlFor="startDate">Fecha Inicio</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Fecha Fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Tipo de Acción</Label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las acciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las acciones</SelectItem>
                    <SelectItem value="Asignación">Asignación</SelectItem>
                    <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="Resguardo">Resguardo</SelectItem>
                    <SelectItem value="Devolución">Devolución</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de Equipo</Label>
                <Select value={itemType} onValueChange={setItemType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los equipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los equipos</SelectItem>
                    <SelectItem value="Computador">Computadores</SelectItem>
                    <SelectItem value="Dispositivo">Dispositivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label>Empresa</Label>
                <DynamicReactSelect
                  value={selectedEmpresa}
                  onChange={setSelectedEmpresa}
                  options={empresas}
                  styles={reactSelectStyles}
                  placeholder="Todas las empresas"
                  isClearable
                />
              </div>
              <div>
                <Label>Departamento</Label>
                <DynamicReactSelect
                  value={selectedDepartamento}
                  onChange={setSelectedDepartamento}
                  options={departamentos}
                  styles={reactSelectStyles}
                  placeholder="Todos los departamentos"
                  isClearable
                />
              </div>
              <div>
                <Label>Empleado</Label>
                <DynamicReactSelect
                  value={selectedEmpleado}
                  onChange={setSelectedEmpleado}
                  options={empleados}
                  styles={reactSelectStyles}
                  placeholder="Todos los empleados"
                  isClearable
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={generateReport} disabled={loading}>
                {loading ? 'Generando...' : 'Generar Reporte'}
              </Button>
              {reportData && (
                <>
                  <Button variant="outline" onClick={() => exportReport('pdf')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                  <Button variant="outline" onClick={() => exportReport('excel')}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Excel
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        {reportData && (
          <Tabs defaultValue="movements" className="space-y-6">
            <TabsList>
              <TabsTrigger value="movements">Movimientos</TabsTrigger>
              <TabsTrigger value="stats">Estadísticas</TabsTrigger>
            </TabsList>

            <TabsContent value="movements">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Lista de Movimientos</span>
                    <Badge variant="outline">
                      {reportData.movimientos.length} movimientos
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Acción</TableHead>
                          <TableHead>Equipo</TableHead>
                          <TableHead>Destino</TableHead>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Gerente</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.movimientos.map((movement) => (
                          <TableRow key={movement.id}>
                            <TableCell className="font-mono text-sm">
                              {formatDate(movement.fecha)}
                            </TableCell>
                            <TableCell>
                              <Badge className={getActionBadgeColor(movement.accion)}>
                                {movement.accion}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{movement.equipo.serial}</div>
                                <div className="text-sm text-gray-500">{movement.equipo.modelo}</div>
                                <Badge className={getStatusBadgeColor(movement.equipo.estado)}>
                                  {movement.equipo.estado}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                {movement.destino.empleado && (
                                  <div className="font-medium">{movement.destino.empleado}</div>
                                )}
                                {movement.destino.departamento && (
                                  <div className="text-sm text-gray-500">{movement.destino.departamento}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{movement.empresaActual.nombre}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm max-w-xs truncate">
                                {movement.motivo || '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{movement.gerente || '-'}</div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Estadísticas generales */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Movimientos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.estadisticas.totalMovimientos}</div>
                    <p className="text-xs text-gray-500">
                      En {reportData.rangoFechas.dias} días
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Por Tipo de Acción</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(reportData.estadisticas.porTipoAccion).map(([accion, count]) => (
                        <div key={accion} className="flex justify-between">
                          <span className="text-sm">{accion}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Por Tipo de Equipo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(reportData.estadisticas.porTipoEquipo).map(([tipo, count]) => (
                        <div key={tipo} className="flex justify-between">
                          <span className="text-sm">{tipo}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Por Empresa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {Object.entries(reportData.estadisticas.porEmpresa).map(([empresa, count]) => (
                        <div key={empresa} className="flex justify-between">
                          <span className="text-sm truncate">{empresa}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
