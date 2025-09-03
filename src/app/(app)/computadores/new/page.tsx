

"use client";

import ComputadorForm from "@/components/ComputadorForm";
import type { ComputadorFormData } from "@/components/ComputadorForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { showToast } from "nextjs-toast-notify";

export default function NuevoComputadorPage() {
    const router = useRouter();

    const handleCreateComputador = async (data: ComputadorFormData) => {
        try {
            const response = await fetch('/api/computador', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error al crear el computador");
            }
            
            showToast.success("Computador creado con éxito");
            router.push('/computadores'); // Redirigir a la lista
            router.refresh(); // Opcional: para forzar la actualización de datos en la página de lista
        } catch (error: any) {
            showToast.error(`Error: ${error.message}`);
        }
    };

    return (
        <Card className="m-2">
            <CardHeader>
                <CardTitle>Agregar Nuevo Computador</CardTitle>
                <CardDescription>Complete los detalles para registrar una nueva instancia de computador.</CardDescription>
            </CardHeader>
            <CardContent>
                <ComputadorForm onSubmit={handleCreateComputador} />
            </CardContent>
        </Card>
    );
}
