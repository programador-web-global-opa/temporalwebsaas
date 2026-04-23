const crearAhorroService = require("../../services/ahorrosService.js/crearAhorroService");

const obtenerUsuarioSession = (req) => req.session?.user || {};

const obtenerCedulaSesion = (req) => {
    const usuario = obtenerUsuarioSession(req);
    return usuario.id || usuario.cedula || req.session?.CEDULA || req.session?.cedula || null;
};

const obtenerTokenWebSesion = (req) => {
    const usuario = obtenerUsuarioSession(req);
    return usuario.tokenWeb || req.session?.tokenWeb || null;
};

const respuestaError = (res, error, status = 500) => {
    const mensaje = error?.message || "Ocurrio un error procesando la solicitud";

    return res.status(error?.status || status).json({
        estado: false,
        msj: mensaje
    });
};

exports.renderCrearAhorro = (req, res) => {
    res.render("crearAhorrolayout", {
        title: "Crear Ahorro",
        session: req.session
    });
};

exports.obtenerLineasAhorro = async (req, res) => {
    try {
        const lineas = await crearAhorroService.obtenerLineasAhorro();

        return res.json({
            estado: true,
            data: lineas
        });
    } catch (error) {
        console.error("Error obteniendo lineas de ahorro:", error);
        return respuestaError(res, error, 500);
    }
};

exports.crearAhorro = async (req, res) => {
    try {
        const cedula = obtenerCedulaSesion(req);
        const token = obtenerTokenWebSesion(req);

        if (!cedula) {
            return res.status(401).json({
                estado: false,
                msj: "No se encontro la cedula del asociado en sesion"
            });
        }

        if (!token) {
            return res.status(401).json({
                estado: false,
                msj: "No se encontro el token de autenticacion para crear el ahorro"
            });
        }

        const resultado = await crearAhorroService.crearAhorroCompleto({
            cedula,
            codLinea: req.body?.codLinea,
            tipo: req.body?.tipo,
            cuota: req.body?.cuota,
            valmin: req.body?.valmin,
            valmax: req.body?.valmax
        }, token);

        return res.json(resultado);
    } catch (error) {
        console.error("Error creando ahorro:", error);

        const status = /cuota|linea|ingresar/i.test(error?.message || "") ? 400 : 500;
        return respuestaError(res, error, status);
    }
};
