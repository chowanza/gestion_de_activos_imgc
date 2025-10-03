'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, X, ArrowUpDown } from 'lucide-react';

interface TimelineFiltersProps {
  onFiltersChange: (filters: TimelineFilters) => void;
  initialFilters?: Partial<TimelineFilters>;
}

export interface TimelineFilters {
  orden: 'asc' | 'desc';
}


export function TimelineFilters({ onFiltersChange, initialFilters }: TimelineFiltersProps) {
  const [filters, setFilters] = useState<TimelineFilters>({
    orden: initialFilters?.orden || 'desc',
  });

  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof TimelineFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters: TimelineFilters = {
      orden: 'desc',
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters = false; // Solo tenemos ordenamiento, no filtros activos

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros de Historial
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                Filtros activos
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {showFilters && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 gap-4">
            {/* Filtro de Ordenamiento */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                <ArrowUpDown className="h-3 w-3" />
                Ordenamiento
              </label>
              <Select
                value={filters.orden}
                onValueChange={(value: 'asc' | 'desc') => handleFilterChange('orden', value)}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Más reciente primero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-3 w-3" />
                      Más reciente primero
                    </div>
                  </SelectItem>
                  <SelectItem value="asc">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-3 w-3 rotate-180" />
                      Más antiguo primero
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>


          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500">
                {hasActiveFilters ? (
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Filtros aplicados
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    Sin filtros activos
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 px-3 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpiar Filtros
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

