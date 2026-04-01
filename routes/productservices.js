const express = require("express");
const router = express.Router();

router.get('/', (_, res) => {
    res.render('productservices/index', {
        title: 'Productos y Servicios'
    });
});

router.get('/tab/:tab', (req, res) => {
    const { tab } = req.params;
    res.render(`productservices/partials/${tab}`, {
        title: 'Productos y Servicios',
        layout: false
    });
});

router.get('/details', (_, res) => {
    res.render('productservices/partials/details', {
        title: 'Productos y Servicios'
    });
});

router.get('/generate', (_, res) => {
    res.render('productservices/partials/generate', {
        title: 'Productos y Servicios'
    });
});

module.exports = router;