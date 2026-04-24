const cambioCuotaService = require("../../services/ahorrosService/cambioCuotaService");

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

const validarCampoTexto = (valor) => typeof valor === "string" && valor.trim().length > 0;

const limpiarNumero = (valor) => {
    const limpio = String(valor ?? "").replace(/\D/g, "");
    return limpio ? Number(limpio) : 0;
};

exports.renderCambioCuota = (req, res) => {
    res.render("cambioCuotaAhorro", {
        title: "Cambio Cuota",
        session: req.session
    });
};

exports.obtenerProductosCambioCuota = async (req, res) => {
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

        const resultado = await cambioCuotaService.obtenerProductosDisponiblesCambioCuota(cedula, token);

        return res.json({
            estado: true,
            data: resultado.productos,
            periodoDeduccion: resultado.periodoDeduccion,
            periodoDeduccionTexto: resultado.periodoDeduccionTexto
        });
    } catch (error) {
        console.error("Error obteniendo productos para cambio de cuota:", error);
        return respuestaError(res, error, 500);
    }
};

exports.cambiarCuota = async (req, res) => {
    try {
        const cedula = obtenerCedulaSesion(req);
        const token = obtenerTokenWebSesion(req);
        const body = req.body || {};
        const cuotaNew = limpiarNumero(body.cuotaNew);
        const valorcuota = limpiarNumero(body.valorcuota);

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

        if (!cuotaNew || cuotaNew <= 0) {
            return res.status(400).json({
                estado: false,
                msj: "La cuota debe ser mayor a 0"
            });
        }

        if (String(cuotaNew).length > 8) {
            return res.status(400).json({
                estado: false,
                msj: "La cuota debe ser menor a 8 digitos"
            });
        }

        if (!valorcuota || valorcuota <= 0) {
            return res.status(400).json({
                estado: false,
                msj: "No fue posible validar la cuota actual"
            });
        }

        const resultado = await cambioCuotaService.cambiarCuota({
            cedula,
            codlinea: body.codlinea,
            numerocuenta: body.numerocuenta,
            cuotaNew,
            valorcuota
        }, token);

        return res.json(resultado);
    } catch (error) {
        console.error("Error cambiando cuota de ahorro:", error);

        const status = /cuota|producto|ahorro|periodo|esperar|linea/i.test(error?.message || "") ? 400 : 500;
        return respuestaError(res, error, status);
    }
};
