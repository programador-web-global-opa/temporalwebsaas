const express = require("express");
const router = express.Router();

const combosController = require("../controllers/combosController");

router.get("/", combosController.getCombos);

module.exports = router;