//VALIDAR SI TIENE CONTENIDO O ES NULO PARA PONERLO COMO ""
function tieneContenido(valor) {
    return valor !== null && valor !== undefined && String(valor).replace(/\s/g, "").length > 0;
}

function valorPorDefecto(predeterminado = "") {
    return tieneContenido(predeterminado) ? String(predeterminado) : "";
}

//SE QUITAN CARACTERES ESPECIALES
function sanitizarTexto(valor, predeterminado = "") {
    if (!tieneContenido(valor)) {
        return valorPorDefecto(predeterminado);
    }

    return String(valor)
        .trim()
        .replace(/[%&$]/g, "")
        .replace(/,/g, "-")
        .replace(/'/g, "_");
}

//SE QUITAN DECIMALES Y SE DEJA EN NUMERICO
function sanitizarNumero(valor) {
    if (!tieneContenido(valor)) {
        return 0;
    }

    const texto = String(valor)
        .trim()
        .replace(/\./g, "");

    const numero = Number(texto);

    if (!Number.isFinite(numero)) {
        return 0;
    }

    return texto;
}

function numeroSeguro(valor) {
    const sanitizado = sanitizarNumero(valor);
    const numero = Number(sanitizado);
    return Number.isFinite(numero) ? numero : 0;
}

function calcularTotalPatrimonio(activos, pasivos) {
    return String(numeroSeguro(activos) - numeroSeguro(pasivos));
}

function calcularTotalObligaciones(ingresosEgresos = {}) {
    const total =
        numeroSeguro(ingresosEgresos.saldoALaFecha) +
        numeroSeguro(ingresosEgresos.cooperativasSaldos) +
        numeroSeguro(ingresosEgresos.otrasObligacionesSaldos);

    return String(total);
}


//SE VALIDA SI LA FECHA TIENE EL FORMATO CORRECTO
function fechaValida(texto, separador) {
    const partes = String(texto || "").trim().split(separador);

    if (partes.length !== 3) {
        return false;
    }

    const year = Number(partes[0]);
    const month = Number(partes[1]);
    const day = Number(partes[2]);

    if (!year || !month || !day) {
        return false;
    }

    const fecha = new Date(year, month - 1, day);

    return (
        fecha.getFullYear() === year &&
        fecha.getMonth() === month - 1 &&
        fecha.getDate() === day
    );
}

//SE ORGANIZA LA FECHA COMO LO ESPERA EL API
function sanitizarFecha(valor) {
    if (!tieneContenido(valor)) {
        return "";
    }

    const texto = String(valor).trim();

    if (texto.includes("-")) {
        return fechaValida(texto, "-") ? texto : "";
    }

    if (texto.includes("/")) {
        return fechaValida(texto, "/") ? texto : "";
    }

    return "";
}

function sanitizarFechaHora(valor) {
    if (!tieneContenido(valor)) {
        return "";
    }

    const texto = String(valor)
        .trim()
        .replace("T", " ")
        .replace(/\.\d+Z?$/, "")
        .replace(/Z$/, "");

    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        return texto;
    }

    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(texto)) {
        return texto;
    }

    return "";
}

//SE DEJA LAS RESPUESTAS BOOL COMO LO ESPERA EL API
function normalizarRespuestaSiNo(valor) {
    if (
        valor === true ||
        valor === "true" ||
        valor === "S" ||
        valor === "s" ||
        valor === "on" ||
        valor === 1 ||
        valor === "1"
    ) {
        return "S";
    }

    return "N";
}


function escaparXml(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

//FUNCION PARA CREAR EL ARREGLO EN XML
function convertirAXml(data = [], nombreNodo = "") {
    let xml = "<Asociados>";

    for (const item of data) {
        xml += `<${nombreNodo}>`;

        for (const [key, value] of Object.entries(item || {})) {
            const valor = value === null || value === undefined ? "" : String(value).trim();
            xml += `<${key}>${escaparXml(valor)}</${key}>`;
        }

        xml += `</${nombreNodo}>`;
    }

    xml += "</Asociados>";
    return xml;
}


//FUNCION PARA SERIALIZAR A JSON
function serializarJson(data = {}) {
    return JSON.stringify(data);
}



function obtenerCedulaPrincipal(formState = {}, metadata = {}) {
    return sanitizarTexto(
        metadata.cedula || formState?.datosPersonales?.numeroDocumento || ""
    );
}

//META DATA NECESARIA
function crearContexto(formState = {}, metadata = {}) {
    return {
        cedula: obtenerCedulaPrincipal(formState, metadata),
        ip: sanitizarTexto(metadata.ip),
        navegador: sanitizarTexto(metadata.navegador),
        fechaSistema: sanitizarFechaHora(metadata.fechaSistema)
    };
}

function obtenerIdRegistro(item = {}) {
    if (tieneContenido(item.originalId)) {
        return sanitizarNumero(item.originalId);
    }

    return 0;
}
//VALIDACION PARA EL CONYUGUE (SE VALIDA DOS VECES FRONT Y BACK)
function validarConyugue(formState = {}) {
    const estadoCivil = sanitizarTexto(formState?.otrosDatos?.estadoCivil);
    const cedulaConyugue = sanitizarTexto(formState?.conyugue?.documentoConyugue);

    if ((estadoCivil === "C" || estadoCivil === "V") && !cedulaConyugue) {
        throw new Error("La información de cónyuge está incompleta para el estado civil seleccionado");
    }
}

//VALIDAR ADJUNTOS
function validarAdjuntos(adjuntosMeta = [], archivos = []) {
    if (!Array.isArray(adjuntosMeta)) {
        throw new Error("La metadata de adjuntos no es válida");
    }

    if (!Array.isArray(archivos)) {
        throw new Error("La lista de archivos no es válida");
    }

    if (adjuntosMeta.length !== archivos.length) {
        throw new Error("La cantidad de archivos no coincide con la metadata de adjuntos");
    }

    const codigos = new Set();

    adjuntosMeta.forEach((item, index) => {
        const codigo = sanitizarTexto(item?.codigo);
        const archivo = archivos[index];

        if (!codigo) {
            throw new Error(`El adjunto en posición ${index} no tiene código`);
        }

        if (codigos.has(codigo)) {
            throw new Error(`El código de adjunto ${codigo} está repetido`);
        }

        codigos.add(codigo);

        if (!archivo) {
            throw new Error(`No se recibió archivo para el código ${codigo}`);
        }
    });
}

//VALIDAR QUE SI HAYA LLEGADO INFORMACION
function validarEntradaBasica({
    formState = {},
    adjuntosMeta = [],
    archivos = []
}) {
    if (!formState || typeof formState !== "object") {
        throw new Error("No se recibió información del formulario");
    }

    validarConyugue(formState);
    validarAdjuntos(adjuntosMeta, archivos);
}


// MAPEADORES CON NOMBRES QUE ESPERA EL API

function mapearDatosBase(formState = {}, contexto = {}) {
    const datosPersonales = formState.datosPersonales || {};
    const datosLaborales = formState.datosLaborales || {};
    const otrosDatos = formState.otrosDatos || {};
    const ingresosEgresos = formState.ingresosEgresos || {};
    const totalPatrimonioCalculado = calcularTotalPatrimonio(
        ingresosEgresos.totalActivos,
        ingresosEgresos.totalPasivos
    );
    const totalObligacionesCalculado = calcularTotalObligaciones(ingresosEgresos);

    return {
        cedula: contexto.cedula,
        tipoidentificacion: sanitizarTexto(datosPersonales.tipoDocumento),
        apellido1: sanitizarTexto(datosPersonales.primerApellido),
        apellido2: sanitizarTexto(datosPersonales.segundoApellido),
        nombre1: sanitizarTexto(datosPersonales.primerNombre),
        nombre2: sanitizarTexto(datosPersonales.segundoNombre),
        fechanacimiento: sanitizarFecha(datosPersonales.fechaNacimiento),
        agencia: sanitizarTexto(datosPersonales.agencia, "1"),

        codpaiscedula: sanitizarTexto(datosPersonales.paisDocumento),
        coddptocedula: sanitizarTexto(datosPersonales.departamentoDocumento),
        codciudadcedula: sanitizarTexto(datosPersonales.ciudadDocumento),

        dirresidencia: sanitizarTexto(
            `${datosPersonales.tipoDireccionResidencia || ""} ${datosPersonales.complementoDireccionResidencia || ""}`.trim()
        ),
        codpaisvive: sanitizarTexto(datosPersonales.paisResidencia),
        coddptovive: sanitizarTexto(datosPersonales.departamentoResidencia),
        codciudadvive: sanitizarTexto(datosPersonales.ciudadResidencia),
        codzonavive: sanitizarTexto(datosPersonales.zonaResidencia),
        codcomunavive: sanitizarTexto(datosPersonales.comunaResidencia),
        codbarriovive: sanitizarTexto(datosPersonales.barrioResidencia),

        telefono1: sanitizarTexto(datosPersonales.telefono),
        ext1: "", //TODO decidir que hacer con este dato
        telefono2: sanitizarTexto(datosPersonales.telefono2),
        ext2: sanitizarTexto(datosPersonales.ext2),
        celular: sanitizarTexto(datosPersonales.celular),
        email: sanitizarTexto(datosPersonales.email),
        estrato: sanitizarTexto(datosPersonales.estratoResidencia),
        enviodctos: sanitizarTexto(datosPersonales.envioDocumentos),
        ciiu: sanitizarTexto(datosPersonales.ciiu),
        nacionalidad: sanitizarTexto(datosPersonales.nacionalidad),
        divisionciiu: sanitizarTexto(datosPersonales.divisionciiu),
        segmento: sanitizarTexto(datosPersonales.segmento),

        inghonorarios: sanitizarNumero(ingresosEgresos.honorarios),
        ingcomisiones: sanitizarNumero(ingresosEgresos.comisiones),
        ingarriendos: sanitizarNumero(ingresosEgresos.arriendos),
        ingutilidad: sanitizarNumero(ingresosEgresos.utilidadNegocio),
        ingbonificaciones: sanitizarNumero(ingresosEgresos.bonificaciones),
        ingpensiones: sanitizarNumero(ingresosEgresos.pensiones),
        ingsueldo: sanitizarNumero(ingresosEgresos.sueldo),
        ingotrosingresos: sanitizarNumero(ingresosEgresos.otrosIngresos),
        ingdividendos: sanitizarNumero(ingresosEgresos.dividendos),
        inginteresesinvesiones: sanitizarNumero(ingresosEgresos.interesInversiones),

        gtoalimentacion: sanitizarNumero(ingresosEgresos.alimentacion),
        gtoservicios: sanitizarNumero(ingresosEgresos.serviciosPublicos),
        gtoeducacion: sanitizarNumero(ingresosEgresos.educacion),
        gtoarriendo: sanitizarNumero(ingresosEgresos.arriendo),
        gtotransporte: sanitizarNumero(ingresosEgresos.transporte),
        gtosalud: sanitizarNumero(ingresosEgresos.salud),
        gtocuotadomestica: sanitizarNumero(ingresosEgresos.cuotaDomestica),
        gtootrosgastos: sanitizarNumero(ingresosEgresos.otrosGastos),
        gtodeudas: sanitizarNumero(ingresosEgresos.otrasDeudas),
        gtootrosnegocios: sanitizarNumero(ingresosEgresos.otrosNegocios),
        gtoprestamovivienda: sanitizarNumero(ingresosEgresos.prestamoVivienda),
        gtoprestamovehiculo: sanitizarNumero(ingresosEgresos.prestamoVehiculo),
        gtotarjetacredito: sanitizarNumero(ingresosEgresos.tajetaCredito),
        gtootroprestamos: sanitizarNumero(ingresosEgresos.otrosPrestamos),

        totalactivos: sanitizarNumero(ingresosEgresos.totalActivos),
        totalpasivos: sanitizarNumero(ingresosEgresos.totalPasivos),
        totalpatrimonio: sanitizarNumero(totalPatrimonioCalculado),
        EntidadFinanSaldoFecha: sanitizarNumero(ingresosEgresos.saldoALaFecha),
        EntidadFinanCuotaMensual: sanitizarNumero(ingresosEgresos.entidadesFinancierasCuotas),
        CooFonSaldoFecha: sanitizarNumero(ingresosEgresos.cooperativasSaldos),
        CooFonCoutaMensual: sanitizarNumero(ingresosEgresos.cooperativasCuotas),
        OtrasObligacionesSaldoFecha: sanitizarNumero(ingresosEgresos.otrasObligacionesSaldos),
        OtrasObligacionesCoutaMensual: sanitizarNumero(ingresosEgresos.otrasObligacionesCuotas),
        TotalObligaciones: sanitizarNumero(totalObligacionesCalculado),
        descripotrosingresos: sanitizarTexto(ingresosEgresos.conceptoOtrosIngresos || ""), 
        descripotrosegresos: sanitizarTexto(ingresosEgresos.conceptoOtrosEgresos || ""),


        cuentasmonedaextranjera: sanitizarTexto(otrosDatos.poseeCuentasMonedaExtranjera),
        cualesoperaciones: sanitizarTexto(otrosDatos.cualesOperacionesMonedaExtranjera),
        idpaismonedaextranjera: sanitizarTexto(otrosDatos.paisMonedaExtranjera),
        idciudadesmonedaextranjera: sanitizarTexto(otrosDatos.ciudadMonedaExtranjera, "2"),
        tipomonedaextranjera: sanitizarTexto(otrosDatos.monedaExtranjera),
        bancomonedaextranjera: sanitizarTexto(otrosDatos.bancoMonedaExtranjera),
        nrocuentamonedaextranjera: sanitizarTexto(otrosDatos.numeroCuentaMonedaExtranjera),
        opermonedaextranjera: sanitizarTexto(otrosDatos.operacionesMonedaExtranjera),

        fechaexpcedula: sanitizarFecha(datosPersonales.fechaExpedicionDocumento),
        nrohijos: sanitizarNumero(datosPersonales.nroHijos),
        NumPersonasCargo: "",

        codpaisnace: sanitizarTexto(datosPersonales.paisNacimiento),
        coddptonace: sanitizarTexto(datosPersonales.departamentoNacimiento),
        codciudadnace: sanitizarTexto(datosPersonales.ciudadNacimiento),

        niveleducativo: sanitizarTexto(otrosDatos.estudios),
        sexo: sanitizarTexto(otrosDatos.genero),
        estadocivil: sanitizarTexto(otrosDatos.estadoCivil),
        profesion: sanitizarTexto(otrosDatos.profesion),
        codempresa: sanitizarTexto(datosLaborales.pagaduria),
        coddependencia: sanitizarTexto(datosLaborales.dependenciaTrabajo),
        tipocontrato: sanitizarTexto(datosLaborales.tipoContrato || null),
        cargo: sanitizarTexto(datosLaborales.cargoTrabajo),
        salario: sanitizarNumero(datosLaborales.salario),
        deduceocasional: sanitizarTexto(datosPersonales.deduceocasional),
        codempresalabora: sanitizarTexto(datosLaborales.empresaTrabajo),
        periododeduce: sanitizarTexto(String(datosLaborales.periodoDeduccion || "").trim().substring(0, 1)),


        numerocuenta: sanitizarTexto(otrosDatos.numeroCuenta),
        tipocuenta: sanitizarTexto(otrosDatos.tipoCuenta),
        codbanco: sanitizarTexto(otrosDatos.bancoCuenta),
        ciiuo: "",
        idtipovivienda: sanitizarNumero(otrosDatos.tipoVivienda),
        fechaingresoempresa: sanitizarFecha(datosLaborales.fechaIngreso),


        //INFORMACION PEPS, SE LLENA ACA Y LUEGO TAMBIEN INDEPENDIENTEMENTE
        PersonaExpuesta: sanitizarTexto(otrosDatos.esPep),
        TipoPeps: sanitizarTexto(otrosDatos.tipoPep),

        //ADMINISTRA RECURSOS PUBLICOS

        RecursosPublicos: sanitizarTexto(otrosDatos.administraRecursosPublicos),
        NombreEntidadPeps: sanitizarTexto(otrosDatos.nombreEntidadAdministraRecursosPublicos),
        CargoPublico: sanitizarTexto(otrosDatos.cargoAdministraRecursosPublicos),
        DesdeCuando: sanitizarFecha(otrosDatos.fechaViculacionRecursosPublicos),
        HastaCuando: sanitizarFecha(otrosDatos.fechaRetiroRecursosPublicos),




        //NOTA: TODA ESTA INFORMACION TIENE INCONSISTENCIAS DESDE EL CODIGO DE PHP

        //FAMILIAR EMPLEADO ENTIDAD SOLIDARIA
        FamiliarEmpleadoEntidadSolidariaPeps: sanitizarTexto(otrosDatos.familiarEmpleadoEntidad),
        ParentescoEntidadSolidariaPeps: sanitizarTexto(otrosDatos.parentescoEmpleadoEntidad),
        QuienRecursosPublicos: sanitizarTexto(otrosDatos.quienRecursosPublicos || ""),
        NombreRecursosPublicos: sanitizarTexto(
                [
                    formState?.otrosDatos?.primerNombreEmpleadoEntidad,
                    formState?.otrosDatos?.segundoNombreEmpleadoEntidad,
                    formState?.otrosDatos?.primerApellidoEmpleadoEntidad,
                    formState?.otrosDatos?.segundoApellidoEmpleadoEntidad
                ]
                    .filter(parte => tieneContenido(parte))
                    .join(" ")
                    .toUpperCase()
            ),

        FamiliarRecursosPublicos: sanitizarTexto(otrosDatos.familiarRecursosPublicos),
        NombreEntidadPublicaPeps: sanitizarTexto(otrosDatos.nombreEntidadFamiliarRecursosPublicos),
        CargoTiene: sanitizarTexto(otrosDatos.cargoFamiliarRecursosPublicos),
        CargoPublicoDesde: "",
        CargoPublicoHasta: "",

        //FAMILIAR EXPUESTO PUBLICAMENTE (Estos campos en php se mandan vacios aca, se deja para resperar estructura)
        tienefamiliarpublicamteexpuesta: sanitizarTexto(otrosDatos.familiarPublicamenteExpuesto),
        ReconocimientoPublico: sanitizarTexto(""),
        RecPubNacDesde: sanitizarTexto(""),
        RecPubNacHasta: sanitizarTexto(""),

        //ESTA INFORMACION TIENE INCONSISTENCIAS DESDE EL CODIGO BASE
        familiarpublicamteexpuesta: sanitizarTexto(""),
        NumeroPersonasHabitaPeps: sanitizarNumero(otrosDatos.numeroPersonasHabitantes),
        DependeEconomicamenteTerceroPeps: sanitizarTexto(otrosDatos.dependeEconomicamente),
        EsDeclarantePeps: sanitizarTexto(otrosDatos.declarante),
        NombreParentescoSolidariaPeps: sanitizarTexto(otrosDatos.NombreParentescoSolidariaPeps || ""),



        ipasociado: contexto.ip,
        NavegadorActu: contexto.navegador
    };
}

function mapearConyugue(formState = {}, contexto = {}) {
    const conyugue = formState.conyugue || {};
    const cedulaConyugue = sanitizarNumero(conyugue.documentoConyugue);

    if (!cedulaConyugue) {
        return [];
    }

    return [{
        nombres: sanitizarTexto(`${conyugue.primerNombreConyugue || ""} ${conyugue.segundoNombreConyugue || ""}`.trim()),
        cedulaasociado: contexto.cedula,
        tipoidentificacionConyuge: sanitizarTexto(conyugue.tipoDocumentoConyugue),
        cedulaconyuge: cedulaConyugue,
        primerapellido: sanitizarTexto(conyugue.primerApellidoConyugue),
        segundoapellido: sanitizarTexto(conyugue.segundoApellidoConyugue),
        telefono: sanitizarTexto(conyugue.telefonoConyugue),
        empresa: sanitizarTexto(conyugue.empresaConyugue),
        telempresa: sanitizarTexto(conyugue.telefonoEmpresaConyugue),
        Oficio: sanitizarTexto(conyugue.oficioConyugue),
        codprofesion: sanitizarTexto(conyugue.cargoConyugue),
        emailConyuge: sanitizarTexto(conyugue.emailConyugue),
        primernombreconyuge: sanitizarTexto(conyugue.primerNombreConyugue),
        segundonombreconyuge: sanitizarTexto(conyugue.segundoNombreConyugue),
        tiporeferenciaconyuge: 0,
        sexoconyuge: sanitizarTexto(conyugue.generoConyugue),
        direccionempresaconyuge: sanitizarTexto(
            `${conyugue.tipoDireccionEmpresaConyugue || ""} ${conyugue.complementoDireccionEmpresaConyugue || ""}`.trim()
        ),
        paisempresaconyuge: sanitizarTexto(conyugue.paisEmpresaConyugue),
        ciudadempresaconyuge: sanitizarTexto(conyugue.ciudadEmpresaConyugue),
        departamentoempresaconyuge: sanitizarTexto(conyugue.departamentoEmpresaConyugue),
        paiscedula: sanitizarTexto(conyugue.paisNacimientoConyugue),
        dptocedula: sanitizarTexto(conyugue.departamentoNacimientoConyugue),
        ciudadcedula: sanitizarTexto(conyugue.ciudadNacimientoConyugue),
        direccion: sanitizarTexto(
            `${conyugue.tipoDireccionConyugue || ""} ${conyugue.complementoDireccionConyugue || ""}`.trim()
        ),
        fechaexpcedulaConyuge: sanitizarFecha(conyugue.fechaExpedicionConyugue),
        celularConyuge: sanitizarTexto(conyugue.celularConyugue),
        SalarioConyuge: sanitizarNumero(conyugue.salarioConyugue),
        CiiuConyuge: sanitizarNumero(conyugue.ciuuEmpresaConyugue),
        FechaIngresEmpresaConyuge: sanitizarFecha(conyugue.fechaIngresoEmpresaConyugue),
        fechanacimiento: sanitizarFecha(conyugue.fechaNacimientoConyugue),
        contrato: sanitizarTexto(conyugue.tipoContratoConyugue)
    }];
}

function mapearDatosAdicionalesPeps(formState = {}) {
    const otrosDatos = formState.otrosDatos || {};

    return [
        {
            tipo: "EES", //EMPLEADO ENTIDAD SOLIDARIA
            cbbPepsparentesco: sanitizarTexto(otrosDatos.parentescoEmpleadoEntidad),
            txtIdentificacionPeps: sanitizarTexto(otrosDatos.identificacionEmpleadoEntidad),
            txtTipoIdentificacionPeps: sanitizarTexto(otrosDatos.tipoIdentificacionEmpleadoEntidad),
            txtPrimerNombrePeps: sanitizarTexto(otrosDatos.primerNombreEmpleadoEntidad),
            txtSegundoNombrePeps: sanitizarTexto(otrosDatos.segundoNombreEmpleadoEntidad),
            txtPrimerApellidoPeps: sanitizarTexto(otrosDatos.primerApellidoEmpleadoEntidad),
            txtSegundoApellidoPeps: sanitizarTexto(otrosDatos.segundoApellidoEmpleadoEntidad),
            txtDesdePeps: sanitizarFecha(otrosDatos.desdeCuandoFamiliarEmpleadoEntidad),
            txtHastaPeps: sanitizarFecha(otrosDatos.hastaCuandoFamiliarEmpleadoEntidad)
        },
        {
            tipo: "MRP", //MANEJA RECURSOS PUBLICOS
            cbbPepsparentesco: sanitizarTexto(otrosDatos.parentescoFamiliarRecursosPublicos),
            txtIdentificacionPeps: sanitizarTexto(otrosDatos.identificacionFamiliarRecursosPublicos),
            txtTipoIdentificacionPeps: sanitizarTexto(otrosDatos.tipoIdentificacionFamiliarRecursosPublicos),
            txtPrimerNombrePeps: sanitizarTexto(otrosDatos.primerNombreFamiliarRecursosPublicos),
            txtSegundoNombrePeps: sanitizarTexto(otrosDatos.segundoNombreFamiliarRecursosPublicos),
            txtPrimerApellidoPeps: sanitizarTexto(otrosDatos.primerApellidoFamiliarRecursosPublicos),
            txtSegundoApellidoPeps: sanitizarTexto(otrosDatos.segundoApellidoFamiliarRecursosPublicos),
            txtDesdePeps: sanitizarFecha(otrosDatos.desdeCuandoFamiliarRecursosPublicos),
            txtHastaPeps: sanitizarFecha(otrosDatos.hastaCuandoFamiliarRecursosPublicos)
        },
        { 
            tipo: "FPE", // FAMILIA PUBLICAMENTE EXPUESTA
            cbbPepsparentesco: sanitizarTexto(otrosDatos.parentescoFamiliarPublicamenteExpuesto),
            txtIdentificacionPeps: sanitizarTexto(otrosDatos.identificacionFamiliarPublicamenteExpuesto),
            txtTipoIdentificacionPeps: sanitizarTexto(otrosDatos.tipoIdentificacionFamiliarPublicamenteExpuesto),
            txtPrimerNombrePeps: sanitizarTexto(otrosDatos.primerNombreFamiliarPublicamenteExpuesto),
            txtSegundoNombrePeps: sanitizarTexto(otrosDatos.segundoNombreFamiliarPublicamenteExpuesto),
            txtPrimerApellidoPeps: sanitizarTexto(otrosDatos.primerApellidoFamiliarPublicamenteExpuesto),
            txtSegundoApellidoPeps: sanitizarTexto(otrosDatos.segundoApellidoFamiliarPublicamenteExpuesto),
            txtDesdePeps: sanitizarFecha(otrosDatos.desdeCuandoFamiliarPublicamenteExpuesto),
            txtHastaPeps: sanitizarFecha(otrosDatos.hastaCuandoFamiliarPublicamenteExpuesto)
        }
    ];
}


function mapearOtrosDatosAdicionales(formState = {}) {
    const otros = formState.otrosDatosAdicionales || {};
    const otrosDatos = formState.otrosDatos || {};
    const datosPersonales = formState.datosPersonales || {};
    const tipoDocumento = sanitizarTexto(formState?.datosPersonales?.tipoDocumento);
    const grupoProteccion = Array.isArray(otrosDatos.grupoProteccion)
        ? otrosDatos.grupoProteccion
            .map(item => sanitizarTexto(item))
            .filter(Boolean)
        : (tieneContenido(otrosDatos.grupoProteccion)
            ? [sanitizarTexto(otrosDatos.grupoProteccion)]
            : []);
    const usarApoderado = tipoDocumento === "T" || tipoDocumento === "R";
    const cedulaRepresentante = usarApoderado
        ? sanitizarTexto(otros.cedulaApoderado)
        : sanitizarTexto(otros.cedulaRepresentanteLegal);
    const nombreRepresentante = usarApoderado
        ? sanitizarTexto(otros.nombreApoderado)
        : sanitizarTexto(otros.nombreRepresentanteLegal);
    const profesionRepresentante = usarApoderado
        ? sanitizarTexto(otros.profesionApoderado)
        : sanitizarTexto(otros.profesionRepresentanteLegal);
    const direccionRepresentante = usarApoderado
        ? sanitizarTexto(otros.direccionApoderado)
        : sanitizarTexto(otros.direccionRepresentanteLegal);
    const telefonoRepresentante = usarApoderado
        ? sanitizarTexto(otros.telefonoApoderado)
        : sanitizarTexto(otros.telefonoRepresentanteLegal);
    const celularRepresentante = usarApoderado
        ? sanitizarTexto(otros.movilApoderado)
        : sanitizarTexto(otros.movilRepresentanteLegal);
    const totalPatrimonioRepresentanteCalculado = calcularTotalPatrimonio(
        otros.totalActivosRepresentanteLegal,
        otros.totalPasivosRepresentanteLegal
    );

    const payload = {
        tipoPersonaJuridica: sanitizarTexto(otros.tipoPersonaJuridica),
        tieneRetencion: sanitizarTexto(otros.tieneRetencionPersonaJuridica),
        fechaNombramiento: sanitizarFecha(otros.fechaNombramientoRepresentanteLegal),
        numeroActa: sanitizarTexto(otros.numeroActaNombramientoRepresentanteLegal),
        numeroCamaraComercio: sanitizarTexto(otros.numeroCamaraComercio),
        tipoEmpresa: sanitizarTexto(otros.tipoEmpresaRepresentanteLegal),
        detalleEmpresa: sanitizarTexto(otros.detalleEmpresaRepresentanteLegal),
        totalActivos: sanitizarNumero(otros.totalActivosRepresentanteLegal),
        totalPasivos: sanitizarNumero(otros.totalPasivosRepresentanteLegal),
        totalPatrimonio: sanitizarNumero(totalPatrimonioRepresentanteCalculado),
        descripotrosingresos: sanitizarTexto(otros.conceptoOtrosIngresos),
        descripotrosegresos: sanitizarTexto(otros.conceptoOtrosEgresos),
        cedulaRepresentante,
        nombreRepresentante,
        codprofesion: profesionRepresentante,
        direccionRepresentante,
        telefonoRepresentante,
        celularRepresentante,

        codigoPais: sanitizarTexto(otros.paisRepresentanteLegal, "169"),
        codigoDepartamento: sanitizarTexto(otros.departamentoRepresentanteLegal, "0"),
        codigoCiudad: sanitizarTexto(otros.ciudadRepresentanteLegal, "0"),
        indicativoRepresentante: sanitizarTexto(otros.indicativoRepresentanteLegal),
        tipozona: sanitizarTexto(datosPersonales.tipoZonaResidencia),

        grupoProteccion,
        ocupacion: sanitizarTexto(otrosDatos.ocupacion, "1"),

        codigoPaisResidencia: sanitizarTexto(datosPersonales.paisResidencia),
        codigoDepartamentoResidencia: sanitizarTexto(datosPersonales.departamentoResidencia),
        codigoCiudadResidencia: sanitizarTexto(datosPersonales.ciudadResidencia)
    };

    if (!tieneContenido(payload.cedulaRepresentante)) {
        payload.tipoPersonaJuridica = "";
        payload.tieneRetencion = "";
        payload.fechaNombramiento = "";
        payload.numeroActa = "";
        payload.numeroCamaraComercio = "";
        payload.tipoEmpresa = "";
        payload.detalleEmpresa = "";
        payload.totalActivos = 0;
        payload.totalPasivos = 0;
        payload.totalPatrimonio = 0;
        payload.codigoPais = 169;
        payload.codigoDepartamento = 0;
        payload.codigoCiudad = 0;
        payload.indicativoRepresentante = "";
        payload.nombreRepresentante = "";
        payload.codprofesion = "";
        payload.direccionRepresentante = "";
        payload.telefonoRepresentante = "";
        payload.celularRepresentante = "";
    }

    return payload;
}



function mapearReferencias(references = []) {
    return (Array.isArray(references) ? references : []).map(item => ({
        DR_txtcedula: sanitizarTexto(item.identification),
        DR_cmbtiporef: sanitizarTexto(item.tipoReferencia),
        DR_cmbparentesco: sanitizarTexto(item.parentesco),
        DR_txtnombre: sanitizarTexto(item.fullNames),
        DR_txtdireccion: sanitizarTexto(item.direccion),
        DR_telefono: sanitizarTexto(item.telefono),
        DR_cmbpais: sanitizarTexto(item.pais),
        DR_cmbdptos: sanitizarTexto(item.departamento),
        DR_cmbciudad: sanitizarTexto(item.ciudad),
        DR_cmbzona: sanitizarTexto(item.zona),
        DR_cmbcomuna: sanitizarTexto(item.comuna),
        DR_cmbbarrio: sanitizarTexto(item.barrio),
        DR_txttrabajaen: sanitizarTexto(item.trabajaEn),
        DR_txtteloficina: sanitizarTexto(item.telefonoOficina),
        DR_txtcelular: sanitizarTexto(item.celular),
        DR_registro: obtenerIdRegistro(item),
        DR_registroReal: tieneContenido(item.originalId) ? "true" : "false"
    }));
}

function mapearPersonasCargo(peopleInCharge = []) {
    return (Array.isArray(peopleInCharge) ? peopleInCharge : []).map(item => ({
        DPC_numdocu: sanitizarTexto(item.identification),
        DPC_tipodocu: sanitizarTexto(item.tipoDocumento),
        DPC_parentesco: sanitizarTexto(item.parentesco),
        DPC_nombres: sanitizarTexto(item.fullNames),
        DPC_sexo: sanitizarTexto(item.genero)
            .toUpperCase(),
        DPC_fechanaci: sanitizarFecha(item.fechaNacimiento),
        DPC_registro: obtenerIdRegistro(item),
        DP_registroReal: tieneContenido(item.originalId) ? "true" : "false"
    }));
}

function mapearFamiliaresPeps(familiarPeps = []) {
    return (Array.isArray(familiarPeps) ? familiarPeps : []).map(item => ({
        FP_identificacionFamiliaPeps: sanitizarTexto(item.identification),
        FP_tipoidentificacionFamiliaPeps: sanitizarTexto(item.tipoDocumento),
        FP_nombre1FamiliaPeps: sanitizarTexto(item.firstName),
        FP_nombre2FamiliaPeps: sanitizarTexto(item.secondName),
        FP_apellido1FamiliaPeps: sanitizarTexto(item.firstLastName),
        FP_apellido2FamiliaPeps: sanitizarTexto(item.secondLastName),
        FP_parentescoFamiliaPeps: sanitizarTexto(item.parentesco),
        FP_registro: obtenerIdRegistro(item),
        FP_registroReal: tieneContenido(item.originalId) ? "true" : "false"
    }));
}





function mapearArchivos(adjuntosProcesados = []) {
    return (Array.isArray(adjuntosProcesados) ? adjuntosProcesados : []).map(item => ({
        cedula: sanitizarTexto(item.cedula),
        nombre: sanitizarTexto(item.nombre),
        idCodigoAdjunto: sanitizarTexto(item.idCodigoAdjunto),
        NombreCodAdjunto: sanitizarTexto(item.NombreCodAdjunto)
    }));
}

function normalizarDescripcionAutorizacion(valor) {
    return sanitizarTexto(valor)
        .replace(/<a/gi, "(link")
        .replace(/href/gi, "url=")
        .replace(/<\/a>/gi, "(/link)")
        .replace(/>/g, ")")
        .replace(/"/g, "'");
}

function obtenerCodigoAutorizacion(autorizacion = {}) {
    return sanitizarTexto(
        autorizacion.codigo ||
        autorizacion.CodAutorizacion ||
        autorizacion.codAutorizacion ||
        autorizacion.id
    );
}

function obtenerRespuestaAutorizacion(codigo, autorizaciones = {}, autorizacion = {}) {
    if (Object.prototype.hasOwnProperty.call(autorizaciones, codigo)) {
        return normalizarRespuestaSiNo(autorizaciones[codigo]);
    }

    if (tieneContenido(autorizacion.respuestaActual)) {
        return normalizarRespuestaSiNo(autorizacion.respuestaActual);
    }

    if (autorizacion.requiereRespuesta === false || autorizacion.obligatorio === false) {
        return "S";
    }

    return "N";
}

function mapearAutorizaciones(formState = {}, contexto = {}, autorizacionesCatalogo = []) {
    const autorizaciones = formState.autorizaciones || {};
    const catalogo = Array.isArray(autorizacionesCatalogo) ? autorizacionesCatalogo : [];
    const autorizacionesParaEnviar = catalogo.length
        ? catalogo
        : Object.keys(autorizaciones).map(codigo => ({ codigo }));

    return autorizacionesParaEnviar
        .map(autorizacion => {
            const codigo = obtenerCodigoAutorizacion(autorizacion);

            if (!codigo) return null;

            return {
                fechasistema: contexto.fechaSistema,
                cedula: contexto.cedula,
                CodAutorizacion: codigo,
                tituloDescripcion: sanitizarTexto(
                    autorizacion.nombre ||
                    autorizacion.tituloDescripcion ||
                    autorizacion.titulo
                ),
                descripcionAutorizacion: normalizarDescripcionAutorizacion(
                    autorizacion.descripcion ||
                    autorizacion.descripcionAutorizacion
                ),
                respuesta: obtenerRespuestaAutorizacion(codigo, autorizaciones, autorizacion),
                Web: "ACTU"
            };
        })
        .filter(Boolean);
}


//BUILDERS 

function construirXmlConyugue(formState = {}, contexto = {}) {
    const conyugue = mapearConyugue(formState, contexto);

    if (!conyugue.length) {
        const estadoCivil = sanitizarTexto(formState?.otrosDatos?.estadoCivil);

        if (estadoCivil === "C" || estadoCivil === "V") {
            throw new Error("La información de cónyuge está incompleta");
        }

        return "";
    }

    return convertirAXml(conyugue, "conyugue");
}

function construirXmlReferencias(references = []) {
    return convertirAXml(mapearReferencias(references), "Referencia");
}

function construirXmlPersonasCargo(peopleInCharge = []) {
    return convertirAXml(mapearPersonasCargo(peopleInCharge), "PersonaCargo");
}

function construirXmlFamiliaresPeps(familiarPeps = []) {
    return convertirAXml(mapearFamiliaresPeps(familiarPeps), "familiares");
}

function construirXmlDatosAdicionalesPeps(formState = {}) {
    return convertirAXml(mapearDatosAdicionalesPeps(formState), "Peps");
}

function construirJsonOtrosDatosAdicionales(formState = {}) {
    return serializarJson(mapearOtrosDatosAdicionales(formState));
}

function construirXmlArchivos(adjuntosProcesados = []) {
    return convertirAXml(mapearArchivos(adjuntosProcesados), "archivos");
}

function construirXmlAutorizaciones(formState = {}, contexto = {}, autorizacionesCatalogo = []) {
    return convertirAXml(
        mapearAutorizaciones(formState, contexto, autorizacionesCatalogo),
        "autorizacion"
    );
}

function construirPayloadActualizacion({
    formState = {},
    references = [],
    peopleInCharge = [],
    familiarPeps = [],
    adjuntosMeta = [],
    archivos = [],
    adjuntosProcesados = [],
    metadata = {}
}) {
    validarEntradaBasica({
        formState,
        adjuntosMeta,
        archivos
    });

    const contexto = crearContexto(formState, metadata);
    const datosBase = mapearDatosBase(formState, contexto);
    const autorizacionesCatalogo = metadata.autorizacionesCatalogo || [];

    return {
        ...datosBase,
        Referencias: construirXmlReferencias(references),
        PersonasCargo: construirXmlPersonasCargo(peopleInCharge),
        FamiliaresPeps: construirXmlFamiliaresPeps(familiarPeps),
        DatosAdicionalesPeps: construirXmlDatosAdicionalesPeps(formState),
        Conyugue: construirXmlConyugue(formState, contexto),
        OtrosDatosAdicionales: construirJsonOtrosDatosAdicionales(formState),
        Archivos: construirXmlArchivos(adjuntosProcesados),
        Autorizaciones: construirXmlAutorizaciones(formState, contexto, autorizacionesCatalogo)
    };
}

module.exports = {
    tieneContenido,
    sanitizarTexto,
    sanitizarNumero,
    sanitizarFecha,
    normalizarRespuestaSiNo,
    convertirAXml,
    serializarJson,
    validarConyugue,
    validarAdjuntos,
    validarEntradaBasica,
    mapearDatosBase,
    mapearConyugue,
    mapearReferencias,
    mapearPersonasCargo,
    mapearFamiliaresPeps,
    mapearDatosAdicionalesPeps,
    mapearOtrosDatosAdicionales,
    mapearArchivos,
    mapearAutorizaciones,
    construirXmlConyugue,
    construirXmlReferencias,
    construirXmlPersonasCargo,
    construirXmlFamiliaresPeps,
    construirXmlDatosAdicionalesPeps,
    construirJsonOtrosDatosAdicionales,
    construirXmlArchivos,
    construirXmlAutorizaciones,
    construirPayloadActualizacion
};
