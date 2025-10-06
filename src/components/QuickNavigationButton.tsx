'use client';

import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';

interface QuickNavigationButtonProps {
  id: string;
  type: 'empresa' | 'departamento' | 'empleado' | 'ubicacion';
  className?: string;
}

export function QuickNavigationButton({ id, type, className = "" }: QuickNavigationButtonProps) {
  const router = useRouter();

  const getNavigationPath = () => {
    switch (type) {
      case 'empresa':
        return `/empresas/${id}`;
      case 'departamento':
        return `/departamentos/${id}`;
      case 'empleado':
        return `/empleados/${id}`;
      case 'ubicacion':
        return `/ubicaciones/${id}`;
      default:
        return '#';
    }
  };

  const getTooltipText = () => {
    switch (type) {
      case 'empresa':
        return 'Ver detalles de la empresa';
      case 'departamento':
        return 'Ver detalles del departamento';
      case 'empleado':
        return 'Ver detalles del empleado';
      case 'ubicacion':
        return 'Ver detalles de la ubicación';
      default:
        return 'Ver detalles';
    }
  };

  const handleNavigation = () => {
    const path = getNavigationPath();
    router.push(path);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNavigation}
            className={`h-6 w-6 p-0 hover:bg-gray-100 ${className}`}
          >
            <Eye className="h-3 w-3 text-gray-500 hover:text-gray-700" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
