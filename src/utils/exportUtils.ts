// Exportar datos a Excel
export const exportToExcel = (data: ExportData | LegacyExportData) => {
  const isLegacyData = 'movements' in data;
  let sheetData: any[][] = [];
  let headers: string[] = [];
  if (isLegacyData) {
    headers = ['Fecha', 'Acción', 'Equipo', 'Serial', 'Asignado a', 'Motivo'];
    sheetData = (data as LegacyExportData).movements.map((movement: any) => [
      movement.fecha,
      movement.accion,
      movement.equipo,
      movement.serial,
      movement.asignadoA,
      movement.motivo || '-'
    ]);
  } else {
    headers = (data as ExportData).columns.map((col: any) => col.title);
    sheetData = (data as ExportData).data.map((row: any) =>
      // Use nullish coalescing so numeric zeros are preserved (0 should not become '-')
      (data as ExportData).columns.map((col: any) => (row[col.key] ?? '-'))
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
// Word export (docx)
import {
  AlignmentType,
  BorderStyle,
  Document as DocxDocument,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Footer,
  Table as DocxTable,
  TableCell as DocxTableCell,
  TableRow as DocxTableRow,
  TextRun,
  WidthType,
  PageOrientation
} from 'docx';

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

  // Crear documento PDF - Landscape para todas las páginas
  const doc = new jsPDF('landscape', 'mm', 'letter');
  const autoTablePlugin = await loadAutoTable();

  // Logo
  let logoBase64 = '';
  try {
    const logoResponse = await fetch('/img/logo.png');
    const logoBlob = await logoResponse.blob();
    logoBase64 = await new Promise<string>((resolve) => {
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

  // Note: per request we only render the table in the PDF. Header/title for the table is added on the table page.

  // TABLA DE DATOS (Página 1 - Landscape)
  const tablePageWidth = doc.internal.pageSize.getWidth();
  const tablePageHeight = doc.internal.pageSize.getHeight();

  // Logo en página de tabla
  try {
    doc.addImage(logoBase64, 'PNG', 20, 10, 20, 8);
  } catch (error) {
    // Logo ya cargado anteriormente
  }

  // Título página tabla
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  const tableTitleText = isLegacyData ? 'Historial de Movimientos' : (data as ExportData).title || 'Reporte';
  const tableTitleWidth = doc.getTextWidth(tableTitleText);
  doc.text(tableTitleText, (tablePageWidth - tableTitleWidth) / 2, 25);

  // Fecha generado
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const tableGeneratedText = `Generado: ${new Date().toLocaleDateString('es-ES')}`;
  const tableGeneratedWidth = doc.getTextWidth(tableGeneratedText);
  doc.text(tableGeneratedText, (tablePageWidth - tableGeneratedWidth) / 2, 35);

  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(20, 45, tablePageWidth - 20, 45);

  // Leave more vertical space so the header / titles don't collide with the table
  let tableStartY = 70;

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
      movement.motivo || '-'
    ]);
    headers = ['Fecha', 'Acción', 'Equipo', 'Serial', 'Asignado a', 'Motivo'];
    columnStyles = {
      0: { halign: 'center', cellWidth: 20 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'left', cellWidth: 30 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'left', cellWidth: 28 },
      5: { halign: 'left', cellWidth: 35 }
    };
  } else {
    tableData = (data as ExportData).data.map((row: any) =>
      // Preserve 0 values; only replace null/undefined with '-'
      (data as ExportData).columns.map((col: any) => (row[col.key] ?? '-'))
    );
    headers = (data as ExportData).columns.map((col: any) => col.title);
    // Compute available width using actual page width & margins and normalize column widths
    const marginLeft = 15;
    const marginRight = 15;
    const availableWidth = Math.max(0, doc.internal.pageSize.getWidth() - marginLeft - marginRight);

    // Sum the configured relative widths; if they don't sum to >0, distribute evenly
    const configuredSum = (data as ExportData).columns.reduce((s: number, c: any) => s + (c.width || 0), 0) || 0;
    const sumWidths = configuredSum > 0 ? configuredSum : (data as ExportData).columns.length;

    (data as ExportData).columns.forEach((col: any, index: number) => {
      const relative = (col.width || 1) / sumWidths;
      // Ensure minimal and maximum widths to avoid overflow
      const minWidth = 10; // mm
      const computed = Math.max(minWidth, Math.round(relative * availableWidth));
      columnStyles[index] = {
        halign: col.align || 'left',
        cellWidth: computed
      };
    });
  }

  autoTablePlugin(doc, {
    head: [headers],
    body: tableData,
    startY: tableStartY,
    margin: { left: 15, right: 15 },
    styles: {
      // Reduce base font size to help wide tables fit in landscape
      fontSize: 6,
      cellPadding: 2,
      halign: 'center',
      valign: 'middle',
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 6
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: columnStyles,
    tableWidth: 'auto',
    pageBreak: 'auto'
  });

  // Pie de página tabla
  const tableFinalY = (doc as any).lastAutoTable.finalY || 200;
  const tableFooterY = Math.max(tableFinalY + 20, tablePageHeight - 30);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const reportTypeName = isLegacyData ? 'movimientos' : (data as ExportData).reportType;
  const tableFooterText = `Sistema de Gestión de Activos IMGC - Reporte ${reportTypeName} - Página 1`;
  const tableFooterWidth = doc.getTextWidth(tableFooterText);
  doc.text(tableFooterText, (tablePageWidth - tableFooterWidth) / 2, tableFooterY);
  doc.setLineWidth(0.3);
  doc.line(20, tableFooterY - 5, tablePageWidth - 20, tableFooterY - 5);

  // Statistics removed — per request only the table is included in the PDF

  // Guardar PDF
  const fileName = `reporte_${reportTypeName}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

// Exportar a Word (DOCX)
export const exportToDOCX = async (data: ExportData | LegacyExportData) => {
  const isLegacyData = 'movements' in data;

  // Preparar encabezados y filas
  let headers: string[] = [];
  let rows: (string | number)[][] = [];
  let reportTypeName = 'reporte';
  let title = 'Reporte';

  // Cargar logo (opcional)
  let logoBuffer: ArrayBuffer | null = null;
  try {
    const logoResponse = await fetch('/img/logo.png');
    if (logoResponse.ok) {
      logoBuffer = await logoResponse.arrayBuffer();
    }
  } catch (e) {
    // Sin logo no es bloqueante
  }

  if (isLegacyData) {
    headers = ['Fecha', 'Acción', 'Equipo', 'Serial', 'Asignado a', 'Motivo'];
    rows = (data as LegacyExportData).movements.map((m) => [
      m.fecha,
      m.accion,
      m.equipo,
      m.serial,
      m.asignadoA,
      m.motivo || '-'
    ]);
    reportTypeName = 'movimientos';
    title = 'Historial de Movimientos';
  } else {
    const d = data as ExportData;
    headers = d.columns.map((c) => c.title);
    rows = d.data.map((row: any) => d.columns.map((c) => (row[c.key] ?? '-')));
    reportTypeName = d.reportType;
    title = d.title || 'Reporte';
  }

  // Construir documento
  const doc = new DocxDocument({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 15840, // Carta horizontal: 11in * 1440 twips
              height: 12240, // 8.5in * 1440 twips
              orientation: PageOrientation.LANDSCAPE
            }
          }
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `Sistema de Gestión de Activos IMGC — ${title}`, italics: true, size: 18, color: '7F7F7F' })
                ]
              })
            ]
          })
        },
        children: [
          // Logo arriba a la izquierda
          ...(logoBuffer
            ? [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new ImageRun({ data: new Uint8Array(logoBuffer as ArrayBuffer), transformation: { width: 120, height: 40 } } as any)
                  ]
                })
              ]
            : []),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({ text: title, bold: true })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `Generado: ${new Date().toLocaleDateString('es-ES')}`, italics: true, size: 20 })
            ]
          }),
          new Paragraph({ text: ' ' }),
          // Línea separadora bajo el encabezado
          new DocxTable({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' } },
                    children: [new Paragraph({ text: ' ' })]
                  })
                ]
              })
            ]
          }),
          new Paragraph({ text: ' ' }),
          // Tabla
          new DocxTable({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              // Header row
              new DocxTableRow({
                children: headers.map((h) =>
                  new DocxTableCell({
                    width: { size: Math.floor(100 / Math.max(1, headers.length)), type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: h, bold: true })],
                        alignment: AlignmentType.CENTER
                      })
                    ]
                  })
                )
              }),
              // Data rows
              ...rows.map((r) =>
                new DocxTableRow({
                  children: r.map((cell) =>
                    new DocxTableCell({
                      width: { size: Math.floor(100 / Math.max(1, headers.length)), type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          children: [new TextRun(String(cell))]
                        })
                      ]
                    })
                  )
                })
              )
            ]
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `reporte_${reportTypeName}_${new Date().toISOString().split('T')[0]}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
};
