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
import { Loader2, User, Building, Wrench, Shield, MapPin, CheckCircle2, Trash2 } from 'lucide-react';
import ReactSelect from 'react-select';
import { reactSelectStyles } from '@/utils/reactSelectStyles';

interface EquipmentStatusModalProps {
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
    departamento?: {
      id: string;
      nombre: string;
      empresa: { nombre: string };
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

interface Departamento {
  value: string;
  label: string;
  empresa: string;
}

interface Ubicacion {
  value: string;
  label: string;
}

const statusConfig = {
  'Asignado': {
    icon: User,
    color: 'bg-green-100 text-green-800',
    description: 'Equipo asignado a un usuario o departamento'
  },
  'Mantenimiento': {
    icon: Wrench,
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Equipo en proceso de mantenimiento'
  },
  'Resguardo': {
    icon: Shield,
    color: 'bg-blue-100 text-blue-800',
    description: 'Equipo almacenado en resguardo'
  },
  'Operativo': {
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800',
    description: 'Equipo funcionando correctamente'
  },
  'De baja': {
    icon: Trash2,
    color: 'bg-red-100 text-red-800',
    description: 'Equipo dado de baja'
  },
  'En reparación': {
    icon: Wrench,
    color: 'bg-orange-100 text-orange-800',
    description: 'Equipo en proceso de reparación'
  }
};

export default function EquipmentStatusModal({ 
  isOpen, 
  onClose, 
  equipment, 
  onStatusChange 
}: EquipmentStatusModalProps) {
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState(equipment.estado);
  const [asignarA, setAsignarA] = useState<'Usuario' | 'Departamento'>('Usuario');
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [selectedUbicacion, setSelectedUbicacion] = useState<any>(null);
  const [motivo, setMotivo] = useState('');
  const [notas, setNotas] = useState('');
  const [selectedGerente, setSelectedGerente] = useState<any>(null);
  const [selectedUbicacionAsignacion, setSelectedUbicacionAsignacion] = useState<any>(null);

  // Estados para datos
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [gerentes, setGerentes] = useState<Usuario[]>([]);

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      // Pre-seleccionar datos actuales
      if (equipment.empleado) {
        setAsignarA('Usuario');
        setSelectedTarget({
          value: equipment.empleado.id,
          label: `${equipment.empleado.nombre} ${equipment.empleado.apellido}`
        });
      } else if (equipment.departamento) {
        setAsignarA('Departamento');
        setSelectedTarget({
          value: equipment.departamento.id,
          label: equipment.departamento.nombre
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
      const [usuariosRes, departamentosRes, ubicacionesRes] = await Promise.all([
        fetch('/api/usuarios'),
        fetch('/api/departamentos'),
        fetch('/api/ubicaciones')
      ]);

      const [usuariosData, departamentosData, ubicacionesData] = await Promise.all([
        usuariosRes.json(),
        departamentosRes.json(),
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

      // Procesar departamentos
      const departamentosFormatted = departamentosData.map((dept: any) => ({
        value: dept.id,
        label: dept.nombre,
        empresa: dept.empresa?.nombre || 'N/A'
      }));

      // Procesar ubicaciones
      const ubicacionesFormatted = ubicacionesData.map((ubic: any) => ({
        value: ubic.id,
        label: ubic.nombre
      }));

      setUsuarios(usuariosFormatted);
      setDepartamentos(departamentosFormatted);
      setUbicaciones(ubicacionesFormatted);
      setGerentes(usuariosFormatted); // Los gerentes son usuarios
    } catch (error) {
      console.error('Error cargando datos:', error);
      showToast.error('Error cargando datos iniciales');
    }
  };

  // Definir opciones para los selectores
  const ubicacionOptions = ubicaciones;

  const handleSubmit = async () => {
    if (newStatus === equipment.estado) {
      showToast.warning('El estado no ha cambiado');
      return;
    }

    // Validaciones según el estado
    if (newStatus === 'Asignado' && !selectedTarget) {
      showToast.error('Debe seleccionar un usuario o departamento para asignar');
      return;
    }

    if (newStatus === 'Mantenimiento' && !motivo.trim()) {
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
        actionType: getActionType(newStatus),
        motivo: motivo || null,
        notas: notas || null,
        ubicacionId: selectedUbicacionAsignacion?.value || null,
        gerenteId: selectedGerente?.value || null,
        targetType: newStatus === 'Asignado' ? asignarA : null,
        targetEmpleadoId: newStatus === 'Asignado' && asignarA === 'Usuario' ? selectedTarget?.value : null,
        targetDepartamentoId: newStatus === 'Asignado' && asignarA === 'Departamento' ? selectedTarget?.value : null,
        serialC: equipment.serial,
        modeloC: `${equipment.modelo.marca.nombre} ${equipment.modelo.nombre}`
      };

      await onStatusChange(newStatus, assignmentData);
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
      case 'Asignado': return 'Asignación';
      case 'Mantenimiento': return 'Mantenimiento';
      case 'Resguardo': return 'Resguardo';
      default: return 'Modificación';
    }
  };

  const resetForm = () => {
    setNewStatus(equipment.estado);
    setAsignarA('Usuario');
    setSelectedTarget(null);
    setSelectedUbicacion(null);
    setMotivo('');
    setNotas('');
    setSelectedGerente(null);
    setSelectedUbicacionAsignacion(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const currentStatusConfig = statusConfig[equipment.estado as keyof typeof statusConfig] || {
    icon: Shield,
    color: 'bg-gray-100 text-gray-800',
    description: 'Estado no reconocido'
  };
  const newStatusConfig = statusConfig[newStatus as keyof typeof statusConfig];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Gestionar Estado del Equipo
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
            <CardContent>
              <RadioGroup value={newStatus} onValueChange={setNewStatus}>
                {Object.entries(statusConfig).map(([status, config]) => {
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
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Campos específicos según el estado */}
          {newStatus === 'Asignado' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Asignación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Asignar a</Label>
                  <RadioGroup value={asignarA} onValueChange={(value) => setAsignarA(value as "Departamento" | "Usuario")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Usuario" id="usuario" />
                      <Label htmlFor="usuario">Usuario</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Departamento" id="departamento" />
                      <Label htmlFor="departamento">Departamento</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>{asignarA === 'Usuario' ? 'Usuario' : 'Departamento'}</Label>
                  <ReactSelect
                    value={selectedTarget}
                    onChange={setSelectedTarget}
                    options={asignarA === 'Usuario' ? usuarios : departamentos}
                    styles={reactSelectStyles}
                    placeholder={`Seleccionar ${asignarA.toLowerCase()}`}
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

          {newStatus === 'Mantenimiento' && (
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

          {newStatus === 'Resguardo' && (
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

                <div>
                  <Label>Ubicación de Asignación</Label>
                  <ReactSelect
                    options={ubicacionOptions}
                    value={selectedUbicacionAsignacion}
                    onChange={setSelectedUbicacionAsignacion}
                    placeholder="Seleccionar ubicación específica"
                    isSearchable
                    isClearable
                    styles={reactSelectStyles}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campos comunes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Información Adicional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="gerente">Gerente responsable</Label>
                <ReactSelect
                  value={selectedGerente}
                  onChange={setSelectedGerente}
                  options={gerentes}
                  styles={reactSelectStyles}
                  placeholder="Seleccionar gerente"
                  isClearable
                />
              </div>

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
              {newStatus === equipment.estado ? 'Actualizar' : `Cambiar a ${newStatus}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
