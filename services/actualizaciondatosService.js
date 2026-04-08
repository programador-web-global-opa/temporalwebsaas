const API_URL = "http://10.2.0.44:3012/private/api/Asociado/ConsultarInformacion";
const API_URL_CONYUGUE = "http://10.2.0.44:3012/private/api/ActuDatos/ConsultarConyugue";
const API_URL_OTROSDATOS = "http://10.2.0.44:3012/private/api/ActuDatos/ConsultarOtrosDatosAdicionales";
const API_URL_AUTORIZACIONES = "http://10.2.0.44:3012/private/api/ActuDatos/ConsultarAutorizaciones";
const API_URL_REFERENCIAS = "http://10.2.0.44:3012/private/api/ActuDatos/Referencias";
const API_URL_PERSONASCARGO = "http://10.2.0.44:3012/private/api/ActuDatos/PersonasCargo";
const API_URL_FAMILIARPEPS = "http://10.2.0.44:3012/private/api/ActuDatos/FamiliaresPeps";
const API_URL_ADJUNTOSGENERALES = "http://10.2.0.44:3012/private/api/ActuDatos/ConsultarAdjuntosGeneral";
const API_URL_ADJUNTOSRELACIONADOS = "http://10.2.0.44:3012/private/api/ActuDatos/ConsultarAdjuntosRelacionados";
const TOKEN_QUEMADO = "";
exports.obtenerInformacionAsociado = async (Cedula) => {
    try {
        const urlFetch = Cedula ? `${API_URL}?Cedula=${Cedula}` : API_URL;
        const response = await fetch(urlFetch, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${TOKEN_QUEMADO}`,
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

exports.obtenerInformacionConyugue = async (Cedula) => {
    try {
        const urlFetch = Cedula ? `${API_URL_CONYUGUE}?Cedula=${Cedula}` : API_URL_CONYUGUE;
        const response = await fetch(urlFetch, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${TOKEN_QUEMADO}`,
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

exports.obtenerAutorizaciones = async () => {
    try {
        const urlFetch = API_URL_AUTORIZACIONES;
        const response = await fetch(urlFetch, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${TOKEN_QUEMADO}`,
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

exports.obtenerReferencias = async (Cedula) => {
    try {
        const urlFetch = Cedula ? `${API_URL_REFERENCIAS}?Cedula=${Cedula}` : API_URL_REFERENCIAS;
        const response = await fetch(urlFetch, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${TOKEN_QUEMADO}`,
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

exports.obtenerPersonasCargo = async (Cedula) => {
    try {
        const urlFetch = Cedula ? `${API_URL_PERSONASCARGO}?Cedula=${Cedula}` : API_URL_PERSONASCARGO;
        const response = await fetch(urlFetch, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${TOKEN_QUEMADO}`,
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

exports.obtenerFamiliaresPeps = async (Cedula) => {
    try {
        const urlFetch = Cedula ? `${API_URL_FAMILIARPEPS}?Cedula=${Cedula}` : API_URL_FAMILIARPEPS;
        const response = await fetch(urlFetch, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${TOKEN_QUEMADO}`,
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

exports.obtenerAdjuntosGenerales = async () => {
    try {
        const urlFetch = API_URL_ADJUNTOSGENERALES;
        const response = await fetch(urlFetch, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${TOKEN_QUEMADO}`,
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

exports.obtenerAdjuntosRelacionados = async (Cedula) => {
    try {
        const form = new URLSearchParams();
        form.append("Cedula", Cedula);
        const response = await fetch(API_URL_ADJUNTOSRELACIONADOS, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${TOKEN_QUEMADO}`,
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
