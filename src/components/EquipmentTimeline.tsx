'use client';

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
  Hash
} from 'lucide-react';
import { formatDate } from '@/utils/formatDate';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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
    } | null;
    modelo: {
      nombre: string;
      marca: { nombre: string };
    };
    historial: Array<{
      id: string;
      tipo: 'asignacion' | 'modificacion' | 'creacion';
      fecha: string;
      detalle: any;
    }>;
  };
}

export function EquipmentTimeline({ equipo }: EquipmentTimelineProps) {
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
        
        const isAssignment = asig.actionType === 'Assignment';
        
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
            asig.ubicacion?.nombre && `Ubicación: ${asig.ubicacion.nombre}`
          ].filter(Boolean)
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
          `Empresa: ${typeof empleado.departamento === 'string' ? 'Sin empresa' : empleado.departamento?.empresa?.nombre || 'Sin empresa'}`,
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

  // Crear entrada de creación del equipo
  const creacionEntry = {
    id: 'creacion',
    tipo: 'creacion' as const,
    fecha: equipo.fechaCompra || new Date().toISOString(),
    detalle: {}
  };

  // Combinar historial con entrada de creación
  const historialCompleto = [creacionEntry, ...equipo.historial]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <div className="space-y-4">
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
      {historialCompleto && historialCompleto.length > 0 ? (
        historialCompleto.map((entry, index) => {
          const isLast = index === historialCompleto.length - 1;
          const message = generateTimelineMessage(entry, index);

          return (
            <div key={entry.id} className="flex items-start space-x-4">
              {/* Timeline decorator */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-300">
                  {message.icon}
                </div>
                {!isLast && <div className="w-px h-24 bg-gray-200 mt-2"></div>}
              </div>

              {/* Contenido de la tarjeta */}
              <div className="flex-1 min-w-0 pt-1">
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-800 flex items-center">
                        {message.icon}
                        <span className="ml-2">{message.title}</span>
                      </h3>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-gray-600">{formatDate(entry.fecha)}</p>
                        <Badge className={`${getBadgeColor(message.color)} text-xs`}>
                          {message.badge}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{message.message}</p>
                    {message.details && message.details.length > 0 && (
                      <div className="text-xs text-gray-600 space-y-1 bg-white/50 rounded p-2">
                        {message.details.map((detail, detailIndex) => (
                          <div key={detailIndex} className="flex items-center">
                            <Hash className="h-3 w-3 mr-1 text-gray-400" />
                            {detail}
                          </div>
                        ))}
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
    </div>
  );
}
