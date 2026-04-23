const express = require("express");
const router = express.Router();
const crearAhorroController = require("../controllers/Ahorros/crearahorro.controller");

router.get("/crear", crearAhorroController.renderCrearAhorro);
router.get("/crear/lineas", crearAhorroController.obtenerLineasAhorro);
router.post("/crear", crearAhorroController.crearAhorro);

router.get("/cambioCuota", (req, res) => {
  res.render("cambioCuotaAhorro", {
    title: "Cambio Cuota",
    session: req.session,
  });
});

router.get("/devolucion", (req, res) => {
  res.render("devolucionAhorro", {
    title: "Devolucion Ahorro",
    session: req.session,
  });
});

module.exports = router;