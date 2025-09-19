// scripts/seed-masivo-datos-prueba.ts
// Script para generar datos masivos de prueba para el sistema de gestión de activos

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Datos de departamentos adicionales
const departamentosData = [
  'Contabilidad',
  'Comercialización', 
  'Recursos Humanos',
  'Operaciones',
  'Mantenimiento',
  'Seguridad',
  'Administración',
  'Logística',
  'Calidad',
  'Desarrollo'
];

// Datos de cargos por departamento
const cargosData = {
  'Contabilidad': [
    'Contador Senior', 'Contador Junior', 'Asistente Contable', 'Analista Financiero', 'Jefe de Contabilidad'
  ],
  'Comercialización': [
    'Gerente de Ventas', 'Ejecutivo de Ventas', 'Analista de Mercado', 'Coordinador Comercial', 'Asistente de Ventas'
  ],
  'Recursos Humanos': [
    'Gerente de RRHH', 'Especialista en Reclutamiento', 'Analista de Nómina', 'Coordinador de Capacitación', 'Asistente de RRHH'
  ],
  'Operaciones': [
    'Gerente de Operaciones', 'Supervisor de Operaciones', 'Coordinador Operativo', 'Analista de Procesos', 'Operador'
  ],
  'Mantenimiento': [
    'Jefe de Mantenimiento', 'Técnico Senior', 'Técnico Junior', 'Especialista en Equipos', 'Asistente de Mantenimiento'
  ],
  'Seguridad': [
    'Jefe de Seguridad', 'Supervisor de Seguridad', 'Guardia Senior', 'Guardia Junior', 'Coordinador de Seguridad'
  ],
  'Administración': [
    'Gerente Administrativo', 'Asistente Ejecutivo', 'Coordinador Administrativo', 'Analista Administrativo', 'Secretario'
  ],
  'Logística': [
    'Gerente de Logística', 'Coordinador de Almacén', 'Analista de Inventario', 'Especialista en Distribución', 'Asistente Logístico'
  ],
  'Calidad': [
    'Gerente de Calidad', 'Auditor de Calidad', 'Analista de Calidad', 'Coordinador de Calidad', 'Inspector de Calidad'
  ],
  'Desarrollo': [
    'Desarrollador Senior', 'Desarrollador Junior', 'Arquitecto de Software', 'Analista de Sistemas', 'Tester'
  ],
  'Telemática': [
    'Ingeniero de Sistemas', 'Administrador de Redes', 'Especialista en Telecomunicaciones', 'Técnico en Sistemas', 'Analista de IT'
  ]
};

// Nombres y apellidos para generar empleados
const nombres = [
  'Carlos', 'María', 'José', 'Ana', 'Luis', 'Carmen', 'Pedro', 'Isabel', 'Miguel', 'Rosa',
  'Antonio', 'Elena', 'Francisco', 'Pilar', 'Manuel', 'Dolores', 'David', 'Cristina', 'Javier', 'Mónica',
  'Rafael', 'Teresa', 'Fernando', 'Patricia', 'Sergio', 'Laura', 'Alejandro', 'Sandra', 'Roberto', 'Natalia',
  'Daniel', 'Beatriz', 'Pablo', 'Silvia', 'Álvaro', 'Raquel', 'Rubén', 'Eva', 'Iván', 'Marta',
  'Adrián', 'Claudia', 'Óscar', 'Lucía', 'Héctor', 'Paula', 'Víctor', 'Andrea', 'Jorge', 'Sara'
];

const apellidos = [
  'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín',
  'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez',
  'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Suárez',
  'Molina', 'Morales', 'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias',
  'Medina', 'Cortés', 'Garrido', 'Castillo', 'Santos', 'Lozano', 'Guerrero', 'Cano', 'Prieto', 'Méndez'
];

// Estados de equipos
const estadosEquipos = ['Resguardo', 'Asignado', 'Operativo', 'En Reparación', 'De Baja'];

// Ubicaciones adicionales
const ubicacionesData = [
  { nombre: 'Oficina Principal', descripcion: 'Edificio principal de la empresa', direccion: 'Av. Principal 123', piso: '1', sala: 'A' },
  { nombre: 'Piso 2 - Administración', descripcion: 'Piso administrativo', direccion: 'Av. Principal 123', piso: '2', sala: 'B' },
  { nombre: 'Piso 3 - Operaciones', descripcion: 'Área de operaciones', direccion: 'Av. Principal 123', piso: '3', sala: 'C' },
  { nombre: 'Almacén Central', descripcion: 'Almacén principal', direccion: 'Av. Principal 123', piso: 'Sótano', sala: 'D' },
  { nombre: 'Laboratorio IT', descripcion: 'Laboratorio de tecnología', direccion: 'Av. Principal 123', piso: '4', sala: 'E' },
  { nombre: 'Sala de Juntas', descripcion: 'Sala de reuniones ejecutivas', direccion: 'Av. Principal 123', piso: '5', sala: 'F' },
  { nombre: 'Área de Mantenimiento', descripcion: 'Taller de mantenimiento', direccion: 'Av. Principal 123', piso: 'Sótano', sala: 'G' },
  { nombre: 'Oficina de Ventas', descripcion: 'Área comercial', direccion: 'Av. Principal 123', piso: '2', sala: 'H' }
];

// Proveedores para información de compra
const proveedores = [
  'Dell Technologies', 'HP Inc.', 'Lenovo', 'Apple', 'Microsoft', 'Cisco Systems', 'Samsung', 'LG Electronics',
  'Canon', 'Epson', 'Brother', 'Logitech', 'Intel', 'AMD', 'NVIDIA', 'Western Digital', 'Seagate', 'Kingston',
  'Corsair', 'ASUS', 'Acer', 'MSI', 'Gigabyte', 'EVGA', 'Thermaltake', 'Cooler Master', 'Razer', 'SteelSeries'
];

// Función para generar CED aleatorio
function generarCED(): string {
  const numeros = Math.floor(Math.random() * 90000000) + 10000000; // 8 dígitos
  return numeros.toString();
}

// Función para generar serial aleatorio
function generarSerial(): string {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numeros = '0123456789';
  let serial = '';
  
  // 2 letras + 8 números
  for (let i = 0; i < 2; i++) {
    serial += letras.charAt(Math.floor(Math.random() * letras.length));
  }
  for (let i = 0; i < 8; i++) {
    serial += numeros.charAt(Math.floor(Math.random() * numeros.length));
  }
  
  return serial;
}

// Función para generar código IMGC
function generarCodigoIMGC(): string {
  const prefijo = 'IMGC';
  const numeros = Math.floor(Math.random() * 900000) + 100000; // 6 dígitos
  return `${prefijo}${numeros}`;
}

// Función para generar fecha aleatoria
function generarFechaAleatoria(): string {
  const año = 2020 + Math.floor(Math.random() * 5); // 2020-2024
  const mes = Math.floor(Math.random() * 12) + 1;
  const dia = Math.floor(Math.random() * 28) + 1;
  return `${año}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
}

// Función para generar monto aleatorio
function generarMonto(): number {
  return Math.floor(Math.random() * 5000) + 500; // $500 - $5500
}

async function main() {
  console.log('🚀 Iniciando generación masiva de datos de prueba...');

  try {
    // 1. Obtener empresas existentes
    const empresas = await prisma.empresa.findMany();
    if (empresas.length === 0) {
      console.log('❌ No hay empresas en la base de datos. Creando una empresa por defecto...');
      const empresa = await prisma.empresa.create({
        data: {
          nombre: 'Empresa Demo',
          descripcion: 'Empresa de demostración'
        }
      });
      empresas.push(empresa);
    }

    // 2. Crear ubicaciones adicionales
    console.log('📍 Creando ubicaciones adicionales...');
    for (const ubicacionData of ubicacionesData) {
      await prisma.ubicacion.upsert({
        where: { nombre: ubicacionData.nombre },
        update: {},
        create: ubicacionData
      });
    }
    console.log(`✅ ${ubicacionesData.length} ubicaciones procesadas`);

    // 3. Crear departamentos adicionales
    console.log('🏢 Creando departamentos adicionales...');
    const departamentosCreados = [];
    for (const nombreDept of departamentosData) {
      // Verificar si ya existe
      const departamentoExistente = await prisma.departamento.findFirst({
        where: { 
          nombre: nombreDept,
          empresaId: empresas[0].id
        }
      });

      if (!departamentoExistente) {
        const departamento = await prisma.departamento.create({
          data: {
            nombre: nombreDept,
            empresaId: empresas[0].id
          }
        });
        departamentosCreados.push(departamento);
      } else {
        departamentosCreados.push(departamentoExistente);
      }
    }
    console.log(`✅ ${departamentosCreados.length} departamentos procesados`);

    // 4. Crear cargos para cada departamento
    console.log('💼 Creando cargos...');
    const cargosCreados = [];
    for (const departamento of departamentosCreados) {
      const cargosDelDept = cargosData[departamento.nombre as keyof typeof cargosData] || [];
      for (const nombreCargo of cargosDelDept) {
        // Verificar si ya existe
        const cargoExistente = await prisma.cargo.findFirst({
          where: { 
            nombre: nombreCargo,
            departamentoId: departamento.id
          }
        });

        if (!cargoExistente) {
          const cargo = await prisma.cargo.create({
            data: {
              nombre: nombreCargo,
              descripcion: `Cargo de ${nombreCargo} en ${departamento.nombre}`,
              departamentoId: departamento.id
            }
          });
          cargosCreados.push(cargo);
        } else {
          cargosCreados.push(cargoExistente);
        }
      }
    }
    console.log(`✅ ${cargosCreados.length} cargos procesados`);

    // 5. Crear empleados masivos
    console.log('👥 Creando empleados...');
    const empleadosCreados = [];
    const totalEmpleados = 150; // Generar 150 empleados

    for (let i = 0; i < totalEmpleados; i++) {
      const nombre = nombres[Math.floor(Math.random() * nombres.length)];
      const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
      const departamento = departamentosCreados[Math.floor(Math.random() * departamentosCreados.length)];
      const cargosDelDept = cargosCreados.filter(c => c.departamentoId === departamento.id);
      const cargo = cargosDelDept[Math.floor(Math.random() * cargosDelDept.length)];

      const empleado = await prisma.empleado.create({
        data: {
          nombre,
          apellido,
          ced: generarCED(),
          fechaNacimiento: generarFechaAleatoria(),
          fechaIngreso: generarFechaAleatoria(),
          departamentoId: departamento.id,
          cargoId: cargo.id
        }
      });
      empleadosCreados.push(empleado);

      if ((i + 1) % 25 === 0) {
        console.log(`  └─ ${i + 1}/${totalEmpleados} empleados creados`);
      }
    }
    console.log(`✅ ${totalEmpleados} empleados creados`);

    // 6. Obtener modelos existentes
    const modelos = await prisma.modeloDispositivo.findMany({
      include: { marca: true }
    });
    console.log(`📱 ${modelos.length} modelos disponibles`);

    // 7. Obtener ubicaciones
    const ubicaciones = await prisma.ubicacion.findMany();
    console.log(`📍 ${ubicaciones.length} ubicaciones disponibles`);

    // 8. Crear computadores masivos
    console.log('💻 Creando computadores...');
    const totalComputadores = 200; // Generar 200 computadores

    for (let i = 0; i < totalComputadores; i++) {
      const modelo = modelos[Math.floor(Math.random() * modelos.length)];
      const empleado = empleadosCreados[Math.floor(Math.random() * empleadosCreados.length)];
      const ubicacion = ubicaciones[Math.floor(Math.random() * ubicaciones.length)];
      const estado = estadosEquipos[Math.floor(Math.random() * estadosEquipos.length)];
      const proveedor = proveedores[Math.floor(Math.random() * proveedores.length)];

      const computador = await prisma.computador.create({
        data: {
          serial: generarSerial(),
          estado,
          modeloId: modelo.id,
          empleadoId: Math.random() > 0.3 ? empleado.id : null, // 70% asignados
          departamentoId: empleado.departamentoId,
          ubicacionId: ubicacion.id,
          codigoImgc: generarCodigoIMGC(),
          host: `host-${Math.floor(Math.random() * 1000)}`,
          sisOperativo: ['Windows 10', 'Windows 11', 'Ubuntu 20.04', 'macOS Monterey'][Math.floor(Math.random() * 4)],
          arquitectura: ['32', '64'][Math.floor(Math.random() * 2)],
          ram: `${[4, 8, 16, 32][Math.floor(Math.random() * 4)]} GB`,
          almacenamiento: `${[256, 512, 1024, 2048][Math.floor(Math.random() * 4)]} GB SSD`,
          procesador: `Intel Core i${[3, 5, 7][Math.floor(Math.random() * 3)]}-${Math.floor(Math.random() * 9000) + 1000}`,
          officeVersion: `Microsoft Office ${Math.floor(Math.random() * 3) + 2019}`,
          macWifi: `00:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}`,
          macEthernet: `00:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}`,
          // Información de compra
          fechaCompra: new Date(generarFechaAleatoria()),
          numeroFactura: `FAC-${Math.floor(Math.random() * 100000)}`,
          proveedor,
          monto: generarMonto()
        }
      });

      if ((i + 1) % 50 === 0) {
        console.log(`  └─ ${i + 1}/${totalComputadores} computadores creados`);
      }
    }
    console.log(`✅ ${totalComputadores} computadores creados`);

    // 9. Crear dispositivos masivos
    console.log('📱 Creando dispositivos...');
    const totalDispositivos = 150; // Generar 150 dispositivos

    for (let i = 0; i < totalDispositivos; i++) {
      const modelo = modelos[Math.floor(Math.random() * modelos.length)];
      const empleado = empleadosCreados[Math.floor(Math.random() * empleadosCreados.length)];
      const ubicacion = ubicaciones[Math.floor(Math.random() * ubicaciones.length)];
      const estado = estadosEquipos[Math.floor(Math.random() * estadosEquipos.length)];
      const proveedor = proveedores[Math.floor(Math.random() * proveedores.length)];

      const dispositivo = await prisma.dispositivo.create({
        data: {
          serial: generarSerial(),
          estado,
          modeloId: modelo.id,
          empleadoId: Math.random() > 0.4 ? empleado.id : null, // 60% asignados
          departamentoId: empleado.departamentoId,
          ubicacionId: ubicacion.id,
          codigoImgc: generarCodigoIMGC(),
          mac: `00:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}`,
          ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          // Información de compra
          fechaCompra: new Date(generarFechaAleatoria()),
          numeroFactura: `FAC-${Math.floor(Math.random() * 100000)}`,
          proveedor,
          monto: generarMonto()
        }
      });

      if ((i + 1) % 50 === 0) {
        console.log(`  └─ ${i + 1}/${totalDispositivos} dispositivos creados`);
      }
    }
    console.log(`✅ ${totalDispositivos} dispositivos creados`);

    // 10. Crear asignaciones de ejemplo
    console.log('📋 Creando asignaciones de ejemplo...');
    const computadores = await prisma.computador.findMany({
      where: { empleadoId: { not: null } },
      take: 50
    });

    for (const computador of computadores) {
      await prisma.asignaciones.create({
        data: {
          date: new Date(),
          actionType: 'asignacion',
          motivo: 'Asignación inicial',
          targetType: 'Usuario',
          targetEmpleadoId: computador.empleadoId,
          itemType: 'Computador',
          computadorId: computador.id,
          notes: `Asignación de ${computador.serial} a empleado`
        }
      });
    }
    console.log(`✅ ${computadores.length} asignaciones creadas`);

    console.log('\n🎉 ¡Generación masiva de datos completada exitosamente!');
    console.log('\n📊 Resumen de datos creados:');
    console.log(`  • ${ubicacionesData.length} ubicaciones adicionales`);
    console.log(`  • ${departamentosData.length} departamentos`);
    console.log(`  • ${cargosCreados.length} cargos`);
    console.log(`  • ${totalEmpleados} empleados`);
    console.log(`  • ${totalComputadores} computadores`);
    console.log(`  • ${totalDispositivos} dispositivos`);
    console.log(`  • ${computadores.length} asignaciones`);

  } catch (error) {
    console.error('❌ Error durante la generación de datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Error fatal:', e);
    process.exit(1);
  });
