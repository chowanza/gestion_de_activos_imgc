'use client';

import { 
  Users, 
  User, 
  Building, 
  Calendar,
  ArrowRight,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { formatDate } from '@/utils/formatDate';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface EquipmentUsersSectionProps {
  equipo: {
    id: string;
    estado: string;
    empleado?: { 
      id: string;
      nombre: string; 
      apellido: string; 
      cargo?: string | { nombre: string };
      foto?: string | null;
      departamento?: {
        nombre: string;
        empresa?: { nombre: string };
      } | string;
      empresa?: {
        nombre: string;
      } | string;
    } | null;
    departamento?: { 
      id: string;
      nombre: string; 
      ceco?: string | null;
      gerencia: { nombre: string };
      empresa?: { id: string; nombre: string };
    } | null;
    historial: Array<{
      id: string;
      tipo: 'asignacion' | 'modificacion' | 'creacion';
      fecha: string;
      detalle: any;
    }>;
  };
}

export function EquipmentUsersSection({ equipo }: EquipmentUsersSectionProps) {
  // Función para obtener el historial de asignaciones de usuarios (solo asignaciones, no devoluciones)
  const getAssignmentHistory = () => {
    const assignments = equipo.historial
      .filter(entry => entry.tipo === 'asignacion' && entry.detalle.actionType === 'Assignment')
      .map(entry => {
        const detalle = entry.detalle;
        return {
          id: entry.id,
          fecha: entry.fecha,
          accion: detalle.actionType,
          empleado: detalle.targetEmpleado ? {
            id: detalle.targetEmpleado.id,
            nombre: detalle.targetEmpleado.nombre,
            apellido: detalle.targetEmpleado.apellido,
            cargo: detalle.targetEmpleado.cargo,
            fotoPerfil: detalle.targetEmpleado.fotoPerfil,
            departamento: detalle.targetEmpleado.departamento,
            empresa: detalle.targetEmpleado.empresa
          } : null,
          motivo: detalle.motivo,
          notas: detalle.notes,
          gerente: detalle.gerente
        };
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return assignments;
  };

  // Función para obtener la fecha de asignación actual
  const getCurrentAssignmentDate = () => {
    if (equipo.estado !== 'ASIGNADO' || !equipo.empleado) return null;
    
    const currentAssignment = equipo.historial
      .filter(entry => entry.tipo === 'asignacion' && entry.detalle.actionType === 'Assignment')
      .find(entry => {
        const detalle = entry.detalle;
        return detalle.targetEmpleado?.id === equipo.empleado?.id;
      });
    
    return currentAssignment ? currentAssignment.fecha : null;
  };

  const assignmentHistory = getAssignmentHistory();
  const currentAssignmentDate = getCurrentAssignmentDate();

  // Función para obtener la foto del empleado
  const getEmployeePhoto = (empleado: any) => {
    if (empleado?.fotoPerfil) {
      return empleado.fotoPerfil;
    }
    return '/file.svg'; // Fallback a file.svg
  };

  // Función para obtener el color del badge (solo asignaciones)
  const getActionBadgeColor = () => {
    return 'bg-green-100 text-green-800 border-green-200';
  };

  // Función para obtener el icono (solo asignaciones)
  const getActionIcon = () => {
    return <ArrowRight className="h-3 w-3" />;
  };

  return (
    <Card className="bg-white/90 border-gray-200 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-200 pb-3">
        <CardTitle className="text-gray-800 flex items-center">
          <Users className="mr-2 h-5 w-5 text-orange-500" />
          {equipo.estado === 'ASIGNADO' ? 'Asignación Actual' : 'Estado del Equipo'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Estado actual del equipo (siempre primero) */}
        {equipo.empleado && (
          <div className="mb-6">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={getEmployeePhoto(equipo.empleado)} 
                    alt={`${equipo.empleado.nombre} ${equipo.empleado.apellido}`} 
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {equipo.empleado.nombre[0]}{equipo.empleado.apellido[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-medium text-gray-800">
                    {equipo.empleado.nombre} {equipo.empleado.apellido}
                  </h3>
                  {equipo.empleado.cargo && (
                    <p className="text-xs text-gray-600">{typeof equipo.empleado.cargo === 'string' ? equipo.empleado.cargo : equipo.empleado.cargo?.nombre || 'Sin cargo'}</p>
                  )}
                  {equipo.empleado.departamento && (
                    <p className="text-xs text-gray-500">
                      Dpto: {typeof equipo.empleado.departamento === 'string' ? equipo.empleado.departamento : equipo.empleado.departamento?.nombre || 'Sin departamento'}
                    </p>
                  )}
                  {equipo.empleado.empresa && (
                    <p className="text-xs text-gray-500">
                      Empresa: {typeof equipo.empleado.empresa === 'string' ? equipo.empleado.empresa : equipo.empleado.empresa?.nombre || 'Sin empresa'}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Asignado desde</p>
                <p className="text-sm text-gray-800">
                  {currentAssignmentDate ? formatDate(currentAssignmentDate) : 'Fecha no disponible'}
                </p>
                <Badge className="mt-1 bg-blue-100 text-blue-800 border-blue-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Usuario Actual
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Caso: Asignado a departamento (sin usuario específico) */}
        {equipo.estado === 'ASIGNADO' && equipo.departamento && !equipo.empleado && (
          <div className="mb-6">
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="/file.svg" alt={equipo.departamento.nombre} />
                  <AvatarFallback className="bg-purple-100 text-purple-600">
                    {equipo.departamento.nombre.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-medium text-gray-800">
                    {equipo.departamento.nombre}
                  </h3>
                  {equipo.departamento.ceco && (
                    <p className="text-xs text-gray-600">CECO: {equipo.departamento.ceco}</p>
                  )}
                  {equipo.departamento.gerencia && (
                    <p className="text-xs text-gray-500">
                      Gerencia: {equipo.departamento.gerencia.nombre}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                  <Building className="h-3 w-3 mr-1" />
                  Departamento
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Caso: No está asignado - AHORA PRIMERO */}
        {equipo.estado !== 'ASIGNADO' && (
          <div className="mb-6">
            <div className="text-center text-gray-600 py-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-800">No está asignado</p>
                  <p className="text-sm text-gray-600">
                    Este equipo se encuentra <span className="font-medium text-gray-700">
                      {equipo.estado.toLowerCase()}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Historial de asignaciones - AHORA DEBAJO */}
        {assignmentHistory.length > 0 && (
          <div>
            <div className="flex items-center mb-4">
              <h4 className="text-sm font-medium text-gray-800 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-600" />
                Historial de Asignaciones ({assignmentHistory.length})
              </h4>
            </div>
            
            <div className="space-y-3">
              {assignmentHistory.map((assignment, index) => (
                <div key={assignment.id} className="flex items-start space-x-4">
                  {/* Timeline decorator */}
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center border border-gray-300">
                      {getActionIcon()}
                    </div>
                    {index < assignmentHistory.length - 1 && (
                      <div className="w-px h-16 bg-gray-200 mt-2"></div>
                    )}
                  </div>

                  {/* Contenido de la asignación */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {assignment.empleado && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage 
                                src={getEmployeePhoto(assignment.empleado)} 
                                alt={`${assignment.empleado.nombre} ${assignment.empleado.apellido}`} 
                              />
                              <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                                {assignment.empleado.nombre[0]}{assignment.empleado.apellido[0]}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            <h5 className="text-sm font-medium text-gray-800">
                              {assignment.empleado 
                                ? `${assignment.empleado.nombre} ${assignment.empleado.apellido}`
                                : 'Usuario no disponible'
                              }
                            </h5>
                            {assignment.empleado?.cargo && (
                              <p className="text-xs text-gray-600">{typeof assignment.empleado.cargo === 'string' ? assignment.empleado.cargo : assignment.empleado.cargo?.nombre || 'Sin cargo'}</p>
                            )}
                            {assignment.empleado?.departamento && (
                              <p className="text-xs text-gray-500">
                                Dpto: {typeof assignment.empleado.departamento === 'string' ? assignment.empleado.departamento : assignment.empleado.departamento?.nombre || 'Sin departamento'}
                              </p>
                            )}
                            {assignment.empleado?.empresa && (
                              <p className="text-xs text-gray-500">
                                Empresa: {typeof assignment.empleado.empresa === 'string' ? assignment.empleado.empresa : assignment.empleado.empresa?.nombre || 'Sin empresa'}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs text-gray-600">{formatDate(assignment.fecha)}</p>
                          <Badge className={`${getActionBadgeColor()} text-xs`}>
                            Asignado
                          </Badge>
                        </div>
                      </div>
                      
                      {(assignment.motivo || assignment.notas || assignment.gerente) && (
                        <div className="text-xs text-gray-600 space-y-1 mt-2 pt-2 border-t border-gray-200">
                          {assignment.motivo && (
                            <div><strong>Motivo:</strong> {assignment.motivo}</div>
                          )}
                          {assignment.notas && (
                            <div><strong>Notas:</strong> {assignment.notas}</div>
                          )}
                          {assignment.gerente && (
                            <div><strong>Gerente:</strong> {assignment.gerente}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
