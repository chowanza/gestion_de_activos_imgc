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
  Hash,
  Edit,
  UserPlus,
  UserMinus,
  FileText,
  Briefcase
} from 'lucide-react';
import { formatDate } from '@/utils/formatDate';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface EmployeeTimelineProps {
  empleado: {
    id: string;
    nombre: string;
    apellido: string;
    ced: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    fechaNacimiento?: string | null;
    fechaIngreso?: string | null;
    fechaDesincorporacion?: string | null;
    fotoPerfil?: string | null;
    organizaciones?: Array<{
      empresa: { nombre: string };
      departamento: { nombre: string };
      cargo: { nombre: string };
      activo: boolean;
    }>;
  };
  statusHistory: Array<{
    id: string;
    accion: string;
    fecha: string;
    motivo?: string;
    createdAt: string;
  }>;
  loading?: boolean;
}

export function EmployeeTimeline({ empleado, statusHistory, loading = false }: EmployeeTimelineProps) {
  
  // Función para obtener el estado actual del empleado
  const getCurrentStatus = () => {
    if (empleado.fechaDesincorporacion) {
      return {
        title: 'Empleado Inactivo',
        message: `Desincorporado el ${formatDate(empleado.fechaDesincorporacion)}`,
        color: 'red',
        icon: <UserMinus className="h-4 w-4" />,
        badge: 'Inactivo'
      };
    } else {
      return {
        title: 'Empleado Activo',
        message: `Activo desde el ${formatDate(empleado.fechaIngreso || new Date().toISOString())}`,
        color: 'green',
        icon: <User className="h-4 w-4" />,
        badge: 'Activo'
      };
    }
  };

  const currentStatus = getCurrentStatus();

  // Función para obtener el color del badge
  const getBadgeColor = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'blue':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'orange':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Función para obtener información del historial
  const getHistoryInfo = (accion: string) => {
    switch (accion) {
      case 'Empleado Creado':
        return {
          title: 'Empleado Creado',
          icon: <UserPlus className="h-4 w-4" />,
          color: 'blue',
          badge: 'Creación'
        };
      case 'activar':
        return {
          title: 'Empleado Reactivado',
          icon: <User className="h-4 w-4" />,
          color: 'green',
          badge: 'Activación'
        };
      case 'desactivar':
        return {
          title: 'Empleado Desactivado',
          icon: <UserMinus className="h-4 w-4" />,
          color: 'red',
          badge: 'Desactivación'
        };
      case 'Datos Actualizados':
        return {
          title: 'Datos Actualizados',
          icon: <Edit className="h-4 w-4" />,
          color: 'yellow',
          badge: 'Actualización'
        };
      case 'Empleado Desincorporado':
        return {
          title: 'Empleado Desincorporado',
          icon: <UserMinus className="h-4 w-4" />,
          color: 'orange',
          badge: 'Desincorporación'
        };
      default:
        return {
          title: accion,
          icon: <FileText className="h-4 w-4" />,
          color: 'gray',
          badge: 'Evento'
        };
    }
  };

  // Crear entrada de creación si no existe en el historial
  const hasCreationEntry = statusHistory.some(item => item.accion === 'Empleado Creado');
  
  let historialCompleto = [...statusHistory];
  
  if (!hasCreationEntry && empleado.fechaIngreso) {
    historialCompleto.unshift({
      id: 'creation',
      accion: 'Empleado Creado',
      fecha: empleado.fechaIngreso,
      motivo: `Empleado ${empleado.nombre} ${empleado.apellido} creado en el sistema`,
      createdAt: empleado.fechaIngreso
    });
  }

  // Ordenar por fecha (más reciente primero)
  historialCompleto.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

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
              
              {/* Información adicional del empleado */}
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <Hash className="h-3 w-3" />
                  <span>Cédula: {empleado.ced}</span>
                </div>
                {empleado.email && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-3 w-3" />
                    <span>Email: {empleado.email}</span>
                  </div>
                )}
                {empleado.telefono && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-3 w-3" />
                    <span>Teléfono: {empleado.telefono}</span>
                  </div>
                )}
                {empleado.organizaciones && empleado.organizaciones.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Building className="h-3 w-3" />
                    <span>Empresa: {empleado.organizaciones[0].empresa.nombre}</span>
                  </div>
                )}
                {empleado.organizaciones && empleado.organizaciones.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3 w-3" />
                    <span>Departamento: {empleado.organizaciones[0].departamento.nombre}</span>
                  </div>
                )}
                {empleado.organizaciones && empleado.organizaciones.length > 0 && (
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span>Cargo: {empleado.organizaciones[0].cargo.nombre}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Historial */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-500">Cargando historial...</span>
          </div>
        </div>
      ) : historialCompleto.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <History className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No hay historial disponible</p>
          </div>
        </div>
      ) : (
        historialCompleto.map((evento, index) => {
          const historyInfo = getHistoryInfo(evento.accion);
          
          return (
            <div key={evento.id} className="flex items-start space-x-4">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  historyInfo.color === 'blue' ? 'border-blue-300 bg-blue-50' :
                  historyInfo.color === 'green' ? 'border-green-300 bg-green-50' :
                  historyInfo.color === 'red' ? 'border-red-300 bg-red-50' :
                  historyInfo.color === 'yellow' ? 'border-yellow-300 bg-yellow-50' :
                  historyInfo.color === 'orange' ? 'border-orange-300 bg-orange-50' :
                  'border-gray-300 bg-gray-50'
                }`}>
                  {historyInfo.icon}
                </div>
                {index < historialCompleto.length - 1 && (
                  <div className="w-px h-8 bg-gray-300 mt-2" />
                )}
              </div>
              
              <div className="flex-1 min-w-0 pt-1">
                <Card className={`${
                  historyInfo.color === 'blue' ? 'bg-blue-50 border-blue-200' :
                  historyInfo.color === 'green' ? 'bg-green-50 border-green-200' :
                  historyInfo.color === 'red' ? 'bg-red-50 border-red-200' :
                  historyInfo.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                  historyInfo.color === 'orange' ? 'bg-orange-50 border-orange-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-800 flex items-center">
                        {historyInfo.icon}
                        <span className="ml-2">{historyInfo.title}</span>
                      </h3>
                      <Badge className={`${getBadgeColor(historyInfo.color)} text-xs`}>
                        {historyInfo.badge}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>Fecha: {formatDate(evento.fecha)}</span>
                      </div>
                      {evento.motivo && (
                        <div className="flex items-start gap-2">
                          <FileText className="h-3 w-3 mt-0.5" />
                          <span>Motivo: {evento.motivo}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

