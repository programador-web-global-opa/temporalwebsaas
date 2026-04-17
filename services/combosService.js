const config = require("../config/config");
const actualizaciondatosService = require("./actualizaciondatosService");
const BASE_URL = config.apiUrlWeb;



const configCombos = {
    paises: { tabla: "pais" },
    departamentos: { tabla: "departamentos", condicion: ["pais"] },
    ciudades: { tabla: "ciudad", condicion: ["dpto"] },
    ciiu: { tabla: "ciiu" },
    nacionalidad: { tabla: "nacionalidad" },
    abreviaturadir: { tabla: "abreviaturasdirecciones" },
    zona: { tabla: "zona", condicion: ["ciudad"] },
    comuna: { tabla: "comunas", condicion: ["zona", "ciudad"] },
    barrio: { tabla: "barrios", condicion: ["comuna", "zona", "ciudad"] },
    empresatrabajo: { tabla: "empresatrabajo" },
    profesiones: { tabla: "profesiones" },
    dependencia: { tabla: "dependenciasempresas", condicion: ["empresa"] },
    tipocontrato: { tabla: "tipocontrato" },
    pagaduria: { tabla: "empresas" },
    estudios: { tabla: "niveleducativo" },
    bancos: { tabla: "cuentasbancos" },
    tipovivienda: { tabla: "tipovivienda" },
    paisesmonedaextranjera: { tabla: "paismonedaextranjera" },
    ciudadesmonedaextranjera: { tabla: "ciudadmonedaextranjera", condicion: ["pais"] },
    tipopep: { tabla: "tipopeps" },
    tiporeferencia: { tabla: "referencia" },
    ocupacionactualizacion: { schema: "ocupacionesActualizacion" }
};

exports.obtenerCombo = async (params) => {

    const { tipo } = params;

    const config = configCombos[tipo];

    if (!config) return [];

    if (config.schema === "ocupacionesActualizacion") {
        const ocupaciones = await actualizaciondatosService.obtenerEsquemaOcupaciones();
        return [Array.isArray(ocupaciones) ? ocupaciones : []];
    }

    const tabla = config.tabla ?? "";
    const condicion = config.condicion ? config.condicion.map(condicion => params[condicion]).join("|") : "";

    const form = new URLSearchParams();
    form.append("tabla", tabla);
    form.append("condicion", condicion);

    console.log("Body enviado", form);
    const response = await fetch(`${BASE_URL}/public/api/General/CargarCombos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: form
    });

    const data = await response.json();
    return data;
};

