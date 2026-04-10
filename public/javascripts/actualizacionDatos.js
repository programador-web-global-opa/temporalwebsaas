(function () {

    //AVANCE BARRA
    function updateProgressBar($currentTab) {
        const $tabs = $(".app-tab:visible");
        const index = $tabs.index($currentTab);
        const total = $tabs.length;
        const percent = ((index + 1) / total) * 100;
        $("#progressBar").css("width", percent + "%")
            .attr("aria-valuenow", percent);
    }



    //SISTEMA DE TABS
    $(document).on("click", ".app-tab", function (e) {
        e.preventDefault();

        //guardarSessionStorage();
        const tab = $(this).data("tab");
        $(".app-tab").removeClass("active");
        $(this).addClass("active");
        updateProgressBar($(this));

        $("#tab-content").load(
            `/actualizaciondatos/tab/${tab}`,
            async function () {
                await inicializarCombos($(this));
                initTabs();
                hydrateTab(tab);
                evaluarTabsDinamicas();
                validarCamposDeshabilitados();
                if (tab === 'referencias') {
                    await initReferencias();
                }
                if (tab === 'personasACargo') {
                    await initPersonasACargo();
                }
                if (tab === 'familiaresPeps') {
                    await initFamiliaresPeps();
                }
                if (tab === 'otrosDatosAdicionales') {
                    evaluarContenidoOtrosDatosAdicionales();
                }
            }
        );
    });


    //CARGAR TAB DINAMICO CUANDO SE CARGA EL FORMULARIO POR PRIMERA VEZ
    $(document).ready(function () {
        inicializarFormulario();
        evaluarTabsDinamicas();
        $('.app-tab[data-tab="autorizaciones"]').trigger('click');
    });

    //INICIALIZAR TABS INDEPENDIENTES
    function initTabs() {
        initAutorizaciones();
        initAdjuntos();
        initOtrosDatos();
    }

    //  HELPERS SANITIZACION (pruebas temporal)-------------------------------

    function sanitizarValor(value) {
        if (typeof value !== "string") return value;
        return value
            .replace(/'/g, "")
            .replace(/\s{2,}/g, " ")
            .trim();
    }

    function sanitizarObjeto(obj) {
        Object.keys(obj).forEach(key => {
            if (obj[key] && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
                sanitizarObjeto(obj[key]);
            } else {
                obj[key] = sanitizarValor(obj[key]);
            }
        });
    }

    function sanitizarFormState() {
        sanitizarObjeto(formState);
    }


    // HELPERS VALIDACION (pruebas temporal)----------------------------------------------

    async function validarActualizacionDatos() {
        sanitizarFormState();

        const validadores = [
            validarAutorizaciones,
            validarDatosPersonales,
            validarDatosLaborales,
            validarOtrosDatos,
            validarDatosPeps,
            validarIngresosEgresos,
            validarConyugue
            // validarAdjuntos,
            // validarOtrosDatosAdicionales
        ];

        for (const validar of validadores) {
            const resultado = await validar();
            if (!resultado.ok) {
                await mostrarErrorValidacion(resultado);
                return false;
            }
        }

        return true;
    }

    async function mostrarErrorValidacion(error) {
        if (error.tab) {
            await abrirTab(error.tab);
        }

        infoModal(error.message, "alerta", () => {
            if (error.field) {
                $(error.field).trigger("focus");
            }
        });
    }

    function isEmpty(value) {
        return value === null || value === undefined || String(value).trim() === "";
    }

    function isEmptySelect(value) {
        return isEmpty(value) || String(value).trim() === "0";
    }

    function isValidEmail(value) {
        if (isEmpty(value)) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
    }

    function crearError(tab, field, message) {
        return { ok: false, tab, field, message };
    }

    async function abrirTab(tab) {
        const $tab = $(`.app-tab[data-tab="${tab}"]`);
        if (!$tab.length) return;

        $tab.trigger("click");

        await new Promise(resolve => setTimeout(resolve, 250));
    }

    function validarReglas({ tab, bloque, reglas }) {
        for (const regla of reglas) {
            const { value, type, field, message, allowZero } = regla;

            if (type === "text") {
                if (isEmpty(value)) {
                    return crearError(tab, field, message);
                }

                if (!allowZero && Number(value) === 0 && String(value).trim() === "0") {
                    return crearError(tab, field, message);
                }
            }

            if (type === "select") {
                if (isEmptySelect(value)) {
                    return crearError(tab, field, message);
                }
            }

            if (type === "email") {
                if (!isValidEmail(value)) {
                    return crearError(tab, field, message);
                }
            }
        }

        return { ok: true };
    }






    // VALIDADORES POR TAB --------------------------------------------------------------------------------------------------------------

    //AUTORIZACIONES
    function validarAutorizaciones() {
        const catalogo = Array.isArray(autorizaciones) ? autorizaciones : [];
        const obligatorias = catalogo.filter(a => a.obligatorio);

        for (const aut of obligatorias) {
            if (!formState.autorizaciones?.[aut.codigo]) {
                return crearError(
                    "autorizaciones",
                    `#switch-${aut.codigo}`,
                    "Debe aceptar las autorizaciones obligatorias"
                );
            }
        }

        return { ok: true };
    }

    //DATOS PERSONALES
    function validarDatosPersonales() {
        const d = formState.datosPersonales;
        const msg = " - De la ficha DATOS PERSONALES";

        return validarReglas({
            tab: "datosPersonales",
            reglas: [
                { field: "#numeroDocumento", type: "text", value: d.numeroDocumento, message: "Ingrese número de documento" + msg },
                { field: "#tipoDocumento", type: "select", value: d.tipoDocumento, message: "Ingrese tipo de documento" + msg },
                { field: "#fechaExpedicionDocumento", type: "text", value: d.fechaExpedicionDocumento, message: "Ingrese fecha de expedición" + msg },
                { field: "#paisDocumento", type: "select", value: d.paisDocumento, message: "Ingrese país del documento" + msg },
                { field: "#departamentoDocumento", type: "select", value: d.departamentoDocumento, message: "Ingrese departamento del documento" + msg },
                { field: "#ciudadDocumento", type: "select", value: d.ciudadDocumento, message: "Ingrese ciudad del documento" + msg },
                { field: "#primerNombre", type: "text", value: d.primerNombre, message: "Ingrese primer nombre" + msg },
                { field: "#primerApellido", type: "text", value: d.primerApellido, message: "Ingrese primer apellido" + msg },
                { field: "#fechaNacimiento", type: "text", value: d.fechaNacimiento, message: "Ingrese fecha de nacimiento" + msg },
                { field: "#paisNacimiento", type: "select", value: d.paisNacimiento, message: "Ingrese país de nacimiento" + msg },
                { field: "#departamentoNacimiento", type: "select", value: d.departamentoNacimiento, message: "Ingrese departamento de nacimiento" + msg },
                { field: "#ciudadNacimiento", type: "select", value: d.ciudadNacimiento, message: "Ingrese ciudad de nacimiento" + msg },
                { field: "#nroHijos", type: "text", value: d.nroHijos, message: "Ingrese número de hijos" + msg, allowZero: true },
                { field: "#ciiu", type: "select", value: d.ciiu, message: "Ingrese CIIU" + msg },
                { field: "#nacionalidad", type: "select", value: d.nacionalidad, message: "Ingrese nacionalidad" + msg },
                { field: "#tipoDireccionResidencia", type: "select", value: d.tipoDireccionResidencia, message: "Ingrese tipo de dirección" + msg },
                { field: "#complementoDireccionResidencia", type: "text", value: d.complementoDireccionResidencia, message: "Ingrese complemento dirección" + msg },
                { field: "#paisResidencia", type: "select", value: d.paisResidencia, message: "Ingrese país residencia" + msg },
                { field: "#departamentoResidencia", type: "select", value: d.departamentoResidencia, message: "Ingrese departamento residencia" + msg },
                { field: "#ciudadResidencia", type: "select", value: d.ciudadResidencia, message: "Ingrese ciudad residencia" + msg },
                { field: "#tipoZonaResidencia", type: "select", value: d.tipoZonaResidencia, message: "Ingrese tipo zona residencia" + msg },
                { field: "#zonaResidencia", type: "select", value: d.zonaResidencia, message: "Ingrese zona residencia" + msg },
                { field: "#comunaResidencia", type: "select", value: d.comunaResidencia, message: "Ingrese comuna residencia" + msg },
                { field: "#barrioResidencia", type: "select", value: d.barrioResidencia, message: "Ingrese barrio residencia" + msg },
                { field: "#telefono", type: "text", value: d.telefono, message: "Ingrese teléfono" + msg },
                { field: "#celular", type: "text", value: d.celular, message: "Ingrese celular" + msg }
            ]
        });
    }

    //DATOS LABORALES
    function validarDatosLaborales() {
        const l = formState.datosLaborales;
        const p = formState.datosPersonales;
        const msg = " - De la ficha DATOS LABORALES";

        const reglas = [
            { field: "#empresaTrabajo", type: "select", value: l.empresaTrabajo, message: "Ingrese trabaja en" + msg },
            { field: "#cargoTrabajo", type: "select", value: l.cargoTrabajo, message: "Ingrese el cargo" + msg },
            { field: "#dependenciaTrabajo", type: "select", value: l.dependenciaTrabajo, message: "Ingrese dependencia" + msg },
            { field: "#fechaIngreso", type: "text", value: l.fechaIngreso, message: "Ingrese fecha de ingreso" + msg }
        ];

        if (l.tipoContrato !== "N") {
            reglas.push({
                field: "#pagaduria",
                type: "select",
                value: l.pagaduria,
                message: "Ingrese pagaduría" + msg
            });
        }

        if (p.tipoDocumento !== "N") {
            reglas.push({
                field: "#tipoContrato",
                type: "select",
                value: l.tipoContrato,
                message: "Ingrese tipo de contrato" + msg
            });
        }

        return validarReglas({
            tab: "datosLaborales",
            reglas
        });
    }

    //OTROS DATOS
    function validarOtrosDatos() {
        const o = formState.otrosDatos;
        const msg = " - De la ficha OTROS DATOS";

        const base = validarReglas({
            tab: "otrosDatos",
            reglas: [
                { field: "#estudios", type: "select", value: o.estudios, message: "Ingrese estudios" + msg },
                { field: "#genero", type: "select", value: o.genero, message: "Ingrese género" + msg },
                { field: "#estadoCivil", type: "select", value: o.estadoCivil, message: "Ingrese estado civil" + msg },
                { field: "#profesion", type: "select", value: o.profesion, message: "Ingrese profesión" + msg },
                { field: "#tipoVivienda", type: "select", value: o.tipoVivienda, message: "Ingrese tipo de vivienda" + msg },
                { field: "#numeroPersonasHabitantes", type: "text", value: o.numeroPersonasHabitantes, message: "Ingrese número de personas habitantes" + msg, allowZero: true },
                { field: "#dependeEconomicamente", type: "select", value: o.dependeEconomicamente, message: "Ingrese si depende económicamente" + msg },
                { field: "#declarante", type: "select", value: o.declarante, message: "Ingrese si es declarante" + msg }
            ]
        });

        if (!base.ok) return base;

        if (o.operacionesMonedaExtranjera === "S" && isEmpty(o.cualesOperacionesMonedaExtranjera)) {
            return crearError("otrosDatos", "#cualesOperacionesMonedaExtranjera", "Ingrese cuáles operaciones en moneda extranjera - De la ficha OTROS DATOS");
        }

        if (o.poseeCuentasMonedaExtranjera === "S") {
            const cuentas = validarReglas({
                tab: "otrosDatos",
                reglas: [
                    { field: "#paisMonedaExtranjera", type: "select", value: o.paisMonedaExtranjera, message: "Ingrese país de moneda extranjera" + msg },
                    { field: "#ciudadMonedaExtranjera", type: "select", value: o.ciudadMonedaExtranjera, message: "Ingrese ciudad de moneda extranjera" + msg },
                    { field: "#monedaExtranjera", type: "text", value: o.monedaExtranjera, message: "Ingrese moneda extranjera" + msg },
                    { field: "#bancoMonedaExtranjera", type: "text", value: o.bancoMonedaExtranjera, message: "Ingrese banco moneda extranjera" + msg },
                    { field: "#numeroCuentaMonedaExtranjera", type: "text", value: o.numeroCuentaMonedaExtranjera, message: "Ingrese número de cuenta moneda extranjera" + msg }
                ]
            });

            if (!cuentas.ok) return cuentas;
        }

        return { ok: true };
    }

    //DATOS PEPS (OTROS DATOS)
    function validarDatosPeps() {
        const o = formState.otrosDatos;
        const msg = " - De la ficha OTROS DATOS";

        if (isEmptySelect(o.esPep)) {
            return crearError("otrosDatos", "#esPep", "Ingrese si usted es expuesto políticamente" + msg);
        }

        if (o.esPep !== "S") {
            return { ok: true };
        }

        const base = validarReglas({
            tab: "otrosDatos",
            reglas: [
                { field: "#tipoPep", type: "select", value: o.tipoPep, message: "Ingrese tipo PEP" + msg },
                { field: "#familiarEmpleadoEntidad", type: "select", value: o.familiarEmpleadoEntidad, message: "Ingrese si tiene familiar empleado entidad" + msg },
                { field: "#familiarRecursosPublicos", type: "select", value: o.familiarRecursosPublicos, message: "Ingrese si tiene familiar recursos públicos" + msg },
                { field: "#familiarPublicamenteExpuesto", type: "select", value: o.familiarPublicamenteExpuesto, message: "Ingrese si tiene familiar públicamente expuesto" + msg },
                { field: "#administraRecursosPublicos", type: "select", value: o.administraRecursosPublicos, message: "Ingrese si administra recursos públicos" + msg }
            ]
        });

        if (!base.ok) return base;

        if (o.familiarEmpleadoEntidad === "S") {
            const r1 = validarReglas({
                tab: "otrosDatos",
                reglas: [
                    { field: "#identificacionEmpleadoEntidad", type: "text", value: o.identificacionEmpleadoEntidad, message: "Ingrese identificación familiar empleado entidad" + msg },
                    { field: "#tipoIdentificacionEmpleadoEntidad", type: "select", value: o.tipoIdentificacionEmpleadoEntidad, message: "Ingrese tipo documento familiar empleado entidad" + msg },
                    { field: "#primerNombreEmpleadoEntidad", type: "text", value: o.primerNombreEmpleadoEntidad, message: "Ingrese primer nombre familiar empleado entidad" + msg },
                    { field: "#primerApellidoEmpleadoEntidad", type: "text", value: o.primerApellidoEmpleadoEntidad, message: "Ingrese primer apellido familiar empleado entidad" + msg },
                    { field: "#parentescoEmpleadoEntidad", type: "select", value: o.parentescoEmpleadoEntidad, message: "Ingrese parentesco familiar empleado entidad" + msg },
                    { field: "#desdeCuandoFamiliarEmpleadoEntidad", type: "text", value: o.desdeCuandoFamiliarEmpleadoEntidad, message: "Ingrese fecha desde familiar empleado entidad" + msg },
                    { field: "#hastaCuandoFamiliarEmpleadoEntidad", type: "text", value: o.hastaCuandoFamiliarEmpleadoEntidad, message: "Ingrese fecha hasta familiar empleado entidad" + msg }
                ]
            });
            if (!r1.ok) return r1;
        }

        if (o.familiarRecursosPublicos === "S") {
            const r2 = validarReglas({
                tab: "otrosDatos",
                reglas: [
                    { field: "#identificacionFamiliarRecursosPublicos", type: "text", value: o.identificacionFamiliarRecursosPublicos, message: "Ingrese identificación familiar recursos públicos" + msg },
                    { field: "#tipoIdentificacionFamiliarRecursosPublicos", type: "select", value: o.tipoIdentificacionFamiliarRecursosPublicos, message: "Ingrese tipo documento familiar recursos públicos" + msg },
                    { field: "#primerNombreFamiliarRecursosPublicos", type: "text", value: o.primerNombreFamiliarRecursosPublicos, message: "Ingrese primer nombre familiar recursos públicos" + msg },
                    { field: "#primerApellidoFamiliarRecursosPublicos", type: "text", value: o.primerApellidoFamiliarRecursosPublicos, message: "Ingrese primer apellido familiar recursos públicos" + msg },
                    { field: "#parentescoFamiliarRecursosPublicos", type: "select", value: o.parentescoFamiliarRecursosPublicos, message: "Ingrese parentesco familiar recursos públicos" + msg },
                    { field: "#cargoFamiliarRecursosPublicos", type: "text", value: o.cargoFamiliarRecursosPublicos, message: "Ingrese cargo familiar recursos públicos" + msg },
                    { field: "#nombreEntidadFamiliarRecursosPublicos", type: "text", value: o.nombreEntidadFamiliarRecursosPublicos, message: "Ingrese entidad familiar recursos públicos" + msg },
                    { field: "#desdeCuandoFamiliarRecursosPublicos", type: "text", value: o.desdeCuandoFamiliarRecursosPublicos, message: "Ingrese fecha desde familiar recursos públicos" + msg },
                    { field: "#hastaCuandoFamiliarRecursosPublicos", type: "text", value: o.hastaCuandoFamiliarRecursosPublicos, message: "Ingrese fecha hasta familiar recursos públicos" + msg }
                ]
            });
            if (!r2.ok) return r2;
        }

        if (o.familiarPublicamenteExpuesto === "S") {
            const r3 = validarReglas({
                tab: "otrosDatos",
                reglas: [
                    { field: "#identificacionFamiliarPublicamenteExpuesto", type: "text", value: o.identificacionFamiliarPublicamenteExpuesto, message: "Ingrese identificación familiar públicamente expuesto" + msg },
                    { field: "#tipoIdentificacionFamiliarPublicamenteExpuesto", type: "select", value: o.tipoIdentificacionFamiliarPublicamenteExpuesto, message: "Ingrese tipo documento familiar públicamente expuesto" + msg },
                    { field: "#primerNombreFamiliarPublicamenteExpuesto", type: "text", value: o.primerNombreFamiliarPublicamenteExpuesto, message: "Ingrese primer nombre familiar públicamente expuesto" + msg },
                    { field: "#primerApellidoFamiliarPublicamenteExpuesto", type: "text", value: o.primerApellidoFamiliarPublicamenteExpuesto, message: "Ingrese primer apellido familiar públicamente expuesto" + msg },
                    { field: "#parentescoFamiliarPublicamenteExpuesto", type: "select", value: o.parentescoFamiliarPublicamenteExpuesto, message: "Ingrese parentesco familiar públicamente expuesto" + msg },
                    { field: "#desdeCuandoFamiliarPublicamenteExpuesto", type: "text", value: o.desdeCuandoFamiliarPublicamenteExpuesto, message: "Ingrese fecha desde familiar públicamente expuesto" + msg },
                    { field: "#hastaCuandoFamiliarPublicamenteExpuesto", type: "text", value: o.hastaCuandoFamiliarPublicamenteExpuesto, message: "Ingrese fecha hasta familiar públicamente expuesto" + msg }
                ]
            });
            if (!r3.ok) return r3;
        }

        if (o.administraRecursosPublicos === "S") {
            const r4 = validarReglas({
                tab: "otrosDatos",
                reglas: [
                    { field: "#nombreEntidadAdministraRecursosPublicos", type: "text", value: o.nombreEntidadAdministraRecursosPublicos, message: "Ingrese nombre entidad administra recursos públicos" + msg },
                    { field: "#cargoAdministraRecursosPublicos", type: "select", value: o.cargoAdministraRecursosPublicos, message: "Ingrese cargo administra recursos públicos" + msg },
                    { field: "#fechaViculacionRecursosPublicos", type: "text", value: o.fechaViculacionRecursosPublicos, message: "Ingrese fecha vinculación recursos públicos" + msg },
                    { field: "#fechaRetiroRecursosPublicos", type: "text", value: o.fechaRetiroRecursosPublicos, message: "Ingrese fecha retiro recursos públicos" + msg }
                ]
            });
            if (!r4.ok) return r4;
        }

        return { ok: true };;
    }

    //INGRESOS EGRESOS
    function validarIngresosEgresos() {
        const i = formState.ingresosEgresos;
        const msg = " - De la ficha INGRESOS Y EGRESOS";

        return validarReglas({
            tab: "ingresosEgresos",
            reglas: [
                { field: "#otrosIngresos", type: "text", value: i.otrosIngresos, message: "Ingrese otros ingresos" + msg, allowZero: true },
                { field: "#otrosPrestamos", type: "text", value: i.otrosPrestamos, message: "Ingrese otros préstamos" + msg, allowZero: true },
                { field: "#totalActivos", type: "text", value: i.totalActivos, message: "Ingrese total activos" + msg, allowZero: true },
                { field: "#totalPasivos", type: "text", value: i.totalPasivos, message: "Ingrese total pasivos" + msg, allowZero: true },
                { field: "#totalPatrimonio", type: "text", value: i.totalPatrimonio, message: "Ingrese total patrimonio" + msg, allowZero: true }
            ]
        });
    }



    //CONYUGUE
    function validarConyugue() {
        const estadoCivil = formState?.otrosDatos?.estadoCivil;
        if (!["C", "V"].includes(estadoCivil)) {
            return { ok: true };
        }

        const c = formState.conyugue;
        const msg = " - De la ficha CÓNYUGUE";

        return validarReglas({
            tab: "conyugue",
            reglas: [
                { field: "#fechaExpedicionConyugue", type: "text", value: c.fechaExpedicionConyugue, message: "Ingrese fecha expedición cónyugue" + msg },
                { field: "#primerNombreConyugue", type: "text", value: c.primerNombreConyugue, message: "Ingrese primer nombre cónyugue" + msg },
                { field: "#primerApellidoConyugue", type: "text", value: c.primerApellidoConyugue, message: "Ingrese primer apellido cónyugue" + msg },
                { field: "#tipoDocumentoConyugue", type: "select", value: c.tipoDocumentoConyugue, message: "Ingrese tipo documento cónyugue" + msg },
                { field: "#documentoConyugue", type: "text", value: c.documentoConyugue, message: "Ingrese documento cónyugue" + msg },
                { field: "#paisNacimientoConyugue", type: "select", value: c.paisNacimientoConyugue, message: "Ingrese país nacimiento cónyugue" + msg },
                { field: "#departamentoNacimientoConyugue", type: "select", value: c.departamentoNacimientoConyugue, message: "Ingrese departamento nacimiento cónyugue" + msg },
                { field: "#ciudadNacimientoConyugue", type: "select", value: c.ciudadNacimientoConyugue, message: "Ingrese ciudad nacimiento cónyugue" + msg },
                { field: "#tipoDireccionConyugue", type: "select", value: c.tipoDireccionConyugue, message: "Ingrese tipo dirección cónyugue" + msg },
                { field: "#complementoDireccionConyugue", type: "text", value: c.complementoDireccionConyugue, message: "Ingrese complemento dirección cónyugue" + msg },
                { field: "#fechaNacimientoConyugue", type: "text", value: c.fechaNacimientoConyugue, message: "Ingrese fecha nacimiento cónyugue" + msg },
                { field: "#telefonoConyugue", type: "text", value: c.telefonoConyugue, message: "Ingrese teléfono cónyugue" + msg },
                { field: "#celularConyugue", type: "text", value: c.celularConyugue, message: "Ingrese celular cónyugue" + msg },
                { field: "#tipoContratoConyugue", type: "select", value: c.tipoContratoConyugue, message: "Ingrese tipo contrato cónyugue" + msg },
                { field: "#emailConyugue", type: "email", value: c.emailConyugue, message: "Ingrese email válido de cónyugue" + msg },
                { field: "#paisEmpresaConyugue", type: "select", value: c.paisEmpresaConyugue, message: "Ingrese país empresa cónyugue" + msg },
                { field: "#departamentoEmpresaConyugue", type: "select", value: c.departamentoEmpresaConyugue, message: "Ingrese departamento empresa cónyugue" + msg },
                { field: "#ciudadEmpresaConyugue", type: "select", value: c.ciudadEmpresaConyugue, message: "Ingrese ciudad empresa cónyugue" + msg },
                { field: "#cargoConyugue", type: "select", value: c.cargoConyugue, message: "Ingrese cargo cónyugue" + msg },
                { field: "#generoConyugue", type: "select", value: c.generoConyugue, message: "Ingrese género cónyugue" + msg }
            ]
        });
    }

    //MANEJO DE CONDICIONES PARA TABS DINAMICAS ---------------------------------------------------------------------
    $(document).on("change", "#tipoDocumento", function () {
        evaluarTabsDinamicas();
    });
    $(document).on("change", "#estadoCivil", function () {
        evaluarTabsDinamicas();
    });
    $(document).on("change", "#esPep", function (e) {
        evaluarTabsDinamicas();
        if (!e.originalEvent) return;
        if (this.value === "S") {
            infoModal("Usted es una persona expuesta políticamente y de acuerdo al decreto 830 del 26 de julio de 2021, las Personas Expuestas Políticamente deberán, declarar los nombres e identificación de las personas con las que tengan sociedad conyugal, de hecho, o de derecho, los nombres e identificación de sus familiares hasta segundo grado de consanguinidad", "informacion");
            return [];
        }
    });

    //MOSTRAR TAB OTROS DATOS ADICIONALES
    function evaluarTabsDinamicas() {
        const tipoDocumento = formState?.datosPersonales?.tipoDocumento;
        const estadoCivil = formState?.otrosDatos?.estadoCivil;
        const politicamenteExpuesto = formState?.otrosDatos?.esPep;

        const esApoderado = ["T", "R"].includes(tipoDocumento);
        const esJuridica = tipoDocumento === "N";
        const mostrarOtrosDatos = esApoderado || esJuridica;

        const tieneConyugue = ["C", "V"].includes(estadoCivil);
        const esPeps = politicamenteExpuesto === "S";
        $("#tab-otrosDatosAdicionales").toggle(mostrarOtrosDatos);
        $("#tab-conyugue").toggle(tieneConyugue);
        $("#tab-familiaresPeps").toggle(esPeps);
    }

    //EVALUAR CONTENIDO OTROS DATOS ADICIONALES
    function evaluarContenidoOtrosDatosAdicionales() {
        const tipoDocumento = formState.datosPersonales.tipoDocumento;
        const esApoderado = ["T", "R"].includes(tipoDocumento);
        const esJuridica = tipoDocumento === "N";
        $("#apoderadoAsociado").toggle(esApoderado);
        $("#personaJuridica").toggle(esJuridica);
        $("#datosRepresentanteLegal").toggle(esJuridica);
    }

    //MANEJO DE LOS CAMPOS DEPENDIENTES PARA ESTAR O NO ESTAR HABILITADOS (pruebas)----------------------------------------------------------------

    $(document).on("change", "#familiarEmpleadoEntidad", function () {
        validarCamposDeshabilitados();
    });

    $(document).on("change", "#familiarRecursosPublicos", function () {
        validarCamposDeshabilitados();
    });

    $(document).on("change", "#familiarPublicamenteExpuesto", function () {
        validarCamposDeshabilitados();
    });

    $(document).on("change", "#operacionesMonedaExtranjera", function(){
        validarCamposDeshabilitados();
    });

    $(document).on("change", "#poseeCuentasMonedaExtranjera", function(){
        validarCamposDeshabilitados();
    });
    $(document).on("change", "#esPep", function(){
        validarCamposDeshabilitados();
    });
    $(document).on("change", "#administraRecursosPublicos", function(){
        validarCamposDeshabilitados();
    });

    $(document).on("change", "#tipoContrato", function () {
        if (this.value !== "N") {
            marcarCampoRequired("#pagaduria", true);
        }
        else {
            marcarCampoRequired("#pagaduria", false);
        }
    });

    function marcarCampoRequired(selector, requerido) {
        const $campo = $(selector);
        if (!$campo.length) return;

        $campo.prop("required", requerido);

        if (!requerido) {
            $campo.removeClass("is-invalid");
        }
    }

    function marcarCamposDeshabilitados(selectores, deshabilitado) {
        selectores.forEach(selector => {
            const $campo = $(selector);
            if (!$campo.length) return;

            $campo.prop("disabled", deshabilitado);
            $campo.css("background-color", deshabilitado ? "#e9ecef" : "#fff");
            //PRUEBA DE VACIADO TODO
            $campo.val("");
        });
    }

    function validarCamposDeshabilitados() {

        //REALIZA OPERACIONES EN MONEDA EXTRANJERA
        const realizaOperacionesMonedaExtranjera = formState.otrosDatos.operacionesMonedaExtranjera;
        const habilitarMonedaExtranjera = realizaOperacionesMonedaExtranjera == "S"
        const campoOperacionMonedaExtranjera = ["#cualesOperacionesMonedaExtranjera"];
        marcarCamposDeshabilitados(campoOperacionMonedaExtranjera, !habilitarMonedaExtranjera);
        campoOperacionMonedaExtranjera.forEach(id =>{
            marcarCampoRequired(id, habilitarMonedaExtranjera)
        });

        //POSEE CUENTAS EN MONEDA EXTRANJERA
        const tieneCuentaMonedaExtranjera = formState.otrosDatos.poseeCuentasMonedaExtranjera;
        const habilitarCuentaMonedaExtranjera = tieneCuentaMonedaExtranjera == "S"
        const camposMonedaExtranjera = [
            "#paisMonedaExtranjera",
            "#ciudadMonedaExtranjera",
            "#monedaExtranjera",
            "#bancoMonedaExtranjera",
            "#numeroCuentaMonedaExtranjera"
        ];

        marcarCamposDeshabilitados(camposMonedaExtranjera, !habilitarCuentaMonedaExtranjera);
        camposMonedaExtranjera.forEach(id=>{
            marcarCampoRequired(id, habilitarCuentaMonedaExtranjera)
        });

        //ES PEP
        const esPep = formState.otrosDatos.esPep;
        const habilitarTipoPep = esPep == "S"
        const campoTipoPep = ["#tipoPep", "#administraRecursosPublicos"];
        marcarCamposDeshabilitados(campoTipoPep, !habilitarTipoPep);
        campoTipoPep.forEach(id=>{
            marcarCampoRequired(id, habilitarTipoPep)
        });


        //FAMILIAR EMPLEADO ENTIDAD OTROS DATOS
        const familiarEmpleadoEntidad = formState.otrosDatos.familiarEmpleadoEntidad;
        const habilitarFamiliarEmpleadoEntidad = familiarEmpleadoEntidad === "S";
        const camposFamiliarEmpleadoEntidad = [
            "#identificacionEmpleadoEntidad",
            "#tipoIdentificacionEmpleadoEntidad",
            "#primerNombreEmpleadoEntidad",
            "#segundoNombreEmpleadoEntidad",
            "#primerApellidoEmpleadoEntidad",
            "#segundoApellidoEmpleadoEntidad",
            "#parentescoEmpleadoEntidad",
            "#desdeCuandoFamiliarEmpleadoEntidad",
            "#hastaCuandoFamiliarEmpleadoEntidad"
        ];

        marcarCamposDeshabilitados(camposFamiliarEmpleadoEntidad, !habilitarFamiliarEmpleadoEntidad);
        camposFamiliarEmpleadoEntidad.forEach(id => {
            marcarCampoRequired(id, habilitarFamiliarEmpleadoEntidad);
        });


        //FAMILIAR RECURSOS PUBLICOS OTROS DATOS
        const familiarRecursosPublicos = formState.otrosDatos.familiarRecursosPublicos;
        const habilitarFamiliarRecursosPublicos = familiarRecursosPublicos === "S";
        const camposFamiliarRecursosPublicos = [
            "#identificacionFamiliarRecursosPublicos",
            "#tipoIdentificacionFamiliarRecursosPublicos",
            "#primerNombreFamiliarRecursosPublicos",
            "#segundoNombreFamiliarRecursosPublicos",
            "#primerApellidoFamiliarRecursosPublicos",
            "#segundoApellidoFamiliarRecursosPublicos",
            "#parentescoFamiliarRecursosPublicos",
            "#cargoFamiliarRecursosPublicos",
            "#desdeCuandoFamiliarRecursosPublicos",
            "#hastaCuandoFamiliarRecursosPublicos",
            "#nombreEntidadFamiliarRecursosPublicos"
        ];

        marcarCamposDeshabilitados(camposFamiliarRecursosPublicos, !habilitarFamiliarRecursosPublicos);
        camposFamiliarRecursosPublicos.forEach(id => {
            marcarCampoRequired(id, habilitarFamiliarRecursosPublicos);
        });

        //FAMILIAR PUBLICAMENTE EXPUESTO OTROS DATOS
        const familiarPublicamenteExpuesto = formState.otrosDatos.familiarPublicamenteExpuesto;
        const habilitarFamiliarPublicamenteExpuesto = familiarPublicamenteExpuesto === "S";
        const camposFamiliarPublicamenteExpuesto = [
            "#identificacionFamiliarPublicamenteExpuesto",
            "#tipoIdentificacionFamiliarPublicamenteExpuesto",
            "#primerNombreFamiliarPublicamenteExpuesto",
            "#segundoNombreFamiliarPublicamenteExpuesto",
            "#primerApellidoFamiliarPublicamenteExpuesto",
            "#segundoApellidoFamiliarPublicamenteExpuesto",
            "#parentescoFamiliarPublicamenteExpuesto",
            "#desdeCuandoFamiliarPublicamenteExpuesto",
            "#hastaCuandoFamiliarPublicamenteExpuesto"
        ];

        marcarCamposDeshabilitados(camposFamiliarPublicamenteExpuesto, !habilitarFamiliarPublicamenteExpuesto);
        camposFamiliarPublicamenteExpuesto.forEach(id => {
            marcarCampoRequired(id, habilitarFamiliarPublicamenteExpuesto);
        });


        //ADMINISTRA RECURSOS PUBLICOS
        const administraRecursosPublicos = formState.otrosDatos.administraRecursosPublicos;
        const habilitarAdministraRecursos = administraRecursosPublicos == "S"
        const camposAdminitraRecursos = [
            "#nombreEntidadAdministraRecursosPublicos",
            "#cargoAdministraRecursosPublicos",
            "#fechaViculacionRecursosPublicos",
            "#fechaRetiroRecursosPublicos"
        ];
        marcarCamposDeshabilitados(camposAdminitraRecursos, !habilitarAdministraRecursos);
        camposAdminitraRecursos.forEach(id =>{
            marcarCampoRequired(id, habilitarAdministraRecursos);
        });
        
    }

    //FUNCION DE MODAL CON INFORMACION
       function infoModal(mensaje, tipo, onClose = null) {
         const configPorTipo = {
            informacion: {
                color: "#3beaf6",
                icono: "i",
                tituloDefault: "Información"
            },
            alerta: {
                color: "#f0ad4e",
                icono: "!",
                tituloDefault: "Alerta"
            },
            exito: {
                color: "#22c55e",
                icono: "✓",
                tituloDefault: "Éxito"
            },
            falla: {
                color: "#dc3545",
                icono: "×",
                tituloDefault: "Error"
            }
        };
        const config= configPorTipo[tipo] || configPorTipo["informacion"];
        const modalHTML = `
            <div class="modal fade app-modal " id="infoModalTemp" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered" style="max-width: 650px; max-height: 580px;">
                    <div class="modal-content app-modal__content">

                        <div class="app-modal__header justify-content-center border-0 pb-0">
                            <div style="
                                width: 64px;
                                height: 64px;
                                border-radius: 50%;
                                border: 3px solid ${config.color};
                                color: ${config.color};
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 2rem;
                                font-weight: 700;
                                line-height: 1;
                            ">
                                ${config.icono}
                            </div>
                        </div>

                        <div class="app-modal__body text-center pt-3" style ="font-size: 25px;">
                            ${mensaje}
                        </div>

                        <div class="app-modal__footer justify-content-center border-0 pt-0">
                            <button type="button" class="app-button" data-bs-dismiss="modal">
                                Aceptar
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        `;

        $("body").append(modalHTML);

        const $modalElement = $("#infoModalTemp");
        const modal = new bootstrap.Modal($modalElement[0]);
        modal.show();

        $modalElement.on("hidden.bs.modal", function () {
            if (typeof onClose === "function") {
                onClose();
            }
            $(this).remove();
        });
    }


    // AUTORIZACIONES ------------------------------------------------------------------------------------------------------------------
    async function cargarAutorizacionesBackend() {
        try {
            const response = await fetch("/actualizaciondatos/autorizaciones");
            if (!response.ok) {
                console.error("Error al obtener autorizaciones:", response.statusText);
                return [];
            }
            const resData = await response.json();

            if (resData) {
                return resData;
            } else {
                return [];
            }
        } catch (error) {
            console.error("Excepción cargando autorizaciones del backend:", error);
        }
    }


    let autorizaciones = [];
    async function initAutorizaciones() {
        const $contenedorAutorizaciones = $("#autorizaciones-content");
        if (!$contenedorAutorizaciones.length) return;
        autorizaciones = await cargarAutorizacionesBackend();
        if (!Array.isArray(autorizaciones)) return;
        $contenedorAutorizaciones.empty();
        autorizaciones.forEach(aut => {
            if (!aut.activo) return;

            const autorizada = Boolean(formState.autorizaciones?.[aut.codigo]);
            const marcaObligatorio = aut.obligatorio
                ? '<span class="text-danger">*</span>'
                : '';

            const html = `
            <div class="col-12 mb-4 autorizacion-item"
                data-codigo="${aut.codigo}">
            <div class="app-paper elevation-2 h-100 d-flex flex-column p-3">
                <h6 class="table-headers">
                ${aut.nombre} ${marcaObligatorio}
                </h6>
                <p class="table-body mb-2">
                ${aut.descripcion}
                </p>
                <div class="mt-auto">
                <div class="form-check form-switch">
                    <input class="form-check-input autorizacion-switch"
                        type="checkbox"
                        id="switch-${aut.codigo}"
                        data-codigo="${aut.codigo}"
                        ${autorizada ? 'checked' : ''}
                        ${aut.obligatorio ? 'required' : ''}>
                    <label class="form-check-label"
                        for="switch-${aut.codigo}">
                    Autorizo
                    </label>
                </div>
                </div>
            </div>
            </div>
        `;

            $contenedorAutorizaciones.append(html);
        });
    }

    //GUARDAR LA AUTORIZACION EN EL FORMSTATE UNA VEZ SE MARCA COMO AUTORIZADA
    $(document).on("change", ".autorizacion-switch", function () {
        const codigo = $(this).data("codigo");

        if (!codigo) return;

        formState.autorizaciones[codigo] = $(this).is(":checked");

        if (!modificado) {
            modificado = true;
        }
    });


    // ADJUNTOS
    async function cargarAdjuntosBackend() {
        try {
            const response = await fetch('/actualizaciondatos/adjuntos');
            if (!response.ok) {
                console.error('Error al obtener adjuntos:', response.statusText);
                return { totalCatalogo: 0, items: [] };
            }

            return await response.json();
        } catch (error) {
            console.error('Excepción cargando adjuntos:', error);
            return { totalCatalogo: 0, items: [] };
        }
    }

    function formatearNombreAdjunto(nombre) {
        const texto = String(nombre ?? "").trim().toLowerCase();
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    //INICA LOS ADJUNTOS, TOMA LA INFO DEL BACKEND Y LA RENDERIZA EN LA VISTA UNA VEZ SE INGRESA AL TAB
    async function initAdjuntos() {
        const $contenedorAdjuntos = $("#adjuntos-content");
        if (!$contenedorAdjuntos.length) return;

        const data = await cargarAdjuntosBackend();
        const adjuntos = Array.isArray(data.items) ? data.items : [];

        $contenedorAdjuntos.empty();

        adjuntos.forEach((adj, index) => {
            const posicion = index + 1;
            const marcaObligatorio = adj.obligatorio
                ? '<span class="text-danger">*</span>'
                : '';

            const html = `
            <div class="col-12 col-md-6 col-lg-4 mb-4 adjunto-item" data-codigo="${adj.codigo}">
                <div class="app-paper elevation-4 h-100 d-flex flex-column p-3">
                    <h6 class="table-headers">
                        ${formatearNombreAdjunto(adj.nombre)} ${marcaObligatorio}
                    </h6>
                    <small class="text-muted mb-2">${adj.descripcion}</small>
                    <div class="mt-auto">
                        <input type="hidden" name="codadjunto${posicion}" value="${adj.codadjunto}">
                        <input type="hidden" name="codnomadjunto${posicion}" value="${adj.codnomadjunto}">
                        <input type="file"
                            name="txtadjunto${posicion}"
                            id="txtadjunto${posicion}"
                            class="form-control form-control-sm adjuntospintados"
                            ${adj.obligatorio ? 'required' : ''}>
                    </div>
                </div>
            </div>
        `;

            $contenedorAdjuntos.append(html);
        });
    }


    // OTROS DATOS, SE USA PARA EL MODAL DE GRUPO PROTECCION
    function initOtrosDatos() {
        const $contenedorOtrosDatos = $("#otrosDatos");
        if (!$contenedorOtrosDatos.length) return;

        const $checkOtro = $("#checkOtro");
        const $inputExtra = $("#inputExtra");
        const $textoOtro = $("#textoOtro");

        $contenedorOtrosDatos
            .off("click.otrosDatos", "#btnGrupoProteccion")
            .on("click.otrosDatos", "#btnGrupoProteccion", function () {
                $("#modalGrupoProteccion").modal("show");
            });

        $contenedorOtrosDatos
            .off("change.otrosDatos", "#checkOtro")
            .on("change.otrosDatos", "#checkOtro", function () {
                $inputExtra.toggle(this.checked);
                if (!this.checked) $textoOtro.val("");
            });

        $contenedorOtrosDatos
            .off("click.otrosDatos", "#btnAceptarGrupoProteccion")
            .on("click.otrosDatos", "#btnAceptarGrupoProteccion", function () {

                if ($checkOtro.is(":checked") && !$textoOtro.val().trim()) {
                    alert("Especifique el grupo de protección");
                    $textoOtro.focus();
                    return;
                }

                $("#modalGrupoProteccion").modal("hide");
            });
    }



    //PERSONAS A CARGO
    let peopleInChargeReal = [];
    let peopleInChargeNew = [];

    //TRAE LA INFORMACION DE LAS PERSONAS A CARGO (YA MAPEADA)
    async function cargarPersonasACargoBackend() {
        try {
            const response = await fetch(`/actualizaciondatos/personasCargo`);
            if (!response.ok) {
                console.error("Error al obtener personas a cargo:", response.statusText);
                return [];
            }
            const resData = await response.json();

            if (resData) {
                return resData;
            } else {
                return [];
            }
        } catch (error) {
            console.error("Excepción cargando personas a cargo del backend:", error);
            return [];
        }
    }

    //INICIALIZA TODA LA SECUENCIA DE CARGADO
    async function initPersonasACargo() {
        peopleInChargeReal = await cargarPersonasACargoBackend();
        renderPeopleInChargeReal();
        renderPeopleInChargeNew();
    }

    //RENDERIZAR LAS PERSONAS A CARGO EXISTENTES
    function renderPeopleInChargeReal() {
        const $peopleInChargeReal = $("#list-peopleincharge-real");
        $peopleInChargeReal.empty();
        if (!peopleInChargeReal || peopleInChargeReal.length === 0) {
            $peopleInChargeReal.append(
                `<div class="fw-bold text-center" style="padding-top: 50px; padding-bottom: 20px;">
                        Actualmente no hay personas en cargo registradas en la entidad
                    </div>`
            );
            return;
        }
        $peopleInChargeReal.append(`
          <p class="text-left">
                <div>
                    <h3>Personas a cargo registradas</h3>
                    <span>Nota: Personas a cargo registradas actualmente en la entidad</span>
                </div>
                </p>
                <section class="row mb-2 fw-bold text-center d-none d-md-flex border-bottom pb-2 table-headers">
                    <div class="col-md-4">Cedula</div>
                    <div class="col-md-4">Nombres</div>
                    <div class="col-md-4">Editar</div>
                </section>
        `);
        $.each(peopleInChargeReal, function (_, peopleCharge) {
            $peopleInChargeReal.append(
                `<div class="app-paper elevation-3 p-3 mb-3">
                <div class="row align-items-center text-md-center">
                    <div class="col-12 col-md-4">
                        <span class="d-md-none fw-bold">Cedula</span>
                        ${peopleCharge.identification}
                    </div>
                    <div class="col-12 col-md-4">
                        <span class="d-md-none fw-bold">Nombres</span>
                        ${peopleCharge.fullNames}
                    </div>
                    <div
                        class="col-12 col-md-4 mt-3 mt-md-0 d-flex flex-row justify-content-center gap-2 text-md-center">
                        <button type="button" class="app-button app-btn--warning w-75 btn-cambiar mb-2"
                            data-id="${peopleCharge.id}" data-source="real" data-bs-toggle="modal"
                            data-bs-target="#modalAgregarPersonaACargo" id="btnEditarPersonaACargo">
                            <i class="material-icons">edit</i>
                        </button>
                    </div>
                </div>
            </div>`
            );
        });
    }

    //RENDERIZAR LAS NUEVAS PERSONAS A CARGO AGREGADAS
    function renderPeopleInChargeNew() {
        const $peopleInChargeNew = $("#list-peopleincharge-new");
        $peopleInChargeNew.empty();
        if (!peopleInChargeNew || peopleInChargeNew.length === 0) {
            return;
        }
        $peopleInChargeNew.append(`
                <p class="text-left">
                <div>
                    <h3>Personas a cargo nuevas/editadas</h3>
                    <span>Nota: Personas a cargo que se agregarán o editaran en la entidad</span>
                </div>
                </p>
                <section class="row mb-2 fw-bold text-center d-none d-md-flex border-bottom pb-2 table-headers">
                    <div class="col-md-2">Cedula</div>
                    <div class="col-md-3">Nombres completos</div>
                    <div class="col-md-2">Parentesco</div>
                    <div class="col-md-2">Genero</div>
                    <div class="col-md-3">Acciones</div>
                </section>
        `);
        $.each(peopleInChargeNew, function (_, peopleInCharge) {
            $peopleInChargeNew.append(
                `<div class="app-paper elevation-3 p-3 mb-3">
                <div class="row align-items-center text-md-center">
                    <!-- CEDULA -->
                    <div class="col-12 col-md-2">
                        <span class="d-md-none fw-bold">Cedula</span>
                        ${peopleInCharge.identification}
                    </div>

                    <!-- NOMBRES COMPLETOS -->
                    <div class="col-12 col-md-3">
                        <span class="d-md-none fw-bold">Nombres</span>
                        ${peopleInCharge.fullNames}
                    </div>

                    <!-- PARENTESCO -->
                    <div class="col-12 col-md-2">
                        <span class="d-md-none fw-bold">Parentesco</span>
                        ${peopleInCharge.parentesco}
                    </div>

                    <!-- GENERO -->
                    <div class="col-12 col-md-2">
                        <span class="d-md-none fw-bold">Genero</span>
                        ${peopleInCharge.genero}
                    </div>

                    <!-- ACCIONES -->
                    <div
                        class="col-12 col-md-3 mt-3 mt-md-0 d-flex flex-row justify-content-center gap-2 text-md-center">
                        <button type="button" class="app-button app-btn--warning w-75 btn-cambiar mb-2"
                            data-id="${peopleInCharge.id}" data-source="new" data-bs-toggle="modal"
                            data-bs-target="#modalAgregarPersonaACargo" id="btnEditarPersonaACargo">
                            <i class="material-icons">edit</i>
                        </button>
                        <button type="button" class="app-button app-btn--danger w-75 btn-cambiar mb-2"
                            data-id="${peopleInCharge.id}" data-source="new" data-bs-toggle="modal"
                            data-bs-target="#modalEliminarPersonaACargo" id="btnEliminarPersonaACargo">
                            <i class="material-icons">delete</i>
                        </button>
                    </div>
                </div>
            </div>`
            );
        });
    }

    //ID COUNTER PARA NUEVAS PERSONAS A CARGO
    let peopleInChargeIdCounter = Math.max(
        ...peopleInChargeReal.map(r => r.id),
        0
    ) + 1;

    //AGREGAR PERSONA A CARGO NUEVA O EDITADA
    $(document).on('submit', '#formAgregarPersonaACargo', function (e) {
        e.preventDefault();
        const $form = $(this);
        const modo = $form.data('modo');
        const id = $form.data('id');
        const source = $form.data('source');
        const identificationPeopleInCharge = $('#numeroDocumentoPersonaACargo').val().trim();

        const nuevaPersonaACargo = {
            id: null,
            originalId: source === 'real' ? id : null,
            identification: identificationPeopleInCharge,
            tipoDocumento: $('#tipoDocumentoPersonaACargo').val().trim(),
            fullNames: $('#nombresPersonaACargo').val().trim(),
            parentesco: $('#parentescoPersonaACargo').val(),
            genero: $('#generoPersonaACargo').val().trim(),
            fechaNacimiento: $('#fechaNacimientoPersonaACargo').val().trim()
        };
        if (!identificationPeopleInCharge || !nuevaPersonaACargo.fullNames) {
            alert('Debe completar los campos obligatorios');
            return;
        }
        if (modo === 'editar') {
            let index = -1;
            if (source === 'new') {
                index = peopleInChargeNew.findIndex(r => r.id === id);
            } else if (source === 'real') {
                index = peopleInChargeNew.findIndex(r => r.originalId === id);
            }

            if (index !== -1) {
                nuevaPersonaACargo.id = peopleInChargeNew[index].id;
                nuevaPersonaACargo.originalId = peopleInChargeNew[index].originalId;
                peopleInChargeNew[index] = nuevaPersonaACargo;
                modificado = true;
            } else {
                nuevaPersonaACargo.id = peopleInChargeIdCounter++;
                peopleInChargeNew.push(nuevaPersonaACargo);
                modificado = true;
            }
        }
        else {
            const existeEnReal = peopleInChargeReal.some(r =>
                r.identification === identificationPeopleInCharge
            );
            if (existeEnReal) {
                alert('Ya existe una persona a cargo con esa identificación.');
                return;
            }
            const existeEnNew = peopleInChargeNew.some(r =>
                r.identification === identificationPeopleInCharge
            );
            if (existeEnNew) {
                alert('Ya existe una persona a cargo con esa identificación.');
                return;
            }
            nuevaPersonaACargo.id = peopleInChargeIdCounter++;
            nuevaPersonaACargo.originalId = null;
            peopleInChargeNew.push(nuevaPersonaACargo);
            modificado = true;
        }
        renderPeopleInChargeNew();
        $form.removeData('modo id source');
        $form.trigger('reset');
        const $modal = $('#modalAgregarPersonaACargo');
        const $submitBtn = $modal.find('button[type="submit"]');
        $submitBtn.text('Agregar persona a cargo');
        $modal.modal('hide');
    });

    //EDITAR PERSONA A CARGO
    $(document).on('click', '#btnEditarPersonaACargo', function () {

        const id = Number($(this).data('id'));
        const source = $(this).data('source');
        let peopleInCharge;
        if (source === 'real') {
            peopleInCharge = peopleInChargeReal.find(r => r.id === id);
        } else {
            peopleInCharge = peopleInChargeNew.find(r => r.id === id);
        }
        if (!peopleInCharge) return;

        $('#formAgregarPersonaACargo').data('modo', 'editar');
        $('#formAgregarPersonaACargo').data('id', id);
        $('#formAgregarPersonaACargo').data('source', source);

        $('#tipoDocumentoPersonaACargo').val(peopleInCharge.tipoDocumento);
        $('#numeroDocumentoPersonaACargo').val(peopleInCharge.identification);
        $('#nombresPersonaACargo').val(peopleInCharge.fullNames);
        $('#parentescoPersonaACargo').val(peopleInCharge.parentesco);
        $('#generoPersonaACargo').val(peopleInCharge.genero);
        $('#fechaNacimientoPersonaACargo').val(peopleInCharge.fechaNacimiento);

        const $modal = $('#modalAgregarPersonaACargo');
        const $submitBtn = $modal.find('button[type="submit"]');
        $submitBtn.text('Guardar cambios');
    });

    //ABRIR MODAL ELIMINAR PERSONA A CARGO
    $(document).on('click', '#btnEliminarPersonaACargo', function () {
        const id = $(this).data('id');
        const personaACargo = peopleInChargeNew.find(p => p.id === id);

        if (!personaACargo) return;

        $('#mensajeModalEliminarPersonaACargo')
            .text(`¿Está seguro de eliminar la persona a cargo: ${personaACargo.fullNames}?`);

        $('#btnAceptarEliminarPersonaACargo').data('id', id);

        $('#modalEliminarPersonaACargo').modal('show');
    });

    //CONFIRMAR ELIMINAR PERSONA A CARGO
    $(document).on('click', '#btnAceptarEliminarPersonaACargo', function () {
        const idAEliminar = $(this).data('id');
        peopleInChargeNew = peopleInChargeNew.filter(r => r.id !== idAEliminar);
        renderPeopleInChargeNew();
        const modalElement = document.getElementById('modalEliminarPersonaACargo');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
        guardarSessionStorage();

    });






    //LOGICA PARA REFERENCIAS

    //FUNCIONES PARA EL EFECTO CASCADA DE LOS COMBOS EN EL MODAL DE EDITAR REFERENCIA, YA QUE ESTOS NO SE CARGAN DIRECTAMENTE AL ENTRAR EN LA TAB, DEPENDENDEN DE LA REFERENCIA SELECCIONADA Y SU INFORMACION
    function resetCombosReferencia() {
        $('#paisReferencia').val('');
        $('#departamentoReferencia').html('<option value=""></option>').val('');
        $('#ciudadReferencia').html('<option value=""></option>').val('');
        $('#zonaReferencia').html('<option value=""></option>').val('');
        $('#comunaReferencia').html('<option value=""></option>').val('');
        $('#barrioReferencia').html('<option value=""></option>').val('');
    }
    async function cargarCombosReferencia(selector, value, timeout = 3000) {
        if (!value) {
            $(selector).val("").trigger("change");
            return;
        }
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const $select = $(selector);
            const exists = $select.find(`option[value="${value}"]`).length > 0;

            if (exists) {
                $select.val(value).trigger("change");
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        return false;
    }


    let referencesNew = [];
    let referencesReal = [];

    //TRAER REFERENCIAS BACKEND YA MAPEADAS
    async function cargarReferenciasBackend() {
        try {
            const response = await fetch(`/actualizaciondatos/referencias`);
            if (!response.ok) {
                console.error("Error al obtener referencias:", response.statusText);
                return [];
            }
            const resData = await response.json();

            if (resData) {
                return resData;
            } else {
                return [];
            }
        } catch (error) {
            console.error("Excepción cargando referencias del backend:", error);
            return [];
        }
    }

    //INICIALIZA TODA LA SECUENCIA DE CARGADO
    async function initReferencias() {
        referencesReal = await cargarReferenciasBackend();
        actualizarContadorReferencias();
        renderReferences();
        renderReferencesNew();
    }

    //RENDERIZAR LAS REFERENCIAS EXISTENTES 
    function renderReferences() {
        const $referencesReal = $('#list-references-real');
        $referencesReal.empty();
        if (!referencesReal || referencesReal.length === 0) {
            $referencesReal.append(
                `<div class="fw-bold text-center" style="padding-top: 50px; padding-bottom: 20px;">
                        Actualmente no hay referencias registradas en la entidad
                </div>`
            );
            return;
        }
        $referencesReal.append(`
          <p class="text-left">
                <div>
                    <h3>Referencias registradas</h3>
                    <span>Nota: Referencias registradas actualmente en la entidad</span>
                </div>
                </p>
                <section class="row mb-2 fw-bold text-center d-none d-md-flex border-bottom pb-2 table-headers">
                    <div class="col-md-4">Cedula</div>
                    <div class="col-md-4">Nombres</div>
                    <div class="col-md-4">Editar</div>
                </section>
        `);
        $.each(referencesReal, function (_, reference) {
            $referencesReal.append(
                `<div class="app-paper elevation-3 p-3 mb-3">
                <div class="row align-items-center text-md-center">
                    <div class="col-12 col-md-4">
                        <span class="d-md-none fw-bold">Cedula</span>
                        ${reference.identification}
                    </div>
                    <div class="col-12 col-md-4">
                        <span class="d-md-none fw-bold">Nombres completos</span>
                        ${reference.fullNames}
                    </div>
                    <div class="col-12 col-md-4 mt-3 mt-md-0 d-flex flex-row justify-content-center gap-2 text-md-center">
                        <button type="button" class="app-button app-btn--warning w-75 btn-cambiar mb-2" data-id="${reference.id}" data-source="real" data-bs-toggle="modal" data-bs-target="#modalAgregarReferencia" id="btnEditarReferencia">
                            <i class="material-icons">edit</i>
                        </button>
                    </div>

                </div>
            </div>`
            );
        });
    }

    //RENDERIZAR LAS NUEVAS REFERENCIAS AGREGADAS O EDITADAS
    function renderReferencesNew() {
        const $referencesNew = $('#list-references-new');
        $referencesNew.empty();
        if (!referencesNew || referencesNew.length === 0) {
            return;
        }
        $referencesNew.append(`
                <p class="text-left">
                <div>
                    <h3>Referencias Nuevas</h3>
                    <span>Nota: Referencias que se agregarán o editaran en la entidad</span>
                </div>
                </p>
                <section class="row mb-2 fw-bold text-center d-none d-md-flex border-bottom pb-2 table-headers">
                    <div class="col-md-2">Cedula</div>
                    <div class="col-md-3">Nombres completos</div>
                    <div class="col-md-2">Tipo de referencia</div>
                    <div class="col-md-2">Numero registrado</div>
                    <div class="col-md-3">Acciones</div>
                </section>
        `);
        $.each(referencesNew, function (_, reference) {
            $referencesNew.append(
                `<div class="app-paper elevation-3 p-3 mb-3">
                <div class="row align-items-center text-md-center">
                    <div class="col-12 col-md-2">
                        <span class="d-md-none fw-bold">Cedula</span>
                        ${reference.identification}
                    </div>
                    <div class="col-12 col-md-3">
                        <span class="d-md-none fw-bold">Nombres completos</span>
                        ${reference.fullNames}
                    </div>
                    <div class="col-12 col-md-2">
                        <span class="d-md-none fw-bold">Tipo de referencia</span>
                        ${reference.tipoReferencia}
                    </div>
                    <div class="col-12 col-md-2">
                        <span class="d-md-none fw-bold">Numero de contacto</span>
                        ${reference.telefono && reference.telefono.trim() !== ''
                    ? reference.telefono
                    : reference.celular && reference.celular.trim() !== ''
                        ? reference.celular
                        : 'Sin numero registrado'
                }
                    </div>
                    <div class="col-12 col-md-3 mt-3 mt-md-0 d-flex flex-row justify-content-center gap-2 text-md-center">
                        <button type="button" class="app-button app-btn--warning w-75 btn-cambiar mb-2" data-id="${reference.id}" data-source="new" data-bs-toggle="modal" data-bs-target="#modalAgregarReferencia" id="btnEditarReferencia">
                            <i class="material-icons">edit</i>
                        </button>
                        <button type="button" class="app-button app-btn--danger w-75 btn-cambiar mb-2" data-id="${reference.id}" data-source="new" data-bs-toggle="modal" data-bs-target="#modalEliminarReferencia" id="btnEliminarReferencia">
                            <i class="material-icons">delete</i>
                        </button>
                    </div>
                </div>
            </div>`
            );
        });
    }

    //ID COUNTER REFERENCIAS PARA MANTENER LA LOGICA DE LOS ID 
    let referenceIdCounter = 1;
    function actualizarContadorReferencias() {
        referenceIdCounter = Math.max(
            0,
            ...referencesReal.map(r => Number(r.id) || 0),
            ...referencesNew.map(r => Number(r.id) || 0)
        ) + 1;
    }

    //AGREGAR REFERENCIAS NUEVA O EDITADA
    $(document).on('submit', '#formAgregarReferencia', function (e) {
        e.preventDefault();
        const $form = $(this);
        const modo = $form.data('modo');
        const id = $form.data('id');
        const source = $form.data('source');
        const identification = $('#cedulaReferencia').val().trim();

        const nuevaReferencia = {
            id: null,
            originalId: source === 'real' ? id : null,
            tipoReferencia: $('#tipoReferencia').val(),
            identification: identification,
            fullNames: $('#nombresReferencia').val().trim(),
            parentesco: $('#parentescoReferencia').val(),
            pais: $('#paisReferencia').val(),
            departamento: $('#departamentoReferencia').val(),
            ciudad: $('#ciudadReferencia').val(),
            zona: $('#zonaReferencia').val(),
            comuna: $('#comunaReferencia').val(),
            barrio: $('#barrioReferencia').val(),
            direccion: $('#direccionReferencia').val().trim(),
            telefono: $('#telefonoReferencia').val().trim(),
            celular: $('#celularReferencia').val().trim(),
            trabajaEn: $('#trabajaEnReferencia').val().trim(),
            telefonoOficina: $('#telefonoOficinaReferencia').val().trim()
        };
        if (!identification || !nuevaReferencia.fullNames) {
            alert('Debe completar los campos obligatorios');
            return;
        }
        if (modo === 'editar') {
            let index = -1;
            if (source === 'new') {
                index = referencesNew.findIndex(r => r.id === id);
            } else if (source === 'real') {
                index = referencesNew.findIndex(r => r.originalId === id);
            }

            if (index !== -1) {
                nuevaReferencia.id = referencesNew[index].id;
                nuevaReferencia.originalId = referencesNew[index].originalId;
                referencesNew[index] = nuevaReferencia;
                modificado = true;
            } else {
                nuevaReferencia.id = referenceIdCounter++;
                referencesNew.push(nuevaReferencia);
                modificado = true;
            }
        }
        else {
            const existeEnReal = referencesReal.some(r =>
                r.identification === identification
            );
            if (existeEnReal) {
                alert('Ya existe una referencia con esa identificación.');
                return;
            }
            const existeEnNew = referencesNew.some(r =>
                r.identification === identification
            );
            if (existeEnNew) {
                alert('Ya existe una referencia nueva con esa identificación.');
                return;
            }
            nuevaReferencia.id = referenceIdCounter++;
            nuevaReferencia.originalId = null;
            referencesNew.push(nuevaReferencia);
            modificado = true;
        }
        renderReferencesNew();
        $form.removeData('modo id source');
        $form.trigger('reset');
        const $modal = $('#modalAgregarReferencia');
        const $submitBtn = $modal.find('button[type="submit"]');
        $submitBtn.text('Agregar referencia');
        $modal.modal('hide');
    });

    //EDITAR REFERENCIA
    $(document).on('click', '#btnEditarReferencia', async function () {

        const id = Number($(this).data('id'));
        const source = $(this).data('source');
        let referencia;
        if (source === 'real') {
            referencia = referencesReal.find(r => r.id === id);
        } else {
            referencia = referencesNew.find(r => r.id === id);
        }
        if (!referencia) return;

        $('#formAgregarReferencia').data('modo', 'editar');
        $('#formAgregarReferencia').data('id', id);
        $('#formAgregarReferencia').data('source', source);

        $('#tipoReferencia').val(referencia.tipoReferencia);
        $('#cedulaReferencia').val(referencia.identification);
        $('#nombresReferencia').val(referencia.fullNames);
        $('#parentescoReferencia').val(referencia.parentesco);
        $('#direccionReferencia').val(referencia.direccion);
        $('#telefonoReferencia').val(referencia.telefono);
        $('#celularReferencia').val(referencia.celular);
        $('#trabajaEnReferencia').val(referencia.trabajaEn);
        $('#telefonoOficinaReferencia').val(referencia.telefonoOficina);

        resetCombosReferencia();
        await cargarCombosReferencia('#paisReferencia', referencia.pais);
        await cargarCombosReferencia('#departamentoReferencia', referencia.departamento);
        await cargarCombosReferencia('#ciudadReferencia', referencia.ciudad);
        await cargarCombosReferencia('#zonaReferencia', referencia.zona);
        await cargarCombosReferencia('#comunaReferencia', referencia.comuna);
        await cargarCombosReferencia('#barrioReferencia', referencia.barrio);

        const $modal = $('#modalAgregarReferencia');
        const $submitBtn = $modal.find('button[type="submit"]');
        $submitBtn.text('Guardar cambios');
    });


    //MODAL PARA ELIMINAR REFERENCIA
    $(document).on('click', '#btnEliminarReferencia', function () {
        const id = $(this).data('id');
        const referencia = referencesNew.find(r => r.id === id);

        if (!referencia) return;

        $('#mensajeModalEliminarReferencia')
            .text(`¿Está seguro de eliminar la referencia ${referencia.fullNames}?`);

        $('#btnAceptarEliminarReferencia').data('id', id);

        $('#modalEliminarReferencia').modal('show');
    });

    //CONFIRMAR ELIMINAR REFERENCIA
    $(document).on('click', '#btnAceptarEliminarReferencia', function () {
        const idAEliminar = $(this).data('id');
        referencesNew = referencesNew.filter(r => r.id !== idAEliminar);
        renderReferencesNew();
        const modalElement = document.getElementById('modalEliminarReferencia');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
        guardarSessionStorage();
    });







    //LOGICA FAMILIARES PEPS

    //FAMILIARES PEPS
    let familiarPepsReal = [];
    let familiarPepsNew = [];

    //CARGAR DATOS DE LOS FAMILIARES PEPS YA MAPEADOS
    async function cargarFamiliaresPepsBackend() {
        try {
            const response = await fetch(`/actualizaciondatos/familiaresPeps`);
            if (!response.ok) {
                console.error("Error al obtener familiares peps:", response.statusText);
                return [];
            }
            const resData = await response.json();

            if (resData) {
                return resData;
            } else {
                return [];
            }
        } catch (error) {
            console.error("Excepción cargando familiares peps del backend:", error);
            return [];
        }
    }

    //INICIALIZA TODO EL FLUJO DE CARGADO
    async function initFamiliaresPeps() {
        familiarPepsReal = await cargarFamiliaresPepsBackend();
        renderFamiliarPepsReal();
        renderFamiliarPepsNew();
    }

    //RENDERIZAR FAMILIARES PEPS EXISTENTES
    function renderFamiliarPepsReal() {
        const $familiarPepsReal = $('#list-familiar-peps-real');
        $familiarPepsReal.empty();
        if (!familiarPepsReal || familiarPepsReal.length === 0) {
            $familiarPepsReal.append(
                `<div class="fw-bold text-center" style="padding-top: 50px; padding-bottom: 20px;">
                        Actualmente no hay familiares PEP'S registrados en la entidad
                </div>`
            );
            return;
        }
        $familiarPepsReal.append(`
                <p class="text-left">
                <div>
                    <h3>Familiares PEP'S</h3>
                    <span>Nota: Familiares PEP'S que se encuentran registrados actualmente en la entidad</span>
                </div>
                </p>
                <section class="row mb-2 fw-bold text-center d-none d-md-flex border-bottom pb-2 table-headers">
                    <div class="col-md-4">Cedula</div>
                    <div class="col-md-4">Nombres</div>
                    <div class="col-md-4">Acciones</div>
                </section>
        `);

        $.each(familiarPepsReal, function (_, familiarPeps) {
            $familiarPepsReal.append(
                `<div class="app-paper elevation-3 p-3 mb-3">
                <div class="row align-items-center text-md-center">
                    <div class="col-12 col-md-4">
                        <span class="d-md-none fw-bold">Cedula</span>
                        ${familiarPeps.identification}
                    </div>
                    <div class="col-12 col-md-4">
                        <span class="d-md-none fw-bold">Nombres</span>
                        ${familiarPeps.firstName} ${familiarPeps.secondName} ${familiarPeps.firstLastName} ${familiarPeps.secondLastName}
                    </div>
                    <div class="col-12 col-md-4 mt-3 mt-md-0 d-flex flex-row justify-content-center gap-2 text-md-center">
                        <button type="button" class="app-button app-btn--warning w-75 btn-cambiar mb-2" data-id="${familiarPeps.id}" data-source="real" data-bs-toggle="modal" data-bs-target="#modalAgregarFamiliarPeps" id="btnEditarFamiliarPeps">
                            <i class="material-icons">edit</i>
                        </button>
                    </div>
                </div>
            </div>`
            );
        });
    }

    //RENDERIZAR FAMILIARES PEPS NUEVOS O EDITADOS
    function renderFamiliarPepsNew() {
        const $familiarPepsNew = $('#list-familiar-peps-new');
        $familiarPepsNew.empty();
        if (!familiarPepsNew || familiarPepsNew.length === 0) {
            return;
        }
        $familiarPepsNew.append(`
                <p class="text-left">
                <div>
                    <h3>Nuevos Familiares PEP'S</h3>
                    <span>Nota: Familiares PEP'S que se agregarán o editaran en la entidad</span>
                </div>
                </p>
                <section class="row mb-2 fw-bold text-center d-none d-md-flex border-bottom pb-2 table-headers">
                    <div class="col-md-3">Cedula</div>
                    <div class="col-md-3">Nombres</div>
                    <div class="col-md-3">Parentesco</div>
                    <div class="col-md-3">Acciones</div>
                </section>
        `);

        $.each(familiarPepsNew, function (_, familiarPeps) {
            $familiarPepsNew.append(
                `<div class="app-paper elevation-3 p-3 mb-3">
                <div class="row align-items-center text-md-center">
                    <div class="col-12 col-md-3">
                        <span class="d-md-none fw-bold">Cedula</span>
                        ${familiarPeps.identification}
                    </div>
                    <div class="col-12 col-md-3">
                        <span class="d-md-none fw-bold">Nombres</span>
                        ${familiarPeps.firstName} ${familiarPeps.secondName} ${familiarPeps.firstLastName} ${familiarPeps.secondLastName}
                    </div>
                    <div class="col-12 col-md-3">
                        <span class="d-md-none fw-bold">Parentesco</span>
                        ${familiarPeps.parentesco}
                    </div>
                    <div class="col-12 col-md-3 mt-3 mt-md-0 d-flex flex-row justify-content-center gap-2 text-md-center">
                        <button type="button" class="app-button app-btn--warning w-75 btn-cambiar mb-2" data-id="${familiarPeps.id}" data-source="new" data-bs-toggle="modal" data-bs-target="#modalAgregarFamiliarPeps" id="btnEditarFamiliarPeps">
                            <i class="material-icons">edit</i>
                        </button>
                        <button type="button" class="app-button app-btn--danger w-75 btn-cambiar mb-2" data-id="${familiarPeps.id}" data-source="new" data-bs-toggle="modal" data-bs-target="#modalEliminarFamiliarPeps" id="btnEliminarFamiliarPeps">
                            <i class="material-icons">delete</i>
                        </button>
                    </div>
                </div>
            </div>`
            );
        });
    }

    //ID COUNTER FAMILIARES PEPS
    let familiarPepsIdCounter = Math.max(
        ...familiarPepsReal.map(r => r.id),
        0
    ) + 1;

    //EDITAR O AGREGAR FAMILIAR PEP
    $(document).on('submit', '#formAgregarFamiliarPeps', function (e) {
        e.preventDefault();
        const $form = $(this);
        const modo = $form.data('modo');
        const id = $form.data('id');
        const source = $form.data('source');
        const identification = $('#numeroDocumentoFamiliarPeps').val().trim();

        const nuevoFamiliarPeps = {
            id: null,
            originalId: source === 'real' ? id : null,
            tipoDocumento: $('#tipoDocumentoFamiliarPeps').val().trim(),
            identification: identification,
            firstName: $('#primerNombreFamiliarPeps').val().trim(),
            secondName: $('#segundoNombreFamiliarPeps').val().trim(),
            firstLastName: $('#primerApellidoFamiliarPeps').val().trim(),
            secondLastName: $('#segundoApellidoFamiliarPeps').val().trim(),
            parentesco: $('#parentescoFamiliarPeps').val(),
        };
        if (!identification || !nuevoFamiliarPeps.firstName || !nuevoFamiliarPeps.firstLastName) {
            alert('Debe completar los campos obligatorios');
            return;
        }
        if (modo === 'editar') {
            let index = -1;
            if (source === 'new') {
                index = familiarPepsNew.findIndex(r => r.id === id);
            } else if (source === 'real') {
                index = familiarPepsNew.findIndex(r => r.originalId === id);
            }

            if (index !== -1) {
                nuevoFamiliarPeps.id = familiarPepsNew[index].id;
                nuevoFamiliarPeps.originalId = familiarPepsNew[index].originalId;
                familiarPepsNew[index] = nuevoFamiliarPeps;
                modificado = true;
            } else {
                nuevoFamiliarPeps.id = familiarPepsIdCounter++;
                familiarPepsNew.push(nuevoFamiliarPeps);
                modificado = true;
            }
        }
        else {
            const existeEnReal = familiarPepsReal.some(r =>
                r.identification === identification
            );
            if (existeEnReal) {
                alert('Ya existe una referencia real con esa identificación.');
                return;
            }
            const existeEnNew = familiarPepsNew.some(r =>
                r.identification === identification
            );
            if (existeEnNew) {
                alert('Ya existe una referencia nueva con esa identificación.');
                return;
            }
            nuevoFamiliarPeps.id = familiarPepsIdCounter++;
            nuevoFamiliarPeps.originalId = null;
            familiarPepsNew.push(nuevoFamiliarPeps);
            modificado = true;
        }
        renderFamiliarPepsNew();
        $form.removeData('modo id source');
        $form.trigger('reset');
        const $modal = $('#modalAgregarFamiliarPeps');
        const $submitBtn = $modal.find('button[type="submit"]');
        $submitBtn.text('Agregar familiar');
        $modal.modal('hide');

    });

    //EDITAR FAMILIAR PEPs
    $(document).on('click', '#btnEditarFamiliarPeps', function () {
        const id = Number($(this).data('id'));
        const source = $(this).data('source');
        let familiarPeps;
        if (source === 'real') {
            familiarPeps = familiarPepsReal.find(r => r.id === id);
        } else {
            familiarPeps = familiarPepsNew.find(r => r.id === id);
        }
        if (!familiarPeps) return;

        $('#formAgregarFamiliarPeps').data('modo', 'editar');
        $('#formAgregarFamiliarPeps').data('id', id);
        $('#formAgregarFamiliarPeps').data('source', source);

        $('#tipoDocumentoFamiliarPeps').val(familiarPeps.tipoDocumento);
        $('#numeroDocumentoFamiliarPeps').val(familiarPeps.identification);
        $('#primerNombreFamiliarPeps').val(familiarPeps.firstName);
        $('#segundoNombreFamiliarPeps').val(familiarPeps.secondName);
        $('#primerApellidoFamiliarPeps').val(familiarPeps.firstLastName);
        $('#segundoApellidoFamiliarPeps').val(familiarPeps.secondLastName);
        $('#parentescoFamiliarPeps').val(familiarPeps.parentesco);

        const $modal = $('#modalAgregarFamiliarPeps');
        const $submitBtn = $modal.find('button[type="submit"]');
        $submitBtn.text('Guardar cambios');
    });

    //MODAL PARA ELIMINAR FAMILIAR PEPS
    $(document).on('click', '#btnEliminarFamiliarPeps', function () {
        const id = $(this).data('id');
        const familiarPeps = familiarPepsNew.find(p => p.id === id);

        if (!familiarPeps) return;

        $('#mensajeModalEliminarFamiliarPeps')
            .text(`¿Está seguro de eliminar el familiar peps: ${familiarPeps.firstName} ${familiarPeps.firstLastName}?`);

        $('#btnAceptarEliminarFamiliarPeps').data('id', id);

        $('#modalEliminarFamiliarPeps').modal('show');
    });

    //CONFIRMAR ELIMINAR FAMILIAR PEPS
    $(document).on('click', '#btnAceptarEliminarFamiliarPeps', function () {
        const idAEliminar = $(this).data('id');
        familiarPepsNew = familiarPepsNew.filter(r => r.id !== idAEliminar);
        renderFamiliarPepsNew();
        const modalElement = document.getElementById('modalEliminarFamiliarPeps');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
        guardarSessionStorage();

    });





    //RESETEAR MODALES
    $(document).on('click', '.app-modal__close', function () {
        const $modal = $(this).closest('.modal');
        const $form = $modal.find('form');
        if ($form.length) {
            $form.trigger('reset');
            $form.removeData('modo id source');
        }
        const $submitBtn = $modal.find('button[type="submit"]');
        if ($submitBtn.length) {
            const defaultText = $submitBtn.data('default-text');
            if (defaultText) {
                $submitBtn.text(defaultText);
            }
        }

    });

    //MOSTRAR OTROS DATOS ADICIONALES DINAMICO
    $(document).on('click', '#btnAgregarOtrosDatosAdicionales', function () {
        const $modal = $('#modalAgregarOtrosDatosAdicionales');
        const $submitBtn = $modal.find('button[type="submit"]');
        $submitBtn.text('Agregar otros datos adicionales');
        $modal.modal('show');
    });

    //PRUEBAS MANEJO DE ESTADO GLOBAL Y REHIDRATACION DE TABS
    let formState = {
        autorizaciones: {},
        datosPersonales: {
            tipoDocumento: null,
            numeroDocumento: null,
            fechaExpedicionDocumento: null,
            paisDocumento: null,
            departamentoDocumento: null,
            ciudadDocumento: null,
            primerNombre: null,
            segundoNombre: null,
            primerApellido: null,
            segundoApellido: null,
            fechaNacimiento: null,
            paisNacimiento: null,
            departamentoNacimiento: null,
            ciudadNacimiento: null,
            nroHijos: null,
            envioDocumentos: null,
            ciiu: null,
            nacionalidad: null,
            tipoDireccionResidencia: null,
            complementoDireccionResidencia: null,
            paisResidencia: null,
            departamentoResidencia: null,
            ciudadResidencia: null,
            tipoZonaResidencia: null,
            zonaResidencia: null,
            comunaResidencia: null,
            barrioResidencia: null,
            estratoResidencia: null,
            email: null,
            celular: null,
            telefono: null,

        },

        datosLaborales: {
            empresaTrabajo: null,
            cargoTrabajo: null,
            dependenciaTrabajo: null,
            tipoContrato: null,
            fechaIngreso: null,
            pagaduria: null,
            periodoDeduccion: null,
            salario: null,
        },

        otrosDatos: {
            estudios: null,
            genero: null,
            estadoCivil: null,
            ocupacion: null,
            profesion: null,
            numeroCuenta: null,
            tipoCuenta: null,
            bancoCuenta: null,
            tipoVivienda: null,
            numeroPersonasHabitantes: null,
            dependeEconomicamente: null,
            declarante: null,
            grupoProteccion: null,
            operacionesMonedaExtranjera: null,
            cualesOperacionesMonedaExtranjera: null,
            poseeCuentasMonedaExtranjera: null,
            paisMonedaExtranjera: null,
            ciudadMonedaExtranjera: null,
            monedaExtranjera: null,
            bancoMonedaExtranjera: null,
            numeroCuentaMonedaExtranjera: null,
            esPep: null,
            tipoPep: null,

            familiarEmpleadoEntidad: null,
            identificacionEmpleadoEntidad: null,
            tipoIdentificacionEmpleadoEntidad: null,
            primerNombreEmpleadoEntidad: null,
            segundoNombreEmpleadoEntidad: null,
            primerApellidoEmpleadoEntidad: null,
            segundoApellidoEmpleadoEntidad: null,
            parentescoEmpleadoEntidad: null,
            desdeCuandoFamiliarEmpleadoEntidad: null,
            hastaCuandoFamiliarEmpleadoEntidad: null,

            familiarRecursosPublicos: null,
            identificacionFamiliarRecursosPublicos: null,
            tipoIdentificacionFamiliarRecursosPublicos: null,
            primerNombreFamiliarRecursosPublicos: null,
            segundoNombreFamiliarRecursosPublicos: null,
            primerApellidoFamiliarRecursosPublicos: null,
            segundoApellidoFamiliarRecursosPublicos: null,
            parentescoFamiliarRecursosPublicos: null,
            cargoFamiliarRecursosPublicos: null,
            desdeCuandoFamiliarRecursosPublicos: null,
            hastaCuandoFamiliarRecursosPublicos: null,
            nombreEntidadFamiliarRecursosPublicos: null,

            familiarPublicamenteExpuesto: null,
            identificacionFamiliarPublicamenteExpuesto: null,
            tipoIdentificacionFamiliarPublicamenteExpuesto: null,
            primerNombreFamiliarPublicamenteExpuesto: null,
            segundoNombreFamiliarPublicamenteExpuesto: null,
            primerApellidoFamiliarPublicamenteExpuesto: null,
            segundoApellidoFamiliarPublicamenteExpuesto: null,
            parentescoFamiliarPublicamenteExpuesto: null,
            desdeCuandoFamiliarPublicamenteExpuesto: null,
            hastaCuandoFamiliarPublicamenteExpuesto: null,

            administraRecursosPublicos: null,
            nombreEntidadAdministraRecursosPublicos: null,
            cargoAdministraRecursosPublicos: null,
            fechaViculacionRecursosPublicos: null,
            fechaRetiroRecursosPublicos: null,
        },

        ingresosEgresos: {
            honorarios: null,
            arriendos: null,
            comisiones: null,
            utilidadNegocio: null,
            bonificaciones: null,
            sueldo: null,
            interesInversiones: null,
            pensiones: null,
            dividendos: null,
            conceptoOtrosIngresos: null,
            otrosIngresos: null,
            totalIngresos: null,
            alimentacion: null,
            educacion: null,
            serviciosPublicos: null,
            arriendo: null,
            transporte: null,
            cuotaDomestica: null,
            salud: null,
            otrosGastos: null,
            otrasDeudas: null,
            prestamoVivienda: null,
            otrosNegocios: null,
            prestamoVehiculo: null,
            tajetaCredito: null,
            conceptoOtrosEgresos: null,
            otrosPrestamos: null,
            totalEgresos: null,
            totalActivos: null,
            totalPasivos: null,
            totalPatrimonio: null,
            saldoALaFecha: null,
            cooperativasSaldos: null,
            entidadesFinancierasCuotas: null,
            cooperativasCuotas: null,
            otrasObligacionesSaldos: null,
            otrasObligacionesCuotas: null,
            totalOtrasObligaciones: null,
        },

        conyugue: {
            primerNombreConyugue: null,
            segundoNombreConyugue: null,
            primerApellidoConyugue: null,
            segundoApellidoConyugue: null,
            tipoDocumentoConyugue: null,
            documentoConyugue: null,
            paisNacimientoConyugue: null,
            departamentoNacimientoConyugue: null,
            ciudadNacimientoConyugue: null,
            tipoDireccionConyugue: null,
            complementoDireccionConyugue: null,
            generoConyugue: null,
            fechaNacimientoConyugue: null,
            fechaExpedicionConyugue: null,
            telefonoConyugue: null,
            celularConyugue: null,
            emailConyugue: null,
            tipoContratoConyugue: null,
            empresaConyugue: null,
            oficioConyugue: null,
            telefonoEmpresaConyugue: null,
            paisEmpresaConyugue: null,
            departamentoEmpresaConyugue: null,
            ciudadEmpresaConyugue: null,
            cargoConyugue: null,
            tipoDireccionEmpresaConyugue: null,
            complementoDireccionEmpresaConyugue: null,
            ciuuEmpresaConyugue: null,
            salarioConyugue: null,
            fechaIngresoEmpresaConyugue: null,

        },

        otrosDatosAdicionales: {

            cedulaApoderado: null,
            nombreApoderado: null,
            profesionApoderado: null,
            direccionApoderado: null,
            telefonoApoderado: null,
            movilApoderado: null,


            tipoPersonaJuridica: null,
            tieneRetencionPersonaJuridica: null,

            fechaNombramientoRepresentanteLegal: null,
            numeroActaNombramientoRepresentanteLegal: null,
            numeroCamaraComercio: null,
            tipoEmpresaRepresentanteLegal: null,
            detalleEmpresaRepresentanteLegal: null,
            totalActivosRepresentanteLegal: null,
            totalPasivosRepresentanteLegal: null,
            totalPatrimonioRepresentanteLegal: null,
            cedulaRepresentanteLegal: null,
            nombreRepresentanteLegal: null,
            profesionRepresentanteLegal: null,
            direccionRepresentanteLegal: null,
            paisRepresentanteLegal: null,
            departamentoRepresentanteLegal: null,
            ciudadRepresentanteLegal: null,
            telefonoRepresentanteLegal: null,
            movilRepresentanteLegal: null,
            indicativoRepresentanteLegal: null,
        },
    }

    let modificado = false;
    //GUARDAR CAMBIOS DE INPUTS EN EL ESTADO GLOBAL
    $(document).on("input change", "input, select, textarea", function () {

        const tab = $(".app-tab.active").data("tab");
        const name = $(this).attr("name");

        if (!tab || !name) return;
        if (!formState[tab]) return;

        formState[tab][name] = $(this).val();
        if (!modificado) {
            modificado = true;
        }
    });

    //HIDRATACION DE LAS TABS
    function hydrateTab(tab) {

        const state = formState[tab];

        if (!state) return;

        Object.keys(state).forEach(key => {

            const $field = $(`[name="${key}"]`);

            if (!$field.length) return;

            if ($field.is(":checkbox")) {

                $field.prop("checked", state[key]);

            } else if ($field.is(":radio")) {

                $(`[name="${key}"][value="${state[key]}"]`).prop("checked", true);

            } else {

                //SI ES UN SELECT CON DATA-COMBO, NO SE HIDRATA YA QUE ESTA HIDRATACION SE HACE EN LA FUNCION LOADCOMBO
                if ($field.is("select[data-combo]")) {
                    return;
                }
                //ACA SE HIDRATAN LOS COMBOS QUE NO TIENEN DATA-COMBO (OSEA QUE SUS OPCIONES NO VIENEN DE UN BACKEND)
                $field.val(state[key]);
                if ($field.val() == state[key] || !$field.is("select")) {
                    $field.trigger("change");
                }

            }

        });

    }


    //CUANDO SE PULSA EL BOTON FINALIZAR (PRUEBA TEMPORAL)
    $(document).on("click", "#btnFinalizar", async function (e) {
        e.preventDefault();
      
        const esValido = await validarActualizacionDatos();
        if (!esValido) {
            return;
        }

        infoModal("La validacion fue exitosa", "exito");
        console.log("FormSate:", formState)
        limpiarSessionStorage();
        enviado = true;
    });




    //PRUEBA DE PERSISTENCIA EN SESSION STORAGE
    const STORAGE_KEY = "testSavingFormState";
    // GUARDA LOS DATOS DEL FORMSTATE EN SESSION STORAGE
    function guardarSessionStorage() {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formState));
            sessionStorage.setItem("peopleInCharge", JSON.stringify(peopleInChargeNew));
            sessionStorage.setItem("references", JSON.stringify(referencesNew));
            sessionStorage.setItem("familiarPeps", JSON.stringify(familiarPepsNew));
        } catch (error) {
            console.error("Error al guardar el formulario en session storage", error);
        }
    }

    // CARGA LOS DATOS DEL SESSION STORAGE AL FORMSTATE
    function cargarSessionStorage() {

        try {

            const formData = sessionStorage.getItem(STORAGE_KEY);
            const peopleInChargeData = sessionStorage.getItem("peopleInCharge");
            const referencesData = sessionStorage.getItem("references");
            const familiarPepsData = sessionStorage.getItem("familiarPeps");

            //GUARDA LOS DATOS DEL SESSION STORAGE AL FORMSTATE
            if (formData) {
                const savedState = JSON.parse(formData);
                Object.keys(savedState).forEach(section => {

                    if (formState[section]) {

                        formState[section] = {
                            ...formState[section],
                            ...savedState[section]
                        };

                    }

                });
            }
            //GUARDA LOS DATOS DEL SESSION STORAGE AL PEOPLE IN CHARGE
            if (peopleInChargeData) {
                const savedPeopleInCharge = JSON.parse(peopleInChargeData);
                savedPeopleInCharge.forEach(person => {
                    peopleInChargeNew.push(person);
                });
            }

            if (referencesData) {
                const savedReferences = JSON.parse(referencesData);
                savedReferences.forEach(reference => {
                    referencesNew.push(reference);
                });
                actualizarContadorReferencias();
            }

            if (familiarPepsData) {
                const savedFamiliarPeps = JSON.parse(familiarPepsData);
                savedFamiliarPeps.forEach(familiarPep => {
                    familiarPepsNew.push(familiarPep);
                });
            }

        } catch (error) {
            console.error("Error cargando sessionStorage:", error);
        }

    }

    // VALIDA SI EXISTE SESSION STORAGE (PARA INICIALIZAR EL FORMULARIO)
    function existeSessionStorage() {
        if (sessionStorage.getItem(STORAGE_KEY) !== null || sessionStorage.getItem("peopleInCharge") !== null || sessionStorage.getItem("references") !== null || sessionStorage.getItem("familiarPeps") !== null) {
            return true;
        } else {
            return false;
        }
    }

    // CARGA LOS DATOS DEL BACKEND AL FORMSTATE
    async function cargarDatosBackend() {
        try {
            const response = await fetch("/actualizaciondatos/informacionAsociado");
            if (!response.ok) {
                console.error("Error al obtener datos:", response.statusText);
                return;
            }
            const resData = await response.json();

            if (resData) {
                formState = {
                    ...formState,
                    ...resData
                };
                console.log("Datos del backend asignados a formState:", formState);
            } else {
                console.log("No hay datos backend");
            }
        } catch (error) {
            console.error("Excepción cargando datos del backend:", error);
        }
    }

    //INICIALIZAR FORMULARIO (VALIDA SI EXISTE SESSION STORAGE O CARGA DATOS DEL BACKEND)
    let formularioInicializado = false;
    async function inicializarFormulario() {

        if (formularioInicializado) return;

        const haySession = existeSessionStorage();

        if (!haySession) {

            await cargarDatosBackend();


        } else {
            cargarSessionStorage();
            infoModal("Aun tiene datos sin enviar, continúe con la actualizacion de datos y presione finalizar para enviar la información", "alerta");
        }
        evaluarTabsDinamicas();
        evaluarContenidoOtrosDatosAdicionales();
        formularioInicializado = true;
    }


    //LIMPIAR SESSION STORAGE PARA CUANDO SE ENVIE EL FORMULARIO (PRUEBA)
    function limpiarSessionStorage() {
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem("peopleInCharge");
        sessionStorage.removeItem("references");
        sessionStorage.removeItem("familiarPeps");
    }

    let enviado = false;
    //Prueba guardando en caso de reloads si no se ha enviado
    window.addEventListener("beforeunload", function (e) {
        if (modificado) {
            if (!enviado) {
                guardarSessionStorage();
                e.preventDefault();
                e.returnValue = ''
            }
        }
    });

    //NORMALIZA LA DATA PARA LOS COMBOS
    function normalizarCombo(data, idField, textField) {
        if (!Array.isArray(data) || !Array.isArray(data[0])) {
            return [];
        }
        return data[0]
            .map(item => {
                const id = item[idField];
                const nombre = item[textField];
                return {
                    id: String(id ?? "").trim(),
                    nombre: String(nombre ?? "").trim()
                };
            })
            .filter(x => x.id && x.nombre);
    }

    //OBTIENE LOS DATOS DE LOS COMBOS
    const defaultIds = { id: "id", text: "opcion" };
    const idsEspeciales = {
        ciiu: { id: "codciiu", text: "nombre" },
        tipocontrato: { id: "codigotipocontrato", text: "nombretipocontrato" }
    };




    async function obtenerDatos(url, tipo) {

        const res = await fetch(url);
        if (!res.ok) throw new Error("Error cargando datos");

        const data = await res.json();

        let configIds = idsEspeciales[tipo] || defaultIds;
        const { id, text } = configIds;
        return normalizarCombo(data, id, text);

    }

    //RECORRE LA DATA Y LLENA EL COMBO
    function llenarCombo(select, data) {
        let html = `<option value=""></option>`;

        $.each(data, function (_, item) {
            html += `<option value="${item.id}">${item.nombre}</option>`;
        });
        select.html(html);
        // AUTO-HIDRATACION PARA COMBOS: Se llenan los combos con los datos y se activa el evento change para ir hidratando en cascada y que se carguen los combos dependientes
        //Se toman los valores directamente del formState ya que cuando se hidrata con hydrateTab los datos en los combos no alcanzan a llenarse
        const tab = $(".app-tab.active").data("tab");
        const name = select.attr("name");
        if (tab && name && formState[tab]) {
            const valueToSet = formState[tab][name];
            if (valueToSet !== null && valueToSet !== undefined && valueToSet !== "") {
                const exists = data.some(item => item.id == valueToSet);
                if (exists) {
                    select.val(valueToSet);
                    select.trigger("change"); // SE ACTIVA EL CHANGE PARA EL EFECTO CASCADA
                }
            }
        }
    }

    //CARGA EL COMBO INDEPENDIENTE
    async function cargarCombo(select) {

        const tipo = select.data("combo");

        const data = await obtenerDatos(`/combos?tipo=${tipo}`, tipo);

        llenarCombo(select, data);

    }

    //CARGA COMBOS CON DEPENDENCIA DE OTROS COMBOS
    async function cargarComboDependiente(select, params) {

        const tipo = select.data("combo");

        let url = `/combos?tipo=${tipo}`;

        $.each(params, function (key, value) {
            url += `&${key}=${value}`;
        });

        const data = await obtenerDatos(url, tipo);

        llenarCombo(select, data);

    }

    //INICIALIZA LOS COMBOS, IDENTIFICA SI ES DEPENDIENTE O INDEPENDIENTE Y EJECUTA LA FUNCION
    async function inicializarCombos(container = $(document)) {

        const selects = container.find("select[data-combo]");
        const promises = [];

        selects.each(function () {
            const select = $(this);
            const parents = select.data("depende");

            // combo independiente
            if (!parents) {
                promises.push(cargarCombo(select));
                return;
            }
            const parentIds = parents.split(",");
            const params = select.data("param").split(",");
            const parentsSelects = [];

            $.each(parentIds, function (_, id) {
                parentsSelects.push($("#" + id));
            });
            $.each(parentsSelects, function (_, parent) {
                parent.on("change", async function (e, isClearCascade) {
                    // Limpia el valor del combo dependiente y dispara el evento 'change'
                    // para limpiar también los combos que dependan de este (en cascada)
                    // Solo si el cambio viene del usuario o de una limpieza en cascada (no en hidratación)
                    if (e.originalEvent || isClearCascade) {
                        select.val("").trigger("change", [true]);
                    }

                    const values = {};
                    let valid = true;
                    $.each(parentsSelects, function (i, p) {
                        const value = p.val();
                        if (!value) {
                            valid = false;
                            return false;
                        }
                        values[params[i]] = value;

                    });
                    if (!valid) {
                        select.html(`<option value=""></option>`);
                        return;
                    }
                    await cargarComboDependiente(select, values);

                });

            });

        });

        await Promise.all(promises);

    }



})();



