const API_URL = "http://10.2.0.44:3012/private/api/Asociado/ConsultarInformacion";
const API_URL_CONYUGUE = "http://10.2.0.44:3012/private/api/ActuDatos/ConsultarConyugue";
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
