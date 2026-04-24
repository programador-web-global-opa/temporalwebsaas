const express = require("express");
const router = express.Router();
const crearAhorroController = require("../controllers/Ahorros/crearahorro.controller");
const cambioCuotaController = require("../controllers/Ahorros/cambioCuota.controller");

router.get("/crear", crearAhorroController.renderCrearAhorro);
router.get("/crear/lineas", crearAhorroController.obtenerLineasAhorro);
router.post("/crear", crearAhorroController.crearAhorro);

router.get("/cambioCuota", cambioCuotaController.renderCambioCuota);
router.get("/cambioCuota/productos", cambioCuotaController.obtenerProductosCambioCuota);
router.post("/cambioCuota", cambioCuotaController.cambiarCuota);

router.get("/devolucion", (req, res) => {
  res.render("devolucionAhorro", {
    title: "Devolucion Ahorro",
    session: req.session,
  });
});

module.exports = router;
