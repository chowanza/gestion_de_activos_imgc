"use client";

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  
  // Estados para la lógica de asignación
  const [asignarA, setAsignarA] = useState<'Usuario' | 'Departamento'>('Usuario');
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [motivo, setMotivo] = useState('');
  const [notas, setNotas] = useState('');
  const [selectedGerente, setSelectedGerente] = useState<any>(null);
  const [selectedUbicacionAsignacion, setSelectedUbicacionAsignacion] = useState<any>(null);

// En tu definición de estado inicial
const [formData, setFormData] = useState<DispositivoFormData>({
  id: undefined, // <-- Añade esto
  modeloId: '',
  serial: '',
  estado: '',
  codigoImgc: '',  // Cambio de nsap a codigoImgc - OBLIGATORIO
  mac: null,
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
        const [ubicacionesRes, usuariosRes, departamentosRes] = await Promise.all([
          fetch('/api/ubicaciones'),
          fetch('/api/usuarios'),
          fetch('/api/departamentos')
        ]);

        const [ubicacionesData, usuariosData, departamentosData] = await Promise.all([
          ubicacionesRes.json(),
          usuariosRes.json(),
          departamentosRes.json()
        ]);

        // Procesar ubicaciones
        setUbicaciones(ubicacionesData);

        // Procesar usuarios
        const usuariosFormatted = usuariosData.map((user: any) => ({
          value: user.id,
          label: `${user.nombre} ${user.apellido}`,
          cargo: user.cargo?.nombre || 'N/A',
          departamento: user.departamento?.nombre || 'N/A',
          empresa: user.departamento?.empresa?.nombre || 'N/A'
        }));

        // Procesar departamentos
        const departamentosFormatted = departamentosData.map((dept: any) => ({
          value: dept.id,
          label: dept.nombre,
          empresa: dept.empresa?.nombre || 'N/A'
        }));

        setUsuarios(usuariosFormatted);
        setDepartamentos(departamentosFormatted);
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
          estado: '',
          codigoImgc: '',  // Cambio de nsap a codigoImgc - OBLIGATORIO
          mac: null,
          ubicacionId: null,
          // Nuevos campos de compra
          fechaCompra: null,
          numeroFactura: null,
          proveedor: null,
          monto: null,
        });
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

    // Validaciones adicionales según el estado
    if (formData.estado === 'Asignado' && !selectedTarget) {
      showToast.error('Debe seleccionar un usuario o departamento para asignar');
      return;
    }

    if (formData.estado === 'Mantenimiento' && !motivo.trim()) {
      showToast.error('Debe especificar el motivo del mantenimiento');
      return;
    }

    try {
      await onSubmit(validation.data);
    } catch (error) {
      console.error('Error en el formulario:', error);
    }
  };
  
  // Tipos de dispositivos permitidos
  const TIPOS_DISPOSITIVOS = [
    "Impresora",
    "Cámara",
    "Tablet",
    "Smartphone",
    "Monitor",
    "Teclado",
    "Mouse",
    "Router",
    "Switch",
    "Proyector",
    "Escáner",
    "Altavoces",
    "Micrófono",
    "Webcam"
  ];

  // Filtrar solo modelos de dispositivos
  const modelosDispositivos = Array.isArray(modelos) ? modelos.filter(modelo => 
    TIPOS_DISPOSITIVOS.includes(modelo.tipo)
  ) : [];

  // Mapea los modelos recibidos para el componente Select
  const modeloOptions = modelosDispositivos.map(modelo => ({ value: modelo.id, label: modelo.nombre }));
  const ubicacionOptions = ubicaciones.map(ubicacion => ({ value: ubicacion.id, label: ubicacion.nombre }));
  const selectedModelValue = modeloOptions.find(option => option.value === formData.modeloId) || null;
  const selectedUbicacionValue = ubicacionOptions.find(option => option.value === formData.ubicacionId) || null;

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
              <option value="En resguardo">En resguardo (Guardado, no operativo)</option>
              <option value="Operativo">Operativo (Disponible para uso)</option>
              <option value="Asignado">Asignado (Vinculado a empleado)</option>
              <option value="Mantenimiento">Mantenimiento (En reparación)</option>
              <option value="De baja">De baja (Dañado, en sistema)</option>
            </select>
          </div>

          {/* Debug: Mostrar el estado actual */}
          <div className="text-xs text-gray-500 p-2 bg-yellow-100 border rounded">
            Estado actual: "{formData.estado || 'vacío'}" | ¿Es Asignado?: {formData.estado === 'Asignado' ? 'SÍ' : 'NO'}
          </div>

          {/* Campos de Asignación - Solo se muestran si el estado es "Asignado" */}
          {formData.estado === 'Asignado' && (
            <div className="grid gap-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700">Información de Asignación</h4>
              
              {/* Selector de tipo de asignación */}
              <div className="grid gap-2">
                <Label>Asignar a:</Label>
                <RadioGroup value={asignarA} onValueChange={(value) => setAsignarA(value as 'Usuario' | 'Departamento')}>
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

              {/* Selector de usuario o departamento */}
              <div className="grid gap-2">
                <Label>{asignarA === 'Usuario' ? 'Usuario' : 'Departamento'}</Label>
                <Select
                  options={asignarA === 'Usuario' ? usuarios : departamentos}
                  value={selectedTarget}
                  onChange={setSelectedTarget}
                  placeholder={`Seleccionar ${asignarA.toLowerCase()}`}
                  isSearchable
                  styles={reactSelectStyles}
                  formatOptionLabel={(option: any) => (
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-sm text-gray-500">
                        {asignarA === 'Usuario' ? `${option.cargo} - ${option.departamento}` : option.empresa}
                      </span>
                    </div>
                  )}
                />
              </div>

              {/* Gerente responsable */}
              <div className="grid gap-2">
                <Label>Gerente Responsable</Label>
                <Select
                  options={usuarios}
                  value={selectedGerente}
                  onChange={setSelectedGerente}
                  placeholder="Seleccionar gerente"
                  isSearchable
                  isClearable
                  styles={reactSelectStyles}
                />
              </div>

              {/* Ubicación de Asignación */}
              <div className="grid gap-2">
                <Label>Ubicación de Asignación</Label>
                <Select
                  options={ubicacionOptions}
                  value={selectedUbicacionAsignacion}
                  onChange={setSelectedUbicacionAsignacion}
                  placeholder="Seleccionar ubicación específica"
                  isSearchable
                  isClearable
                  styles={reactSelectStyles}
                />
              </div>

              {/* Notas */}
              <div className="grid gap-2">
                <Label htmlFor="notas">Notas</Label>
                <Input 
                  id="notas" 
                  value={notas} 
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Notas adicionales"
                />
              </div>
            </div>
          )}

          {/* Campo de motivo para mantenimiento */}
          {formData.estado === 'Mantenimiento' && (
            <div className="grid gap-2">
              <Label htmlFor="motivo">Motivo del Mantenimiento <span className="text-destructive">*</span></Label>
              <Input 
                id="motivo" 
                value={motivo} 
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Especificar motivo del mantenimiento"
                required
              />
            </div>
          )}

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
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              {isEditing ? 'Guardar Cambios' : 'Guardar Equipo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default DispositivoForm;
