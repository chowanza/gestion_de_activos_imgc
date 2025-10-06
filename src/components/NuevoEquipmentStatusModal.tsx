"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { showToast } from 'nextjs-toast-notify';
import { Loader2, User, Wrench, Shield, MapPin, CheckCircle2, Trash2, AlertCircle } from 'lucide-react';
import ReactSelect from 'react-select';
import { reactSelectStyles } from '@/utils/reactSelectStyles';
import { ESTADOS_EQUIPO, requiereEmpleado, permiteAsignacion } from '@/lib/estados-equipo';

interface NuevoEquipmentStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: {
    id: string;
    serial: string;
    estado: string;
    tipo: 'Computador' | 'Dispositivo';
    modelo: {
      marca: { nombre: string };
      nombre: string;
    };
    empleado?: {
      id: string;
      nombre: string;
      apellido: string;
      departamento: {
        nombre: string;
        empresa: { nombre: string };
      };
    };
    ubicacion?: {
      id: string;
      nombre: string;
    };
  };
  onStatusChange: (newStatus: string, data: any) => void;
}

interface Usuario {
  value: string;
  label: string;
  cargo: string;
  departamento: string;
  empresa: string;
}


interface Ubicacion {
  value: string;
  label: string;
}

const statusConfig = {
  [ESTADOS_EQUIPO.OPERATIVO]: {
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800',
    description: 'Equipo disponible para asignar',
    categoria: 'No Asignado'
  },
  [ESTADOS_EQUIPO.DE_BAJA]: {
    icon: Trash2,
    color: 'bg-red-100 text-red-800',
    description: 'Equipo dado de baja',
    categoria: 'No Asignado'
  },
  [ESTADOS_EQUIPO.EN_RESGUARDO]: {
    icon: Shield,
    color: 'bg-blue-100 text-blue-800',
    description: 'Equipo en resguardo',
    categoria: 'No Asignado'
  },
  [ESTADOS_EQUIPO.EN_MANTENIMIENTO]: {
    icon: Wrench,
    color: 'bg-orange-100 text-orange-800',
    description: 'Equipo en mantenimiento',
    categoria: 'No Asignado'
  },
  [ESTADOS_EQUIPO.ASIGNADO]: {
    icon: User,
    color: 'bg-blue-100 text-blue-800',
    description: 'Equipo asignado a empleado',
    categoria: 'Asignado'
  }
};

export default function NuevoEquipmentStatusModal({ 
  isOpen, 
  onClose, 
  equipment, 
  onStatusChange 
}: NuevoEquipmentStatusModalProps) {
  const [loading, setLoading] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState(equipment.estado);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [selectedUbicacion, setSelectedUbicacion] = useState<any>(null);
  const [motivo, setMotivo] = useState('');
  const [notas, setNotas] = useState('');

  // Estados para datos
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      // Pre-seleccionar datos actuales
      if (equipment.empleado) {
        setSelectedTarget({
          value: equipment.empleado.id,
          label: `${equipment.empleado.nombre} ${equipment.empleado.apellido}`
        });
      }
      if (equipment.ubicacion) {
        setSelectedUbicacion({
          value: equipment.ubicacion.id,
          label: equipment.ubicacion.nombre
        });
      }
    }
  }, [isOpen, equipment]);

  const loadInitialData = async () => {
    try {
      const [usuariosRes, ubicacionesRes] = await Promise.all([
        fetch('/api/usuarios'),
        fetch('/api/ubicaciones')
      ]);

      const [usuariosData, ubicacionesData] = await Promise.all([
        usuariosRes.json(),
        ubicacionesRes.json()
      ]);

      // Procesar usuarios
      const usuariosFormatted = usuariosData.map((user: any) => ({
        value: user.id,
        label: `${user.nombre} ${user.apellido}`,
        cargo: user.cargo?.nombre || 'N/A',
        departamento: user.departamento?.nombre || 'N/A',
        empresa: user.empresa?.nombre || 'N/A'
      }));

      // Procesar ubicaciones
      const ubicacionesFormatted = ubicacionesData.map((ubic: any) => ({
        value: ubic.id,
        label: ubic.nombre
      }));

      setUsuarios(usuariosFormatted);
      setUbicaciones(ubicacionesFormatted);
    } catch (error) {
      console.error('Error cargando datos:', error);
      showToast.error('Error cargando datos iniciales');
    }
  };

  const handleSubmit = async () => {
    if (nuevoEstado === equipment.estado) {
      showToast.warning('El estado no ha cambiado');
      return;
    }

    // Validaciones según el estado
    if (nuevoEstado === ESTADOS_EQUIPO.ASIGNADO && !selectedTarget) {
      showToast.error('Debe seleccionar un usuario para asignar');
      return;
    }

    if (nuevoEstado === ESTADOS_EQUIPO.EN_MANTENIMIENTO && !motivo.trim()) {
      showToast.error('Debe especificar el motivo del mantenimiento');
      return;
    }

    if (!selectedUbicacion) {
      showToast.error('Debe seleccionar una ubicación');
      return;
    }

    setLoading(true);

    try {
      const assignmentData = {
        actionType: getActionType(nuevoEstado),
        motivo: motivo || null,
        notas: notas || null,
        ubicacionId: selectedUbicacion?.value || null,
        targetType: nuevoEstado === ESTADOS_EQUIPO.ASIGNADO ? 'Usuario' : null,
        targetEmpleadoId: nuevoEstado === ESTADOS_EQUIPO.ASIGNADO ? selectedTarget?.value : null,
        serialC: equipment.serial,
        modeloC: `${equipment.modelo.marca.nombre} ${equipment.modelo.nombre}`
      };

      await onStatusChange(nuevoEstado, assignmentData);
      onClose();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      showToast.error('Error actualizando el estado del equipo');
    } finally {
      setLoading(false);
    }
  };

  const getActionType = (status: string) => {
    switch (status) {
      case ESTADOS_EQUIPO.ASIGNADO: return 'Asignación';
      case ESTADOS_EQUIPO.EN_MANTENIMIENTO: return 'Mantenimiento';
      case ESTADOS_EQUIPO.EN_RESGUARDO: return 'Resguardo';
      case ESTADOS_EQUIPO.DE_BAJA: return 'Baja';
      case ESTADOS_EQUIPO.OPERATIVO: return 'Operativo';
      default: return 'Modificación';
    }
  };

  const resetForm = () => {
    setNuevoEstado(equipment.estado);
    setSelectedTarget(null);
    setSelectedUbicacion(null);
    setMotivo('');
    setNotas('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const currentStatusConfig = statusConfig[equipment.estado as keyof typeof statusConfig] || {
    icon: AlertCircle,
    color: 'bg-gray-100 text-gray-800',
    description: 'Estado no reconocido',
    categoria: 'Desconocido'
  };

  // Agrupar estados por categoría y aplicar lógica de negocio
  const isEquipoAsignado = equipment.estado === ESTADOS_EQUIPO.ASIGNADO;
  const isEquipoEnMantenimiento = equipment.estado === ESTADOS_EQUIPO.EN_MANTENIMIENTO;
  
  // Si el equipo está asignado, solo puede cambiar a estados no asignados (desasignación)
  // EN_MANTENIMIENTO puede cambiar libremente
  // Si el equipo no está asignado, puede cambiar a cualquier estado
  const estadosNoAsignados = Object.entries(statusConfig).filter(([_, config]) => 
    config.categoria === 'No Asignado'
  );
  
  const estadosAsignados = Object.entries(statusConfig).filter(([_, config]) => 
    config.categoria === 'Asignado' && !isEquipoAsignado // Solo mostrar si no está asignado
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Gestionar Estado del {equipment.tipo}
          </DialogTitle>
          <DialogDescription>
            {equipment.modelo.marca.nombre} {equipment.modelo.nombre} (S/N: {equipment.serial})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estado actual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Estado Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge className={currentStatusConfig.color}>
                  {equipment.estado}
                </Badge>
                <span className="text-sm text-gray-600">
                  {currentStatusConfig.description}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Nuevo estado */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Nuevo Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nota informativa para equipos asignados */}
              {isEquipoAsignado && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800 font-medium">
                      Equipo Asignado
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Para cambiar a un estado asignado, primero debe desasignar el equipo seleccionando un estado no asignado.
                  </p>
                </div>
              )}
              
              {/* Nota informativa para equipos en mantenimiento */}
              {isEquipoEnMantenimiento && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-orange-800 font-medium">
                      Equipo en Mantenimiento
                    </span>
                  </div>
                  <p className="text-sm text-orange-700 mt-1">
                    Este equipo está en mantenimiento. Puede cambiar libremente a cualquier estado disponible.
                  </p>
                </div>
              )}
              
              <RadioGroup value={nuevoEstado} onValueChange={setNuevoEstado}>
                {/* Estados No Asignados */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Estados No Asignados</Label>
                  {estadosNoAsignados.map(([status, config]) => {
                    const Icon = config.icon;
                    return (
                      <div key={status} className="flex items-center space-x-2">
                        <RadioGroupItem value={status} id={status} />
                        <Label htmlFor={status} className="flex items-center gap-2 cursor-pointer">
                          <Icon className="h-4 w-4" />
                          <Badge className={config.color}>
                            {status}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {config.description}
                          </span>
                        </Label>
                      </div>
                    );
                  })}
                </div>

                {/* Estados Asignados */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Estados Asignados</Label>
                  {estadosAsignados.map(([status, config]) => {
                    const Icon = config.icon;
                    return (
                      <div key={status} className="flex items-center space-x-2">
                        <RadioGroupItem value={status} id={status} />
                        <Label htmlFor={status} className="flex items-center gap-2 cursor-pointer">
                          <Icon className="h-4 w-4" />
                          <Badge className={config.color}>
                            {status}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {config.description}
                          </span>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Campos específicos según el estado */}
          {nuevoEstado === ESTADOS_EQUIPO.ASIGNADO && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Asignación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Usuario</Label>
                  <ReactSelect
                    value={selectedTarget}
                    onChange={setSelectedTarget}
                    options={usuarios}
                    styles={reactSelectStyles}
                    placeholder="Seleccionar usuario"
                    isClearable
                  />
                </div>

                <div>
                  <Label>Ubicación</Label>
                  <ReactSelect
                    value={selectedUbicacion}
                    onChange={setSelectedUbicacion}
                    options={ubicaciones}
                    styles={reactSelectStyles}
                    placeholder="Seleccionar ubicación"
                    isClearable
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {nuevoEstado === ESTADOS_EQUIPO.EN_MANTENIMIENTO && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Mantenimiento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="motivo">Motivo del mantenimiento *</Label>
                  <Input
                    id="motivo"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ej: Reparación de pantalla, actualización de software..."
                  />
                </div>

                <div>
                  <Label>Ubicación</Label>
                  <ReactSelect
                    value={selectedUbicacion}
                    onChange={setSelectedUbicacion}
                    options={ubicaciones}
                    styles={reactSelectStyles}
                    placeholder="Seleccionar ubicación"
                    isClearable
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {nuevoEstado === ESTADOS_EQUIPO.EN_RESGUARDO && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Resguardo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Ubicación de resguardo *</Label>
                  <ReactSelect
                    value={selectedUbicacion}
                    onChange={setSelectedUbicacion}
                    options={ubicaciones}
                    styles={reactSelectStyles}
                    placeholder="Seleccionar ubicación de resguardo"
                    isClearable
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {nuevoEstado === ESTADOS_EQUIPO.DE_BAJA && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Dar de Baja</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="motivo">Motivo de la baja *</Label>
                  <Input
                    id="motivo"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ej: Equipo obsoleto, daño irreparable..."
                  />
                </div>

                <div>
                  <Label>Ubicación</Label>
                  <ReactSelect
                    value={selectedUbicacion}
                    onChange={setSelectedUbicacion}
                    options={ubicaciones}
                    styles={reactSelectStyles}
                    placeholder="Seleccionar ubicación"
                    isClearable
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {nuevoEstado === ESTADOS_EQUIPO.OPERATIVO && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Estado Operativo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="motivo">Motivo del cambio (opcional)</Label>
                  <Input
                    id="motivo"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ej: Equipo reparado, nuevo equipo..."
                  />
                </div>

                <div>
                  <Label>Ubicación</Label>
                  <ReactSelect
                    value={selectedUbicacion}
                    onChange={setSelectedUbicacion}
                    options={ubicaciones}
                    styles={reactSelectStyles}
                    placeholder="Seleccionar ubicación"
                    isClearable
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campo de notas común */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Información Adicional</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Información adicional sobre el cambio de estado..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {nuevoEstado === equipment.estado ? 'Actualizar' : `Cambiar a ${nuevoEstado}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
