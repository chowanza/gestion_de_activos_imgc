'use client';

import { History, User, Building, MapPin, Wrench, ArrowRight, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';
import { Badge } from '@/components/ui/badge';

interface HistorialEntry {
  id: string;
  fecha: string;
  tipo: 'asignacion' | 'modificacion' | 'movimiento' | 'estado';
  detalle: any;
}

interface IntelligentHistoryProps {
  historial: HistorialEntry[];
  equipoActual: {
    estado: string;
    empleado?: { nombre: string; apellido: string } | null;
    departamento?: { nombre: string } | null;
    ubicacion?: { nombre: string } | null;
  };
}

export function IntelligentHistory({ historial, equipoActual }: IntelligentHistoryProps) {
  // Función para generar mensajes inteligentes basados en el contexto
  const generateIntelligentMessage = (entry: HistorialEntry, index: number) => {
    const { tipo, detalle, fecha } = entry;
    const fechaFormateada = formatDate(fecha);
    
    // Obtener el estado anterior (si existe)
    const estadoAnterior = index > 0 ? historial[index - 1] : null;
    
    switch (tipo) {
      case 'asignacion':
        const asig = detalle;
        const targetName = asig.targetEmpleado
          ? `${asig.targetEmpleado.nombre} ${asig.targetEmpleado.apellido}`
          : asig.targetDepartamento?.nombre || 'N/A';
        
        return {
          icon: <User className="h-4 w-4 text-blue-500" />,
          title: 'Asignación',
          message: `Fue asignado el ${fechaFormateada} a ${targetName}`,
          color: 'blue',
          badge: 'Asignado'
        };

      case 'modificacion':
        const mod = detalle;
        if (mod.campo === 'estado') {
          const estadoAnterior = mod.valorAnterior || 'Sin estado';
          const estadoNuevo = mod.valorNuevo || 'Sin estado';
          
          // Lógica inteligente para cambios de estado
          if (estadoNuevo === 'Asignado') {
            return {
              icon: <CheckCircle className="h-4 w-4 text-green-500" />,
              title: 'Cambio de Estado',
              message: `Cambió de "${estadoAnterior}" a "Asignado" el ${fechaFormateada}`,
              color: 'green',
              badge: 'Asignado'
            };
          } else if (estadoNuevo === 'Mantenimiento') {
            return {
              icon: <Wrench className="h-4 w-4 text-orange-500" />,
              title: 'Mantenimiento',
              message: `Se movió a mantenimiento el ${fechaFormateada}${equipoActual.ubicacion ? ` en ${equipoActual.ubicacion.nombre}` : ''}`,
              color: 'orange',
              badge: 'Mantenimiento'
            };
          } else if (estadoNuevo === 'Operativo') {
            return {
              icon: <CheckCircle className="h-4 w-4 text-green-500" />,
              title: 'Operativo',
              message: `Se devolvió a operativo el ${fechaFormateada}${equipoActual.ubicacion ? ` en ${equipoActual.ubicacion.nombre}` : ''}`,
              color: 'green',
              badge: 'Operativo'
            };
          } else if (estadoNuevo === 'Resguardado') {
            return {
              icon: <Building className="h-4 w-4 text-purple-500" />,
              title: 'Resguardado',
              message: `Fue resguardado el ${fechaFormateada}${equipoActual.ubicacion ? ` en ${equipoActual.ubicacion.nombre}` : ''}`,
              color: 'purple',
              badge: 'Resguardado'
            };
          } else if (estadoNuevo === 'De Baja') {
            return {
              icon: <XCircle className="h-4 w-4 text-red-500" />,
              title: 'De Baja',
              message: `Fue dado de baja el ${fechaFormateada}`,
              color: 'red',
              badge: 'De Baja'
            };
          }
        } else if (mod.campo === 'ubicacionId') {
          return {
            icon: <MapPin className="h-4 w-4 text-indigo-500" />,
            title: 'Movimiento de Ubicación',
            message: `Se movió de ubicación el ${fechaFormateada}`,
            color: 'indigo',
            badge: 'Movimiento'
          };
        }
        
        return {
          icon: <Wrench className="h-4 w-4 text-amber-500" />,
          title: 'Modificación',
          message: `Se actualizó ${mod.campo} el ${fechaFormateada}`,
          color: 'amber',
          badge: 'Modificado'
        };

      case 'movimiento':
        return {
          icon: <ArrowRight className="h-4 w-4 text-indigo-500" />,
          title: 'Movimiento',
          message: `Se movió el ${fechaFormateada}`,
          color: 'indigo',
          badge: 'Movimiento'
        };

      case 'estado':
        return {
          icon: <Clock className="h-4 w-4 text-gray-500" />,
          title: 'Cambio de Estado',
          message: `Estado cambió el ${fechaFormateada}`,
          color: 'gray',
          badge: 'Estado'
        };

      default:
        return {
          icon: <History className="h-4 w-4 text-gray-500" />,
          title: 'Evento',
          message: `Evento registrado el ${fechaFormateada}`,
          color: 'gray',
          badge: 'Evento'
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
    const { estado, empleado, departamento, ubicacion } = equipoActual;
    
    if (estado === 'Asignado' && empleado) {
      return {
        icon: <User className="h-4 w-4 text-blue-500" />,
        title: 'Estado Actual',
        message: `Actualmente asignado a ${empleado.nombre} ${empleado.apellido}`,
        color: 'blue',
        badge: 'Asignado'
      };
    } else if (estado === 'Asignado' && departamento) {
      return {
        icon: <Building className="h-4 w-4 text-blue-500" />,
        title: 'Estado Actual',
        message: `Actualmente asignado al departamento ${departamento.nombre}`,
        color: 'blue',
        badge: 'Asignado'
      };
    } else if (estado === 'Mantenimiento') {
      return {
        icon: <Wrench className="h-4 w-4 text-orange-500" />,
        title: 'Estado Actual',
        message: `En mantenimiento${ubicacion ? ` en ${ubicacion.nombre}` : ''}`,
        color: 'orange',
        badge: 'Mantenimiento'
      };
    } else if (estado === 'Operativo') {
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        title: 'Estado Actual',
        message: `Operativo${ubicacion ? ` en ${ubicacion.nombre}` : ''}`,
        color: 'green',
        badge: 'Operativo'
      };
    } else if (estado === 'Resguardado') {
      return {
        icon: <Building className="h-4 w-4 text-purple-500" />,
        title: 'Estado Actual',
        message: `Resguardado${ubicacion ? ` en ${ubicacion.nombre}` : ''}`,
        color: 'purple',
        badge: 'Resguardado'
      };
    } else if (estado === 'De Baja') {
      return {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
        title: 'Estado Actual',
        message: 'Dado de baja',
        color: 'red',
        badge: 'De Baja'
      };
    }
    
    return {
      icon: <Clock className="h-4 w-4 text-gray-500" />,
      title: 'Estado Actual',
      message: `Estado: ${estado}`,
      color: 'gray',
      badge: estado
    };
  };

  const currentStatus = generateCurrentStatusMessage();

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
          <div className="bg-blue-50 rounded-md p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-800 flex items-center">
                {currentStatus.icon}
                <span className="ml-2">{currentStatus.title}</span>
              </h3>
              <Badge className={`${getBadgeColor(currentStatus.color)} text-xs`}>
                {currentStatus.badge}
              </Badge>
            </div>
            <p className="text-sm text-gray-700">{currentStatus.message}</p>
          </div>
        </div>
      </div>

      {/* Historial */}
      {historial && historial.length > 0 ? (
        historial.map((entry, index) => {
          const isLast = index === historial.length - 1;
          const message = generateIntelligentMessage(entry, index);

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
                <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
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
                  <p className="text-sm text-gray-700">{message.message}</p>
                </div>
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



























