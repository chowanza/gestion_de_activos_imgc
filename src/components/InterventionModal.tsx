'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { showToast } from 'nextjs-toast-notify';
import { X, Camera, Upload, Image as ImageIcon } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';

interface InterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipmentId: string;
  equipmentType: 'computador' | 'dispositivo';
  equipmentSerial: string;
}

interface UploadedImage {
  file: File;
  preview: string;
  id: string;
}

export default function InterventionModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  equipmentId, 
  equipmentType,
  equipmentSerial 
}: InterventionModalProps) {
  const [fecha, setFecha] = useState<Date | undefined>(new Date());
  const [notas, setNotas] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: UploadedImage[] = [];
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          showToast.error(`La imagen ${file.name} es muy grande. Máximo 5MB.`);
          return;
        }

        const id = Math.random().toString(36).substr(2, 9);
        const preview = URL.createObjectURL(file);
        
        newImages.push({
          file,
          preview,
          id
        });
      }
    });

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages]);
      showToast.success(`${newImages.length} imagen(es) agregada(s)`);
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (imageId: string) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== imageId);
      const removedImage = prev.find(img => img.id === imageId);
      if (removedImage) {
        URL.revokeObjectURL(removedImage.preview);
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fecha) {
      showToast.error('La fecha de intervención es obligatoria');
      return;
    }

    if (!notas.trim()) {
      showToast.error('Las notas de monitoreo son obligatorias');
      return;
    }

    setLoading(true);
    
    try {
      // Upload images first
      let imageUrls: string[] = [];
      
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((image, index) => {
          formData.append(`images`, image.file);
        });

        const uploadResponse = await fetch('/api/upload/images', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Error al subir las imágenes');
        }

        const uploadResult = await uploadResponse.json();
        imageUrls = uploadResult.urls || [];
      }

      // Create intervention record
      const response = await fetch('/api/intervenciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fecha: fecha,
          notas: notas.trim(),
          evidenciaFotos: imageUrls.join(','),
          equipmentId,
          equipmentType
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear la intervención');
      }

      showToast.success('Intervención registrada exitosamente');
      
      // Cleanup
      setFecha(new Date());
      setNotas('');
      images.forEach(img => URL.revokeObjectURL(img.preview));
      setImages([]);
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al registrar intervención:', error);
      showToast.error(error.message || 'Error al registrar la intervención');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Cleanup images
      images.forEach(img => URL.revokeObjectURL(img.preview));
      setImages([]);
      setFecha(new Date());
      setNotas('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Registro de Intervención
            </div>
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
        
        <div className="space-y-4">
          {/* Equipment Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium">
              {equipmentType === 'computador' ? 'Computador' : 'Dispositivo'}: {equipmentSerial}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Fecha de Intervención */}
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha de Intervención *</Label>
              <Input
                id="fecha"
                type="date"
                value={fecha ? fecha.toISOString().split('T')[0] : ''}
                onChange={(e) => setFecha(e.target.value ? new Date(e.target.value) : undefined)}
                disabled={loading}
                required
              />
            </div>
            
            {/* Notas de Monitoreo */}
            <div className="space-y-2">
              <Label htmlFor="notas">Notas de Monitoreo *</Label>
              <Textarea
                id="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Registre las observaciones del escaneo y revisión..."
                disabled={loading}
                rows={4}
                required
              />
            </div>
            
            {/* Evidencia Fotográfica */}
            <div className="space-y-2">
              <Label>Evidencia Fotográfica</Label>
              
              {/* Upload Button */}
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="flex items-center"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Imágenes
                </Button>
                <span className="text-sm text-gray-500">
                  Máximo 5MB por imagen
                </span>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {/* Image Previews */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
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
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                        {image.file.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {images.length === 0 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    No hay imágenes seleccionadas
                  </p>
                </div>
              )}
            </div>
            
            {/* Submit Buttons */}
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
                disabled={loading || !fecha || !notas.trim()}
                className="flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Registrando...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Registrar Intervención
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
