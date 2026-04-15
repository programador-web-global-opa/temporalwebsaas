const express = require('express');
const router = express.Router();
const Controller = require("../controllers/actualizaciondatos.controller");
const uploadActualizacionDatos = require("../middlewares/actualizaciondatosupload");

router.get("/", (_, res) => {
    res.render("actualizaciondatos/index", {
        title: "Actualización de Datos"
    });
});

router.get("/tab/:tab", (req, res) => {
    const { tab } = req.params;
    res.render(`actualizaciondatos/partials/${tab}`, {
        title: "Actualizacion de Datos",
        layout: false
    });
});

router.get("/informacionAsociado", Controller.getInformacionAsociado);

router.get("/autorizaciones", Controller.getAutorizaciones);

router.get("/referencias", Controller.getReferencias);

router.get("/personasCargo", Controller.getPersonasCargo);

router.get("/familiaresPeps", Controller.getFamiliaresPeps);

router.get("/adjuntos", Controller.getAdjuntos);

router.post("/guardar", uploadActualizacionDatos.array("adjuntos"), Controller.guardarActualizacionDatos);

module.exports = router;