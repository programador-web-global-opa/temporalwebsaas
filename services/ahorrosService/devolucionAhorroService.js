const config = require("../../config/config");

const BASE_URL = config.apiUrlWeb;
const API_URL_PRODUCTOS_APORTES_AHORROS = `${BASE_URL}/private/api/saldos/aportesAhorros`;
const API_URL_CREDITOS = `${BASE_URL}/private/api/saldos/creditos`;
const API_URL_INFO_ASOCIADO = `${BASE_URL}/private/api/Asociado/ConsultarInformacion`;
const API_URL_PARAMETROS_DEVOLUCION = `${BASE_URL}/private/api/Ahorro/Devolucion`;
const API_URL_AHORROS_DISPONIBLES_RETIRO = `${BASE_URL}/private/api/Ahorro/AhorrosDisponiblesParaRetiro`;
const API_URL_DISPONIBILIDAD_AHORROS = `${BASE_URL}/private/api/Ahorro/TenerEncuentaDisponibilidadAhorros`;
const API_URL_DISPONIBILIDAD_CREDITOS = `${BASE_URL}/private/api/Ahorro/TenerEncuentaDisponibilidadCreditos`;
const API_URL_PENDIENTES_RETIRO = `${BASE_URL}/private/api/Ahorro/ValidarDisponAhorroConPendientes`;
const API_URL_TIEMPO_NUEVA_SOLICITUD = `${BASE_URL}/private/api/Ahorro/ValidarTiempoNuevaSolicitud`;
const API_URL_SOLICITUD_RETIRO_ID = `${BASE_URL}/private/api/Ahorro/SolicitudRetiroID`;
const API_URL_SOLICITUD_RETIRO = `${BASE_URL}/private/api/Ahorro/SolicitudRetiro`;

const headersJson = (token) => {
    const headers = {
        "Content-Type": "application/json"
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
};

const leerRespuesta = async (response) => {
    const responseText = await response.text();

    if (!responseText) {
        return null;
    }

    try {
        return JSON.parse(responseText);
    } catch (_) {
        return responseText;
    }
};

const extraerMensajeError = (data, fallback) => {
    if (!data) return fallback;
    if (typeof data === "string") return data;
    if (data.msj) return data.msj;
    if (data.message) return data.message;
    if (data.error) return data.error;

    return fallback;
};

const construirUrlConParams = (url, params = {}) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, value);
        }
    });

    const query = searchParams.toString();
    return query ? `${url}?${query}` : url;
};

const requestApi = async (url, { method = "GET", token, body } = {}) => {
    const response = await fetch(url, {
        method,
        headers: headersJson(token),
        body: body ? JSON.stringify(body) : undefined
    });

    const data = await leerRespuesta(response);

    if (!response.ok) {
        const error = new Error(extraerMensajeError(data, `Error HTTP: ${response.status}`));
        error.status = response.status;
        error.responseData = data;
        throw error;
    }

    return data;
};

const normalizarTabla = (data) => {
    if (!Array.isArray(data)) return [];
    if (Array.isArray(data[0])) return data[0];
    return data;
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

const limpiarNumero = (value) => {
    const limpio = String(value ?? "").replace(/\D/g, "");
    return limpio ? Number(limpio) : 0;
};

const formatearFechaSistema = (fecha = new Date()) => {
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

const normalizarProducto = (producto = {}) => ({
    ...producto,
    codlinea: texto(producto.codlinea),
    numerocuenta: texto(producto.numerocuenta),
    namelinea: texto(producto.namelinea),
    quees: texto(producto.quees),
    fechainicio: texto(producto.fechainicio),
    fechavence: texto(producto.fechavence),
    fechaultimatran: texto(producto.fechaultimatran),
    valorcuota: numero(producto.valorcuota),
    saldoTotal: numero(producto.saldoTotal),
    interes: numero(producto.interes),
    interesdispon: numero(producto.interesdispon),
    morosidad: numero(producto.morosidad),
    pag: numero(producto.pag)
});

const normalizarCredito = (credito = {}) => ({
    ...credito,
    quees: texto(credito.quees),
    codlinea: texto(credito.codlinea),
    coddestino: texto(credito.coddestino),
    pagare: texto(credito.pagare),
    saldo: numero(credito.saldo),
    capital: numero(credito.capital)
});

const normalizarInfoAsociado = (data) => {
    const registro = normalizarTabla(data)[0] || {};

    return {
        nombreintegrado: texto(registro.nombreintegrado),
        email: texto(registro.email)
    };
};

const normalizarLineas = (data) => normalizarTabla(data)
    .map((item) => texto(item.lineaahorros ?? item.codlinea ?? item.LineaAhorros))
    .filter(Boolean);

const normalizarCreditosDisponibilidad = (data) => normalizarTabla(data)
    .map((item) => ({
        coddestino: texto(item.Coddestino ?? item.coddestino ?? item.codDestino),
        multiplicador: numero(item.multiplicador ?? item.Multiplicador)
    }))
    .filter((item) => item.coddestino);

const normalizarPendientes = (data) => normalizarTabla(data)
    .map((item) => ({
        valoraretirar: numero(item.valoraretirar ?? item.valorRetirar)
    }));

const normalizarParametrosDevolucion = (data) => {
    const registro = normalizarTabla(data)[0] || {};

    return {
        comprobante: numero(registro.comprobante),
        montominimo: numero(registro.montominimo),
        horas: numero(registro.horas)
    };
};

const normalizarTiempoSolicitud = (data) => {
    const registro = normalizarTabla(data)[0] || {};

    return {
        tieneRegistro: Object.keys(registro).length > 0,
        minDesdeUltRet: numero(registro.minDesdeUltRet)
    };
};

const normalizarSolicitudRetiroId = (data) => {
    if (data && !Array.isArray(data) && typeof data === "object") {
        return numero(data.id) || 1;
    }

    const registro = normalizarTabla(data)[0] || normalizarTabla(data) || {};
    return numero(registro.id) || 1;
};

const sumarAhorrosDisponibilidad = (productos, lineasDisponibles) => {
    const lineasPermitidas = new Set(lineasDisponibles.map((linea) => texto(linea)));
    let sumAhorros = 0;
    let comocalculo = "[";

    productos.forEach((producto) => {
        if (!lineasPermitidas.has(producto.codlinea)) {
            return;
        }

        sumAhorros += producto.saldoTotal;
        comocalculo += `Linea=${producto.codlinea};Agenc=1;Nroct=${producto.numerocuenta};Dispo=${producto.saldoTotal};Inter=${producto.interes}/`;
    });

    comocalculo += "]";

    return {
        sumAhorros,
        comocalculo
    };
};

const sumarCreditosDisponibilidad = (creditos, configuracionCreditos) => {
    const mapaConfiguracion = new Map();
    let sumCreditos = 0;
    let comocalculo = "[";

    configuracionCreditos.forEach((item) => {
        mapaConfiguracion.set(item.coddestino, item.multiplicador <= 0 ? 1 : item.multiplicador);
    });

    creditos.forEach((credito) => {
        if (!mapaConfiguracion.has(credito.coddestino)) {
            return;
        }

        const multiplicador = mapaConfiguracion.get(credito.coddestino) || 1;
        const saldoCredito = credito.saldo / multiplicador;

        sumCreditos += saldoCredito;
        comocalculo += `Desti=${credito.coddestino};Pagar=${credito.pagare};Deuda=${credito.saldo};Mult=${multiplicador};Dedcr=${saldoCredito}/`;
    });

    comocalculo += "]";

    return {
        sumCreditos,
        comocalculo
    };
};

const calcularDisponibilidadBase = ({ saldo, sumAhorros, sumCreditos }) => {
    if (sumAhorros === 0 && sumCreditos === 0) {
        return {
            valorDevolucion: saldo,
            comocalculo: "[Embar=N/]"
        };
    }

    let valorDevolucion = sumAhorros - sumCreditos;
    valorDevolucion = saldo > valorDevolucion ? valorDevolucion : saldo;

    return {
        valorDevolucion,
        comocalculo: "[Embar=N/]"
    };
};

const ajustarDisponibilidadPorPendientes = ({ valorDevolucion, saldo, pendientes }) => {
    if (valorDevolucion <= 0) {
        return {
            valorDevolucion: 0,
            disponibleProyectadoConDevol: 0,
            totalPendientes: 0,
            flagProyeccion: false,
            comocalculo: "[AjuDe=]"
        };
    }

    const totalPendientes = pendientes.reduce((acumulado, item) => acumulado + item.valoraretirar, 0);
    const disponibleProyectadoConDevol = Math.max(0, saldo - totalPendientes);
    const flagProyeccion = pendientes.length > 0;

    let disponibleAjustado = valorDevolucion;
    let comocalculo = "[AjuDe=";

    if (flagProyeccion && valorDevolucion > disponibleProyectadoConDevol) {
        disponibleAjustado = disponibleProyectadoConDevol;
        comocalculo += `${disponibleProyectadoConDevol}/`;
    }

    comocalculo += "]";

    return {
        valorDevolucion: Math.max(0, disponibleAjustado),
        disponibleProyectadoConDevol,
        totalPendientes,
        flagProyeccion,
        comocalculo
    };
};

const calcularGMF = (valorSolicitado) => (valorSolicitado * 4) / 1000;

const construirMensajeEspera = (minutos) => {
    if (minutos > 60) {
        const horas = Math.round(minutos / 60);
        const minutosRestantes = Math.round(minutos % 60);
        return `Debera esperar ${horas} hora(s) y ${minutosRestantes} minutos(s) para realizar tu nueva solicitud de retiro`;
    }

    return `Debera esperar ${Math.round(minutos)} minuto(s) para realizar tu nueva solicitud de retiro`;
};

const buscarAhorro = (productos, codlinea, numerocuenta) => productos.find((producto) =>
    producto.codlinea === texto(codlinea) &&
    producto.numerocuenta === texto(numerocuenta)
);

const validarCedulaYToken = (cedula, token) => {
    if (!cedula) {
        throw new Error("No se encontro la cedula del asociado");
    }

    if (!token) {
        throw new Error("No se encontro el token de autenticacion");
    }
};

const construirContextoDevolucion = async ({
    cedula,
    codlinea,
    numerocuenta,
    incluirParametros = false,
    incluirInfoAsociado = false
} = {}, token) => {
    validarCedulaYToken(cedula, token);

    const codigoLinea = texto(codlinea);
    const numeroCuenta = texto(numerocuenta);

    if (!codigoLinea || !numeroCuenta) {
        throw new Error("Debe seleccionar un ahorro valido");
    }

    const [
        productos,
        creditos,
        lineasDisponibilidadAhorros,
        configuracionCreditos,
        pendientes,
        infoAsociado,
        parametros
    ] = await Promise.all([
        exports.obtenerProductosAportesAhorros(cedula, token),
        exports.obtenerCreditos(cedula, token),
        exports.obtenerLineasDisponibilidadAhorros(token),
        exports.obtenerCreditosDisponibilidad(token),
        exports.obtenerPendientesRetiro({ cedula, codlinea: codigoLinea, numerocuenta: numeroCuenta }, token),
        incluirInfoAsociado ? exports.obtenerInformacionAsociado(cedula, token) : Promise.resolve({ nombreintegrado: "", email: "" }),
        incluirParametros ? exports.obtenerParametrosDevolucion(token) : Promise.resolve({ comprobante: 0, montominimo: 0, horas: 0 })
    ]);

    const ahorro = buscarAhorro(productos, codigoLinea, numeroCuenta);

    if (!ahorro) {
        throw new Error("No fue posible encontrar el ahorro seleccionado");
    }

    const resumenAhorros = sumarAhorrosDisponibilidad(productos, lineasDisponibilidadAhorros);
    const resumenCreditos = sumarCreditosDisponibilidad(creditos, configuracionCreditos);
    const disponibilidadBase = calcularDisponibilidadBase({
        saldo: ahorro.saldoTotal,
        sumAhorros: resumenAhorros.sumAhorros,
        sumCreditos: resumenCreditos.sumCreditos
    });
    const ajustePendientes = ajustarDisponibilidadPorPendientes({
        valorDevolucion: disponibilidadBase.valorDevolucion,
        saldo: ahorro.saldoTotal,
        pendientes
    });

    return {
        ahorro,
        asociado: infoAsociado,
        parametros,
        sumAhorros: resumenAhorros.sumAhorros,
        sumCreditos: resumenCreditos.sumCreditos,
        valorDevolucionBase: disponibilidadBase.valorDevolucion,
        valorDevolucion: ajustePendientes.valorDevolucion,
        disponibleProyectadoConDevol: ajustePendientes.disponibleProyectadoConDevol,
        totalPendientes: ajustePendientes.totalPendientes,
        flagProyeccion: ajustePendientes.flagProyeccion,
        fechaSolicitud: formatearFechaSistema(),
        comocalculo: [
            resumenAhorros.comocalculo,
            resumenCreditos.comocalculo,
            disponibilidadBase.comocalculo,
            ajustePendientes.comocalculo
        ].join("")
    };
};

exports.obtenerProductosAportesAhorros = async (cedula, token) => {
    const urlFetch = construirUrlConParams(API_URL_PRODUCTOS_APORTES_AHORROS, { cedula, pag: 1 });
    const data = await requestApi(urlFetch, { token });

    return normalizarTabla(data).map(normalizarProducto);
};

exports.obtenerCreditos = async (cedula, token) => {
    const urlFetch = construirUrlConParams(API_URL_CREDITOS, { cedula, pag: 1 });
    const data = await requestApi(urlFetch, { token });

    return normalizarTabla(data).map(normalizarCredito);
};

exports.obtenerInformacionAsociado = async (cedula, token) => {
    const urlFetch = construirUrlConParams(API_URL_INFO_ASOCIADO, { cedula });
    const data = await requestApi(urlFetch, { token });

    return normalizarInfoAsociado(data);
};

exports.obtenerParametrosDevolucion = async (token) => {
    const data = await requestApi(API_URL_PARAMETROS_DEVOLUCION, { token });
    return normalizarParametrosDevolucion(data);
};

exports.obtenerAhorrosDisponiblesParaRetiro = async (token) => {
    const data = await requestApi(API_URL_AHORROS_DISPONIBLES_RETIRO, { token });
    return normalizarLineas(data);
};

exports.obtenerLineasDisponibilidadAhorros = async (token) => {
    const data = await requestApi(API_URL_DISPONIBILIDAD_AHORROS, { token });
    return normalizarLineas(data);
};

exports.obtenerCreditosDisponibilidad = async (token) => {
    const data = await requestApi(API_URL_DISPONIBILIDAD_CREDITOS, { token });
    return normalizarCreditosDisponibilidad(data);
};

exports.obtenerPendientesRetiro = async ({ cedula, codlinea, numerocuenta } = {}, token) => {
    const urlFetch = construirUrlConParams(API_URL_PENDIENTES_RETIRO, {
        cedula,
        linea: codlinea,
        cuenta: numerocuenta
    });
    const data = await requestApi(urlFetch, { token });

    return normalizarPendientes(data);
};

exports.validarTiempoNuevaSolicitud = async (cedula, horas, token) => {
    const urlFetch = construirUrlConParams(API_URL_TIEMPO_NUEVA_SOLICITUD, { cedula });
    const data = await requestApi(urlFetch, { token });
    const registro = normalizarTiempoSolicitud(data);
    const minutosMinimos = numero(horas) * 60;

    if (!minutosMinimos) {
        return true;
    }

    if (!registro.tieneRegistro) {
        return true;
    }

    if (registro.minDesdeUltRet > minutosMinimos) {
        return true;
    }

    return Math.max(minutosMinimos - registro.minDesdeUltRet, 0);
};

exports.obtenerSolicitudRetiroId = async (token) => {
    const data = await requestApi(API_URL_SOLICITUD_RETIRO_ID, { token });
    return normalizarSolicitudRetiroId(data);
};

exports.guardarSolicitudRetiro = async (payload = {}, token) => {
    const data = await requestApi(API_URL_SOLICITUD_RETIRO, {
        method: "POST",
        token,
        body: payload
    });

    const tabla = normalizarTabla(data);

    if (Array.isArray(tabla) && tabla.length > 0) {
        throw new Error(extraerMensajeError(tabla[0], "No fue posible guardar la solicitud"));
    }

    if (data?.estado === false) {
        throw new Error(extraerMensajeError(data, "No fue posible guardar la solicitud"));
    }

    return data;
};

exports.obtenerProductosDisponiblesDevolucion = async (cedula, token) => {
    validarCedulaYToken(cedula, token);

    const [productos, lineasPermitidas, asociado] = await Promise.all([
        exports.obtenerProductosAportesAhorros(cedula, token),
        exports.obtenerAhorrosDisponiblesParaRetiro(token),
        exports.obtenerInformacionAsociado(cedula, token)
    ]);

    const lineasPermitidasSet = new Set(lineasPermitidas.map((linea) => texto(linea)));
    const productosFiltrados = productos
        .filter((producto) => lineasPermitidasSet.has(producto.codlinea))
        .map((producto) => ({
            ...producto,
            txtEmail: asociado.email,
            nombreintegrado: asociado.nombreintegrado
        }));

    return {
        asociado,
        productos: productosFiltrados
    };
};

exports.obtenerValorDisponible = async ({ cedula, codlinea, numerocuenta } = {}, token) => {
    const contexto = await construirContextoDevolucion({
        cedula,
        codlinea,
        numerocuenta,
        incluirInfoAsociado: true
    }, token);

    return {
        cedula: texto(cedula),
        valorDisponible: contexto.valorDevolucion,
        fechaSolicitud: contexto.fechaSolicitud,
        asociado: contexto.asociado,
        ahorro: contexto.ahorro
    };
};

exports.solicitarDevolucion = async ({
    cedula,
    codlinea,
    numerocuenta,
    valorSolicitado
} = {}, token) => {
    const codigoLinea = texto(codlinea);
    const numeroCuenta = texto(numerocuenta);
    const valorRetirar = limpiarNumero(valorSolicitado);

    validarCedulaYToken(cedula, token);

    if (!codigoLinea || !numeroCuenta) {
        throw new Error("Debe seleccionar un ahorro valido");
    }

    if (!valorRetirar || valorRetirar <= 0) {
        throw new Error("El valor a retirar debe ser mayor a cero (0). Por favor verifica.");
    }

    const contexto = await construirContextoDevolucion({
        cedula,
        codlinea: codigoLinea,
        numerocuenta: numeroCuenta,
        incluirParametros: true
    }, token);

    const tiempoRestante = await exports.validarTiempoNuevaSolicitud(cedula, contexto.parametros.horas, token);

    if (tiempoRestante !== true) {
        throw new Error(construirMensajeEspera(tiempoRestante));
    }

    if (valorRetirar > contexto.valorDevolucion) {
        if (contexto.flagProyeccion && contexto.disponibleProyectadoConDevol <= 0) {
            throw new Error("No cumple con los criterios establecidos para la solicitud de retiro o tiene solicitudes pendientes");
        }

        if (contexto.flagProyeccion) {
            throw new Error(`El valor para la solicitud de devolucion de este ahorro debe ser menor o igual a: $${contexto.valorDevolucion.toLocaleString("es-CO")} debido a que usted posee devoluciones de ahorro pendientes para esta linea.`);
        }

        throw new Error(`El valor para la solicitud de devolucion de este ahorro debe ser menor o igual a: $${contexto.valorDevolucion.toLocaleString("es-CO")}. Por favor verifica.`);
    }

    if (contexto.parametros.montominimo && valorRetirar < contexto.parametros.montominimo) {
        throw new Error(`El valor minimo permitido para retirar es: $${contexto.parametros.montominimo.toLocaleString("es-CO")}. Por favor verifica.`);
    }

    let grabamen = 0;

    if (valorRetirar !== contexto.valorDevolucion) {
        grabamen = calcularGMF(valorRetirar);
        const retiroConGMF = valorRetirar + grabamen;

        if (retiroConGMF > contexto.valorDevolucion) {
            throw new Error(`Esta realizando una solicitud de retiro por valor de: $${valorRetirar.toLocaleString("es-CO")}, al calcularle el GMF, el retiro total queda por valor de: $${retiroConGMF.toLocaleString("es-CO")}. Este valor excede el saldo disponible que es: $${contexto.valorDevolucion.toLocaleString("es-CO")} por lo que no es permitido. Lo invitamos a verificar el valor del retiro o solicitar el valor total disponible.`);
        }
    }

    const idSolicitud = await exports.obtenerSolicitudRetiroId(token);

    await exports.guardarSolicitudRetiro({
        JAid: idSolicitud,
        JAcedula: cedula,
        JAcuenta: numeroCuenta,
        JAlinea: codigoLinea,
        JAfsolicitud: contexto.fechaSolicitud,
        JAporAHO: contexto.sumAhorros,
        JAporCRE: contexto.sumCreditos,
        JAdisponible: 0,
        JAcuota: contexto.ahorro.valorcuota,
        JAsaldo: contexto.ahorro.saldoTotal,
        JAinteres: contexto.ahorro.interes,
        JAvlrsolicitado: valorRetirar,
        JAcomocalculo: contexto.comocalculo,
        EGgrabamen: Number(grabamen.toFixed(2))
    }, token);

    return {
        estado: true,
        msj: "Solicitud guardada correctamente, la entidad se comunicara en los proximos dias para el desembolso del valor solicitado.",
        data: {
            idSolicitud,
            codlinea: codigoLinea,
            numerocuenta: numeroCuenta,
            valorSolicitado: valorRetirar,
            valorDisponible: contexto.valorDevolucion
        }
    };
};
