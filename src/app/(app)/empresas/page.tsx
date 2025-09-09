"use client";

import { EmpresasTable } from "@/components/empresas-table";

export default function EmpresasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Empresas</h1>
        <p className="text-muted-foreground">
          Administra las empresas.
        </p>
      </div>
      
      <EmpresasTable />
    </div>
  );
}