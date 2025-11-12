"use client";
export const dynamic = 'force-dynamic';

import DispositivoForm from "@/components/DispositivoForm";
import type { DispositivoFormData } from "@/components/DispositivoForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { showToast } from "nextjs-toast-notify";
import { useQueryClient } from "@tanstack/react-query";

export default function NuevoDispositivoPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const handleCreateDispositivo = async (data: DispositivoFormData) => {
        try {
            const response = await fetch('/api/dispositivos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error al crear el dispositivo");
            }
            
            const newDispositivo = await response.json();
            
            // Invalidar cache del dashboard para reflejar el nuevo dispositivo
            await queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
            await queryClient.invalidateQueries({ queryKey: ['dispositivo', 'lista'] });
            
            showToast.success("Dispositivo creado con éxito");
            
            // Redirigir a la página de detalles del dispositivo recién creado
            router.push(`/dispositivos/${newDispositivo.id}/details`);
            router.refresh();
        } catch (error: any) {
            showToast.error(`Error: ${error.message}`);
        }
    };

    return (
        <Card className="m-2">
            <CardHeader>
                <CardTitle>Agregar Nuevo Dispositivo</CardTitle>
                <CardDescription>Complete los detalles para registrar una nueva instancia de dispositivo.</CardDescription>
            </CardHeader>
            <CardContent>
                <DispositivoForm onSubmit={handleCreateDispositivo} />
            </CardContent>
        </Card>
    );
}
