const express = require("express");
const router = express.Router();

router.get('/', (req, res) => {
    if (!req.session.user) res.redirect("/auth/login");
    res.render('productservices/index', {
        title: 'Productos y Servicios',
        session: req.session,
    });
});

router.get('/tab/:tab', (req, res) => {
    if (!req.session.user) res.redirect("/auth/login");
    const { tab } = req.params;
    res.render(`productservices/partials/${tab}`, {
        title: 'Productos y Servicios',
        session: req.session,
        layout: false
    });
});

router.get('/details', (req, res) => {
    if (!req.session.user) res.redirect("/auth/login");
    res.render('productservices/partials/details', {
        title: 'Productos y Servicios',
        session: req.session,
    });
});

router.get('/generate', (req, res) => {
    if (!req.session.user) res.redirect("/auth/login");
    res.render('productservices/partials/generate', {
        title: 'Productos y Servicios',
        session: req.session,
    });
});

module.exports = router;