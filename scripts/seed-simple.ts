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
      { nombre: 'Galpón Industrial', descripcion: 'Galpón de almacenamiento', direccion: 'Zona Industrial', piso: '1', sala: 'Almacén' },
      { nombre: 'Almacén Central', descripcion: 'Almacén de equipos', direccion: 'Zona Industrial', piso: '1', sala: 'Depósito' },
    ];

    const ubicacionesCreadas = [];
    for (const ubicacionData of ubicaciones) {
      const ubicacion = await prisma.ubicacion.create({
        data: ubicacionData,
      });
      ubicacionesCreadas.push(ubicacion);
      console.log(`  ✅ Ubicación creada: ${ubicacion.nombre}`);
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
        });
        departamentosCreados.push(departamento);
        console.log(`  ✅ Departamento creado: ${departamento.nombre} en ${empresa.nombre}`);
      }
    }

    // 4. Crear empleados (3 por departamento)
    console.log('👥 Creando empleados...');
    const empleadosCreados = [];
    
    for (const departamento of departamentosCreados) {
      const nombres = ['Juan', 'María', 'Carlos'];
      const apellidos = ['García', 'Rodríguez', 'López'];
      const cargos = ['Gerente', 'Analista', 'Asistente'];
      
      for (let i = 0; i < 3; i++) {
        // Buscar o crear cargo
        let cargo = await prisma.cargo.findFirst({
          where: {
            nombre: cargos[i],
            departamentoId: departamento.id
          }
        });
        
        if (!cargo) {
          cargo = await prisma.cargo.create({
            data: {
              nombre: cargos[i],
              departamentoId: departamento.id
            }
          });
        }
        
        const empleado = await prisma.empleado.create({
          data: {
            nombre: nombres[i],
            apellido: apellidos[i],
            ced: `${Math.floor(Math.random() * 90000000) + 10000000}`,
            email: `${nombres[i].toLowerCase()}.${apellidos[i].toLowerCase()}@empresa.com`,
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
    const marcas = ['Dell', 'HP', 'Lenovo', 'Apple', 'Samsung'];
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
      { nombre: 'Dell Latitude 5520', tipo: 'Laptop', marcaId: marcasCreadas[0].id },
      { nombre: 'HP EliteBook 850', tipo: 'Laptop', marcaId: marcasCreadas[1].id },
      { nombre: 'Lenovo ThinkPad X1', tipo: 'Laptop', marcaId: marcasCreadas[2].id },
      { nombre: 'MacBook Pro 13"', tipo: 'Laptop', marcaId: marcasCreadas[3].id },
      { nombre: 'Samsung 24" LED', tipo: 'Monitor', marcaId: marcasCreadas[4].id },
    ];

    const modelosCreados = [];
    for (const modeloData of modelos) {
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

    // 7. Crear computadores
    console.log('💻 Creando computadores...');
    const laptops = modelosCreados.filter(m => m.tipo === 'Laptop');
    
    for (let i = 0; i < 10; i++) {
      const modelo = laptops[Math.floor(Math.random() * laptops.length)];
      const ubicacion = ubicacionesCreadas[Math.floor(Math.random() * ubicacionesCreadas.length)];
      
      const computador = await prisma.computador.create({
        data: {
          serial: `PC-${String(i + 1).padStart(3, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          codigoImgc: `IMG-${String(i + 1).padStart(4, '0')}`,
          estado: ['Operativo', 'Asignado', 'Resguardo'][Math.floor(Math.random() * 3)],
          modeloId: modelo.id,
          ubicacionId: ubicacion.id,
          fechaCompra: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          numeroFactura: `FAC-${Math.floor(Math.random() * 9000) + 1000}`,
          proveedor: 'TecnoStore',
          monto: Math.floor(Math.random() * 5000) + 1000,
        },
      });
      console.log(`  ✅ Computador creado: ${computador.serial} (${modelo.nombre})`);
    }

    // 8. Crear dispositivos
    console.log('📱 Creando dispositivos...');
    const otrosModelos = modelosCreados.filter(m => m.tipo !== 'Laptop');
    
    for (let i = 0; i < 8; i++) {
      const modelo = otrosModelos[Math.floor(Math.random() * otrosModelos.length)];
      const ubicacion = ubicacionesCreadas[Math.floor(Math.random() * ubicacionesCreadas.length)];
      
      const dispositivo = await prisma.dispositivo.create({
        data: {
          serial: `DEV-${String(i + 1).padStart(3, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          codigoImgc: `IMG-DEV-${String(i + 1).padStart(4, '0')}`,
          estado: ['Operativo', 'Asignado', 'Resguardo'][Math.floor(Math.random() * 3)],
          modeloId: modelo.id,
          ubicacionId: ubicacion.id,
          fechaCompra: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          numeroFactura: `FAC-DEV-${Math.floor(Math.random() * 9000) + 1000}`,
          proveedor: 'TecnoStore',
          monto: Math.floor(Math.random() * 2000) + 200,
        },
      });
      console.log(`  ✅ Dispositivo creado: ${dispositivo.serial} (${modelo.nombre})`);
    }

    // 9. Crear algunas asignaciones
    console.log('📋 Creando asignaciones...');
    const computadores = await prisma.computador.findMany({ take: 5 });
    const dispositivos = await prisma.dispositivo.findMany({ take: 5 });
    const empleadosParaAsignar = empleadosCreados.slice(0, 10);

    // Asignar computadores
    for (let i = 0; i < Math.min(5, computadores.length); i++) {
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
    for (let i = 0; i < Math.min(5, dispositivos.length); i++) {
      const empleado = empleadosParaAsignar[(i + 5) % empleadosParaAsignar.length];
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
    console.log(`  • Computadores: 10`);
    console.log(`  • Dispositivos: 8`);
    console.log(`  • Asignaciones: 10`);

  } catch (error) {
    console.error('❌ Error durante la creación de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
