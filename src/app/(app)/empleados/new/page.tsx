"use client";
export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import EmpleadoForm, { EmpleadoFormData } from "@/components/EmpleadoForm";
import { useRouter } from "next/navigation";
import { showToast } from "nextjs-toast-notify";

export default function NuevoEmpleadoPage() {
    const router = useRouter();

    const handleCreateEmpleado = async (data: EmpleadoFormData) => {
        try {
            const response = await fetch('/api/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error al crear el Usuario");
            }
            
            showToast.success("Empleado creado con éxito");
            router.push('/empleados'); // Redirigir a la lista
            router.refresh(); // Opcional: para forzar la actualización de datos en la página de lista
        } catch (error: any) {
            showToast.error(`Error: ${error.message}`);
        }
    };

    return (
        <Card className="m-2">
            <CardHeader>
                <CardTitle>Agregar Nuevo Empleado</CardTitle>
                <CardDescription>Complete los detalles para registrar una nueva instancia de Empleado.</CardDescription>
            </CardHeader>
            <CardContent>
                <EmpleadoForm onSubmit={handleCreateEmpleado} />
            </CardContent>
        </Card>
    );
}