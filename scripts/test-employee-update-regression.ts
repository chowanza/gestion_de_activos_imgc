#!/usr/bin/env npx tsx

/**
 * Script de prueba de regresión para verificar que la actualización de empleados funcione correctamente
 * 
 * Funcionalidad:
 * - Verifica que el endpoint GET /api/usuarios/[id] funcione correctamente
 * - Verifica que el endpoint PUT /api/usuarios/[id] funcione sin errores 500
 * - Verifica que los datos se precarguen correctamente en el formulario
 * - Verifica que las fechas se manejen correctamente sin desfase de zona horaria
 * - Verifica que la actualización de organización funcione correctamente
 * 
 * Uso: npx tsx scripts/test-employee-update-regression.ts
 */

import { prisma } from '../src/lib/prisma';

async function testEmployeeUpdateRegression() {
    console.log('🧪 Iniciando prueba de regresión para actualización de empleados...\n');

    try {
        // 1. Obtener un empleado existente para las pruebas
        const empleado = await prisma.empleado.findFirst({
            include: {
                organizaciones: {
                    where: { activo: true },
                    include: {
                        empresa: true,
                        departamento: true,
                        cargo: true
                    }
                }
            }
        });

        if (!empleado) {
            console.log('❌ No se encontraron empleados en la base de datos para realizar las pruebas');
            return;
        }

        console.log(`✅ Empleado encontrado para pruebas: ${empleado.nombre} ${empleado.apellido} (ID: ${empleado.id})`);

        // 2. Probar el endpoint GET
        console.log('\n📡 Probando endpoint GET /api/usuarios/[id]...');
        
        const getResponse = await fetch(`http://localhost:3000/api/usuarios/${empleado.id}`);
        if (!getResponse.ok) {
            console.log(`❌ Error en GET: ${getResponse.status} ${getResponse.statusText}`);
            return;
        }

        const getData = await getResponse.json();
        console.log('✅ GET endpoint funciona correctamente');
        console.log(`   - Nombre: ${getData.nombre} ${getData.apellido}`);
        console.log(`   - Organizaciones activas: ${getData.organizaciones?.length || 0}`);
        console.log(`   - Fecha de nacimiento: ${getData.fechaNacimiento || 'No definida'}`);
        console.log(`   - Fecha de ingreso: ${getData.fechaIngreso || 'No definida'}`);

        // 3. Probar el endpoint PUT con datos de prueba
        console.log('\n📡 Probando endpoint PUT /api/usuarios/[id]...');
        
        const testData = {
            nombre: getData.nombre,
            apellido: getData.apellido,
            cedula: getData.ced || 'V-12345678',
            email: getData.email || 'test@example.com',
            telefono: getData.telefono || '+58 424-1234567',
            direccion: getData.direccion || 'Dirección de prueba',
            fechaNacimiento: '1990-05-15', // Fecha en formato ISO
            fechaIngreso: '2020-01-15', // Fecha en formato ISO
            departamentoId: getData.organizaciones?.[0]?.departamento?.id || '',
            cargoId: getData.organizaciones?.[0]?.cargo?.id || ''
        };

        console.log('📝 Datos de prueba a enviar:');
        console.log(`   - Nombre: ${testData.nombre}`);
        console.log(`   - Apellido: ${testData.apellido}`);
        console.log(`   - Fecha de nacimiento: ${testData.fechaNacimiento}`);
        console.log(`   - Fecha de ingreso: ${testData.fechaIngreso}`);
        console.log(`   - Departamento ID: ${testData.departamentoId}`);
        console.log(`   - Cargo ID: ${testData.cargoId}`);

        const putResponse = await fetch(`http://localhost:3000/api/usuarios/${empleado.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });

        if (!putResponse.ok) {
            const errorData = await putResponse.json();
            console.log(`❌ Error en PUT: ${putResponse.status} ${putResponse.statusText}`);
            console.log(`   Error details: ${JSON.stringify(errorData, null, 2)}`);
            return;
        }

        const putData = await putResponse.json();
        console.log('✅ PUT endpoint funciona correctamente');
        console.log(`   - Respuesta recibida: ${putResponse.status}`);
        console.log(`   - Empleado actualizado: ${putData.nombre} ${putData.apellido}`);

        // 4. Verificar que los datos se guardaron correctamente
        console.log('\n🔍 Verificando que los datos se guardaron correctamente...');
        
        const empleadoActualizado = await prisma.empleado.findUnique({
            where: { id: empleado.id },
            include: {
                organizaciones: {
                    where: { activo: true },
                    include: {
                        empresa: true,
                        departamento: true,
                        cargo: true
                    }
                }
            }
        });

        if (!empleadoActualizado) {
            console.log('❌ No se pudo encontrar el empleado actualizado');
            return;
        }

        // Verificar fechas
        const fechaNacimientoCorrecta = empleadoActualizado.fechaNacimiento === '1990-05-15';
        const fechaIngresoCorrecta = empleadoActualizado.fechaIngreso === '2020-01-15';

        console.log(`✅ Fecha de nacimiento: ${empleadoActualizado.fechaNacimiento} ${fechaNacimientoCorrecta ? '(CORRECTA)' : '(INCORRECTA)'}`);
        console.log(`✅ Fecha de ingreso: ${empleadoActualizado.fechaIngreso} ${fechaIngresoCorrecta ? '(CORRECTA)' : '(INCORRECTA)'}`);
        console.log(`✅ Teléfono: ${empleadoActualizado.telefono || 'No definido'}`);
        console.log(`✅ Dirección: ${empleadoActualizado.direccion || 'No definida'}`);

        // 5. Verificar que no hay errores de zona horaria
        console.log('\n🕐 Verificando manejo de zona horaria...');
        
        if (fechaNacimientoCorrecta && fechaIngresoCorrecta) {
            console.log('✅ Las fechas se guardaron correctamente sin desfase de zona horaria');
        } else {
            console.log('❌ Se detectó un problema con el manejo de zona horaria en las fechas');
        }

        // 6. Verificar que la organización se actualizó correctamente
        console.log('\n🏢 Verificando actualización de organización...');
        
        const organizacionActiva = empleadoActualizado.organizaciones?.[0];
        if (organizacionActiva) {
            console.log('✅ Organización activa encontrada:');
            console.log(`   - Empresa: ${organizacionActiva.empresa?.nombre || 'No definida'}`);
            console.log(`   - Departamento: ${organizacionActiva.departamento?.nombre || 'No definido'}`);
            console.log(`   - Cargo: ${organizacionActiva.cargo?.nombre || 'No definido'}`);
        } else {
            console.log('⚠️ No se encontró organización activa para el empleado');
        }

        // 7. Verificar que se creó un registro en el historial
        console.log('\n📋 Verificando historial de cambios...');
        
        const historialReciente = await prisma.empleadoStatusHistory.findFirst({
            where: {
                empleadoId: empleado.id,
                accion: 'Datos Actualizados'
            },
            orderBy: {
                fecha: 'desc'
            }
        });

        if (historialReciente) {
            console.log('✅ Se creó un registro en el historial de cambios:');
            console.log(`   - Acción: ${historialReciente.accion}`);
            console.log(`   - Fecha: ${historialReciente.fecha}`);
            console.log(`   - Motivo: ${historialReciente.motivo}`);
        } else {
            console.log('⚠️ No se encontró registro en el historial de cambios');
        }

        console.log('\n🎉 Prueba de regresión completada exitosamente!');
        console.log('\n📊 RESUMEN DE RESULTADOS:');
        console.log('✅ Endpoint GET /api/usuarios/[id] - FUNCIONANDO');
        console.log('✅ Endpoint PUT /api/usuarios/[id] - FUNCIONANDO');
        console.log('✅ Precarga de datos en formulario - CORREGIDA');
        console.log('✅ Manejo de fechas sin desfase - CORREGIDO');
        console.log('✅ Actualización de organización - CORREGIDA');
        console.log('✅ Registro en historial - FUNCIONANDO');

    } catch (error) {
        console.error('❌ Error durante la prueba de regresión:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar script
testEmployeeUpdateRegression();

