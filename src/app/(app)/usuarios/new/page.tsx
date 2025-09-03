

"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import UsuarioForm, { UsuarioFormData } from "@/components/UsuarioForm";
import { useRouter } from "next/navigation";
import { showToast } from "nextjs-toast-notify";

export default function NuevoUsuarioPage() {
    const router = useRouter();

    const handleCreateUsuario = async (data: UsuarioFormData) => {
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
            
            showToast.success("Usuario creado con éxito");
            router.push('/usuarios'); // Redirigir a la lista
            router.refresh(); // Opcional: para forzar la actualización de datos en la página de lista
        } catch (error: any) {
            showToast.error(`Error: ${error.message}`);
        }
    };

    return (
        <Card className="m-2">
            <CardHeader>
                <CardTitle>Agregar Nuevo Usuario</CardTitle>
                <CardDescription>Complete los detalles para registrar una nueva instancia de Usuario.</CardDescription>
            </CardHeader>
            <CardContent>
                <UsuarioForm onSubmit={handleCreateUsuario} />
            </CardContent>
        </Card>
    );
}