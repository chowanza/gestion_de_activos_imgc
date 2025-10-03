'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Select from 'react-select';
import { showToast } from "nextjs-toast-notify";
import Link from 'next/link';
import { RadioGroupItem, RadioGroup } from '@/components/ui/radio-group';
import { reactSelectStyles } from '@/utils/reactSelectStyles';

// --- Interfaces y Tipos ---
interface Modelo {
    id: string;
    nombre: string;
    tipo: string;
}

interface Ubicacion {
    id: string;
    nombre: string;
}

interface Usuario {
    value: string;
    label: string;
    cargo: string;
    departamento: string;
    empresa: string;
}

export interface DispositivoFormData {
    id?: string;
    modeloId: string;
    serial: string;
    estado: string;
    codigoImgc: string;
    ubicacionId?: string;
    mac?: string;
    ip?: string;
    // Información de compra
    fechaCompra?: string;
    numeroFactura?: string;
    proveedor?: string;
    monto?: number;
}

interface DispositivoFormProps {
    onSubmit: (data: DispositivoFormData) => void;
    initialData?: DispositivoFormData | null;
    isEditing?: boolean;
    onCancel?: () => void;
}

export default function DispositivoForm({ 
    onSubmit, 
    initialData = null, 
    isEditing = false, 
    onCancel 
}: DispositivoFormProps) {
    const [formData, setFormData] = useState<DispositivoFormData>({
        id: initialData?.id || undefined,
        modeloId: initialData?.modeloId || '',
        serial: initialData?.serial || '',
        estado: initialData?.estado || 'OPERATIVO',
        codigoImgc: initialData?.codigoImgc || '',
        ubicacionId: initialData?.ubicacionId || '',
        mac: initialData?.mac || '',
        ip: initialData?.ip || '',
        fechaCompra: initialData?.fechaCompra || '',
        numeroFactura: initialData?.numeroFactura || '',
        proveedor: initialData?.proveedor || '',
        monto: initialData?.monto || undefined,
    });

    const [modelos, setModelos] = useState<Modelo[]>([]);
    const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
    const [loading, setLoading] = useState(true);

    // Cargar datos iniciales
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [modelosRes, ubicacionesRes] = await Promise.all([
                    fetch('/api/modelos'),
                    fetch('/api/ubicaciones')
                ]);

                if (modelosRes.ok) {
                    const modelosData = await modelosRes.json();
                    // Filtrar solo modelos de dispositivos
                    const modelosDispositivos = modelosData.filter((modelo: Modelo) => 
                        ['Impresora', 'Cámara', 'Tablet', 'Smartphone', 'Monitor', 'Teclado', 'Mouse', 'Router', 'Switch', 'Proyector', 'Escáner', 'Altavoces', 'Micrófono', 'Webcam'].includes(modelo.tipo)
                    );
                    setModelos(modelosDispositivos);
                }

                if (ubicacionesRes.ok) {
                    const ubicacionesData = await ubicacionesRes.json();
                    setUbicaciones(ubicacionesData);
                }
            } catch (error) {
                console.error('Error loading data:', error);
                showToast.error('Error al cargar los datos');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleSelectChange = (option: any) => {
        setFormData(prev => ({
            ...prev,
            modeloId: option?.value || ''
        }));
    };

    const handleUbicacionChange = (option: any) => {
        setFormData(prev => ({
            ...prev,
            ubicacionId: option?.value || ''
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        // Validaciones básicas
        if (!formData.modeloId) {
            showToast.error('Por favor seleccione un modelo');
            return;
        }
        if (!formData.serial.trim()) {
            showToast.error('Por favor ingrese el serial');
            return;
        }
        if (!formData.codigoImgc.trim()) {
            showToast.error('Por favor ingrese el código IMGC');
            return;
        }

        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    const modeloOptions = modelos.map(modelo => ({
        value: modelo.id,
        label: modelo.nombre
    }));

    const ubicacionOptions = ubicaciones.map(ubicacion => ({
        value: ubicacion.id,
        label: ubicacion.nombre
    }));

    const selectedModelValue = modeloOptions.find(option => option.value === formData.modeloId) || null;
    const selectedUbicacionValue = ubicacionOptions.find(option => option.value === formData.ubicacionId) || null;

    if (loading) {
        return <div className="flex justify-center items-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información Básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="serial">Serial *</Label>
                        <Input
                            id="serial"
                            value={formData.serial}
                            onChange={handleInputChange}
                            placeholder="Serial del dispositivo"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="codigoImgc">Código IMGC *</Label>
                        <Input
                            id="codigoImgc"
                            value={formData.codigoImgc}
                            onChange={handleInputChange}
                            placeholder="Código IMGC"
                            required
                        />
                    </div>
                </div>

                {/* Estado del Dispositivo */}
                <div className="space-y-2">
                    <Label>Estado del Dispositivo</Label>
                    <div className="flex items-center space-x-2 p-3 border rounded-md bg-blue-50 text-blue-800">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            {formData.estado}
                        </Badge>
                        <span className="text-sm">
                            El estado del dispositivo se gestiona desde la opción "Gestionar Estado" en la pantalla de detalles del dispositivo.
                        </span>
                    </div>
                </div>

                {/* Modelo */}
                <div className="space-y-2">
                    <Label>Modelo *</Label>
                    <Select
                        instanceId="dispositivo-modeloId"
                        options={modeloOptions}
                        value={selectedModelValue}
                        onChange={handleSelectChange}
                        placeholder="Seleccionar modelo"
                        isSearchable
                        styles={reactSelectStyles}
                        required
                    />
                </div>

                {/* Ubicación */}
                <div className="space-y-2">
                    <Label>Ubicación</Label>
                    <Select
                        instanceId="dispositivo-ubicacionId"
                        options={ubicacionOptions}
                        value={selectedUbicacionValue}
                        onChange={handleUbicacionChange}
                        placeholder="Seleccionar ubicación"
                        isSearchable
                        styles={reactSelectStyles}
                        isClearable
                    />
                </div>

                {/* Información de Red */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="mac">Dirección MAC</Label>
                        <Input
                            id="mac"
                            value={formData.mac || ''}
                            onChange={handleInputChange}
                            placeholder="Ej: a1:b2:c3:d4:e5:f6"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ip">Dirección IP</Label>
                        <Input
                            id="ip"
                            value={formData.ip || ''}
                            onChange={handleInputChange}
                            placeholder="Ej: 192.168.1.100"
                        />
                    </div>
                </div>

                {/* Información de Compra */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Información de Compra</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fechaCompra">Fecha de Compra</Label>
                            <Input
                                id="fechaCompra"
                                type="date"
                                value={formData.fechaCompra || ''}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="numeroFactura">Número de Factura</Label>
                            <Input
                                id="numeroFactura"
                                value={formData.numeroFactura || ''}
                                onChange={handleInputChange}
                                placeholder="Número de factura"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="proveedor">Proveedor</Label>
                            <Input
                                id="proveedor"
                                value={formData.proveedor || ''}
                                onChange={handleInputChange}
                                placeholder="Proveedor del dispositivo"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="monto">Monto</Label>
                            <Input
                                id="monto"
                                type="number"
                                step="0.01"
                                value={formData.monto || ''}
                                onChange={handleInputChange}
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-4 pt-4">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancelar
                        </Button>
                    )}
                    <Button type="submit" className="bg-primary hover:bg-primary/90">
                        {isEditing ? 'Actualizar Dispositivo' : 'Crear Dispositivo'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
