const express = require("express");
const {
  validateUser,
  login,
  createUser,
  recoverUser,
  recoverPasswordCode,
  recoverPassword,
  recoverPasswordQuestions
} = require("../controllers/auth/auth.controller");
const router = express.Router();

const TITLE_APP = "FONDOOPA | Servicios en Linea";

router.get("/login", (_, res) => {
  res.render("auth/login/index", {
    title: TITLE_APP,
    layout: "layouts/auth",
  });
});

router.get("/register", (_, res) => {
  res.render("auth/register/index", {
    title: TITLE_APP,
    layout: "layouts/auth",
  });
});

router.get("/recover-user", (_, res) => {
  res.render("auth/recover-user/index", {
    title: TITLE_APP,
    layout: "layouts/auth",
  });
});

router.get("/recover-password", (_, res) => {
  res.render("auth/recover-password/index", {
    title: TITLE_APP,
    layout: "layouts/auth",
  });
});

router.post("/validateUser", validateUser);

router.post("/", login);

router.post("/register", createUser);

router.post("/recover-user", recoverUser);

router.post("/recover-password", recoverPassword);

router.post("/recover-password/code", recoverPasswordCode);

router.post("/recover-password/questions", recoverPasswordQuestions);

module.exports = router;
