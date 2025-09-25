"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ComputadorForm from "@/components/ComputadorForm";
import type { ComputadorFormData } from "@/components/ComputadorForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { showToast } from "nextjs-toast-notify";
import { Spinner } from "@/components/ui/spinner"; // Asumiendo que tienes un componente Spinner
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";

export default function EditarComputadorPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [initialData, setInitialData] = useState<ComputadorFormData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            const fetchComputador = async () => {
                try {
                    const response = await fetch(`/api/computador/${id}`);
                    if (!response.ok) throw new Error("No se pudo cargar el computador.");
                    const data = await response.json();
                    setInitialData(data);
                } catch (error: any) {
                    showToast.error(error.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchComputador();
        }
    }, [id]);

    const handleUpdateComputador = async (data: ComputadorFormData) => {
        try {
            const response = await fetch(`/api/computador/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error al actualizar");
            }

            showToast.success("Computador actualizado con éxito");
            router.push(`/computadores/${id}/details`);
            router.refresh();
        } catch (error: any) {
            showToast.error(`Error: ${error.message}`);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    const handleDelete = async () => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este computador?")) {
            return;
        }

        try {
            const response = await fetch(`/api/computador/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error al eliminar");
            }

            showToast.success("Computador eliminado exitosamente");
            router.push("/computadores");
        } catch (error: any) {
            showToast.error(error.message);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
    }

    if (!initialData) {
        return <div>Computador no encontrado.</div>;
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
                            <CardTitle>Editar Computador</CardTitle>
                            <CardDescription>Actualice los detalles del computador con serial: {initialData.serial}</CardDescription>
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
                <ComputadorForm
                    onSubmit={handleUpdateComputador}
                    initialData={initialData}
                    isEditing={true}
                    onCancel={handleCancel}
                />
            </CardContent>
        </Card>
    );
}