const config = require("../config/config");
const { requestApi, construirUrlConParams } = require("../helpers/apiFetch");

const BASE_URL = config.apiUrlWeb;
const API_URL = `${BASE_URL}/private/api/Asociado/ConsultarInformacion`;
const API_URL_CONYUGUE = `${BASE_URL}/private/api/ActuDatos/ConsultarConyugue`;
const API_URL_OTROSDATOS = `${BASE_URL}/private/api/ActuDatos/ConsultarOtrosDatosAdicionales`;
const API_URL_AUTORIZACIONES = `${BASE_URL}/private/api/ActuDatos/ConsultarAutorizaciones`;
const API_URL_REFERENCIAS = `${BASE_URL}/private/api/ActuDatos/Referencias`;
const API_URL_PERSONASCARGO = `${BASE_URL}/private/api/ActuDatos/PersonasCargo`;
const API_URL_FAMILIARPEPS = `${BASE_URL}/private/api/ActuDatos/FamiliaresPeps`;
const API_URL_ADJUNTOSGENERALES = `${BASE_URL}/private/api/ActuDatos/ConsultarAdjuntosGeneral`;
const API_URL_ADJUNTOSRELACIONADOS = `${BASE_URL}/private/api/ActuDatos/ConsultarAdjuntosRelacionados`;
const API_URL_ACTUALIZACION_PENDIENTE = `${BASE_URL}/private/api/ActuDatos/ActualizacionPendiente`;
const API_URL_GUARDAR = `${BASE_URL}/private/api/ActuDatos/GuardarVersionTres`;
const API_URL_ESQUEMA_ACTUALIZACION = `${BASE_URL}/public/api/Esquema/Actualizacion`;
const API_URL_ULTIMAS_RESPUESTAS_AUTORIZACION = `${BASE_URL}/private/api/ActuDatos/ConsultaUltResAutorizacion`;

const extraerEsquemaActualizacion = (responseData) => {
    if (!Array.isArray(responseData) || !responseData[0]?.Esquema) {
        return null;
    }

    try {
        return JSON.parse(responseData[0].Esquema);
    } catch (error) {
        return null;
    }
};

exports.obtenerInformacionAsociado = async (Cedula, token) => {
    try {
        const urlFetch = construirUrlConParams(API_URL, Cedula ? { Cedula } : {});
        return await requestApi(urlFetch, { tokenWeb: token });
    } catch (error) {
        console.error("Error obteniendo la informacion del asociado:", error);
        throw error;
    }
};

exports.obtenerInformacionConyugue = async (Cedula, token) => {
    try {
        const urlFetch = construirUrlConParams(API_URL_CONYUGUE, Cedula ? { Cedula } : {});
        return await requestApi(urlFetch, { tokenWeb: token });
    } catch (error) {
        console.error("Error obteniendo la informacion del conyugue:", error);
        return null;
    }
};

exports.obtenerInformacionOtrosDatosAdicionales = async (Cedula, token) => {
    try {
        const urlFetch = construirUrlConParams(API_URL_OTROSDATOS, Cedula ? { Cedula } : {});
        return await requestApi(urlFetch, { tokenWeb: token });
    } catch (error) {
        console.error("Error obteniendo la informacion de otros datos adicionales:", error);
        return [[], [], []];
    }
};

exports.obtenerAutorizaciones = async (token) => {
    try {
        return await requestApi(API_URL_AUTORIZACIONES, { tokenWeb: token });
    } catch (error) {
        console.error("Error obteniendo las autorizaciones:", error);
        return null;
    }
}

exports.obtenerUltimasRespuestasAutorizacion = async (Cedula, token) => {
    try {
        const urlFetch = construirUrlConParams(API_URL_ULTIMAS_RESPUESTAS_AUTORIZACION, { Cedula: Cedula || "", Tipo: "" });
        return await requestApi(urlFetch, { tokenWeb: token });
    } catch (error) {
        console.error("Error obteniendo las ultimas respuestas de autorizacion:", error);
        return [];
    }
};

exports.obtenerReferencias = async (Cedula, token) => {
    try {
        const urlFetch = construirUrlConParams(API_URL_REFERENCIAS, Cedula ? { Cedula } : {});
        return await requestApi(urlFetch, { tokenWeb: token });
    } catch (error) {
        console.error("Error obteniendo las referencias:", error);
        return null;
    }
}

exports.obtenerPersonasCargo = async (Cedula, token) => {
    try {
        const urlFetch = construirUrlConParams(API_URL_PERSONASCARGO, Cedula ? { Cedula } : {});
        return await requestApi(urlFetch, { tokenWeb: token });
    } catch (error) {
        console.error("Error obteniendo las personas a cargo:", error);
        return null;
    }
};

exports.obtenerFamiliaresPeps = async (Cedula, token) => {
    try {
        const urlFetch = construirUrlConParams(API_URL_FAMILIARPEPS, Cedula ? { Cedula } : {});
        return await requestApi(urlFetch, { tokenWeb: token });
    } catch (error) {
        console.error("Error obteniendo los familiares peps:", error);
        return null;
    }
};

exports.obtenerAdjuntosGenerales = async (token) => {
    try {
        return await requestApi(API_URL_ADJUNTOSGENERALES, { tokenWeb: token });
    } catch (error) {
        console.error("Error obteniendo los adjuntos generales:", error);
        return null;
    }
};

exports.obtenerAdjuntosRelacionados = async (Cedula, token) => {
    try {
        const form = new URLSearchParams();
        form.append("Cedula", Cedula);
        return await requestApi(API_URL_ADJUNTOSRELACIONADOS, { method: "POST", tokenWeb: token, formBody: form });
    } catch (error) {
        console.error("Error obteniendo los adjuntos relacionados:", error);
        return null;
    }
};

exports.obtenerActualizacionPendiente = async (Cedula, token) => {
    try {
        const urlFetch = construirUrlConParams(API_URL_ACTUALIZACION_PENDIENTE, Cedula ? { cedula: Cedula } : {});
        const data = await requestApi(urlFetch, { tokenWeb: token });

        if (!data || data?.name === "RequestError") return false;
        if (Array.isArray(data)) return data.length > 0;
        if (typeof data === "object") return Object.keys(data).length > 0;
        return false;
    } catch (error) {
        console.error("Error obteniendo actualizacion pendiente:", error);
        return false;
    }
};

exports.obtenerEsquemaActualizacion = async () => {
    try {
        const data = await requestApi(API_URL_ESQUEMA_ACTUALIZACION, { method: "POST", body: {} });
        return extraerEsquemaActualizacion(data);
    } catch (error) {
        console.error("Error obteniendo el esquema de actualizacion:", error);
        return null;
    }
};

exports.obtenerEsquemaGrupoProteccion = async () => {
    const esquema = await exports.obtenerEsquemaActualizacion();
    return esquema?.schema?.properties?.GrupoProteccion?.EnumDescription || [];
};

exports.obtenerEsquemaOcupaciones = async () => {
    const esquema = await exports.obtenerEsquemaActualizacion();
    return esquema?.schema?.properties?.Ocupacion?.EnumDescription || [];
};

exports.guardarActualizacion = async (payload = {}, token) => {
    try {
        return await requestApi(API_URL_GUARDAR, { method: "POST", tokenWeb: token, body: payload }) ?? {};
    } catch (error) {
        console.error("Error guardando la actualizacion de datos:", error);
        throw error;
    }
};
