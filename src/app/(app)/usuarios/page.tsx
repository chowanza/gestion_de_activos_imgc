"use client";
"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { EmpleadoTable } from "@/components/empleados-table";

import Loading from "@/utils/loading";

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

export default function usuariosPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleCreateusuarios = async (formData: FormData) => {
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


  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Gestión de Empleados</h1>
        <p className="text-sm text-gray-600 mt-1">Administra la información de los empleados de la empresa</p>
      </div>
      <EmpleadoTable data={data.length > 0 ? data : []} />
    </div>
  );
}
