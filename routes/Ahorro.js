const express = require("express");
const router = express.Router();

router.get('/crear',
  (req, res) => {
    res.render('crearAhorrolayout', {
      title: 'Crear Ahorro'
    });
  }
);

router.get('/cambioCuota', (req, res) => {
  res.render('cambioCuotaAhorro', {
    title: 'Cambio Cuota'
  });
});


router.get('/devolucion', (req, res) => {
  res.render('devolucionAhorro', {
    title: 'Devolucion Ahorro'
  });
});

module.exports = router;
