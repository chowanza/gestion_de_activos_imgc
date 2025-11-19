import { useState, useEffect, useCallback, useMemo } from 'react';
import { TimelineFilters } from '@/components/TimelineFilters';

interface UseTimelineFiltersProps {
  itemId: string;
  itemType: 'computador' | 'dispositivo';
  onDataChange?: (data: any) => void;
  initialHistorial?: any[]; // Historial inicial del equipo
  equipo?: any; // Datos del equipo para crear entrada de creación
}

export function useTimelineFilters({ itemId, itemType, onDataChange, initialHistorial = [], equipo }: UseTimelineFiltersProps) {
  const [filters, setFilters] = useState<TimelineFilters>({
    orden: 'desc',
  });

  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Crear entrada de creación del equipo (memoizada)
  const creacionEntry = useMemo(() => {
    if (!equipo) return null;
    return {
      id: 'creacion',
      tipo: 'creacion' as const,
      fecha: equipo.fechaCompra || new Date().toISOString(),
      detalle: {}
    };
  }, [equipo?.fechaCompra]);

  const applyFilters = useCallback((currentFilters: TimelineFilters, historialData: any[], creacionEntry?: any) => {
    if (!historialData || historialData.length === 0) {
      return creacionEntry ? [creacionEntry] : [];
    }

    // Verificar si ya existe un evento de creación real en el historial
    const hasRealCreation = historialData.some(item => 
      item.tipo === 'asignacion' && 
      (item.detalle?.actionType === 'CREACION' || item.detalle?.actionType === 'Creation')
    );

    // Combinar historial con entrada de creación si existe y no hay una real
    let filteredData = (creacionEntry && !hasRealCreation)
      ? [creacionEntry, ...historialData]
      : [...historialData];
    
    // Aplicar ordenamiento
    filteredData.sort((a: any, b: any) => {
      const fechaA = new Date(a.fecha).getTime();
      const fechaB = new Date(b.fecha).getTime();
      return currentFilters.orden === 'asc' ? fechaA - fechaB : fechaB - fechaA;
    });
    
    return filteredData;
  }, []);

  const handleFiltersChange = useCallback((newFilters: TimelineFilters) => {
    setFilters(newFilters);
    const filteredData = applyFilters(newFilters, initialHistorial, creacionEntry);
    setHistorial(filteredData);
    
    if (onDataChange) {
      onDataChange({ historial: filteredData, total: filteredData.length });
    }
  }, [applyFilters, initialHistorial, creacionEntry]);

  // Aplicar filtros iniciales cuando cambien los datos iniciales
  useEffect(() => {
    // Solo procesar si tenemos datos iniciales o equipo
    if (initialHistorial.length > 0 || equipo) {
      const filteredData = applyFilters(filters, initialHistorial, creacionEntry);
      setHistorial(filteredData);
    }
  }, [applyFilters, filters, initialHistorial, creacionEntry, equipo]);

  return {
    filters,
    historial,
    loading,
    error,
    handleFiltersChange,
    refetch: () => {
      const filteredData = applyFilters(filters, initialHistorial, creacionEntry);
      setHistorial(filteredData);
    },
  };
}

