"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "nextjs-toast-notify";
import { Monitor, Smartphone, Plus } from "lucide-react";

interface Equipo {
  id: string;
  serial: string;
  modelo: {
    nombre: string;
    marca: {
      nombre: string;
    };
  };
  estado: string;
  codigoImgc: string;
}

interface AsignarEquipoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (equipoId: string, motivo: string) => Promise<void>;
  empleadoId: string;
  tipoEquipo: 'computador' | 'dispositivo';
  equiposDisponibles: Equipo[];
}

export default function AsignarEquipoModal({
  isOpen,
  onClose,
  onConfirm,
  empleadoId,
  tipoEquipo,
  equiposDisponibles,
}: AsignarEquipoModalProps) {
  const [equipoId, setEquipoId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!equipoId) {
      showToast.error("Por favor selecciona un equipo.");
      return;
    }

    if (!motivo.trim()) {
      showToast.error("Por favor ingresa un motivo para la asignación.");
      return;
    }

    try {
      setLoading(true);
      await onConfirm(equipoId, motivo);
      onClose();
      setEquipoId("");
      setMotivo("");
    } catch (error) {
      console.error('Error al asignar equipo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setEquipoId("");
    setMotivo("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {tipoEquipo === 'computador' ? (
              <Monitor className="h-5 w-5 mr-2 text-blue-500" />
            ) : (
              <Smartphone className="h-5 w-5 mr-2 text-green-500" />
            )}
            Asignar {tipoEquipo === 'computador' ? 'Computador' : 'Dispositivo'}
          </DialogTitle>
          <DialogDescription>
            Selecciona un {tipoEquipo === 'computador' ? 'computador' : 'dispositivo'} disponible para asignar a este empleado.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="equipo">
              {tipoEquipo === 'computador' ? 'Computador' : 'Dispositivo'} Disponible
            </Label>
            <Select value={equipoId} onValueChange={setEquipoId}>
              <SelectTrigger>
                <SelectValue placeholder={`Selecciona un ${tipoEquipo === 'computador' ? 'computador' : 'dispositivo'}...`} />
              </SelectTrigger>
              <SelectContent>
                {equiposDisponibles.map((equipo) => (
                  <SelectItem key={equipo.id} value={equipo.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {equipo.modelo.marca.nombre} {equipo.modelo.nombre}
                      </span>
                      <span className="text-sm text-gray-500">
                        Serial: {equipo.serial} | Código: {equipo.codigoImgc}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="motivo">Motivo de Asignación</Label>
            <Textarea
              id="motivo"
              placeholder="Describe el motivo de la asignación..."
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
            disabled={loading || !equipoId || !motivo.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Asignando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Asignar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
