"use client";

import { useState, useEffect } from "react";
import { UsuarioTable } from "@/components/usuarios-table";

import Loading from "@/utils/loading";
import { AsignacionesTable } from "@/components/asignaciones-table";

async function fetchData() {
  try {
    const response = await fetch("/api/asignaciones");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status.toString()}`);
    }
    const result: any[] = await response.json();
    return result;
  } catch (e: any) {
    throw new Error(e.message);
  }
}

export default function asignacionesPage() {
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

 

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <AsignacionesTable data={data.length > 0 ? data : []} />
    </div>
  );
}