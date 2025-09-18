// Script para probar la creación de empresas con FormData
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testCreateEmpresa() {
  try {
    console.log('🧪 Probando creación de empresa con FormData...\n');
    
    const formData = new FormData();
    formData.append('nombre', `Empresa Test FormData ${new Date().toISOString()}`);
    formData.append('descripcion', 'Descripción de prueba con FormData');
    
    const response = await fetch('http://localhost:3000/api/empresas', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const empresa = await response.json();
      console.log(`✅ Empresa creada: ${empresa.nombre}`);
      console.log(`ID: ${empresa.id}`);
    } else {
      const error = await response.text();
      console.log(`❌ Error: ${error}`);
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

testCreateEmpresa();

