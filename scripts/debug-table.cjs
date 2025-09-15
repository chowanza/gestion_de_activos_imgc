const https = require('https');
const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function debugTable() {
  try {
    console.log('🔍 Debugging tabla de empleados...\n');
    
    const data = await makeRequest('http://localhost:3000/api/usuarios');
    
    console.log(`📊 Total empleados: ${data.length}`);
    
    // Verificar estructura de datos
    if (data.length > 0) {
      const firstEmp = data[0];
      console.log('\n🔍 Estructura del primer empleado:');
      console.log('Campos disponibles:', Object.keys(firstEmp));
      console.log('Email presente:', 'email' in firstEmp);
      console.log('Valor del email:', firstEmp.email);
      console.log('Tipo del email:', typeof firstEmp.email);
    }
    
    // Verificar empleados con email
    const empleadosConEmail = data.filter(emp => emp.email && emp.email.trim() !== '');
    console.log(`\n📧 Empleados con email: ${empleadosConEmail.length}`);
    
    // Mostrar algunos ejemplos
    console.log('\n📋 Primeros 3 empleados con email:');
    empleadosConEmail.slice(0, 3).forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.nombre} ${emp.apellido} - "${emp.email}"`);
    });
    
    // Verificar empleados sin email
    const sinEmail = data.filter(emp => !emp.email || emp.email.trim() === '');
    console.log(`\n❌ Empleados sin email: ${sinEmail.length}`);
    if (sinEmail.length > 0) {
      console.log('Primeros 3 sin email:');
      sinEmail.slice(0, 3).forEach((emp, index) => {
        console.log(`${index + 1}. ${emp.nombre} ${emp.apellido} - "${emp.email}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugTable();
