const express = require("express");
const {
  loginRender,
  registerRender,
  recoverUserRender,
  recoverPasswordRender,
  validateUser,
  login,
  createUser,
  recoverUser,
  recoverPasswordCode,
  recoverPassword,
  recoverPasswordQuestions,
  changePassword,
  logout,
} = require("../controllers/auth/auth.controller");
const router = express.Router();

router.get("/login", loginRender);

router.get("/register", registerRender);

router.get("/recover-user", recoverUserRender);

router.get("/recover-password", recoverPasswordRender);

router.post("/validateUser", validateUser);

router.post("/", login);

router.post("/register", createUser);

router.post("/recover-user", recoverUser);

router.post("/recover-password", recoverPassword);

router.post("/recover-password/code", recoverPasswordCode);

router.post("/recover-password/questions", recoverPasswordQuestions);

router.post("/recover-password/change", changePassword);

router.post("/logout", logout);

module.exports = router;
