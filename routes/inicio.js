const express = require("express");
const router = express.Router();

router.get('/ejemplo', (req, res) => {
  res.render('inicio', {
    title: 'inicio',
    session: req.session,
  });
});

module.exports = router;

