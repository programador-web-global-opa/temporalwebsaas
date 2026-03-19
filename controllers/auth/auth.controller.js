const axios = require("axios");

const ISWEBSAAS = 1;
const URL_SERVICE = "http://localhost:2000/api";

const getIdentification = async (document) => {
  try {
    const result = await axios.post(
      `${URL_SERVICE}/ValidarUsuario`,
      { esoperador: "N", operador: document },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return result.data[0][0] ?? {};
  } catch (error) {
    return { error: true };
  }
};

const validateUser = async (req, res) => {
  const { user } = req.body;
  try {
    const result = await axios.request({
      method: 'post',
      url: `${URL_SERVICE}/consultacedulausuario`,
      headers: { 'Content-Type': 'application/json' },
      data : { "nuevousuario": user }
    });

    const parcialInfo = await getIdentification(result.data[0][0]?.cedula);

    if (parcialInfo?.Mensaje == "Usuario incorrecto") {
      return res.status(400).json({
        message: parcialInfo?.Mensaje,
        status: 400,
        result: null
      });
    }

    res.status(200).json({
      message: parcialInfo?.Mensaje,
      status: 200,
      result: {
        cedula: parcialInfo?.cedula,
        url: parcialInfo?.url,
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Ha ocurrido un error',
      status: 500,
      result: null
    });
  }
};

const login = async (req, res) => {
  const { user, password } = req.body;
  try {
    const result = await axios.request({
      method: "POST",
      url: `${URL_SERVICE}/Login`,
      headers: { "Content-Type": "application/json" },
      data: {
        "operador": user,
        "PassWord": password,
        "codigo": "",
        "esoperador": "N",
        "isSaas": ISWEBSAAS
      }
    });

    const userService = result.data[0][0] ?? {};

    console.log(userService)

    if (userService?.Mensaje?.trim() === "Clave incorrecta") {
      return res.status(400).json({
        message: userService?.Mensaje,
        status: 400,
        result: null
      });
    }

    req.session.user = {
      id: userService?.id,
      token: userService?.token,
      tokenWeb: userService?.tokenWeb,
      nombreusuario: userService?.nombreusuario,
      ultimoingreso: userService?.ultimoingreso
    }

    res.status(200).json({
      message: userService?.Mensaje,
      status: 200,
      result: {
        id: userService?.id,
        nombreusuario: userService?.nombreusuario,
        ultimoingreso: userService?.ultimoingreso
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Hubo un error al realizar el proceso',
      status: 500,
      result: null
    });
  }
};

module.exports = {
  validateUser,
  getIdentification,
  login,
};
