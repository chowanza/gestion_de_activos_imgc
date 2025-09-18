import React from 'react'
import { TableCell, TableRow} from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';



interface TableRowSkeletonProps {
  columnCount?: number;
}

const TableRowSkeleton = ({ columnCount = 5 }: TableRowSkeletonProps) => {
  // Asegurar que columnCount sea un número válido
  const safeColumnCount = Math.max(1, Math.min(columnCount, 20));
  
  return (
    <TableRow>
      {Array.from({ length: safeColumnCount }).map((_, index) => (
        <TableCell key={`skeleton-cell-${index}`}>
          <Skeleton className="h-4 w-full rounded" />
        </TableCell>
      ))}
    </TableRow>
  );
};

export default TableRowSkeleton;

// Componente de loading general
export const Loading = () => (
  <div className="flex items-center justify-center p-8">
    <div className="flex flex-col items-center">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-orange-500/30 rounded-full animate-ping"></div>
        <div className="absolute inset-2 border-4 border-t-orange-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
      <div className="mt-4 text-orange-500 font-mono text-sm tracking-wider">Cargando...</div>
    </div>
  </div>
);