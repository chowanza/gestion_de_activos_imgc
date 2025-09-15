import { showToast } from "nextjs-toast-notify";
import QRCode from 'qrcode';

// Configuración de IP de red (puede ser modificada por el usuario)
let NETWORK_IP: string | null = null;

// Función para configurar la IP de red manualmente
export const setNetworkIP = (ip: string) => {
  NETWORK_IP = ip;
  localStorage.setItem('networkIP', ip);
};

// Función para obtener la IP configurada
const getConfiguredIP = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('networkIP');
  }
  return null;
};

// Función para obtener la IP de red usando WebRTC
const getNetworkIP = async (): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve('172.16.3.123'); // IP por defecto para servidor
      return;
    }

    // 1. Verificar si hay una IP configurada manualmente
    const configuredIP = getConfiguredIP();
    if (configuredIP) {
      resolve(configuredIP);
      return;
    }

    // 2. Si ya no es localhost, usar la IP actual
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      resolve(hostname);
      return;
    }

    // Usar WebRTC para detectar la IP local
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.createDataChannel('');
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate.candidate;
        const ipMatch = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
        if (ipMatch) {
          const ip = ipMatch[1];
          // Filtrar IPs privadas (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
          if (ip.startsWith('192.168.') || ip.startsWith('10.') || 
              (ip.startsWith('172.') && parseInt(ip.split('.')[1]) >= 16 && parseInt(ip.split('.')[1]) <= 31)) {
            pc.close();
            resolve(ip);
            return;
          }
        }
      }
    };

    pc.createOffer().then(offer => pc.setLocalDescription(offer));

    // Timeout de 3 segundos
    setTimeout(() => {
      pc.close();
      resolve('172.16.3.123'); // IP por defecto si no se detecta
    }, 3000);
  });
};

export const handleGenerateAndDownloadQR = async ({equipoId}: { equipoId: string}) => {
    const networkIP = await getNetworkIP();
    const url = `http://${networkIP}:3000/computadores/${equipoId}/details`;

    try {
      // 2. Genera el QR como una imagen en formato Data URL (Base64)
      // Puedes pasarle opciones para cambiar tamaño, color, etc.
      const qrCodeDataURL = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'H' // Alta corrección de errores
      });

      // 3. Crea un enlace <a> en memoria para iniciar la descarga
      const downloadLink = document.createElement('a');
      downloadLink.href = qrCodeDataURL;
      
      // 4. Define el nombre del archivo que se descargará
      downloadLink.download = `QR_Equipo_${equipoId}.png`;

      // 5. Simula un clic en el enlace para abrir el diálogo de descarga
      document.body.appendChild(downloadLink); // Necesario para Firefox
      downloadLink.click();
      document.body.removeChild(downloadLink); // Limpia el DOM

      showToast.success(`Código QR generado con URL de red: ${url}`);

    } catch (err) {
      console.error('Error al generar el código QR:', err);
      showToast.error("No se pudo generar el código QR.");
    }
  }

export const handleGenerateAndDownloadQRd = async ({equipoId}: { equipoId: string}) => {
    console.log("presionandoooo");
    const networkIP = await getNetworkIP();
    const url = `http://${networkIP}:3000/dispositivos/${equipoId}/details`;

    try {
      // 2. Genera el QR como una imagen en formato Data URL (Base64)
      // Puedes pasarle opciones para cambiar tamaño, color, etc.
      const qrCodeDataURL = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'H' // Alta corrección de errores
      });

      // 3. Crea un enlace <a> en memoria para iniciar la descarga
      const downloadLink = document.createElement('a');
      downloadLink.href = qrCodeDataURL;
      
      // 4. Define el nombre del archivo que se descargará
      downloadLink.download = `QR_Equipo_${equipoId}.png`;

      // 5. Simula un clic en el enlace para abrir el diálogo de descarga
      document.body.appendChild(downloadLink); // Necesario para Firefox
      downloadLink.click();
      document.body.removeChild(downloadLink); // Limpia el DOM

      showToast.success(`Código QR generado con URL de red: ${url}`);

    } catch (err) {
      console.error('Error al generar el código QR:', err);
      showToast.error("No se pudo generar el código QR.");
    }
  }