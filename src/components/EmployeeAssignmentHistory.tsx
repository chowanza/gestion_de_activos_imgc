'use client';

import { 
  Clock, 
  User, 
  ArrowRight, 
  ArrowLeft,
  Package,
  Monitor,
  Smartphone,
  Calendar,
  MapPin,
  FileText,
  UserCheck,
  UserX,
  Eye
} from 'lucide-react';
import { formatDate } from '@/utils/formatDate';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EmployeeAssignmentHistoryProps {
  historial: Array<{
    id: number;
    fecha: string;
    accion: string;
    motivo: string;
    notas?: string;
    gerente: string;
    localidad?: string;
    item: {
      id: string;
      serial: string;
      modelo: string;
      marca: string;
      tipo: 'Computador' | 'Dispositivo';
    };
    itemType: 'Computador' | 'Dispositivo';
    createdAt: string;
    updatedAt: string;
  }>;
  loading?: boolean;
}

export function EmployeeAssignmentHistory({ historial, loading = false }: EmployeeAssignmentHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  // Función para navegar a los detalles del equipo
  const handleNavigateToEquipment = (entry: any) => {
    const equipmentType = entry.item.tipo.toLowerCase();
    const equipmentId = entry.item.id;
    
    if (equipmentType === 'computador') {
      router.push(`/computadores/${equipmentId}/details`);
    } else if (equipmentType === 'dispositivo') {
      router.push(`/dispositivos/${equipmentId}/details`);
    }
  };

  // Filtrar historial basado en el término de búsqueda
  const filteredHistorial = historial.filter(entry => {
    const searchLower = searchTerm.toLowerCase();
    return (
      entry.item.serial.toLowerCase().includes(searchLower) ||
      entry.item.modelo.toLowerCase().includes(searchLower) ||
      entry.item.marca.toLowerCase().includes(searchLower) ||
      entry.item.tipo.toLowerCase().includes(searchLower) ||
      entry.accion.toLowerCase().includes(searchLower) ||
      entry.motivo.toLowerCase().includes(searchLower) ||
      (entry.notas && entry.notas.toLowerCase().includes(searchLower)) ||
      entry.gerente.toLowerCase().includes(searchLower) ||
      (entry.localidad && entry.localidad.toLowerCase().includes(searchLower))
    );
  });

  // Función para generar mensajes inteligentes
  const generateAssignmentMessage = (entry: any) => {
    const fechaFormateada = formatDate(entry.fecha);
    const isAssignment = entry.accion === 'Assignment';
    const isReturn = entry.accion === 'Return';
    
    const getItemIcon = (tipo: string) => {
      return tipo === 'Computador' ? 
        <Monitor className="h-4 w-4 text-blue-500" /> : 
        <Smartphone className="h-4 w-4 text-green-500" />;
    };

    const getActionIcon = (accion: string) => {
      switch (accion) {
        case 'Assignment': return <UserCheck className="h-4 w-4 text-green-500" />;
        case 'Return': return <UserX className="h-4 w-4 text-orange-500" />;
        default: return <ArrowRight className="h-4 w-4 text-gray-500" />;
      }
    };

    const getActionColor = (accion: string) => {
      switch (accion) {
        case 'Assignment': return 'green';
        case 'Return': return 'orange';
        default: return 'gray';
      }
    };

    const getActionLabel = (accion: string) => {
      switch (accion) {
        case 'Assignment': return 'Asignado';
        case 'Return': return 'Devuelto';
        default: return accion;
      }
    };

    return {
      icon: getActionIcon(entry.accion),
      itemIcon: getItemIcon(entry.item.tipo),
      title: isAssignment ? 'Equipo Asignado' : isReturn ? 'Equipo Devuelto' : 'Movimiento de Equipo',
      message: isAssignment 
        ? `Se asignó ${entry.item.tipo.toLowerCase()} el ${fechaFormateada}`
        : isReturn 
        ? `Se devolvió ${entry.item.tipo.toLowerCase()} el ${fechaFormateada}`
        : `Movimiento de ${entry.item.tipo.toLowerCase()} el ${fechaFormateada}`,
      color: getActionColor(entry.accion),
      badge: getActionLabel(entry.accion),
      details: [
        `Serial: ${entry.item.serial}`,
        `Modelo: ${entry.item.modelo}`,
        `Marca: ${entry.item.marca}`,
        `Tipo: ${entry.item.tipo}`,
        entry.motivo && `Motivo: ${entry.motivo}`,
        entry.notas && `Notas: ${entry.notas}`,
        entry.gerente && `Gerente: ${entry.gerente}`,
        entry.localidad && `Ubicación: ${entry.localidad}`
      ].filter(Boolean)
    };
  };

  // Función para obtener el color del badge
  const getBadgeColor = (color: string) => {
    const colors = {
      green: 'bg-green-100 text-green-800 border-green-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <Clock className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Cargando historial...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar por serial, modelo, marca, motivo, notas, gerente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Contador de resultados */}
      <div className="text-sm text-gray-600">
        {filteredHistorial.length} de {historial.length} movimientos
      </div>

      {/* Historial */}
      {filteredHistorial.length > 0 ? (
        filteredHistorial.map((entry, index) => {
          const isLast = index === filteredHistorial.length - 1;
          const message = generateAssignmentMessage(entry);

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
                        {message.itemIcon}
                        <span className="ml-2">{message.title}</span>
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleNavigateToEquipment(entry)}
                          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                          title={`Ver detalles del ${entry.item.tipo.toLowerCase()}`}
                        >
                          <Eye className="h-4 w-4 text-gray-600 hover:text-blue-600" />
                        </button>
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
                            <FileText className="h-3 w-3 mr-1 text-gray-400" />
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
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p>
            {searchTerm 
              ? `No se encontraron movimientos que coincidan con "${searchTerm}"`
              : 'No hay historial de asignaciones para este empleado.'
            }
          </p>
        </div>
      )}
    </div>
  );
}
