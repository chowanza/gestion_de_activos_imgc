"use client";

import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  Shield, 
  User, 
  Wrench,
  AlertCircle
} from "lucide-react";

interface EstadoEquipoBadgeProps {
  estado: 'OPERATIVO' | 'DE_BAJA' | 'EN_RESGUARDO' | 'EN_MANTENIMIENTO' | 'ASIGNADO';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function EstadoEquipoBadge({ 
  estado, 
  showIcon = true, 
  size = 'md' 
}: EstadoEquipoBadgeProps) {
  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case 'OPERATIVO':
        return {
          label: 'Operativo',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          description: 'Equipo disponible para asignar'
        };
      case 'DE_BAJA':
        return {
          label: 'De Baja',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircle,
          description: 'Equipo dado de baja'
        };
      case 'EN_RESGUARDO':
        return {
          label: 'En Resguardo',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Shield,
          description: 'Equipo en resguardo'
        };
      case 'ASIGNADO':
        return {
          label: 'Asignado',
          variant: 'default' as const,
          className: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: User,
          description: 'Equipo asignado a empleado'
        };
      case 'EN_MANTENIMIENTO':
        return {
          label: 'En Mantenimiento',
          variant: 'outline' as const,
          className: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: Wrench,
          description: 'Equipo en mantenimiento'
        };
      default:
        return {
          label: 'Desconocido',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: AlertCircle,
          description: 'Estado desconocido'
        };
    }
  };

  const config = getEstadoConfig(estado);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${sizeClasses[size]} flex items-center gap-1`}
      title={config.description}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
