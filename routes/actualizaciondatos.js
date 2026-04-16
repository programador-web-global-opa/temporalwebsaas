const multer = require("multer");
const express = require('express');
const router = express.Router();
const Controller = require("../controllers/actualizaciondatos.controller");
const uploadActualizacionDatos = require("../middlewares/actualizaciondatosupload");

router.get("/", (req, res) => {
    if (!req.session.user) res.redirect("/auth/login");
    res.render("actualizaciondatos/index", {
        title: "Actualización de Datos",
        session: req.session,
    });
});

router.get("/tab/:tab", (req, res) => {
    if (!req.session.user) res.redirect("/auth/login");
    const { tab } = req.params;
    res.render(`actualizaciondatos/partials/${tab}`, {
        title: "Actualizacion de Datos",
        session: req.session,
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