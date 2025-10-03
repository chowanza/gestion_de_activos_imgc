

"use client";

import ComputadorForm from "@/components/ComputadorForm";
import type { ComputadorFormData } from "@/components/ComputadorForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { showToast } from "nextjs-toast-notify";
import { useQueryClient } from "@tanstack/react-query";

export default function NuevoComputadorPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

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
            
            const newComputador = await response.json();
            
            // Invalidar cache del dashboard para reflejar el nuevo computador
            await queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
            await queryClient.invalidateQueries({ queryKey: ['computador', 'lista'] });
            
            showToast.success("Computador creado con éxito");
            
            // Redirigir a la página de detalles del computador recién creado
            router.push(`/computadores/${newComputador.id}/details`);
            router.refresh();
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
