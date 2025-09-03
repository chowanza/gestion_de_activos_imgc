"use client";

import { useState, useEffect } from "react";
import Loading from "@/utils/loading";
import LineaForm from "@/components/LineaForm";
import { LineasTable } from "@/components/lineas-table";

async function fetchData() {
  try {
    const response = await fetch("/api/lineas");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status.toString()}`);
    }
    const result: any[] = await response.json();
    return result;
  } catch (e: any) {
    throw new Error(e.message);
  }
}

interface LineasContainerProps {
  onCreateModel: (formData: FormData) => Promise<void>;
  children?: React.ReactNode;
}
function LineasContainer({ onCreateModel, children }: LineasContainerProps) {
  return <div>{children}</div>;
}

export default function LineaPage() {
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

  const handleCreateModel = async (formData: FormData) => {
    try {
      const response = await fetch("/api/lineas", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status.toString()}`);
      }

      // Refresh data after creating a new model
      const result = await fetchData();
      setData(result);
    } catch (e: any) {
      setError(e.message);
    }
  };


  if (loading) {
    return <Loading  />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <LineasContainer onCreateModel={handleCreateModel}>
      <LineasTable data={data.length > 0 ? data : []} />
    </LineasContainer>
  );
}