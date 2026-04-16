const express = require("express");
const router = express.Router();

router.get('/', (req, res) => {
    res.render('productservices/index', {
        title: 'Productos y Servicios',
        session: req.session,
    });
});

router.get('/tab/:tab', (req, res) => {
    const { tab } = req.params;
    res.render(`productservices/partials/${tab}`, {
        title: 'Productos y Servicios',
        session: req.session,
        layout: false
    });
});

router.get('/details', (req, res) => {
    res.render('productservices/partials/details', {
        title: 'Productos y Servicios',
        session: req.session,
    });
});

router.get('/generate', (req, res) => {
    res.render('productservices/partials/generate', {
        title: 'Productos y Servicios',
        session: req.session,
    });
});

module.exports = router;