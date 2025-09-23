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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, UserCheck, UserX } from "lucide-react";
import { showToast } from "nextjs-toast-notify";

interface EmpleadoStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (fecha: string, accion: 'activar' | 'desactivar') => Promise<void>;
  empleado: {
    nombre: string;
    apellido: string;
    fechaDesincorporacion?: string;
  };
}

export default function EmpleadoStatusModal({
  isOpen,
  onClose,
  onConfirm,
  empleado
}: EmpleadoStatusModalProps) {
  const [fecha, setFecha] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isActivo = !empleado.fechaDesincorporacion;
  const accion = isActivo ? 'desactivar' : 'activar';
  const titulo = isActivo ? 'Desactivar Empleado' : 'Reactivar Empleado';
  const descripcion = isActivo 
    ? 'Ingresa la fecha de desincorporación del empleado'
    : 'Ingresa la fecha de reactivación del empleado';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fecha) {
      showToast.error("Por favor ingresa una fecha");
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(fecha, accion);
      setFecha("");
      onClose();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFecha("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isActivo ? (
              <UserX className="h-5 w-5 text-red-500" />
            ) : (
              <UserCheck className="h-5 w-5 text-green-500" />
            )}
            {titulo}
          </DialogTitle>
          <DialogDescription>
            {descripcion}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fecha" className="text-sm font-medium">
                {isActivo ? 'Fecha de Desincorporación' : 'Fecha de Reactivación'}
              </Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <Input
                  id="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="flex-1"
                  required
                />
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Empleado:</strong> {empleado.nombre} {empleado.apellido}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Estado actual:</strong> 
                <span className={`ml-1 font-semibold ${isActivo ? 'text-green-600' : 'text-red-600'}`}>
                  {isActivo ? 'Activo' : 'Inactivo'}
                </span>
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant={isActivo ? "destructive" : "default"}
              disabled={isLoading}
              className={isActivo ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            >
              {isLoading ? "Procesando..." : accion === 'desactivar' ? 'Desactivar' : 'Reactivar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
