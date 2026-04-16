const config = require("../../config/config");

const getIdentification = async (document) => {
  try {
    const result = await fetch(`${config.apiBaseUrlApp}/ValidarUsuario`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ esoperador: "N", operador: document }),
    });
    const data = await result.json();
    return data[0][0] ?? { error: true };
  } catch (error) {
    return { error: true };
  }
};

const validateUser = async (req, res) => {
  const { user } = req.body;

  try {
    const result = await fetch(`${config.apiBaseUrlApp}/consultacedulausuario`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nuevousuario: user }),
    });

    const data = await result.json();
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
    const result = await fetch(`${config.apiBaseUrlApp}/Login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        operador: user,
        PassWord: password,
        codigo: codigo ?? "",
        esoperador: "N",
        isSaas: config.isWebSaas,
      }),
    });
    const data = await result.json();

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
    const result = await fetch(`${config.apiBaseUrlApp}/nuevousuario`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nuevousuario: nuevousuario,
        cedula: cedula,
        contrasena: contrasena,
        celular: celular,
        codigo: codigo,
      }),
    });

    const data = await result.json();

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
    const result = await fetch(`${config.apiBaseUrlApp}/recordarusuario`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cedula: cedula,
        celular: celular,
      }),
    });
    const data = await result.json();

    if (data?.campo && data?.mensaje) {
      return res.status(400).json({
        message: "Error al realizar la peticion",
        codigo: "000",
        status: 400,
        result: null,
      });
    }

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
    const result = await fetch(`${config.apiBaseUrlApp}/validacionesrecuperacion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Tipo: tipo,
        Operador: Operador,
        CedulaAsociado: Operador,
        codigo: codigo ?? "",
        esoperador: esoperador,
      }),
    });
    const data = await result.json();
    
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
    const result = await fetch(`${config.apiBaseUrlApp}/validacionesrecuperacion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Tipo: tipo,
        Operador: Operador,
        CedulaAsociado: Operador,
        codigo: codigo ?? "",
        esoperador: esoperador,
      }),
    });
    const data = await result.json();
    
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
    const result = await fetch(`${config.apiBaseUrlApp}/preguntasseguridad`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operador, esoperador, xml }),
    });
    const data = await result.json();

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
    const result = await fetch(`${config.apiBaseUrlApp}/Recuperaclave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ USUARIO: usuario, CLAVE: clave }),
    });
    const data = await result.json();

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
    res.redirect("/auth/login");
  });
}

module.exports = {
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
