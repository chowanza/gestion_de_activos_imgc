"use client";

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Select from 'react-select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { showToast } from "nextjs-toast-notify";
import { DispositivoFormData, dispositivoSchema } from './equipos-table'; // Importa el tipo desde la tabla
import { reactSelectStyles } from '@/utils/reactSelectStyles';

// Tipos locales para el componente
interface ModeloParaSelect {
  id: string;
  nombre: string;
  tipo: string;
  categoria?: 'COMPUTADORA' | 'DISPOSITIVO' | null;
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

interface Ubicacion {
  id: string;
  nombre: string;
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

const DispositivoForm: React.FC<DispositivoFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  modelos, // Recibimos los modelos como prop
}) => {
  const isEditing = !!initialData?.id;
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [isLoadingUbicaciones, setIsLoadingUbicaciones] = useState(false);
  
  // Estados para la lógica de asignación (ya no se usan - el estado se maneja desde "Gestionar Estado")

// En tu definición de estado inicial
const [formData, setFormData] = useState<DispositivoFormData>({
  id: undefined, // <-- Añade esto
  modeloId: '',
  serial: '',
  estado: 'OPERATIVO', // Estado por defecto
  codigoImgc: '',  // Cambio de nsap a codigoImgc - OBLIGATORIO
  mac: null,
  ip: null,
  ubicacionId: null,
  // Nuevos campos de compra
  fechaCompra: null,
  numeroFactura: null,
  proveedor: null,
  monto: null,
});

  // ==================================================================
  // ESTE USEEFFECT ES LA CLAVE DE LA SOLUCIÓN
  // Se ejecuta cuando el modal se abre o cuando initialData cambia.
  // Popula el formulario con los datos para editar o lo resetea para crear.
  // ==================================================================
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingUbicaciones(true);
      try {
        const ubicacionesRes = await fetch('/api/ubicaciones');
        const ubicacionesData = await ubicacionesRes.json();

        // Procesar ubicaciones
        setUbicaciones(ubicacionesData);
      } catch (error) {
        console.error('Error loading data:', error);
        showToast.error('Error cargando datos iniciales');
      } finally {
        setIsLoadingUbicaciones(false);
      }
    };

    if (isOpen) {
      fetchData();
      
      // Solo resetear el formulario si no hay datos iniciales (creación)
      if (!initialData) {
        setFormData({
          id: undefined,
          modeloId: '',
          serial: '',
          estado: 'OPERATIVO', // Estado por defecto
          codigoImgc: '',  // Cambio de nsap a codigoImgc - OBLIGATORIO
          mac: null,
          ip: null,
          ubicacionId: null,
          // Nuevos campos de compra
          fechaCompra: null,
          numeroFactura: null,
          proveedor: null,
          monto: null,
        });
      } else {
        // El estado y asignación se manejan desde "Gestionar Estado"
      }
    }
  }, [initialData, isOpen]); // Depende de initialData e isOpen

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const newValue = e.target.value;
    const fieldId = e.target.id;
    
    // Debug: mostrar cambios de estado
    if (fieldId === 'estado') {
      console.log('Estado cambiado a:', newValue);
    }
    
    setFormData(prev => ({ ...prev, [fieldId]: newValue }));
  };

  const handleSelectChange = (option: OptionType | null) => {
    setFormData(prev => ({ ...prev, modeloId: option?.value ?? '' }));
  };

  const handleUbicacionChange = (option: OptionType | null) => {
    setFormData(prev => ({ ...prev, ubicacionId: option?.value ?? '' }));
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

    // El estado del dispositivo se maneja desde "Gestionar Estado" en los detalles

    try {
      await onSubmit(validation.data);
    } catch (error) {
      console.error('Error en el formulario:', error);
    }
  };
  
  // Filtrar solo modelos de la categoría DISPOSITIVO (incluye tipos dinámicos). Si el backend no envía 'categoria', mostramos todos para compatibilidad.
  const modelosDispositivos = Array.isArray(modelos)
    ? modelos.filter(modelo => modelo.categoria === 'DISPOSITIVO' || !modelo.categoria)
    : [];

  // Mapea los modelos recibidos para el componente Select
  const modeloOptions = modelosDispositivos.map(modelo => ({ value: modelo.id, label: modelo.nombre }));
  const ubicacionOptions = ubicaciones.map(ubicacion => ({ value: ubicacion.id, label: ubicacion.nombre }));
  const selectedModelValue = modeloOptions.find(option => option.value === formData.modeloId) || null;
  const selectedUbicacionValue = ubicacionOptions.find(option => option.value === formData.ubicacionId) || null;
  
  // El estado del dispositivo se maneja desde "Gestionar Estado" en los detalles

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Dispositivo' : 'Agregar Nuevo Dispositivo'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifique los detalles del dispositivo.' : 'Complete los detalles para el nuevo dispositivo.'}
          </DialogDescription>
        </DialogHeader>
        
        {/* Contenido scrollable del formulario */}
        <div className="flex-1 overflow-y-auto pr-2">
          <form id="dispositivo-form" onSubmit={handleSubmit} className="grid gap-4 py-4">
          
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

          {/* Nota informativa sobre el estado del dispositivo */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-800 font-medium">
                ℹ️ Estado del Dispositivo
              </span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              El estado del dispositivo se gestiona desde la opción <strong>"Gestionar Estado"</strong> en la pantalla de detalles del dispositivo.
            </p>
          </div>



          {/* Campos Opcionales */}
          <div className="grid gap-2">
            <Label htmlFor="ubicacionId">Ubicación</Label>
            <Select
              id="ubicacionId"
              options={ubicacionOptions}
              value={selectedUbicacionValue}
              onChange={handleUbicacionChange}
              placeholder="Seleccionar ubicación"
              isSearchable
              isLoading={isLoadingUbicaciones}
              isClearable
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mac">Dirección MAC</Label>
            <Input id="mac" value={formData.mac || ''} onChange={handleInputChange} placeholder="Ej: a1:b2:c3:d4:f4:g5" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ip">Dirección IP</Label>
            <Input id="ip" value={(formData as any).ip || ''} onChange={handleInputChange} placeholder="Ej: 192.168.1.10" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="codigoImgc">Código IMGC <span className="text-destructive">*</span></Label>
            <Input id="codigoImgc" value={formData.codigoImgc || ''} onChange={handleInputChange} placeholder="Código IMGC" required />
          </div>

          {/* Información de Compra */}
          <div className="grid gap-4">
            <h4 className="text-sm font-medium text-muted-foreground">Información de Compra</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fechaCompra">Fecha de Compra</Label>
                <Input 
                  id="fechaCompra" 
                  type="date"
                  value={formData.fechaCompra || ''} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="numeroFactura">Número de Factura</Label>
                <Input 
                  id="numeroFactura" 
                  value={formData.numeroFactura || ''} 
                  onChange={handleInputChange} 
                  placeholder="Número de factura"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="proveedor">Proveedor</Label>
                <Input 
                  id="proveedor" 
                  value={formData.proveedor || ''} 
                  onChange={handleInputChange} 
                  placeholder="A quién fue comprado"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="monto">Monto</Label>
                <Input 
                  id="monto" 
                  type="number"
                  step="0.01"
                  value={formData.monto || ''} 
                  onChange={handleInputChange} 
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </form>
        </div>
        
        {/* Footer fijo fuera del área scrollable */}
        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="dispositivo-form" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            {isEditing ? 'Guardar Cambios' : 'Guardar Equipo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DispositivoForm;
