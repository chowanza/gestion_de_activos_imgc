'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { showToast } from 'nextjs-toast-notify';
import { X } from 'lucide-react';

interface CargoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departamentoId: string;
  cargo?: {
    id: string;
    nombre: string;
    descripcion?: string;
  } | null;
}

export default function CargoForm({ isOpen, onClose, onSuccess, departamentoId, cargo }: CargoFormProps) {
  const [nombre, setNombre] = useState(cargo?.nombre || '');
  const [descripcion, setDescripcion] = useState(cargo?.descripcion || '');
  const [loading, setLoading] = useState(false);

  const isEditing = !!cargo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre.trim()) {
      showToast.error('El nombre del cargo es obligatorio');
      return;
    }

    setLoading(true);
    
    try {
      const url = isEditing 
        ? `/api/departamentos/${departamentoId}/cargos/${cargo.id}`
        : `/api/departamentos/${departamentoId}/cargos`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar el cargo');
      }

      const successMessage = isEditing ? 'Cargo actualizado exitosamente' : 'Cargo creado exitosamente';
      showToast.success(successMessage);
      
      // Limpiar formulario
      setNombre('');
      setDescripcion('');
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al guardar cargo:', error);
      showToast.error(error.message || 'Error al guardar el cargo');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setNombre('');
      setDescripcion('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {isEditing ? 'Editar Cargo' : 'Crear Nuevo Cargo'}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={loading}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Cargo *</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Desarrollador, Analista, Gerente..."
              disabled={loading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción opcional del cargo..."
              disabled={loading}
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !nombre.trim()}
            >
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

