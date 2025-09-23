"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "nextjs-toast-notify";
import { 
  CheckCircle, 
  XCircle, 
  Shield, 
  User, 
  Wrench 
} from "lucide-react";

interface CambiarEstadoEquipoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (nuevoEstado: string, motivo: string) => Promise<void>;
  equipo: {
    id: string;
    serial: string;
    tipo: 'computador' | 'dispositivo';
    estadoActual: string;
    modelo?: {
      nombre: string;
      marca: {
        nombre: string;
      };
    };
  };
}

export default function CambiarEstadoEquipoModal({
  isOpen,
  onClose,
  onConfirm,
  equipo,
}: CambiarEstadoEquipoModalProps) {
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);

  const estadosDisponibles = [
    {
      value: 'OPERATIVO',
      label: 'Operativo',
      description: 'Equipo disponible para asignar',
      icon: CheckCircle,
      color: 'text-green-600',
      disabled: equipo.estadoActual === 'OPERATIVO'
    },
    {
      value: 'DE_BAJA',
      label: 'De Baja',
      description: 'Equipo dado de baja',
      icon: XCircle,
      color: 'text-red-600',
      disabled: equipo.estadoActual === 'DE_BAJA'
    },
    {
      value: 'EN_RESGUARDO',
      label: 'En Resguardo',
      description: 'Equipo en resguardo',
      icon: Shield,
      color: 'text-yellow-600',
      disabled: equipo.estadoActual === 'EN_RESGUARDO'
    },
    {
      value: 'ASIGNADO',
      label: 'Asignado',
      description: 'Equipo asignado a empleado',
      icon: User,
      color: 'text-blue-600',
      disabled: equipo.estadoActual === 'ASIGNADO'
    },
    {
      value: 'EN_MANTENIMIENTO',
      label: 'En Mantenimiento',
      description: 'Equipo en mantenimiento',
      icon: Wrench,
      color: 'text-orange-600',
      disabled: equipo.estadoActual === 'EN_MANTENIMIENTO'
    }
  ];

  const handleConfirm = async () => {
    if (!nuevoEstado) {
      showToast.error("Por favor selecciona un nuevo estado.");
      return;
    }

    if (!motivo.trim()) {
      showToast.error("Por favor ingresa un motivo para el cambio de estado.");
      return;
    }

    try {
      setLoading(true);
      await onConfirm(nuevoEstado, motivo);
      onClose();
      setNuevoEstado("");
      setMotivo("");
    } catch (error) {
      console.error('Error al cambiar estado del equipo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setNuevoEstado("");
    setMotivo("");
  };

  const getEstadoActualInfo = () => {
    const estado = estadosDisponibles.find(e => e.value === equipo.estadoActual);
    return estado || { label: 'Desconocido', description: 'Estado no reconocido' };
  };

  const estadoActualInfo = getEstadoActualInfo();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Wrench className="h-5 w-5 mr-2 text-orange-500" />
            Cambiar Estado del {equipo.tipo === 'computador' ? 'Computador' : 'Dispositivo'}
          </DialogTitle>
          <DialogDescription>
            <div className="mt-2">
              <p><strong>Equipo:</strong> {equipo.modelo?.marca.nombre} {equipo.modelo?.nombre}</p>
              <p><strong>Serial:</strong> {equipo.serial}</p>
              <p><strong>Estado actual:</strong> {estadoActualInfo.label}</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nuevoEstado">Nuevo Estado</Label>
            <Select value={nuevoEstado} onValueChange={setNuevoEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el nuevo estado..." />
              </SelectTrigger>
              <SelectContent>
                {estadosDisponibles.map((estado) => {
                  const Icon = estado.icon;
                  return (
                    <SelectItem 
                      key={estado.value} 
                      value={estado.value}
                      disabled={estado.disabled}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${estado.color}`} />
                        <div>
                          <div className="font-medium">{estado.label}</div>
                          <div className="text-sm text-gray-500">{estado.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="motivo">Motivo del Cambio</Label>
            <Textarea
              id="motivo"
              placeholder="Describe el motivo del cambio de estado..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading || !nuevoEstado || !motivo.trim()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Cambiando...
              </>
            ) : (
              <>
                <Wrench className="h-4 w-4 mr-2" />
                Cambiar Estado
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
