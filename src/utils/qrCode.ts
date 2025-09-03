import { showToast } from "nextjs-toast-notify";
import QRCode from 'qrcode';
  
  
  export const handleGenerateAndDownloadQR = async ({equipoId}: { equipoId: string}) => {
    const url = `http://localhost:3000/computadores/${equipoId}/details`;

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

      showToast.success("Código QR generado y listo para descargar.");

    } catch (err) {
      console.error('Error al generar el código QR:', err);
      showToast.error("No se pudo generar el código QR.");
    }
  }


   export const handleGenerateAndDownloadQRd = async ({equipoId}: { equipoId: string}) => {
    console.log("presionandoooo");
    const url = `http://localhost:3000/dispositivos/${equipoId}/details`;

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

      showToast.success("Código QR generado y listo para descargar.");

    } catch (err) {
      console.error('Error al generar el código QR:', err);
      showToast.error("No se pudo generar el código QR.");
    }
  }