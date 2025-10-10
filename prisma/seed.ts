import { PrismaClient } from '@prisma/client';

// Empresas actuales de la base de datos
const empresas = [
    { 
        id: 'e7903c3a-9b0a-4ea6-a3f6-ede3d8990f30',
        nombre: 'ALAS DEL SUR', 
        descripcion: null
    },
    { 
        id: '0f353412-ac45-4bbd-b103-9c57994da9b0',
        nombre: 'HIERROS UNIDOS', 
        descripcion: null
    },
    { 
        id: 'ea965df1-4bdc-400f-a189-87b8f1ceff87',
        nombre: 'IMGC GROUP', 
        descripcion: null
    },
    { 
        id: '85531e55-3b48-47e0-9145-37d587c3ed3d',
        nombre: 'IMGC INTERNACIONAL', 
        descripcion: null
    },
    { 
        id: 'e929b51c-24fa-4db2-9e00-7f7782f060f8',
        nombre: 'IMGC IRON', 
        descripcion: null
    },
    { 
        id: '9420e2c6-5914-4b4c-9f9f-8ccb21508da3',
        nombre: 'INVERSIONES 286 CORP', 
        descripcion: null
    },
    { 
        id: '29e3e636-d74b-4724-a3bc-fb7fe4aa28d0',
        nombre: 'PUERTORINOCO', 
        descripcion: null
    },
    { 
        id: '73008aae-6586-40fd-aa86-d9f52a78425c',
        nombre: 'SAO', 
        descripcion: null
    },
    { 
        id: '59e35aea-90cd-4cc4-99de-0ef93179fc4d',
        nombre: 'SUBACUATICA DE VENEZUELA', 
        descripcion: null
    },
    { 
        id: 'ecdf7eb5-19ce-487f-908e-0594e9c1097d',
        nombre: 'TECFIN', 
        descripcion: null
    },
    { 
        id: '7783cca8-8761-482d-924c-e80725d92a27',
        nombre: 'TRIBIKE', 
        descripcion: null
    }
];

// Usuarios del sistema actuales
const users = [
    { 
        id: 'admin-user-id',
        username: 'admin', 
        password: 'admin123', 
        role: 'admin' 
    }
];

// Departamentos actuales
const departamentos = [
    { 
        id: '8445c4b1-3e3b-4686-97d8-a7910380c7b0',
        nombre: 'Finanzas - IMGC IRON'
    },
    { 
        id: '0bda66ab-75bc-42c1-a141-47c34ff8fc27',
        nombre: 'Finanzas - PUERTORINOCO'
    },
    { 
        id: 'b34e5ccb-5844-4611-8b6c-80a68f669b8c',
        nombre: 'Finanzas - TECFIN'
    },
    { 
        id: 'd4910fd3-7b40-40ec-88a1-d3e65efc693c',
        nombre: 'Finanzas - TRIBIKE'
    },
    { 
        id: '7ab9d18d-bba4-4e33-b28a-c48e39667568',
        nombre: 'Finanzas - TRIBIKE'
    },
    { 
        id: '9f048d38-bb72-4495-9daf-638c5233429f',
        nombre: 'Marketing - IMGC IRON'
    },
    { 
        id: 'bee033b2-ac73-4add-a696-baac8203f167',
        nombre: 'Marketing - PUERTORINOCO'
    },
    { 
        id: '9f68e5f3-bdc0-4ea9-90af-7284414f8b29',
        nombre: 'Marketing - TECFIN'
    },
    { 
        id: '9d4fc295-83e9-4fa0-a0ef-50e8d85df488',
        nombre: 'Marketing - TRIBIKE'
    },
    { 
        id: 'e0143dca-0d51-4e38-bff9-fa3e3987872d',
        nombre: 'Operaciones - IMGC IRON'
    },
    { 
        id: 'a31b279d-a88a-4b8b-a819-79cb68483c42',
        nombre: 'Operaciones - PUERTORINOCO'
    },
    { 
        id: '6ca2078c-1a2f-451b-b346-b3d6c0c26891',
        nombre: 'Operaciones - TECFIN'
    },
    { 
        id: '5be55833-a5ef-4b0a-814a-8705d928d7c7',
        nombre: 'Operaciones - TRIBIKE'
    },
    { 
        id: 'b36ff414-2f75-4da5-b367-1490589d80e1',
        nombre: 'Recursos Humanos - IMGC IRON'
    },
    { 
        id: '3c1cbb0c-b276-414d-ae4a-434759249fe4',
        nombre: 'Recursos Humanos - PUERTORINOCO'
    },
    { 
        id: 'fb46aa80-42fc-48e5-80d6-a70117ad966e',
        nombre: 'Recursos Humanos - TECFIN'
    },
    { 
        id: 'f3291557-a55b-46b4-85cc-e70549a00274',
        nombre: 'Recursos Humanos - TRIBIKE'
    },
    { 
        id: 'b58d5000-fd29-45ea-ab50-8038637fbd50',
        nombre: 'Tecnología - IMGC IRON'
    },
    { 
        id: '9a7fe938-a39c-4873-9748-7af556293620',
        nombre: 'Tecnología - PUERTORINOCO'
    },
    { 
        id: '0019ae21-0662-40b9-9ea0-99078b79ca7d',
        nombre: 'Tecnología - TECFIN'
    },
    { 
        id: '98b7e338-d065-44ea-86d4-4911a4f620b5',
        nombre: 'Tecnología - TRIBIKE'
    },
    { 
        id: '9f529067-1a42-426b-b4c1-dc2ab168a559',
        nombre: 'Telematica'
    },
    { 
        id: 'bb489a87-bb1d-477a-8cdb-bdd36fb1ded2',
        nombre: 'Ventas - IMGC IRON'
    },
    { 
        id: '29185676-fe4f-4c4f-afb2-3c9b5dbaccd9',
        nombre: 'Ventas - PUERTORINOCO'
    },
    { 
        id: '1d41ffbd-49cb-4765-b777-d3ecfeb83d85',
        nombre: 'Ventas - TECFIN'
    },
    { 
        id: '84b29870-cd55-4933-b2a7-4d3841a9902c',
        nombre: 'Ventas - TRIBIKE'
    }
];

// Cargos actuales
const cargos = [
    { 
        id: '0079e755-e3f1-48ec-a42b-a7c0eca7e43c',
        nombre: 'Administrador de Redes'
    },
    { 
        id: '405c09c7-da6d-4e4d-abb7-7beaa0af8624',
        nombre: 'Analista de Sistemas'
    },
    { 
        id: 'da58da40-d662-4a8c-a03e-701868e457a3',
        nombre: 'Asistente Administrativo'
    },
    { 
        id: '48830b2d-7f88-44ea-86a1-38fb8396b383',
        nombre: 'Cargo de Prueba Actualizado'
    },
    { 
        id: '155cde1d-0069-4a97-86fe-8500ed6adfc1',
        nombre: 'Contador'
    },
    { 
        id: '8a3f53f1-6136-4491-94d7-8ac1d8536fbc',
        nombre: 'Desarrollador Junior'
    },
    { 
        id: '1685ebe6-4548-461c-9ea7-9c0c7108faab',
        nombre: 'Desarrollador Senior'
    },
    { 
        id: '1789e7cb-b87e-42f1-9759-7df3ce18ea77',
        nombre: 'Especialista en Soporte'
    },
    { 
        id: '21282979-22fb-41c8-83de-a1d6bd1e13a6',
        nombre: 'Gerente de Tecnología'
    },
    { 
        id: '6664760c-6912-48be-a81c-f1620ecaf739',
        nombre: 'Gerente General'
    },
    { 
        id: '857f4237-fbc8-4643-8270-6bd31583ed42',
        nombre: 'Jefe Departamento'
    },
    { 
        id: '8adc6e6c-4d52-45b1-9094-212bea7aab68',
        nombre: 'Pasante'
    }
];

// Función para crear empresas
async function seedEmpresas(prisma: PrismaClient) {
    console.log('🏢 Creando empresas...');
    for (const empresa of empresas) {
        await prisma.empresa.upsert({
            where: { id: empresa.id },
            update: empresa,
            create: empresa,
        });
    }
    console.log(`✅ ${empresas.length} empresas procesadas`);
}

// Función para crear usuarios del sistema
async function seedUsers(prisma: PrismaClient) {
    console.log('👥 Creando usuarios del sistema...');
    for (const user of users) {
        await prisma.user.upsert({
            where: { username: user.username },
            update: user,
            create: user,
        });
    }
    console.log(`✅ ${users.length} usuarios procesados`);
}

// Función para crear departamentos
async function seedDepartamentos(prisma: PrismaClient) {
    console.log('🏢 Creando departamentos...');
    for (const departamento of departamentos) {
        await prisma.departamento.upsert({
            where: { id: departamento.id },
            update: departamento,
            create: departamento,
        });
    }
    console.log(`✅ ${departamentos.length} departamentos procesados`);
}

// Función para crear cargos
async function seedCargos(prisma: PrismaClient) {
    console.log('💼 Creando cargos...');
    for (const cargo of cargos) {
        await prisma.cargo.upsert({
            where: { id: cargo.id },
            update: cargo,
            create: cargo,
        });
    }
    console.log(`✅ ${cargos.length} cargos procesados`);
}

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Iniciando seed de la base de datos...');
    
    // Crear empresas
    await seedEmpresas(prisma);
    
    // Crear departamentos
    await seedDepartamentos(prisma);
    
    // Crear cargos
    await seedCargos(prisma);
    
    // Crear usuarios del sistema
    await seedUsers(prisma);
    
    console.log('🎉 Seed completado exitosamente');
}

main()
    .catch((e) => {
        console.error('❌ Error durante el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });