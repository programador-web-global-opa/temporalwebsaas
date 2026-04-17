const config = require("../config/config");

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
        const urlFetch = Cedula ? `${API_URL}?Cedula=${Cedula}` : API_URL;
        const response = await fetch(urlFetch, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error obteniendo la informacion del asociado:", error);
        throw error;
    }
};

exports.obtenerInformacionConyugue = async (Cedula, token) => {
    try {
        const urlFetch = Cedula ? `${API_URL_CONYUGUE}?Cedula=${Cedula}` : API_URL_CONYUGUE;
        const response = await fetch(urlFetch, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error obteniendo la informacion del conyugue:", error);
        return null;
    }
};

exports.obtenerInformacionOtrosDatosAdicionales = async (Cedula, token) => {
    try {
        const urlFetch = Cedula ? `${API_URL_OTROSDATOS}?Cedula=${Cedula}` : API_URL_OTROSDATOS;
        const response = await fetch(urlFetch, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error obteniendo la informacion de otros datos adicionales:", error);
        return [[], [], []];
    }

};

exports.obtenerAutorizaciones = async (token) => {
    try {
        const urlFetch = API_URL_AUTORIZACIONES;
        const response = await fetch(urlFetch, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error obteniendo las autorizaciones:", error);
        return null;
    }
}

exports.obtenerReferencias = async (Cedula, token) => {
    try {
        const urlFetch = Cedula ? `${API_URL_REFERENCIAS}?Cedula=${Cedula}` : API_URL_REFERENCIAS;
        const response = await fetch(urlFetch, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error obteniendo las referencias:", error);
        return null;
    }
}

exports.obtenerPersonasCargo = async (Cedula, token) => {
    try {
        const urlFetch = Cedula ? `${API_URL_PERSONASCARGO}?Cedula=${Cedula}` : API_URL_PERSONASCARGO;
        const response = await fetch(urlFetch, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error obteniendo las personas a cargo:", error);
        return null;
    }
};

exports.obtenerFamiliaresPeps = async (Cedula, token) => {
    try {
        const urlFetch = Cedula ? `${API_URL_FAMILIARPEPS}?Cedula=${Cedula}` : API_URL_FAMILIARPEPS;
        const response = await fetch(urlFetch, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error obteniendo los familiares peps:", error);
        return null;
    }
};

exports.obtenerAdjuntosGenerales = async (token) => {
    try {
        const urlFetch = API_URL_ADJUNTOSGENERALES;
        const response = await fetch(urlFetch, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error obteniendo los adjuntos generales:", error);
        return null;
    }
};

exports.obtenerAdjuntosRelacionados = async (Cedula, token) => {
    try {
        const form = new URLSearchParams();
        form.append("Cedula", Cedula);
        const response = await fetch(API_URL_ADJUNTOSRELACIONADOS, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: form
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error obteniendo los adjuntos relacionados:", error);
        return null;
    }
};

exports.obtenerActualizacionPendiente = async (Cedula, token) => {
    try {
        const urlFetch = Cedula
            ? `${API_URL_ACTUALIZACION_PENDIENTE}?cedula=${encodeURIComponent(Cedula)}`
            : API_URL_ACTUALIZACION_PENDIENTE;

        const response = await fetch(urlFetch, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (!data || data?.name === "RequestError") {
            return false;
        }

        if (Array.isArray(data)) {
            return data.length > 0;
        }

        if (typeof data === "object") {
            return Object.keys(data).length > 0;
        }

        return false;
    } catch (error) {
        console.error("Error obteniendo actualizacion pendiente:", error);
        return false;
    }
};

exports.obtenerEsquemaActualizacion = async () => {
    try {
        const response = await fetch(API_URL_ESQUEMA_ACTUALIZACION, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({})
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
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
        const response = await fetch(API_URL_GUARDAR, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const contenido = await response.text();
        let data = {};

        if (contenido.trim()) {
            try {
                data = JSON.parse(contenido);
            } catch (error) {
                data = { message: contenido };
            }
        }

        if (!response.ok) {
            const detalle =
                data?.msj ||
                data?.message ||
                (typeof contenido === "string" ? contenido.trim() : "") ||
                `Error HTTP: ${response.status}`;

            const error = new Error(
                `Error HTTP: ${response.status}${detalle ? ` - ${detalle}` : ""}`
            );

            error.status = response.status;
            error.responseBody = contenido;
            error.responseData = data;
            throw error;
        }

        if (!contenido.trim()) {
            return {};
        }

        return data;
    } catch (error) {
        console.error("Error guardando la actualizacion de datos:", error);
        throw error;
    }
};
