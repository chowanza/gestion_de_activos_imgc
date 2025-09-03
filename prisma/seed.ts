import { PrismaClient, Prisma, Role } from '@prisma/client';

const gerencias = [
    { nombre: 'Gerencia General' },
    { nombre: 'Gerencia Forestal e Institucional' },
    { nombre: 'Gerencia Operaciones Industriales y Sum.' },
    { nombre: 'Gcia. de Personas,Cultura y Comunicación' },
    { nombre: 'Gerencia de Administracion y Finanzas' },
    { nombre: 'Gerencia SMS y PCP' },
    { nombre: 'Gerencia de Ventas Nacionales y Mercadeo' },
    { nombre: 'Gerencia Legal' },
    // Agrega más gerencias según tu necesidad
];

const users = [
    { username: 'adminti', password: 'maveit2013', role: Role.admin },
    { username: 'monitor', password: 'Masisa,.2025', role: Role.user },
];

// Agregar usuarios al modelo
async function seedUsers(prisma: PrismaClient) {
    for (const user of users) {
        await prisma.user.create({
            data: user,
        });
    }
}
const prisma = new PrismaClient();

async function main() {
    for (const gerencia of gerencias) {
        await prisma.gerencia.create({
            data: gerencia,
        });
    }
    console.log('Gerencias insertadas correctamente');
}
main()

    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
