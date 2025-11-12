"use client";
export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import EmpleadoForm, { EmpleadoFormData } from "@/components/EmpleadoForm";
import { useRouter } from "next/navigation";
import { showToast } from "nextjs-toast-notify";
import { usePermissions } from "@/hooks/usePermissions";
import { useSession } from "@/hooks/useSession";

export default function NuevoEmpleadoPage() {
    const router = useRouter();
    const { hasPermission } = usePermissions();
    const { status } = useSession();
    const canCreate = hasPermission('canCreate') || hasPermission('canManageUsers');
    
    // Esperar a que cargue la sesión para evitar falsos negativos (redirect prematuro)
    if (status === 'loading') return null;

    if (!canCreate) {
        // Bloqueo de acceso a creación para roles sin permiso, sólo después de tener el status listo
        if (typeof window !== 'undefined') router.replace('/empleados');
        return null;
    }

    const handleCreateEmpleado = async (data: EmpleadoFormData) => {
        try {
            let response;
            if (data.fotoPerfil && typeof data.fotoPerfil !== 'string') {
                const formData = new FormData();
                for (const key of Object.keys(data)) {
                    const val: any = (data as any)[key];
                    if (val === undefined || val === null) continue;
                    if (key === 'fotoPerfil' && val instanceof File) {
                        formData.append('fotoPerfil', val as File);
                    } else {
                        formData.append(key, String(val));
                    }
                }

                response = await fetch('/api/usuarios', {
                    method: 'POST',
                    body: formData
                });
            } else {
                response = await fetch('/api/usuarios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
            }

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