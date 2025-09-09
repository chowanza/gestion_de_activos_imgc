import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando creación de datos de prueba...');

  try {
    // Limpiar datos existentes (opcional - comentar si quieres mantener datos existentes)
    console.log('🧹 Limpiando datos existentes...');
    await prisma.asignaciones.deleteMany();
    await prisma.computador.deleteMany();
    await prisma.dispositivo.deleteMany();
    await prisma.empleado.deleteMany();
    await prisma.cargo.deleteMany();
    await prisma.departamento.deleteMany();
    await prisma.empresa.deleteMany();
    await prisma.modeloDispositivo.deleteMany();
    await prisma.marca.deleteMany();

    // Crear marcas
    console.log('📱 Creando marcas...');
    const marcaDell = await prisma.marca.create({
      data: { nombre: 'Dell' }
    });
    const marcaHP = await prisma.marca.create({
      data: { nombre: 'HP' }
    });
    const marcaLenovo = await prisma.marca.create({
      data: { nombre: 'Lenovo' }
    });
    const marcaApple = await prisma.marca.create({
      data: { nombre: 'Apple' }
    });
    const marcaSamsung = await prisma.marca.create({
      data: { nombre: 'Samsung' }
    });

    // Crear modelos de dispositivos
    console.log('💻 Creando modelos de dispositivos...');
    const modelos = [
      // Dell
      { nombre: 'OptiPlex 7090', marcaId: marcaDell.id, tipo: 'Desktop' },
      { nombre: 'Latitude 5520', marcaId: marcaDell.id, tipo: 'Laptop' },
      { nombre: 'Precision 3560', marcaId: marcaDell.id, tipo: 'Laptop' },
      
      // HP
      { nombre: 'EliteDesk 800 G8', marcaId: marcaHP.id, tipo: 'Desktop' },
      { nombre: 'ProBook 450 G8', marcaId: marcaHP.id, tipo: 'Laptop' },
      { nombre: 'EliteBook 840 G8', marcaId: marcaHP.id, tipo: 'Laptop' },
      
      // Lenovo
      { nombre: 'ThinkCentre M920', marcaId: marcaLenovo.id, tipo: 'Desktop' },
      { nombre: 'ThinkPad E15', marcaId: marcaLenovo.id, tipo: 'Laptop' },
      { nombre: 'ThinkPad X1 Carbon', marcaId: marcaLenovo.id, tipo: 'Laptop' },
      
      // Apple
      { nombre: 'MacBook Pro 13"', marcaId: marcaApple.id, tipo: 'Laptop' },
      { nombre: 'MacBook Air M1', marcaId: marcaApple.id, tipo: 'Laptop' },
      { nombre: 'iMac 24"', marcaId: marcaApple.id, tipo: 'Desktop' },
      
      // Samsung
      { nombre: 'Galaxy Tab S8', marcaId: marcaSamsung.id, tipo: 'Tablet' },
      { nombre: 'Galaxy Book Pro', marcaId: marcaSamsung.id, tipo: 'Laptop' },
    ];

    const modelosCreados = [];
    for (const modelo of modelos) {
      const modeloCreado = await prisma.modeloDispositivo.create({
        data: modelo
      });
      modelosCreados.push(modeloCreado);
    }

    // Crear empresas
    console.log('🏢 Creando empresas...');
    const empresas = [
      {
        nombre: 'TechCorp Solutions',
        descripcion: 'Empresa líder en soluciones tecnológicas empresariales',
        logo: '/uploads/empresas/techcorp-logo.png'
      },
      {
        nombre: 'InnovateSoft',
        descripcion: 'Desarrollo de software innovador y aplicaciones móviles',
        logo: '/uploads/empresas/innovatesoft-logo.png'
      },
      {
        nombre: 'DataFlow Systems',
        descripcion: 'Especialistas en análisis de datos y business intelligence',
        logo: '/uploads/empresas/dataflow-logo.png'
      },
      {
        nombre: 'CloudTech Services',
        descripcion: 'Servicios de infraestructura en la nube y DevOps',
        logo: '/uploads/empresas/cloudtech-logo.png'
      }
    ];

    const empresasCreadas = [];
    for (const empresa of empresas) {
      const empresaCreada = await prisma.empresa.create({
        data: empresa
      });
      empresasCreadas.push(empresaCreada);
    }

    // Crear departamentos
    console.log('🏬 Creando departamentos...');
    const departamentos = [
      // TechCorp Solutions
      {
        nombre: 'Desarrollo de Software',
        empresaId: empresasCreadas[0].id
      },
      {
        nombre: 'Infraestructura IT',
        empresaId: empresasCreadas[0].id
      },
      {
        nombre: 'Recursos Humanos',
        empresaId: empresasCreadas[0].id
      },
      
      // InnovateSoft
      {
        nombre: 'Frontend Development',
        empresaId: empresasCreadas[1].id
      },
      {
        nombre: 'Backend Development',
        empresaId: empresasCreadas[1].id
      },
      {
        nombre: 'QA & Testing',
        empresaId: empresasCreadas[1].id
      },
      
      // DataFlow Systems
      {
        nombre: 'Data Science',
        empresaId: empresasCreadas[2].id
      },
      {
        nombre: 'Business Intelligence',
        empresaId: empresasCreadas[2].id
      },
      
      // CloudTech Services
      {
        nombre: 'DevOps',
        empresaId: empresasCreadas[3].id
      },
      {
        nombre: 'Cloud Architecture',
        empresaId: empresasCreadas[3].id
      }
    ];

    const departamentosCreados = [];
    for (const departamento of departamentos) {
      const departamentoCreado = await prisma.departamento.create({
        data: departamento
      });
      departamentosCreados.push(departamentoCreado);
    }

    // Crear cargos
    console.log('👔 Creando cargos...');
    const cargos = [
      // TechCorp Solutions - Desarrollo de Software
      {
        nombre: 'Senior Software Engineer',
        descripcion: 'Desarrollador senior con experiencia en múltiples tecnologías',
        departamentoId: departamentosCreados[0].id
      },
      {
        nombre: 'Junior Developer',
        descripcion: 'Desarrollador junior en formación',
        departamentoId: departamentosCreados[0].id
      },
      {
        nombre: 'Tech Lead',
        descripcion: 'Líder técnico del equipo de desarrollo',
        departamentoId: departamentosCreados[0].id
      },
      
      // TechCorp Solutions - Infraestructura IT
      {
        nombre: 'Systems Administrator',
        descripcion: 'Administrador de sistemas y servidores',
        departamentoId: departamentosCreados[1].id
      },
      {
        nombre: 'Network Engineer',
        descripcion: 'Ingeniero de redes y conectividad',
        departamentoId: departamentosCreados[1].id
      },
      
      // TechCorp Solutions - Recursos Humanos
      {
        nombre: 'HR Manager',
        descripcion: 'Gerente de recursos humanos',
        departamentoId: departamentosCreados[2].id
      },
      {
        nombre: 'HR Specialist',
        descripcion: 'Especialista en recursos humanos',
        departamentoId: departamentosCreados[2].id
      },
      
      // InnovateSoft - Frontend Development
      {
        nombre: 'Frontend Developer',
        descripcion: 'Desarrollador especializado en interfaces de usuario',
        departamentoId: departamentosCreados[3].id
      },
      {
        nombre: 'UI/UX Designer',
        descripcion: 'Diseñador de interfaces y experiencia de usuario',
        departamentoId: departamentosCreados[3].id
      },
      
      // InnovateSoft - Backend Development
      {
        nombre: 'Backend Developer',
        descripcion: 'Desarrollador especializado en APIs y servicios',
        departamentoId: departamentosCreados[4].id
      },
      {
        nombre: 'Database Administrator',
        descripcion: 'Administrador de bases de datos',
        departamentoId: departamentosCreados[4].id
      },
      
      // InnovateSoft - QA & Testing
      {
        nombre: 'QA Engineer',
        descripcion: 'Ingeniero de aseguramiento de calidad',
        departamentoId: departamentosCreados[5].id
      },
      {
        nombre: 'Test Automation Engineer',
        descripcion: 'Ingeniero de automatización de pruebas',
        departamentoId: departamentosCreados[5].id
      },
      
      // DataFlow Systems - Data Science
      {
        nombre: 'Data Scientist',
        descripcion: 'Científico de datos especializado en machine learning',
        departamentoId: departamentosCreados[6].id
      },
      {
        nombre: 'Data Analyst',
        descripcion: 'Analista de datos y estadísticas',
        departamentoId: departamentosCreados[6].id
      },
      
      // DataFlow Systems - Business Intelligence
      {
        nombre: 'BI Developer',
        descripcion: 'Desarrollador de business intelligence',
        departamentoId: departamentosCreados[7].id
      },
      {
        nombre: 'Data Engineer',
        descripcion: 'Ingeniero de datos y ETL',
        departamentoId: departamentosCreados[7].id
      },
      
      // CloudTech Services - DevOps
      {
        nombre: 'DevOps Engineer',
        descripcion: 'Ingeniero de DevOps y automatización',
        departamentoId: departamentosCreados[8].id
      },
      {
        nombre: 'Site Reliability Engineer',
        descripcion: 'Ingeniero de confiabilidad del sitio',
        departamentoId: departamentosCreados[8].id
      },
      
      // CloudTech Services - Cloud Architecture
      {
        nombre: 'Cloud Architect',
        descripcion: 'Arquitecto de soluciones en la nube',
        departamentoId: departamentosCreados[9].id
      },
      {
        nombre: 'Cloud Engineer',
        descripcion: 'Ingeniero de infraestructura en la nube',
        departamentoId: departamentosCreados[9].id
      }
    ];

    const cargosCreados = [];
    for (const cargo of cargos) {
      const cargoCreado = await prisma.cargo.create({
        data: cargo
      });
      cargosCreados.push(cargoCreado);
    }

    // Crear empleados
    console.log('👥 Creando empleados...');
    const empleados = [
      // TechCorp Solutions - Desarrollo de Software
      {
        nombre: 'Carlos',
        apellido: 'Rodríguez',
        ced: '12345678',
        fechaNacimiento: '1985-03-15',
        fechaIngreso: '2020-01-15',
        departamentoId: departamentosCreados[0].id,
        cargoId: cargosCreados[2].id // Tech Lead
      },
      {
        nombre: 'María',
        apellido: 'González',
        ced: '23456789',
        fechaNacimiento: '1990-07-22',
        fechaIngreso: '2021-03-10',
        departamentoId: departamentosCreados[0].id,
        cargoId: cargosCreados[0].id // Senior Software Engineer
      },
      {
        nombre: 'Luis',
        apellido: 'Martínez',
        ced: '34567890',
        fechaNacimiento: '1995-11-08',
        fechaIngreso: '2022-06-01',
        departamentoId: departamentosCreados[0].id,
        cargoId: cargosCreados[1].id // Junior Developer
      },
      
      // TechCorp Solutions - Infraestructura IT
      {
        nombre: 'Ana',
        apellido: 'Silva',
        ced: '45678901',
        fechaNacimiento: '1988-05-12',
        fechaIngreso: '2019-09-15',
        departamentoId: departamentosCreados[1].id,
        cargoId: cargosCreados[3].id // Systems Administrator
      },
      {
        nombre: 'Roberto',
        apellido: 'Fernández',
        ced: '56789012',
        fechaNacimiento: '1982-12-03',
        fechaIngreso: '2018-11-20',
        departamentoId: departamentosCreados[1].id,
        cargoId: cargosCreados[4].id // Network Engineer
      },
      
      // TechCorp Solutions - Recursos Humanos
      {
        nombre: 'Carmen',
        apellido: 'López',
        ced: '67890123',
        fechaNacimiento: '1987-09-18',
        fechaIngreso: '2020-02-01',
        departamentoId: departamentosCreados[2].id,
        cargoId: cargosCreados[5].id // HR Manager
      },
      {
        nombre: 'Diego',
        apellido: 'Herrera',
        ced: '78901234',
        fechaNacimiento: '1992-04-25',
        fechaIngreso: '2021-08-15',
        departamentoId: departamentosCreados[2].id,
        cargoId: cargosCreados[6].id // HR Specialist
      },
      
      // InnovateSoft - Frontend Development
      {
        nombre: 'Sofia',
        apellido: 'Vargas',
        ced: '89012345',
        fechaNacimiento: '1993-08-14',
        fechaIngreso: '2022-01-10',
        departamentoId: departamentosCreados[3].id,
        cargoId: cargosCreados[7].id // Frontend Developer
      },
      {
        nombre: 'Andrés',
        apellido: 'Mendoza',
        ced: '90123456',
        fechaNacimiento: '1991-01-30',
        fechaIngreso: '2021-05-20',
        departamentoId: departamentosCreados[3].id,
        cargoId: cargosCreados[8].id // UI/UX Designer
      },
      
      // InnovateSoft - Backend Development
      {
        nombre: 'Valentina',
        apellido: 'Castro',
        ced: '01234567',
        fechaNacimiento: '1989-06-07',
        fechaIngreso: '2020-10-05',
        departamentoId: departamentosCreados[4].id,
        cargoId: cargosCreados[9].id // Backend Developer
      },
      {
        nombre: 'Sebastián',
        apellido: 'Rojas',
        ced: '11223344',
        fechaNacimiento: '1986-10-12',
        fechaIngreso: '2019-12-01',
        departamentoId: departamentosCreados[4].id,
        cargoId: cargosCreados[10].id // Database Administrator
      },
      
      // InnovateSoft - QA & Testing
      {
        nombre: 'Isabella',
        apellido: 'Morales',
        ced: '22334455',
        fechaNacimiento: '1994-02-28',
        fechaIngreso: '2022-03-15',
        departamentoId: departamentosCreados[5].id,
        cargoId: cargosCreados[11].id // QA Engineer
      },
      {
        nombre: 'Nicolás',
        apellido: 'Jiménez',
        ced: '33445566',
        fechaNacimiento: '1990-12-15',
        fechaIngreso: '2021-07-01',
        departamentoId: departamentosCreados[5].id,
        cargoId: cargosCreados[12].id // Test Automation Engineer
      },
      
      // DataFlow Systems - Data Science
      {
        nombre: 'Camila',
        apellido: 'Torres',
        ced: '44556677',
        fechaNacimiento: '1988-04-20',
        fechaIngreso: '2020-06-10',
        departamentoId: departamentosCreados[6].id,
        cargoId: cargosCreados[13].id // Data Scientist
      },
      {
        nombre: 'Gabriel',
        apellido: 'Ramírez',
        ced: '55667788',
        fechaNacimiento: '1992-11-05',
        fechaIngreso: '2021-09-20',
        departamentoId: departamentosCreados[6].id,
        cargoId: cargosCreados[14].id // Data Analyst
      },
      
      // DataFlow Systems - Business Intelligence
      {
        nombre: 'Lucía',
        apellido: 'Peña',
        ced: '66778899',
        fechaNacimiento: '1987-07-18',
        fechaIngreso: '2020-04-15',
        departamentoId: departamentosCreados[7].id,
        cargoId: cargosCreados[15].id // BI Developer
      },
      {
        nombre: 'Mateo',
        apellido: 'García',
        ced: '77889900',
        fechaNacimiento: '1985-09-22',
        fechaIngreso: '2019-08-01',
        departamentoId: departamentosCreados[7].id,
        cargoId: cargosCreados[16].id // Data Engineer
      },
      
      // CloudTech Services - DevOps
      {
        nombre: 'Alejandra',
        apellido: 'Sánchez',
        ced: '88990011',
        fechaNacimiento: '1989-01-14',
        fechaIngreso: '2020-11-10',
        departamentoId: departamentosCreados[8].id,
        cargoId: cargosCreados[17].id // DevOps Engineer
      },
      {
        nombre: 'Daniel',
        apellido: 'Vega',
        ced: '99001122',
        fechaNacimiento: '1984-05-08',
        fechaIngreso: '2019-03-20',
        departamentoId: departamentosCreados[8].id,
        cargoId: cargosCreados[18].id // Site Reliability Engineer
      },
      
      // CloudTech Services - Cloud Architecture
      {
        nombre: 'Paola',
        apellido: 'Ruiz',
        ced: '00112233',
        fechaNacimiento: '1986-12-01',
        fechaIngreso: '2020-07-05',
        departamentoId: departamentosCreados[9].id,
        cargoId: cargosCreados[19].id // Cloud Architect
      },
      {
        nombre: 'Fernando',
        apellido: 'Díaz',
        ced: '10203040',
        fechaNacimiento: '1991-03-25',
        fechaIngreso: '2021-12-01',
        departamentoId: departamentosCreados[9].id,
        cargoId: cargosCreados[20].id // Cloud Engineer
      }
    ];

    const empleadosCreados = [];
    for (const empleado of empleados) {
      const empleadoCreado = await prisma.empleado.create({
        data: empleado
      });
      empleadosCreados.push(empleadoCreado);
    }

    // Asignar gerentes a departamentos
    console.log('👨‍💼 Asignando gerentes a departamentos...');
    await prisma.departamento.update({
      where: { id: departamentosCreados[0].id },
      data: { gerenteId: empleadosCreados[0].id } // Carlos Rodríguez - Tech Lead
    });
    
    await prisma.departamento.update({
      where: { id: departamentosCreados[1].id },
      data: { gerenteId: empleadosCreados[3].id } // Ana Silva - Systems Administrator
    });
    
    await prisma.departamento.update({
      where: { id: departamentosCreados[2].id },
      data: { gerenteId: empleadosCreados[5].id } // Carmen López - HR Manager
    });
    
    await prisma.departamento.update({
      where: { id: departamentosCreados[3].id },
      data: { gerenteId: empleadosCreados[7].id } // Sofia Vargas - Frontend Developer
    });
    
    await prisma.departamento.update({
      where: { id: departamentosCreados[4].id },
      data: { gerenteId: empleadosCreados[9].id } // Valentina Castro - Backend Developer
    });

    // Crear computadores y dispositivos
    console.log('💻 Creando computadores y dispositivos...');
    const equipos = [
      // Computadores para empleados
      { serial: 'PC001', estado: 'Activo', modeloId: modelosCreados[0].id, empleadoId: empleadosCreados[0].id, departamentoId: departamentosCreados[0].id },
      { serial: 'PC002', estado: 'Activo', modeloId: modelosCreados[1].id, empleadoId: empleadosCreados[1].id, departamentoId: departamentosCreados[0].id },
      { serial: 'PC003', estado: 'Activo', modeloId: modelosCreados[2].id, empleadoId: empleadosCreados[2].id, departamentoId: departamentosCreados[0].id },
      { serial: 'PC004', estado: 'Activo', modeloId: modelosCreados[3].id, empleadoId: empleadosCreados[3].id, departamentoId: departamentosCreados[1].id },
      { serial: 'PC005', estado: 'Activo', modeloId: modelosCreados[4].id, empleadoId: empleadosCreados[4].id, departamentoId: departamentosCreados[1].id },
      { serial: 'PC006', estado: 'Activo', modeloId: modelosCreados[5].id, empleadoId: empleadosCreados[5].id, departamentoId: departamentosCreados[2].id },
      { serial: 'PC007', estado: 'Activo', modeloId: modelosCreados[6].id, empleadoId: empleadosCreados[6].id, departamentoId: departamentosCreados[2].id },
      { serial: 'PC008', estado: 'Activo', modeloId: modelosCreados[7].id, empleadoId: empleadosCreados[7].id, departamentoId: departamentosCreados[3].id },
      { serial: 'PC009', estado: 'Activo', modeloId: modelosCreados[8].id, empleadoId: empleadosCreados[8].id, departamentoId: departamentosCreados[3].id },
      { serial: 'PC010', estado: 'Activo', modeloId: modelosCreados[9].id, empleadoId: empleadosCreados[9].id, departamentoId: departamentosCreados[4].id },
      
      // Dispositivos para empleados
      { serial: 'TAB001', estado: 'Activo', modeloId: modelosCreados[13].id, empleadoId: empleadosCreados[0].id, departamentoId: departamentosCreados[0].id },
      { serial: 'TAB002', estado: 'Activo', modeloId: modelosCreados[13].id, empleadoId: empleadosCreados[1].id, departamentoId: departamentosCreados[0].id },
      { serial: 'TAB003', estado: 'Activo', modeloId: modelosCreados[13].id, empleadoId: empleadosCreados[7].id, departamentoId: departamentosCreados[3].id },
      { serial: 'TAB004', estado: 'Activo', modeloId: modelosCreados[13].id, empleadoId: empleadosCreados[8].id, departamentoId: departamentosCreados[3].id },
      
      // Equipos sin asignar (en departamentos)
      { serial: 'PC011', estado: 'Disponible', modeloId: modelosCreados[0].id, departamentoId: departamentosCreados[0].id },
      { serial: 'PC012', estado: 'Disponible', modeloId: modelosCreados[1].id, departamentoId: departamentosCreados[1].id },
      { serial: 'PC013', estado: 'Mantenimiento', modeloId: modelosCreados[2].id, departamentoId: departamentosCreados[2].id },
      { serial: 'TAB005', estado: 'Disponible', modeloId: modelosCreados[13].id, departamentoId: departamentosCreados[3].id },
    ];

    for (const equipo of equipos) {
      if (equipo.serial.startsWith('PC')) {
        await prisma.computador.create({
          data: {
            serial: equipo.serial,
            estado: equipo.estado,
            modeloId: equipo.modeloId,
            empleadoId: equipo.empleadoId,
            departamentoId: equipo.departamentoId
          }
        });
      } else {
        await prisma.dispositivo.create({
          data: {
            serial: equipo.serial,
            estado: equipo.estado,
            modeloId: equipo.modeloId,
            empleadoId: equipo.empleadoId,
            departamentoId: equipo.departamentoId
          }
        });
      }
    }

    console.log('✅ Datos de prueba creados exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`   - ${empresasCreadas.length} empresas`);
    console.log(`   - ${departamentosCreados.length} departamentos`);
    console.log(`   - ${cargosCreados.length} cargos`);
    console.log(`   - ${empleadosCreados.length} empleados`);
    console.log(`   - ${modelosCreados.length} modelos de dispositivos`);
    console.log(`   - ${equipos.length} equipos (computadores y dispositivos)`);

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
