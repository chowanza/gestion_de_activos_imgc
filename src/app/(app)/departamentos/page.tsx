"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DepartamentoTable } from "@/components/depto-table";
import Loading from "@/utils/loading";
import { useRouter } from "next/navigation";

interface DepartamentoContainerProps {
  onCreateModel: (formData: FormData) => Promise<void>;
  children?: React.ReactNode;
}
function DepartamentoContainer({ onCreateModel, children }: DepartamentoContainerProps) {
  return <div>{children}</div>;
}

async function fetchData() {
  try {
    const response = await fetch("/api/departamentos");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status.toString()}`);
    }
    const result: any[] = await response.json();
    return result;
  } catch (e: any) {
    throw new Error(e.message);
  }
}

export default function DepartamentoPage() {
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

  const handleCreateDepartamento = async (formData: FormData) => {
    try {
      const response = await fetch("/api/departamentos", {
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


  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <DepartamentoContainer onCreateModel={handleCreateDepartamento}>
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <DepartamentoTable />
    </DepartamentoContainer>
  );
}
