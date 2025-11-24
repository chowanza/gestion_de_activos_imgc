"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { EmpleadoTable } from "@/components/empleados-table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Loading } from "@/utils/loading";

async function fetchData() {
  try {
    const response = await fetch("/api/usuarios");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status.toString()}`);
    }
    const result: any[] = await response.json();
    return result;
  } catch (e: any) {
    throw new Error(e.message);
  }
}

export default function empleadosPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const result = await fetchData();
        setData(result);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleCreateEmpleados = async (formData: FormData) => {
    try {
      const response = await fetch("/api/usuarios", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status.toString()}`);
      }

      const result = await fetchData();
      setData(result);
    } catch (e: any) {
      setError(e.message);
    }
  };


  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Gestión de Empleados</h1>
            <p className="text-sm text-gray-600 mt-1">Administra la información de los empleados de la empresa</p>
          </div>
        </div>
      </div>
      <EmpleadoTable data={data.length > 0 ? data : []} />
    </div>
  );
}
