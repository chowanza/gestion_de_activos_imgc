"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { showToast } from "nextjs-toast-notify";
import { X, Plus, Trash2, AlertTriangle, Edit } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

interface Marca {
  id: string;
  nombre: string;
}

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

interface MarcasModalProps {
  marcas: Marca[];
  modelos: ModeloDispositivo[];
  onClose: () => void;
  onMarcasChange: (marcas: Marca[]) => void;
}

export function MarcasModal({ marcas, modelos, onClose, onMarcasChange }: MarcasModalProps) {
  const { hasPermission } = usePermissions();
  const userCanDelete = hasPermission('canDelete');
  const [nuevaMarca, setNuevaMarca] = useState("");
  const [localMarcas, setLocalMarcas] = useState<Marca[]>(marcas);
  const [editingMarca, setEditingMarca] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAddMarca = async () => {
    if (!nuevaMarca.trim()) {
      showToast.error('El nombre de la marca no puede estar vacío');
      return;
    }

    if (localMarcas.some(m => m.nombre.toLowerCase() === nuevaMarca.trim().toLowerCase())) {
      showToast.error('Esta marca ya existe');
      return;
    }

    try {
      const response = await fetch('/api/marcas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre: nuevaMarca.trim() }),
      });

      if (response.ok) {
        const nuevaMarcaData = await response.json();
        setLocalMarcas([...localMarcas, nuevaMarcaData]);
        setNuevaMarca("");
        showToast.success('Marca agregada correctamente');
      } else {
        const error = await response.json();
        showToast.error(error.message || 'Error al agregar la marca');
      }
    } catch (error) {
      console.error('Error al agregar marca:', error);
      showToast.error('Error al agregar la marca');
    }
  };

  const handleEditMarca = (marcaId: string) => {
    const marca = localMarcas.find(m => m.id === marcaId);
    if (marca) {
      setEditingMarca(marcaId);
      setEditValue(marca.nombre);
    }
  };

  const handleSaveEdit = async () => {
    if (!editValue.trim()) {
      showToast.error('El nombre de la marca no puede estar vacío');
      return;
    }

    const marca = localMarcas.find(m => m.id === editingMarca);
    if (!marca) return;

    if (editValue.trim() !== marca.nombre && localMarcas.some(m => m.id !== marca.id && m.nombre.toLowerCase() === editValue.trim().toLowerCase())) {
      showToast.error('Ya existe una marca con ese nombre');
      return;
    }

    try {
      const response = await fetch(`/api/marcas/${editingMarca}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre: editValue.trim() }),
      });

      if (response.ok) {
        const updatedMarca = await response.json();
        setLocalMarcas(localMarcas.map(m => m.id === editingMarca ? updatedMarca : m));
        setEditingMarca(null);
        setEditValue("");
        
        // Mostrar mensaje con información de cascada
        const modelosConMarca = modelos.filter(m => m.marca.id === editingMarca);
        if (modelosConMarca.length > 0) {
          showToast.success(`Marca actualizada en ${modelosConMarca.length} modelo(s)`);
        } else {
          showToast.success('Marca actualizada correctamente');
        }
      } else {
        const error = await response.json();
        showToast.error(error.message || 'Error al actualizar la marca');
      }
    } catch (error) {
      console.error('Error al actualizar marca:', error);
      showToast.error('Error al actualizar la marca');
    }
  };

  const handleCancelEdit = () => {
    setEditingMarca(null);
    setEditValue("");
  };

  const handleRemoveMarca = async (marcaId: string) => {
    const marca = localMarcas.find(m => m.id === marcaId);
    if (!marca) return;

    // Verificar si hay modelos usando esta marca
    const modelosConMarca = modelos.filter(m => m.marca.id === marcaId);
    if (modelosConMarca.length > 0) {
      showToast.error(`No se puede eliminar la marca porque hay ${modelosConMarca.length} modelo(s) que la utilizan`);
      return;
    }

    try {
      const response = await fetch(`/api/marcas/${marcaId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setLocalMarcas(localMarcas.filter(m => m.id !== marcaId));
        showToast.success('Marca eliminada correctamente');
      } else {
        const error = await response.json();
        showToast.error(error.message || 'Error al eliminar la marca');
      }
    } catch (error) {
      console.error('Error al eliminar marca:', error);
      showToast.error('Error al eliminar la marca');
    }
  };

  const handleSave = () => {
    onMarcasChange(localMarcas);
    onClose();
    showToast.success('Marcas actualizadas correctamente');
  };

  const getModelosCount = (marcaId: string) => {
    return modelos.filter(m => m.marca.id === marcaId).length;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestionar Marcas</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Agregar nueva marca */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Agregar Nueva Marca</h3>
            <div className="flex space-x-2">
              <Input
                placeholder="Nueva marca..."
                value={nuevaMarca}
                onChange={(e) => setNuevaMarca(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddMarca()}
              />
              <Button onClick={handleAddMarca} disabled={!nuevaMarca.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>
          </div>

          {/* Lista de marcas existentes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Marcas Existentes ({localMarcas.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {localMarcas.map(marca => {
                const modelosCount = getModelosCount(marca.id);
                const canDelete = modelosCount === 0;
                const isEditing = editingMarca === marca.id;
                const modelosConMarca = modelos.filter(m => m.marca.id === marca.id);
                
                return (
                  <div key={marca.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3 flex-1">
                      {isEditing ? (
                        <div className="flex items-center space-x-2 flex-1">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                            className="flex-1"
                            autoFocus
                          />
                          <Button size="sm" onClick={handleSaveEdit}>
                            {modelosConMarca.length > 0 ? `Actualizar ${modelosConMarca.length} modelo(s)` : 'Guardar'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium">{marca.nombre}</span>
                          <Badge variant="outline">
                            {modelosCount} modelo{modelosCount !== 1 ? 's' : ''}
                          </Badge>
                          {!canDelete && (
                            <div className="flex items-center text-amber-600 text-sm">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              En uso
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMarca(marca.id)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {userCanDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMarca(marca.id)}
                            disabled={!canDelete}
                            className={`h-8 w-8 p-0 ${
                              canDelete 
                                ? 'text-red-600 hover:text-red-700' 
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Guardar Cambios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
