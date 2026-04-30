const express = require("express");
const router = express.Router();

const { afiliacionRegisterRender, afiliacionGenerateRender, afiliacionValidateDocument } = require("../controllers/afiliacion/afiliacionRegister.controller");

router.get("/register", afiliacionRegisterRender);

router.post("/validate-document", afiliacionValidateDocument);

router.get("/generate", afiliacionGenerateRender);

module.exports = router;
