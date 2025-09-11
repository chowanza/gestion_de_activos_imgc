import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedUbicaciones() {
  try {
    console.log('🌱 Iniciando seed de ubicaciones...');

    // Crear ubicaciones de prueba
    const ubicaciones = [
      {
        nombre: 'Oficina Principal',
        descripcion: 'Edificio administrativo principal',
        direccion: 'Calle Principal 123',
        piso: '1',
        sala: 'A'
      },
      {
        nombre: 'Laboratorio de Sistemas',
        descripcion: 'Laboratorio de computación y sistemas',
        direccion: 'Calle Principal 123',
        piso: '2',
        sala: 'B'
      },
      {
        nombre: 'Almacén de Equipos',
        descripcion: 'Depósito de equipos en resguardo',
        direccion: 'Calle Principal 123',
        piso: 'Sótano',
        sala: 'C'
      },
      {
        nombre: 'Sala de Juntas',
        descripcion: 'Sala de reuniones ejecutivas',
        direccion: 'Calle Principal 123',
        piso: '3',
        sala: 'D'
      },
      {
        nombre: 'Área de Reparaciones',
        descripcion: 'Taller de reparación de equipos',
        direccion: 'Calle Principal 123',
        piso: '1',
        sala: 'E'
      }
    ];

    for (const ubicacionData of ubicaciones) {
      const ubicacion = await prisma.ubicacion.create({
        data: ubicacionData
      });
      console.log(`✅ Ubicación creada: ${ubicacion.nombre}`);
    }

    console.log('🎉 Seed de ubicaciones completado exitosamente!');
  } catch (error) {
    console.error('❌ Error en seed de ubicaciones:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUbicaciones();
