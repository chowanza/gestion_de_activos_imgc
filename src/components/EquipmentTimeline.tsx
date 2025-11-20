'use client';

import { useState } from 'react';
import { 
  History, 
  User, 
  Building, 
  MapPin, 
  Wrench, 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Package,
  ShoppingCart,
  Settings,
  HardDrive,
  Cpu,
  Monitor,
  Calendar,
  Tag,
  Hash,
  Edit,
  Camera,
  Shield
} from 'lucide-react';
import { formatDate } from '@/utils/formatDate';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import PhotoEvidence from './PhotoEvidence';
import EditInterventionModal from './EditInterventionModal';

interface EquipmentTimelineProps {
  equipo: {
    id: string;
    serial: string;
    estado: string;
    fechaCompra?: string | null;
    numeroFactura?: string | null;
    proveedor?: string | null;
    monto?: number | null;
    sisOperativo?: string | null;
    procesador?: string | null;
    ram?: string | null;
    almacenamiento?: string | null;
    macWifi?: string | null;
    macEthernet?: string | null;
    officeVersion?: string | null;
    ubicacion?: { 
      id: string; 
      nombre: string; 
      piso?: string; 
      sala?: string; 
    } | null;
    empleado?: { 
      id: string;
      nombre: string; 
      apellido: string; 
      departamento?: {
        nombre: string;
        empresa?: { nombre: string };
      };
      // Algunas respuestas del API incluyen empresa al nivel del empleado (no anidada en departamento)
      empresa?: { nombre: string };
    } | null;
    modelo: {
      nombre: string;
      marca: { nombre: string };
    };
    historial?: Array<{
      id: string;
      tipo: 'asignacion' | 'modificacion' | 'creacion' | 'intervencion';
      fecha: string;
      detalle: any;
    }>;
  };
  // Nuevas props para filtros
  showFilters?: boolean;
  onFiltersChange?: (filters: any) => void;
  externalHistorial?: Array<{
    id: string;
    tipo: 'asignacion' | 'modificacion' | 'creacion' | 'intervencion';
    fecha: string;
    actionType: string;
    detalle: any;
  }>;
  loading?: boolean;
  error?: string | null;
}

export function EquipmentTimeline({ 
  equipo, 
  showFilters = false, 
  onFiltersChange,
  externalHistorial,
  loading = false,
  error = null
}: EquipmentTimelineProps) {
  const [editInterventionModalOpen, setEditInterventionModalOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<any>(null);

  const handleEditIntervention = (intervention: any) => {
    setSelectedIntervention({
      ...intervention,
      equipmentId: equipo.id,
      equipmentType: 'computador', // Por defecto, se puede ajustar según el contexto
      equipmentSerial: equipo.serial,
    });
    setEditInterventionModalOpen(true);
  };

  const handleInterventionUpdateSuccess = () => {
    // Recargar el historial del equipo
    if (onFiltersChange) {
      onFiltersChange({});
    }
  };

  // Función para generar mensajes inteligentes basados en el contexto
  const generateTimelineMessage = (entry: any, index: number) => {
    const { tipo, detalle, fecha } = entry;
    const fechaFormateada = formatDate(fecha);
    
    switch (tipo) {
      case 'creacion':
        return {
          icon: <ShoppingCart className="h-4 w-4 text-green-500" />,
          title: 'Equipo Creado',
          message: `Equipo registrado en el sistema el ${fechaFormateada}`,
          color: 'green',
          badge: 'Creación',
          details: [
            `Serial: ${equipo.serial}`,
            `Modelo: ${equipo.modelo.nombre}`,
            `Marca: ${equipo.modelo.marca.nombre}`,
            equipo.fechaCompra && `Fecha de compra: ${formatDate(equipo.fechaCompra)}`,
            equipo.proveedor && `Proveedor: ${equipo.proveedor}`,
            equipo.monto && `Monto: $${equipo.monto.toLocaleString()}`
          ].filter(Boolean)
        };

      case 'asignacion':
        const asig = detalle;
        const targetName = asig.targetEmpleado
          ? `${asig.targetEmpleado.nombre} ${asig.targetEmpleado.apellido}`
          : asig.targetDepartamento?.nombre || 'N/A';
        const orgLine = asig.targetEmpleado?.departamento?.nombre && asig.targetEmpleado?.empresa?.nombre
          ? `Org: ${asig.targetEmpleado.departamento.nombre} - ${asig.targetEmpleado.empresa.nombre}`
          : null;
        
        const isAssignment = asig.actionType === 'Assignment' || asig.actionType === 'ASIGNACION';
        const isStatusChange = asig.actionType === 'CAMBIO_ESTADO';
        const isReturn = asig.actionType === 'Return' || asig.actionType === 'DEVOLUCION';
        const isEdit = asig.actionType === 'Edit';
        const isCreation = asig.actionType === 'CREACION';
        const isLocationUpdate = asig.actionType === 'ACTUALIZACION_UBICACION';
        
        if (isCreation) {
          return {
            icon: <Package className="h-4 w-4 text-green-500" />,
            title: 'Creación de Equipo',
            message: `Equipo creado el ${fechaFormateada}`,
            color: 'green',
            badge: 'Creado',
            details: [
              asig.ubicacion?.nombre && `Ubicación inicial: ${asig.ubicacion.nombre}`,
              orgLine,
              asig.motivo && `Motivo: ${asig.motivo}`,
              asig.notes && `Notas: ${asig.notes}`,
              asig.evidenciaFotos && 'Evidencia fotográfica disponible'
            ].filter(Boolean),
            evidenciaFotos: asig.evidenciaFotos ? asig.evidenciaFotos.split(',') : []
          };
        }

        if (isLocationUpdate) {
          return {
            icon: <MapPin className="h-4 w-4 text-indigo-500" />,
            title: 'Actualización de Ubicación',
            message: `Ubicación actualizada el ${fechaFormateada}`,
            color: 'indigo',
            badge: 'Ubicación',
            details: [
              asig.ubicacion?.nombre && `Nueva ubicación: ${asig.ubicacion.nombre}`,
              asig.motivo && `Motivo: ${asig.motivo}`,
              asig.notes && `Notas: ${asig.notes}`,
              orgLine,
              asig.evidenciaFotos && 'Evidencia fotográfica disponible'
            ].filter(Boolean),
            evidenciaFotos: asig.evidenciaFotos ? asig.evidenciaFotos.split(',') : []
          };
        }
        
        if (isEdit) {
          return {
            icon: <Edit className="h-4 w-4 text-indigo-500" />,
            title: 'Edición de Equipo',
            message: `Equipo editado el ${fechaFormateada}`,
            color: 'indigo',
            badge: 'Edición',
            details: [
              asig.notes && `Detalles: ${asig.notes}`,
              asig.motivo && `Motivo: ${asig.motivo}`,
              orgLine,
              asig.evidenciaFotos && 'Evidencia fotográfica disponible'
            ].filter(Boolean),
            evidenciaFotos: asig.evidenciaFotos ? asig.evidenciaFotos.split(',') : []
          };
        }
        
        if (isStatusChange) {
          return {
            icon: <Settings className="h-4 w-4 text-purple-500" />,
            title: 'Cambio de Estado',
            message: `Estado cambiado el ${fechaFormateada}`,
            color: 'purple',
            badge: 'Estado',
            details: [
              asig.notes && `Detalles: ${asig.notes}`,
              asig.motivo && `Motivo: ${asig.motivo}`,
              orgLine,
              asig.evidenciaFotos && 'Evidencia fotográfica disponible'
            ].filter(Boolean),
            evidenciaFotos: asig.evidenciaFotos ? asig.evidenciaFotos.split(',') : []
          };
        }
        
        return {
          icon: isAssignment ? <User className="h-4 w-4 text-blue-500" /> : <ArrowRight className="h-4 w-4 text-orange-500" />,
          title: isAssignment ? 'Asignación' : 'Devolución',
          message: isAssignment 
            ? `Asignado a ${targetName} el ${fechaFormateada}`
            : `Devuelto por ${targetName} el ${fechaFormateada}`,
          color: isAssignment ? 'blue' : 'orange',
          badge: isAssignment ? 'Asignado' : 'Devuelto',
          details: [
            asig.motivo && `Motivo: ${asig.motivo}`,
            asig.notes && `Notas: ${asig.notes}`,
            asig.ubicacion?.nombre && `Ubicación: ${asig.ubicacion.nombre}`,
            orgLine,
            asig.evidenciaFotos && 'Evidencia fotográfica disponible'
          ].filter(Boolean),
          evidenciaFotos: asig.evidenciaFotos ? asig.evidenciaFotos.split(',') : []
        };

      case 'intervencion':
        const intervention = detalle;
        return {
          icon: <Shield className="h-4 w-4 text-amber-500" />,
          title: 'Intervención Técnica',
          message: `Intervención realizada el ${fechaFormateada}`,
          color: 'amber',
          badge: 'Intervención',
            details: [
              intervention.notas && `Observaciones: ${intervention.notas}`,
              `Realizada por: Telemática`,
              intervention.evidenciaFotos && 'Evidencia fotográfica disponible'
            ].filter(Boolean),
          evidenciaFotos: intervention.evidenciaFotos ? intervention.evidenciaFotos.split(',') : [],
          // Datos para edición
          canEdit: true,
          interventionData: {
            id: intervention.id,
            fecha: intervention.fecha,
            notas: intervention.notas,
            evidenciaFotos: intervention.evidenciaFotos
          }
        };

      case 'modificacion':
        const mod = detalle;
        
        // Cambios de estado
        if (mod.campo === 'estado') {
          const estadoAnterior = mod.valorAnterior || 'Sin estado';
          const estadoNuevo = mod.valorNuevo || 'Sin estado';
          
          const getStateIcon = (estado: string) => {
            switch (estado) {
              case 'ASIGNADO': return <User className="h-4 w-4 text-blue-500" />;
              case 'OPERATIVO': return <CheckCircle className="h-4 w-4 text-green-500" />;
              case 'EN_MANTENIMIENTO': return <Wrench className="h-4 w-4 text-orange-500" />;
              case 'EN_RESGUARDO': return <Package className="h-4 w-4 text-purple-500" />;
              case 'DE_BAJA': return <XCircle className="h-4 w-4 text-red-500" />;
              default: return <Settings className="h-4 w-4 text-gray-500" />;
            }
          };

          const getStateColor = (estado: string) => {
            switch (estado) {
              case 'ASIGNADO': return 'blue';
              case 'OPERATIVO': return 'green';
              case 'EN_MANTENIMIENTO': return 'orange';
              case 'EN_RESGUARDO': return 'purple';
              case 'DE_BAJA': return 'red';
              default: return 'gray';
            }
          };

          return {
            icon: getStateIcon(estadoNuevo),
            title: 'Cambio de Estado',
            message: `Estado cambió de "${estadoAnterior}" a "${estadoNuevo}" el ${fechaFormateada}`,
            color: getStateColor(estadoNuevo),
            badge: estadoNuevo,
            details: [
              `Estado anterior: ${estadoAnterior}`,
              `Estado nuevo: ${estadoNuevo}`
            ].filter(Boolean)
          };
        }
        
        // Cambios de ubicación
        if (mod.campo === 'ubicacionId') {
          return {
            icon: <MapPin className="h-4 w-4 text-indigo-500" />,
            title: 'Cambio de Ubicación',
            message: `Ubicación actualizada el ${fechaFormateada}`,
            color: 'indigo',
            badge: 'Ubicación',
            details: [
              `Ubicación anterior: ${mod.valorAnterior || 'Sin ubicación'}`,
              `Ubicación nueva: ${mod.valorNuevo || 'Sin ubicación'}`,
              mod.motivo && `Motivo: ${mod.motivo}`
            ].filter(Boolean)
          };
        }

        // Cambios de hardware/software
        if (['sisOperativo', 'procesador', 'ram', 'almacenamiento', 'macWifi', 'macEthernet', 'officeVersion'].includes(mod.campo)) {
          const getHardwareIcon = (campo: string) => {
            switch (campo) {
              case 'sisOperativo': return <Monitor className="h-4 w-4 text-blue-500" />;
              case 'procesador': return <Cpu className="h-4 w-4 text-purple-500" />;
              case 'ram': case 'almacenamiento': return <HardDrive className="h-4 w-4 text-green-500" />;
              case 'macWifi': case 'macEthernet': return <Settings className="h-4 w-4 text-orange-500" />;
              case 'officeVersion': return <Tag className="h-4 w-4 text-indigo-500" />;
              default: return <Settings className="h-4 w-4 text-gray-500" />;
            }
          };

          return {
            icon: getHardwareIcon(mod.campo),
            title: 'Actualización de Especificaciones',
            message: `${mod.campo} actualizado el ${fechaFormateada}`,
            color: 'amber',
            badge: 'Hardware/Software',
            details: [
              `Campo: ${mod.campo}`,
              `Valor anterior: ${mod.valorAnterior || 'Sin valor'}`,
              `Valor nuevo: ${mod.valorNuevo || 'Sin valor'}`,
              mod.motivo && `Motivo: ${mod.motivo}`
            ].filter(Boolean)
          };
        }
        
        // Otros cambios
        return {
          icon: <Settings className="h-4 w-4 text-amber-500" />,
          title: 'Modificación',
          message: `${mod.campo} actualizado el ${fechaFormateada}`,
          color: 'amber',
          badge: 'Modificado',
          details: [
            `Campo: ${mod.campo}`,
            `Valor anterior: ${mod.valorAnterior || 'Sin valor'}`,
            `Valor nuevo: ${mod.valorNuevo || 'Sin valor'}`,
            mod.motivo && `Motivo: ${mod.motivo}`
          ].filter(Boolean)
        };

      default:
        return {
          icon: <History className="h-4 w-4 text-gray-500" />,
          title: 'Evento',
          message: `Evento registrado el ${fechaFormateada}`,
          color: 'gray',
          badge: 'Evento',
          details: []
        };
    }
  };

  // Función para obtener el color del badge
  const getBadgeColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      amber: 'bg-amber-100 text-amber-800 border-amber-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  // Generar mensaje de estado actual
  const generateCurrentStatusMessage = () => {
    const { estado, empleado, ubicacion } = equipo;
    
    if (estado === 'ASIGNADO' && empleado) {
      return {
        icon: <User className="h-4 w-4 text-blue-500" />,
        title: 'Estado Actual',
        message: `Actualmente asignado a ${empleado.nombre} ${empleado.apellido}`,
        color: 'blue',
        badge: 'Asignado',
        details: [
          `Departamento: ${typeof empleado.departamento === 'string' ? empleado.departamento : empleado.departamento?.nombre || 'Sin departamento'}`,
          // Fallback: si el departamento no trae empresa anidada, usamos empleado.empresa
          `Empresa: ${empleado.departamento?.empresa?.nombre || empleado.empresa?.nombre || 'Sin empresa'}`,
          ubicacion && `Ubicación: ${ubicacion.nombre}`
        ].filter(Boolean)
      };
    } else if (estado === 'EN_MANTENIMIENTO') {
      return {
        icon: <Wrench className="h-4 w-4 text-orange-500" />,
        title: 'Estado Actual',
        message: `En mantenimiento${ubicacion ? ` en ${ubicacion.nombre}` : ''}`,
        color: 'orange',
        badge: 'Mantenimiento',
        details: ubicacion ? [`Ubicación: ${ubicacion.nombre}`] : []
      };
    } else if (estado === 'OPERATIVO') {
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        title: 'Estado Actual',
        message: `Operativo${ubicacion ? ` en ${ubicacion.nombre}` : ''}`,
        color: 'green',
        badge: 'Operativo',
        details: ubicacion ? [`Ubicación: ${ubicacion.nombre}`] : []
      };
    } else if (estado === 'EN_RESGUARDO') {
      return {
        icon: <Package className="h-4 w-4 text-purple-500" />,
        title: 'Estado Actual',
        message: `En resguardo${ubicacion ? ` en ${ubicacion.nombre}` : ''}`,
        color: 'purple',
        badge: 'Resguardo',
        details: ubicacion ? [`Ubicación: ${ubicacion.nombre}`] : []
      };
    } else if (estado === 'DE_BAJA') {
      return {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
        title: 'Estado Actual',
        message: 'Dado de baja',
        color: 'red',
        badge: 'De Baja',
        details: []
      };
    }
    
    return {
      icon: <Clock className="h-4 w-4 text-gray-500" />,
      title: 'Estado Actual',
      message: `Estado: ${estado}`,
      color: 'gray',
      badge: estado,
      details: []
    };
  };

  const currentStatus = generateCurrentStatusMessage();

  // Usar historial externo si está disponible y no está vacío, sino usar el historial del equipo
  const historialCompleto = (externalHistorial !== undefined && externalHistorial.length > 0)
    ? externalHistorial 
    : [...(equipo.historial || [])]
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
      {/* Estado actual */}
      <div className="flex items-start space-x-4">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-blue-300">
            {currentStatus.icon}
          </div>
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-800 flex items-center">
                  {currentStatus.icon}
                  <span className="ml-2">{currentStatus.title}</span>
                </h3>
                <Badge className={`${getBadgeColor(currentStatus.color)} text-xs`}>
                  {currentStatus.badge}
                </Badge>
              </div>
              <p className="text-sm text-gray-700 mb-2">{currentStatus.message}</p>
              {currentStatus.details.length > 0 && (
                <div className="text-xs text-gray-600 space-y-1">
                  {currentStatus.details.map((detail, index) => (
                    <div key={index}>{detail}</div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Historial */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#167DBA] mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Cargando historial...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      ) : historialCompleto && historialCompleto.length > 0 ? (
        historialCompleto.map((entry, index) => {
          const isLast = index === historialCompleto.length - 1;
          
          // Generar mensaje especial para la entrada de creación
          const message = entry.id === 'creacion' ? {
            icon: <Package className="h-4 w-4 text-green-600" />,
            title: 'Equipo Creado',
            message: 'El equipo fue registrado en el sistema',
            badge: 'Creación',
            color: 'green',
            details: [
              `Serial: ${equipo.serial}`
            ]
          } : generateTimelineMessage(entry, index);

          return (
            <div key={entry.id} className="flex items-start space-x-4">
              {/* Timeline decorator */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 bg-white rounded-full flex items-center justify-center border ${
                  entry.id === 'creacion' ? 'border-green-300' : 'border-gray-300'
                }`}>
                  {message.icon}
                </div>
                {!isLast && <div className="w-px h-24 bg-gray-200 mt-2"></div>}
              </div>

              {/* Contenido de la tarjeta */}
              <div className="flex-1 min-w-0 pt-1">
                <Card className={`${
                  entry.id === 'creacion' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-sm font-medium flex items-center ${
                        entry.id === 'creacion' ? 'text-green-800' : 'text-gray-800'
                      }`}>
                        {message.icon}
                        <span className="ml-2">{message.title}</span>
                      </h3>
                      <div className="flex items-center space-x-2">
                        <p className={`text-xs ${
                          entry.id === 'creacion' ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {formatDate(entry.fecha)}
                        </p>
                        <Badge className={`${
                          entry.id === 'creacion' 
                            ? 'bg-green-100 text-green-800' 
                            : getBadgeColor(message.color)
                        } text-xs`}>
                          {message.badge}
                        </Badge>
                      </div>
                    </div>
                    <p className={`text-sm mb-2 ${
                      entry.id === 'creacion' ? 'text-green-700' : 'text-gray-700'
                    }`}>
                      {message.message}
                    </p>
                    {message.details && message.details.length > 0 && (
                      <div className={`text-xs space-y-1 bg-white/50 rounded p-2 ${
                        entry.id === 'creacion' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {message.details.map((detail, detailIndex) => (
                          <div key={detailIndex} className="flex items-center">
                            <Hash className={`h-3 w-3 mr-1 ${
                              entry.id === 'creacion' ? 'text-green-400' : 'text-gray-400'
                            }`} />
                            {detail}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Evidencia Fotográfica */}
                    {message.evidenciaFotos && message.evidenciaFotos.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center mb-2">
                          <Camera className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-xs font-medium text-gray-700">Evidencia Fotográfica:</span>
                        </div>
                        <PhotoEvidence images={message.evidenciaFotos} />
                      </div>
                    )}
                    

                    {/* Botón de Edición para Intervenciones */}
                    {message.canEdit && message.interventionData && (
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => handleEditIntervention(message.interventionData)}
                          className="flex items-center px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
                          title="Editar intervención"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center text-gray-600 py-8">
          <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p>No hay historial de movimientos para este equipo.</p>
        </div>
      )}
      {/* Modal de Edición de Intervención */}
      <EditInterventionModal
        isOpen={editInterventionModalOpen}
        onClose={() => setEditInterventionModalOpen(false)}
        onSuccess={handleInterventionUpdateSuccess}
        intervention={selectedIntervention}
      />
    </div>
  );
}
