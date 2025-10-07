#!/usr/bin/env npx tsx

/**
 * Script para verificar el estado de autenticación del usuario
 * 
 * Funcionalidad:
 * - Verifica si hay usuarios en la base de datos
 * - Proporciona instrucciones para hacer login
 * - Sugiere soluciones para problemas de autenticación
 * 
 * Uso: npx tsx scripts/check-auth-status.ts
 */

import { prisma } from '../src/lib/prisma';

async function checkAuthStatus() {
  console.log('🔍 Verificando estado de autenticación...\n');

  try {
    // 1. Verificar usuarios en la base de datos
    console.log('👥 Verificando usuarios en la base de datos...');
    
    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true
      }
    });

    if (usuarios.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      console.log('💡 Solución: Crear un usuario administrador');
      console.log('\n📝 Para crear un usuario:');
      console.log('   1. Ir a http://localhost:3000/usuarios');
      console.log('   2. Hacer clic en "Crear Usuario"');
      console.log('   3. Llenar el formulario con datos de administrador');
      console.log('   4. Hacer login con las credenciales creadas');
      return;
    }

    console.log(`✅ Usuarios encontrados: ${usuarios.length}`);
    usuarios.forEach((usuario, index) => {
      console.log(`   ${index + 1}. ${usuario.username} (${usuario.role}) - ID: ${usuario.id}`);
    });

    // 2. Verificar si hay un usuario admin
    const adminUser = usuarios.find(u => u.role === 'admin');
    
    if (!adminUser) {
      console.log('\n⚠️ No hay usuario administrador');
      console.log('💡 Solución: Crear un usuario con role "admin"');
    } else {
      console.log(`\n✅ Usuario administrador encontrado: ${adminUser.username}`);
    }

    // 3. Instrucciones para hacer login
    console.log('\n🔑 INSTRUCCIONES PARA HACER LOGIN:');
    console.log('\n📝 Pasos:');
    console.log('   1. Abrir navegador en: http://localhost:3000');
    console.log('   2. Si no está logueado, será redirigido a /login');
    console.log('   3. Usar las credenciales de uno de los usuarios disponibles');
    console.log('   4. Después del login, probar eliminar cargos nuevamente');

    // 4. Verificar cookies de sesión
    console.log('\n🍪 VERIFICACIÓN DE COOKIES DE SESIÓN:');
    console.log('\n📝 En el navegador (DevTools):');
    console.log('   1. Abrir DevTools (F12)');
    console.log('   2. Ir a la pestaña "Application" o "Aplicación"');
    console.log('   3. En el panel izquierdo, expandir "Cookies"');
    console.log('   4. Seleccionar "http://localhost:3000"');
    console.log('   5. Verificar que existe una cookie llamada "session"');
    console.log('   6. La cookie debe tener un valor (no estar vacía)');

    // 5. Soluciones para problemas comunes
    console.log('\n🔧 SOLUCIONES PARA PROBLEMAS COMUNES:');
    
    console.log('\n❌ Problema: Error 401 (No autorizado)');
    console.log('   ✅ Solución 1: Hacer login nuevamente');
    console.log('   ✅ Solución 2: Verificar cookies en DevTools');
    console.log('   ✅ Solución 3: Limpiar cookies y hacer login');
    console.log('   ✅ Solución 4: Reiniciar el servidor de desarrollo');

    console.log('\n❌ Problema: Error 500 (Internal Server Error)');
    console.log('   ✅ Solución 1: Verificar logs del servidor');
    console.log('   ✅ Solución 2: Reiniciar el servidor de desarrollo');
    console.log('   ✅ Solución 3: Verificar conexión a la base de datos');

    console.log('\n❌ Problema: Cookie de sesión no existe');
    console.log('   ✅ Solución 1: Hacer login nuevamente');
    console.log('   ✅ Solución 2: Verificar que el login fue exitoso');
    console.log('   ✅ Solución 3: Revisar la consola del navegador por errores');

    // 6. Comandos útiles
    console.log('\n⚡ COMANDOS ÚTILES:');
    console.log('\n🔄 Reiniciar servidor de desarrollo:');
    console.log('   npm run dev');
    
    console.log('\n🗑️ Limpiar cookies en navegador:');
    console.log('   - Chrome: Ctrl+Shift+Delete');
    console.log('   - Firefox: Ctrl+Shift+Delete');
    console.log('   - Edge: Ctrl+Shift+Delete');

    console.log('\n🔍 Verificar estado del servidor:');
    console.log('   - Abrir http://localhost:3000 en el navegador');
    console.log('   - Debería mostrar la página de login o dashboard');

    // 7. URLs de prueba
    console.log('\n🔗 URLs DE PRUEBA:');
    console.log('\n📱 Páginas principales:');
    console.log('   - Login: http://localhost:3000/login');
    console.log('   - Dashboard: http://localhost:3000/dashboard');
    console.log('   - Departamentos: http://localhost:3000/departamentos');
    
    if (usuarios.length > 0) {
      console.log('\n👤 Usuarios disponibles para login:');
      usuarios.forEach(usuario => {
        console.log(`   - ${usuario.username} (${usuario.role})`);
      });
    }

    console.log('\n🎯 DIAGNÓSTICO:');
    if (usuarios.length > 0) {
      console.log('✅ Base de datos configurada correctamente');
      console.log('✅ Usuarios disponibles');
      if (adminUser) {
        console.log('✅ Usuario administrador disponible');
      } else {
        console.log('⚠️ Recomendado: Crear usuario administrador');
      }
      console.log('❌ Problema: Usuario no autenticado en el navegador');
      console.log('\n💡 ACCIÓN REQUERIDA:');
      console.log('   Hacer login en el navegador con uno de los usuarios disponibles');
    } else {
      console.log('❌ No hay usuarios en la base de datos');
      console.log('\n💡 ACCIÓN REQUERIDA:');
      console.log('   Crear al menos un usuario en la base de datos');
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
checkAuthStatus();
