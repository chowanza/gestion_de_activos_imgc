"use client";

import { EmpresasTable } from "@/components/empresas-table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EmpresasPage() {
  const router = useRouter();
  
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Empresas</h1>
        <p className="text-muted-foreground">
          Administra las empresas.
        </p>
      </div>
      
      <EmpresasTable />
    </div>
  );
}