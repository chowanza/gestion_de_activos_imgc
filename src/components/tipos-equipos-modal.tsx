"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { showToast } from "nextjs-toast-notify";
import { X, Plus, Trash2, AlertTriangle, Edit } from "lucide-react";

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

interface TiposEquiposModalProps {
  tipos: string[];
  modelos: ModeloDispositivo[];
  onClose: () => void;
  onTiposChange: (tipos: string[]) => void;
}

export function TiposEquiposModal({ tipos, modelos, onClose, onTiposChange }: TiposEquiposModalProps) {
  const [nuevoTipo, setNuevoTipo] = useState("");
  const [localTipos, setLocalTipos] = useState<string[]>(tipos);
  const [editingTipo, setEditingTipo] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAddTipo = () => {
    if (nuevoTipo.trim() && !localTipos.includes(nuevoTipo.trim())) {
      setLocalTipos([...localTipos, nuevoTipo.trim()]);
      setNuevoTipo("");
      showToast.success('Tipo de equipo agregado correctamente');
    } else if (localTipos.includes(nuevoTipo.trim())) {
      showToast.error('Este tipo de equipo ya existe');
    } else {
      showToast.error('El nombre del tipo no puede estar vacío');
    }
  };

  const handleEditTipo = (tipo: string) => {
    setEditingTipo(tipo);
    setEditValue(tipo);
  };

  const handleSaveEdit = async () => {
    if (!editValue.trim()) {
      showToast.error('El nombre del tipo no puede estar vacío');
      return;
    }

    if (editValue.trim() !== editingTipo && localTipos.includes(editValue.trim())) {
      showToast.error('Ya existe un tipo con ese nombre');
      return;
    }

    try {
      // Si el tipo está siendo usado por modelos, actualizar en cascada
      const modelosConTipo = modelos.filter(m => m.tipo === editingTipo);
      
      if (modelosConTipo.length > 0) {
        const response = await fetch('/api/tipos-equipos/update-cascada', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tipoAnterior: editingTipo,
            tipoNuevo: editValue.trim()
          }),
        });

        if (response.ok) {
          const result = await response.json();
          showToast.success(`Tipo actualizado en ${result.modelosActualizados} modelo(s)`);
        } else {
          const error = await response.json();
          showToast.error(error.message || 'Error al actualizar el tipo');
          return;
        }
      }

      // Actualizar la lista local
      setLocalTipos(localTipos.map(t => t === editingTipo ? editValue.trim() : t));
      setEditingTipo(null);
      setEditValue("");
      
      if (modelosConTipo.length === 0) {
        showToast.success('Tipo de equipo actualizado correctamente');
      }
    } catch (error) {
      console.error('Error al actualizar tipo:', error);
      showToast.error('Error al actualizar el tipo');
    }
  };

  const handleCancelEdit = () => {
    setEditingTipo(null);
    setEditValue("");
  };

  const handleRemoveTipo = (tipo: string) => {
    // Verificar si hay modelos usando este tipo
    const modelosConTipo = modelos.filter(m => m.tipo === tipo);
    if (modelosConTipo.length > 0) {
      showToast.error(`No se puede eliminar el tipo porque hay ${modelosConTipo.length} modelo(s) que lo utilizan`);
      return;
    }
    
    setLocalTipos(localTipos.filter(t => t !== tipo));
    showToast.success('Tipo de equipo eliminado correctamente');
  };

  const handleSave = () => {
    onTiposChange(localTipos);
    onClose();
    showToast.success('Tipos de equipos actualizados correctamente');
  };

  const getModelosCount = (tipo: string) => {
    return modelos.filter(m => m.tipo === tipo).length;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestionar Tipos de Equipos</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Agregar nuevo tipo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Agregar Nuevo Tipo</h3>
            <div className="flex space-x-2">
              <Input
                placeholder="Nuevo tipo de equipo..."
                value={nuevoTipo}
                onChange={(e) => setNuevoTipo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTipo()}
              />
              <Button onClick={handleAddTipo} disabled={!nuevoTipo.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>
          </div>

          {/* Lista de tipos existentes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tipos Existentes ({localTipos.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {localTipos.map(tipo => {
                const modelosCount = getModelosCount(tipo);
                const canDelete = modelosCount === 0;
                const isEditing = editingTipo === tipo;
                const modelosConTipo = modelos.filter(m => m.tipo === tipo);
                
                return (
                  <div key={tipo} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
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
                            {modelosConTipo.length > 0 ? `Actualizar ${modelosConTipo.length} modelo(s)` : 'Guardar'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium">{tipo}</span>
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
                          onClick={() => handleEditTipo(tipo)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTipo(tipo)}
                          disabled={!canDelete}
                          className={`h-8 w-8 p-0 ${
                            canDelete 
                              ? 'text-red-600 hover:text-red-700' 
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
