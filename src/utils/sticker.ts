// utils/sticker.ts
// import QRCode from 'qrcode'
// import html2canvas from 'html2canvas'
// import { showToast } from 'nextjs-toast-notify'


// export const handleGenerateAndDownloadSticker = async (id: string, localidad: string, serial: string, descripcion: string) => {


//   // 1. Generar el QR del detalle del equipo
//   const detalleURL = `http://localhost:3000/computadores/${id}/details`
//   try {
//     const qrDataURL = await QRCode.toDataURL(detalleURL, {
//       width: 200,
//       margin: 2,
//       errorCorrectionLevel: 'H'
//     })

//     // 2. Crear un contenedor invisible para el sticker
//     const stickerEl = document.createElement('div')
//     stickerEl.style.width = '300px'
//     stickerEl.style.padding = '12px'
//     stickerEl.style.border = '1px solid #333'
//     stickerEl.style.background = '#fff'
//     stickerEl.style.fontFamily = 'Arial, sans-serif'
//     stickerEl.style.fontSize = '12px'
//     stickerEl.style.lineHeight = '1.4'
//     // Lo posicionamos fuera de la vista
//     stickerEl.style.position = 'fixed'
//     stickerEl.style.left = '-10000px'

//     // 3. Poblamos el sticker con HTML
//     stickerEl.innerHTML = `
//       <h2 style="margin:0 0 8px;font-size:16px;">Asignación de Equipo</h2>
//       <p style="margin:2px 0;">Localidad: ${localidad}</p>
//       <p style="margin:2px 0;">Serial: ${serial}</p>
//       <p style="margin:2px 0;">Descripción: ${descripcion}</p>
//         <img src="${qrDataURL}" alt="QR Code" style="width:100px;height:100px;" />
//       </div>
//     `
//     document.body.appendChild(stickerEl)

//     // 4. Capturar con html2canvas y descargar
//     const canvas = await html2canvas(stickerEl, { backgroundColor: '#ffffff' })
//     const imgBlob = await new Promise<Blob | null>(resolve =>
//       canvas.toBlob(blob => resolve(blob), 'image/png')
//     )
//     if (!imgBlob) throw new Error('No se pudo generar la imagen PNG')

//     const link = document.createElement('a')
//     link.href = URL.createObjectURL(imgBlob)
//     link.download = `Sticker_Equipo_${id}.png`
//     document.body.appendChild(link)
//     link.click()
//     document.body.removeChild(link)
//     document.body.removeChild(stickerEl)

//     showToast.success('Sticker generado y listo para descargar.')
//   } catch (error) {
//     console.error('Error al generar sticker:', error)
//     showToast.error('No se pudo generar el sticker.')
//   }
// }
