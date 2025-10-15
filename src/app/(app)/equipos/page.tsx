"use client";
export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Cpu, Monitor, ArrowLeft } from "lucide-react";
import { ComputadorTable } from "@/components/computador-table";
import { DispositivoTable } from "@/components/equipos-table";
import { useRouter } from "next/navigation";

export default function EquiposPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Equipos</h1>
        <p className="text-gray-600">Gestiona todos los equipos de la organización</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-xl font-semibold text-gray-800">
            Inventario de Equipos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="computadores" className="w-full">
            <div className="border-b border-gray-200">
              <TabsList className="bg-gray-50 p-1 m-4 w-fit">
                <TabsTrigger
                  value="computadores"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#167DBA] data-[state=active]:shadow-sm"
                >
                  <Cpu className="h-4 w-4 mr-2" />
                  Computadores
                </TabsTrigger>
                <TabsTrigger
                  value="dispositivos"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#167DBA] data-[state=active]:shadow-sm"
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Dispositivos
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="computadores" className="mt-0">
              <div className="p-6">
                <ComputadorTable data={[]} />
              </div>
            </TabsContent>

            <TabsContent value="dispositivos" className="mt-0">
              <div className="p-6">
                <DispositivoTable data={[]} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
