"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import dynamicImport from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Download, FileText, BarChart3, TrendingUp, Users, Building, Cpu, Monitor, Filter, Search, Eye, EyeOff, ChevronDown, ChevronUp, HardDrive } from 'lucide-react';
import { showToast } from 'nextjs-toast-notify';
import { reactSelectStyles } from '@/utils/reactSelectStyles';
import { formatDate } from '@/utils/formatDate';
import { exportToPDF, exportToExcel, exportToDOCX, ExportData } from '@/utils/exportUtils';
import { ESTADOS_EQUIPO } from '@/lib/estados-equipo';
import { LoadingSpinner } from '@/utils/loading';

// Componentes dinámicos para evitar problemas de hidratación
const DynamicReactSelect = dynamicImport(() => import('react-select'), {
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
  totalMovimientos?: number;
  totalAsignaciones?: number;
  totalActivos?: number;
  totalModificaciones?: number;
  totalEdiciones?: number;
  porTipoAccion?: Record<string, number>;
  porTipoEquipo?: Record<string, number>;
  porEmpresa?: Record<string, number>;
  porDepartamento?: Record<string, number>;
  porEstado?: Record<string, number>;
  porCategoria?: Record<string, number>;
  porCampo?: Record<string, number>;
  porImpacto?: Record<string, number>;
  asignados?: number;
  noAsignados?: number;
  edicionesAltoImpacto?: number;
  edicionesMedioImpacto?: number;
  edicionesBajoImpacto?: number;
  requiereAuditoria?: number;
  [key: string]: any; // Para permitir propiedades dinámicas
}

interface DateRange {
  inicio: string;
  fin: string;
  dias: number;
}

interface ReportData {
  movimientos?: Movement[];
  asignaciones?: any[];
  activos?: any[];
  modificaciones?: any[];
  ediciones?: any[];
  estructura?: any[];
  empleados?: any[];
  equipos?: any[];
  ubicaciones?: any[];
  estadisticas?: Stats;
  rangoFechas?: DateRange;
  filtros?: any;
  reportType?: string;
  reportTitle?: string;
}

export default function ReportesPage() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(true);
  
  // Filtros
  const [reportType, setReportType] = useState('empleados-actuales');
  const [subReportType, setSubReportType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionType, setActionType] = useState('all');
  const [itemType, setItemType] = useState('all');
  const [estadoEquipo, setEstadoEquipo] = useState('all');
  const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null);
  const [selectedDepartamento, setSelectedDepartamento] = useState<any>(null);
  const [selectedEmpleado, setSelectedEmpleado] = useState<any>(null);

  // Datos para filtros
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);

  // Configuración de tipos de reportes
  const reportTypes = [
    {
      value: 'empleados-actuales',
      label: '1. Datos Actuales de Empleados',
      description: 'Información completa de empleados activos con equipos asignados',
      endpoint: '/api/reports/empleados-actuales',
      requiresDates: false,
      hasSubTypes: false
    },
    {
      value: 'asignaciones-modificaciones',
      label: '2. Asignaciones & Modificaciones',
      description: 'Reporte unificado de asignaciones y modificaciones de equipos',
      endpoint: '/api/reports/asignaciones-modificaciones',
      requiresDates: true,
      hasSubTypes: true,
      subTypes: [
        {
          value: 'asignaciones',
          label: 'Ver Asignaciones',
          description: 'Historial de asignaciones de equipos a empleados'
        },
        {
          value: 'modificaciones',
          label: 'Ver Modificaciones',
          description: 'Historial de modificaciones técnicas y administrativas'
        }
      ]
    },
    {
      value: 'equipos-por-estado',
      label: '3. Estado Equipos por Estado',
      description: 'Equipos agrupados por estado operacional con detalles de asignación',
      endpoint: '/api/reports/equipos-por-estado',
      requiresDates: false,
      hasSubTypes: false
    },
    {
      value: 'ubicaciones-inventario',
      label: '4. Equipos por Ubicación',
      description: 'Inventario detallado por ubicación física',
      endpoint: '/api/reports/ubicaciones-inventario',
      requiresDates: false,
      hasSubTypes: false
    },
    {
      value: 'catalogo-actual',
      label: '5. Estado Actual del Catálogo',
      description: 'Catálogo completo de todos los activos con estado actual',
      endpoint: '/api/reports/catalogo-actual',
      requiresDates: false,
      hasSubTypes: false
    },
    
  ];

  // Establecer fechas por defecto (últimos 30 días)
  useEffect(() => {
    // Usar fechas que incluyan los datos existentes (2025)
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-12-31');
    
    // Formatear fechas en formato YYYY-MM-DD
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setStartDate(formatDate(startDate));
    setEndDate(formatDate(endDate));
  }, []);

  // Generar reporte automáticamente cuando se establezcan las fechas
  useEffect(() => {
    if (startDate && endDate) {
      generateReport();
    }
  }, [startDate, endDate]);

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
    // Obtener configuración del tipo de reporte seleccionado
    const selectedReportType = reportTypes.find(rt => rt.value === reportType);
    if (!selectedReportType) {
      showToast.error('Tipo de reporte no válido');
      return;
    }

    // Validar fechas solo si el reporte las requiere
    if (selectedReportType.requiresDates && (!startDate || !endDate)) {
      showToast.error('Seleccione las fechas de inicio y fin');
      return;
    }

    // Validar sub-tipo si el reporte lo requiere
    if (selectedReportType.hasSubTypes && !subReportType) {
      showToast.error('Seleccione un sub-tipo de reporte');
      return;
    }

    setLoading(true);
    try {
      // Construir parámetros según el tipo de reporte
      const params = new URLSearchParams();
      
      // Parámetros comunes
      if (selectedReportType.requiresDates) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }
      
      // Parámetros específicos por tipo de reporte
      switch (reportType) {
        case 'empleados-actuales':
          if (selectedEmpresa?.value) params.append('empresaId', selectedEmpresa.value);
          if (selectedDepartamento?.value) params.append('departamentoId', selectedDepartamento.value);
          if (selectedEmpleado?.value) params.append('cargoId', selectedEmpleado.value);
          break;
          
        case 'asignaciones-modificaciones':
          // Agregar el sub-tipo como parámetro type
          if (subReportType) params.append('type', subReportType);
          if (selectedEmpresa?.value) params.append('empresaId', selectedEmpresa.value);
          if (selectedDepartamento?.value) params.append('departamentoId', selectedDepartamento.value);
          if (selectedEmpleado?.value) params.append('empleadoId', selectedEmpleado.value);
          break;
          
        case 'equipos-por-estado':
          if (estadoEquipo && estadoEquipo !== 'all') params.append('estadoEquipo', estadoEquipo);
          if (itemType && itemType !== 'all') params.append('tipoEquipo', itemType);
          if (selectedEmpresa?.value) params.append('empresaId', selectedEmpresa.value);
          if (selectedDepartamento?.value) params.append('departamentoId', selectedDepartamento.value);
          break;
          
        case 'ubicaciones-inventario':
          if (selectedEmpresa?.value) params.append('ubicacionId', selectedEmpresa.value);
          if (estadoEquipo && estadoEquipo !== 'all') params.append('estadoEquipo', estadoEquipo);
          break;
          
        case 'catalogo-actual':
          if (estadoEquipo && estadoEquipo !== 'all') params.append('estadoEquipo', estadoEquipo);
          if (itemType && itemType !== 'all') params.append('tipoEquipo', itemType);
          if (selectedEmpresa?.value) params.append('empresaId', selectedEmpresa.value);
          if (selectedDepartamento?.value) params.append('departamentoId', selectedDepartamento.value);
          if (selectedEmpleado?.value) params.append('ubicacionId', selectedEmpleado.value);
          break;
          
        
      }

      console.log(`🔍 Generando reporte: ${reportType} con endpoint: ${selectedReportType.endpoint}`);
      console.log('📋 Parámetros:', Object.fromEntries(params.entries()));

      const response = await fetch(`${selectedReportType.endpoint}?${params}`);
      if (!response.ok) throw new Error('Error generando reporte');

      const data = await response.json();
      console.log('Datos del reporte recibidos:', data);
      
      // Adaptar los datos según el tipo de reporte
      const adaptedData = {
        ...data.data,
        reportType: reportType,
        reportTitle: selectedReportType.label
      };
      
      setReportData(adaptedData);
      showToast.success('Reporte generado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Error generando el reporte');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel' | 'docx') => {
    if (!reportData) {
      showToast.error('Genere un reporte primero');
      return;
    }
    
    try {
      const selectedReportType = reportTypes.find(rt => rt.value === reportType);
      if (!selectedReportType) {
        showToast.error('Tipo de reporte no válido');
        return;
      }

      // Preparar datos para exportación según el tipo de reporte
      let exportData: any;

      if (reportType === 'movimientos-historial') {
        // Formato legacy para compatibilidad
        exportData = {
          movements: reportData.movimientos?.map((movement: any) => ({
            id: movement.id,
            fecha: movement.fecha,
            accion: movement.accion,
            equipo: movement.equipo?.modelo || 'N/A',
            serial: movement.equipo?.serial || 'N/A',
            asignadoA: movement.destino?.empleado || movement.destino?.departamento || 'N/A',
            motivo: movement.motivo || '-',
            gerente: movement.gerente || '-'
          })) || [],
          // statistics removed per request: only table will be exported
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
      } else {
        // Formato nuevo para otros tipos de reportes
        const columns = getColumnsForReportType(reportType);
        const data = getPDFDataForReportType(reportType); // Usar datos procesados para PDF
        
        exportData = {
          reportType: reportType,
          title: selectedReportType.label,
          data: data,
          columns: columns,
          // statistics removed per request: only table will be exported
          filters: {
            startDate,
            endDate,
            reportType: reportType,
            ...getFiltersForReportType(reportType)
          }
        };
      }
      
      if (format === 'pdf') {
        await exportToPDF(exportData);
        showToast.success('Reporte PDF generado exitosamente');
      } else if (format === 'excel') {
        exportToExcel(exportData);
        showToast.success('Reporte Excel generado exitosamente');
      } else {
        await exportToDOCX(exportData);
        showToast.success('Reporte Word generado exitosamente');
      }
    } catch (error) {
      console.error('Error al exportar:', error);
      showToast.error('Error al generar el archivo de exportación');
    }
  };

  // Función para procesar datos específicamente para PDF (sin JSX)
  const getPDFDataForReportType = (type: string) => {
    if (!reportData) return [];
    
    switch (type) {
      case 'empleados-actuales':
        return (reportData.empleados || []).map((empleado: any) => ({
          nombreCompleto: empleado.nombreCompleto || 'N/A',
          cedula: empleado.cedula || 'N/A',
          empresa: empleado.organizacion?.empresa || 'Sin empresa',
          departamento: empleado.organizacion?.departamento || 'Sin departamento',
          cargo: empleado.organizacion?.cargo || 'Sin cargo',
          totalEquipos: empleado.equipos?.totalAsignados || 0,
          computadores: empleado.equipos?.computadores || 0,
          dispositivos: empleado.equipos?.dispositivos || 0,
          estado: empleado.estado || 'N/A',
          fechaIngreso: empleado.fechaIngreso ? formatDate(empleado.fechaIngreso) : 'N/A'
        }));
        
      case 'asignaciones-modificaciones':
        if (subReportType === 'asignaciones') {
          return (reportData.asignaciones || []).map((asignacion: any) => ({
            fecha: asignacion.fecha ? formatDate(asignacion.fecha) : 'N/A',
            accion: asignacion.accion || 'N/A',
            tipoEquipo: asignacion.tipoEquipo || 'N/A',
            serial: asignacion.equipo?.serial || 'N/A',
            modelo: asignacion.equipo?.modelo || 'N/A',
            empleado: asignacion.empleado?.nombre || 'Sin asignar',
            departamento: asignacion.empleado?.departamento || 'Sin departamento',
            empresa: asignacion.empleado?.empresa || 'Sin empresa',
            ubicacion: asignacion.ubicacion?.nombre || 'Sin ubicación',
            motivo: asignacion.motivo || 'Sin motivo'
          }));
        } else {
          return (reportData.modificaciones || []).map((modificacion: any) => ({
            fecha: modificacion.fecha ? formatDate(modificacion.fecha) : 'N/A',
            accion: modificacion.accion || 'N/A',
            campo: modificacion.campo || 'N/A',
            categoriaModificacion: modificacion.categoriaModificacion || 'N/A',
            serial: modificacion.equipo?.serial || 'N/A',
            modelo: modificacion.equipo?.modelo || 'N/A',
            empleado: modificacion.empleadoAsignado?.nombre || 'Sin asignar',
            descripcion: modificacion.descripcion || 'Sin descripción'
          }));
        }
        
      case 'equipos-por-estado':
        return (reportData.equipos || []).map((equipo: any) => ({
          tipo: equipo.tipo || 'N/A',
          serial: equipo.serial || 'N/A',
          codigoImgc: equipo.codigoImgc || 'N/A',
          modelo: equipo.modelo || 'N/A',
          estado: equipo.estado || 'N/A',
          empleado: equipo.asignacion?.empleado || 'Sin asignar',
          departamento: equipo.asignacion?.departamento || 'Sin departamento',
          empresa: equipo.asignacion?.empresa || 'Sin empresa',
          ubicacion: equipo.asignacion?.ubicacion || equipo.ubicacionActual || equipo.ubicacion?.nombre || 'Sin ubicación'
        }));
        
      case 'ubicaciones-inventario':
        return (reportData.ubicaciones || []).map((ubicacion: any) => ({
          nombre: ubicacion.nombre || 'N/A',
          direccion: ubicacion.direccion || 'N/A',
          piso: ubicacion.piso || '-',
          sala: ubicacion.sala || '-',
          totalEquipos: ubicacion.estadisticas?.totalEquipos || 0,
          computadores: ubicacion.estadisticas?.computadores || 0,
          dispositivos: ubicacion.estadisticas?.dispositivos || 0,
          empleadosUnicos: ubicacion.estadisticas?.empleadosUnicos || 0
        }));
        
      case 'catalogo-actual':
        return (reportData.activos || []).map((activo: any) => ({
          tipo: activo.tipo || 'N/A',
          serial: activo.serial || 'N/A',
          codigoImgc: activo.codigoImgc || 'N/A',
          marca: activo.marca || 'N/A',
          modelo: activo.modelo || 'N/A',
          tipoEquipo: activo.tipoEquipo || 'N/A',
          estado: activo.estado || 'N/A',
          asignado: activo.asignacion?.asignado ? 'Sí' : 'No',
          empleado: activo.asignacion?.empleado || 'Sin asignar',
          empresa: activo.asignacion?.empresa || 'Sin empresa'
        }));
        
      
        
      default:
        return [];
    }
  };

  // Función para obtener columnas según el tipo de reporte
  const getColumnsForReportType = (type: string) => {
    switch (type) {
      case 'empleados-actuales':
        return [
          { key: 'nombreCompleto', title: 'Empleado', width: 20, align: 'left' as const },
          { key: 'cedula', title: 'Cédula', width: 12, align: 'center' as const },
          { key: 'empresa', title: 'Empresa', width: 15, align: 'left' as const },
          { key: 'departamento', title: 'Departamento', width: 18, align: 'left' as const },
          { key: 'cargo', title: 'Cargo', width: 15, align: 'left' as const },
          { key: 'totalEquipos', title: 'Equipos', width: 8, align: 'center' as const },
          { key: 'computadores', title: 'Computadores', width: 10, align: 'center' as const },
          { key: 'dispositivos', title: 'Dispositivos', width: 10, align: 'center' as const },
          { key: 'estado', title: 'Estado', width: 10, align: 'center' as const },
          { key: 'fechaIngreso', title: 'Fecha Ingreso', width: 12, align: 'center' as const }
        ];
        
      case 'asignaciones-modificaciones':
        if (subReportType === 'asignaciones') {
          return [
            { key: 'fecha', title: 'Fecha', width: 12, align: 'center' as const },
            { key: 'accion', title: 'Acción', width: 12, align: 'center' as const },
            { key: 'tipoEquipo', title: 'Tipo', width: 10, align: 'center' as const },
            { key: 'serial', title: 'Serial', width: 12, align: 'center' as const },
            { key: 'modelo', title: 'Modelo', width: 20, align: 'left' as const },
            { key: 'empleado', title: 'Empleado', width: 16, align: 'left' as const },
            { key: 'departamento', title: 'Departamento', width: 14, align: 'left' as const },
            { key: 'empresa', title: 'Empresa', width: 12, align: 'left' as const },
            { key: 'ubicacion', title: 'Ubicación', width: 12, align: 'left' as const },
            { key: 'motivo', title: 'Motivo', width: 20, align: 'left' as const }
          ];
        } else {
          return [
            { key: 'fecha', title: 'Fecha', width: 12, align: 'center' as const },
            { key: 'accion', title: 'Acción', width: 12, align: 'center' as const },
            { key: 'campo', title: 'Campo', width: 12, align: 'center' as const },
            { key: 'categoriaModificacion', title: 'Categoría', width: 12, align: 'center' as const },
            { key: 'serial', title: 'Serial', width: 12, align: 'center' as const },
            { key: 'modelo', title: 'Modelo', width: 20, align: 'left' as const },
            { key: 'empleadoAsignado', title: 'Empleado', width: 16, align: 'left' as const },
            { key: 'descripcion', title: 'Descripción', width: 25, align: 'left' as const }
          ];
        }
        
      case 'equipos-por-estado':
        return [
          { key: 'tipo', title: 'Tipo', width: 12, align: 'center' as const },
          { key: 'serial', title: 'Serial', width: 15, align: 'center' as const },
          { key: 'codigoImgc', title: 'Código IMGC', width: 15, align: 'center' as const },
          { key: 'modelo', title: 'Modelo', width: 25, align: 'left' as const },
          { key: 'estado', title: 'Estado', width: 12, align: 'center' as const },
          { key: 'empleado', title: 'Empleado', width: 20, align: 'left' as const },
          { key: 'departamento', title: 'Departamento', width: 18, align: 'left' as const },
          { key: 'empresa', title: 'Empresa', width: 15, align: 'left' as const },
          { key: 'ubicacion', title: 'Ubicación', width: 18, align: 'left' as const }
        ];
        
      case 'ubicaciones-inventario':
        // Use flattened keys that match getPDFDataForReportType output
        return [
          { key: 'nombre', title: 'Ubicación', width: 20, align: 'left' as const },
          { key: 'direccion', title: 'Dirección', width: 25, align: 'left' as const },
          { key: 'piso', title: 'Piso', width: 8, align: 'center' as const },
          { key: 'sala', title: 'Sala', width: 10, align: 'center' as const },
          { key: 'totalEquipos', title: 'Total Equipos', width: 12, align: 'center' as const },
          { key: 'computadores', title: 'Computadores', width: 12, align: 'center' as const },
          { key: 'dispositivos', title: 'Dispositivos', width: 12, align: 'center' as const },
          { key: 'empleadosUnicos', title: 'Empleados', width: 10, align: 'center' as const }
        ];
        
      case 'catalogo-actual':
        // Mostrar únicamente los campos del dossier / sección "Catálogo"
        return [
          { key: 'marca', title: 'Marca', width: 18, align: 'left' as const },
          { key: 'modelo', title: 'Modelo', width: 22, align: 'left' as const },
          { key: 'tipoEquipo', title: 'Tipo Equipo', width: 14, align: 'left' as const },
          { key: 'estado', title: 'Estado', width: 10, align: 'center' as const },
          { key: 'codigoImgc', title: 'Código IMGC', width: 12, align: 'center' as const },
          { key: 'serial', title: 'Serial', width: 14, align: 'center' as const }
        ];
        
      
        
      default:
        return [];
    }
  };

  // Función para obtener datos según el tipo de reporte
  const getDataForReportType = (type: string) => {
    if (!reportData) return [];
    
    switch (type) {
      case 'empleados-actuales':
        return reportData.empleados || [];
      case 'asignaciones-modificaciones':
        if (subReportType === 'asignaciones') {
          return reportData.asignaciones || [];
        } else {
          return reportData.modificaciones || [];
        }
      case 'equipos-por-estado':
        return reportData.equipos || [];
      case 'ubicaciones-inventario':
        return reportData.ubicaciones || [];
      case 'catalogo-actual':
        return reportData.activos || [];
      
      default:
        return [];
    }
  };

  // Función para obtener filtros según el tipo de reporte
  const getFiltersForReportType = (type: string) => {
    const filters: any = {};
    
    switch (type) {
      case 'asignaciones-activas':
        if (selectedEmpresa?.label) filters.empresa = selectedEmpresa.label;
        if (selectedDepartamento?.label) filters.departamento = selectedDepartamento.label;
        if (selectedEmpleado?.label) filters.empleado = selectedEmpleado.label;
        if (estadoEquipo !== 'all') filters.estado = estadoEquipo;
        break;
        
      case 'activos-por-estado':
        if (estadoEquipo !== 'all') filters.estado = estadoEquipo;
        if (itemType !== 'all') filters.tipoEquipo = itemType;
        if (selectedEmpresa?.label) filters.empresa = selectedEmpresa.label;
        if (selectedDepartamento?.label) filters.departamento = selectedDepartamento.label;
        break;
        
      case 'modificaciones-hardware':
        if (actionType !== 'all') filters.tipoModificacion = actionType;
        break;
        
      case 'ediciones-metadatos':
        if (actionType !== 'all') filters.tipoEdicion = actionType;
        if (itemType !== 'all') filters.tipoEquipo = itemType;
        break;
    }
    
    return filters;
  };

  // Función para obtener el conteo de datos
  const getDataCount = () => {
    if (!reportData) return 0;
    
    switch (reportType) {
      case 'empleados-actuales':
        return reportData.empleados?.length || 0;
      case 'asignaciones-modificaciones':
        if (subReportType === 'asignaciones') {
          return reportData.asignaciones?.length || 0;
        } else {
          return reportData.modificaciones?.length || 0;
        }
      case 'equipos-por-estado':
        return reportData.equipos?.length || 0;
      case 'ubicaciones-inventario':
        return reportData.ubicaciones?.length || 0;
      case 'catalogo-actual':
        return reportData.activos?.length || 0;
      
      default:
        return 0;
    }
  };

  // Función para obtener los encabezados de la tabla
  const getTableHeaders = () => {
    switch (reportType) {
      case 'empleados-actuales':
        return ['Empleado', 'Cédula', 'Empresa', 'Departamento', 'Cargo', 'Equipos', 'Computadores', 'Dispositivos', 'Estado', 'Fecha Ingreso'];
      case 'asignaciones-modificaciones':
        if (subReportType === 'asignaciones') {
          return ['Fecha', 'Acción', 'Tipo', 'Serial', 'Modelo', 'Empleado', 'Departamento', 'Empresa', 'Ubicación', 'Motivo'];
        } else {
          return ['Fecha', 'Acción', 'Campo', 'Categoría', 'Serial', 'Modelo', 'Empleado', 'Descripción'];
        }
      case 'equipos-por-estado':
        // Mostrar el estado actual de los equipos. Se pueden filtrar por estado desde los controles.
        return ['Tipo', 'Serial', 'Código IMGC', 'Modelo', 'Estado', 'Empleado', 'Departamento', 'Empresa', 'Ubicación'];
      case 'ubicaciones-inventario':
        return ['Ubicación', 'Dirección', 'Piso', 'Sala', 'Total Equipos', 'Computadores', 'Dispositivos', 'Empleados'];
      case 'catalogo-actual':
        // Sólo mostrar los campos que pertenecen al catálogo/dossier
        return ['Marca', 'Modelo', 'Tipo Equipo', 'Estado', 'Código IMGC', 'Serial'];
      
      default:
        return [];
    }
  };

  // Función para obtener las filas de la tabla
  const getTableRows = () => {
    if (!reportData) return [];
    
    switch (reportType) {
      case 'empleados-actuales':
        return (reportData.empleados || []).map((empleado: any) => [
          { content: empleado.nombreCompleto, className: 'font-medium' },
          { content: empleado.cedula, className: 'font-mono text-sm' },
          { content: empleado.organizacion.empresa, className: '' },
          { content: empleado.organizacion.departamento, className: 'text-sm text-gray-500' },
          { content: empleado.organizacion.cargo, className: 'text-sm text-gray-500' },
          { content: <Badge variant="outline">{empleado.equipos.totalAsignados}</Badge>, className: 'text-center' },
          { content: <Badge className="bg-blue-100 text-blue-800">{empleado.equipos.computadores}</Badge>, className: 'text-center' },
          { content: <Badge className="bg-green-100 text-green-800">{empleado.equipos.dispositivos}</Badge>, className: 'text-center' },
          { content: <Badge className={empleado.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{empleado.estado}</Badge>, className: 'text-center' },
          { content: formatDate(empleado.fechaIngreso), className: 'font-mono text-sm' }
        ]);
        
      case 'asignaciones-modificaciones':
        if (subReportType === 'asignaciones') {
          return (reportData.asignaciones || []).map((asignacion: any) => [
            { content: formatDate(asignacion.fecha), className: 'font-mono text-sm' },
            { content: <Badge className={getActionBadgeColor(asignacion.accion)}>{asignacion.accion}</Badge>, className: '' },
            { content: <Badge className={getStatusBadgeColor(asignacion.tipoEquipo)}>{asignacion.tipoEquipo}</Badge>, className: '' },
            { content: asignacion.equipo.serial, className: 'font-medium' },
            { content: asignacion.equipo.modelo, className: '' },
            { content: asignacion.empleado.nombre, className: 'font-medium' },
            { content: asignacion.empleado.departamento, className: 'text-sm text-gray-500' },
            { content: asignacion.empleado.empresa, className: 'text-sm text-gray-500' },
            { content: asignacion.ubicacion.nombre, className: 'text-sm' },
            { content: <div className="text-sm max-w-xs truncate">{asignacion.motivo}</div>, className: '' }
          ]);
        } else {
          return (reportData.modificaciones || []).map((modificacion: any) => [
            { content: formatDate(modificacion.fecha), className: 'font-mono text-sm' },
            { content: <Badge className={getActionBadgeColor(modificacion.accion)}>{modificacion.accion}</Badge>, className: '' },
            { content: modificacion.campo, className: 'font-medium' },
            { content: <Badge className={getActionBadgeColor(modificacion.categoriaModificacion)}>{modificacion.categoriaModificacion}</Badge>, className: '' },
            { content: modificacion.equipo.serial, className: 'font-medium' },
            { content: modificacion.equipo.modelo, className: '' },
            { content: modificacion.empleadoAsignado?.nombre || 'Sin asignar', className: modificacion.empleadoAsignado ? 'font-medium' : 'text-gray-500' },
            { content: <div className="text-sm max-w-xs truncate">{modificacion.descripcion}</div>, className: '' }
          ]);
        }
        
      case 'movimientos-historial':
        return (reportData.movimientos || []).map((movement: any) => [
          { content: formatDate(movement.fecha), className: 'font-mono text-sm' },
          { content: <Badge className={getActionBadgeColor(movement.accion)}>{movement.accion}</Badge>, className: '' },
          { content: (
              <div>
                <div className="font-medium">{movement.equipo.serial}</div>
                <div className="text-sm text-gray-500">{movement.equipo.modelo}</div>
                <Badge className={getStatusBadgeColor(movement.equipo.estado)}>{movement.equipo.estado}</Badge>
              </div>
            ), className: '' },
          { content: (
              <div>
                {movement.destino.empleado && <div className="font-medium">{movement.destino.empleado}</div>}
                {movement.destino.departamento && <div className="text-sm text-gray-500">{movement.destino.departamento}</div>}
              </div>
            ), className: '' },
          { content: <div className="text-sm">{movement.empresaActual.nombre}</div>, className: '' },
          { content: <div className="text-sm max-w-xs truncate">{movement.motivo || '-'}</div>, className: '' },
          { content: <div className="text-sm">{movement.gerente || '-'}</div>, className: '' }
        ]);
        
      case 'asignaciones-activas':
        return (reportData.asignaciones || []).map((asignacion: any) => [
          { content: formatDate(asignacion.fechaAsignacion), className: 'font-mono text-sm' },
          { content: <Badge className={getStatusBadgeColor(asignacion.tipoEquipo)}>{asignacion.tipoEquipo}</Badge>, className: '' },
          { content: asignacion.equipo.serial, className: 'font-medium' },
          { content: asignacion.equipo.modelo, className: '' },
          { content: <Badge className={getStatusBadgeColor(asignacion.equipo.estado)}>{asignacion.equipo.estado}</Badge>, className: '' },
          { content: asignacion.empleado.nombre, className: 'font-medium' },
          { content: asignacion.empleado.departamento, className: 'text-sm text-gray-500' },
          { content: asignacion.empleado.empresa, className: 'text-sm text-gray-500' },
          { content: asignacion.ubicacion.nombre, className: 'text-sm' },
          { content: <div className="text-sm max-w-xs truncate">{asignacion.motivo}</div>, className: '' }
        ]);
        
      case 'equipos-por-estado':
        return (reportData.equipos || []).map((equipo: any) => [
          { content: <Badge className={getStatusBadgeColor(equipo.tipo)}>{equipo.tipo}</Badge>, className: '' },
          { content: equipo.serial, className: 'font-medium' },
          { content: equipo.codigoImgc, className: 'font-mono text-sm' },
          { content: equipo.modelo, className: '' },
          { content: <Badge className={getStatusBadgeColor(equipo.estado)}>{equipo.estado}</Badge>, className: '' },
          { content: equipo.asignacion?.empleado || 'Sin asignar', className: equipo.asignacion ? 'font-medium' : 'text-gray-500' },
          { content: equipo.asignacion?.departamento || 'Sin departamento', className: 'text-sm text-gray-500' },
          { content: equipo.asignacion?.empresa || 'Sin empresa', className: 'text-sm text-gray-500' },
          { content: equipo.asignacion?.ubicacion || equipo.ubicacionActual || equipo.ubicacion?.nombre || 'Sin ubicación', className: 'text-sm text-gray-500' }
        ]);
        
      case 'ubicaciones-inventario':
        return (reportData.ubicaciones || []).map((ubicacion: any) => [
          { content: ubicacion.nombre, className: 'font-medium' },
          { content: ubicacion.direccion, className: 'text-sm' },
          { content: ubicacion.piso || '-', className: 'text-center' },
          { content: ubicacion.sala || '-', className: 'text-center' },
          { content: <Badge variant="outline">{ubicacion.estadisticas.totalEquipos}</Badge>, className: 'text-center' },
          { content: <Badge className="bg-blue-100 text-blue-800">{ubicacion.estadisticas.computadores}</Badge>, className: 'text-center' },
          { content: <Badge className="bg-green-100 text-green-800">{ubicacion.estadisticas.dispositivos}</Badge>, className: 'text-center' },
          { content: <Badge variant="outline">{ubicacion.estadisticas.empleadosUnicos}</Badge>, className: 'text-center' }
        ]);
        
      case 'catalogo-actual':
        // Mostrar sólo los campos del catálogo/dossier (sin información de asignación)
        return (reportData.activos || []).map((activo: any) => [
          { content: activo.marca || 'N/A', className: 'font-medium' },
          { content: activo.modelo || 'N/A', className: '' },
          { content: activo.tipoEquipo || 'N/A', className: 'text-sm text-gray-500' },
          { content: <Badge className={getStatusBadgeColor(activo.estado)}>{activo.estado || 'N/A'}</Badge>, className: 'text-center' },
          { content: activo.codigoImgc || 'N/A', className: 'font-mono text-sm' },
          { content: activo.serial || 'N/A', className: 'font-mono text-sm' }
        ]);
        
      
        
      case 'modificaciones-hardware':
        return (reportData.modificaciones || []).map((modificacion: any) => [
          { content: formatDate(modificacion.fecha), className: 'font-mono text-sm' },
          { content: modificacion.campo, className: 'font-medium' },
          { content: <Badge className={getActionBadgeColor(modificacion.categoriaModificacion)}>{modificacion.categoriaModificacion}</Badge>, className: '' },
          { content: modificacion.computador.serial, className: 'font-medium' },
          { content: modificacion.computador.modelo, className: '' },
          { content: modificacion.empleadoAsignado?.nombre || 'Sin asignar', className: modificacion.empleadoAsignado ? 'font-medium' : 'text-gray-500' },
          { content: <div className="text-sm max-w-xs truncate">{modificacion.cambio.descripcion}</div>, className: '' }
        ]);
        
      case 'ediciones-metadatos':
        return (reportData.ediciones || []).map((edicion: any) => [
          { content: formatDate(edicion.fecha), className: 'font-mono text-sm' },
          { content: edicion.campo, className: 'font-medium' },
          { content: <Badge className={getActionBadgeColor(edicion.categoriaEdicion)}>{edicion.categoriaEdicion}</Badge>, className: '' },
          { content: <Badge className={getImpactBadgeColor(edicion.impactoEdicion)}>{edicion.impactoEdicion}</Badge>, className: '' },
          { content: edicion.equipo.serial, className: 'font-medium' },
          { content: edicion.equipo.modelo, className: '' },
          { content: edicion.empleadoAsignado?.nombre || 'Sin asignar', className: edicion.empleadoAsignado ? 'font-medium' : 'text-gray-500' },
          { content: <div className="text-sm max-w-xs truncate">{edicion.cambio.descripcion}</div>, className: '' }
        ]);
        
      default:
        return [];
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'Asignación': return 'bg-green-100 text-green-800';
      case 'Devolución': return 'bg-red-100 text-red-800';
      case 'Cambio de Estado': return 'bg-blue-100 text-blue-800';
      case 'Mantenimiento': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ASIGNADO': return 'bg-blue-100 text-blue-800';
      case 'OPERATIVO': return 'bg-green-100 text-green-800';
      case 'EN_MANTENIMIENTO': return 'bg-orange-100 text-orange-800';
      case 'EN_RESGUARDO': return 'bg-amber-100 text-amber-800';
      case 'DE_BAJA': return 'bg-red-100 text-red-800';
      // Mantener compatibilidad con estados antiguos
      case 'Asignado': return 'bg-blue-100 text-blue-800';
      case 'Operativo': return 'bg-green-100 text-green-800';
      case 'Mantenimiento': return 'bg-orange-100 text-orange-800';
      case 'Resguardo': return 'bg-amber-100 text-amber-800';
      case 'De Baja': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactBadgeColor = (impact: string) => {
    switch (impact) {
      case 'Alto': return 'bg-red-100 text-red-800';
      case 'Medio': return 'bg-yellow-100 text-yellow-800';
      case 'Bajo': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Statistics UI removed per request — report UI shows only the data table now

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEF6EE] to-[#F0E6D8] text-gray-800">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-[#167DBA] rounded-xl shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-1">Reportes</h1>
              <p className="text-lg text-gray-600">Análisis detallado de asignaciones, movimientos y estado de equipos</p>
            </div>
          </div>

          {/* Quick Stats Overview - REMOVED */}
          {/* {reportData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Registros</p>
                      <p className="text-3xl font-bold">{getDataCount()}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Tipo de Reporte</p>
                      <p className="text-lg font-semibold truncate">{reportData.reportTitle}</p>
                    </div>
                    <FileText className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Filtros Activos</p>
                      <p className="text-3xl font-bold">
                        {[selectedEmpresa, selectedDepartamento, selectedEmpleado, actionType !== 'all' ? actionType : null, itemType !== 'all' ? itemType : null, estadoEquipo !== 'all' ? estadoEquipo : null].filter(Boolean).length}
                      </p>
                    </div>
                    <Filter className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Estado</p>
                      <p className="text-lg font-semibold">Listo</p>
                    </div>
                    <div className="h-8 w-8 bg-orange-400 rounded-full flex items-center justify-center">
                      <div className="h-3 w-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )} */}
        </div>

        {/* Filters Section */}
        <Card className="mb-6 shadow-lg border-gray-200 bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Filter className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Filtros de Búsqueda</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Configura los parámetros para generar tu reporte personalizado</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiltersVisible(!filtersVisible)}
                className="flex items-center gap-2"
              >
                {filtersVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {filtersVisible ? 'Ocultar' : 'Mostrar'} Filtros
                {filtersVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>

          {filtersVisible && (
            <CardContent className="space-y-6">
              {/* Primary Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Tipo de Reporte
                  </Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Seleccione un tipo de reporte" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="py-1">
                            <div className="font-medium text-sm">{type.label}</div>
                            <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sub-type selector for reports that need it */}
                {reportTypes.find(rt => rt.value === reportType)?.hasSubTypes && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Sub-Tipo</Label>
                    <Select value={subReportType} onValueChange={setSubReportType}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Seleccione un sub-tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {reportTypes.find(rt => rt.value === reportType)?.subTypes?.map((subType) => (
                          <SelectItem key={subType.value} value={subType.value}>
                            <div className="py-1">
                              <div className="font-medium text-sm">{subType.label}</div>
                              <div className="text-xs text-gray-500 mt-1">{subType.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha Inicio
                  </Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={!reportTypes.find(rt => rt.value === reportType)?.requiresDates}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha Fin
                  </Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={!reportTypes.find(rt => rt.value === reportType)?.requiresDates}
                    className="h-11"
                  />
                </div>
              </div>

              {/* Secondary Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Tipo de Acción</Label>
                  <Select value={actionType} onValueChange={setActionType}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Todas las acciones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las acciones</SelectItem>
                      <SelectItem value="Asignación">Asignación</SelectItem>
                      <SelectItem value="Devolución">Devolución</SelectItem>
                      <SelectItem value="Cambio de Estado">Cambio de Estado</SelectItem>
                      <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Categoría de Equipo</Label>
                  <Select value={itemType} onValueChange={setItemType}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      <SelectItem value="Computador">Computadores</SelectItem>
                      <SelectItem value="Dispositivo">Dispositivos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Estado del Equipo</Label>
                  <Select value={estadoEquipo} onValueChange={setEstadoEquipo}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value={ESTADOS_EQUIPO.ASIGNADO}>Asignado</SelectItem>
                      <SelectItem value={ESTADOS_EQUIPO.OPERATIVO}>Operativo</SelectItem>
                      <SelectItem value={ESTADOS_EQUIPO.EN_MANTENIMIENTO}>En Mantenimiento</SelectItem>
                      <SelectItem value={ESTADOS_EQUIPO.EN_RESGUARDO}>En Resguardo</SelectItem>
                      <SelectItem value={ESTADOS_EQUIPO.DE_BAJA}>De Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Búsqueda Rápida
                  </Label>
                  <Input
                    placeholder="Buscar por nombre, serial..."
                    className="h-11"
                  />
                </div>
              </div>

              {/* Organization Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Empresa
                  </Label>
                  <DynamicReactSelect
                    value={selectedEmpresa}
                    onChange={setSelectedEmpresa}
                    options={empresas}
                    styles={reactSelectStyles}
                    placeholder="Todas las empresas"
                    isClearable
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Departamento
                  </Label>
                  <DynamicReactSelect
                    value={selectedDepartamento}
                    onChange={setSelectedDepartamento}
                    options={departamentos}
                    styles={reactSelectStyles}
                    placeholder="Todos los departamentos"
                    isClearable
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Empleado
                  </Label>
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

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <Button
                  onClick={generateReport}
                  disabled={loading}
                  size="lg"
                  className="shadow-lg"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Generando Reporte...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Generar Reporte
                    </>
                  )}
                </Button>

                {reportData && (
                  <>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => exportReport('pdf')}
                      className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      Exportar PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => exportReport('excel')}
                      className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Exportar Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => exportReport('docx')}
                      className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      Exportar Word
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Results Section */}
        {reportData && (
          <div className="space-y-6">
            <Tabs defaultValue="data" className="w-full">
              <div className="flex items-center justify-between mb-6">
                <TabsList className="bg-gray-100 p-1">
                  <TabsTrigger
                    value="data"
                    className="data-[state=active]:bg-white data-[state=active]:text-[#167DBA] flex items-center gap-2 px-6 py-3"
                  >
                    <FileText className="h-4 w-4" />
                    Datos del Reporte
                  </TabsTrigger>
                    {/* Estadísticas tab removed - showing only data table */}
                </TabsList>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  Reporte generado exitosamente
                </div>
              </div>

              <TabsContent value="data" className="space-y-6">
                <Card className="shadow-lg border-gray-200 bg-white">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#167DBA] rounded-lg">
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl">{reportData.reportTitle || 'Datos del Reporte'}</CardTitle>
                          <p className="text-gray-600 mt-1">Vista detallada de todos los registros encontrados</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="px-4 py-2 text-lg font-semibold bg-blue-50 text-blue-700 border-blue-200">
                        {getDataCount()} registros
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border bg-white overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                              {getTableHeaders().map((header, index) => (
                                <TableHead key={index} className="font-semibold text-gray-700 py-4 px-6">
                                  {header}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getTableRows().map((row: any, index: number) => (
                              <TableRow
                                key={index}
                                className="hover:bg-gray-50/50 transition-colors border-b border-gray-100"
                              >
                                {row.map((cell: any, cellIndex: number) => (
                                  <TableCell key={cellIndex} className={`py-4 px-6 ${cell.className || ''}`}>
                                    {cell.content}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Statistics content removed - reports only show the data table now */}
            </Tabs>
          </div>
        )}

        {/* Loading State */}
        {loading && !reportData && (
          <Card className="shadow-lg border-gray-200 bg-white">
            <CardContent className="p-12">
              <LoadingSpinner message="Generando reporte..." size="lg" />
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !reportData && (
          <Card className="shadow-lg border-gray-200 bg-white">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-gray-100 rounded-full">
                  <BarChart3 className="h-12 w-12 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay datos para mostrar</h3>
                  <p className="text-gray-600 mb-6">Configura los filtros y genera un reporte para ver los resultados.</p>
                  <Button
                    onClick={generateReport}
                    className="shadow-lg"
                  >
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Generar Reporte
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
