// Exportar datos a Excel
export const exportToExcel = (data: ExportData | LegacyExportData) => {
  const isLegacyData = 'movements' in data;
  let sheetData: any[][] = [];
  let headers: string[] = [];
  if (isLegacyData) {
    headers = ['Fecha', 'Acción', 'Equipo', 'Serial', 'Asignado a', 'Motivo', 'Gerente'];
    sheetData = (data as LegacyExportData).movements.map((movement: any) => [
      movement.fecha,
      movement.accion,
      movement.equipo,
      movement.serial,
      movement.asignadoA,
      movement.motivo || '-',
      movement.gerente || '-'
    ]);
  } else {
    headers = (data as ExportData).columns.map((col: any) => col.title);
    sheetData = (data as ExportData).data.map((row: any) =>
      (data as ExportData).columns.map((col: any) => row[col.key] || '-')
    );
  }
  // Agregar encabezados
  const excelData = [headers, ...sheetData];
  const worksheet = XLSX.utils.aoa_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
  const reportTypeName = isLegacyData ? 'movimientos' : (data as ExportData).reportType;
  const fileName = `reporte_${reportTypeName}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

// Importar jspdf-autotable de manera dinámica
let autoTable: any = null;

// Función para cargar autoTable dinámicamente
const loadAutoTable = async () => {
  if (!autoTable) {
    const autoTableModule = await import('jspdf-autotable');
    autoTable = autoTableModule.default;
  }
  return autoTable;
};

// Interfaces genéricas para diferentes tipos de reportes
export interface ColumnConfig {
  key: string;
  title: string;
  width: number; // Ancho relativo (0-100)
  align?: 'left' | 'center' | 'right';
}

export interface ExportData {
  reportType: 'movimientos' | 'asignaciones-activas' | 'inventario-estructura' | 'activos-por-estado' | 'modificaciones-hardware' | 'ediciones-metadatos';
  title: string;
  data: Array<Record<string, any>>;
  columns: ColumnConfig[];
  statistics?: Record<string, any>;
  filters: Record<string, any>;
}

// Mantener compatibilidad con el formato anterior
export interface LegacyExportData {
  movements: Array<{
    id: number;
    fecha: string;
    accion: string;
    equipo: string;
    serial: string;
    asignadoA: string;
    motivo?: string;
    gerente?: string;
  }>;
  statistics: {
    totalMovements: number;
    assignmentsCount: number;
    maintenanceCount: number;
    returnCount: number;
    safeguardCount: number;
    byCompany: Array<{ empresa: string; count: number }>;
    byDepartment: Array<{ departamento: string; count: number }>;
    byEmployee: Array<{ empleado: string; count: number }>;
  };
  filters: {
    startDate: string;
    endDate: string;
    actionType?: string;
    itemType?: string;
    empresa?: string;
    departamento?: string;
    empleado?: string;
  };
}

export const exportToPDF = async (data: ExportData | LegacyExportData) => {
  // Determinar si es formato nuevo o legacy
  // Determinar orientación basada en el número de columnas
  const isLegacyData = 'movements' in data;
  const columnCount = isLegacyData ? 7 : (data as ExportData).columns.length;
  const needsLandscape = columnCount > 8;
  const doc = new jsPDF(needsLandscape ? 'landscape' : 'portrait');
  const autoTablePlugin = await loadAutoTable();

  // Logo
  try {
    const logoResponse = await fetch('/img/logo.png');
    const logoBlob = await logoResponse.blob();
    const logoBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(logoBlob);
    });
    doc.addImage(logoBase64, 'PNG', 20, 10, 20, 8);
  } catch (error) {
    console.warn('No se pudo cargar el logo:', error);
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Título
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  const titleText = isLegacyData ? 'Reporte de Movimientos de Equipos' : (data as ExportData).title;
  const titleWidth = doc.getTextWidth(titleText);
  doc.text(titleText, (pageWidth - titleWidth) / 2, 25);

  // Período
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  if (!isLegacyData && (data as ExportData).filters.startDate && (data as ExportData).filters.endDate) {
    const periodText = `Período: ${(data as ExportData).filters.startDate} - ${(data as ExportData).filters.endDate}`;
    const periodWidth = doc.getTextWidth(periodText);
    doc.text(periodText, (pageWidth - periodWidth) / 2, 35);
  }

  // Fecha generado
  const generatedText = `Generado: ${new Date().toLocaleDateString('es-ES')}`;
  const generatedWidth = doc.getTextWidth(generatedText);
  doc.text(generatedText, (pageWidth - generatedWidth) / 2, 45);

  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(20, 55, pageWidth - 20, 55);

  let startY = 70;

  // Estadísticas
  const stats = isLegacyData ? (data as LegacyExportData).statistics : (data as ExportData).statistics;
  if (stats) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const statsTitle = 'Estadísticas Generales';
    const statsTitleWidth = doc.getTextWidth(statsTitle);
    doc.text(statsTitle, (pageWidth - statsTitleWidth) / 2, startY);
    startY += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (isLegacyData) {
      const legacyStats = stats as LegacyExportData['statistics'];
      const leftColumnX = pageWidth / 2 - 60;
      const rightColumnX = pageWidth / 2 + 20;
      doc.text(`Total de movimientos: ${legacyStats.totalMovements}`, leftColumnX, startY);
      doc.text(`Asignaciones: ${legacyStats.assignmentsCount}`, leftColumnX, startY + 10);
      doc.text(`Mantenimientos: ${legacyStats.maintenanceCount}`, leftColumnX, startY + 20);
      doc.text(`Devoluciones: ${legacyStats.returnCount}`, rightColumnX, startY);
      doc.text(`Resguardo: ${legacyStats.safeguardCount}`, rightColumnX, startY + 10);
      startY += 40;
    } else {
      const leftColumnX = pageWidth / 2 - 80;
      const rightColumnX = pageWidth / 2 + 20;
      // Only show these fields if they exist
      if ('totalEmpleados' in stats) {
        doc.text(`Total Empleados: ${(stats as any).totalEmpleados}`, leftColumnX, startY);
      }
      if ('empleadosActivos' in stats) {
        doc.text(`Empleados Activos: ${(stats as any).empleadosActivos || 0}`, leftColumnX, startY + 10);
      }
      if ('empleadosInactivos' in stats) {
        doc.text(`Empleados Inactivos: ${(stats as any).empleadosInactivos || 0}`, leftColumnX, startY + 20);
      }
      if ('totalEquiposAsignados' in stats) {
        doc.text(`Total Equipos Asignados: ${(stats as any).totalEquiposAsignados || 0}`, rightColumnX, startY);
      }
      if ('porEmpresa' in stats) {
        const empresaText = typeof (stats as any).porEmpresa === 'string'
          ? (stats as any).porEmpresa
          : Object.entries((stats as any).porEmpresa).map(([empresa, count]) => `${empresa}: ${count}`).join(', ');
        doc.text(`Distribución por Empresa:`, leftColumnX, startY + 30);
        doc.text(empresaText, leftColumnX + 5, startY + 40);
      }
      if ('porDepartamento' in stats) {
        const deptText = typeof (stats as any).porDepartamento === 'string'
          ? (stats as any).porDepartamento
          : Object.entries((stats as any).porDepartamento).map(([dept, count]) => `${dept}: ${count}`).join(', ');
        doc.text(`Distribución por Departamento:`, rightColumnX, startY + 30);
        doc.text(deptText, rightColumnX + 5, startY + 40);
      }
      startY += 60;
      // Fallback: show up to 6 generic stats if above are missing
      if (!('totalEmpleados' in stats) && !('empleadosActivos' in stats) && !('empleadosInactivos' in stats) && !('totalEquiposAsignados' in stats)) {
        const statsEntries = Object.entries(stats).slice(0, 6);
        statsEntries.forEach(([key, value], index) => {
          const x = index % 2 === 0 ? leftColumnX : rightColumnX;
          const y = startY + (Math.floor(index / 2) * 10);
          const displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
          doc.text(`${displayKey}: ${value}`, x, y);
        });
        startY += 30;
      }
    }
    doc.line(20, startY, pageWidth - 20, startY);
    startY += 15;
  }

  // Tabla
  let tableData: any[][] = [];
  let headers: string[] = [];
  let columnStyles: Record<number, any> = {};
  if (isLegacyData) {
    tableData = (data as LegacyExportData).movements.map((movement: any) => [
      movement.fecha,
      movement.accion,
      movement.equipo,
      movement.serial,
      movement.asignadoA,
      movement.motivo || '-',
      movement.gerente || '-'
    ]);
    headers = ['Fecha', 'Acción', 'Equipo', 'Serial', 'Asignado a', 'Motivo', 'Gerente'];
    columnStyles = {
      0: { halign: 'center', cellWidth: 25 },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'left', cellWidth: 35 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'left', cellWidth: 30 },
      5: { halign: 'left', cellWidth: 40 },
      6: { halign: 'center', cellWidth: 20 }
    };
  } else {
    tableData = (data as ExportData).data.map((row: any) =>
      (data as ExportData).columns.map((col: any) => row[col.key] || '-')
    );
    headers = (data as ExportData).columns.map((col: any) => col.title);
    (data as ExportData).columns.forEach((col: any, index: number) => {
      const totalWidth = needsLandscape ? 250 : 150;
      columnStyles[index] = {
        halign: col.align || 'left',
        cellWidth: (col.width / 100) * totalWidth
      };
    });
  }

  autoTablePlugin(doc, {
    head: [headers],
    body: tableData,
    startY: startY,
    margin: { left: 15, right: 15 },
    styles: {
      fontSize: needsLandscape ? 7 : 8,
      cellPadding: needsLandscape ? 3 : 4,
      halign: 'center',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: columnStyles
  });

  // Pie de página
  const finalY = (doc as any).lastAutoTable.finalY || 200;
  const footerY = Math.max(finalY + 20, pageHeight - 30);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const reportTypeName = isLegacyData ? 'movimientos' : (data as ExportData).reportType;
  const footerText = `Sistema de Gestión de Activos IMGC - Reporte ${reportTypeName} - Página 1`;
  const footerWidth = doc.getTextWidth(footerText);
  doc.text(footerText, (pageWidth - footerWidth) / 2, footerY);
  doc.setLineWidth(0.3);
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);

  // Guardar PDF
  const fileName = `reporte_${reportTypeName}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
