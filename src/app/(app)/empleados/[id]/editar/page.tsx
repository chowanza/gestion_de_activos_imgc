"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { showToast } from "nextjs-toast-notify";
import { Spinner } from "@/components/ui/spinner"; // Asumiendo que tienes un componente Spinner
import EmpleadoForm, { EmpleadoFormData } from "@/components/EmpleadoForm";

// Función para convertir fecha dd/mm/yy a formato ISO
function convertToISOFormat(dateString: string): string {
    if (!dateString) return '';
    
    // Si ya está en formato ISO, devolverlo tal como está
    if (dateString.includes('-')) return dateString;
    
    // Si está en formato dd/mm/yy, convertir a ISO
    if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        const fullYear = year.length === 2 ? `20${year}` : year;
        const isoDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        // Ajustar para evitar problemas de zona horaria
        const date = new Date(isoDate + 'T00:00:00');
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        return localDate.toISOString().split('T')[0];
    }
    
    return dateString;
}

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
                    
                    // Mapear campos de la API al formato del formulario
                    const mappedData: EmpleadoFormData = {
                        id: data.id,
                        empresaId: data.departamento?.empresa?.id || '',
                        departamentoId: data.departamentoId,
                        nombre: data.nombre,
                        apellido: data.apellido,
                        cedula: data.ced, // Mapear ced a cedula
                        fechaNacimiento: data.fechaNacimiento ? convertToISOFormat(data.fechaNacimiento) : '',
                        fechaIngreso: data.fechaIngreso ? convertToISOFormat(data.fechaIngreso) : '',
                        cargoId: data.cargoId,
                    };
                    
                    setInitialData(mappedData);
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