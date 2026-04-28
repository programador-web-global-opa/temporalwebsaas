const multer = require('multer');
const path = require('path');

const EXTENSIONES_PERMITIDAS = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.tif'];
const MIME_TYPES_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/tiff'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const RE_CHARS_INVALIDOS = /[<>"'()&%$#@!/\\*?]|\.{2,}/;

const validarNombreArchivo = (nombre) => {
  if (!nombre) return { valido: false, msj: 'Nombre de archivo vacío' };
  if ((nombre.match(/\./g) || []).length > 1)
    return { valido: false, msj: `El nombre del adjunto ${nombre} contiene más de un punto` };
  if (RE_CHARS_INVALIDOS.test(nombre))
    return { valido: false, msj: `El nombre del adjunto ${nombre} contiene caracteres no permitidos, por favor modifíquelo` };
  return { valido: true };
};

const generarNombreUnico = (codigoProd, idAdj, numSolicitud, cedula, ext) =>
  `${codigoProd}_${idAdj}_${numSolicitud}_${cedula}_${Date.now()}${Math.random().toString(36).slice(2)}${ext}`;

const productosServiciosUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const nombre = file.originalname || '';
    const validacion = validarNombreArchivo(nombre);
    if (!validacion.valido) return cb(new Error(validacion.msj));

    const ext = path.extname(nombre).toLowerCase();
    if (!EXTENSIONES_PERMITIDAS.includes(ext))
      return cb(new Error(`El adjunto ${nombre} tiene una extensión no permitida. Formatos válidos: pdf, jpg, jpeg, png, gif, tif`));

    if (!MIME_TYPES_PERMITIDOS.includes(file.mimetype))
      return cb(new Error(`El contenido del adjunto ${nombre} no es permitido`));

    cb(null, true);
  },
});

const validarContenidoAdjuntos = (req, res, next) => {
  const archivos = Object.values(req.files || {}).flat();
  for (const file of archivos) {
    if (!file.buffer) continue;
    const fragmento = file.buffer.slice(0, 1024).toString('latin1');
    if (/<script>/i.test(fragmento) || /javascript:/i.test(fragmento)) {
      return res.status(400).json({
        estado: false,
        msj: `El adjunto ${file.originalname} contiene scripts potencialmente peligrosos`,
      });
    }
  }
  next();
};

module.exports = { productosServiciosUpload, generarNombreUnico, validarContenidoAdjuntos };