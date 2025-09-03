'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { showToast } from 'nextjs-toast-notify';
import {
    Select as ShadcnSelect,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { LineaFormData } from './lineas-table'; // Asegúrate de que esta interfaz exista y sea correcta

type Estado = 'activa' | 'inactiva';
type Destino = 'Telefono' | 'BAM';

interface LineaFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { numero: string; proveedor: string; imei: string; estado: Estado; destino: Destino }) => void;
    initialData?: LineaFormData | null;
}

const PREFIJOS_VENEZUELA = ["0414", "0424", "0412", "0422", "0416", "0426"];

// Arriba en tu archivo LineaForm.tsx, fuera del componente

const getProveedorFromPrefijo = (prefijo: string): string => {
    if (!prefijo) return '';
    if (prefijo.endsWith('6')) return 'Movilnet';
    if (prefijo.endsWith('4')) return 'Movistar';
    return 'Digitel'; // Digitel como el caso por defecto para 0412, etc.
};

const LineaForm: React.FC<LineaFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [prefijo, setPrefijo] = useState('');
    const [numeroRestante, setNumeroRestante] = useState('');
    const [selectedProveedor, setSelectedProveedor] = useState('');
    const [imei, setImei] = useState('');
    const [estado, setEstado] = useState<Estado | ''>(''); // Nuevo estado para el campo Estado
    const [destino, setDestino] = useState<Destino | ''>(''); // Nuevo estado para el campo Destino

    const isEditing = !!initialData;

    useEffect(() => {
        if (isOpen) {
            if (isEditing && initialData) {
                const fullNumber = initialData.numero || '';
                const foundPrefix = PREFIJOS_VENEZUELA.find(p => fullNumber.startsWith(p));
                
                if (foundPrefix) {
                    setPrefijo(foundPrefix);
                    setNumeroRestante(fullNumber.substring(foundPrefix.length));
                } else {
                    setPrefijo('');
                    setNumeroRestante(fullNumber);
                }
                setSelectedProveedor(initialData.proveedor || '');
                setImei(initialData.imei || '');
            } else {
                setPrefijo('');
                setNumeroRestante('');
                setSelectedProveedor('');
                setImei('');
                setEstado('');
                setDestino('');
            }
        }
    }, [isOpen, initialData, isEditing]);

    useEffect(() => {
    if (prefijo) {
        const proveedorSugerido = getProveedorFromPrefijo(prefijo);
        setSelectedProveedor(proveedorSugerido);
    }
}, [prefijo]);

   const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!prefijo || !numeroRestante || numeroRestante.length !== 7 || !selectedProveedor) {
        showToast.warning("Complete Prefijo, 7 dígitos del número y Proveedor.", { position: "top-right" });
        return;
    }

    if (!estado || !destino) {
        showToast.warning("Seleccione Estado y Destino.", { position: "top-right" });
        return;
    }

    // --- CAMBIO AQUÍ: De FormData a Objeto JS ---
    const numeroCompleto = `${prefijo}${numeroRestante}`;
    
    const dataToSend = {
        numero: numeroCompleto,
        proveedor: selectedProveedor.trim(),
        imei: imei.trim(),
        estado: estado as Estado,
        destino: destino as Destino,
    };
    
    // El prop onSubmit ahora recibirá un objeto, no FormData
    onSubmit(dataToSend); 
};

    return (
        <Dialog open={isOpen} onOpenChange={(openValue) => !openValue && onClose()}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Línea Telefónica" : "Crear Nueva Línea Telefónica"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Modifique los detalles de la línea." : "Complete los detalles para la nueva línea."}
                    </DialogDescription>
                </DialogHeader>
                <form className="space-y-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="numero" className="text-right">Número</Label>
                        <div className="col-span-3 flex items-center gap-2">
                            <ShadcnSelect value={prefijo} onValueChange={setPrefijo}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Prefijo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PREFIJOS_VENEZUELA.map(p => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </ShadcnSelect>
                            <Input
                                id="numero"
                                type="tel"
                                value={numeroRestante}
                                onChange={(e) => setNumeroRestante(e.target.value.replace(/\D/g, ''))}
                                className="flex-grow"
                                placeholder="1234567"
                                maxLength={7}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="proveedor" className="text-right">Proveedor</Label>
                        <Input 
                            id="proveedor" 
                            value={selectedProveedor} 
                            className="col-span-3"
                            readOnly
                            disabled
                            placeholder="Se asignará automáticamente"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="imei" className="text-right">IMEI (Opcional)</Label>
                        <Input id="imei" value={imei} onChange={(e) => setImei(e.target.value)} className="col-span-3" placeholder="IMEI del dispositivo físico"/>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="estado" className="text-right">Estado</Label>
                        <div className="col-span-3">
                            <ShadcnSelect value={estado} onValueChange={(v) => setEstado(v as Estado)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleccione estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="activa">Activa</SelectItem>
                                    <SelectItem value="inactiva">Inactiva</SelectItem>
                                </SelectContent>
                            </ShadcnSelect>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="destino" className="text-right">Destino</Label>
                        <div className="col-span-3">
                            <ShadcnSelect value={destino} onValueChange={(v) => setDestino(v as Destino)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleccione destino" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Telefono">Teléfono</SelectItem>
                                    <SelectItem value="BAM">BAM</SelectItem>
                                </SelectContent>
                            </ShadcnSelect>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button
                            type="button"
                            onClick={() => {
                                // Validación similar a la anterior
                                if (!prefijo || !numeroRestante || numeroRestante.length !== 7 || !selectedProveedor) {
                                    showToast.warning("Complete Prefijo, 7 dígitos del número y Proveedor.", { position: "top-right" });
                                    return;
                                }
                                if (!estado || !destino) {
                                    showToast.warning("Seleccione Estado y Destino.", { position: "top-right" });
                                    return;
                                }

                                const numeroCompleto = `${prefijo}${numeroRestante}`;
                                const dataToSend = {
                                    numero: numeroCompleto,
                                    proveedor: selectedProveedor.trim(),
                                    imei: imei.trim(),
                                    estado: estado as Estado,
                                    destino: destino as Destino,
                                };
                                onSubmit(dataToSend);
                            }}
                        >
                            {isEditing ? "Guardar Cambios" : "Crear Línea"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default LineaForm;