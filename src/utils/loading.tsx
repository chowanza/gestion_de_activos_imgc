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

// Standardized loading component with consistent design
interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner = ({
  message = "Cargando...",
  size = 'md',
  className = ""
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <div className="flex flex-col items-center">
        <div className={`relative ${sizeClasses[size]}`}>
          {/* Outer ring - ping animation */}
          <div className="absolute inset-0 border-4 border-orange-500/30 rounded-full animate-ping"></div>
          {/* Middle ring - fast spin */}
          <div className="absolute inset-1 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin [animation-duration:1.5s]"></div>
          {/* Inner ring - faster spin */}
          <div className="absolute inset-2 border-4 border-t-orange-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          {/* Innermost ring - slowest spin */}
          <div className="absolute inset-6 border-4 border-b-blue-500 border-t-transparent border-r-transparent border-l-transparent rounded-full animate-spin-slower"></div>
        </div>
        {message && (
          <div className={`mt-3 text-orange-500 font-mono ${textSizeClasses[size]} tracking-wider text-center`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

// Componente de loading general (legacy - use LoadingSpinner instead)
export const Loading = () => (
  <LoadingSpinner message="Cargando..." />
);

// Full page loading component
export const PageLoading = ({ message = "Cargando página..." }: { message?: string }) => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner message={message} size="lg" />
  </div>
);

// Inline loading component for buttons/forms
export const InlineLoading = ({ message = "Procesando..." }: { message?: string }) => (
  <LoadingSpinner message={message} size="sm" className="py-2" />
);