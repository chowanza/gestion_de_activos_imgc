"use client";

import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showToast } from "nextjs-toast-notify";
import { Monitor, Smartphone, Plus, Search, Loader2 } from "lucide-react";

interface Equipo {
  id: string;
  serial: string;
  modelo: {
    nombre: string;
    marca: {
      nombre: string;
    };
  };
  estado: string;
  codigoImgc: string;
}

interface Ubicacion {
  id: string;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  piso?: string;
  sala?: string;
}

interface AsignarEquipoUnificadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (equipoId: string, motivo: string, tipoEquipo: 'computador' | 'dispositivo', ubicacionId?: string) => Promise<void>;
  empleadoId: string;
}

export default function AsignarEquipoUnificadoModal({
  isOpen,
  onClose,
  onConfirm,
  empleadoId,
}: AsignarEquipoUnificadoModalProps) {
  const [equipoId, setEquipoId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [tipoEquipo, setTipoEquipo] = useState<'computador' | 'dispositivo'>('computador');
  const [computadoresDisponibles, setComputadoresDisponibles] = useState<Equipo[]>([]);
  const [dispositivosDisponibles, setDispositivosDisponibles] = useState<Equipo[]>([]);
  const [loadingEquipos, setLoadingEquipos] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ubicacionId, setUbicacionId] = useState("");
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loadingUbicaciones, setLoadingUbicaciones] = useState(false);

  // Cargar equipos disponibles cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadEquiposDisponibles();
      loadUbicaciones();
    }
  }, [isOpen, tipoEquipo]);

  const loadEquiposDisponibles = async () => {
    try {
      setLoadingEquipos(true);
      
      // Cargar computadores disponibles
      const responseComputadores = await fetch('/api/equipos/disponibles?tipo=computador');
      if (responseComputadores.ok) {
        const data = await responseComputadores.json();
        setComputadoresDisponibles(data);
      }

      // Cargar dispositivos disponibles
      const responseDispositivos = await fetch('/api/equipos/disponibles?tipo=dispositivo');
      if (responseDispositivos.ok) {
        const data = await responseDispositivos.json();
        setDispositivosDisponibles(data);
      }
    } catch (error) {
      console.error('Error al cargar equipos disponibles:', error);
      showToast.error('Error al cargar equipos disponibles');
    } finally {
      setLoadingEquipos(false);
    }
  };

  const loadUbicaciones = async () => {
    try {
      setLoadingUbicaciones(true);
      const response = await fetch('/api/ubicaciones');
      if (response.ok) {
        const data = await response.json();
        setUbicaciones(data);
        // Seleccionar la primera ubicación por defecto
        if (data.length > 0) {
          setUbicacionId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error al cargar ubicaciones:', error);
      showToast.error('Error al cargar ubicaciones');
    } finally {
      setLoadingUbicaciones(false);
    }
  };

  const handleConfirm = async () => {
    if (!equipoId) {
      showToast.error("Por favor selecciona un equipo.");
      return;
    }

    if (!motivo.trim()) {
      showToast.error("Por favor ingresa un motivo para la asignación.");
      return;
    }

    try {
      setLoading(true);
      await onConfirm(equipoId, motivo, tipoEquipo, ubicacionId);
      handleClose();
    } catch (error) {
      console.error('Error al asignar equipo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setEquipoId("");
    setMotivo("");
    setSearchQuery("");
    setTipoEquipo('computador');
    setUbicacionId("");
  };

  const handleTipoChange = (value: string) => {
    setTipoEquipo(value as 'computador' | 'dispositivo');
    setEquipoId(""); // Limpiar selección al cambiar tipo
  };

  // Filtrar equipos basado en la búsqueda
  const equiposFiltrados = (tipoEquipo === 'computador' ? computadoresDisponibles : dispositivosDisponibles)
    .filter(equipo => 
      equipo.serial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      equipo.codigoImgc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      equipo.modelo.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      equipo.modelo.marca.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const equiposActuales = tipoEquipo === 'computador' ? computadoresDisponibles : dispositivosDisponibles;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2 text-blue-500" />
            Asignar Equipo
          </DialogTitle>
          <DialogDescription>
            Selecciona un computador o dispositivo disponible para asignar a este empleado.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4 max-h-[70vh] overflow-y-auto">
          <Tabs value={tipoEquipo} onValueChange={handleTipoChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="computador" className="flex items-center">
                <Monitor className="h-4 w-4 mr-2" />
                Computadores ({computadoresDisponibles.length})
              </TabsTrigger>
              <TabsTrigger value="dispositivo" className="flex items-center">
                <Smartphone className="h-4 w-4 mr-2" />
                Dispositivos ({dispositivosDisponibles.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="computador" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="equipo">Computador Disponible</Label>
                {loadingEquipos ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Cargando computadores...</span>
                  </div>
                ) : (
                  <Select value={equipoId} onValueChange={setEquipoId}>
                    <SelectTrigger className="h-12">
                      <div className="flex items-center w-full">
                        <Search className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                        <SelectValue placeholder="Buscar y seleccionar un computador..." />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Buscar por serial, código, modelo o marca..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-8"
                        />
                      </div>
                      {equiposFiltrados.map((equipo) => (
                        <SelectItem key={equipo.id} value={equipo.id}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">
                              {equipo.modelo.marca.nombre} {equipo.modelo.nombre}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">
                              {equipo.serial} | {equipo.codigoImgc} | {equipo.estado}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                      {equiposFiltrados.length === 0 && (
                        <div className="p-4 text-center text-gray-500">
                          {searchQuery ? 'No se encontraron computadores con esa búsqueda' : 'No hay computadores disponibles'}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="dispositivo" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="equipo-dispositivo">Dispositivo Disponible</Label>
                {loadingEquipos ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Cargando dispositivos...</span>
                  </div>
                ) : (
                  <Select value={equipoId} onValueChange={setEquipoId}>
                    <SelectTrigger className="h-12">
                      <div className="flex items-center w-full">
                        <Search className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                        <SelectValue placeholder="Buscar y seleccionar un dispositivo..." />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Buscar por serial, código, modelo o marca..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-8"
                        />
                      </div>
                      {equiposFiltrados.map((equipo) => (
                        <SelectItem key={equipo.id} value={equipo.id}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">
                              {equipo.modelo.marca.nombre} {equipo.modelo.nombre}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">
                              {equipo.serial} | {equipo.codigoImgc} | {equipo.estado}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                      {equiposFiltrados.length === 0 && (
                        <div className="p-4 text-center text-gray-500">
                          {searchQuery ? 'No se encontraron dispositivos con esa búsqueda' : 'No hay dispositivos disponibles'}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="grid gap-2">
            <Label htmlFor="motivo">Motivo de Asignación</Label>
            <Textarea
              id="motivo"
              placeholder="Describe el motivo de la asignación..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="ubicacion">Ubicación</Label>
            {loadingUbicaciones ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Cargando ubicaciones...</span>
              </div>
            ) : (
              <Select value={ubicacionId} onValueChange={setUbicacionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una ubicación..." />
                </SelectTrigger>
                <SelectContent>
                  {ubicaciones.map((ubicacion) => (
                    <SelectItem key={ubicacion.id} value={ubicacion.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{ubicacion.nombre}</span>
                        {ubicacion.descripcion && (
                          <span className="text-sm text-gray-500">{ubicacion.descripcion}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading || !equipoId || !motivo.trim() || !ubicacionId}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Asignando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Asignar {tipoEquipo === 'computador' ? 'Computador' : 'Dispositivo'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

