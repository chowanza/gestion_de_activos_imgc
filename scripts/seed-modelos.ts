// scripts/seed-marcas-modelos.ts

import { PrismaClient } from '@prisma/client';

// Inicializa el cliente de Prisma
const prisma = new PrismaClient();

// Define tus datos aquí. Cada objeto 'marca' tiene una lista de 'modelos'.
const datosDeInventario = [
  {
    nombre: 'Hewlett-Packard',
    modelos: [
      {
        nombre: 'Elitebook 1040 G2',
        tipo: 'Laptop',
        img: '/uploads/modelos/_EliteBook_Folio_1040_G2.jpg', // Ruta pública a la imagen
      },
      {
        nombre: '14-AC186LA',
        tipo: 'Laptop',
        img: '/uploads/modelos/14-ac186la.jpg',
      },
      {
        nombre: '15 Notebook PC',
        tipo: 'Laptop',
        img: '/uploads/modelos/hp15.png',
      },
      {
        nombre: '240 G4 Notebook PC',
        tipo: 'Laptop',
        img: '/uploads/modelos/240-g4.png',
      },
      {
        nombre: 'Compaq 500B MT',
        tipo: 'Desktop',
        img: '/uploads/modelos/compaq-500b.jpg',
      },
      {
        nombre: '340 G1',
        tipo: 'Laptop',
        img: '/uploads/modelos/340g1.png',
      },
     {
        nombre: 'Compaq CQ2951LA',
        tipo: 'Desktop',
        img: '/uploads/modelos/Compaq-CQ2951LA.jpg',
      },
     {
        nombre: 'Compaq CQ5613LA',
        tipo: 'Desktop',
        img: '/uploads/modelos/Compaq-CQ5613LA.jpg',
      },
     {
        nombre: 'Compaq DX2200 MT',
        tipo: 'Desktop',
        img: '/uploads/modelos/HP-Compaq-DX2200.jpg',
      },
     {
        nombre: 'Compaq DX2400 MT',
        tipo: 'Desktop',
        img: '/uploads/modelos/dx2400.jpg',
      },
     {
        nombre: 'Compaq Presario CQ43',
        tipo: 'Laptop',
        img: '/uploads/modelos/cq43.jpg',
      },
      {
        nombre: 'CQ5000',
        tipo: 'Desktop',
        img: '/uploads/modelos/cq500.jpg',
      },
     {
        nombre: 'Elitebook 1040 G3',
        tipo: 'Laptop',
        img: '/uploads/modelos/1040-g3.jpg',
      },
     {
        nombre: 'G4-2050LA',
        tipo: 'Laptop',
        img: '/uploads/modelos/Pavilion_G4_1.png',
      },
     {
        nombre: 'G42-270LA',
        tipo: 'Laptop',
        img: '/uploads/modelos/G42-265la.png',
      },
     {
        nombre: 'Pro 3400 Series MT',
        tipo: 'Desktop',
        img: '/uploads/modelos/3400-MT.jpg',
      },
     {
        nombre: 'Pro 3500 Series MT',
        tipo: 'Desktop',
        img: '/uploads/modelos/3500-mt.jpg',
      },
     {
        nombre: 'G42-270LA',
        tipo: 'Laptop',
        img: '/uploads/modelos/G42-265la.png',
      },
     {
        nombre: 'Probook 440 G10',
        tipo: 'Laptop',
        img: '/uploads/modelos/probook-440-g10',
      },
     {
        nombre: 'Probook 440 G2',
        tipo: 'Laptop',
        img: '/uploads/modelos/probook-440-g2.jpg',
      },
     {
        nombre: 'Probook 440 G8',
        tipo: 'Laptop',
        img: '/uploads/modelos/HP-ProBook-440-G8.jpg',
      },
     {
        nombre: 'Probook 450 G3',
        tipo: 'Laptop',
        img: '/uploads/modelos/HP_Probook_450_G3.jpg',
      },
     {
        nombre: 'Probook 450 G7',
        tipo: 'Laptop',
        img: '/uploads/modelos/450-g7.jpg',
      },
     {
        nombre: 'Probook 450 G8',
        tipo: 'Laptop',
        img: '/uploads/modelos/450-g8.jpg',
      },
     {
        nombre: 'ProDesk 400 G3 SFF',
        tipo: 'Desktop',
        img: '/uploads/modelos/ProDesk-400.jpg',
      },
     {
        nombre: 'Z420 Workstation',
        tipo: 'Desktop',
        img: '/uploads/modelos/z420.jpg',
      },
     {
        nombre: '240 G1 Notebook PC  ',
        tipo: 'Desktop',
        img: '/uploads/modelos/240-g1.jpg',
      },
    ],
  },
  {
    nombre: 'Dell',
    modelos: [
      {
        nombre: 'XPS',
        tipo: 'Laptop',
        img: '/uploads/modelos/dellXps.jpg',
      },
      {
        nombre: 'Inspiron 14',
        tipo: 'Laptop',
        img: '/uploads/modelos/inspiron14.jpg',
      },
      {
        nombre: 'Inspiron 15',
        tipo: 'Laptop',
        img: '/uploads/modelos/Dell-Inspiron-15.jpg',
      },
      {
        nombre: 'Inspiron 15 3000 3511',
        tipo: 'Laptop',
        img: '/uploads/modelos/Inspiron-3511.jpg',
      },     
      {
        nombre: 'Inspiron 15 3000 3520',
        tipo: 'Laptop',
        img: '/uploads/modelos/Inspiron-3520.jpg',
      },
      {
        nombre: 'Inspiron 3421',
        tipo: 'Laptop',
        img: '/uploads/modelos/Inspiron-3421.jpg',
      },
      {
        nombre: 'Inspiron 3420',
        tipo: 'Laptop',
        img: '/uploads/modelos/Latitude-3420.png',
      },
      {
        nombre: 'OptiPlex 3050',
        tipo: 'Desktop',
        img: '/uploads/modelos/optiplex-3050.jpg',
      },
      {
        nombre: 'Vostro 3268',
        tipo: 'Desktop',
        img: '/uploads/modelos/dell-vostro-3268.jpg',
      },
    ],
  },
  {
    nombre:  'Lenovo',
    modelos: [
        {
            nombre: '8215358',
            tipo: 'Desktop',
            img: '/uploads/modelos/M4L-80061303-lg.jpg',
        },
        {
            nombre: 'G50-70',
            tipo: 'Laptop',
            img: '/uploads/modelos/g50-70.jpg',
        },
        {
            nombre: 'E430',
            tipo: 'Laptop',
            img: '/uploads/modelos/lenovo-e430.jpg',
        },
        {
            nombre: 'G70-70',
            tipo: 'Laptop',
            img: '/uploads/modelos/g70-70.jpg',
        },
        {
            nombre: 'B40-80',
            tipo: 'Laptop',
            img: '/uploads/modelos/b40-80-01.jpg',
        },
        {
            nombre: 'B590 20208',
            tipo: 'Laptop',
            img: '/uploads/modelos/920942-3.jpg',
        },
        {
            nombre: 'ThinkCenter 35972H0',
            tipo: 'Desktop',
            img: '/uploads/modelos/35972.jpg',
        },
    ]
  },{
    nombre: '3com',
    modelos : [
      {
        nombre: '3C16471',
        tipo: 'Switch',
        img: '/uploads/modelos/3CRWE154G72.jpg',
      },
      {
        nombre: 'OffiConnect',
        tipo: 'Switch',
        img: '/uploads/modelos/officonnect.jpg',
      },
    ]
  },
  {
    nombre: 'Allied Telesis',
    modelos: [
      {
        nombre: 'ATFS5716L',
        tipo: 'Switch',
        img: '/uploads/modelos/ATFS5716L.jpg',
      },
      {
        nombre: 'ATFS708',
        tipo: 'Switch',
        img: '/uploads/modelos/ATFS708.jpg',
      },
      {
        nombre: 'ATMC101XL',
        tipo: 'Switch',
        img: '/uploads/modelos/ATMC101XL.jpg',
      },
    ]
  },
  {
    nombre: 'CDP',
    modelos: [
      {
        nombre: 'R-UPR1008',
        tipo: 'UPS',
        img: '/uploads/modelos/UPS-CDP-R-UPR1008.jpg',
      },
    ]
  },
  {    nombre: 'Cisco',
    modelos: [
      {
        nombre: '2811',
        tipo: 'Router',
        img: '/uploads/modelos/cisco-2811-router.jpg',
      },
      {
        nombre: '2851',
        tipo: 'Router',
        img: '/uploads/modelos/CISCO-2851-V.jpg',
      },
      {
        nombre: '3845',
        tipo: 'Router',
        img: '/uploads/modelos/Cisco_3845__96413.jpg',
      },
      {
        nombre: '1200Aironet',
        tipo: 'AP',
        img: '/uploads/modelos/715sXZFp0sL._SL1500_.jpg',
      },
      {
        nombre: 'Catalyst 2960',
        tipo: 'Router',
        img: '/uploads/modelos/catalyst-2960.jpg',
      },
      {
        nombre: 'Catalyst 3560',
        tipo: 'Router',
        img: '/uploads/modelos/cisco-catalyst-3560.jpg',
      },
      {
        nombre: 'Linksys SFE2000',
        tipo: 'Switch',
        img: '/uploads/modelos/sfe2000.jpg',
      },
      {
        nombre: 'Linksys WRT310N',
        tipo: 'Router',
        img: '/uploads/modelos/linksys-wireless.jpg',
      },
      {
        nombre: 'SF220-24',
        tipo: 'Switch',
        img: '/uploads/modelos/SF220-24.jfif',
      },
      {
        nombre: 'SF220-48P',
        tipo: 'Switch',
        img: '/uploads/modelos/SF220-48P.png',
      },
      {
        nombre: 'SF300-48',
        tipo: 'Switch',
        img: '/uploads/modelos/SF300-48PP.jpg',
      },
      {
        nombre: 'SFE2000P',
        tipo: 'Switch',
        img: '/uploads/modelos/SFE2000P.jpg',
      },
      {
        nombre: 'SR224',
        tipo: 'Switch',
        img: '/uploads/modelos/SR224-EU_1.jpg',
      }
    ]
  },
  {
    nombre: 'D-Link',
    modelos: [
      {
        nombre: 'DES-1008D',
        tipo: 'Switch',
        img: '/uploads/modelos/DES1008D.png',
      },
      {
        nombre: 'DMC-300SC',
        tipo: 'Transceiver',
        img: '/uploads/modelos/DMC-300SC.png',
      },
    ]
  },
  {
    nombre: 'Echolife',
    modelos: [
      {
        nombre: 'EG8814V5',
        tipo: 'Router',
        img: '/uploads/modelos/EG8145V5-1.jpg',
      },
    ]
  },
  {
    nombre: 'Fortinet',
    modelos: [
      {
        nombre: 'FortiGate 60F',
        tipo: 'Firewall',
        img: '/uploads/modelos/FortiGate60F.jpg',
      },
      {
        nombre: 'FortiGate 200F',
        tipo: 'Firewall',
        img: '/uploads/modelos/200f.jfif',
      },
      {
        nombre: 'FortiGate 40F',
        tipo: 'Firewall',
        img: '/uploads/modelos/40f.jfif',
      },
      {
        nombre: 'FS124FFOE',
        tipo: 'Switch',
        img: '/uploads/modelos/124f.png',
      },
      {
        nombre: 'FS148FFPOE',
        tipo: 'Switch',
        img: '/uploads/modelos/148f.jpg',
      },
    ]
  },
  {
    nombre: 'Forza',
    modelos: [
      {
        nombre: 'NT-751',
        tipo: 'UPS',
        img: '/uploads/modelos/nt751.jpg',
      },
    ]
  },
  {
    nombre: 'HYUNDAI',
    modelos: [
      {
        nombre: 'HD2120',
        tipo: 'UPS',
        img: '/uploads/modelos/ups-online-hyundai.jpg',
      },

    ]
  },
  {
    nombre: 'MASRIVA',
    modelos: [      
      {
        nombre: 'MR-US3K',
        tipo: 'UPS',
        img: '/uploads/modelos/marsriva-mr-us3k_1-700x700.jpg',
      },
    ]
  },
  {
    nombre: 'Mikrotik',
    modelos: [
        {
          nombre: 'CSS610-8P-2S+IN',
          tipo: 'Switch',
          img: '/uploads/modelos/css610-8p-2sin.jpg',
        }
    ]
  },
    {
    nombre: 'Nera',
    modelos: [{
        nombre: 'R1C',
        tipo: 'Switch',
        img: '/uploads/modelos/nera-v3.jpg',
    }]
  },
    {
    nombre: 'Netlink',
    modelos: [
      {
        nombre: 'HTB-3100A',
        tipo: 'Transceiver',
        img: '/uploads/modelos/htv.jpg',
      },
      {
        nombre: 'HTB-3100B',
        tipo: 'Transceiver',
        img: '/uploads/modelos/HTB-3100B.jpg',
      },
      {
        nombre: 'HTBG503A',
        tipo: 'Transceiver',
        img: '/uploads/modelos/Grandstream-HT503-1.jpg',
      },
    ]
  },
    {
    nombre: 'Planet',
    modelos: [
      {
        nombre: 'GT802',
        tipo: 'Transceiver',
        img: '/uploads/modelos/gt802.jpg',
      },
      {
        nombre: 'XGS3-24242',
        tipo: 'Switch',
        img: '/uploads/modelos/Managed-Telecom-Switch-PLANET_XGS3-24242.jpg',
      },
    ]
  },
{
    nombre: 'TP-LINK',
    modelos: [
      {
        nombre: 'LS1008G',
        tipo: 'Switch',
        img: '/uploads/modelos/tp-link-ls1008.jpg',
      },
      {
        nombre: 'PHAROS CPE210',
        tipo: 'AP',
        img: '/uploads/modelos/pharos.jpg',
      },
      {
        nombre: 'TLSF1005D',
        tipo: 'Switch',
        img: '/uploads/modelos/TLSF1005D.jfif',
      },
      {
        nombre: 'TLWR845N',
        tipo: 'Router',
        img: '/uploads/modelos/tlwr.jfif',
      },
    ]
  },
  {
    nombre: 'Transition Networks',
    modelos: [
      {
        nombre: 'J/FE-CF-03(SC)',
        tipo: 'Transceiver',
        img: '/uploads/modelos/s-l400.jpg',
      }
    ]
  },
    {
    nombre: 'TrenNet',
    modelos: [
      {
        nombre: 'TFC110MSC',
        tipo: 'Transceiver',
        img: '/uploads/modelos/tfc110.jfif',
      }
    ]
  },
  {
    nombre: 'Ubiquiti',
    modelos: [
      {
        nombre: 'Litebeam5AC',
        tipo: 'AP',
        img: '/uploads/modelos/5ac.png',
      },
      {
        nombre: 'Litebeam5C',
        tipo: 'AP',
        img: '/uploads/modelos/5c.png',
      },
      {
        nombre: 'NanoStationLocoM2',
        tipo: 'AP',
        img: '/uploads/modelos/nanostation-2-loco-ubiquiti.jpg',
      },
      {
        nombre: 'U6-LR',
        tipo: 'AP',
        img: '/uploads/modelos/efa6c5fb-ubiquiti_unifi6-min.jpg',
      },
      {
        nombre: 'U6-PRO',
        tipo: 'AP',
        img: '/uploads/modelos/u6pro.jpg',
      },
            {
        nombre: 'UAP',
        tipo: 'AP',
        img: '/uploads/modelos/u6pro.jpg',
      },
      {
        nombre: 'UAP-AC-LR',
        tipo: 'AP',
        img: '/uploads/modelos/u6pro.jpg',
      },
    ]
  },

  // Agrega más marcas y modelos aquí
];

async function main() {
  console.log('Iniciando el script de semilla para Marcas y Modelos...');

  for (const marcaData of datosDeInventario) {
    // Usamos `upsert` para evitar crear marcas duplicadas si el script se ejecuta de nuevo.
    // Busca una marca por su nombre único.
    const marca = await prisma.marca.upsert({
      where: { nombre: marcaData.nombre },
      update: {}, // No hacemos nada si ya existe
      create: {
        nombre: marcaData.nombre,
      },
    });

    console.log(`Marca procesada: ${marca.nombre} (ID: ${marca.id})`);

    // Ahora, para cada modelo de esta marca, lo creamos y lo asociamos.
    for (const modeloData of marcaData.modelos) {
      // Primero buscamos si existe el modelo por nombre y marcaId
      const modeloExistente = await prisma.modeloDispositivo.findFirst({
        where: {
          nombre: modeloData.nombre,
          marcaId: marca.id,
        },
      });

      await prisma.modeloDispositivo.upsert({
        where: modeloExistente
          ? { id: modeloExistente.id }
          : { id: '' }, // id vacío nunca existirá, así que se creará
        update: {}, // No hacemos nada si ya existe
        create: {
          nombre: modeloData.nombre,
          tipo: modeloData.tipo,
          img: modeloData.img,
          marca: {
            connect: {
              id: marca.id,
            },
          },
        },
      });
      console.log(`  └─ Modelo creado: ${modeloData.nombre}`);
    }
  }

  console.log('¡Script de semilla completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('Ocurrió un error durante la ejecución del script:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Cierra la conexión de Prisma
    await prisma.$disconnect();
  });
