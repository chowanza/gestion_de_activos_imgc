"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "nextjs-toast-notify";
import { X, Save, Upload } from "lucide-react";

interface ModeloDispositivo {
  id: string;
  nombre: string;
  tipo: string;
  marca: {
    id: string;
    nombre: string;
  };
  img?: string;
}

interface CatalogoFormProps {
  modelo?: ModeloDispositivo | null;
  marcas: any[];
  tipos: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export function CatalogoForm({ modelo, marcas, tipos, onClose, onSuccess }: CatalogoFormProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "",
    marcaId: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (modelo) {
      setFormData({
        nombre: modelo.nombre,
        tipo: modelo.tipo,
        marcaId: modelo.marca.id,
      });
      if (modelo.img) {
        setImagePreview(modelo.img);
      }
    }
  }, [modelo]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      showToast.error("El nombre del modelo es requerido");
      return;
    }

    if (!formData.tipo) {
      showToast.error("El tipo de equipo es requerido");
      return;
    }

    if (!formData.marcaId) {
      showToast.error("La marca es requerida");
      return;
    }

    try {
      setLoading(true);
      const url = modelo ? `/api/modelos/${modelo.id}` : "/api/modelos";
      const method = modelo ? "PUT" : "POST";

      // Crear FormData
      const formDataToSend = new FormData();
      formDataToSend.append('nombre', formData.nombre);
      formDataToSend.append('tipo', formData.tipo);
      formDataToSend.append('marcaId', formData.marcaId);
      
      if (selectedImage) {
        formDataToSend.append('img', selectedImage);
      }

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      if (response.ok) {
        showToast.success(
          modelo ? "Modelo actualizado correctamente" : "Modelo creado correctamente"
        );
        onSuccess();
      } else {
        const error = await response.json();
        showToast.error(error.message || "Error al guardar el modelo");
      }
    } catch (error) {
      console.error("Error al guardar modelo:", error);
      showToast.error("Error al guardar el modelo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {modelo ? "Editar Modelo" : "Nuevo Modelo"}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre del Modelo *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: ThinkPad X1 Carbon, MacBook Pro..."
                required
              />
            </div>

            <div>
              <Label htmlFor="tipo">Tipo de Equipo *</Label>
              <select
                id="tipo"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar tipo...</option>
                {tipos.map(tipo => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="marcaId">Marca *</Label>
              <select
                id="marcaId"
                value={formData.marcaId}
                onChange={(e) => setFormData({ ...formData, marcaId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar marca...</option>
                {marcas.map(marca => (
                  <option key={marca.id} value={marca.id}>
                    {marca.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="img">Imagen del Modelo</Label>
              <div className="space-y-2">
                <Input
                  id="img"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {modelo ? "Actualizar" : "Crear"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
