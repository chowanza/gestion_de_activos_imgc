"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { showToast } from "nextjs-toast-notify";
import { Spinner } from "@/components/ui/spinner"; // Asumiendo que tienes un componente Spinner
import EmpleadoForm, { EmpleadoFormData } from "@/components/EmpleadoForm";

export default function EditarEmpleadoPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [initialData, setInitialData] = useState<EmpleadoFormData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            const fetchEmpleado = async () => {
                try {
                    const response = await fetch(`/api/usuarios/${id}`);
                    if (!response.ok) throw new Error("No se pudo cargar el Empleado.");
                    const data = await response.json();
                    setInitialData(data);
                } catch (error: any) {
                    showToast.error(error.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchEmpleado();
        }
    }, [id]);

    const handleUpdateEmpleado = async (data: EmpleadoFormData) => {
        try {
            const response = await fetch(`/api/usuarios/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error al actualizar");
            }

            showToast.success("Empleado actualizado con éxito");
            router.push('/empleados');
            router.refresh();
        } catch (error: any) {
            showToast.error(`Error: ${error.message}`);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
    }

    if (!initialData) {
        return <div>Usuario no encontrado.</div>;
    }

    return (
        <Card className="m-4">
            <CardHeader>
                <CardTitle>Editar Empleado</CardTitle>
                <CardDescription>Actualice los detalles del Empleado: {initialData.nombre}</CardDescription>
            </CardHeader>
            <CardContent>
                <EmpleadoForm
                    onSubmit={handleUpdateEmpleado}
                    initialData={initialData}
                    isEditing={true}
                />
            </CardContent>
        </Card>
    );
}