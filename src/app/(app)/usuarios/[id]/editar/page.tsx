"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { showToast } from "nextjs-toast-notify";
import { Spinner } from "@/components/ui/spinner"; // Asumiendo que tienes un componente Spinner
import UsuarioForm, { UsuarioFormData } from "@/components/UsuarioForm";

export default function EditarUsuarioPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [initialData, setInitialData] = useState<UsuarioFormData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            const fetchUsuario = async () => {
                try {
                    const response = await fetch(`/api/usuarios/${id}`);
                    if (!response.ok) throw new Error("No se pudo cargar el Usuario.");
                    const data = await response.json();
                    setInitialData(data);
                } catch (error: any) {
                    showToast.error(error.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchUsuario();
        }
    }, [id]);

    const handleUpdateUsuario = async (data: UsuarioFormData) => {
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

            showToast.success("Usuario actualizado con éxito");
            router.push('/usuarios');
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
                <CardTitle>Editar Usuario</CardTitle>
                <CardDescription>Actualice los detalles del Usuario: {initialData.nombre}</CardDescription>
            </CardHeader>
            <CardContent>
                <UsuarioForm
                    onSubmit={handleUpdateUsuario}
                    initialData={initialData}
                    isEditing={true}
                />
            </CardContent>
        </Card>
    );
}