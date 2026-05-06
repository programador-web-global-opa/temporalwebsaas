const config = require("../config/config");
const { manejarError } = require("../helpers/controllerUtils");
const actualizaciondatosService = require("../services/actualizaciondatosService");
const actualizaciondatosGuardarHelper = require("../services/actualizaciondatosGuardarHelper");
const actualizaciondatosInformeService = require("../services/actualizaciondatosInformeService");
const notificationService = require("../services/notificationService");
const fs = require("fs/promises");
const path = require("path");

const cedulaEjemplo = config.cedulaPruebas;
const ADJUNTOS_DIR = config.actualizacionDatosAdjuntosDir;

// FUNCION PARA LIMPIAR ESPACIOS Y EXTRAER DEL ARREGLO SI APLICA
const parseVal = (val) => {
    if (Array.isArray(val)) return val[0] !== undefined ? String(val[0]).trim() : "";
    if (val === null || val === undefined) return "";
    return String(val).trim();
};


// FUNCION PARA PARSEAR FECHAS (OMITIENDO LA FECHA POR DEFECTO DE LA BASE DE DATOS "1900-01-01")
const parseDate = (dateStr) => {
    if (!dateStr || String(dateStr).startsWith("1900-01-01")) return "";
    return String(dateStr).split("T")[0];
};

const parseGrupoProteccion = (valor) => {
    if (Array.isArray(valor)) {
        return valor.map(parseVal).filter(Boolean);
    }

    const texto = parseVal(valor);

    if (!texto || texto === "[]") {
        return [];
    }

    try {
        const parsed = JSON.parse(texto);

        if (Array.isArray(parsed)) {
            return parsed.map(parseVal).filter(Boolean);
        }
    } catch (error) {
        return [texto];
    }

    return [texto];
};

// FUNCION PARA SEPARAR LA DIRECCION
const parseDir = (direccion) => {
    const str = parseVal(direccion);
    if (!str) return { tipo: "", complemento: "" };
    const index = str.indexOf(" ");
    if (index === -1) return { tipo: str, complemento: "" };
    return {
        tipo: str.substring(0, index).trim(),
        complemento: str.substring(index).trim()
    };
};

const parseJsonField = (valor, fallback, nombreCampo) => {
    try {
        if (!valor) {
            return fallback;
        }

        return JSON.parse(valor);
    } catch (error) {
        throw new Error(`El campo ${nombreCampo} no tiene un JSON valido`);
    }
};

const detectarNavegador = (userAgent = "") => {
    const agente = String(userAgent || "");

    if (agente.includes("Edg")) return "Microsoft Edge";
    if (agente.includes("OPR") || agente.includes("Opera")) return "Opera";
    if (agente.includes("Firefox")) return "Mozilla Firefox";
    if (agente.includes("Chrome")) return "Google Chrome";
    if (agente.includes("Safari")) return "Safari";
    if (agente.includes("MSIE") || agente.includes("Trident")) return "Internet Explorer";

    return agente || "No identificado";
};

const obtenerIpCliente = (req) => {
    const forwarded = req.headers["x-forwarded-for"];

    if (Array.isArray(forwarded) && forwarded.length > 0) {
        return String(forwarded[0]).trim();
    }

    if (typeof forwarded === "string" && forwarded.trim()) {
        return forwarded.split(",")[0].trim();
    }

    return req.ip || req.socket?.remoteAddress || "";
};

const formatearFechaSistema = () => {
    const ahora = new Date();
    const pad = (valor) => String(valor).padStart(2, "0");

    return [
        ahora.getFullYear(),
        pad(ahora.getMonth() + 1),
        pad(ahora.getDate())
    ].join("-") + " " + [
        pad(ahora.getHours()),
        pad(ahora.getMinutes()),
        pad(ahora.getSeconds())
    ].join(":");
};

const normalizarConfirmacionActualizacion = (confirmacion) => {
    if (!confirmacion) {
        return null;
    }

    if (typeof confirmacion === "object") {
        return {
            bandera: Number(confirmacion.bandera ?? 1) || 1,
            mensaje: parseVal(confirmacion.mensaje)
        };
    }

    const texto = parseVal(confirmacion);

    if (!texto) {
        return null;
    }

    const [bandera, ...mensajePartes] = texto.split("|");

    return {
        bandera: Number(bandera) || 1,
        mensaje: mensajePartes.join("|").trim() || texto
    };
};

const resolverEstadoIngresoActualizacion = async (req, { consumirConfirmacion = true } = {}) => {
    const confirmacion = normalizarConfirmacionActualizacion(req.session?.confir_actu);

    if (confirmacion?.mensaje) {
        if (consumirConfirmacion) {
            delete req.session.confir_actu;
        }

        return {
            puedeIngresar: false,
            tipoMensaje: confirmacion.bandera === 2 ? "alerta" : "exito",
            mensaje: confirmacion.mensaje
        };
    }

    const cedula = req.session?.user?.id;
    const token = req.session?.user?.tokenWeb;

    if (!cedula || !token) {
        return {
            puedeIngresar: false,
            tipoMensaje: "alerta",
            mensaje: "No fue posible validar el acceso al modulo de actualizacion de datos."
        };
    }

    const tienePendiente = await actualizaciondatosService.obtenerActualizacionPendiente(cedula, token);

    if (tienePendiente) {
        return {
            puedeIngresar: false,
            tipoMensaje: "alerta",
            mensaje: "Al momento se encuentra en tramite una actualizacion de datos para su validez, para actualizar los datos debera esperar que terminemos de validar los datos anteriormente digitados."
        };
    }

    return {
        puedeIngresar: true,
        tipoMensaje: null,
        mensaje: ""
    };
};

const combinarRegistros = (registrosActuales = [], registrosEditados = []) => {
    const actuales = Array.isArray(registrosActuales) ? registrosActuales : [];
    const editados = Array.isArray(registrosEditados) ? registrosEditados : [];
    const idsActuales = new Set(actuales.map(item => String(item?.id ?? "")));
    const actualizadosPorId = new Map(
        editados
            .filter(item => item && item.originalId !== null && item.originalId !== undefined && String(item.originalId).trim() !== "")
            .map(item => [String(item.originalId), item])
    );

    const resultado = actuales.map(item => {
        const reemplazo = actualizadosPorId.get(String(item?.id ?? ""));
        return reemplazo || item;
    });

    const edicionesSinBase = editados.filter(item =>
        item &&
        item.originalId !== null &&
        item.originalId !== undefined &&
        String(item.originalId).trim() !== "" &&
        !idsActuales.has(String(item.originalId))
    );

    const nuevos = editados.filter(item =>
        item &&
        (item.originalId === null || item.originalId === undefined || String(item.originalId).trim() === "")
    );

    return [...resultado, ...edicionesSinBase, ...nuevos];
};

exports.renderActualizacionDatos = async (req, res) => {
    try {
        const estadoIngreso = await resolverEstadoIngresoActualizacion(req);

        return res.render("actualizaciondatos/index", {
            title: "Actualización de Datos",
            session: req.session,
            puedeIngresar: estadoIngreso.puedeIngresar,
            tipoMensajeAcceso: estadoIngreso.tipoMensaje,
            mensajeAcceso: estadoIngreso.mensaje
        });
    } catch (error) {
        console.error("Error en renderActualizacionDatos:", error);

        return res.render("actualizaciondatos/index", {
            title: "Actualización de Datos",
            session: req.session,
            puedeIngresar: false,
            tipoMensajeAcceso: "alerta",
            mensajeAcceso: "No fue posible cargar el modulo de actualizacion de datos."
        });
    }
};

exports.renderTabActualizacion = async (req, res) => {
    try {
        const estadoIngreso = await resolverEstadoIngresoActualizacion(req, {
            consumirConfirmacion: false
        });

        if (!estadoIngreso.puedeIngresar) {
            return res.status(403).send("Acceso no disponible");
        }

        const { tab } = req.params;

        return res.render(`actualizaciondatos/partials/${tab}`, {
            title: "Actualizacion de Datos",
            session: req.session,
            layout: false
        });
    } catch (error) {
        console.error("Error en renderTabActualizacion:", error);
        return res.status(500).send("No fue posible cargar la pestaña");
    }
};

const resolverResultadoGuardado = (resultado) => {
    if (Array.isArray(resultado)) {
        return {
            ok: resultado.length === 0,
            mensaje: resultado[0]?.msj || resultado[0]?.message || ""
        };
    }

    if (resultado && typeof resultado === "object") {
        if (resultado.estado === true) {
            return {
                ok: true,
                mensaje: resultado.msj || resultado.message || ""
            };
        }

        if (resultado.estado === false) {
            return {
                ok: false,
                mensaje: resultado.msj || resultado.message || ""
            };
        }

        if (Object.keys(resultado).length === 0) {
            return {
                ok: true,
                mensaje: ""
            };
        }
    }

    return {
        ok: false,
        mensaje: "No fue posible interpretar la respuesta del servicio de guardado"
    };
};

const formatearTimestampAdjunto = () => {
    const ahora = new Date();
    const pad = (valor) => String(valor).padStart(2, "0");

    return [
        ahora.getFullYear(),
        pad(ahora.getMonth() + 1),
        pad(ahora.getDate())
    ].join("") + "_" + [
        pad(ahora.getHours()),
        pad(ahora.getMinutes()),
        pad(ahora.getSeconds())
    ].join("");
};

const obtenerExtensionAdjunto = (archivo = {}) => {
    const extension = String(path.extname(archivo.originalname || "") || "")
        .toLowerCase()
        .trim();

    return extension || ".pdf";
};

const asegurarNombreUnico = async (directorio, nombreBase, extension) => {
    let nombre = `${nombreBase}${extension}`;
    let ruta = path.join(directorio, nombre);
    let consecutivo = 1;

    while (true) {
        try {
            await fs.access(ruta);
            nombre = `${nombreBase}_${consecutivo}${extension}`;
            ruta = path.join(directorio, nombre);
            consecutivo += 1;
        } catch (error) {
            return { nombre, ruta };
        }
    }
};

const guardarAdjuntosEnDisco = async ({
    archivos = [],
    adjuntosMeta = [],
    cedula = ""
}) => {
    if (!Array.isArray(archivos) || archivos.length === 0) {
        return [];
    }

    await fs.mkdir(ADJUNTOS_DIR, { recursive: true });

    const guardados = [];

    try {
        for (let index = 0; index < archivos.length; index += 1) {
            const archivo = archivos[index];
            const meta = adjuntosMeta[index] || {};
            const codigoAdjunto = parseVal(meta.codigo);
            const nombreAdjunto = parseVal(meta.nombreAdjunto);
            const extension = obtenerExtensionAdjunto(archivo);
            const nombreBase = `${codigoAdjunto}_${cedula}_${formatearTimestampAdjunto()}`;
            const { nombre, ruta } = await asegurarNombreUnico(ADJUNTOS_DIR, nombreBase, extension);

            await fs.writeFile(ruta, archivo.buffer);

            guardados.push({
                cedula,
                nombre,
                idCodigoAdjunto: codigoAdjunto,
                NombreCodAdjunto: nombreAdjunto,
                ruta
            });
        }

        return guardados;
    } catch (error) {
        await Promise.all(
            guardados.map(item => fs.unlink(item.ruta).catch(() => null))
        );
        throw new Error(`No fue posible guardar los adjuntos: ${error.message}`);
    }
};

// MAPEAR LA INFORMACION QUE DEVUELVE LA API CON LA ESTRUCTURA DEL FORMULARIO
const mapearInformacionAsociado = (jsonInfoAsociado) => {
    if (!jsonInfoAsociado || !jsonInfoAsociado[0] || !jsonInfoAsociado[0][0]) {
        return {};
    }

    const data = jsonInfoAsociado[0][0];
    return {
        datosPersonales: {
            tipoDocumento: parseVal(data.tipoidentificacion),
            numeroDocumento: parseVal(data.cedulasociado),
            fechaExpedicionDocumento: parseDate(data.fechaexpcedula),
            paisDocumento: parseVal(data.codpaiscedula),
            departamentoDocumento: parseVal(data.dptocedula),
            ciudadDocumento: parseVal(data.codciudadcedula),
            primerNombre: parseVal(data.nombres),
            segundoNombre: parseVal(data.segundonombre),
            primerApellido: parseVal(data.primerapellido),
            segundoApellido: parseVal(data.segundoapellido),
            fechaNacimiento: parseDate(data.fechanacimiento),
            paisNacimiento: parseVal(data.paisnace),
            departamentoNacimiento: parseVal(data.dptonace),
            ciudadNacimiento: parseVal(data.ciudadnace),
            nroHijos: parseVal(data.nrohijos),
            envioDocumentos: parseVal(data.enviocorrespondencia).toUpperCase(),
            ciiu: parseVal(data.codciiu),
            nacionalidad: parseVal(data.IdNacionalidad),
            tipoDireccionResidencia: parseDir(data.direccion).tipo,
            complementoDireccionResidencia: parseDir(data.direccion).complemento,
            paisResidencia: parseVal(data.codpais),
            departamentoResidencia: parseVal(data.coddepartamento),
            ciudadResidencia: parseVal(data.codciudad),
            tipoZonaResidencia: parseVal(data.tipozona),
            zonaResidencia: parseVal(data.codzona),
            comunaResidencia: parseVal(data.codcomuna),
            barrioResidencia: parseVal(data.codbarrio),
            estratoResidencia: parseVal(data.estrato),
            email: parseVal(data.email),
            celular: parseVal(data.celular),
            telefono: parseVal(data.telefono1)
        },
        datosLaborales: {
            empresaTrabajo: parseVal(data.codempresalabora),
            cargoTrabajo: parseVal(data.cargo),
            dependenciaTrabajo: parseVal(data.coddependencia),
            tipoContrato: parseVal(data.tipocontrato),
            fechaIngreso: parseDate(data.fechaingresoLabora),
            pagaduria: parseVal(data.codempresa),
            periodoDeduccion: parseVal(data.periododeduce),
            salario: parseVal(data.salario)
        },
        otrosDatos: {
            estudios: parseVal(data.estudios),
            genero: parseVal(data.sexo),
            estadoCivil: parseVal(data.estadocivil),
            ocupacion: parseVal(data.ocupacion),
            profesion: parseVal(data.codprofesion),
            numeroCuenta: parseVal(data.numerocuenta),
            tipoCuenta: parseVal(data.tipocuenta),
            bancoCuenta: parseVal(data.codbanco),
            tipoVivienda: parseVal(data.idtipovivienda),
            numeroPersonasHabitantes: parseVal(data.nropersonas),
            dependeEconomicamente: parseVal(data.dependeeconomicatercero),
            declarante: parseVal(data.declarante),
            grupoProteccion: parseGrupoProteccion(data.grupoProteccion),
            operacionesMonedaExtranjera: parseVal(data.operacionesmonedaextranjera),
            cualesOperacionesMonedaExtranjera: parseVal(data.CualesOperaciones),
            poseeCuentasMonedaExtranjera: parseVal(data.cuentasmonedaextranjera),
            paisMonedaExtranjera: parseVal(data.idpais),
            ciudadMonedaExtranjera: parseVal(data.IdCiudad),
            monedaExtranjera: parseVal(data.tipoopermonedaextranjera),
            bancoMonedaExtranjera: parseVal(data.banco),
            numeroCuentaMonedaExtranjera: parseVal(data.nrocuenta),
            esPep: parseVal(data.PersonaExpuesta) === "1" ? "S" : (parseVal(data.PersonaExpuesta) === "0" ? "N" : parseVal(data.PersonaExpuesta)),
            tipoPep: parseVal(data.codpeps),

            familiarEmpleadoEntidad: parseVal(data.tienefamiliarempleadoentidad),
            identificacionEmpleadoEntidad: parseVal(data.idFamEntSolidaria),
            tipoIdentificacionEmpleadoEntidad: parseVal(data.tipoIdFamEntSolidaria),
            primerNombreEmpleadoEntidad: parseVal(data.Nombre1FamEntSolidaria),
            segundoNombreEmpleadoEntidad: parseVal(data.Nombre2FamEntSolidaria),
            primerApellidoEmpleadoEntidad: parseVal(data.apellido1FamEntSolidaria),
            segundoApellidoEmpleadoEntidad: parseVal(data.apellido2FamEntSolidari),
            parentescoEmpleadoEntidad: parseVal(data.parentescofamiliarempleado),
            desdeCuandoFamiliarEmpleadoEntidad: parseDate(data.fechaDesdeEntSolidaria),
            hastaCuandoFamiliarEmpleadoEntidad: parseDate(data.fechaHastaEntSolidaria),

            familiarRecursosPublicos: parseVal(data.familiaradrecursospublicos),
            identificacionFamiliarRecursosPublicos: parseVal(data.idFamRecursosP),
            tipoIdentificacionFamiliarRecursosPublicos: parseVal(data.tipoIdFamRecursosP),
            primerNombreFamiliarRecursosPublicos: parseVal(data.nombre1FamRecursosP),
            segundoNombreFamiliarRecursosPublicos: parseVal(data.nombre2FamRecursosP),
            primerApellidoFamiliarRecursosPublicos: parseVal(data.apellido1FamRecursosP),
            segundoApellidoFamiliarRecursosPublicos: parseVal(data.apellido2FamRecursosP),
            parentescoFamiliarRecursosPublicos: parseVal(data.parentescofliarmanerecursos),
            cargoFamiliarRecursosPublicos: parseVal(data.cargofliaradrecursospubli),
            desdeCuandoFamiliarRecursosPublicos: parseDate(data.fechaDesdeFamRecursosP),
            hastaCuandoFamiliarRecursosPublicos: parseDate(data.fechaHastaFamRecursosP),
            nombreEntidadFamiliarRecursosPublicos: parseVal(data.entidadfliaradmrecursos),

            familiarPublicamenteExpuesto: parseVal(data.tienefamiliarpublicamteexpuesta),
            identificacionFamiliarPublicamenteExpuesto: parseVal(data.idFamPubliExpuesta),
            tipoIdentificacionFamiliarPublicamenteExpuesto: parseVal(data.tipoIdFampubliExpuesta),
            primerNombreFamiliarPublicamenteExpuesto: parseVal(data.nom1FamPubliExpuesta),
            segundoNombreFamiliarPublicamenteExpuesto: parseVal(data.nom2FamPubliExpuesta),
            primerApellidoFamiliarPublicamenteExpuesto: parseVal(data.ape1FamPubliExpuesta),
            segundoApellidoFamiliarPublicamenteExpuesto: parseVal(data.ape2FamPubliExpuesta),
            parentescoFamiliarPublicamenteExpuesto: parseVal(data.parentescofamiliarpublicamteexpuesta),
            desdeCuandoFamiliarPublicamenteExpuesto: parseDate(data.fechaDesFamPubliExpuesta),
            hastaCuandoFamiliarPublicamenteExpuesto: parseDate(data.fechaHasFamPubliExpuesta),

            administraRecursosPublicos: parseVal(data.adrecursospublicos),
            nombreEntidadAdministraRecursosPublicos: parseVal(data.nombreentidad),
            cargoAdministraRecursosPublicos: parseVal(data.codcargo),
            fechaViculacionRecursosPublicos: parseDate(data.fechavinculacion),
            fechaRetiroRecursosPublicos: parseDate(data.fechadesvinculacion),
        },
        ingresosEgresos: {
            honorarios: parseVal(data.honorarios),
            arriendos: parseVal(data.arriendos),
            comisiones: parseVal(data.comisiones),
            utilidadNegocio: parseVal(data.utilidadnegocio),
            bonificaciones: parseVal(data.bonificaciones),
            sueldo: parseVal(data.salario),
            interesInversiones: parseVal(data.interesinversiones),
            pensiones: parseVal(data.pensiones),
            dividendos: parseVal(data.dividendos),
            conceptoOtrosIngresos: parseVal(data.descripcioningresos),
            totalIngresos: parseVal(data.honorarios + data.arriendos + data.comisiones + data.utilidadnegocio + data.bonificaciones + data.salario + data.interesinversiones + data.pensiones + data.dividendos + data.otros),
            otrosIngresos: parseVal(data.otros),

            alimentacion: parseVal(data.alimentacion),
            educacion: parseVal(data.educacion),
            serviciosPublicos: parseVal(data.serviciospublicos),
            arriendo: parseVal(data.arriendo),
            transporte: parseVal(data.transporte),
            cuotaDomestica: parseVal(data.cuotadomestica),
            salud: parseVal(data.salud),
            otrosGastos: parseVal(data.otrosgastos),

            otrasDeudas: parseVal(data.deudas),
            prestamoVivienda: parseVal(data.prestamovivienda),
            otrosNegocios: parseVal(data.otrosnegocios),
            prestamoVehiculo: parseVal(data.prestamovehiculo),
            otrosPrestamos: parseVal(data.otrosprestamos),
            tajetaCredito: parseVal(data.trajetacredito),
            conceptoOtrosEgresos: parseVal(data.descripcionegresos),
            totalEgresos: parseVal(data.alimentacion + data.educacion + data.serviciospublicos + data.arriendo + data.transporte + data.salud + data.otrosgastos + data.deudas + data.otrosnegocios + data.prestamovivienda + data.prestamovehiculo + data.tarjetacredito + data.otrosprestamos),
            totalActivos: parseVal(data.activos),
            totalPasivos: parseVal(data.pasivos),
            totalPatrimonio: parseVal(data.activos - data.pasivos),
            saldoALaFecha: "",
            cooperativasSaldos: "",
            entidadesFinancierasCuotas: "",
            cooperativasCuotas: "",
            otrasObligacionesSaldos: "",
            otrasObligacionesCuotas: "",
            totalOtrasObligaciones: "",
        }
    };

};

// MAPEAR LA INFORMACION QUE DEVUELVE LA API CON LA ESTRUCTURA DEL FORMULARIO
const mapearInformacionConyugue = (jsonInfoConyugue) => {
    if (!jsonInfoConyugue || !jsonInfoConyugue[0] || !jsonInfoConyugue[0][0]) {
        return { conyugue: {} };
    }
    const data = jsonInfoConyugue[0][0];

    return {
        conyugue: {
            primerNombreConyugue: parseVal(data.primernombre),
            segundoNombreConyugue: parseVal(data.segundonombre),
            primerApellidoConyugue: parseVal(data.primerapellido),
            segundoApellidoConyugue: parseVal(data.segundoapellido),
            tipoDocumentoConyugue: parseVal(data.tipoidentificacion),
            documentoConyugue: parseVal(data.cedulaconyuge),
            paisNacimientoConyugue: parseVal(data.pais),
            departamentoNacimientoConyugue: parseVal(data.departamento),
            ciudadNacimientoConyugue: parseVal(data.ciudad),
            tipoDireccionConyugue: parseDir(data.direccion).tipo,
            complementoDireccionConyugue: parseDir(data.direccion).complemento,
            generoConyugue: parseVal(data.sexo),
            fechaNacimientoConyugue: parseDate(data.fechanacimiento),
            fechaExpedicionConyugue: parseDate(data.fechaexpcedula),
            telefonoConyugue: parseVal(data.telefono),
            celularConyugue: parseVal(data.celular),
            emailConyugue: parseVal(data.email),
            tipoContratoConyugue: parseVal(data.tipocontrato),
            empresaConyugue: parseVal(data.empresa),
            oficioConyugue: parseVal(data.oficion),
            telefonoEmpresaConyugue: parseVal(data.telempresa),
            paisEmpresaConyugue: parseVal(data.PaisEmpresa),
            departamentoEmpresaConyugue: parseVal(data.DepartamentoEmpresa),
            ciudadEmpresaConyugue: parseVal(data.CiudadEmpresa),
            cargoConyugue: parseVal(data.codprofesion),
            tipoDireccionEmpresaConyugue: parseDir(data.dirempresa).tipo,
            complementoDireccionEmpresaConyugue: parseDir(data.dirempresa).complemento,
            ciuuEmpresaConyugue: parseVal(data.idciiu),
            salarioConyugue: parseVal(data.salario),
            fechaIngresoEmpresaConyugue: parseDate(data.ingresoEmpresa),

        }
    };
};

function mapearOtrosDatosAdicionales(response, tipoDocumento) {
    const [personasJuridicas = [], datosRepresentanteLegal = [], listaRepresentantes = []] =
        Array.isArray(response) ? response : [[], [], []];

    const juridica = personasJuridicas[0] || null;
    const representante = datosRepresentanteLegal[0] || null;

    const esPersonaJuridica = Boolean(parseVal(juridica?.nit));
    const usaApoderado = !esPersonaJuridica && (
            ["T", "R"].includes(tipoDocumento) ||
            parseVal(representante?.relacion) === "M"
        );

    return {
        otrosDatosAdicionales: {
            cedulaApoderado: usaApoderado ? parseVal(representante?.cedula) : "",
            nombreApoderado: usaApoderado ? parseVal(representante?.nombreintegrado) : "",
            profesionApoderado: usaApoderado ? parseVal(representante?.codprofesion) : "",
            direccionApoderado: usaApoderado ? parseVal(representante?.direccion) : "",
            telefonoApoderado: usaApoderado ? parseVal(representante?.telefono) : "",
            movilApoderado: usaApoderado ? parseVal(representante?.movil) : "",

            tipoPersonaJuridica: esPersonaJuridica ? parseVal(juridica?.TipoPersona) : "",
            tieneRetencionPersonaJuridica: esPersonaJuridica ? parseVal(juridica?.retencion) : "",

            fechaNombramientoRepresentanteLegal: esPersonaJuridica ? parseDate(representante?.fechanombramiento) : "",
            numeroActaNombramientoRepresentanteLegal: esPersonaJuridica ? parseVal(representante?.numeroacta) : "",
            numeroCamaraComercio: esPersonaJuridica ? parseVal(representante?.nrocamaracomercio) : "",
            tipoEmpresaRepresentanteLegal: esPersonaJuridica ? parseVal(representante?.tipoempresa) : "",
            detalleEmpresaRepresentanteLegal: esPersonaJuridica ? parseVal(representante?.detalletipoempresa) : "",
            totalActivosRepresentanteLegal: esPersonaJuridica ? parseVal(representante?.activos) : "",
            totalPasivosRepresentanteLegal: esPersonaJuridica ? parseVal(representante?.pasivos) : "",
            totalPatrimonioRepresentanteLegal: esPersonaJuridica ? parseVal(representante?.patrimonio) : "",
            cedulaRepresentanteLegal: esPersonaJuridica ? parseVal(representante?.cedula) : "",
            nombreRepresentanteLegal: esPersonaJuridica ? parseVal(representante?.nombreintegrado) : "",
            profesionRepresentanteLegal: esPersonaJuridica ? parseVal(representante?.codprofesion) : "",
            direccionRepresentanteLegal: esPersonaJuridica ? parseVal(representante?.direccion) : "",
            paisRepresentanteLegal: esPersonaJuridica ? parseVal(representante?.codpais) : "",
            departamentoRepresentanteLegal: esPersonaJuridica ? parseVal(representante?.coddepartamentor) : "",
            ciudadRepresentanteLegal: esPersonaJuridica ? parseVal(representante?.codciudad || representante?.idciudades) : "",
            telefonoRepresentanteLegal: esPersonaJuridica ? parseVal(representante?.telefono) : "",
            movilRepresentanteLegal: esPersonaJuridica ? parseVal(representante?.movil) : "",
            indicativoRepresentanteLegal: esPersonaJuridica ? parseVal(representante?.indicativo) : ""
        },
        representantesLegalesRegistrados: Array.isArray(listaRepresentantes) ? listaRepresentantes : [],
        relacionRepresentanteLegal: parseVal(representante?.relacion),
        tienePersonaJuridica: parseVal(juridica?.nit)
    };
}


const extraerListaAutorizaciones = (data) => {
    if (!Array.isArray(data)) return [];
    if (Array.isArray(data[0])) return data[0];
    return data;
};

const mapearUltimasRespuestasAutorizacion = (jsonUltimasRespuestas) => {
    return extraerListaAutorizaciones(jsonUltimasRespuestas)
        .map(item => ({
            idAutorizacion: parseVal(item.idAutorizacion),
            codigo: parseVal(item.CodAutorizacion),
            respuesta: parseVal(item.respuesta),
            fechaSistema: parseVal(item.fechasistema),
            tituloDescripcion: parseVal(item.tituloDescripcion),
            descripcionAutorizacion: parseVal(item.descripcionAutorizacion)
        }))
        .filter(item => item.codigo);
};

const mapearAutorizaciones = (jsonInfoAutorizaciones, jsonUltimasRespuestas = []) => {
    if (!jsonInfoAutorizaciones || !Array.isArray(jsonInfoAutorizaciones)) return [];

    const ultimasRespuestas = mapearUltimasRespuestasAutorizacion(jsonUltimasRespuestas);
    const respuestasPorCodigo = new Map(
        ultimasRespuestas.map(item => [item.codigo, item])
    );

    return jsonInfoAutorizaciones.map(item => ({
        ...(() => {
            const codigo = parseVal(item.codigo);
            const requiereRespuesta = parseVal(item.respuesta).toUpperCase() !== "N";
            const ultimaRespuesta = respuestasPorCodigo.get(codigo) || {};

            return {
                codigo,
                nombre: parseVal(item.titulo),
                descripcion: parseVal(item.descripcion),
                requiereRespuesta,
                obligatorio: requiereRespuesta,
                activo: parseVal(item.estado).toUpperCase() === "A",
                respuestaActual: parseVal(ultimaRespuesta.respuesta) || (requiereRespuesta ? "N" : "S"),
                idAutorizacion: parseVal(ultimaRespuesta.idAutorizacion),
                fechaUltimaRespuesta: parseVal(ultimaRespuesta.fechaSistema)
            };
        })()
    }));
};

const mapearReferencias = (jsonReferencias) => {
    if (!jsonReferencias || !jsonReferencias[0] || !jsonReferencias[0].length) {
        return [];
    }

    return jsonReferencias[0].map((ref) => ({

        id: ref.registro,

        tipoReferencia: parseVal(ref.codigoreferencia),
        identification: parseVal(ref.cedula),
        fullNames: parseVal(ref.nombre),

        parentesco: parseVal(ref.parentesco),

        pais: parseVal(ref.codpais),
        departamento: parseVal(ref.coddepto),
        ciudad: parseVal(ref.codciudad),
        zona: parseVal(ref.codzona),
        comuna: parseVal(ref.codcomuna),
        barrio: parseVal(ref.codbarrio),

        direccion: parseVal(ref.direccion),

        telefono: parseVal(ref.telefono),
        celular: parseVal(ref.celular),

        trabajaEn: parseVal(ref.trabajaen),
        telefonoOficina: parseVal(ref.telefonooficina)
    }));
};

const mapearPersonasCargo = (jsonPersonasCargo) => {
    if (!jsonPersonasCargo || !jsonPersonasCargo[0] || !jsonPersonasCargo[0].length) {
        return [];
    }

    return jsonPersonasCargo[0].map((persona) => ({
        id: persona.registro,
        identification: parseVal(persona.cedula),
        tipoDocumento: parseVal(persona.tipoidentificacion),
        parentesco: parseVal(persona.parentesco),
        fullNames: parseVal(persona.nombre),
        fechaNacimiento: parseDate(persona.fechanacimiento),
        genero: parseVal(persona.sexo)
    }));
};

const mapearFamiliaresPeps = (jsonFamiliaresPeps) => {
    if (!jsonFamiliaresPeps || !jsonFamiliaresPeps[0] || !jsonFamiliaresPeps[0].length) {
        return [];
    }

    return jsonFamiliaresPeps[0].map((familiar) => ({
        id: familiar.idfamiliarpeps,
        identification: parseVal(familiar.cedula),
        tipoDocumento: parseVal(familiar.tipoidentificacion),
        firstName: parseVal(familiar.nombre1familiarpeps),
        secondName: parseVal(familiar.nombre2familiarpeps),
        firstLastName: parseVal(familiar.apellido1familiarpeps),
        secondLastName: parseVal(familiar.apellido2familiarpeps),
        parentesco: parseVal(familiar.codigoparentesco)
    }));
};


//LOGICA PARA RESOLVER LOS ADJUNTOS QUE SE DEBEN MOSTRAR EN EL FORMULARIO
function resolverAdjuntosParaVista(catalogo, relacionados) {
    const listaCatalogo = Array.isArray(catalogo) ? catalogo : [];
    const listaRelacionados = Array.isArray(relacionados) ? relacionados : [];
    const hayRelacionados = listaRelacionados.length > 0;

    return {
        totalCatalogo: listaCatalogo.length,
        items: listaCatalogo
            .filter(item => parseVal(item.estado) === "A")
            .reduce((acc, item) => {
                const codigo = parseVal(item.codigoadjunto);
                const nombre = parseVal(item.nombreadjunto);
                const obligatorio = parseVal(item.obligatorio) === "S";
                const solicitarSiempre = parseVal(item.solicitadjuntos) === "S";

                const existeRelacionado = listaRelacionados.some(rel =>
                    parseVal(rel.idCodigoAdjunto) === codigo &&
                    parseVal(rel.NombreCodAdjunto) === nombre
                );

                let mostrar = false;

                if (!hayRelacionados) {
                    mostrar = true;
                } else if (solicitarSiempre) {
                    mostrar = true;
                } else if (!existeRelacionado) {
                    mostrar = true;
                }

                if (!mostrar) return acc;

                acc.push({
                    codigo,
                    nombre,
                    descripcion: parseVal(item.descripcion),
                    obligatorio,
                    solicitadjuntos: parseVal(item.solicitadjuntos),
                    codadjunto: codigo,
                    codnomadjunto: nombre
                });

                return acc;
            }, [])
    };
}



//JUNTAR LA INFORMACION Y DEVOLVERLA
exports.getInformacionAsociado = async (req, res) => {
    try {
        const Cedula = req.session.user.id;
        const [datosCrudosInfo, datosCrudosConyugue, datosCrudosOtrosAdicionales] = await Promise.all([
            actualizaciondatosService.obtenerInformacionAsociado(Cedula, req.session.user.tokenWeb),
            actualizaciondatosService.obtenerInformacionConyugue(Cedula, req.session.user.tokenWeb),
            actualizaciondatosService.obtenerInformacionOtrosDatosAdicionales(Cedula, req.session.user.tokenWeb)
        ]);
        const infoMapeada = mapearInformacionAsociado(datosCrudosInfo);
        const conyugueMapeado = mapearInformacionConyugue(datosCrudosConyugue);
        const tipodocumento = infoMapeada?.datosPersonales?.tipoDocumento || "";
        const otrosMapeados = mapearOtrosDatosAdicionales(datosCrudosOtrosAdicionales, tipodocumento)
        const datosAsociadoCompleto = {
            ...infoMapeada,
            ...conyugueMapeado,
            otrosDatosAdicionales: otrosMapeados.otrosDatosAdicionales,
            representantesLegalesRegistrados: otrosMapeados.representantesLegalesRegistrados,
            relacionRepresentanteLegal: otrosMapeados.relacionRepresentanteLegal,
            tienePersonaJuridica: otrosMapeados.tienePersonaJuridica

        };
        res.status(200).json(datosAsociadoCompleto);
    } catch (error) {
        console.error("Error en getInformacionAsociado:", error);
        return manejarError(req, res, error);
    }
};

//INFORMACION DE LAS AUTORIZACIONES
exports.getAutorizaciones = async (req, res) => {
    try {
        const Cedula = req.session.user.id;
        const token = req.session.user.tokenWeb;
        const [
            datosCrudosAutorizaciones,
            datosCrudosUltimasRespuestas
        ] = await Promise.all([
            actualizaciondatosService.obtenerAutorizaciones(token),
            actualizaciondatosService.obtenerUltimasRespuestasAutorizacion(Cedula, token)
        ]);

        const autorizacionesMapeadas = mapearAutorizaciones(datosCrudosAutorizaciones, datosCrudosUltimasRespuestas);
        res.status(200).json(autorizacionesMapeadas);
    } catch (error) {
        console.error("Error en getAutorizaciones:", error);
        return manejarError(req, res, error);
    }
};

//DEVOLVER REFERENCIAS
exports.getReferencias = async (req, res) => {
    try {
        const Cedula = req.session.user.id;

        const datosCrudosReferencias =
            await actualizaciondatosService.obtenerReferencias(Cedula, req.session.user.tokenWeb);

        const referencias = mapearReferencias(datosCrudosReferencias);

        res.status(200).json(referencias);
    } catch (error) {
        console.error("Error en getReferencias:", error);
        return manejarError(req, res, error);
    }
};

exports.getPersonasCargo = async (req, res) => {
    try {
        const Cedula = req.session.user.id;

        const datosCrudosPersonasCargo =
            await actualizaciondatosService.obtenerPersonasCargo(Cedula, req.session.user.tokenWeb);

        const personasCargo = mapearPersonasCargo(datosCrudosPersonasCargo);

        res.status(200).json(personasCargo);
    } catch (error) {
        console.error("Error en getPersonasCargo:", error);
        return manejarError(req, res, error);
    }
};

exports.getFamiliaresPeps = async (req, res) => {
    try {
        const Cedula = req.session.user.id;

        const datosCrudosFamiliaresPeps =
            await actualizaciondatosService.obtenerFamiliaresPeps(Cedula, req.session.user.tokenWeb);

        const familiaresPeps = mapearFamiliaresPeps(datosCrudosFamiliaresPeps);

        res.status(200).json(familiaresPeps);
    } catch (error) {
        console.error("Error en getFamiliaresPeps:", error);
        return manejarError(req, res, error);
    }
};

exports.getAdjuntos = async (req, res) => {
    try {
        const Cedula = req.session.user.id;
        const Catalogo = await actualizaciondatosService.obtenerAdjuntosGenerales(req.session.user.tokenWeb);
        const Relacionados = await actualizaciondatosService.obtenerAdjuntosRelacionados(Cedula, req.session.user.tokenWeb);

        const adjuntos = resolverAdjuntosParaVista(Catalogo, Relacionados);

        res.status(200).json(adjuntos);
    } catch (error) {
        console.error("Error en getAdjuntos:", error);
        return manejarError(req, res, error);
    }
};

exports.getGrupoProteccion = async (req, res) => {
    try {
        const grupoProteccion = await actualizaciondatosService.obtenerEsquemaGrupoProteccion();
        res.status(200).json(Array.isArray(grupoProteccion) ? grupoProteccion : []);
    } catch (error) {
        console.error("Error en getGrupoProteccion:", error);
        return manejarError(req, res, error);
    }
};

exports.guardarActualizacionDatos = async (req, res) => {
    try {
        const formState = parseJsonField(req.body.formState, {}, "formState");
        const references = parseJsonField(req.body.references, [], "references");
        const peopleInCharge = parseJsonField(req.body.peopleInCharge, [], "peopleInCharge");
        const familiarPeps = parseJsonField(req.body.familiarPeps, [], "familiarPeps");
        const adjuntosMeta = parseJsonField(req.body.adjuntosMeta, [], "adjuntosMeta");
        const archivos = Array.isArray(req.files) ? req.files : [];
        const cedula = parseVal(formState?.datosPersonales?.numeroDocumento);
        const token = req.session?.user?.tokenWeb;

        if (!cedula) {
            return res.status(400).json({
                estado: false,
                mensaje: "No se recibio la cedula del asociado"
            });
        }

        if (!token) {
            return res.status(401).json({
                estado: false,
                mensaje: "No se encontro el token de autenticacion para procesar el guardado"
            });
        }

        const [
            datosCrudosReferencias,
            datosCrudosPersonasCargo,
            datosCrudosFamiliaresPeps,
            datosCrudosAutorizaciones,
            datosCrudosUltimasRespuestasAutorizacion
        ] = await Promise.all([
            actualizaciondatosService.obtenerReferencias(cedula, token),
            actualizaciondatosService.obtenerPersonasCargo(cedula, token),
            actualizaciondatosService.obtenerFamiliaresPeps(cedula, token),
            actualizaciondatosService.obtenerAutorizaciones(token),
            actualizaciondatosService.obtenerUltimasRespuestasAutorizacion(cedula, token)
        ]);

        if (
            datosCrudosReferencias === null ||
            datosCrudosPersonasCargo === null ||
            datosCrudosFamiliaresPeps === null ||
            datosCrudosAutorizaciones === null
        ) {
            throw new Error("No fue posible consolidar la informacion actual del asociado antes del guardado");
        }

        const referenciasFinales = combinarRegistros(
            mapearReferencias(datosCrudosReferencias),
            references
        );
        const personasCargoFinales = combinarRegistros(
            mapearPersonasCargo(datosCrudosPersonasCargo),
            peopleInCharge
        );
        const familiaresPepsFinales = combinarRegistros(
            mapearFamiliaresPeps(datosCrudosFamiliaresPeps),
            familiarPeps
        );
        const autorizacionesCatalogo = mapearAutorizaciones(
            datosCrudosAutorizaciones,
            datosCrudosUltimasRespuestasAutorizacion
        );
        const adjuntosProcesados = await guardarAdjuntosEnDisco({
            archivos,
            adjuntosMeta,
            cedula
        });

        const payload = actualizaciondatosGuardarHelper.construirPayloadActualizacion({
            formState,
            references: referenciasFinales,
            peopleInCharge: personasCargoFinales,
            familiarPeps: familiaresPepsFinales,
            adjuntosMeta,
            archivos,
            adjuntosProcesados,
            metadata: {
                cedula,
                ip: obtenerIpCliente(req),
                navegador: detectarNavegador(req.headers["user-agent"]),
                fechaSistema: formatearFechaSistema(),
                autorizacionesCatalogo
            }
        });

        const resultadoGuardado = await actualizaciondatosService.guardarActualizacion(payload, token);
        const estadoGuardado = resolverResultadoGuardado(resultadoGuardado);
        let informeSolidarioPreparado = false;
        let notificacionPreparada = false;
        let notificacionEnviada = false;
        let resumenNotificacion = null;

        if (!estadoGuardado.ok) {
            return res.status(400).json({
                estado: false,
                mensaje: estadoGuardado.mensaje || "No fue posible guardar la actualizacion de datos"
            });
        }

        try {
            const modeloInforme = await actualizaciondatosInformeService.construirModeloInforme({
                formState,
                references: referenciasFinales,
                peopleInCharge: personasCargoFinales,
                familiarPeps: familiaresPepsFinales,
                metadata: {
                    ...payload,
                    cedula,
                    fechaSistema: formatearFechaSistema(),
                    codigoAgencia: 1,
                    autorizacionesCatalogo
                },
                token
            });
            const htmlInforme = await actualizaciondatosInformeService.renderizarHtmlSolidario(modeloInforme);
            const pdfInforme = await actualizaciondatosInformeService.generarPdfSolidario(modeloInforme, htmlInforme);
            const payloadNotificacion = actualizaciondatosInformeService.construirPayloadNotificacion({
                modeloInforme,
                pdf: pdfInforme
            });
            const notificacion = notificationService.prepareActualizacionDatosEmail(payloadNotificacion);

            informeSolidarioPreparado = Boolean(
                payloadNotificacion.to &&
                Array.isArray(payloadNotificacion.attachments) &&
                payloadNotificacion.attachments.length > 0 &&
                payloadNotificacion.attachments[0]?.document
            );
            notificacionPreparada = Boolean(notificacion?.prepared);
            resumenNotificacion = notificacion?.summary || null;

            if (notificacionPreparada) {
                const resultadoNotificacion = await notificationService.sendNotification(notificacion.payload);
                notificacionEnviada = Boolean(resultadoNotificacion?.ok);
                resumenNotificacion = {
                    ...(resumenNotificacion || {}),
                    provider: resultadoNotificacion?.provider || "",
                    enviada: notificacionEnviada
                };
            }
        } catch (error) {
            console.error("Error preparando el informe solidario:", error);
            resumenNotificacion = {
                ...(resumenNotificacion || {}),
                enviada: false,
                error: error.message || "No fue posible enviar la notificacion"
            };
        }

        req.session.confir_actu = {
            bandera: 1,
            mensaje: estadoGuardado.mensaje || "La actualizacion de datos fue enviada correctamente"
        };

        return res.status(200).json({
            estado: true,
            mensaje: estadoGuardado.mensaje || "La actualizacion de datos fue enviada correctamente",
            redirectTo: "/ahorro/crear",
            informeSolidarioPreparado,
            notificacionPreparada,
            notificacionEnviada,
            resumenNotificacion
        });
    } catch (error) {
        console.error("Error en guardarActualizacionDatos:", error);
        return manejarError(req, res, error);
    }
};



