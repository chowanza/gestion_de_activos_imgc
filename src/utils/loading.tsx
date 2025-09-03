import React from 'react'
import { TableCell, TableRow} from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';



interface TableRowSkeletonProps {
  columnCount?: number;
}

const TableRowSkeleton = ({ columnCount = 5 }: TableRowSkeletonProps) => (
  <TableRow>
    {Array.from({ length: columnCount }).map((_, index) => (
      <TableCell key={index}>
        <Skeleton className="h-4 w-full rounded" />
      </TableCell>
    ))}
  </TableRow>
);

export default TableRowSkeleton;
