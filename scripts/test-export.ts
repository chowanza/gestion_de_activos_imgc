import { exportToPDF, exportToExcel, ExportData } from '../src/utils/exportUtils';

// Datos de prueba
const testData: ExportData = {
  movements: [
    {
      id: 1,
      fecha: '2025-01-15',
      accion: 'Asignación',
      equipo: 'HP EliteBook 850',
      serial: 'HP-002-2024',
      asignadoA: 'Mariangel de Jesus Barrios Diaz',
      motivo: 'Asignación de trabajo',
      gerente: 'Juan Pérez'
    },
    {
      id: 2,
      fecha: '2025-01-14',
      accion: 'Mantenimiento',
      equipo: 'Dell Latitude 5520',
      serial: 'DELL-003-2024',
      asignadoA: 'Carlos Rodriguez',
      motivo: 'Reparación de pantalla',
      gerente: 'María García'
    }
  ],
  statistics: {
    totalMovements: 2,
    assignmentsCount: 1,
    maintenanceCount: 1,
    returnCount: 0,
    safeguardCount: 0,
    byCompany: [
      { empresa: 'IMGC', count: 2 }
    ],
    byDepartment: [
      { departamento: 'IT', count: 2 }
    ],
    byEmployee: [
      { empleado: 'Mariangel de Jesus Barrios Diaz', count: 1 },
      { empleado: 'Carlos Rodriguez', count: 1 }
    ]
  },
  filters: {
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    actionType: 'all',
    itemType: 'all'
  }
};

async function testExport() {
  try {
    console.log('🧪 Probando funcionalidad de exportación...\n');
    
    console.log('📄 Generando PDF de prueba...');
    await exportToPDF(testData);
    console.log('✅ PDF generado exitosamente');
    
    console.log('\n📊 Generando Excel de prueba...');
    exportToExcel(testData);
    console.log('✅ Excel generado exitosamente');
    
    console.log('\n🎉 Todas las pruebas de exportación pasaron correctamente');
    
  } catch (error) {
    console.error('❌ Error en las pruebas de exportación:', error);
  }
}

testExport();
