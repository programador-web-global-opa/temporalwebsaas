const express = require('express');
const router = express.Router();

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

module.exports = router;