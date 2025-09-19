import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚀 Iniciando creación de datos de prueba...');

    // 1. Obtener empresas existentes
    const empresas = await prisma.empresa.findMany();
    console.log(`📊 Empresas disponibles: ${empresas.length}`);

    if (empresas.length === 0) {
      console.log('❌ No hay empresas en la base de datos');
      return;
    }

    // 2. Crear ubicaciones
    console.log('📍 Creando ubicaciones...');
    const ubicaciones = [
      { nombre: 'Edificio Principal - Piso 1', descripcion: 'Edificio principal de oficinas', direccion: 'Calle Principal 123', piso: '1', sala: 'A' },
      { nombre: 'Edificio Principal - Piso 2', descripcion: 'Edificio principal de oficinas', direccion: 'Calle Principal 123', piso: '2', sala: 'B' },
      { nombre: 'Edificio Principal - Piso 3', descripcion: 'Edificio principal de oficinas', direccion: 'Calle Principal 123', piso: '3', sala: 'C' },
      { nombre: 'Galpón', descripcion: 'Galpón de almacenamiento', direccion: 'Zona Industrial', piso: '1', sala: 'Almacén' },
      { nombre: 'Almacén', descripcion: 'Almacén de equipos', direccion: 'Zona Industrial', piso: '1', sala: 'Depósito' },
      { nombre: 'Oficina Remota', descripcion: 'Oficina de trabajo remoto', direccion: 'Calle Secundaria 456', piso: '1', sala: 'Home Office' },
    ];

    const ubicacionesCreadas = [];
    for (const ubicacionData of ubicaciones) {
      const ubicacion = await prisma.ubicacion.create({
        data: ubicacionData,
      });
      ubicacionesCreadas.push(ubicacion);
      console.log(`  ✅ Ubicación creada: ${ubicacion.nombre} - Piso ${ubicacion.piso}, Sala ${ubicacion.sala}`);
    }

    // 3. Crear departamentos (3 por empresa)
    console.log('🏢 Creando departamentos...');
    const departamentosCreados = [];
    
    for (const empresa of empresas) {
      const departamentosEmpresa = [
        { nombre: 'Recursos Humanos', empresaId: empresa.id },
        { nombre: 'Tecnología', empresaId: empresa.id },
        { nombre: 'Administración', empresaId: empresa.id },
      ];

      for (const deptoData of departamentosEmpresa) {
        const departamento = await prisma.departamento.create({
          data: deptoData,
          include: {
            empresa: true,
          },
        });
        departamentosCreados.push(departamento);
        console.log(`  ✅ Departamento creado: ${departamento.nombre} en ${departamento.empresa.nombre}`);
      }
    }

    // 4. Crear empleados (5-8 por departamento)
    console.log('👥 Creando empleados...');
    const empleadosCreados = [];
    
    for (const departamento of departamentosCreados) {
      const nombres = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Sofia', 'Diego', 'Laura'];
      const apellidos = ['García', 'Rodríguez', 'López', 'Martínez', 'González', 'Pérez', 'Sánchez', 'Ramírez'];
      const cargos = ['Gerente', 'Analista', 'Asistente', 'Coordinador', 'Especialista'];
      
      const cantidadEmpleados = Math.floor(Math.random() * 4) + 5; // 5-8 empleados
      
      for (let i = 0; i < cantidadEmpleados; i++) {
        const nombre = nombres[Math.floor(Math.random() * nombres.length)];
        const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
        const nombreCargo = cargos[Math.floor(Math.random() * cargos.length)];
        
        // Buscar o crear cargo
        let cargo = await prisma.cargo.findFirst({
          where: {
            nombre: nombreCargo,
            departamentoId: departamento.id
          }
        });
        
        if (!cargo) {
          cargo = await prisma.cargo.create({
            data: {
              nombre: nombreCargo,
              departamentoId: departamento.id
            }
          });
        }
        
        const empleado = await prisma.empleado.create({
          data: {
            nombre,
            apellido,
            ced: `${Math.floor(Math.random() * 90000000) + 10000000}`, // Cédula aleatoria
            email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}@${departamento.empresa.nombre.toLowerCase().replace(/\s+/g, '')}.com`,
            cargoId: cargo.id,
            departamentoId: departamento.id,
          },
        });
        empleadosCreados.push(empleado);
        console.log(`  ✅ Empleado creado: ${empleado.nombre} ${empleado.apellido} en ${departamento.nombre}`);
      }
    }

    // 5. Crear marcas
    console.log('🏷️ Creando marcas...');
    const marcas = ['Dell', 'HP', 'Lenovo', 'Apple', 'Samsung', 'Cisco', 'Microsoft', 'Logitech'];
    const marcasCreadas = [];
    
    for (const nombreMarca of marcas) {
      const marca = await prisma.marca.create({
        data: { nombre: nombreMarca },
      });
      marcasCreadas.push(marca);
      console.log(`  ✅ Marca creada: ${marca.nombre}`);
    }

    // 6. Crear catálogo de activos IT
    console.log('📱 Creando catálogo de activos IT...');
    const modelos = [
      // Laptops
      { nombre: 'Dell Latitude 5520', tipo: 'Laptop', marcaId: marcasCreadas.find(m => m.nombre === 'Dell')?.id },
      { nombre: 'HP EliteBook 850', tipo: 'Laptop', marcaId: marcasCreadas.find(m => m.nombre === 'HP')?.id },
      { nombre: 'Lenovo ThinkPad X1', tipo: 'Laptop', marcaId: marcasCreadas.find(m => m.nombre === 'Lenovo')?.id },
      { nombre: 'MacBook Pro 13"', tipo: 'Laptop', marcaId: marcasCreadas.find(m => m.nombre === 'Apple')?.id },
      
      // Desktops
      { nombre: 'Dell OptiPlex 7090', tipo: 'Desktop', marcaId: marcasCreadas.find(m => m.nombre === 'Dell')?.id },
      { nombre: 'HP ProDesk 400', tipo: 'Desktop', marcaId: marcasCreadas.find(m => m.nombre === 'HP')?.id },
      
      // Monitores
      { nombre: 'Samsung 24" LED', tipo: 'Monitor', marcaId: marcasCreadas.find(m => m.nombre === 'Samsung')?.id },
      { nombre: 'Dell UltraSharp 27"', tipo: 'Monitor', marcaId: marcasCreadas.find(m => m.nombre === 'Dell')?.id },
      
      // Impresoras
      { nombre: 'HP LaserJet Pro', tipo: 'Impresora', marcaId: marcasCreadas.find(m => m.nombre === 'HP')?.id },
      { nombre: 'Canon PIXMA', tipo: 'Impresora', marcaId: marcasCreadas.find(m => m.nombre === 'Canon')?.id },
      
      // Dispositivos móviles
      { nombre: 'iPhone 13', tipo: 'Teléfono', marcaId: marcasCreadas.find(m => m.nombre === 'Apple')?.id },
      { nombre: 'Samsung Galaxy S21', tipo: 'Teléfono', marcaId: marcasCreadas.find(m => m.nombre === 'Samsung')?.id },
    ];

    const modelosCreados = [];
    for (const modeloData of modelos) {
      if (modeloData.marcaId) {
        const modelo = await prisma.modeloDispositivo.create({
          data: {
            nombre: modeloData.nombre,
            tipo: modeloData.tipo,
            marcaId: modeloData.marcaId,
          },
        });
        modelosCreados.push(modelo);
        console.log(`  ✅ Modelo creado: ${modelo.nombre} (${modelo.tipo})`);
      }
    }

    // 7. Crear computadores y dispositivos
    console.log('💻 Creando computadores y dispositivos...');
    
    // Crear computadores
    const laptops = modelosCreados.filter(m => m.tipo === 'Laptop');
    const desktops = modelosCreados.filter(m => m.tipo === 'Desktop');
    
    for (let i = 0; i < 15; i++) {
      const modelo = [...laptops, ...desktops][Math.floor(Math.random() * ([...laptops, ...desktops].length))];
      const ubicacion = ubicacionesCreadas[Math.floor(Math.random() * ubicacionesCreadas.length)];
      
      const computador = await prisma.computador.create({
        data: {
          serial: `PC-${String(i + 1).padStart(3, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          codigoImgc: `IMG-${String(i + 1).padStart(4, '0')}`,
          estado: ['Operativo', 'Asignado', 'Resguardo', 'Reparación'][Math.floor(Math.random() * 4)],
          modeloId: modelo.id,
          ubicacionId: ubicacion.id,
          fechaCompra: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          numeroFactura: `FAC-${Math.floor(Math.random() * 9000) + 1000}`,
          proveedor: ['TecnoStore', 'CompuMax', 'IT Solutions'][Math.floor(Math.random() * 3)],
          monto: Math.floor(Math.random() * 5000) + 1000,
        },
      });
      console.log(`  ✅ Computador creado: ${computador.serial} (${modelo.nombre})`);
    }

    // Crear dispositivos
    const otrosModelos = modelosCreados.filter(m => !['Laptop', 'Desktop'].includes(m.tipo));
    
    for (let i = 0; i < 20; i++) {
      const modelo = otrosModelos[Math.floor(Math.random() * otrosModelos.length)];
      const ubicacion = ubicacionesCreadas[Math.floor(Math.random() * ubicacionesCreadas.length)];
      
      const dispositivo = await prisma.dispositivo.create({
        data: {
          serial: `DEV-${String(i + 1).padStart(3, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          codigoImgc: `IMG-DEV-${String(i + 1).padStart(4, '0')}`,
          estado: ['Operativo', 'Asignado', 'Resguardo', 'Reparación'][Math.floor(Math.random() * 4)],
          modeloId: modelo.id,
          ubicacionId: ubicacion.id,
          fechaCompra: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          numeroFactura: `FAC-DEV-${Math.floor(Math.random() * 9000) + 1000}`,
          proveedor: ['TecnoStore', 'CompuMax', 'IT Solutions'][Math.floor(Math.random() * 3)],
          monto: Math.floor(Math.random() * 2000) + 200,
        },
      });
      console.log(`  ✅ Dispositivo creado: ${dispositivo.serial} (${modelo.nombre})`);
    }

    // 8. Crear algunas asignaciones
    console.log('📋 Creando asignaciones...');
    const computadores = await prisma.computador.findMany({ take: 10 });
    const dispositivos = await prisma.dispositivo.findMany({ take: 15 });
    const empleadosParaAsignar = empleadosCreados.slice(0, 20); // Solo algunos empleados

    // Asignar computadores
    for (let i = 0; i < Math.min(8, computadores.length); i++) {
      const empleado = empleadosParaAsignar[i % empleadosParaAsignar.length];
      const computador = computadores[i];
      
      await prisma.asignaciones.create({
        data: {
          computadorId: computador.id,
          itemType: 'Computador',
          targetEmpleadoId: empleado.id,
          targetType: 'Empleado',
          actionType: 'Asignacion',
          date: new Date(),
        },
      });
      console.log(`  ✅ Computador ${computador.serial} asignado a ${empleado.nombre} ${empleado.apellido}`);
    }

    // Asignar dispositivos
    for (let i = 0; i < Math.min(10, dispositivos.length); i++) {
      const empleado = empleadosParaAsignar[(i + 8) % empleadosParaAsignar.length];
      const dispositivo = dispositivos[i];
      
      await prisma.asignaciones.create({
        data: {
          dispositivoId: dispositivo.id,
          itemType: 'Dispositivo',
          targetEmpleadoId: empleado.id,
          targetType: 'Empleado',
          actionType: 'Asignacion',
          date: new Date(),
        },
      });
      console.log(`  ✅ Dispositivo ${dispositivo.serial} asignado a ${empleado.nombre} ${empleado.apellido}`);
    }

    console.log('🎉 ¡Datos de prueba creados exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`  • Ubicaciones: ${ubicacionesCreadas.length}`);
    console.log(`  • Departamentos: ${departamentosCreados.length}`);
    console.log(`  • Empleados: ${empleadosCreados.length}`);
    console.log(`  • Marcas: ${marcasCreadas.length}`);
    console.log(`  • Modelos: ${modelosCreados.length}`);
    console.log(`  • Computadores: 15`);
    console.log(`  • Dispositivos: 20`);
    console.log(`  • Asignaciones: 18`);

  } catch (error) {
    console.error('❌ Error durante la creación de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
