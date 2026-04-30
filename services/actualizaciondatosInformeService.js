const fs = require("fs/promises");
const path = require("path");
const ejs = require("ejs");
const config = require("../config/config");
const actualizaciondatosService = require("./actualizaciondatosService");
const combosService = require("./combosService");

const BASE_URL = config.apiUrlWeb;
const API_URL_INFORME_ENTIDAD = `${BASE_URL}/public/api/InformeEntidad`;
const API_URL_INFORME_AGENCIA = `${BASE_URL}/public/api/InformeAgencia`;
const PDF_TEMPLATE_PATH = path.join(__dirname, "..", "views", "actualizaciondatos", "pdf", "solidario.ejs");
const LOGO_PATH = path.join(__dirname, "..", "public", "images", "logo.png");
const VARIABLES_CSS_PATH = path.join(__dirname, "..", "public", "stylesheets", "variables.css");
const DEFAULT_COLOR_ENTIDAD = "#1c6bff";
const PDF_MIME_TYPE = "application/pdf";

const TIPO_DOCUMENTO_MAP = {
    C: "CEDULA CIUDADANIA",
    N: "NIT",
    P: "PASAPORTE",
    E: "CEDULA EXTRANJERIA",
    R: "REGISTRO CIVIL",
    T: "TARJETA DE IDENTIDAD",
    U: "NRO UNICO IDENT. PERSONAL",
    O: "OTRO",
    H: "RUT"
};

const SI_NO_MAP = {
    S: "SI",
    N: "NO"
};

const ESTADO_CIVIL_MAP = {
    S: "SOLTERO(A)",
    C: "CASADO(A)",
    D: "VIUDO(A)",
    U: "DIVORCIADO",
    V: "UNION LIBRE",
    F: "MADRE SOLTERA",
    P: "MUJER CABEZA FAMILIA"
};

const GENERO_MAP = {
    M: "MASCULINO",
    F: "FEMENINO",
    O: "OTRO"
};

const TIPO_CUENTA_MAP = {
    A: "AHORRO",
    C: "CORRIENTE"
};

const TIPO_ZONA_MAP = {
    R: "RURAL",
    U: "URBANO"
};

const ENVIO_DOCUMENTOS_MAP = {
    "NO ENVIAR": "NO ENVIAR",
    "DIR RESIDENCIA": "DIR RESIDENCIA",
    "DIR EMPRESA": "DIR EMPRESA",
    EMAIL: "EMAIL"
};

const TIPO_EMPRESA_MAP = {
    P: "PRIVADA",
    U: "PUBLICA",
    M: "MIXTA",
    O: "OTRA"
};

const COMBO_DEFAULT_FIELDS = {
    id: ["id", "Id", "value", "codigo", "Code", "code"],
    text: ["opcion", "nombre", "Name", "name", "descripcion", "Description", "text"]
};

const COMBO_SPECIAL_FIELDS = {
    ciiu: {
        id: ["codciiu", ...COMBO_DEFAULT_FIELDS.id],
        text: ["nombre", ...COMBO_DEFAULT_FIELDS.text]
    },
    tipocontrato: {
        id: ["codigotipocontrato", ...COMBO_DEFAULT_FIELDS.id],
        text: ["nombretipocontrato", ...COMBO_DEFAULT_FIELDS.text]
    },
    ocupacionactualizacion: {
        id: ["Code", ...COMBO_DEFAULT_FIELDS.id],
        text: ["Name", ...COMBO_DEFAULT_FIELDS.text]
    }
};

let logoDataUrlCache = null;
let colorPrincipalEntidadCache = null;

const texto = (valor) => {
    if (valor === null || valor === undefined) {
        return "";
    }

    return String(valor).trim();
};

const tieneContenido = (valor) => texto(valor) !== "";

const normalizarCodigo = (valor) => texto(valor).toUpperCase();

const textoMayuscula = (valor) => texto(valor).toUpperCase();

const numeroDesdeTexto = (valor) => {
    if (!tieneContenido(valor)) {
        return 0;
    }

    const limpio = String(valor)
        .trim()
        .replace(/\s/g, "")
        .replace(/\./g, "")
        .replace(/,/g, "");

    const numero = Number(limpio);
    return Number.isFinite(numero) ? numero : 0;
};

const formatearNumero = (valor) => {
    if (!tieneContenido(valor) && valor !== 0) {
        return "";
    }

    const numero = typeof valor === "number" ? valor : numeroDesdeTexto(valor);

    if (!Number.isFinite(numero)) {
        return texto(valor);
    }

    return new Intl.NumberFormat("es-CO").format(numero);
};

const unirPartes = (...partes) => partes
    .map(texto)
    .filter(Boolean)
    .join(" ");

const obtenerTextoLocal = (mapa = {}, valor = "") => {
    const codigo = normalizarCodigo(valor);
    return mapa[codigo] || texto(valor);
};

const construirHeaders = (token) => {
    const headers = {
        "Content-Type": "application/json"
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
};

const consumirEndpoint = async (url, body, token) => {
    const response = await fetch(url, {
        method: "POST",
        headers: construirHeaders(token),
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
    }

    return response.json();
};

const normalizarEntidad = (data) => {
    const entidad = Array.isArray(data) ? data[0] || {} : {};

    return {
        nombre: texto(entidad.nombre),
        codigo: texto(entidad.codigo),
        nit: texto(entidad.nit)
    };
};

const normalizarAgencia = (data, codigoPorDefecto) => {
    const agencia = Array.isArray(data) ? data[0] || {} : {};
    const codigo = agencia.codigo === null || agencia.codigo === undefined || agencia.codigo === ""
        ? codigoPorDefecto
        : Number(agencia.codigo);

    return {
        codigo: Number.isNaN(codigo) ? codigoPorDefecto : codigo,
        nombre: texto(agencia.nombre)
    };
};

const normalizarListaCombo = (data) => {
    if (!Array.isArray(data)) {
        return [];
    }

    if (Array.isArray(data[0])) {
        return data[0];
    }

    return data;
};

const obtenerValorCampo = (item = {}, campos = []) => {
    for (const campo of campos) {
        if (Object.prototype.hasOwnProperty.call(item, campo)) {
            return item[campo];
        }
    }

    return undefined;
};

const normalizarItemCombo = (item = {}, tipo = "") => {
    const config = COMBO_SPECIAL_FIELDS[tipo] || COMBO_DEFAULT_FIELDS;

    return {
        id: texto(obtenerValorCampo(item, config.id)),
        nombre: texto(obtenerValorCampo(item, config.text))
    };
};

const sonCodigosEquivalentes = (left, right) => {
    const codigoLeft = normalizarCodigo(left);
    const codigoRight = normalizarCodigo(right);

    if (!codigoLeft || !codigoRight) {
        return false;
    }

    if (codigoLeft === codigoRight) {
        return true;
    }

    if (/^\d+$/.test(codigoLeft) && /^\d+$/.test(codigoRight)) {
        return Number(codigoLeft) === Number(codigoRight);
    }

    return false;
};

const buscarNombreEnLista = (lista = [], valor = "", tipo = "") => {
    const codigo = normalizarCodigo(valor);

    if (!codigo) {
        return "";
    }

    const itemsNormalizados = lista
        .map((registro) => normalizarItemCombo(registro, tipo))
        .filter((item) => item.id && item.nombre);
    const item = itemsNormalizados.find((registro) => sonCodigosEquivalentes(registro.id, codigo));

    return texto(item?.nombre);
};

const obtenerNombreCombo = async (tipo, valor, params = {}) => {
    if (!tieneContenido(valor)) {
        return "";
    }

    try {
        const data = await combosService.obtenerCombo({
            tipo,
            ...params
        });
        const lista = normalizarListaCombo(data);
        return buscarNombreEnLista(lista, valor, tipo) || texto(valor);
    } catch (error) {
        return texto(valor);
    }
};

const fechaPartes = (valor = "") => {
    const textoFecha = texto(valor).split(" ")[0];
    const partes = textoFecha.split("-");

    if (partes.length !== 3) {
        return {
            dd: "",
            mm: "",
            yyyy: ""
        };
    }

    return {
        yyyy: partes[0],
        mm: partes[1],
        dd: partes[2]
    };
};

const cargarLogoEntidad = async () => {
    if (logoDataUrlCache) {
        return logoDataUrlCache;
    }

    try {
        const buffer = await fs.readFile(LOGO_PATH);
        logoDataUrlCache = `data:image/png;base64,${buffer.toString("base64")}`;
    } catch (error) {
        logoDataUrlCache = "";
    }

    return logoDataUrlCache;
};

const cargarColorPrincipalEntidad = async () => {
    if (colorPrincipalEntidadCache) {
        return colorPrincipalEntidadCache;
    }

    try {
        const contenido = await fs.readFile(VARIABLES_CSS_PATH, "utf8");
        const match = contenido.match(/--primary-main:\s*([^;]+);/i);
        colorPrincipalEntidadCache = texto(match?.[1]) || DEFAULT_COLOR_ENTIDAD;
    } catch (error) {
        colorPrincipalEntidadCache = DEFAULT_COLOR_ENTIDAD;
    }

    return colorPrincipalEntidadCache;
};

const obtenerPuppeteer = () => {
    try {
        return require("puppeteer");
    } catch (error) {
        throw new Error("La dependencia puppeteer no esta instalada. Ejecute npm install puppeteer.");
    }
};

const construirResumenOtrosIngresos = (ingresosEgresos = {}) => {
    const definiciones = [
        { key: "comisiones", label: "Comisiones" },
        { key: "arriendos", label: "Arriendos" },
        { key: "honorarios", label: "Honorarios" },
        { key: "utilidadNegocio", label: "Utilidad negocio" },
        { key: "bonificaciones", label: "Bonificaciones" },
        { key: "pensiones", label: "Pensiones" },
        { key: "otrosIngresos", label: "Otros" },
        { key: "dividendos", label: "Dividendos" },
        { key: "interesInversiones", label: "Intereses inversiones" }
    ];

    const seleccionados = definiciones.filter((item) => numeroDesdeTexto(ingresosEgresos[item.key]) > 0);
    const total = seleccionados.reduce((acumulado, item) => {
        return acumulado + numeroDesdeTexto(ingresosEgresos[item.key]);
    }, 0);

    return {
        nombres: seleccionados.map((item) => item.label).join(" - "),
        total,
        totalFormateado: formatearNumero(total)
    };
};

const construirGrupoProteccion = (seleccion = [], catalogo = []) => {
    const codigos = Array.isArray(seleccion) ? seleccion : [];
    const catalogoMap = new Map(
        (Array.isArray(catalogo) ? catalogo : [])
            .map((item) => ({
                codigo: normalizarCodigo(item?.Code ?? item?.codigo),
                nombre: texto(item?.Name ?? item?.nombre)
            }))
            .filter((item) => item.codigo && item.nombre)
            .map((item) => [item.codigo, item.nombre])
    );

    const items = codigos
        .map((valor) => {
            const codigo = normalizarCodigo(valor);

            if (catalogoMap.has(codigo)) {
                return catalogoMap.get(codigo);
            }

            return texto(valor);
        })
        .filter(Boolean);

    return {
        cantidad: items.length,
        tieneSeleccion: items.length > 0,
        descripcion: items.join(" - "),
        items
    };
};

const construirAutorizacionesInforme = (catalogo = [], respuestas = {}) => {
    const autorizaciones = Array.isArray(catalogo) ? catalogo : [];
    const estado = respuestas && typeof respuestas === "object" ? respuestas : {};

    return autorizaciones
        .filter((autorizacion) => autorizacion?.activo !== false)
        .map((autorizacion) => {
            const codigo = texto(autorizacion.codigo);
            const requiereRespuesta = Boolean(autorizacion.requiereRespuesta || autorizacion.obligatorio);
            const respuestaRaw = Object.prototype.hasOwnProperty.call(estado, codigo)
                ? estado[codigo]
                : autorizacion.respuestaActual;
            const respuesta = respuestaRaw === true || respuestaRaw === "S" || respuestaRaw === "s" || respuestaRaw === "1" || respuestaRaw === 1
                ? "S"
                : "N";

            return {
                codigo,
                titulo: texto(autorizacion.nombre),
                descripcion: texto(autorizacion.descripcion),
                requiereRespuesta,
                respuesta
            };
        });
};

const construirPayloadCorreo = (modelo = {}) => {
    const saludo = modelo?.personaJuridica?.esPersonaJuridica
        ? textoMayuscula(modelo?.personaJuridica?.razonSocial)
        : textoMayuscula(modelo?.personaNatural?.nombreCompleto);

    return `
        <table align="center" width="500" cellspacing="0" cellpadding="5" border="0" bgcolor="#F6F6F6">
            <tbody align="center">
                <tr>
                    <td>&nbsp;</td>
                </tr>
                <tr>
                    <td>
                        <h1>Actualizacion de datos Web</h1>
                    </td>
                </tr>
                <tr>
                    <td>
                        Cordial saludo, ${saludo}
                        <br><br>
                        Hemos recibido la solicitud de actualizacion de datos a nuestra entidad.
                        <br><br>
                        Saludos:
                        <br>
                        <strong style="font-size:20px;">${texto(modelo?.entidad?.nombre)}</strong>
                        <br><br><br>
                    </td>
                </tr>
                <tr>
                    <td>&nbsp;</td>
                </tr>
                <tr>
                    <td style="background-color:${texto(modelo?.entidad?.color || DEFAULT_COLOR_ENTIDAD)}">
                        <br>
                        <span style="color:white;">
                            Para legalizar este tramite, agradecemos imprimir el archivo adjunto, firmarlo,
                            poner la huella en el campo establecido y finalmente remitirlo a la oficina
                            principal de la entidad.
                        </span>
                        <br><br>
                    </td>
                </tr>
            </tbody>
        </table>
    `;
};

const resolverTextosFormulario = async (formState = {}) => {
    const datosPersonales = formState?.datosPersonales || {};
    const datosLaborales = formState?.datosLaborales || {};
    const otrosDatos = formState?.otrosDatos || {};
    const otrosDatosAdicionales = formState?.otrosDatosAdicionales || {};

    const entries = await Promise.all([
        ["tipoDocumentoNombre", Promise.resolve(obtenerTextoLocal(TIPO_DOCUMENTO_MAP, datosPersonales.tipoDocumento))],
        ["paisDocumentoNombre", obtenerNombreCombo("paises", datosPersonales.paisDocumento)],
        ["departamentoDocumentoNombre", obtenerNombreCombo("departamentos", datosPersonales.departamentoDocumento, { pais: datosPersonales.paisDocumento })],
        ["ciudadDocumentoNombre", obtenerNombreCombo("ciudades", datosPersonales.ciudadDocumento, { dpto: datosPersonales.departamentoDocumento, pais: datosPersonales.paisDocumento })],
        ["paisNacimientoNombre", obtenerNombreCombo("paises", datosPersonales.paisNacimiento)],
        ["departamentoNacimientoNombre", obtenerNombreCombo("departamentos", datosPersonales.departamentoNacimiento, { pais: datosPersonales.paisNacimiento })],
        ["ciudadNacimientoNombre", obtenerNombreCombo("ciudades", datosPersonales.ciudadNacimiento, { dpto: datosPersonales.departamentoNacimiento, pais: datosPersonales.paisNacimiento })],
        ["ciiuNombre", obtenerNombreCombo("ciiu", datosPersonales.ciiu)],
        ["nacionalidadNombre", obtenerNombreCombo("nacionalidad", datosPersonales.nacionalidad)],
        ["tipoDireccionResidenciaNombre", obtenerNombreCombo("abreviaturadir", datosPersonales.tipoDireccionResidencia)],
        ["paisResidenciaNombre", obtenerNombreCombo("paises", datosPersonales.paisResidencia)],
        ["departamentoResidenciaNombre", obtenerNombreCombo("departamentos", datosPersonales.departamentoResidencia, { pais: datosPersonales.paisResidencia })],
        ["ciudadResidenciaNombre", obtenerNombreCombo("ciudades", datosPersonales.ciudadResidencia, { dpto: datosPersonales.departamentoResidencia, pais: datosPersonales.paisResidencia })],
        ["zonaResidenciaNombre", obtenerNombreCombo("zona", datosPersonales.zonaResidencia, { ciudad: datosPersonales.ciudadResidencia })],
        ["comunaResidenciaNombre", obtenerNombreCombo("comuna", datosPersonales.comunaResidencia, { zona: datosPersonales.zonaResidencia, ciudad: datosPersonales.ciudadResidencia })],
        ["barrioResidenciaNombre", obtenerNombreCombo("barrio", datosPersonales.barrioResidencia, { comuna: datosPersonales.comunaResidencia, zona: datosPersonales.zonaResidencia, ciudad: datosPersonales.ciudadResidencia })],
        ["tipoZonaResidenciaNombre", Promise.resolve(obtenerTextoLocal(TIPO_ZONA_MAP, datosPersonales.tipoZonaResidencia))],
        ["envioDocumentosNombre", Promise.resolve(obtenerTextoLocal(ENVIO_DOCUMENTOS_MAP, datosPersonales.envioDocumentos))],
        ["empresaTrabajoNombre", obtenerNombreCombo("empresatrabajo", datosLaborales.empresaTrabajo)],
        ["cargoTrabajoNombre", obtenerNombreCombo("profesiones", datosLaborales.cargoTrabajo)],
        ["dependenciaTrabajoNombre", obtenerNombreCombo("dependencia", datosLaborales.dependenciaTrabajo, { empresa: datosLaborales.empresaTrabajo })],
        ["tipoContratoNombre", obtenerNombreCombo("tipocontrato", datosLaborales.tipoContrato)],
        ["pagaduriaNombre", obtenerNombreCombo("pagaduria", datosLaborales.pagaduria)],
        ["estudiosNombre", obtenerNombreCombo("estudios", otrosDatos.estudios)],
        ["ocupacionNombre", obtenerNombreCombo("ocupacionactualizacion", otrosDatos.ocupacion)],
        ["profesionNombre", obtenerNombreCombo("profesiones", otrosDatos.profesion)],
        ["bancoCuentaNombre", obtenerNombreCombo("bancos", otrosDatos.bancoCuenta)],
        ["tipoViviendaNombre", obtenerNombreCombo("tipovivienda", otrosDatos.tipoVivienda)],
        ["tipoCuentaNombre", Promise.resolve(obtenerTextoLocal(TIPO_CUENTA_MAP, otrosDatos.tipoCuenta))],
        ["estadoCivilNombre", Promise.resolve(obtenerTextoLocal(ESTADO_CIVIL_MAP, otrosDatos.estadoCivil))],
        ["generoNombre", Promise.resolve(obtenerTextoLocal(GENERO_MAP, otrosDatos.genero))],
        ["dependeEconomicamenteNombre", Promise.resolve(obtenerTextoLocal(SI_NO_MAP, otrosDatos.dependeEconomicamente))],
        ["declaranteNombre", Promise.resolve(obtenerTextoLocal(SI_NO_MAP, otrosDatos.declarante))],
        ["operacionesMonedaExtranjeraNombre", Promise.resolve(obtenerTextoLocal(SI_NO_MAP, otrosDatos.operacionesMonedaExtranjera))],
        ["poseeCuentasMonedaExtranjeraNombre", Promise.resolve(obtenerTextoLocal(SI_NO_MAP, otrosDatos.poseeCuentasMonedaExtranjera))],
        ["paisMonedaExtranjeraNombre", obtenerNombreCombo("paisesmonedaextranjera", otrosDatos.paisMonedaExtranjera)],
        ["ciudadMonedaExtranjeraNombre", obtenerNombreCombo("ciudadesmonedaextranjera", otrosDatos.ciudadMonedaExtranjera, { pais: otrosDatos.paisMonedaExtranjera })],
        ["esPepNombre", Promise.resolve(obtenerTextoLocal(SI_NO_MAP, otrosDatos.esPep))],
        ["tipoPepNombre", obtenerNombreCombo("tipopep", otrosDatos.tipoPep)],
        ["familiarEmpleadoEntidadNombre", Promise.resolve(obtenerTextoLocal(SI_NO_MAP, otrosDatos.familiarEmpleadoEntidad))],
        ["familiarRecursosPublicosNombre", Promise.resolve(obtenerTextoLocal(SI_NO_MAP, otrosDatos.familiarRecursosPublicos))],
        ["familiarPublicamenteExpuestoNombre", Promise.resolve(obtenerTextoLocal(SI_NO_MAP, otrosDatos.familiarPublicamenteExpuesto))],
        ["administraRecursosPublicosNombre", Promise.resolve(obtenerTextoLocal(SI_NO_MAP, otrosDatos.administraRecursosPublicos))],
        ["cargoAdministraRecursosPublicosNombre", obtenerNombreCombo("profesiones", otrosDatos.cargoAdministraRecursosPublicos)],
        ["profesionApoderadoNombre", obtenerNombreCombo("profesiones", otrosDatosAdicionales.profesionApoderado)],
        ["profesionRepresentanteLegalNombre", obtenerNombreCombo("profesiones", otrosDatosAdicionales.profesionRepresentanteLegal)],
        ["paisRepresentanteLegalNombre", obtenerNombreCombo("paises", otrosDatosAdicionales.paisRepresentanteLegal)],
        ["departamentoRepresentanteLegalNombre", obtenerNombreCombo("departamentos", otrosDatosAdicionales.departamentoRepresentanteLegal, { pais: otrosDatosAdicionales.paisRepresentanteLegal })],
        ["ciudadRepresentanteLegalNombre", obtenerNombreCombo("ciudades", otrosDatosAdicionales.ciudadRepresentanteLegal, { dpto: otrosDatosAdicionales.departamentoRepresentanteLegal, pais: otrosDatosAdicionales.paisRepresentanteLegal })],
        ["tipoEmpresaRepresentanteLegalNombre", Promise.resolve(obtenerTextoLocal(TIPO_EMPRESA_MAP, otrosDatosAdicionales.tipoEmpresaRepresentanteLegal))],
        ["tieneRetencionPersonaJuridicaNombre", Promise.resolve(obtenerTextoLocal(SI_NO_MAP, otrosDatosAdicionales.tieneRetencionPersonaJuridica))]
    ].map(async ([key, value]) => [key, await value]));

    return Object.fromEntries(entries);
};

exports.obtenerInformeEntidad = async (token) => {
    try {
        const data = await consumirEndpoint(API_URL_INFORME_ENTIDAD, {}, token);
        return normalizarEntidad(data);
    } catch (error) {
        console.error("Error obteniendo la informacion de InformeEntidad:", error);
        throw error;
    }
};

exports.obtenerInformeAgencia = async (codigo = 1, token) => {
    const codigoAgencia = Number(codigo) || 1;

    try {
        const data = await consumirEndpoint(API_URL_INFORME_AGENCIA, { codigo: codigoAgencia }, token);
        return normalizarAgencia(data, codigoAgencia);
    } catch (error) {
        console.error("Error obteniendo la informacion de InformeAgencia:", error);
        throw error;
    }
};

exports.construirModeloInforme = async ({
    formState = {},
    references = [],
    peopleInCharge = [],
    familiarPeps = [],
    metadata = {},
    token
}) => {
    const datosPersonales = formState?.datosPersonales || {};
    const datosLaborales = formState?.datosLaborales || {};
    const otrosDatos = formState?.otrosDatos || {};
    const ingresosEgresos = formState?.ingresosEgresos || {};
    const otrosDatosAdicionales = formState?.otrosDatosAdicionales || {};
    const esPersonaJuridica = normalizarCodigo(datosPersonales.tipoDocumento) === "N";

    const [
        entidad,
        agencia,
        textosFormulario,
        grupoProteccionCatalogo,
        logoDataUrl,
        colorPrincipalEntidad
    ] = await Promise.all([
        exports.obtenerInformeEntidad(token),
        exports.obtenerInformeAgencia(metadata.codigoAgencia || 1, token),
        resolverTextosFormulario(formState),
        actualizaciondatosService.obtenerEsquemaGrupoProteccion(),
        cargarLogoEntidad(),
        cargarColorPrincipalEntidad()
    ]);

    const grupoProteccion = construirGrupoProteccion(otrosDatos.grupoProteccion, grupoProteccionCatalogo);
    const resumenOtrosIngresos = construirResumenOtrosIngresos(ingresosEgresos);
    const autorizaciones = construirAutorizacionesInforme(metadata.autorizacionesCatalogo, formState.autorizaciones);
    const nombreCompleto = unirPartes(
        datosPersonales.primerNombre,
        datosPersonales.segundoNombre,
        datosPersonales.primerApellido,
        datosPersonales.segundoApellido
    );
    const razonSocial = esPersonaJuridica
        ? textoMayuscula(nombreCompleto)
        : "";
    const direccionResidencia = unirPartes(
        textosFormulario.tipoDireccionResidenciaNombre || datosPersonales.tipoDireccionResidencia,
        datosPersonales.complementoDireccionResidencia
    );
    const fechaSistema = texto(metadata.fechaSistema) || new Date().toISOString().slice(0, 19).replace("T", " ");

    return {
        entidad: {
            ...entidad,
            color: colorPrincipalEntidad || texto(metadata.colorEntidad) || DEFAULT_COLOR_ENTIDAD,
            logoDataUrl
        },
        agencia,
        fechaDiligenciamiento: fechaSistema,
        fechaDiligenciamientoPartes: fechaPartes(fechaSistema),
        personaNatural: {
            activa: !esPersonaJuridica,
            nombres: textoMayuscula(unirPartes(datosPersonales.primerNombre, datosPersonales.segundoNombre)),
            apellidos: textoMayuscula(unirPartes(datosPersonales.primerApellido, datosPersonales.segundoApellido)),
            identificacion: texto(datosPersonales.numeroDocumento),
            tipoDocumento: texto(textosFormulario.tipoDocumentoNombre),
            nacionalidad: texto(textosFormulario.nacionalidadNombre),
            paisResidencia: texto(textosFormulario.paisResidenciaNombre),
            fechaNacimiento: texto(datosPersonales.fechaNacimiento),
            fechaExpedicion: texto(datosPersonales.fechaExpedicionDocumento),
            nivelEducativo: texto(textosFormulario.estudiosNombre),
            grupoProteccion,
            correo: texto(datosPersonales.email),
            direccion: textoMayuscula(direccionResidencia),
            departamento: texto(textosFormulario.departamentoResidenciaNombre),
            municipio: texto(textosFormulario.ciudadResidenciaNombre),
            zona: textoMayuscula(textosFormulario.tipoZonaResidenciaNombre),
            celular: texto(datosPersonales.celular),
            empresaTrabajo: texto(textosFormulario.empresaTrabajoNombre),
            ocupacion: texto(textosFormulario.ocupacionNombre),
            actividadEconomica: texto(textosFormulario.ciiuNombre),
            ciiu: texto(datosPersonales.ciiu),
            canalesComunicacion: texto(textosFormulario.envioDocumentosNombre),
            nombreApoderado: ["T", "R"].includes(normalizarCodigo(datosPersonales.tipoDocumento))
                ? textoMayuscula(otrosDatosAdicionales.nombreApoderado)
                : "",
            cedulaApoderado: ["T", "R"].includes(normalizarCodigo(datosPersonales.tipoDocumento))
                ? texto(otrosDatosAdicionales.cedulaApoderado)
                : "",
            administraRecursosPublicos: texto(textosFormulario.administraRecursosPublicosNombre),
            esPep: texto(textosFormulario.esPepNombre),
            nombreCompleto: textoMayuscula(nombreCompleto)
        },
        ingresosPersonaNatural: {
            fuentePrincipal: "LABORAL",
            otrosIngresos: resumenOtrosIngresos.nombres,
            totalOtrosIngresos: resumenOtrosIngresos.totalFormateado
        },
        personaJuridica: {
            esPersonaJuridica,
            razonSocial,
            nit: esPersonaJuridica ? texto(datosPersonales.numeroDocumento) : "",
            paisConstitucion: esPersonaJuridica ? texto(textosFormulario.paisDocumentoNombre) : "",
            direccion: esPersonaJuridica ? textoMayuscula(direccionResidencia) : "",
            correo: esPersonaJuridica ? textoMayuscula(datosPersonales.email) : "",
            departamento: esPersonaJuridica ? texto(textosFormulario.departamentoResidenciaNombre) : "",
            municipio: esPersonaJuridica ? texto(textosFormulario.ciudadResidenciaNombre) : "",
            actividadEconomica: esPersonaJuridica ? texto(textosFormulario.ciiuNombre) : "",
            ciiu: esPersonaJuridica ? texto(datosPersonales.ciiu) : "",
            telefonos: esPersonaJuridica ? unirPartes(otrosDatosAdicionales.movilRepresentanteLegal, texto(otrosDatosAdicionales.telefonoRepresentanteLegal) ? `- ${texto(otrosDatosAdicionales.telefonoRepresentanteLegal)}` : "") : "",
            realizaOperacionesMonedaExtranjera: texto(textosFormulario.operacionesMonedaExtranjeraNombre),
            cualesOperaciones: textoMayuscula(otrosDatos.cualesOperacionesMonedaExtranjera),
            nombreRepresentanteLegal: textoMayuscula(otrosDatosAdicionales.nombreRepresentanteLegal),
            cedulaRepresentanteLegal: texto(otrosDatosAdicionales.cedulaRepresentanteLegal),
            tipoIdentificacionRepresentanteLegal: esPersonaJuridica && tieneContenido(otrosDatosAdicionales.cedulaRepresentanteLegal)
                ? "CEDULA DE CIUDADANIA"
                : "",
            tipoEmpresa: texto(textosFormulario.tipoEmpresaRepresentanteLegalNombre)
        },
        informacionFinanciera: {
            ingresosActividadPrincipal: formatearNumero(ingresosEgresos.sueldo || datosLaborales.salario),
            otrosIngresosDetalle: resumenOtrosIngresos.totalFormateado,
            totalActivos: formatearNumero(otrosDatosAdicionales.totalActivosRepresentanteLegal || ingresosEgresos.totalActivos),
            totalPasivos: formatearNumero(otrosDatosAdicionales.totalPasivosRepresentanteLegal || ingresosEgresos.totalPasivos),
            totalPatrimonio: formatearNumero(otrosDatosAdicionales.totalPatrimonioRepresentanteLegal || ingresosEgresos.totalPatrimonio)
        },
        datosBasicos: {
            identificacion: texto(datosPersonales.numeroDocumento),
            tipoDocumentoCodigo: texto(datosPersonales.tipoDocumento),
            tipoDocumentoNombre: texto(textosFormulario.tipoDocumentoNombre),
            primerNombre: texto(datosPersonales.primerNombre),
            segundoNombre: texto(datosPersonales.segundoNombre),
            primerApellido: texto(datosPersonales.primerApellido),
            segundoApellido: texto(datosPersonales.segundoApellido),
            nombreCompleto: textoMayuscula(nombreCompleto),
            fechaExpedicion: texto(datosPersonales.fechaExpedicionDocumento),
            fechaNacimiento: texto(datosPersonales.fechaNacimiento),
            paisDocumento: texto(textosFormulario.paisDocumentoNombre),
            departamentoDocumento: texto(textosFormulario.departamentoDocumentoNombre),
            ciudadDocumento: texto(textosFormulario.ciudadDocumentoNombre),
            paisNacimiento: texto(textosFormulario.paisNacimientoNombre),
            departamentoNacimiento: texto(textosFormulario.departamentoNacimientoNombre),
            ciudadNacimiento: texto(textosFormulario.ciudadNacimientoNombre),
            correo: texto(datosPersonales.email),
            telefono: texto(datosPersonales.telefono),
            celular: texto(datosPersonales.celular),
            direccionResidencia: texto(direccionResidencia),
            barrioResidencia: texto(textosFormulario.barrioResidenciaNombre),
            comunaResidencia: texto(textosFormulario.comunaResidenciaNombre),
            ciudadResidencia: texto(textosFormulario.ciudadResidenciaNombre),
            departamentoResidencia: texto(textosFormulario.departamentoResidenciaNombre),
            nacionalidad: texto(textosFormulario.nacionalidadNombre),
            ciiu: texto(datosPersonales.ciiu),
            ciiuNombre: texto(textosFormulario.ciiuNombre)
        },
        datosLaborales: {
            empresaTrabajo: texto(textosFormulario.empresaTrabajoNombre),
            cargoTrabajo: texto(textosFormulario.cargoTrabajoNombre),
            dependenciaTrabajo: texto(textosFormulario.dependenciaTrabajoNombre),
            tipoContrato: texto(textosFormulario.tipoContratoNombre),
            fechaIngreso: texto(datosLaborales.fechaIngreso),
            pagaduria: texto(textosFormulario.pagaduriaNombre),
            periodoDeduccion: texto(datosLaborales.periodoDeduccion),
            salario: formatearNumero(datosLaborales.salario)
        },
        otrosDatos: {
            estudios: texto(textosFormulario.estudiosNombre),
            genero: texto(textosFormulario.generoNombre),
            estadoCivil: texto(textosFormulario.estadoCivilNombre),
            ocupacion: texto(textosFormulario.ocupacionNombre),
            profesion: texto(textosFormulario.profesionNombre),
            numeroCuenta: texto(otrosDatos.numeroCuenta),
            tipoCuenta: texto(textosFormulario.tipoCuentaNombre),
            bancoCuenta: texto(textosFormulario.bancoCuentaNombre),
            tipoVivienda: texto(textosFormulario.tipoViviendaNombre),
            numeroPersonasHabitantes: texto(otrosDatos.numeroPersonasHabitantes),
            dependeEconomicamente: texto(textosFormulario.dependeEconomicamenteNombre),
            declarante: texto(textosFormulario.declaranteNombre),
            grupoProteccion,
            operacionesMonedaExtranjera: texto(textosFormulario.operacionesMonedaExtranjeraNombre),
            cualesOperacionesMonedaExtranjera: texto(otrosDatos.cualesOperacionesMonedaExtranjera),
            poseeCuentasMonedaExtranjera: texto(textosFormulario.poseeCuentasMonedaExtranjeraNombre),
            paisMonedaExtranjera: texto(textosFormulario.paisMonedaExtranjeraNombre),
            ciudadMonedaExtranjera: texto(textosFormulario.ciudadMonedaExtranjeraNombre),
            monedaExtranjera: texto(otrosDatos.monedaExtranjera),
            bancoMonedaExtranjera: texto(otrosDatos.bancoMonedaExtranjera),
            numeroCuentaMonedaExtranjera: texto(otrosDatos.numeroCuentaMonedaExtranjera),
            esPep: texto(textosFormulario.esPepNombre),
            tipoPep: texto(textosFormulario.tipoPepNombre),
            administraRecursosPublicos: texto(textosFormulario.administraRecursosPublicosNombre),
            nombreEntidadAdministraRecursosPublicos: texto(otrosDatos.nombreEntidadAdministraRecursosPublicos),
            cargoAdministraRecursosPublicos: texto(textosFormulario.cargoAdministraRecursosPublicosNombre),
            fechaViculacionRecursosPublicos: texto(otrosDatos.fechaViculacionRecursosPublicos),
            fechaRetiroRecursosPublicos: texto(otrosDatos.fechaRetiroRecursosPublicos)
        },
        ingresosEgresos: {
            honorarios: formatearNumero(ingresosEgresos.honorarios),
            arriendos: formatearNumero(ingresosEgresos.arriendos),
            comisiones: formatearNumero(ingresosEgresos.comisiones),
            utilidadNegocio: formatearNumero(ingresosEgresos.utilidadNegocio),
            bonificaciones: formatearNumero(ingresosEgresos.bonificaciones),
            sueldo: formatearNumero(ingresosEgresos.sueldo),
            interesInversiones: formatearNumero(ingresosEgresos.interesInversiones),
            pensiones: formatearNumero(ingresosEgresos.pensiones),
            dividendos: formatearNumero(ingresosEgresos.dividendos),
            conceptoOtrosIngresos: texto(ingresosEgresos.conceptoOtrosIngresos),
            otrosIngresos: formatearNumero(ingresosEgresos.otrosIngresos),
            totalIngresos: formatearNumero(ingresosEgresos.totalIngresos),
            alimentacion: formatearNumero(ingresosEgresos.alimentacion),
            educacion: formatearNumero(ingresosEgresos.educacion),
            serviciosPublicos: formatearNumero(ingresosEgresos.serviciosPublicos),
            arriendo: formatearNumero(ingresosEgresos.arriendo),
            transporte: formatearNumero(ingresosEgresos.transporte),
            cuotaDomestica: formatearNumero(ingresosEgresos.cuotaDomestica),
            salud: formatearNumero(ingresosEgresos.salud),
            otrosGastos: formatearNumero(ingresosEgresos.otrosGastos),
            otrasDeudas: formatearNumero(ingresosEgresos.otrasDeudas),
            prestamoVivienda: formatearNumero(ingresosEgresos.prestamoVivienda),
            otrosNegocios: formatearNumero(ingresosEgresos.otrosNegocios),
            prestamoVehiculo: formatearNumero(ingresosEgresos.prestamoVehiculo),
            tajetaCredito: formatearNumero(ingresosEgresos.tajetaCredito),
            otrosPrestamos: formatearNumero(ingresosEgresos.otrosPrestamos),
            totalEgresos: formatearNumero(ingresosEgresos.totalEgresos),
            totalActivos: formatearNumero(ingresosEgresos.totalActivos),
            totalPasivos: formatearNumero(ingresosEgresos.totalPasivos),
            totalPatrimonio: formatearNumero(ingresosEgresos.totalPatrimonio)
        },
        otrosDatosAdicionales: {
            cedulaApoderado: texto(otrosDatosAdicionales.cedulaApoderado),
            nombreApoderado: textoMayuscula(otrosDatosAdicionales.nombreApoderado),
            profesionApoderado: texto(textosFormulario.profesionApoderadoNombre),
            direccionApoderado: texto(otrosDatosAdicionales.direccionApoderado),
            telefonoApoderado: texto(otrosDatosAdicionales.telefonoApoderado),
            movilApoderado: texto(otrosDatosAdicionales.movilApoderado),
            tipoPersonaJuridica: texto(otrosDatosAdicionales.tipoPersonaJuridica),
            tieneRetencionPersonaJuridica: texto(textosFormulario.tieneRetencionPersonaJuridicaNombre),
            fechaNombramientoRepresentanteLegal: texto(otrosDatosAdicionales.fechaNombramientoRepresentanteLegal),
            numeroActaNombramientoRepresentanteLegal: texto(otrosDatosAdicionales.numeroActaNombramientoRepresentanteLegal),
            numeroCamaraComercio: texto(otrosDatosAdicionales.numeroCamaraComercio),
            tipoEmpresaRepresentanteLegal: texto(textosFormulario.tipoEmpresaRepresentanteLegalNombre),
            detalleEmpresaRepresentanteLegal: texto(otrosDatosAdicionales.detalleEmpresaRepresentanteLegal),
            totalActivosRepresentanteLegal: formatearNumero(otrosDatosAdicionales.totalActivosRepresentanteLegal),
            totalPasivosRepresentanteLegal: formatearNumero(otrosDatosAdicionales.totalPasivosRepresentanteLegal),
            totalPatrimonioRepresentanteLegal: formatearNumero(otrosDatosAdicionales.totalPatrimonioRepresentanteLegal),
            cedulaRepresentanteLegal: texto(otrosDatosAdicionales.cedulaRepresentanteLegal),
            nombreRepresentanteLegal: textoMayuscula(otrosDatosAdicionales.nombreRepresentanteLegal),
            profesionRepresentanteLegal: texto(textosFormulario.profesionRepresentanteLegalNombre),
            direccionRepresentanteLegal: texto(otrosDatosAdicionales.direccionRepresentanteLegal),
            paisRepresentanteLegal: texto(textosFormulario.paisRepresentanteLegalNombre),
            departamentoRepresentanteLegal: texto(textosFormulario.departamentoRepresentanteLegalNombre),
            ciudadRepresentanteLegal: texto(textosFormulario.ciudadRepresentanteLegalNombre),
            telefonoRepresentanteLegal: texto(otrosDatosAdicionales.telefonoRepresentanteLegal),
            movilRepresentanteLegal: texto(otrosDatosAdicionales.movilRepresentanteLegal),
            indicativoRepresentanteLegal: texto(otrosDatosAdicionales.indicativoRepresentanteLegal)
        },
        autorizaciones,
        referencias: Array.isArray(references) ? references : [],
        personasCargo: Array.isArray(peopleInCharge) ? peopleInCharge : [],
        familiaresPeps: Array.isArray(familiarPeps) ? familiarPeps : [],
        notificacion: {
            to: texto(datosPersonales.email),
            subject: `${texto(entidad.nombre)} - Actualizacion Web`
        }
    };
};

exports.renderizarHtmlSolidario = async (modeloInforme = {}) => {
    return ejs.renderFile(PDF_TEMPLATE_PATH, {
        model: modeloInforme
    });
};

exports.generarPdfSolidario = async (modeloInforme = {}, htmlSolidario = "") => {
    const puppeteer = obtenerPuppeteer();
    const browser = await puppeteer.launch({ headless: true });

    try {
        const html = htmlSolidario || await exports.renderizarHtmlSolidario(modeloInforme);
        const page = await browser.newPage();

        await page.setContent(html, {
            waitUntil: "networkidle0"
        });

        const rawPdf = await page.pdf({
            format: "A3",
            printBackground: true,
            margin: {
                top: "10mm",
                right: "20mm",
                bottom: "10mm",
                left: "10mm"
            }
        });

        return {
            buffer: Buffer.isBuffer(rawPdf) ? rawPdf : Buffer.from(rawPdf),
            fileName: `ActualizacionWeb${texto(modeloInforme?.datosBasicos?.identificacion)}.pdf`,
            mimeType: PDF_MIME_TYPE,
            html
        };
    } finally {
        await browser.close();
    }
};

exports.construirPayloadNotificacion = ({ modeloInforme = {}, pdf = {} } = {}) => {
    const html = construirPayloadCorreo(modeloInforme);
    const buffer = Buffer.isBuffer(pdf.buffer) ? pdf.buffer : Buffer.from([]);

    return {
        to: texto(modeloInforme?.notificacion?.to),
        subject: texto(modeloInforme?.notificacion?.subject),
        html,
        channel: 0,
        attachments: [
            {
                document: buffer.toString("base64"),
                attachmentName: texto(pdf.fileName),
                mediaType: texto(pdf.mimeType || PDF_MIME_TYPE)
            }
        ]
    };
};
