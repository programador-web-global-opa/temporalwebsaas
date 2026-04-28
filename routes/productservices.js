const express = require("express");
const router = express.Router();

const {
  renderProductosServicios,
  renderTabProductosServicios,
  listarProductos,
  listarAdjuntos,
  listarCamposDinamicos,
  listarEstadoSolicitudes,
  listarSeguimiento,
  validarNumeroSolicitudes,
  guardarSolicitud,
} = require("../controllers/productosServicios/productosServicios.controller");
const {
  productosServiciosUpload,
  validarContenidoAdjuntos,
} = require("../middlewares/productosServiciosUpload");

router.get("/", renderProductosServicios);

router.get("/tab/:tab", renderTabProductosServicios);

router.get("/listar", listarProductos);

router.get("/adjuntos", listarAdjuntos);

router.get("/campos", listarCamposDinamicos);

router.get("/estado", listarEstadoSolicitudes);

router.get("/seguimiento", listarSeguimiento);

router.get("/validar-solicitudes", validarNumeroSolicitudes);

router.post(
  "/guardar",
  productosServiciosUpload.any(),
  validarContenidoAdjuntos,
  guardarSolicitud,
);

module.exports = router;