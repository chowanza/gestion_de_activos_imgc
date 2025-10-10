// next.config.js - Configuración para intranet
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurar para que escuche en todas las interfaces de red
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  
  // Headers CORS para intranet
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          // Permitir acceso desde toda la red local (172.16.0.0/21)
          { key: 'Access-Control-Allow-Origin', value: 'http://172.16.0.0/21' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ]
  },
  
  // Configurar para producción
  output: 'standalone',
  
  // Variables de entorno para intranet
  env: {
    NEXTAUTH_URL: 'http://172.16.3.123:3000',
    NEXT_PUBLIC_APP_URL: 'http://172.16.3.123:3000'
  }
}

module.exports = nextConfig