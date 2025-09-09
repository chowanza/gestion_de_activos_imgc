import { PrismaClient } from '@prisma/client';

// Empresas
const empresas = [
    { 
        nombre: 'IMGC', 
        descripcion: 'Industria Maderera y Gestión de Activos' 
    },
    // Agregar más empresas según necesidad
];

// Gerencias (mantenidas para compatibilidad)
const gerencias = [
    { nombre: 'Gerencia General' },
    { nombre: 'Gerencia Forestal e Institucional' },
    { nombre: 'Gerencia Operaciones Industriales y Sum.' },
    { nombre: 'Gcia. de Personas,Cultura y Comunicación' },
    { nombre: 'Gerencia de Administracion y Finanzas' },
    { nombre: 'Gerencia SMS y PCP' },
    { nombre: 'Gerencia de Ventas Nacionales y Mercadeo' },
    { nombre: 'Gerencia Legal' },
];

// Usuarios del sistema con nuevos roles
const users = [
    { username: 'adminti', password: 'maveit2013', role: 'admin' },
    { username: 'monitor', password: 'Masisa,.2025', role: 'user' },
    { username: 'viewer', password: 'viewer123', role: 'viewer' },
    { username: 'assigner', password: 'assigner123', role: 'assigner' },
];

// Agregar usuarios al modelo
async function seedUsers(prisma: PrismaClient) {
    for (const user of users) {
        await prisma.user.create({
            data: user,
        });
    }
}

// Agregar empresas al modelo
async function seedEmpresas(prisma: PrismaClient) {
    for (const empresa of empresas) {
        await prisma.empresa.create({
            data: empresa,
        });
    }
}

const prisma = new PrismaClient();

async function main() {
    console.log('Iniciando seed de la base de datos...');
    
    // Crear empresas
    await seedEmpresas(prisma);
    console.log('Empresas insertadas correctamente');
    
    // Crear gerencias (mantenidas para compatibilidad)
    // Comentado porque el modelo gerencia ya no existe en el esquema
    // for (const gerencia of gerencias) {
    //     await prisma.gerencia.create({
    //         data: gerencia,
    //     });
    // }
    // console.log('Gerencias insertadas correctamente');
    
    // Crear usuarios del sistema
    await seedUsers(prisma);
    console.log('Usuarios del sistema insertados correctamente');
    
    console.log('Seed completado exitosamente');
}
main()

    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
