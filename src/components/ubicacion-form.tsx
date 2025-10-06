"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface Ubicacion {
  id: string;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  piso?: string;
  sala?: string;
}

interface UbicacionFormProps {
  ubicacion?: Ubicacion | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function UbicacionForm({ ubicacion, onClose, onSuccess }: UbicacionFormProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    direccion: '',
    piso: '',
    sala: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!ubicacion;

  useEffect(() => {
    if (ubicacion) {
      setFormData({
        nombre: ubicacion.nombre || '',
        descripcion: ubicacion.descripcion || '',
        direccion: ubicacion.direccion || '',
        piso: ubicacion.piso || '',
        sala: ubicacion.sala || ''
      });
    }
  }, [ubicacion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = isEditing ? `/api/ubicaciones/${ubicacion.id}` : '/api/ubicaciones';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        let errorMessage = 'Error al guardar la ubicación';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          // Si no se puede parsear como JSON, usar el mensaje de estado
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error saving ubicacion:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Ubicación' : 'Nueva Ubicación'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica los datos de la ubicación seleccionada'
              : 'Completa la información para crear una nueva ubicación'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                placeholder="Ej: Oficina Principal, Almacén, Laboratorio"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                placeholder="Descripción detallada de la ubicación"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => handleChange('direccion', e.target.value)}
                placeholder="Dirección física de la ubicación"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="piso">Piso</Label>
                <Input
                  id="piso"
                  value={formData.piso}
                  onChange={(e) => handleChange('piso', e.target.value)}
                  placeholder="Ej: 1, 2, 3..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sala">Sala</Label>
                <Input
                  id="sala"
                  value={formData.sala}
                  onChange={(e) => handleChange('sala', e.target.value)}
                  placeholder="Ej: A, B, 101, 102..."
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
