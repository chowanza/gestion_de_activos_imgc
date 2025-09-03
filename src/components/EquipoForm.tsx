"use client";

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Select from 'react-select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { showToast } from "nextjs-toast-notify";
import { DispositivoFormData, dispositivoSchema } from './equipos-table'; // Importa el tipo desde la tabla

// Tipos locales para el componente
interface ModeloParaSelect {
  id: string;
  nombre: string;
}

interface OptionType {
  value: string;
  label: string;
  __isNew__?: boolean;
}

interface DispositivoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DispositivoFormData) => void;
  initialData?: DispositivoFormData | null;
  modelos: ModeloParaSelect[]; // El componente necesita recibir la lista de modelos
}

const DispositivoForm: React.FC<DispositivoFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  modelos, // Recibimos los modelos como prop
}) => {
  const isEditing = !!initialData?.id;

// En tu definición de estado inicial
const [formData, setFormData] = useState<DispositivoFormData>({
  id: undefined, // <-- Añade esto
  modeloId: '',
  serial: '',
  estado: '',
  nsap: null,
  mac: null,
  ubicacion: null,
});

  // ==================================================================
  // ESTE USEEFFECT ES LA CLAVE DE LA SOLUCIÓN
  // Se ejecuta cuando el modal se abre o cuando initialData cambia.
  // Popula el formulario con los datos para editar o lo resetea para crear.
  // ==================================================================
  useEffect(() => {
  if (isOpen) {
    if (initialData) {
      setFormData({
        id: initialData.id, // <-- LA LÍNEA MÁS IMPORTANTE QUE FALTA
        modeloId: initialData.modeloId || '',
        serial: initialData.serial || '',
        estado: initialData.estado || '',
        nsap: initialData.nsap || null,
        mac: initialData.mac || null,
        ubicacion: initialData.ubicacion || null,
      });
    } else {
      // Resetea el formulario para creación (importante incluir el 'id' como undefined)
      setFormData({
        id: undefined,
        modeloId: '',
        serial: '',
        estado: '',
        nsap: null,
        mac: null,
        ubicacion: null,
      });
    }
  }
}, [initialData, isOpen]); // Depende de initialData e isOpen

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSelectChange = (option: OptionType | null) => {
    setFormData(prev => ({ ...prev, modeloId: option?.value ?? '' }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validamos con Zod antes de enviar
    const validation = dispositivoSchema.safeParse(formData);
    if (!validation.success) {
      // Muestra el primer error encontrado
      const firstError = validation.error.errors[0].message;
      showToast.warning(firstError, { position: "top-right" });
      return;
    }

    await onSubmit(validation.data);
  };
  
  // Mapea los modelos recibidos para el componente Select
  const modeloOptions = Array.isArray(modelos) ? modelos.map(modelo => ({ value: modelo.id, label: modelo.nombre })) : [];
  const selectedModelValue = modeloOptions.find(option => option.value === formData.modeloId) || null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Dispositivo' : 'Agregar Nuevo Dispositivo'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifique los detalles del dispositivo.' : 'Complete los detalles para el nuevo dispositivo.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
          {/* Selector de Modelo */}
          <div className="grid gap-2">
            <Label htmlFor="modeloId">Modelo</Label>
            <Select
              id="modeloId"
              options={modeloOptions}
              value={selectedModelValue}
              onChange={handleSelectChange}
              placeholder="Seleccionar modelo"
              isSearchable
            />
          </div>

          {/* Serial Input */}
          <div className="grid gap-2">
            <Label htmlFor="serial">Serial</Label>
            <Input id="serial" value={formData.serial || ''} onChange={handleInputChange} placeholder="Serial del equipo" />
          </div>

          {/* Estado Select */}
          <div className="grid gap-2">
            <Label htmlFor="estado">Estado</Label>
            <select
              id="estado"
              className="w-full h-10 border rounded-md px-2 bg-background"
              value={formData.estado || ''}
              onChange={handleInputChange}
            >
              <option value="">Seleccionar estado</option>
              <option value="Resguardo">Resguardo</option>
              <option value="Asignado">Asignado</option>
              <option value="En reparación">En reparación</option>
              <option value="De baja">De baja</option>
            </select>
          </div>

          {/* Campos Opcionales */}
          <div className="grid gap-2">
            <Label htmlFor="ubicacion">Ubicación</Label>
            <Input id="ubicacion" value={formData.ubicacion || ''} onChange={handleInputChange} placeholder="Ej: Edificio 1, Oficina de Gerencia" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mac">Dirección MAC</Label>
            <Input id="mac" value={formData.mac || ''} onChange={handleInputChange} placeholder="Ej: a1:b2:c3:d4:f4:g5" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nsap">Ficha SAP (Opcional)</Label>
            <Input id="nsap" value={formData.nsap || ''} onChange={handleInputChange} placeholder="N° de Ficha SAP" />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? 'Guardar Cambios' : 'Guardar Equipo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default DispositivoForm;
