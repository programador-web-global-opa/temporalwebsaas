const path = require('path');
const fs = require('fs/promises');

const config = require('../../config/config');
const productosServiciosService = require('../../services/productosServiciosService/productosServiciosService');
const { generarNombreUnico } = require('../../middlewares/productosServiciosUpload');

const ADJUNTOS_DIR = config.productosServiciosAdjuntosDir;

const obtenerCedulaSesion = (req) => req.session?.user?.id || null;
const obtenerTokenWebSesion = (req) => req.session?.user?.tokenWeb || null;

const respuestaError = (res, error, status = 500) =>
  res.status(error?.status || status).json({
    estado: false,
    msj: error?.message || 'Ocurrió un error procesando la solicitud',
  });

const escapeXml = (str) =>
  String(str ?? '').replace(/[<>&"']/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]),
  );

const construirXmlAdjuntos = (datos) =>
  datos
    .map(
      ({ idAdj, NombreAdj }) =>
        `<Adjuntos><idAdj>${escapeXml(idAdj)}</idAdj><NombreAdj>${escapeXml(NombreAdj)}</NombreAdj></Adjuntos>`,
    )
    .join('');

const renderProductosServicios = (req, res) => {
  res.render('productservices/index', {
    title: 'Productos y Servicios',
    session: req.session,
  });
};

const renderTabProductosServicios = (req, res) => {
  const { tab } = req.params;
  res.render(`productservices/partials/${tab}`, {
    title: 'Productos y Servicios',
    session: req.session,
  });
};

const listarProductos = async (req, res) => {
  try {
    const token = obtenerTokenWebSesion(req);
    const data = await productosServiciosService.obtenerProductosServicios(token);
    return res.json({ estado: true, data });
  } catch (error) {
    console.error('Error en listarProductos:', error);
    return respuestaError(res, error);
  }
};

const listarAdjuntos = async (req, res) => {
  try {
    const token = obtenerTokenWebSesion(req);
    const { idProductoServicio } = req.query;
    const data = await productosServiciosService.obtenerAdjuntos(idProductoServicio, token);
    return res.json({ estado: true, data });
  } catch (error) {
    console.error('Error en listarAdjuntos:', error);
    return respuestaError(res, error);
  }
};

const listarCamposDinamicos = async (req, res) => {
  try {
    const token = obtenerTokenWebSesion(req);
    const { idProductoServicio } = req.query;
    const data = await productosServiciosService.obtenerCamposDinamicos(idProductoServicio, token);
    return res.json({ estado: true, data });
  } catch (error) {
    console.error('Error en listarCamposDinamicos:', error);
    return respuestaError(res, error);
  }
};

const listarEstadoSolicitudes = async (req, res) => {
  try {
    const token = obtenerTokenWebSesion(req);
    const cedula = obtenerCedulaSesion(req);
    const data = await productosServiciosService.obtenerEstadoSolicitudes(cedula, token);
    return res.json({ estado: true, data });
  } catch (error) {
    console.error('Error en listarEstadoSolicitudes:', error);
    return respuestaError(res, error);
  }
};

const listarSeguimiento = async (req, res) => {
  try {
    const token = obtenerTokenWebSesion(req);
    const { idSolicitud } = req.query;
    const data = await productosServiciosService.obtenerSeguimientoSolicitud(idSolicitud, token);
    return res.json({ estado: true, data });
  } catch (error) {
    console.error('Error en listarSeguimiento:', error);
    return respuestaError(res, error);
  }
};

const validarNumeroSolicitudes = async (req, res) => {
  try {
    const token = obtenerTokenWebSesion(req);
    const cedula = obtenerCedulaSesion(req);
    const { idProducto } = req.query;
    const resultado = await productosServiciosService.controlarNumeroSolicitudes(idProducto, cedula, token);
    return res.json({ estado: true, data: resultado });
  } catch (error) {
    console.error('Error en validarNumeroSolicitudes:', error);
    return respuestaError(res, error);
  }
};

const guardarSolicitud = async (req, res) => {
  console.log(req.body);
  const archivosGuardados = [];
  try {
    const cedula = obtenerCedulaSesion(req);
    const token = obtenerTokenWebSesion(req);

    if (!cedula)
      return res.status(401).json({ estado: false, msj: 'No se encontró la cédula del asociado en sesión' });
    if (!token)
      return res.status(401).json({ estado: false, msj: 'No se encontró el token de autenticación' });

    const { idtipo: idProducto, observacion, ContenidoCampos, contAdjuntos = 0 } = req.body;
    const cont = Number(contAdjuntos);
    const codigoProd = String(idProducto ?? '');

    const numeroSolicitud = await productosServiciosService.obtenerNumeroSolicitud(token);

    await fs.mkdir(ADJUNTOS_DIR, { recursive: true });

    const archivosMap = {};
    const listaArchivos = Array.isArray(req.files)
      ? req.files
      : Object.values(req.files || {}).flat();
    for (const file of listaArchivos) {
      archivosMap[file.fieldname] = file;
    }

    const datosAdjuntos = [];
    for (let i = 1; i <= cont; i++) {
      const file = archivosMap[`adjuntos${i}`];
      if (!file?.originalname) continue;

      const idAdj = req.body[`IdAdj${i}`] ?? '';
      const ext = path.extname(file.originalname).toLowerCase();
      const nombre = generarNombreUnico(codigoProd, idAdj, numeroSolicitud, cedula, ext);
      const ruta = path.join(ADJUNTOS_DIR, nombre);

      await fs.writeFile(ruta, file.buffer);
      archivosGuardados.push(ruta);
      datosAdjuntos.push({ idAdj, NombreAdj: nombre });
    }

    const resultado = await productosServiciosService.guardarSolicitud(
      {
        numeroSolicitud,
        cedula,
        idProducto,
        camposDinamicos: ContenidoCampos ?? '',
        observacion: observacion ?? '',
        adjuntos: construirXmlAdjuntos(datosAdjuntos),
      },
      token,
    );

    return res.json(resultado);
  } catch (error) {
    console.error('Error en guardarSolicitud:', error);
    await Promise.all(archivosGuardados.map((ruta) => fs.unlink(ruta).catch(() => null)));
    return respuestaError(res, error);
  }
};

module.exports = {
  renderProductosServicios,
  renderTabProductosServicios,
  listarProductos,
  listarAdjuntos,
  listarCamposDinamicos,
  listarEstadoSolicitudes,
  listarSeguimiento,
  validarNumeroSolicitudes,
  guardarSolicitud,
};
