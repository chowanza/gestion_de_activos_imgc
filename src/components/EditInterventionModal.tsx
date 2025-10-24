'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { showToast } from 'nextjs-toast-notify';
import { Upload, X, Image as ImageIcon, Loader2, Edit } from 'lucide-react';
import { LoadingSpinner } from '@/utils/loading';

interface EditInterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  intervention: {
    id: string;
    fecha: string;
    notas: string | null;
    evidenciaFotos: string | null;
    equipmentId: string;
    equipmentType: 'computador' | 'dispositivo';
    equipmentSerial: string;
  } | null;
}

export default function EditInterventionModal({
  isOpen,
  onClose,
  onSuccess,
  intervention,
}: EditInterventionModalProps) {
  const [fecha, setFecha] = useState<Date | undefined>(new Date());
  const [notas, setNotas] = useState('');
  const [images, setImages] = useState<Array<{ file: File; preview: string; id: string }>>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (intervention && isOpen) {
      // Cargar datos de la intervención
      setFecha(new Date(intervention.fecha));
      setNotas(intervention.notas || '');
      
      // Cargar imágenes existentes
      if (intervention.evidenciaFotos) {
        const imageUrls = intervention.evidenciaFotos.split(',').map(url => url.trim());
        setExistingImages(imageUrls);
      } else {
        setExistingImages([]);
      }
      
      // Limpiar imágenes nuevas
      setImages([]);
    }
  }, [intervention, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFecha(new Date());
      setNotas('');
      setImages([]);
      setExistingImages([]);
    }
  }, [isOpen]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: Array<{ file: File; preview: string; id: string }> = [];

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        if (file.size > 5 * 1024 * 1024) {
          // 5MB limit
          showToast.error(`La imagen ${file.name} es muy grande. Máximo 5MB.`);
          return;
        }

        const id = Math.random().toString(36).substr(2, 9);
        const preview = URL.createObjectURL(file);

        newImages.push({
          file,
          preview,
          id,
        });
      }
    });

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages]);
      showToast.success(`${newImages.length} imagen(es) agregada(s)`);
    }

    // Clear the input
    const input = event.target as HTMLInputElement;
    input.value = '';
  };

  const removeImage = (imageId: string) => {
    setImages((prev) => {
      const updated = prev.filter((img) => img.id !== imageId);
      const removedImage = prev.find((img) => img.id === imageId);
      if (removedImage) {
        URL.revokeObjectURL(removedImage.preview);
      }
      return updated;
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!fecha) {
      showToast.error('La fecha de intervención es obligatoria.');
      setLoading(false);
      return;
    }
    if (!notas.trim()) {
      showToast.error('Las notas de monitoreo son obligatorias.');
      setLoading(false);
      return;
    }
    if (!intervention) {
      showToast.error('Error: No se encontró la intervención a editar.');
      setLoading(false);
      return;
    }

    try {
      let imageUrls: string[] = [...existingImages];

      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((image) => {
          formData.append(`images`, image.file);
        });

        const uploadResponse = await fetch('/api/upload/images', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Error al subir las nuevas imágenes');
        }

        const uploadResult = await uploadResponse.json();
        imageUrls = [...imageUrls, ...(uploadResult.images || [])];
      }

      const response = await fetch(`/api/intervenciones/${intervention.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fecha: new Date(fecha),
          notas: notas.trim(),
          evidenciaFotos: imageUrls.join(','),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar la intervención');
      }

      showToast.success('Intervención actualizada exitosamente.');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating intervention:', error);
      showToast.error(error.message || 'Error al actualizar la intervención.');
    } finally {
      setLoading(false);
    }
  };

  if (!intervention) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit className="h-5 w-5 mr-2" />
            Editar Intervención Técnica
          </DialogTitle>
          <DialogDescription>
            Edita la intervención para el equipo {intervention.equipmentSerial} ({intervention.equipmentType}).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fecha" className="text-right">
              Fecha
            </Label>
            <Input
              id="fecha"
              type="date"
              value={fecha ? fecha.toISOString().split('T')[0] : ''}
              onChange={(e) => setFecha(e.target.value ? new Date(e.target.value) : undefined)}
              disabled={loading}
              required
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notas" className="text-right">
              Notas
            </Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observaciones del escaneo y la revisión..."
              className="col-span-3"
              rows={4}
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Evidencia</Label>
            <div className="col-span-3 space-y-2">
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('edit-intervention-upload')?.click()}
                  disabled={loading}
                  className="flex items-center"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Agregar Imágenes
                </Button>
                <span className="text-sm text-gray-500">Máximo 5MB por imagen</span>
              </div>

              <input
                id="edit-intervention-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={loading}
              />

              {/* Imágenes existentes */}
              {existingImages.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Imágenes existentes:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {existingImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Evidencia existente ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={loading}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Imágenes nuevas */}
              {images.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Nuevas imágenes:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {images.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.preview}
                          alt="Preview"
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={loading}
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                          {image.file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {existingImages.length === 0 && images.length === 0 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No hay imágenes seleccionadas</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Edit className="mr-2 h-4 w-4" />}
              {loading ? 'Actualizando...' : 'Actualizar Intervención'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
