"use client";

import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";

export interface EmpresaFormData {
  nombre: string;
  descripcion?: string;
  logo?: string | File | null;
}

interface EmpresaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EmpresaFormData) => void;
  initialData?: EmpresaFormData | null;
  isEditing?: boolean;
}

export const EmpresaForm: React.FC<EmpresaFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
}) => {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        setNombre(initialData.nombre || "");
        setDescripcion(initialData.descripcion || "");
        // Si hay un logo existente, mostrarlo como preview
        if (initialData.logo && typeof initialData.logo === 'string') {
          setLogoPreview(initialData.logo);
        }
      } else {
        // Reset for creation
        setNombre("");
        setDescripcion("");
        setLogo(null);
        setLogoPreview(null);
      }
    }
  }, [isOpen, initialData, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre.trim()) {
      return;
    }

    const formData: EmpresaFormData = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      logo: logo,
    };

    onSubmit(formData);
  };

  const handleClose = () => {
    setNombre("");
    setDescripcion("");
    setLogo(null);
    setLogoPreview(null);
    onClose();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogo(null);
    setLogoPreview(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Empresa" : "Agregar Nueva Empresa"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Modifica los datos de la empresa." 
              : "Completa los datos para crear una nueva empresa."
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre" className="text-right">
                Nombre *
              </Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="col-span-3"
                placeholder="Nombre de la empresa"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="descripcion" className="text-right pt-2">
                Descripción
              </Label>
              <Textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="col-span-3"
                placeholder="Descripción de la empresa (opcional)"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="logo" className="text-right pt-2">
                Logo
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {logoPreview && (
                  <div className="relative inline-block">
                    <img
                      src={logoPreview}
                      alt="Preview del logo"
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Formatos soportados: JPG, PNG, GIF. Tamaño máximo: 2MB
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? "Actualizar Empresa" : "Crear Empresa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};