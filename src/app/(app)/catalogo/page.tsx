"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Eye,
  Laptop,
  Monitor
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

// Tipos de equipos específicos para computadoras
const TIPOS_COMPUTADORAS = [
  "Laptop",
  "Desktop", 
  "Servidor",
  "Workstation",
  "All-in-One"
];

// Tipos de equipos específicos para dispositivos
const TIPOS_DISPOSITIVOS = [
  "Impresora",
  "Cámara",
  "Tablet",
  "Smartphone",
  "Monitor",
  "Teclado",
  "Mouse",
  "Router",
  "Switch",
  "Proyector",
  "Escáner",
  "Altavoces",
  "Micrófono",
  "Webcam"
];

export default function CatalogoPage() {
  const router = useRouter();
  const [modelos, setModelos] = useState<ModeloDispositivo[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("");
  const [showModeloForm, setShowModeloForm] = useState(false);
  const [showTiposModal, setShowTiposModal] = useState(false);
  const [showMarcasModal, setShowMarcasModal] = useState(false);
  const [editingModelo, setEditingModelo] = useState<ModeloDispositivo | null>(null);
  const [activeTab, setActiveTab] = useState("computadoras");

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

  // Obtener tipos según la pestaña activa
  const getCurrentTipos = () => {
    return activeTab === "computadoras" ? TIPOS_COMPUTADORAS : TIPOS_DISPOSITIVOS;
  };

  // Obtener modelos filtrados según la pestaña activa
  const getFilteredModelos = () => {
    const currentTipos = getCurrentTipos();
    return modelos.filter(modelo => {
      const matchesSearch = modelo.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           modelo.marca.nombre.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTipo = !tipoFilter || modelo.tipo === tipoFilter;
      const matchesCategory = currentTipos.includes(modelo.tipo);
      return matchesSearch && matchesTipo && matchesCategory;
    });
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
    // Refrescar datos para mostrar cambios en cascada
    fetchData();
  };

  const handleMarcasChange = (newMarcas: any[]) => {
    setMarcas(newMarcas);
    // Refrescar datos para mostrar cambios en cascada
    fetchData();
  };

  // Resetear filtro de tipo cuando cambie la pestaña
  useEffect(() => {
    setTipoFilter("");
  }, [activeTab]);

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

      {/* Pestañas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="computadoras" className="flex items-center gap-2">
            <Laptop className="h-4 w-4" />
            Computadoras
          </TabsTrigger>
          <TabsTrigger value="dispositivos" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Dispositivos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="computadoras" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar computadoras por nombre o marca..."
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
                    {getCurrentTipos().map((tipo, index) => (
                      <option key={`tipo-${index}-${tipo}`} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Computadoras */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Laptop className="h-5 w-5 mr-2 text-blue-600" />
                Computadoras ({getFilteredModelos().length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getFilteredModelos().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Laptop className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No se encontraron computadoras</p>
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
                      {getFilteredModelos().map(modelo => (
                        <tr key={modelo.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="font-medium">{modelo.nombre}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-gray-600">{modelo.marca.nombre}</div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {modelo.tipo}
                            </Badge>
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
                                <Laptop className="h-8 w-8 text-gray-400" />
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
        </TabsContent>

        <TabsContent value="dispositivos" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar dispositivos por nombre o marca..."
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Todos los tipos</option>
                    {getCurrentTipos().map((tipo, index) => (
                      <option key={`tipo-${index}-${tipo}`} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Dispositivos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="h-5 w-5 mr-2 text-green-600" />
                Dispositivos ({getFilteredModelos().length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getFilteredModelos().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Monitor className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No se encontraron dispositivos</p>
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
                      {getFilteredModelos().map(modelo => (
                        <tr key={modelo.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="font-medium">{modelo.nombre}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-gray-600">{modelo.marca.nombre}</div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {modelo.tipo}
                            </Badge>
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
                                <Monitor className="h-8 w-8 text-gray-400" />
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
        </TabsContent>
      </Tabs>

      {/* Formularios */}
      {showModeloForm && (
        <CatalogoForm
          modelo={editingModelo}
          marcas={marcas}
          tipos={getCurrentTipos()}
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
          tipos={getCurrentTipos()}
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
