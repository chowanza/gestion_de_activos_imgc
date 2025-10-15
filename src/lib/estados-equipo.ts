// --- CONSTANTES DE ESTADO DE EQUIPOS ---

export const ESTADOS_EQUIPO = {
  // Estados cuando NO está asignado
  OPERATIVO: 'OPERATIVO',
  DE_BAJA: 'DE_BAJA',
  EN_RESGUARDO: 'EN_RESGUARDO',
  EN_MANTENIMIENTO: 'EN_MANTENIMIENTO',
  
  // Estados cuando SÍ está asignado
  ASIGNADO: 'ASIGNADO'
} as const;

export type EstadoEquipo = typeof ESTADOS_EQUIPO[keyof typeof ESTADOS_EQUIPO];

// Estados disponibles para equipos no asignados
export const ESTADOS_NO_ASIGNADOS = [
  ESTADOS_EQUIPO.OPERATIVO,
  ESTADOS_EQUIPO.DE_BAJA,
  ESTADOS_EQUIPO.EN_RESGUARDO
] as const;

// Estados disponibles para equipos asignados
export const ESTADOS_ASIGNADOS = [
  ESTADOS_EQUIPO.ASIGNADO
] as const;

// Estados que pueden existir tanto asignados como no asignados
export const ESTADOS_NEUTROS = [
  ESTADOS_EQUIPO.EN_MANTENIMIENTO
] as const;

// Todos los estados válidos
export const TODOS_ESTADOS = [
  ...ESTADOS_NO_ASIGNADOS,
  ...ESTADOS_ASIGNADOS,
  ...ESTADOS_NEUTROS
] as const;

// Función para validar si un estado es válido
export function esEstadoValido(estado: string): estado is EstadoEquipo {
  return TODOS_ESTADOS.includes(estado as EstadoEquipo);
}

// Función para verificar si un estado requiere empleado asignado
export function requiereEmpleado(estado: EstadoEquipo): boolean {
  return estado === ESTADOS_EQUIPO.ASIGNADO;
}

// Función para verificar si un estado permite asignación
export function permiteAsignacion(estado: EstadoEquipo): boolean {
  return ([ESTADOS_EQUIPO.OPERATIVO, ESTADOS_EQUIPO.EN_MANTENIMIENTO] as EstadoEquipo[]).includes(estado);
}

// Función para verificar si un estado es neutro (puede existir con o sin empleado)
export function esEstadoNeutro(estado: EstadoEquipo): boolean {
  return (ESTADOS_NEUTROS as readonly EstadoEquipo[]).includes(estado);
}

// Función para validar consistencia entre estado y asignación
export function validarConsistenciaEstado(estado: string, tieneEmpleado: boolean): boolean {
  const estadoEnum = estado as EstadoEquipo;
  
  // Estados neutros (como EN_MANTENIMIENTO) pueden existir con o sin empleado
  if (esEstadoNeutro(estadoEnum)) {
    return true;
  }
  
  // Si tiene empleado asignado, debe estar en estado ASIGNADO
  if (tieneEmpleado && estadoEnum !== ESTADOS_EQUIPO.ASIGNADO) {
    return false;
  }
  
  // Si está en estado ASIGNADO, debe tener empleado
  if (estadoEnum === ESTADOS_EQUIPO.ASIGNADO && !tieneEmpleado) {
    return false;
  }
  
  return true;
}

// Función para obtener el estado correcto basado en la asignación
export function obtenerEstadoCorrecto(estadoActual: string, tieneEmpleado: boolean): EstadoEquipo {
  const estadoEnum = estadoActual as EstadoEquipo;
  
  // Estados neutros no necesitan corrección
  if (esEstadoNeutro(estadoEnum)) {
    return estadoEnum;
  }
  
  // Si tiene empleado y no está en estado ASIGNADO, corregir a ASIGNADO
  if (tieneEmpleado && estadoEnum !== ESTADOS_EQUIPO.ASIGNADO) {
    return ESTADOS_EQUIPO.ASIGNADO;
  }
  
  // Si no tiene empleado y está en estado ASIGNADO, corregir a OPERATIVO
  if (!tieneEmpleado && estadoEnum === ESTADOS_EQUIPO.ASIGNADO) {
    return ESTADOS_EQUIPO.OPERATIVO;
  }
  
  return estadoEnum;
}
