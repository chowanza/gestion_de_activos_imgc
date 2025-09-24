"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DispositivoForm, { DispositivoFormData } from "@/components/DispositivoForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { showToast } from "nextjs-toast-notify";
import { Spinner } from "@/components/ui/spinner";
import { Trash2, ArrowLeft } from "lucide-react";

export default function EditarDispositivoPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [initialData, setInitialData] = useState<DispositivoFormData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            const fetchDispositivo = async () => {
                try {
                    const response = await fetch(`/api/dispositivos/${id}`);
                    if (!response.ok) throw new Error("No se pudo cargar el dispositivo.");
                    const data = await response.json();
                    setInitialData(data);
                } catch (error: any) {
                    showToast.error(error.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchDispositivo();
        }
    }, [id]);

    const handleUpdateDispositivo = async (data: DispositivoFormData) => {
        try {
            const response = await fetch(`/api/dispositivos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error al actualizar");
            }

            showToast.success("Dispositivo actualizado exitosamente");
            router.push(`/dispositivos/${id}/details`);
        } catch (error: any) {
            showToast.error(error.message);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este dispositivo?")) {
            return;
        }

        try {
            const response = await fetch(`/api/dispositivos/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error al eliminar");
            }

            showToast.success("Dispositivo eliminado exitosamente");
            router.push("/dispositivos");
        } catch (error: any) {
            showToast.error(error.message);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
    }

    if (!initialData) {
        return <div>Dispositivo no encontrado.</div>;
    }

    return (
        <Card className="m-4">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={handleCancel}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <CardTitle>Editar Dispositivo</CardTitle>
                            <CardDescription>Actualice los detalles del dispositivo con serial: {initialData.serial}</CardDescription>
                        </div>
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        className="flex items-center gap-2"
                    >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <DispositivoForm
                    onSubmit={handleUpdateDispositivo}
                    initialData={initialData}
                    isEditing={true}
                    onCancel={handleCancel}
                />
            </CardContent>
        </Card>
    );
}
