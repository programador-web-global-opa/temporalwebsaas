const config = require("../../config/config");
const { requestApi } = require("../../helpers/apiFetch");

const TITLE_APP = "FONDOOPA | Servicios en Linea";

const loginRender = (req, res) => {
  if (req.session?.user) return res.redirect("/ahorro/crear");
  res.render("auth/login/index", {
    title: TITLE_APP,
    layout: "layouts/auth",
  });
}

const registerRender = (req, res) => {
  if (req.session?.user) return res.redirect("/ahorro/crear");
  res.render("auth/register/index", {
    title: TITLE_APP,
    layout: "layouts/auth",
  });
}

const recoverUserRender = (req, res) => {
  if (req.session?.user) return res.redirect("/ahorro/crear");
  res.render("auth/recover-user/index", {
    title: TITLE_APP,
    layout: "layouts/auth",
  });
}

const recoverPasswordRender = (req, res) => {
  if (req.session?.user) return res.redirect("/ahorro/crear");
  res.render("auth/recover-password/index", {
    title: TITLE_APP,
    layout: "layouts/auth",
  });
}

const getIdentification = async (document) => {
  try {
    const data = await requestApi(`${config.apiBaseUrlApp}/ValidarUsuario`, {
      method: "POST",
      body: { esoperador: "N", operador: document },
    });
    return data[0][0] ?? { error: true };
  } catch (error) {
    return { error: true };
  }
};

const validateUser = async (req, res) => {
  const { user } = req.body;

  try {
    const data = await requestApi(`${config.apiBaseUrlApp}/consultacedulausuario`, {
      method: "POST",
      body: { nuevousuario: user },
    });
    const parcialInfo = await getIdentification(data[0][0]?.cedula);

    if (parcialInfo?.Mensaje == "Usuario incorrecto") {
      return res.status(400).json({
        message: parcialInfo?.Mensaje,
        status: 400,
        codigo: parcialInfo?.Codigo,
        result: null,
      });
    }

    res.status(200).json({
      message: parcialInfo?.Mensaje,
      status: 200,
      codigo: parcialInfo?.Codigo,
      result: {
        cedula: data[0][0]?.cedula,
        url: parcialInfo?.url,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Ha ocurrido un error",
      status: 500,
      codigo: null,
      result: null,
    });
  }
};

const login = async (req, res) => {
  const { user, password, codigo } = req.body;

  try {
    const data = await requestApi(`${config.apiBaseUrlApp}/Login`, {
      method: "POST",
      body: {
        operador: user,
        PassWord: password,
        codigo: codigo ?? "",
        esoperador: "N",
        isSaas: config.isWebSaas,
      },
    });

    if (data?.campo && data?.mensaje) {
      return res.status(400).json({
        message: "Error al realizar la peticion",
        codigo: "000",
        status: 400,
        result: null,
      });
    }

    const userService = data[0][0] ?? {};

    if (userService?.Mensaje?.trim() === "Clave incorrecta") {
      return res.status(400).json({
        message: userService?.Mensaje,
        codigo: userService?.Codigo,
        status: 400,
        result: null,
      });
    }

    req.session.user = {
      id: userService?.id,
      token: userService?.token,
      tokenWeb: userService?.tokenWeb,
      nombreusuario: userService?.nombreusuario,
      ultimoingreso: userService?.ultimoingreso,
      loginAt: Date.now(),
    };

    res.status(200).json({
      message: userService?.Mensaje,
      status: 200,
      codigo: userService?.Codigo,
      result: {
        id: userService?.id,
        nombreusuario: userService?.nombreusuario,
        ultimoingreso: userService?.ultimoingreso,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Hubo un error al realizar el proceso",
      status: 500,
      codigo: null,
      result: null,
    });
  }
};

const createUser = async (req, res) => {
  const { nuevousuario, cedula, contrasena, celular, codigo = "" } = req.body;
  try {
    const data = await requestApi(`${config.apiBaseUrlApp}/nuevousuario`, {
      method: "POST",
      body: { nuevousuario, cedula, contrasena, celular, codigo },
    });

    const information = data[0][0] ?? {};

    if (information?.campo && information?.mensaje) {
      return res.status(400).json({
        message: "Error al realizar la peticion",
        codigo: "000",
        status: 400,
        result: null,
      });
    }

    if (information?.codigo?.replace(/ /g, "") === "GEN") {
      return res.status(200).json({
        message: information?.Mensaje,
        codigo: information?.Codigo,
        status: 200,
        result: {
          codigo: true,
        },
      });
    }

    if (information?.codigo?.replace(/ /g, "") === "855") {
      return res.status(400).json({
        message:
          "Su número de celular no coincide con la base de datos. Comuníquese con su Entidad",
        codigo: information?.codigo,
        status: 400,
        result: null,
      });
    }

    if (
      information?.Mensaje === "El usuario ya existe para otra cedula" ||
      information?.codigo == "022"
    ) {
      return res.status(400).json({
        message: information?.Mensaje,
        codigo: information?.codigo,
        status: 400,
        result: null,
      });
    }

    res.status(201).json({
      message: information?.Mensaje,
      codigo: information?.codigo,
      status: 201,
      result: {},
    });
  } catch (error) {
    res.status(500).json({
      message: "Ha ocurrido un error",
      status: 500,
      codigo: null,
      result: null,
    });
  }
};

const recoverUser = async (req, res) => {
  const { cedula, celular } = req.body;
  try {
    const data = await requestApi(`${config.apiBaseUrlApp}/recordarusuario`, {
      method: "POST",
      body: { cedula, celular },
    });

    if (data?.campo && data?.mensaje) {
      return res.status(400).json({
        message: "Error al realizar la peticion",
        codigo: "000",
        status: 400,
        result: null,
      });
    }

    const recoverService = data[0][0] ?? {};
    res.status(200).json({
      message: recoverService?.Mensaje,
      status: 200,
      codigo: recoverService?.Codigo,
      result: {},
    });
  } catch (error) {
    res.status(500).json({
      message: "Hubo un error al realizar el proceso",
      status: 500,
      codigo: null,
      result: null,
    });
  }
};

const recoverPasswordCode = async (req, res) => {
  const {
    Operador,
    tipo,
    codigo,
    esoperador = "N"
  } = req.body;

  try {
    const data = await requestApi(`${config.apiBaseUrlApp}/validacionesrecuperacion`, {
      method: "POST",
      body: { Tipo: tipo, Operador, CedulaAsociado: Operador, codigo: codigo ?? "", esoperador },
    });

    if (data?.campo && data?.mensaje) {
      return res.status(400).json({
        message: "Error al realizar la peticion",
        codigo: "000",
        status: 400,
        result: null,
      });
    }

    const recoverService = data[0][0] ?? {};

    res.json({
      message: recoverService?.Mensaje,
      status: 200,
      codigo: recoverService?.Codigo,
      result: {
        campo: recoverService?.campo,
        mensaje: recoverService?.mensaje,
        preguntasclaveprincipal: recoverService?.preguntasclaveprincipal
      },
    });

  } catch (error) {
    res.status(500).json({
      message: "Hubo un error al realizar el proceso",
      status: 500,
      codigo: null,
      result: null,
    });
  }
}

const recoverPassword = async (req, res) => {
  const {
    Operador,
    tipo,
    codigo,
    esoperador = "N"
  } = req.body;

  try {
    const data = await requestApi(`${config.apiBaseUrlApp}/validacionesrecuperacion`, {
      method: "POST",
      body: { Tipo: tipo, Operador, CedulaAsociado: Operador, codigo: codigo ?? "", esoperador },
    });

    if (data?.campo && data?.mensaje) {
      return res.status(400).json({
        message: "Error al realizar la peticion",
        codigo: "000",
        status: 400,
        result: null,
      });
    }

    const recoverService = data[0][0] ?? {};

    res.json({
      message: recoverService?.Mensaje,
      status: 200,
      codigo: recoverService?.Codigo,
      result: {
        campo: recoverService?.campo,
        mensaje: recoverService?.mensaje,
        preguntasclaveprincipal: recoverService?.preguntasclaveprincipal
      },
    });
    
  } catch (error) {
    res.status(500).json({
      message: "Hubo un error al realizar el proceso",
      status: 500,
      codigo: null,
      result: null,
    });
  }
}

const recoverPasswordQuestions = async (req, res) => {
  const { operador, esoperador = "N", xml } = req.body;
  try {
    const data = await requestApi(`${config.apiBaseUrlApp}/preguntasseguridad`, {
      method: "POST",
      body: { operador, esoperador, xml },
    });

    if (data?.campo && data?.mensaje) {
      return res.status(400).json({
        message: "Error al realizar la peticion",
        codigo: "000",
        status: 400,
        result: null,
      });
    }

    const isQuery = xml?.includes("CONPRE");
    if (isQuery) {
      return res.json({
        message: "OK",
        status: 200,
        codigo: "200",
        result: { questions: data[0] ?? [] },
      });
    }

    const service = data[0][0] ?? {};
    res.json({
      message: service?.Mensaje,
      status: 200,
      codigo: service?.Codigo?.replace(/ /g, ""),
      result: {},
    });
  } catch (error) {
    res.status(500).json({
      message: "Hubo un error al realizar el proceso",
      status: 500,
      codigo: null,
      result: null,
    });
  }
}

const changePassword = async (req, res) => {
  const { usuario, clave } = req.body;
  try {
    const data = await requestApi(`${config.apiBaseUrlApp}/Recuperaclave`, {
      method: "POST",
      body: { USUARIO: usuario, CLAVE: clave },
    });

    if (data?.campo && data?.mensaje) {
      return res.status(400).json({
        message: "Error al realizar la peticion",
        codigo: "000",
        status: 400,
        result: null,
      });
    }

    const service = data[0][0] ?? {};
    res.json({
      message: service?.Mensaje,
      status: 200,
      codigo: service?.codigo?.replace(/ /g, ""),
      result: {},
    });
  } catch (error) {
    res.status(500).json({
      message: "Hubo un error al realizar el proceso",
      status: 500,
      codigo: null,
      result: null,
    });
  }
}

const logout = async (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/auth/login");
  });
}

module.exports = {
  loginRender,
  registerRender,
  recoverUserRender,
  recoverPasswordRender,
  validateUser,
  getIdentification,
  login,
  createUser,
  recoverUser,
  recoverPassword,
  recoverPasswordCode,
  recoverPasswordQuestions,
  changePassword,
  logout
};
