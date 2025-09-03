"use client";

import { useState, useEffect } from "react";
import { ModelosTable } from "@/components/modelos-table";
import ModeloForm from "@/components/ModeloForm";
import { Spinner } from "@/components/ui/spinner";
import Loading from "@/utils/loading";

async function fetchData() {
  try {
    const response = await fetch("/api/modelos");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status.toString()}`);
    }
    const result: any[] = await response.json();
    return result;
  } catch (e: any) {
    throw new Error(e.message);
  }
}

interface ModeloContainerProps {
  onCreateModel: (formData: FormData) => Promise<void>;
  children?: React.ReactNode;
}
function ModeloContainer({ onCreateModel, children }: ModeloContainerProps) {
  return <div>{children}</div>;
}

export default function ModeloPage() {
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
      const response = await fetch("/api/modelos", {
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
    return <Loading />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <ModeloContainer onCreateModel={handleCreateModel}>
      <ModelosTable data={data.length > 0 ? data : []} />
    </ModeloContainer>
  );
}