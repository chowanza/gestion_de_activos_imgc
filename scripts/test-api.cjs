const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('🧪 Probando API de usuarios...\n');
    
    const response = await fetch('http://localhost:3000/api/usuarios');
    
    if (!response.ok) {
      console.error(`❌ Error en API: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    console.log(`✅ API respondió correctamente`);
    console.log(`📊 Total empleados en API: ${data.length}`);
    
    // Verificar emails
    const empleadosConEmail = data.filter(emp => emp.email && emp.email.trim() !== '');
    console.log(`📧 Empleados con email: ${empleadosConEmail.length}`);
    
    // Mostrar algunos ejemplos
    console.log('\n📋 Primeros 5 empleados con email:');
    empleadosConEmail.slice(0, 5).forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.nombre} ${emp.apellido} - ${emp.email}`);
    });
    
    // Verificar estructura de datos
    if (data.length > 0) {
      console.log('\n🔍 Estructura del primer empleado:');
      const firstEmp = data[0];
      console.log(JSON.stringify(firstEmp, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
