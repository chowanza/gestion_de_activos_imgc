// scripts/seed-imgc-iron.ts
// Script para generar datos específicos de IMGC IRON con nuevos tipos de dispositivos

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Nuevos tipos de dispositivos para IMGC IRON
const nuevosDispositivosData = [
  {
    nombre: 'IMGC IRON',
    modelos: [
      // Servidores y Equipos de Red
      { nombre: 'IRON-SERVER-001', tipo: 'Servidor', img: '/uploads/modelos/iron-server.jpg' },
      { nombre: 'IRON-SWITCH-24P', tipo: 'Switch', img: '/uploads/modelos/iron-switch.jpg' },
      { nombre: 'IRON-ROUTER-ENTERPRISE', tipo: 'Router', img: '/uploads/modelos/iron-router.jpg' },
      { nombre: 'IRON-FIREWALL-1000', tipo: 'Firewall', img: '/uploads/modelos/iron-firewall.jpg' },
      { nombre: 'IRON-ACCESS-POINT', tipo: 'Access Point', img: '/uploads/modelos/iron-ap.jpg' },
      
      // Equipos de Seguridad
      { nombre: 'IRON-CAMERA-IP-4K', tipo: 'Cámara IP', img: '/uploads/modelos/iron-camera.jpg' },
      { nombre: 'IRON-DVR-16CH', tipo: 'DVR', img: '/uploads/modelos/iron-dvr.jpg' },
      { nombre: 'IRON-ALARM-CONTROL', tipo: 'Panel de Alarma', img: '/uploads/modelos/iron-alarm.jpg' },
      { nombre: 'IRON-ACCESS-CONTROL', tipo: 'Control de Acceso', img: '/uploads/modelos/iron-access.jpg' },
      
      // Equipos de Comunicaciones
      { nombre: 'IRON-PBX-100', tipo: 'Central Telefónica', img: '/uploads/modelos/iron-pbx.jpg' },
      { nombre: 'IRON-RADIO-VHF', tipo: 'Radio VHF', img: '/uploads/modelos/iron-radio.jpg' },
      { nombre: 'IRON-SATELLITE-MODEM', tipo: 'Módem Satelital', img: '/uploads/modelos/iron-satellite.jpg' },
      
      // Equipos Industriales
      { nombre: 'IRON-SCADA-MASTER', tipo: 'SCADA Master', img: '/uploads/modelos/iron-scada.jpg' },
      { nombre: 'IRON-PLC-3000', tipo: 'PLC', img: '/uploads/modelos/iron-plc.jpg' },
      { nombre: 'IRON-HMI-15IN', tipo: 'HMI', img: '/uploads/modelos/iron-hmi.jpg' },
      { nombre: 'IRON-INVERTER-50KW', tipo: 'Inversor', img: '/uploads/modelos/iron-inverter.jpg' },
      
      // Equipos de Medición
      { nombre: 'IRON-MULTIMETER-DIGITAL', tipo: 'Multímetro', img: '/uploads/modelos/iron-multimeter.jpg' },
      { nombre: 'IRON-OSCILLOSCOPE-200MHZ', tipo: 'Osciloscopio', img: '/uploads/modelos/iron-oscilloscope.jpg' },
      { nombre: 'IRON-SPECTRUM-ANALYZER', tipo: 'Analizador de Espectro', img: '/uploads/modelos/iron-spectrum.jpg' },
      { nombre: 'IRON-POWER-ANALYZER', tipo: 'Analizador de Potencia', img: '/uploads/modelos/iron-power.jpg' },
      
      // Equipos de Redes Eléctricas
      { nombre: 'IRON-UPS-5KVA', tipo: 'UPS', img: '/uploads/modelos/iron-ups.jpg' },
      { nombre: 'IRON-PDU-32A', tipo: 'PDU', img: '/uploads/modelos/iron-pdu.jpg' },
      { nombre: 'IRON-TRANSFORMER-10KVA', tipo: 'Transformador', img: '/uploads/modelos/iron-transformer.jpg' },
      { nombre: 'IRON-GENERATOR-50KW', tipo: 'Generador', img: '/uploads/modelos/iron-generator.jpg' },
      
      // Equipos de Laboratorio
      { nombre: 'IRON-MICROSCOPE-DIGITAL', tipo: 'Microscopio', img: '/uploads/modelos/iron-microscope.jpg' },
      { nombre: 'IRON-CENTRIFUGE-5000RPM', tipo: 'Centrífuga', img: '/uploads/modelos/iron-centrifuge.jpg' },
      { nombre: 'IRON-INCUBATOR-37C', tipo: 'Incubadora', img: '/uploads/modelos/iron-incubator.jpg' },
      { nombre: 'IRON-AUTOCLAVE-121C', tipo: 'Autoclave', img: '/uploads/modelos/iron-autoclave.jpg' }
    ]
  }
];

// Departamentos específicos para IMGC IRON
const departamentosIronData = [
  'Ingeniería de Sistemas',
  'Redes y Telecomunicaciones', 
  'Seguridad Industrial',
  'Laboratorio de Calidad',
  'Mantenimiento Industrial',
  'Control de Procesos',
  'Investigación y Desarrollo',
  'Calibración y Metrología'
];

// Cargos específicos para departamentos de IMGC IRON
const cargosIronData = {
  'Ingeniería de Sistemas': [
    'Ingeniero de Sistemas Senior', 'Arquitecto de Soluciones', 'Especialista en Integración',
    'Analista de Sistemas', 'Desarrollador de Software'
  ],
  'Redes y Telecomunicaciones': [
    'Ingeniero de Redes', 'Especialista en Telecomunicaciones', 'Técnico en Fibra Óptica',
    'Administrador de Redes', 'Coordinador de Comunicaciones'
  ],
  'Seguridad Industrial': [
    'Especialista en Seguridad', 'Técnico en Sistemas de Seguridad', 'Coordinador de Seguridad',
    'Inspector de Seguridad', 'Analista de Riesgos'
  ],
  'Laboratorio de Calidad': [
    'Jefe de Laboratorio', 'Técnico de Laboratorio', 'Especialista en Calibración',
    'Analista de Calidad', 'Coordinador de Ensayos'
  ],
  'Mantenimiento Industrial': [
    'Jefe de Mantenimiento', 'Técnico Industrial Senior', 'Especialista en PLC',
    'Técnico en Electrónica', 'Coordinador de Mantenimiento'
  ],
  'Control de Procesos': [
    'Ingeniero de Procesos', 'Especialista en SCADA', 'Técnico en Automatización',
    'Operador de Procesos', 'Analista de Control'
  ],
  'Investigación y Desarrollo': [
    'Jefe de I+D', 'Investigador Senior', 'Especialista en Innovación',
    'Desarrollador de Productos', 'Coordinador de Proyectos'
  ],
  'Calibración y Metrología': [
    'Metrólogo Senior', 'Técnico en Calibración', 'Especialista en Medición',
    'Coordinador de Metrología', 'Inspector de Calibración'
  ]
};

// Nombres técnicos para empleados de IMGC IRON
const nombresTecnicos = [
  'Alejandro', 'Carlos', 'María', 'José', 'Ana', 'Luis', 'Carmen', 'Pedro', 'Isabel', 'Miguel',
  'Rosa', 'Antonio', 'Elena', 'Francisco', 'Pilar', 'Manuel', 'Dolores', 'David', 'Cristina', 'Javier',
  'Mónica', 'Rafael', 'Teresa', 'Fernando', 'Patricia', 'Sergio', 'Laura', 'Alejandro', 'Sandra', 'Roberto',
  'Natalia', 'Daniel', 'Beatriz', 'Pablo', 'Silvia', 'Álvaro', 'Raquel', 'Rubén', 'Eva', 'Iván',
  'Marta', 'Adrián', 'Claudia', 'Óscar', 'Lucía', 'Héctor', 'Paula', 'Víctor', 'Andrea', 'Jorge'
];

const apellidosTecnicos = [
  'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín',
  'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez',
  'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Suárez',
  'Molina', 'Morales', 'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias',
  'Medina', 'Cortés', 'Garrido', 'Castillo', 'Santos', 'Lozano', 'Guerrero', 'Cano', 'Prieto', 'Méndez'
];

// Especificaciones técnicas para equipos IMGC IRON
const especificacionesIron = {
  'Servidor': {
    procesadores: ['Intel Xeon E5-2680', 'AMD EPYC 7551P', 'Intel Xeon Gold 6248'],
    ram: ['32 GB ECC', '64 GB ECC', '128 GB ECC'],
    almacenamiento: ['1 TB SSD', '2 TB SSD', '4 TB SSD'],
    sisOperativo: ['Windows Server 2019', 'Ubuntu Server 20.04', 'CentOS 8']
  },
  'Switch': {
    puertos: ['24 puertos', '48 puertos', '96 puertos'],
    velocidad: ['1 Gbps', '10 Gbps', '40 Gbps'],
    tipo: ['Managed', 'Unmanaged', 'PoE+']
  },
  'Router': {
    wan: ['1 Gbps', '10 Gbps', '100 Gbps'],
    lan: ['1 Gbps', '10 Gbps'],
    wifi: ['WiFi 6', 'WiFi 6E', 'Dual Band']
  },
  'Cámara IP': {
    resolucion: ['4K', '1080p', '720p'],
    vision: ['Nocturna', 'Día/Noche', 'Infrarrojos'],
    angulo: ['90°', '120°', '360°']
  },
  'UPS': {
    potencia: ['1 KVA', '3 KVA', '5 KVA', '10 KVA'],
    autonomia: ['15 min', '30 min', '60 min', '120 min'],
    tipo: ['Online', 'Line Interactive', 'Offline']
  }
};

// Función para generar CED técnico
function generarCEDTecnico(): string {
  const numeros = Math.floor(Math.random() * 90000000) + 10000000;
  return numeros.toString();
}

// Función para generar serial IMGC IRON
function generarSerialIron(): string {
  const prefijo = 'IRON';
  const numeros = Math.floor(Math.random() * 900000) + 100000;
  return `${prefijo}${numeros}`;
}

// Función para generar código IMGC IRON
function generarCodigoIMGCIron(): string {
  const prefijo = 'IMGC-IRON';
  const numeros = Math.floor(Math.random() * 900000) + 100000;
  return `${prefijo}${numeros}`;
}

// Función para generar fecha aleatoria
function generarFechaAleatoria(): string {
  const año = 2020 + Math.floor(Math.random() * 5);
  const mes = Math.floor(Math.random() * 12) + 1;
  const dia = Math.floor(Math.random() * 28) + 1;
  return `${año}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
}

// Función para generar monto aleatorio (más alto para equipos industriales)
function generarMontoIron(): number {
  return Math.floor(Math.random() * 50000) + 5000; // $5,000 - $55,000
}

async function main() {
  console.log('🚀 Iniciando generación de datos específicos para IMGC IRON...');

  try {
    // 1. Obtener empresas existentes
    const empresas = await prisma.empresa.findMany();
    if (empresas.length === 0) {
      console.log('❌ No hay empresas en la base de datos.');
      return;
    }

    // 2. Crear marca IMGC IRON
    console.log('🏭 Creando marca IMGC IRON...');
    const marcaIron = await prisma.marca.upsert({
      where: { nombre: 'IMGC IRON' },
      update: {},
      create: { nombre: 'IMGC IRON' }
    });
    console.log(`✅ Marca IMGC IRON creada (ID: ${marcaIron.id})`);

    // 3. Crear modelos de dispositivos IMGC IRON
    console.log('📱 Creando modelos de dispositivos IMGC IRON...');
    const modelosCreados = [];
    
    for (const dispositivoData of nuevosDispositivosData) {
      for (const modeloData of dispositivoData.modelos) {
        // Verificar si ya existe
        const modeloExistente = await prisma.modeloDispositivo.findFirst({
          where: { 
            nombre: modeloData.nombre,
            marcaId: marcaIron.id
          }
        });

        if (!modeloExistente) {
          const modelo = await prisma.modeloDispositivo.create({
            data: {
              nombre: modeloData.nombre,
              tipo: modeloData.tipo,
              img: modeloData.img,
              marcaId: marcaIron.id
            }
          });
          modelosCreados.push(modelo);
        } else {
          modelosCreados.push(modeloExistente);
        }
      }
    }
    console.log(`✅ ${modelosCreados.length} modelos IMGC IRON creados`);

    // 4. Crear departamentos específicos de IMGC IRON
    console.log('🏢 Creando departamentos específicos de IMGC IRON...');
    const departamentosIronCreados = [];
    
    for (const nombreDept of departamentosIronData) {
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
        departamentosIronCreados.push(departamento);
      } else {
        departamentosIronCreados.push(departamentoExistente);
      }
    }
    console.log(`✅ ${departamentosIronCreados.length} departamentos IMGC IRON procesados`);

    // 5. Crear cargos específicos para departamentos IMGC IRON
    console.log('💼 Creando cargos específicos de IMGC IRON...');
    const cargosIronCreados = [];
    
    for (const departamento of departamentosIronCreados) {
      const cargosDelDept = cargosIronData[departamento.nombre] || [];
      for (const nombreCargo of cargosDelDept) {
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
              descripcion: `Cargo de ${nombreCargo} en ${departamento.nombre} - IMGC IRON`,
              departamentoId: departamento.id
            }
          });
          cargosIronCreados.push(cargo);
        } else {
          cargosIronCreados.push(cargoExistente);
        }
      }
    }
    console.log(`✅ ${cargosIronCreados.length} cargos IMGC IRON procesados`);

    // 6. Crear empleados técnicos especializados
    console.log('👥 Creando empleados técnicos especializados...');
    const empleadosIronCreados = [];
    const totalEmpleadosIron = 75; // 75 empleados técnicos

    for (let i = 0; i < totalEmpleadosIron; i++) {
      const nombre = nombresTecnicos[Math.floor(Math.random() * nombresTecnicos.length)];
      const apellido = apellidosTecnicos[Math.floor(Math.random() * apellidosTecnicos.length)];
      const departamento = departamentosIronCreados[Math.floor(Math.random() * departamentosIronCreados.length)];
      const cargosDelDept = cargosIronCreados.filter(c => c.departamentoId === departamento.id);
      const cargo = cargosDelDept[Math.floor(Math.random() * cargosDelDept.length)];

      const empleado = await prisma.empleado.create({
        data: {
          nombre,
          apellido,
          ced: generarCEDTecnico(),
          fechaNacimiento: generarFechaAleatoria(),
          fechaIngreso: generarFechaAleatoria(),
          departamentoId: departamento.id,
          cargoId: cargo.id
        }
      });
      empleadosIronCreados.push(empleado);

      if ((i + 1) % 25 === 0) {
        console.log(`  └─ ${i + 1}/${totalEmpleadosIron} empleados técnicos creados`);
      }
    }
    console.log(`✅ ${totalEmpleadosIron} empleados técnicos creados`);

    // 7. Obtener ubicaciones existentes
    const ubicaciones = await prisma.ubicacion.findMany();
    console.log(`📍 ${ubicaciones.length} ubicaciones disponibles`);

    // 8. Crear equipos IMGC IRON (computadores industriales)
    console.log('💻 Creando equipos computacionales IMGC IRON...');
    const totalComputadoresIron = 100; // 100 computadores industriales

    for (let i = 0; i < totalComputadoresIron; i++) {
      const modelo = modelosCreados[Math.floor(Math.random() * modelosCreados.length)];
      const empleado = empleadosIronCreados[Math.floor(Math.random() * empleadosIronCreados.length)];
      const ubicacion = ubicaciones[Math.floor(Math.random() * ubicaciones.length)];
      const estado = ['Resguardo', 'Asignado', 'Operativo', 'En Reparación', 'De Baja'][Math.floor(Math.random() * 5)];
      
      // Especificaciones técnicas según el tipo
      const especs = especificacionesIron[modelo.tipo] || especificacionesIron['Servidor'];
      const procesador = especs.procesadores ? especs.procesadores[Math.floor(Math.random() * especs.procesadores.length)] : 'Intel Core i7-10700K';
      const ram = especs.ram ? especs.ram[Math.floor(Math.random() * especs.ram.length)] : '16 GB';
      const almacenamiento = especs.almacenamiento ? especs.almacenamiento[Math.floor(Math.random() * especs.almacenamiento.length)] : '512 GB SSD';
      const sisOperativo = especs.sisOperativo ? especs.sisOperativo[Math.floor(Math.random() * especs.sisOperativo.length)] : 'Windows 10 Pro';

      const computador = await prisma.computador.create({
        data: {
          serial: generarSerialIron(),
          estado,
          modeloId: modelo.id,
          empleadoId: Math.random() > 0.2 ? empleado.id : null, // 80% asignados
          departamentoId: empleado.departamentoId,
          ubicacionId: ubicacion.id,
          codigoImgc: generarCodigoIMGCIron(),
          host: `iron-${Math.floor(Math.random() * 1000)}`,
          sisOperativo,
          arquitectura: '64',
          ram,
          almacenamiento,
          procesador,
          sapVersion: `SAP ${Math.floor(Math.random() * 3) + 1}.0`,
          officeVersion: 'Microsoft Office 2019 Professional',
          macWifi: `00:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}`,
          macEthernet: `00:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}`,
          // Información de compra
          fechaCompra: new Date(generarFechaAleatoria()),
          numeroFactura: `IRON-FAC-${Math.floor(Math.random() * 100000)}`,
          proveedor: 'IMGC IRON Solutions',
          monto: generarMontoIron()
        }
      });

      if ((i + 1) % 25 === 0) {
        console.log(`  └─ ${i + 1}/${totalComputadoresIron} computadores IMGC IRON creados`);
      }
    }
    console.log(`✅ ${totalComputadoresIron} computadores IMGC IRON creados`);

    // 9. Crear dispositivos IMGC IRON
    console.log('📱 Creando dispositivos IMGC IRON...');
    const totalDispositivosIron = 150; // 150 dispositivos industriales

    for (let i = 0; i < totalDispositivosIron; i++) {
      const modelo = modelosCreados[Math.floor(Math.random() * modelosCreados.length)];
      const empleado = empleadosIronCreados[Math.floor(Math.random() * empleadosIronCreados.length)];
      const ubicacion = ubicaciones[Math.floor(Math.random() * ubicaciones.length)];
      const estado = ['Resguardo', 'Asignado', 'Operativo', 'En Reparación', 'De Baja'][Math.floor(Math.random() * 5)];

      const dispositivo = await prisma.dispositivo.create({
        data: {
          serial: generarSerialIron(),
          estado,
          modeloId: modelo.id,
          empleadoId: Math.random() > 0.3 ? empleado.id : null, // 70% asignados
          departamentoId: empleado.departamentoId,
          ubicacionId: ubicacion.id,
          codigoImgc: generarCodigoIMGCIron(),
          mac: `00:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}`,
          ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          // Información de compra
          fechaCompra: new Date(generarFechaAleatoria()),
          numeroFactura: `IRON-FAC-${Math.floor(Math.random() * 100000)}`,
          proveedor: 'IMGC IRON Solutions',
          monto: generarMontoIron()
        }
      });

      if ((i + 1) % 50 === 0) {
        console.log(`  └─ ${i + 1}/${totalDispositivosIron} dispositivos IMGC IRON creados`);
      }
    }
    console.log(`✅ ${totalDispositivosIron} dispositivos IMGC IRON creados`);

    // 10. Crear asignaciones de equipos IMGC IRON
    console.log('📋 Creando asignaciones de equipos IMGC IRON...');
    const computadoresIron = await prisma.computador.findMany({
      where: { 
        empleadoId: { not: null },
        codigoImgc: { startsWith: 'IMGC-IRON' }
      },
      take: 30
    });

    for (const computador of computadoresIron) {
      await prisma.asignaciones.create({
        data: {
          date: new Date(),
          actionType: 'asignacion',
          motivo: 'Asignación inicial IMGC IRON',
          targetType: 'Usuario',
          targetEmpleadoId: computador.empleadoId,
          itemType: 'Computador',
          computadorId: computador.id,
          notes: `Asignación de equipo IMGC IRON ${computador.serial} a empleado técnico`
        }
      });
    }
    console.log(`✅ ${computadoresIron.length} asignaciones IMGC IRON creadas`);

    console.log('\n🎉 ¡Generación de datos IMGC IRON completada exitosamente!');
    console.log('\n📊 Resumen de datos IMGC IRON creados:');
    console.log(`  • 1 marca: IMGC IRON`);
    console.log(`  • ${modelosCreados.length} modelos de dispositivos industriales`);
    console.log(`  • ${departamentosIronCreados.length} departamentos técnicos`);
    console.log(`  • ${cargosIronCreados.length} cargos especializados`);
    console.log(`  • ${totalEmpleadosIron} empleados técnicos`);
    console.log(`  • ${totalComputadoresIron} computadores industriales`);
    console.log(`  • ${totalDispositivosIron} dispositivos industriales`);
    console.log(`  • ${computadoresIron.length} asignaciones técnicas`);

  } catch (error) {
    console.error('❌ Error durante la generación de datos IMGC IRON:', error);
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
