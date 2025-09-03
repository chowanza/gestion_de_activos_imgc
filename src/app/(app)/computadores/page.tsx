"use client";

import { useState, useEffect } from "react";
import { ComputadorTable } from "@/components/computador-table";
import Loading from "@/utils/loading";

async function fetchData() {
  try {
    const response = await fetch("/api/computador");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status.toString()}`);
    }
    const result: any[] = await response.json();
    return result;
  } catch (e: any) {
    throw new Error(e.message);
  }
}

export default function ComputadorPage() {
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

  const handleCreateComputador = async (formData: FormData) => {
    try {
      const response = await fetch("/api/computador", {
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
    return <Loading  />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <ComputadorTable data={data.length > 0 ? data : []} />
    </div>
  );
}
