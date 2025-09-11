"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Building2, Users, MapPin, Calendar, FileText } from "lucide-react";

interface EmpresaDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  empresa: {
    id: string;
    nombre: string;
    descripcion?: string;
    logo?: string;
    createdAt: string;
    updatedAt: string;
    departamentos?: {
      id: string;
      nombre: string;
      gerente?: {
        id: string;
        nombre: string;
        apellido: string;
      } | null;
      empleados: {
        id: string;
        nombre: string;
        apellido: string;
        cargo?: {
          nombre: string;
        } | null;
      }[];
      computadores: any[];
      dispositivos: any[];
    }[];
  } | null;
}

export const EmpresaDetails: React.FC<EmpresaDetailsProps> = ({
  isOpen,
  onClose,
  empresa,
}) => {
  const [empresaData, setEmpresaData] = useState<EmpresaDetailsProps['empresa'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && empresa) {
      fetchEmpresaDetails(empresa.id);
    }
  }, [isOpen, empresa]);

  const fetchEmpresaDetails = async (empresaId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/empresas/${empresaId}`);
      if (!response.ok) {
        throw new Error('Error al cargar detalles de la empresa');
      }
      const data = await response.json();
      setEmpresaData(data);
    } catch (error) {
      console.error('Error fetching empresa details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!empresa) return null;

  const totalEmpleados = empresaData?.departamentos?.reduce((total, depto) => total + depto.empleados.length, 0) || 0; 
  const totalComputadores = empresaData?.departamentos?.reduce((total, depto) => total + depto.computadores.length, 0) || 0;                                                                                                                        
  const totalDispositivos = empresaData?.departamentos?.reduce((total, depto) => total + depto.dispositivos.length, 0) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            {empresa.nombre}
          </DialogTitle>
          <DialogDescription>
            Perfil completo de la empresa y sus departamentos
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Información general */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  {empresaData?.logo && (
                    <img
                      src={empresaData.logo}
                      alt={`Logo de ${empresa.nombre}`}
                      className="w-24 h-24 object-cover rounded-lg border"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="text-lg font-semibold">{empresa.nombre}</h3>
                      {empresaData?.descripcion && (
                        <p className="text-muted-foreground">{empresaData.descripcion}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Creada: {new Date(empresa.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {totalEmpleados} empleados
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estadísticas generales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Total Empleados</p>
                      <p className="text-2xl font-bold">{totalEmpleados}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Departamentos</p>
                      <p className="text-2xl font-bold">{empresaData?.departamentos?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium">Equipos</p>
                      <p className="text-2xl font-bold">{totalComputadores + totalDispositivos}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Departamentos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Departamentos ({empresaData?.departamentos?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {empresaData?.departamentos?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No hay departamentos registrados
                  </p>
                ) : (
                  <div className="space-y-4">
                    {empresaData?.departamentos?.map((departamento) => (
                      <div key={departamento.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{departamento.nombre}</h4>
                          <Badge variant="secondary">
                            {departamento.empleados.length} empleados
                          </Badge>
                        </div>
                        
                        {departamento.gerente && (
                          <p className="text-sm text-muted-foreground mb-2">
                            Gerente: {departamento.gerente.nombre} {departamento.gerente.apellido}
                          </p>
                        )}

                        {departamento.empleados.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Empleados:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {departamento.empleados.map((empleado) => (
                                <div key={empleado.id} className="flex items-center gap-2 text-sm">
                                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                                  <span>{empleado.nombre} {empleado.apellido}</span>
                                  {empleado.cargo && (
                                    <Badge variant="outline" className="text-xs">
                                      {empleado.cargo.nombre}
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <Separator className="my-2" />
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Computadores: {departamento.computadores.length}</span>
                          <span>Dispositivos: {departamento.dispositivos.length}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
