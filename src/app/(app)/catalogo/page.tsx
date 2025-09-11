"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { showToast } from "nextjs-toast-notify";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Tag,
  Package,
  Filter,
  MoreHorizontal,
  X,
  Settings,
  Eye
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { CatalogoForm } from "@/components/catalogo-form";
import { TiposEquiposModal } from "@/components/tipos-equipos-modal";
import { MarcasModal } from "@/components/marcas-modal";

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

// Tipos de equipos predefinidos
const TIPOS_EQUIPOS = [
  "Laptop",
  "Desktop", 
  "Impresora",
  "Cámara",
  "Tablet",
  "Smartphone",
  "Monitor",
  "Teclado",
  "Mouse",
  "Router",
  "Switch",
  "Servidor"
];

export default function CatalogoPage() {
  const router = useRouter();
  const [modelos, setModelos] = useState<ModeloDispositivo[]>([]);
  const [tipos, setTipos] = useState<string[]>(TIPOS_EQUIPOS);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("");
  const [showModeloForm, setShowModeloForm] = useState(false);
  const [showTiposModal, setShowTiposModal] = useState(false);
  const [showMarcasModal, setShowMarcasModal] = useState(false);
  const [editingModelo, setEditingModelo] = useState<ModeloDispositivo | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [modelosRes, marcasRes] = await Promise.all([
        fetch('/api/modelos'),
        fetch('/api/marcas')
      ]);

      if (modelosRes.ok) {
        const modelosData = await modelosRes.json();
        setModelos(modelosData);
      }

      if (marcasRes.ok) {
        const marcasData = await marcasRes.json();
        setMarcas(marcasData);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showToast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModelo = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este modelo?')) return;

    try {
      const response = await fetch(`/api/modelos/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setModelos(modelos.filter(m => m.id !== id));
        showToast.success('Modelo eliminado correctamente');
      } else {
        showToast.error('Error al eliminar el modelo');
      }
    } catch (error) {
      console.error('Error al eliminar modelo:', error);
      showToast.error('Error al eliminar el modelo');
    }
  };

  const handleTiposChange = (newTipos: string[]) => {
    setTipos(newTipos);
    // Refrescar datos para mostrar cambios en cascada
    fetchData();
  };

  const handleMarcasChange = (newMarcas: any[]) => {
    setMarcas(newMarcas);
    // Refrescar datos para mostrar cambios en cascada
    fetchData();
  };

  const filteredModelos = modelos.filter(modelo => {
    const matchesSearch = modelo.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         modelo.marca.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTipo = !tipoFilter || modelo.tipo === tipoFilter;
    return matchesSearch && matchesTipo;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Spinner className="h-8 w-8" />
          <span className="ml-2">Cargando catálogo...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Catálogo de Equipos</h1>
          <p className="text-gray-600">Gestiona modelos y tipos de equipos</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowTiposModal(true)} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Gestionar Tipos
          </Button>
          <Button onClick={() => setShowMarcasModal(true)} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Gestionar Marcas
          </Button>
          <Button onClick={() => setShowModeloForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Modelo
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre o marca..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los tipos</option>
                {tipos.map((tipo, index) => (
                  <option key={`tipo-${index}-${tipo}`} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Modelos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Modelos ({filteredModelos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredModelos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron modelos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Modelo</th>
                    <th className="text-left p-3 font-medium">Marca</th>
                    <th className="text-left p-3 font-medium">Tipo</th>
                    <th className="text-left p-3 font-medium">Imagen</th>
                    <th className="text-right p-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModelos.map(modelo => (
                    <tr key={modelo.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{modelo.nombre}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-gray-600">{modelo.marca.nombre}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{modelo.tipo}</Badge>
                      </td>
                      <td className="p-3">
                        {modelo.img ? (
                          <img 
                            src={modelo.img} 
                            alt={modelo.nombre}
                            className="w-24 h-24 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gray-100 rounded border flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/catalogo/${modelo.id}`)}
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingModelo(modelo);
                              setShowModeloForm(true);
                            }}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteModelo(modelo.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formularios */}
      {showModeloForm && (
        <CatalogoForm
          modelo={editingModelo}
          marcas={marcas}
          tipos={tipos}
          onClose={() => {
            setShowModeloForm(false);
            setEditingModelo(null);
          }}
          onSuccess={() => {
            fetchData();
            setShowModeloForm(false);
            setEditingModelo(null);
          }}
        />
      )}

      {showTiposModal && (
        <TiposEquiposModal
          tipos={tipos}
          modelos={modelos}
          onClose={() => setShowTiposModal(false)}
          onTiposChange={handleTiposChange}
        />
      )}

      {showMarcasModal && (
        <MarcasModal
          marcas={marcas}
          modelos={modelos}
          onClose={() => setShowMarcasModal(false)}
          onMarcasChange={handleMarcasChange}
        />
      )}
    </div>
  );
}
