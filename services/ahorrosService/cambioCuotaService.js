const config = require("../../config/config");
const { requestApi, construirUrlConParams } = require("../../helpers/apiFetch");

const BASE_URL = config.apiUrlWeb;
const API_URL_PRODUCTOS_APORTES_AHORROS = `${BASE_URL}/private/api/saldos/aportesAhorros`;
const API_URL_INFO_ASOCIADO = `${BASE_URL}/private/api/Asociado/ConsultarInformacion`;
const API_URL_TIPOS_AHORROS_PERMITIDOS = `${BASE_URL}/private/api/Ahorro/tiposAhorrosPermitidos`;
const API_URL_VALIDA_ULTIMO_CAMBIO = `${BASE_URL}/private/api/Ahorro/ValidaUltimoCambioCuota`;
const API_URL_CAMBIO_CUOTA = `${BASE_URL}/private/api/Ahorro/CambioCuota`;

const normalizarTabla = (data) => {
    if (!Array.isArray(data)) return [];
    if (Array.isArray(data[0])) return data[0];
    return data;
};

const limpiarNumero = (value) => {
    const limpio = String(value ?? "").replace(/\D/g, "");
    return limpio ? Number(limpio) : 0;
};

const texto = (value) => String(value ?? "").trim();

const numero = (value) => {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }

    const normalizado = String(value ?? "").trim();

    if (!normalizado) {
        return 0;
    }

    const parsed = Number(normalizado.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
};

const PERIODOS_DEDUCCION = {
    E: { texto: "Semanal", dias: 7 },
    D: { texto: "Decadal", dias: 10 },
    O: { texto: "Catorcenal", dias: 14 },
    Q: { texto: "Quincenal", dias: 15 },
    V: { texto: "Veintiochonal", dias: 28 },
    M: { texto: "Mensual", dias: 30 },
    B: { texto: "Bimestral", dias: 60 },
    T: { texto: "Trimestral", dias: 90 },
    K: { texto: "Quinquenal", dias: 150 },
    S: { texto: "Semestral", dias: 180 },
    A: { texto: "Anual", dias: 360 }
};

const normalizarTextoPlano = (value) => texto(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

const obtenerClavePeriodoDeduccion = (periodo) => {
    const valor = normalizarTextoPlano(periodo);

    if (!valor) {
        return "";
    }

    if (PERIODOS_DEDUCCION[valor]) {
        return valor;
    }

    const encontrado = Object.entries(PERIODOS_DEDUCCION).find(([, configPeriodo]) =>
        normalizarTextoPlano(configPeriodo.texto) === valor
    );

    return encontrado?.[0] || "";
};

const periodoDeduccionLetraATexto = (periodo) => {
    const clave = obtenerClavePeriodoDeduccion(periodo);
    return clave ? PERIODOS_DEDUCCION[clave].texto : texto(periodo);
};

const periodoDeduccionLetraADias = (periodo) => {
    const clave = obtenerClavePeriodoDeduccion(periodo);
    return clave ? PERIODOS_DEDUCCION[clave].dias : 0;
};

const normalizarProducto = (producto = {}) => ({
    ...producto,
    codlinea: texto(producto.codlinea),
    numerocuenta: texto(producto.numerocuenta),
    namelinea: texto(producto.namelinea),
    quees: texto(producto.quees),
    fechainicio: texto(producto.fechainicio),
    fechaultimatran: texto(producto.fechaultimatran),
    fechavence: texto(producto.fechavence),
    interes: numero(producto.interes),
    interesdispon: numero(producto.interesdispon),
    morosidad: numero(producto.morosidad),
    pag: numero(producto.pag),
    saldoTotal: numero(producto.saldoTotal),
    valorcuota: numero(producto.valorcuota),
    tiempoFaltante: numero(producto.tiempoFaltante)
});

const normalizarTiposPermitidos = (data) => normalizarTabla(data)
    .map(item => texto(item.lineaahorros ?? item.codlinea ?? item.LineaAhorros))
    .filter(Boolean);

const normalizarBloqueosCambio = (data) => {
    const bloqueos = [];

    if (!Array.isArray(data)) {
        return bloqueos;
    }

    data.forEach(item => {
        const registro = Array.isArray(item) ? item[0] : item;
        const tiempoFaltante = numero(registro?.tiempofaltante);
        const codlinea = texto(registro?.codlinea);
        const numerocuenta = texto(registro?.numerocuenta);

        if (codlinea && numerocuenta && tiempoFaltante > 0) {
            bloqueos.push({ codlinea, numerocuenta, tiempoFaltante });
        }
    });

    return bloqueos;
};

const formatearFechaActualizacion = (fecha = new Date()) => {
    const pad = (valor) => String(valor).padStart(2, "0");

    return [
        fecha.getFullYear(),
        pad(fecha.getMonth() + 1),
        pad(fecha.getDate())
    ].join("/") + " " + [
        pad(fecha.getHours()),
        pad(fecha.getMinutes()),
        pad(fecha.getSeconds())
    ].join(":");
};

const obtenerPeriodoDeduccion = async (cedula, token) => {
    const urlFetch = construirUrlConParams(API_URL_INFO_ASOCIADO, { cedula });
    const data = await requestApi(urlFetch, { token });
    const registro = normalizarTabla(data)[0] || {};

    return texto(registro.periododeduce || registro.periodoDeduccion || registro.DL_txtperiododeduce);
};

exports.obtenerProductosAportesAhorros = async (cedula, token) => {
    const urlFetch = construirUrlConParams(API_URL_PRODUCTOS_APORTES_AHORROS, { cedula, pag: 1 });
    const data = await requestApi(urlFetch, { token });

    return normalizarTabla(data).map(normalizarProducto);
};

exports.obtenerTiposAhorrosPermitidos = async (cedula, token) => {
    const urlFetch = construirUrlConParams(API_URL_TIPOS_AHORROS_PERMITIDOS, { cedula });
    const data = await requestApi(urlFetch, { token });

    return normalizarTiposPermitidos(data);
};

exports.obtenerUltimosCambiosCuota = async (cedula, token) => {
    const urlFetch = construirUrlConParams(API_URL_VALIDA_ULTIMO_CAMBIO, { cedula });
    const data = await requestApi(urlFetch, { token });

    return normalizarBloqueosCambio(data);
};

exports.obtenerProductosDisponiblesCambioCuota = async (cedula, token) => {
    if (!cedula) {
        throw new Error("No se encontro la cedula del asociado");
    }

    if (!token) {
        throw new Error("No se encontro el token de autenticacion");
    }

    const [
        productos,
        lineasPermitidas,
        bloqueos,
        periodoDeduccion
    ] = await Promise.all([
        exports.obtenerProductosAportesAhorros(cedula, token),
        exports.obtenerTiposAhorrosPermitidos(cedula, token),
        exports.obtenerUltimosCambiosCuota(cedula, token),
        obtenerPeriodoDeduccion(cedula, token)
    ]);

    if (!productos.length) {
        return {
            periodoDeduccion,
            periodoDeduccionTexto: periodoDeduccionLetraATexto(periodoDeduccion),
            productos: []
        };
    }

    const lineasPermitidasSet = new Set(lineasPermitidas.map(linea => linea.trim()));
    const periodoDeduccionTexto = periodoDeduccionLetraATexto(periodoDeduccion);

    const productosFiltrados = productos
        .filter(producto => producto.quees === "AHORRO")
        .filter(producto => lineasPermitidasSet.has(producto.codlinea))
        .map(producto => {
            const bloqueo = bloqueos.find(item =>
                item.codlinea === producto.codlinea &&
                item.numerocuenta === producto.numerocuenta
            );

            return {
                ...producto,
                periodoDeduccion,
                periodoDeduccionTexto,
                tiempoFaltante: bloqueo?.tiempoFaltante || 0
            };
        });

    return {
        periodoDeduccion,
        periodoDeduccionTexto,
        productos: productosFiltrados
    };
};

exports.cambiarCuota = async ({
    cedula,
    codlinea,
    numerocuenta,
    cuotaNew,
    valorcuota
} = {}, token) => {
    const codigoLinea = texto(codlinea);
    const numeroCuenta = texto(numerocuenta);
    const cuotaNueva = limpiarNumero(cuotaNew);
    const cuotaActual = limpiarNumero(valorcuota);

    if (!cedula) {
        throw new Error("No se encontro la cedula del asociado");
    }

    if (!token) {
        throw new Error("No se encontro el token de autenticacion");
    }

    if (!codigoLinea || !numeroCuenta) {
        throw new Error("Debe seleccionar un ahorro valido");
    }

    if (!cuotaNueva || cuotaNueva <= 0) {
        throw new Error("La cuota debe ser mayor a 0");
    }

    if (String(cuotaNueva).length > 8) {
        throw new Error("La cuota debe ser menor a 8 digitos");
    }

    if (!cuotaActual) {
        throw new Error("No fue posible validar la cuota actual");
    }

    if (cuotaNueva === cuotaActual) {
        throw new Error("Cuotas Iguales");
    }

    const { productos, periodoDeduccion } = await exports.obtenerProductosDisponiblesCambioCuota(cedula, token);
    const productoCambiar = productos.find(producto =>
        producto.codlinea === codigoLinea &&
        producto.numerocuenta === numeroCuenta
    );

    if (!productoCambiar) {
        throw new Error("El producto no existe linea");
    }

    if (productoCambiar.tiempoFaltante > 0) {
        throw new Error("Para realizar un cambio de cuota al producto seleccionado debera esperar la fecha que alli se le muestra, segun los lineamientos establecidos por la entidad.");
    }

    const diasPeriodo = periodoDeduccionLetraADias(periodoDeduccion);

    if (!diasPeriodo) {
        throw new Error("No fue posible calcular el periodo de deduccion");
    }

    const valorCambioCuota = (cuotaNueva / diasPeriodo) * 30;
    const fechaActualizacion = formatearFechaActualizacion();

    const response = await requestApi(API_URL_CAMBIO_CUOTA, {
        method: "POST",
        token,
        body: {
            CedulaAsociado: cedula,
            LineaAhorros: codigoLinea,
            Nrocuenta: numeroCuenta,
            ValorCambioCuota: valorCambioCuota,
            FechaActualizacion: fechaActualizacion,
            QueQuieroHacer: "T"
        }
    });

    if (response?.estado === false) {
        throw new Error(response.msj || response.message || "No fue posible realizar el cambio de cuota");
    }

    return {
        estado: true,
        msj: "Cambio realizado correctamente",
        data: {
            codlinea: codigoLinea,
            numerocuenta: numeroCuenta,
            cuotaNew: cuotaNueva,
            valorCambioCuota,
            fechaActualizacion
        }
    };
};
