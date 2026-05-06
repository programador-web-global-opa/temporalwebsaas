const devolucionAhorroService = require("../../services/ahorrosService/devolucionAhorroService");
const { manejarError } = require("../../helpers/controllerUtils");

const obtenerUsuarioSession = (req) => req.session?.user || {};

const obtenerCedulaSesion = (req) => {
    const usuario = obtenerUsuarioSession(req);
    return usuario.id || usuario.cedula || req.session?.CEDULA || req.session?.cedula || null;
};

const obtenerTokenWebSesion = (req) => {
    const usuario = obtenerUsuarioSession(req);
    return usuario.tokenWeb || req.session?.tokenWeb || null;
};

const validarCampoTexto = (valor) => typeof valor === "string" && valor.trim().length > 0;

const limpiarNumero = (valor) => {
    const limpio = String(valor ?? "").replace(/\D/g, "");
    return limpio ? Number(limpio) : 0;
};

exports.renderDevolucion = (req, res) => {
    res.render("devolucionAhorro", {
        title: "Devolucion Ahorro",
        session: req.session
    });
};

exports.obtenerProductosDevolucion = async (req, res) => {
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
                msj: "No se encontro el token de autenticacion"
            });
        }

        const resultado = await devolucionAhorroService.obtenerProductosDisponiblesDevolucion(cedula, token);

        return res.json({
            estado: true,
            data: resultado.productos,
            asociado: resultado.asociado
        });
    } catch (error) {
        console.error("Error obteniendo productos para devolucion:", error);
        return manejarError(req, res, error, 500);
    }
};

exports.obtenerValorDisponible = async (req, res) => {
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
                msj: "No se encontro el token de autenticacion"
            });
        }

        if (!validarCampoTexto(req.query?.codlinea) || !validarCampoTexto(req.query?.numerocuenta)) {
            return res.status(400).json({
                estado: false,
                msj: "Debe seleccionar un ahorro valido"
            });
        }

        const resultado = await devolucionAhorroService.obtenerValorDisponible({
            cedula,
            codlinea: req.query.codlinea,
            numerocuenta: req.query.numerocuenta
        }, token);

        return res.json({
            estado: true,
            data: resultado
        });
    } catch (error) {
        console.error("Error calculando valor disponible para devolucion:", error);
        const status = /ahorro|cuenta|linea|disponible|producto/i.test(error?.message || "") ? 400 : 500;
        return manejarError(req, res, error, status);
    }
};

exports.solicitarDevolucion = async (req, res) => {
    try {
        const cedula = obtenerCedulaSesion(req);
        const token = obtenerTokenWebSesion(req);
        const body = req.body || {};
        const valorRetirar = limpiarNumero(body.valorRetirar);

        if (!cedula) {
            return res.status(401).json({
                estado: false,
                msj: "No se encontro la cedula del asociado en sesion"
            });
        }

        if (!token) {
            return res.status(401).json({
                estado: false,
                msj: "No se encontro el token de autenticacion"
            });
        }

        if (!validarCampoTexto(body.codlinea) || !validarCampoTexto(body.numerocuenta)) {
            return res.status(400).json({
                estado: false,
                msj: "Debe seleccionar un ahorro valido"
            });
        }

        if (!valorRetirar || valorRetirar <= 0) {
            return res.status(400).json({
                estado: false,
                msj: "El valor a retirar debe ser mayor a cero (0). Por favor verifica."
            });
        }

        const resultado = await devolucionAhorroService.solicitarDevolucion({
            cedula,
            codlinea: body.codlinea,
            numerocuenta: body.numerocuenta,
            valorSolicitado: valorRetirar
        }, token);

        return res.json(resultado);
    } catch (error) {
        console.error("Error guardando solicitud de devolucion:", error);
        const status = /retiro|solicitud|ahorro|valor|minimo|GMF|esperar|cuenta|linea/i.test(error?.message || "") ? 400 : 500;
        return manejarError(req, res, error, status);
    }
};
