const actualizaciondatosService = require("../services/actualizaciondatosService");

const cedulaEjemplo = "70566059";

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
            grupoProteccion: parseVal(data.grupoProteccion) === "[]" ? "" : parseVal(data.grupoProteccion),
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

const mapearAutorizaciones = (jsonInfoAutorizaciones) => {
    if (!jsonInfoAutorizaciones || !Array.isArray(jsonInfoAutorizaciones)) return [];

    return jsonInfoAutorizaciones.map(item => ({
        codigo: item.codigo,
        nombre: (item.titulo || "").trim(),
        descripcion: item.descripcion || "",
        obligatorio: item.respuesta === "S",
        activo: item.estado === "A"
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
        const Cedula = cedulaEjemplo;
        const [datosCrudosInfo, datosCrudosConyugue] = await Promise.all([
            actualizaciondatosService.obtenerInformacionAsociado(Cedula),
            actualizaciondatosService.obtenerInformacionConyugue(Cedula)
        ]);
        const infoMapeada = mapearInformacionAsociado(datosCrudosInfo);
        const conyugueMapeado = mapearInformacionConyugue(datosCrudosConyugue);
        const datosAsociadoCompleto = {
            ...infoMapeada,
            ...conyugueMapeado

        };
        res.status(200).json(datosAsociadoCompleto);
    } catch (error) {
        console.error("Error en getInformacionAsociado:", error);
        res.status(500).json({ error: error.message || "Error interno al obtener asociado" });
    }
};

//INFORMACION DE LAS AUTORIZACIONES
exports.getAutorizaciones = async (req, res) => {
    try {
        const datosCrudosAutorizaciones = await actualizaciondatosService.obtenerAutorizaciones();
        const autorizacionesMapeadas = mapearAutorizaciones(datosCrudosAutorizaciones);
        res.status(200).json(autorizacionesMapeadas);
    } catch (error) {
        console.error("Error en getAutorizaciones:", error);
        res.status(500).json({ error: error.message || "Error interno al obtener autorizaciones" });
    }
};

//DEVOLVER REFERENCIAS
exports.getReferencias = async (req, res) => {
    try {
        const Cedula = cedulaEjemplo;

        const datosCrudosReferencias =
            await actualizaciondatosService.obtenerReferencias(Cedula);

        const referencias = mapearReferencias(datosCrudosReferencias);

        res.status(200).json(referencias);
    } catch (error) {
        console.error("Error en getReferencias:", error);
        res.status(500).json({
            error: error.message || "Error al obtener referencias"
        });
    }
};

exports.getPersonasCargo = async (req, res) => {
    try {
        const Cedula = cedulaEjemplo;

        const datosCrudosPersonasCargo =
            await actualizaciondatosService.obtenerPersonasCargo(Cedula);

        const personasCargo = mapearPersonasCargo(datosCrudosPersonasCargo);

        res.status(200).json(personasCargo);
    } catch (error) {
        console.error("Error en getPersonasCargo:", error);
        res.status(500).json({
            error: error.message || "Error al obtener personas a cargo"
        });
    }
};

exports.getFamiliaresPeps = async (req, res) => {
    try {
        const Cedula = cedulaEjemplo;

        const datosCrudosFamiliaresPeps =
            await actualizaciondatosService.obtenerFamiliaresPeps(Cedula);

        const familiaresPeps = mapearFamiliaresPeps(datosCrudosFamiliaresPeps);

        res.status(200).json(familiaresPeps);
    } catch (error) {
        console.error("Error en getFamiliaresPeps:", error);
        res.status(500).json({
            error: error.message || "Error al obtener familiares peps"
        });
    }
};

exports.getAdjuntos = async (req, res) => {
    try {
        const Cedula = cedulaEjemplo;
        const Catalogo = await actualizaciondatosService.obtenerAdjuntosGenerales();
        const Relacionados = await actualizaciondatosService.obtenerAdjuntosRelacionados(Cedula);

        const adjuntos = resolverAdjuntosParaVista(Catalogo, Relacionados);

        res.status(200).json(adjuntos);
    } catch (error) {
        console.error("Error en getAdjuntos:", error);
        res.status(500).json({
            error: error.message || "Error al obtener adjuntos"
        });
    }
};


