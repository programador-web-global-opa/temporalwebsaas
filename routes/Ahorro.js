const express = require("express");
const router = express.Router();

router.get('/crear', (req, res) => {
  res.render('crearAhorrolayout', {
    title: 'Crear Ahorro',
    session: req.session,
  });
});

router.get('/cambioCuota', (req, res) => {
  res.render('cambioCuotaAhorro', {
    title: 'Cambio Cuota',
    session: req.session,
  });
});

router.get('/devolucion', (req, res) => {
  res.render('devolucionAhorro', {
    title: 'Devolucion Ahorro',
    session: req.session,
  });
});

module.exports = router;
