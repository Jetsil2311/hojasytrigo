// Turns an image File into a compressed data URL so it can live in the local
// demo store. No upload service is involved: the picture never leaves the
// browser. Large photos are scaled down to keep localStorage small.
const MAX_SIDE = 900
const QUALITY = 0.82

export async function uploadImage(file) {
  if (!file) throw new Error('No se seleccionó ninguna imagen')
  const source = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'))
    reader.readAsDataURL(file)
  })

  const img = await new Promise((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('Formato de imagen no soportado'))
    el.src = source
  })

  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
  return { url: canvas.toDataURL('image/jpeg', QUALITY), publicId: null }
}
