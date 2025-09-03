"use client";

import { useState, useEffect } from "react";
import { DispositivoTable } from "@/components/equipos-table";
import  Loading  from "@/utils/loading";

interface DispositivoContainerProps {
  onCreateModel: (formData: FormData) => Promise<void>;
  children?: React.ReactNode;
}
function DispositivoContainer({ onCreateModel, children }: DispositivoContainerProps) {
  return <div>{children}</div>;
}

async function fetchData() {
  try {
    const response = await fetch("/api/dispositivos");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status.toString()}`);
    }
    const result: any[] = await response.json();
    return result;
  } catch (e: any) {
    throw new Error(e.message);
  }
}

export default function DispositivoPage() {
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
      const response = await fetch("/api/dispositivos", {
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
    <DispositivoContainer onCreateModel={handleCreateModel}>
      <DispositivoTable data={data.length > 0 ? data : []} />
    </DispositivoContainer>
  );
}
