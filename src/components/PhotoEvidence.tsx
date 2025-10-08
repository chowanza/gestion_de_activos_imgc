'use client';

import { useState, useEffect } from 'react';
import { X, ZoomIn, ChevronLeft, ChevronRight, Download, RotateCw } from 'lucide-react';

interface PhotoEvidenceProps {
  images: string[];
  className?: string;
}

export default function PhotoEvidence({ images, className = '' }: PhotoEvidenceProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rotation, setRotation] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const imageUrls = images.filter(url => url.trim()).map(url => url.trim());

  if (imageUrls.length === 0) {
    return null;
  }

  const openImageModal = (imageUrl: string, index: number) => {
    console.log('🔍 Abriendo lightbox para imagen:', imageUrl, 'índice:', index);
    setSelectedImage(imageUrl);
    setCurrentIndex(index);
    setRotation(0);
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
  };

  const closeImageModal = () => {
    console.log('🔍 Cerrando lightbox');
    setSelectedImage(null);
    setCurrentIndex(0);
    setRotation(0);
    // Restaurar scroll del body
    document.body.style.overflow = 'unset';
  };

  const goToPrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : imageUrls.length - 1;
    setCurrentIndex(newIndex);
    setSelectedImage(imageUrls[newIndex]);
    setRotation(0);
  };

  const goToNext = () => {
    const newIndex = currentIndex < imageUrls.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    setSelectedImage(imageUrls[newIndex]);
    setRotation(0);
  };

  const rotateImage = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const downloadImage = () => {
    if (selectedImage) {
      const link = document.createElement('a');
      link.href = selectedImage;
      link.download = `evidencia_${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Manejar teclas del teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedImage) return;

      switch (event.key) {
        case 'Escape':
          closeImageModal();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'r':
        case 'R':
          rotateImage();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, currentIndex]);

  // Limpiar overflow al desmontar
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <>
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {imageUrls.slice(0, 3).map((imageUrl, index) => (
          <div 
            key={index} 
            className="relative group cursor-pointer" 
            title="Click para ampliar imagen"
            onClick={() => {
              console.log('🔍 Click en contenedor de imagen:', imageUrl);
              openImageModal(imageUrl, index);
            }}
            style={{ pointerEvents: 'auto' }}
          >
            <img
              src={imageUrl}
              alt={`Evidencia ${index + 1} - Click para ampliar`}
              className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md"
              draggable={false}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
              <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
            </div>
          </div>
        ))}
        
        {imageUrls.length > 3 && (
          <div 
            className="w-16 h-16 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-200 hover:border-blue-400 transition-all duration-200"
            onClick={() => {
              console.log('🔍 Click en "más imágenes" detectado');
              openImageModal(imageUrls[3], 3);
            }}
            title="Click para ver más imágenes"
          >
            <span className="text-xs text-gray-600 font-medium">
              +{imageUrls.length - 3}
            </span>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex items-center justify-center p-4">
          {/* Overlay clickable para cerrar */}
          <div 
            className="absolute inset-0" 
            onClick={closeImageModal}
          />
          
          {/* Contenedor del modal */}
          <div className="relative max-w-[95vw] max-h-[95vh] flex flex-col">
            {/* Header con controles */}
            <div className="flex items-center justify-between p-4 bg-black bg-opacity-50 text-white rounded-t-lg">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-medium">
                  Evidencia Fotográfica ({currentIndex + 1} de {imageUrls.length})
                </h3>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Botón rotar */}
                <button
                  onClick={rotateImage}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                  title="Rotar imagen (R)"
                >
                  <RotateCw className="h-5 w-5" />
                </button>
                
                {/* Botón descargar */}
                <button
                  onClick={downloadImage}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                  title="Descargar imagen"
                >
                  <Download className="h-5 w-5" />
                </button>
                
                {/* Botón cerrar */}
                <button
                  onClick={closeImageModal}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                  title="Cerrar (ESC)"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* Contenedor de la imagen */}
            <div className="relative bg-black flex items-center justify-center min-h-[400px]">
              <img
                src={selectedImage}
                alt="Evidencia ampliada"
                className="max-w-full max-h-[80vh] object-contain"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
              
              {/* Navegación con flechas */}
              {imageUrls.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                    title="Imagen anterior (←)"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  
                  <button
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                    title="Imagen siguiente (→)"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
            
            {/* Thumbnail navigation */}
            {imageUrls.length > 1 && (
              <div className="flex justify-center space-x-2 p-4 bg-black bg-opacity-50 rounded-b-lg overflow-x-auto">
                {imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentIndex(index);
                      setSelectedImage(url);
                      setRotation(0);
                    }}
                    className={`w-16 h-16 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all ${
                      index === currentIndex 
                        ? 'border-blue-500 shadow-lg' 
                        : 'border-gray-600 hover:border-gray-400'
                    }`}
                    title={`Ver imagen ${index + 1}`}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            
            {/* Instrucciones de teclado */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 text-center">
              <div className="bg-black bg-opacity-50 px-3 py-1 rounded">
                ESC: Cerrar • ← →: Navegar • R: Rotar
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}