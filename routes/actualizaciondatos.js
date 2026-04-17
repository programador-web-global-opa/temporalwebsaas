const express = require("express");
const router = express.Router();
const Controller = require("../controllers/actualizaciondatos.controller");
const uploadActualizacionDatos = require("../middlewares/actualizaciondatosupload");

router.get("/", Controller.renderActualizacionDatos);

router.get("/tab/:tab", Controller.renderTabActualizacion);

router.get("/informacionAsociado", Controller.getInformacionAsociado);

router.get("/autorizaciones", Controller.getAutorizaciones);

router.get("/referencias", Controller.getReferencias);

router.get("/personasCargo", Controller.getPersonasCargo);

router.get("/familiaresPeps", Controller.getFamiliaresPeps);

router.get("/adjuntos", Controller.getAdjuntos);

router.get("/grupoProteccion", Controller.getGrupoProteccion);

router.post("/guardar", uploadActualizacionDatos.array("adjuntos"), Controller.guardarActualizacionDatos);

module.exports = router;
