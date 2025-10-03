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
  const isLegacyData = 'movements' in data;
  const exportData = isLegacyData ? data as LegacyExportData : data as ExportData;
  
  // Determinar orientación basada en el número de columnas
  const columnCount = isLegacyData ? 7 : exportData.columns.length;
  const needsLandscape = columnCount > 8; // Más de 8 columnas requiere orientación horizontal
  
  // Crear documento con orientación apropiada
  const doc = new jsPDF(needsLandscape ? 'landscape' : 'portrait');
  
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
  doc.setFont('helvetica', 'bold');
  const titleText = isLegacyData ? 'Reporte de Movimientos de Equipos' : exportData.title;
  const titleWidth = doc.getTextWidth(titleText);
  doc.text(titleText, (pageWidth - titleWidth) / 2, 25);
  
  // Información del reporte - Centrada
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  // Mostrar período si está disponible
  if (exportData.filters.startDate && exportData.filters.endDate) {
    const periodText = `Período: ${exportData.filters.startDate} - ${exportData.filters.endDate}`;
    const periodWidth = doc.getTextWidth(periodText);
    doc.text(periodText, (pageWidth - periodWidth) / 2, 35);
  }
  
  const generatedText = `Generado: ${new Date().toLocaleDateString('es-ES')}`;
  const generatedWidth = doc.getTextWidth(generatedText);
  doc.text(generatedText, (pageWidth - generatedWidth) / 2, 45);
  
  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(20, 55, pageWidth - 20, 55);
  
  let startY = 70;
  
  // Mostrar estadísticas si están disponibles
  if (exportData.statistics) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const statsTitle = 'Estadísticas Generales';
    const statsTitleWidth = doc.getTextWidth(statsTitle);
    doc.text(statsTitle, (pageWidth - statsTitleWidth) / 2, startY);
    
    startY += 15;
    
    // Mostrar estadísticas específicas según el tipo de reporte
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (isLegacyData) {
      const legacyStats = exportData.statistics as LegacyExportData['statistics'];
      const leftColumnX = pageWidth / 2 - 60;
      const rightColumnX = pageWidth / 2 + 20;
      
      doc.text(`Total de movimientos: ${legacyStats.totalMovements}`, leftColumnX, startY);
      doc.text(`Asignaciones: ${legacyStats.assignmentsCount}`, leftColumnX, startY + 10);
      doc.text(`Mantenimientos: ${legacyStats.maintenanceCount}`, leftColumnX, startY + 20);
      
      doc.text(`Devoluciones: ${legacyStats.returnCount}`, rightColumnX, startY);
      doc.text(`Resguardo: ${legacyStats.safeguardCount}`, rightColumnX, startY + 10);
      
      startY += 40;
    } else {
      // Mostrar estadísticas genéricas de forma más profesional
      const stats = exportData.statistics;
      const leftColumnX = pageWidth / 2 - 80;
      const rightColumnX = pageWidth / 2 + 20;
      
      // Mostrar estadísticas principales
      if (stats.totalEmpleados !== undefined) {
        doc.text(`Total Empleados: ${stats.totalEmpleados}`, leftColumnX, startY);
        doc.text(`Empleados Activos: ${stats.empleadosActivos || 0}`, leftColumnX, startY + 10);
        doc.text(`Empleados Inactivos: ${stats.empleadosInactivos || 0}`, leftColumnX, startY + 20);
        doc.text(`Total Equipos Asignados: ${stats.totalEquiposAsignados || 0}`, rightColumnX, startY);
        
        // Mostrar distribución por empresa si existe
        if (stats.porEmpresa) {
          const empresaText = typeof stats.porEmpresa === 'string' 
            ? stats.porEmpresa 
            : Object.entries(stats.porEmpresa).map(([empresa, count]) => `${empresa}: ${count}`).join(', ');
          doc.text(`Distribución por Empresa:`, leftColumnX, startY + 30);
          doc.text(empresaText, leftColumnX + 5, startY + 40);
        }
        
        // Mostrar distribución por departamento si existe
        if (stats.porDepartamento) {
          const deptText = typeof stats.porDepartamento === 'string' 
            ? stats.porDepartamento 
            : Object.entries(stats.porDepartamento).map(([dept, count]) => `${dept}: ${count}`).join(', ');
          doc.text(`Distribución por Departamento:`, rightColumnX, startY + 30);
          doc.text(deptText, rightColumnX + 5, startY + 40);
        }
        
        startY += 60;
      } else {
        // Para otros tipos de reportes, mostrar estadísticas básicas
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
    
    // Línea separadora antes de la tabla
    doc.line(20, startY, pageWidth - 20, startY);
    startY += 15;
  }
  
  // Preparar datos de la tabla
  let tableData: any[][];
  let headers: string[];
  let columnStyles: Record<number, any> = {};
  
  if (isLegacyData) {
    // Formato legacy
    tableData = exportData.movements.map(movement => [
      movement.fecha,
      movement.accion,
      movement.equipo,
      movement.serial,
      movement.asignadoA,
      movement.motivo || '-',
      movement.gerente || '-'
    ]);
    headers = ['Fecha', 'Acción', 'Equipo', 'Serial', 'Asignado a', 'Motivo', 'Gerente'];
    
    // Configuración de columnas optimizada para movimientos
    columnStyles = {
      0: { halign: 'center', cellWidth: 25 }, // Fecha
      1: { halign: 'center', cellWidth: 25 }, // Acción (más ancho)
      2: { halign: 'left', cellWidth: 35 },   // Equipo
      3: { halign: 'center', cellWidth: 20 }, // Serial
      4: { halign: 'left', cellWidth: 30 },   // Asignado a
      5: { halign: 'left', cellWidth: 40 },   // Motivo (más ancho)
      6: { halign: 'center', cellWidth: 20 }  // Gerente
    };
  } else {
    // Formato nuevo con configuración de columnas
    tableData = exportData.data.map(row => 
      exportData.columns.map(col => row[col.key] || '-')
    );
    headers = exportData.columns.map(col => col.title);
    
    // Calcular anchos de columna basados en la configuración y orientación
    const availableWidth = needsLandscape ? 270 : 170; // Más espacio en landscape
    const totalWidth = needsLandscape ? 250 : 150; // Aprovechar más espacio en landscape
    
    exportData.columns.forEach((col, index) => {
      const cellWidth = (col.width / 100) * totalWidth;
      columnStyles[index] = {
        halign: col.align || 'left',
        cellWidth: cellWidth
      };
    });
  }
  
  // Generar tabla
  autoTablePlugin(doc, {
    head: [headers],
    body: tableData,
    startY: startY,
    margin: { left: 15, right: 15 }, // Márgenes más pequeños para aprovechar espacio
    styles: {
      fontSize: needsLandscape ? 7 : 8, // Fuente más pequeña en landscape
      cellPadding: needsLandscape ? 3 : 4, // Padding reducido en landscape
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
  
  // Pie de página centrado
  const finalY = (doc as any).lastAutoTable.finalY || 200;
  const footerY = Math.max(finalY + 20, pageHeight - 30);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const reportType = isLegacyData ? 'movimientos' : exportData.reportType;
  const footerText = `Sistema de Gestión de Activos IMGC - Reporte ${reportType} - Página 1`;
  const footerWidth = doc.getTextWidth(footerText);
  doc.text(footerText, (pageWidth - footerWidth) / 2, footerY);
  
  // Línea separadora del pie de página
  doc.setLineWidth(0.3);
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
  
  // Guardar el PDF
  const reportTypeName = isLegacyData ? 'movimientos' : exportData.reportType;
  const fileName = `reporte_${reportTypeName}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const exportToExcel = (data: ExportData | LegacyExportData) => {
  // Crear un nuevo workbook
  const workbook = XLSX.utils.book_new();
  
  // Determinar si es formato nuevo o legacy
  const isLegacyData = 'movements' in data;
  const exportData = isLegacyData ? data as LegacyExportData : data as ExportData;
  
  // Hoja de resumen
  const title = isLegacyData ? 'REPORTE DE MOVIMIENTOS DE EQUIPOS' : exportData.title.toUpperCase();
  const summaryData = [
    [title],
    [''],
    ...(exportData.filters.startDate && exportData.filters.endDate ? [
      ['Período:', `${exportData.filters.startDate} - ${exportData.filters.endDate}`]
    ] : []),
    ['Generado:', new Date().toLocaleDateString('es-ES')],
    ['']
  ];
  
  // Agregar estadísticas si están disponibles
  if (exportData.statistics) {
    summaryData.push(['ESTADÍSTICAS GENERALES']);
    
    if (isLegacyData) {
      const legacyStats = exportData.statistics as LegacyExportData['statistics'];
      summaryData.push(
        ['Total de movimientos:', legacyStats.totalMovements],
        ['Asignaciones:', legacyStats.assignmentsCount],
        ['Mantenimientos:', legacyStats.maintenanceCount],
        ['Devoluciones:', legacyStats.returnCount],
        ['Resguardo:', legacyStats.safeguardCount],
        [''],
        ['MOVIMIENTOS POR EMPRESA'],
        ...legacyStats.byCompany.map(item => [item.empresa, item.count]),
        [''],
        ['MOVIMIENTOS POR DEPARTAMENTO'],
        ...legacyStats.byDepartment.map(item => [item.departamento, item.count]),
        [''],
        ['MOVIMIENTOS POR EMPLEADO'],
        ...legacyStats.byEmployee.map(item => [item.empleado, item.count])
      );
    } else {
      // Estadísticas genéricas
      Object.entries(exportData.statistics).forEach(([key, value]) => {
        summaryData.push([key, value]);
      });
    }
  }
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
  
  // Hoja de datos detallados
  let dataSheet: any;
  let sheetName: string;
  
  if (isLegacyData) {
    // Formato legacy
    const movementsData = [
      ['Fecha', 'Acción', 'Equipo', 'Serial', 'Asignado a', 'Motivo', 'Gerente'],
      ...exportData.movements.map(movement => [
        movement.fecha,
        movement.accion,
        movement.equipo,
        movement.serial,
        movement.asignadoA,
        movement.motivo || '-',
        movement.gerente || '-'
      ])
    ];
    
    dataSheet = XLSX.utils.aoa_to_sheet(movementsData);
    sheetName = 'Movimientos';
  } else {
    // Formato nuevo
    const tableData = [
      exportData.columns.map(col => col.title),
      ...exportData.data.map(row => 
        exportData.columns.map(col => row[col.key] || '-')
      )
    ];
    
    dataSheet = XLSX.utils.aoa_to_sheet(tableData);
    sheetName = 'Datos';
  }
  
  // Aplicar estilos a la hoja de datos
  const range = XLSX.utils.decode_range(dataSheet['!ref'] || 'A1');
  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!dataSheet[cellAddress]) continue;
      
      if (row === 0) {
        // Encabezados
        dataSheet[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "2980B9" } },
          alignment: { horizontal: "center" }
        };
      } else {
        // Datos
        dataSheet[cellAddress].s = {
          alignment: { horizontal: "left" }
        };
      }
    }
  }
  
  // Ajustar ancho de columnas
  if (isLegacyData) {
    dataSheet['!cols'] = [
      { wch: 12 }, // Fecha
      { wch: 15 }, // Acción
      { wch: 20 }, // Equipo
      { wch: 15 }, // Serial
      { wch: 25 }, // Asignado a
      { wch: 30 }, // Motivo (más ancho)
      { wch: 20 }  // Gerente
    ];
  } else {
    // Usar configuración de columnas
    dataSheet['!cols'] = exportData.columns.map(col => ({
      wch: Math.max(col.width / 5, 10) // Convertir porcentaje a ancho de columna
    }));
  }
  
  XLSX.utils.book_append_sheet(workbook, dataSheet, sheetName);
  
  // Guardar el archivo
  const reportTypeName = isLegacyData ? 'movimientos' : exportData.reportType;
  const fileName = `reporte_${reportTypeName}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
