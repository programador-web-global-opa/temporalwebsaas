const config = require("../../config/config");
const { requestApi, extraerMensajeError, construirUrlConParams } = require("../../helpers/apiFetch");

const BASE_URL = config.apiUrlWeb;
const API_URL_PRODUCTOS_AHORROS = `${BASE_URL}/public/api/Productos/Ahorros`;
const API_URL_CONSECUTIVO_AHORRO = `${BASE_URL}/private/api/Ahorro/Crear/Consecutivo`;
const API_URL_TASA_AHORRO = `${BASE_URL}/private/api/Ahorro/Crear/Tasa`;
const API_URL_CREAR_AHORRO = `${BASE_URL}/private/api/Ahorro/Crear`;

const normalizarTabla = (data) => {
    if (!Array.isArray(data)) return [];

    if (Array.isArray(data[0])) {
        return data[0];
    }

    return data;
};

const normalizarLineaAhorro = (linea = {}) => ({
    idproducto: linea.idproducto ?? null,
    codlinea: String(linea.codlinea ?? linea.codLinea ?? "").trim(),
    nombrelinea: String(linea.nombrelinea ?? linea.nombreLinea ?? "").trim(),
    tipo: String(linea.tipo ?? "").trim(),
    valorminimo: Number(linea.valorminimo ?? 0),
    valormaximo: Number(linea.valormaximo ?? 0),
    baseretencion: Number(linea.baseretencion ?? 0),
    porcretencion: Number(linea.porcretencion ?? 0),
    plazominimo: Number(linea.plazominimo ?? 0)
});

const limpiarNumero = (value) => {
    const limpio = String(value ?? "").replace(/\D/g, "");
    return limpio ? Number(limpio) : 0;
};

exports.obtenerAhorrosPorTipo = async (tipo) => {
    try {
        const urlFetch = construirUrlConParams(API_URL_PRODUCTOS_AHORROS, { tipo });
        const data = await requestApi(urlFetch);

        return normalizarTabla(data)
            .map(normalizarLineaAhorro)
            .filter(linea => linea.codlinea && linea.nombrelinea && linea.tipo);
    } catch (error) {
        console.error(`Error consultando ahorros tipo ${tipo}:`, error);
        throw error;
    }
};

exports.obtenerLineasAhorro = async () => {
    try {
        const [ahorrosVista, ahorrosContractuales] = await Promise.all([
            exports.obtenerAhorrosPorTipo("AV"),
            exports.obtenerAhorrosPorTipo("AC")
        ]);

        return [...ahorrosVista, ...ahorrosContractuales];
    } catch (error) {
        console.error("Error consultando lineas de ahorro:", error);
        throw error;
    }
};

exports.obtenerConsecutivoAhorro = async ({ cedula, tipoAhorro, codLinea } = {}, token) => {
    try {
        const urlFetch = construirUrlConParams(API_URL_CONSECUTIVO_AHORRO, {
            cedula,
            tipoAhorro,
            codLinea
        });
        const data = await requestApi(urlFetch, { token });
        const registro = normalizarTabla(data)[0] || {};
        const numeroCuenta = String(registro.numeroCuenta ?? "").trim();

        if (!numeroCuenta) {
            throw new Error("No fue posible consultar el consecutivo");
        }

        return numeroCuenta;
    } catch (error) {
        console.error("Error consultando consecutivo de ahorro:", error);
        throw error;
    }
};

exports.obtenerTasaAhorro = async ({ tipoAhorro, codLinea } = {}, token) => {
    try {
        const urlFetch = construirUrlConParams(API_URL_TASA_AHORRO, {
            tipoAhorro,
            codLinea
        });
        const data = await requestApi(urlFetch, { token });
        const registro = normalizarTabla(data)[0] || {};
        const tasaEfectiva = registro.tasaEfectiva;

        if (tasaEfectiva === undefined || tasaEfectiva === null || tasaEfectiva === "") {
            throw new Error("No fue posible consultar la tasa");
        }

        return tasaEfectiva;
    } catch (error) {
        console.error("Error consultando tasa de ahorro:", error);
        throw error;
    }
};

exports.llamarCrearAhorro = async (payload = {}, token) => {
    try {
        const data = await requestApi(API_URL_CREAR_AHORRO, {
            method: "POST",
            token,
            body: payload
        });

        if (Array.isArray(data) && data.length > 0) {
            throw new Error(extraerMensajeError(data[0], "No fue posible crear el ahorro"));
        }

        return data;
    } catch (error) {
        console.error("Error creando ahorro:", error);
        throw error;
    }
};

exports.crearAhorroCompleto = async ({ cedula, codLinea, tipo, cuota, valmin, valmax } = {}, token) => {
    const valorCuota = limpiarNumero(cuota);
    const valorMinimo = limpiarNumero(valmin);
    const valorMaximo = limpiarNumero(valmax);
    const tipoAhorro = String(tipo ?? "").trim();
    const codigoLinea = String(codLinea ?? "").trim();

    if (!cedula) {
        throw new Error("No se encontro la cedula del asociado");
    }

    if (!codigoLinea || !tipoAhorro) {
        throw new Error("Debe seleccionar una linea de ahorro valida");
    }

    if (!valorCuota) {
        throw new Error("Debe ingresar la cuota del ahorro");
    }

    if (valorMinimo && valorCuota < valorMinimo) {
        throw new Error(`La cuota del ahorro debe ser mayor o igual a ${valorMinimo.toLocaleString("es-CO")}`);
    }

    if (valorMaximo && valorCuota > valorMaximo) {
        throw new Error(`La cuota del ahorro debe ser menor o igual a ${valorMaximo.toLocaleString("es-CO")}`);
    }

    const numeroCuenta = await exports.obtenerConsecutivoAhorro({
        cedula,
        tipoAhorro,
        codLinea: codigoLinea
    }, token);

    const tasaEfectiva = await exports.obtenerTasaAhorro({
        tipoAhorro,
        codLinea: codigoLinea
    }, token);

    await exports.llamarCrearAhorro({
        cedula,
        codLinea: codigoLinea,
        numeroCuenta,
        ValorCuotaAhorro: valorCuota,
        tipoAhorro,
        tasaEfectiva
    }, token);

    return {
        estado: true,
        msj: "Ahorro creado correctamente",
        data: {
            codLinea: codigoLinea,
            tipoAhorro,
            numeroCuenta,
            ValorCuotaAhorro: valorCuota,
            tasaEfectiva
        }
    };
};
