"use client";

import { useEffect, useCallback } from 'react';

// Evento personalizado para notificar cambios en los datos
export const DATA_REFRESH_EVENTS = {
  DEPARTAMENTOS_CHANGED: 'departamentos-changed',
  EMPRESAS_CHANGED: 'empresas-changed',
  EMPLEADOS_CHANGED: 'empleados-changed',
  COMPUTADORES_CHANGED: 'computadores-changed',
  DISPOSITIVOS_CHANGED: 'dispositivos-changed',
} as const;

export type DataRefreshEvent = typeof DATA_REFRESH_EVENTS[keyof typeof DATA_REFRESH_EVENTS];

// Hook para escuchar cambios en los datos
export function useDataRefresh(eventType: DataRefreshEvent, callback: () => void) {
  useEffect(() => {
    const handleRefresh = () => {
      callback();
    };

    window.addEventListener(eventType, handleRefresh);
    
    return () => {
      window.removeEventListener(eventType, handleRefresh);
    };
  }, [eventType, callback]);
}

// Función para notificar cambios
export function notifyDataChange(eventType: DataRefreshEvent) {
  const event = new CustomEvent(eventType);
  window.dispatchEvent(event);
}

// Hook para notificar cambios en departamentos
export function useDepartamentoRefresh() {
  return useCallback(() => {
    notifyDataChange(DATA_REFRESH_EVENTS.DEPARTAMENTOS_CHANGED);
    // También notificar cambios en empresas ya que los departamentos afectan el conteo
    notifyDataChange(DATA_REFRESH_EVENTS.EMPRESAS_CHANGED);
  }, []);
}

// Hook para notificar cambios en empresas
export function useEmpresaRefresh() {
  return useCallback(() => {
    notifyDataChange(DATA_REFRESH_EVENTS.EMPRESAS_CHANGED);
  }, []);
}

// Hook para notificar cambios en empleados
export function useEmpleadoRefresh() {
  return useCallback(() => {
    notifyDataChange(DATA_REFRESH_EVENTS.EMPLEADOS_CHANGED);
    // Los empleados pueden afectar departamentos y empresas
    notifyDataChange(DATA_REFRESH_EVENTS.DEPARTAMENTOS_CHANGED);
    notifyDataChange(DATA_REFRESH_EVENTS.EMPRESAS_CHANGED);
  }, []);
}
