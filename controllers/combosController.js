const combosService = require("../services/combosService");

exports.getCombos = async (req, res) => {
    try {
        const datos = await combosService.obtenerCombo(req.query);
        res.json(datos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};