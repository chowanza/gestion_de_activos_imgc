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

export interface ExportData {
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

export const exportToPDF = async (data: ExportData) => {
  const doc = new jsPDF();
  
  // Cargar autoTable dinámicamente
  const autoTablePlugin = await loadAutoTable();
  
  // Agregar logo de IMGC
  try {
    const logoResponse = await fetch('/img/logo.png');
    const logoBlob = await logoResponse.blob();
    const logoBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(logoBlob);
    });
    
    // Agregar logo en la esquina superior izquierda
    doc.addImage(logoBase64, 'PNG', 20, 10, 20, 8);
  } catch (error) {
    console.warn('No se pudo cargar el logo:', error);
  }
  
  // Obtener dimensiones de la página
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Configuración del documento - Título centrado
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  const titleText = 'Reporte de Movimientos de Equipos';
  const titleWidth = doc.getTextWidth(titleText);
  doc.text(titleText, (pageWidth - titleWidth) / 2, 25);
  
  // Información del reporte - Centrada
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  const periodText = `Período: ${data.filters.startDate} - ${data.filters.endDate}`;
  const periodWidth = doc.getTextWidth(periodText);
  doc.text(periodText, (pageWidth - periodWidth) / 2, 35);
  
  const generatedText = `Generado: ${new Date().toLocaleDateString('es-ES')}`;
  const generatedWidth = doc.getTextWidth(generatedText);
  doc.text(generatedText, (pageWidth - generatedWidth) / 2, 45);
  
  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(20, 55, pageWidth - 20, 55);
  
  // Estadísticas generales - Centrada
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  const statsTitle = 'Estadísticas Generales';
  const statsTitleWidth = doc.getTextWidth(statsTitle);
  doc.text(statsTitle, (pageWidth - statsTitleWidth) / 2, 70);
  
  // Estadísticas en dos columnas centradas
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const leftColumnX = pageWidth / 2 - 60;
  const rightColumnX = pageWidth / 2 + 20;
  
  doc.text(`Total de movimientos: ${data.statistics.totalMovements}`, leftColumnX, 85);
  doc.text(`Asignaciones: ${data.statistics.assignmentsCount}`, leftColumnX, 95);
  doc.text(`Mantenimientos: ${data.statistics.maintenanceCount}`, leftColumnX, 105);
  
  doc.text(`Devoluciones: ${data.statistics.returnCount}`, rightColumnX, 85);
  doc.text(`Resguardo: ${data.statistics.safeguardCount}`, rightColumnX, 95);
  
  // Línea separadora antes de la tabla
  doc.line(20, 120, pageWidth - 20, 120);
  
  // Tabla de movimientos
  const tableData = data.movements.map(movement => [
    movement.fecha,
    movement.accion,
    movement.equipo,
    movement.serial,
    movement.asignadoA,
    movement.motivo || '-',
    movement.gerente || '-'
  ]);
  
  autoTablePlugin(doc, {
    head: [['Fecha', 'Acción', 'Equipo', 'Serial', 'Asignado a', 'Motivo', 'Gerente']],
    body: tableData,
    startY: 125,
    margin: { left: 20, right: 20 },
    styles: {
      fontSize: 8,
      cellPadding: 4,
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
    columnStyles: {
      0: { halign: 'center', cellWidth: 25 }, // Fecha
      1: { halign: 'center', cellWidth: 20 }, // Acción
      2: { halign: 'left', cellWidth: 35 },   // Equipo
      3: { halign: 'center', cellWidth: 20 }, // Serial
      4: { halign: 'left', cellWidth: 30 },   // Asignado a
      5: { halign: 'center', cellWidth: 20 }, // Motivo
      6: { halign: 'center', cellWidth: 20 }  // Gerente
    }
  });
  
  // Pie de página centrado
  const finalY = (doc as any).lastAutoTable.finalY || 200;
  const footerY = Math.max(finalY + 20, pageHeight - 30);
  
  doc.setFontSize(8);
  doc.setFont(undefined, 'italic');
  const footerText = `Sistema de Gestión de Activos IMGC - Página 1`;
  const footerWidth = doc.getTextWidth(footerText);
  doc.text(footerText, (pageWidth - footerWidth) / 2, footerY);
  
  // Línea separadora del pie de página
  doc.setLineWidth(0.3);
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
  
  // Guardar el PDF
  const fileName = `reporte_movimientos_${data.filters.startDate}_${data.filters.endDate}.pdf`;
  doc.save(fileName);
};

export const exportToExcel = (data: ExportData) => {
  // Crear un nuevo workbook
  const workbook = XLSX.utils.book_new();
  
  // Hoja de resumen
  const summaryData = [
    ['REPORTE DE MOVIMIENTOS DE EQUIPOS'],
    [''],
    ['Período:', `${data.filters.startDate} - ${data.filters.endDate}`],
    ['Generado:', new Date().toLocaleDateString('es-ES')],
    [''],
    ['ESTADÍSTICAS GENERALES'],
    ['Total de movimientos:', data.statistics.totalMovements],
    ['Asignaciones:', data.statistics.assignmentsCount],
    ['Mantenimientos:', data.statistics.maintenanceCount],
    ['Devoluciones:', data.statistics.returnCount],
    ['Resguardo:', data.statistics.safeguardCount],
    [''],
    ['MOVIMIENTOS POR EMPRESA'],
    ...data.statistics.byCompany.map(item => [item.empresa, item.count]),
    [''],
    ['MOVIMIENTOS POR DEPARTAMENTO'],
    ...data.statistics.byDepartment.map(item => [item.departamento, item.count]),
    [''],
    ['MOVIMIENTOS POR EMPLEADO'],
    ...data.statistics.byEmployee.map(item => [item.empleado, item.count])
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
  
  // Hoja de movimientos detallados
  const movementsData = [
    ['Fecha', 'Acción', 'Equipo', 'Serial', 'Asignado a', 'Motivo', 'Gerente'],
    ...data.movements.map(movement => [
      movement.fecha,
      movement.accion,
      movement.equipo,
      movement.serial,
      movement.asignadoA,
      movement.motivo || '-',
      movement.gerente || '-'
    ])
  ];
  
  const movementsSheet = XLSX.utils.aoa_to_sheet(movementsData);
  
  // Aplicar estilos a la hoja de movimientos
  const range = XLSX.utils.decode_range(movementsSheet['!ref'] || 'A1');
  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!movementsSheet[cellAddress]) continue;
      
      if (row === 0) {
        // Encabezados
        movementsSheet[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "2980B9" } },
          alignment: { horizontal: "center" }
        };
      } else {
        // Datos
        movementsSheet[cellAddress].s = {
          alignment: { horizontal: "left" }
        };
      }
    }
  }
  
  // Ajustar ancho de columnas
  movementsSheet['!cols'] = [
    { wch: 12 }, // Fecha
    { wch: 15 }, // Acción
    { wch: 20 }, // Equipo
    { wch: 15 }, // Serial
    { wch: 25 }, // Asignado a
    { wch: 20 }, // Motivo
    { wch: 20 }  // Gerente
  ];
  
  XLSX.utils.book_append_sheet(workbook, movementsSheet, 'Movimientos');
  
  // Guardar el archivo
  const fileName = `reporte_movimientos_${data.filters.startDate}_${data.filters.endDate}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
