(function () {
    let loaderCount = 0;

    //AVANCE BARRA
    function updateProgressBar($currentTab) {
        const $tabs = $(".app-tab:visible");
        const index = $tabs.index($currentTab);
        const total = $tabs.length;
        const percent = ((index + 1) / total) * 100;
        $("#progressBar").css("width", percent + "%")
            .attr("aria-valuenow", percent);
    }

    function mostrarLoader(mensaje = "Cargando informacion...") {
        loaderCount += 1;
        const $loader = $("#actualizacion-loader");

        if (!$loader.length) return;

        $loader.find(".actu-loader__text").text(mensaje);
        $loader
            .addClass("is-active")
            .attr("aria-hidden", "false");
    }

    function ocultarLoader() {
        loaderCount = Math.max(0, loaderCount - 1);

        if (loaderCount > 0) return;

        $("#actualizacion-loader")
            .removeClass("is-active")
            .attr("aria-hidden", "true");
    }

    async function conLoader(mensaje, tarea) {
        mostrarLoader(mensaje);

        try {
            return await tarea();
        } finally {
            ocultarLoader();
        }
    }

    async function prepararTab(tab) {
        const $contenido = $("#tab-content");

        initRestriccionesCampos($contenido);
        await inicializarCombos($contenido);
        await initTabs();
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

    async function cargarTab(tab, $tab) {
        await conLoader("Cargando seccion...", async function () {
            const response = await fetch(`/actualizaciondatos/tab/${tab}`);

            if (!response.ok) {
                throw new Error("No fue posible cargar la seccion seleccionada");
            }

            const html = await response.text();

            $(".app-tab").removeClass("active");
            $tab.addClass("active");
            updateProgressBar($tab);

            $("#tab-content").html(html);
            await prepararTab(tab);
        });
    }

    //SISTEMA DE TABS
    $(document).on("click", ".app-tab", async function (e) {
        e.preventDefault();

        const tab = $(this).data("tab");
        const $tab = $(this);

        try {
            await cargarTab(tab, $tab);
        } catch (error) {
            console.error("Error cargando pestaña:", error);
            infoModal(error.message || "No fue posible cargar la seccion seleccionada", "alerta");
        }
    });


    //CARGAR TAB DINAMICO CUANDO SE CARGA EL FORMULARIO POR PRIMERA VEZ
    $(document).ready(async function () {
        try {
            await conLoader("Preparando actualizacion de datos...", async function () {
                await inicializarFormulario();
                evaluarTabsDinamicas();
                await cargarTab("autorizaciones", $('.app-tab[data-tab="autorizaciones"]'));
            });
        } catch (error) {
            console.error("Error inicializando actualizacion de datos:", error);
            infoModal(error.message || "No fue posible preparar el formulario", "alerta");
        }
    });

    //INICIALIZAR TABS INDEPENDIENTES
    async function initTabs() {
        await initAutorizaciones();
        await initAdjuntos();
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
        normalizarNumerosFormState();
        sanitizarObjeto(formState);
    }

    // Restricciones migradas del legacy: el usuario ve formato, el estado guarda limpio.
    const CAMPOS_MONEDA = {
        honorarios: 13,
        arriendos: 13,
        comisiones: 13,
        utilidadNegocio: 13,
        bonificaciones: 13,
        sueldo: 13,
        pensiones: 13,
        dividendos: 13,
        interesInversiones: 13,
        otrosIngresos: 13,
        totalIngresos: 13,
        alimentacion: 13,
        educacion: 13,
        serviciosPublicos: 13,
        arriendo: 13,
        transporte: 13,
        cuotaDomestica: 13,
        salud: 13,
        otrosGastos: 13,
        otrasDeudas: 13,
        prestamoVivienda: 13,
        otrosNegocios: 13,
        prestamoVehiculo: 13,
        tajetaCredito: 13,
        otrosPrestamos: 13,
        totalEgresos: 13,
        totalActivos: 13,
        totalPasivos: 13,
        totalPatrimonio: 13,
        saldoALaFecha: 13,
        cooperativasSaldos: 13,
        entidadesFinancierasCuotas: 13,
        cooperativasCuotas: 13,
        otrasObligacionesSaldos: 13,
        otrasObligacionesCuotas: 13,
        totalOtrasObligaciones: 13,
        salario: 13,
        salarioConyugue: 13,
        totalActivosRepresentanteLegal: 13,
        totalPasivosRepresentanteLegal: 13,
        totalPatrimonioRepresentanteLegal: 13
    };

    const CAMPOS_SOLO_NUMEROS = {
        numeroDocumento: 10,
        nroHijos: 4,
        numeroCuenta: 11,
        numeroPersonasHabitantes: 4,
        identificacionEmpleadoEntidad: 10,
        identificacionFamiliarRecursosPublicos: 10,
        identificacionFamiliarPublicamenteExpuesto: 10,
        documentoConyugue: 10,
        cedulaReferencia: 10,
        numeroDocumentoPersonaACargo: 12,
        numeroDocumentoFamiliarPeps: 10,
        cedulaApoderado: 10,
        cedulaRepresentanteLegal: 10,
        indicativoRepresentanteLegal: 4,
        numeroActaNombramientoRepresentanteLegal: 10,
        numeroCamaraComercio: 20
    };

    const CAMPOS_TELEFONO = {
        telefono: 10,
        telefonoConyugue: 10,
        telefonoEmpresaConyugue: 10,
        telefonoReferencia: 10,
        telefonoOficinaReferencia: 10,
        telefonoApoderado: 10,
        telefonoRepresentanteLegal: 10
    };

    const CAMPOS_CELULAR = {
        celular: 10,
        celularConyugue: 10,
        celularReferencia: 10,
        movilApoderado: 10,
        movilRepresentanteLegal: 10
    };

    const LIMITES_TEXTO = {
        primerNombre: 20,
        segundoNombre: 20,
        primerApellido: 15,
        segundoApellido: 15,
        complementoDireccionResidencia: 50,
        email: 50,
        primerNombreConyugue: 20,
        segundoNombreConyugue: 20,
        primerApellidoConyugue: 20,
        segundoApellidoConyugue: 20,
        emailConyugue: 50,
        cedulaReferencia: 10,
        nombresReferencia: 50,
        direccionReferencia: 50,
        nombresPersonaACargo: 30,
        primerNombreFamiliarPeps: 60,
        segundoNombreFamiliarPeps: 60,
        primerApellidoFamiliarPeps: 60,
        segundoApellidoFamiliarPeps: 60,
        numeroCuentaMonedaExtranjera: 20,
        cualesOperacionesMonedaExtranjera: 50,
        monedaExtranjera: 50,
        bancoMonedaExtranjera: 60,
        nombreApoderado: 105,
        direccionApoderado: 50,
        detalleEmpresaRepresentanteLegal: 60,
        nombreRepresentanteLegal: 105,
        direccionRepresentanteLegal: 50
    };

    function limpiarNumero(value = "") {
        return String(value ?? "").replace(/\D/g, "");
    }

    function longitudNumerica(value) {
        return limpiarNumero(value).length;
    }

    function limitarDigitos(value, maxDigitos) {
        const limpio = limpiarNumero(value);
        const limite = Number(maxDigitos);
        return limite > 0 ? limpio.slice(0, limite) : limpio;
    }

    function formatearMiles(value = "") {
        const texto = String(value ?? "").trim();
        const esNegativo = texto.startsWith("-");
        const limpio = limpiarNumero(texto);

        if (!limpio) return "";

        const formateado = limpio.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return esNegativo ? `-${formateado}` : formateado;
    }

    function maxCaracteresMoneda(maxDigitos) {
        const limite = Number(maxDigitos) || 0;
        return limite > 0 ? limite + Math.floor((limite - 1) / 3) : null;
    }

    function selectorCampo(campo) {
        return `[name="${campo}"], #${campo}`;
    }

    function configurarInputNumerico($field, tipo, maxDigitos, minDigitos = null) {
        if (!$field.length) return;

        if ($field.is('input[type="number"]')) {
            $field.attr("type", "text");
        }

        $field
            .attr("inputmode", "numeric")
            .attr("pattern", tipo === "moneda" ? "[0-9.]*" : "[0-9]*")
            .attr("data-max-digitos", maxDigitos);

        if (minDigitos) {
            $field.attr("data-min-digitos", minDigitos);
        }

        if (tipo === "moneda") {
            const maxVisual = maxCaracteresMoneda(maxDigitos);
            $field.attr("data-moneda", "true");
            if (maxVisual) $field.attr("maxlength", maxVisual);
            return;
        }

        $field.attr(`data-${tipo}`, "true");
        if (maxDigitos) {
            $field.attr("maxlength", maxDigitos);
        }
    }

    function initRestriccionesCampos($contenedor = $(document)) {
        Object.entries(CAMPOS_MONEDA).forEach(([campo, maxDigitos]) => {
            configurarInputNumerico($contenedor.find(selectorCampo(campo)), "moneda", maxDigitos);
        });

        Object.entries(CAMPOS_SOLO_NUMEROS).forEach(([campo, maxDigitos]) => {
            configurarInputNumerico($contenedor.find(selectorCampo(campo)), "solo-numeros", maxDigitos);
        });

        Object.entries(CAMPOS_TELEFONO).forEach(([campo, maxDigitos]) => {
            configurarInputNumerico($contenedor.find(selectorCampo(campo)), "telefono", maxDigitos, 7);
        });

        Object.entries(CAMPOS_CELULAR).forEach(([campo, maxDigitos]) => {
            configurarInputNumerico($contenedor.find(selectorCampo(campo)), "celular", maxDigitos, 10);
        });

        Object.entries(LIMITES_TEXTO).forEach(([campo, maxLength]) => {
            $contenedor.find(selectorCampo(campo)).attr("maxlength", maxLength);
        });
    }

    function ponerCursorAlFinal($field) {
        const field = $field[0];
        if (!field || document.activeElement !== field || typeof field.setSelectionRange !== "function") return;

        const posicion = field.value.length;
        field.setSelectionRange(posicion, posicion);
    }

    function normalizarValorCampo($field) {
        const maxDigitos = Number($field.attr("data-max-digitos")) || null;

        if ($field.is("[data-moneda]")) {
            const limpio = limitarDigitos($field.val(), maxDigitos);
            $field.val(formatearMiles(limpio));
            ponerCursorAlFinal($field);
            return limpio;
        }

        if ($field.is("[data-solo-numeros], [data-telefono], [data-celular]")) {
            const limpio = limitarDigitos($field.val(), maxDigitos);
            $field.val(limpio);
            ponerCursorAlFinal($field);
            return limpio;
        }

        return $field.val();
    }

    function pintarCampoMoneda(selector, value) {
        const $campo = $(selector);
        if ($campo.length) {
            $campo.val(formatearMiles(value));
        }
    }

    function normalizarNumerosFormState() {
        const camposNumericos = new Set([
            ...Object.keys(CAMPOS_MONEDA),
            ...Object.keys(CAMPOS_SOLO_NUMEROS),
            ...Object.keys(CAMPOS_TELEFONO),
            ...Object.keys(CAMPOS_CELULAR)
        ]);

        Object.values(formState || {}).forEach(seccion => {
            if (!seccion || typeof seccion !== "object" || Array.isArray(seccion)) return;

            camposNumericos.forEach(campo => {
                if (Object.prototype.hasOwnProperty.call(seccion, campo)) {
                    seccion[campo] = limpiarNumero(seccion[campo]);
                }
            });
        });
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
            validarConyugue,
            validarAdjuntos,
            validarOtrosDatosAdicionales
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

    function crearError(tab, field, message) {
        return { ok: false, tab, field, message };
    }

    async function abrirTab(tab) {
        const $tab = $(`.app-tab[data-tab="${tab}"]`);
        if (!$tab.length) return;

        await cargarTab(tab, $tab);
    }


    function isValidEmail(value) {
        if (isEmpty(value)) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
    }

    function isValidDate(value) {
        if (isEmpty(value)) return false;

        const date = new Date(value);
        return !Number.isNaN(date.getTime());
    }

    function normalizarFecha(value) {
        const date = new Date(value);
        date.setHours(0, 0, 0, 0);
        return date;
    }

    function isDateInRange(value, { min, max, notFuture, notPast } = {}) {
        if (!isValidDate(value)) return false;

        const fecha = normalizarFecha(value);
        const hoy = normalizarFecha(new Date());

        if (min && fecha < normalizarFecha(min)) return false;
        if (max && fecha > normalizarFecha(max)) return false;
        if (notFuture && fecha > hoy) return false;
        if (notPast && fecha < hoy) return false;

        return true;
    }

      function validarReglas({ tab, bloque, reglas }) {
        for (const regla of reglas) {
            const { value, type, field, message, allowZero, min, max, notFuture, notPast, minLength, maxLength } = regla;

            if (type === "text") {
                if (isEmpty(value)) {
                    return crearError(tab, field, message);
                }

                if (!allowZero && Number(value) === 0 && String(value).trim() === "0") {
                    return crearError(tab, field, message);
                }

                if ((minLength || maxLength) && !isEmpty(value)) {
                    const longitud = limpiarNumero(value).length;

                    if (minLength && longitud < minLength) {
                        return crearError(tab, field, message);
                    }

                    if (maxLength && longitud > maxLength) {
                        return crearError(tab, field, message);
                    }
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

            if (type === "date") {
                if (isEmpty(value)) {
                    return crearError(tab, field, message);
                }

                if (!isDateInRange(value, { min, max, notFuture, notPast })) {
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
        const obligatorias = catalogo.filter(a => a.activo && (a.requiereRespuesta || a.obligatorio));

        for (const aut of obligatorias) {
            if (!formState.autorizaciones?.[aut.codigo]) {
                return crearError(
                    "autorizaciones",
                    `#switch-${aut.codigo}`,
                    "Debe aceptar las autorizaciones requeridas"
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
                { field: "#fechaExpedicionDocumento", type: "date", value: d.fechaExpedicionDocumento, message: "Ingrese una fecha de expedicion valida" + msg, min: "1900-01-01", notFuture: true },
                { field: "#paisDocumento", type: "select", value: d.paisDocumento, message: "Ingrese país del documento" + msg },
                { field: "#departamentoDocumento", type: "select", value: d.departamentoDocumento, message: "Ingrese departamento del documento" + msg },
                { field: "#ciudadDocumento", type: "select", value: d.ciudadDocumento, message: "Ingrese ciudad del documento" + msg },
                { field: "#primerNombre", type: "text", value: d.primerNombre, message: "Ingrese primer nombre" + msg },
                { field: "#primerApellido", type: "text", value: d.primerApellido, message: "Ingrese primer apellido" + msg },
                { field: "#fechaNacimiento", type: "date", value: d.fechaNacimiento, message: "Ingrese fecha de nacimiento valida" + msg, min: "1900-01-01", notFuture: true },
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
                { field: "#celular", type: "text", value: d.celular, message: "Ingrese celular" + msg },
                { field: "#email", type: "email", value: d.email, message: "Ingrese un correo electronico valido" + msg }
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
            { field: "#fechaIngreso", type: "date", value: l.fechaIngreso, message: "Ingrese fecha de ingreso valida" + msg, min: "1900-01-01", notFuture: true }
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
                    { field: "#desdeCuandoFamiliarEmpleadoEntidad", type: "date", value: o.desdeCuandoFamiliarEmpleadoEntidad, message: "Ingrese una fecha valida" + msg, min: "1900-01-01", notFuture: true },
                    { field: "#hastaCuandoFamiliarEmpleadoEntidad", type: "date", value: o.hastaCuandoFamiliarEmpleadoEntidad, message: "Ingrese una fecha valida" + msg, min: "1900-01-01", notFuture: false, notPast: true }
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
                    { field: "#desdeCuandoFamiliarRecursosPublicos", type: "date", value: o.desdeCuandoFamiliarRecursosPublicos, message: "Ingrese una fecha valida" + msg, min: "1900-01-01", notFuture: true },
                    { field: "#hastaCuandoFamiliarRecursosPublicos", type: "date", value: o.hastaCuandoFamiliarRecursosPublicos, message: "Ingrese una fecha valida" + msg, min: "1900-01-01", notFuture: false, notPast: true }
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
                    { field: "#desdeCuandoFamiliarPublicamenteExpuesto", type: "date", value: o.desdeCuandoFamiliarPublicamenteExpuesto, message: "Ingrese una fecha valida" + msg, mind: "1900-01-01", notFuture: true },
                    { field: "#hastaCuandoFamiliarPublicamenteExpuesto", type: "date", value: o.hastaCuandoFamiliarPublicamenteExpuesto, message: "Ingrese una fecha valida" + msg, min: "1900-01-01", notFuture: false, notPast: true }
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
                { field: "#fechaExpedicionConyugue", type: "date", value: c.fechaExpedicionConyugue, message: "Ingrese una fecha valida de expedición de documento del cónyugue" + msg, min: "1900-01-01", notFuture: true },
                { field: "#primerNombreConyugue", type: "text", value: c.primerNombreConyugue, message: "Ingrese primer nombre cónyugue" + msg },
                { field: "#primerApellidoConyugue", type: "text", value: c.primerApellidoConyugue, message: "Ingrese primer apellido cónyugue" + msg },
                { field: "#tipoDocumentoConyugue", type: "select", value: c.tipoDocumentoConyugue, message: "Ingrese tipo documento cónyugue" + msg },
                { field: "#documentoConyugue", type: "text", value: c.documentoConyugue, message: "Ingrese documento cónyugue" + msg },
                { field: "#paisNacimientoConyugue", type: "select", value: c.paisNacimientoConyugue, message: "Ingrese país nacimiento cónyugue" + msg },
                { field: "#departamentoNacimientoConyugue", type: "select", value: c.departamentoNacimientoConyugue, message: "Ingrese departamento nacimiento cónyugue" + msg },
                { field: "#ciudadNacimientoConyugue", type: "select", value: c.ciudadNacimientoConyugue, message: "Ingrese ciudad nacimiento cónyugue" + msg },
                { field: "#tipoDireccionConyugue", type: "select", value: c.tipoDireccionConyugue, message: "Ingrese tipo dirección cónyugue" + msg },
                { field: "#complementoDireccionConyugue", type: "text", value: c.complementoDireccionConyugue, message: "Ingrese complemento dirección cónyugue" + msg },
                { field: "#fechaNacimientoConyugue", type: "date", value: c.fechaNacimientoConyugue, message: "Ingrese una fecha valida de nacimiento cónyugue" + msg, min: "1900-01-01", notFuture: true },
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



    function validarOtrosDatosAdicionales() {
        const modoOtros = resolverModoOtrosDatosAdicionales();
        const o = formState.otrosDatosAdicionales;
        const msg = " - De la ficha OTROS DATOS ADICIONALES";

        if (!modoOtros.mostrarTab) {
            return { ok: true };
        }

        if (modoOtros.esApoderado) {
            return validarReglas({
                tab: "otrosDatosAdicionales",
                reglas: [
                    { field: "#cedulaApoderado", type: "text", value: o.cedulaApoderado, message: "Ingrese cédula apoderado" + msg },
                    { field: "#nombreApoderado", type: "text", value: o.nombreApoderado, message: "Ingrese nombre apoderado" + msg },
                    { field: "#profesionApoderado", type: "text", value: o.profesionApoderado, message: "Ingrese profesión apoderado" + msg },
                    { field: "#direccionApoderado", type: "text", value: o.direccionApoderado, message: "Ingrese dirección apoderado" + msg },
                    { field: "#telefonoApoderado", type: "text", value: o.telefonoApoderado, message: "Ingrese teléfono apoderado" + msg },
                    { field: "#movilApoderado", type: "text", value: o.movilApoderado, message: "Ingrese móvil apoderado" + msg }
                ]
            });
        }

        if (modoOtros.esPersonaJuridica) {
            const base = validarReglas({
                tab: "otrosDatosAdicionales",
                reglas: [
                    { field: "#tipoPersonaJuridica", type: "select", value: o.tipoPersonaJuridica, message: "Ingrese tipo persona jurídica" + msg },
                    { field: "#tieneRetencionPersonaJuridica", type: "select", value: o.tieneRetencionPersonaJuridica, message: "Ingrese si tiene retención" + msg }
                ]
            });

            if (!base.ok) return base;

            return validarReglas({
                tab: "otrosDatosAdicionales",
                reglas: [
                    { field: "#fechaNombramientoRepresentanteLegal", type: "text", value: o.fechaNombramientoRepresentanteLegal, message: "Ingrese fecha de nombramiento" + msg },
                    { field: "#numeroActaNombramientoRepresentanteLegal", type: "text", value: o.numeroActaNombramientoRepresentanteLegal, message: "Ingrese número de acta" + msg },
                    { field: "#numeroCamaraComercio", type: "text", value: o.numeroCamaraComercio, message: "Ingrese número cámara de comercio" + msg },
                    { field: "#tipoEmpresaRepresentanteLegal", type: "select", value: o.tipoEmpresaRepresentanteLegal, message: "Ingrese tipo empresa" + msg },
                    { field: "#detalleEmpresaRepresentanteLegal", type: "text", value: o.detalleEmpresaRepresentanteLegal, message: "Ingrese detalle empresa" + msg },
                    { field: "#totalActivosRepresentanteLegal", type: "text", value: o.totalActivosRepresentanteLegal, message: "Ingrese total activos" + msg },
                    { field: "#totalPasivosRepresentanteLegal", type: "text", value: o.totalPasivosRepresentanteLegal, message: "Ingrese total pasivos" + msg },
                    { field: "#totalPatrimonioRepresentanteLegal", type: "text", value: o.totalPatrimonioRepresentanteLegal, message: "Ingrese total patrimonio" + msg },
                    { field: "#cedulaRepresentanteLegal", type: "text", value: o.cedulaRepresentanteLegal, message: "Ingrese cédula representante legal" + msg },
                    { field: "#nombreRepresentanteLegal", type: "text", value: o.nombreRepresentanteLegal, message: "Ingrese nombre representante legal" + msg },
                    { field: "#profesionRepresentanteLegal", type: "select", value: o.profesionRepresentanteLegal, message: "Ingrese profesión representante legal" + msg },
                    { field: "#direccionRepresentanteLegal", type: "text", value: o.direccionRepresentanteLegal, message: "Ingrese dirección representante legal" + msg },
                    { field: "#paisRepresentanteLegal", type: "select", value: o.paisRepresentanteLegal, message: "Ingrese país representante legal" + msg },
                    { field: "#departamentoRepresentanteLegal", type: "select", value: o.departamentoRepresentanteLegal, message: "Ingrese departamento representante legal" + msg },
                    { field: "#ciudadRepresentanteLegal", type: "select", value: o.ciudadRepresentanteLegal, message: "Ingrese ciudad representante legal" + msg },
                    { field: "#telefonoRepresentanteLegal", type: "text", value: o.telefonoRepresentanteLegal, message: "Ingrese teléfono representante legal" + msg },
                    { field: "#indicativoRepresentanteLegal", type: "text", value: o.indicativoRepresentanteLegal, message: "Ingrese indicativo representante legal" + msg },
                    { field: "#movilRepresentanteLegal", type: "text", value: o.movilRepresentanteLegal, message: "Ingrese móvil representante legal" + msg }
                ]
            });
        }

        return { ok: true };
    }


    //MANEJO DE CONDICIONES PARA TABS DINAMICAS ---------------------------------------------------------------------


    //MOSTRAR TAB OTROS DATOS ADICIONALES
    function resolverModoOtrosDatosAdicionales() {
        const tipoDocumento = formState?.datosPersonales?.tipoDocumento;

        const esPersonaJuridica = tienePersonaJuridica;
        const esApoderadoPorTipo = ["T", "R"].includes(tipoDocumento);
        const esApoderadoPorRelacion = relacionRepresentanteLegal === "M";

        const esApoderado = !esPersonaJuridica && (esApoderadoPorTipo || esApoderadoPorRelacion);
        const mostrarTab = esPersonaJuridica || esApoderado;

        return {
            esPersonaJuridica,
            esApoderado,
            mostrarTab
        };
    }

    function evaluarTabsDinamicas() {
        const estadoCivil = formState?.otrosDatos?.estadoCivil;
        const politicamenteExpuesto = formState?.otrosDatos?.esPep;
        const modoOtros = resolverModoOtrosDatosAdicionales();

        const tieneConyugue = ["C", "V"].includes(estadoCivil);
        const esPeps = politicamenteExpuesto === "S";

        $("#tab-otrosDatosAdicionales").toggle(modoOtros.mostrarTab);
        $("#tab-conyugue").toggle(tieneConyugue);
        $("#tab-familiaresPeps").toggle(esPeps);
    }

    //EVALUAR CONTENIDO OTROS DATOS ADICIONALES
    function evaluarContenidoOtrosDatosAdicionales() {
        const modoOtros = resolverModoOtrosDatosAdicionales();

        $("#apoderadoAsociado").toggle(modoOtros.esApoderado);
        $("#personaJuridica").toggle(modoOtros.esPersonaJuridica);
        $("#datosRepresentanteLegal").toggle(modoOtros.esPersonaJuridica);
    }

    //AUTOCOMPLETADO OTROS DATOS ADICIONALES
    $(document).on("input change", "#cedulaRepresentanteLegal", function () {
        const cedula = $(this).val().trim();
        if (!cedula) return;

        const encontrado = representantesLegalesRegistrados.find(item =>
            String(item.cedula || "").trim() === cedula
        );

        if (!encontrado) return;

        $("#nombreRepresentanteLegal")
            .val(String(encontrado.nombreintegrado || "").trim())
            .trigger("change");
    });


    //MANEJO DE LOS CAMPOS DEPENDIENTES PARA ESTAR O NO ESTAR HABILITADOS (pruebas)
    const camposQueMuestranTabs = [
        "tipoDocumento",
        "estadoCivil",
        "esPep"
    ];
    const camposQueCambianContenidoOtrosDatos = [
        "tipoDocumento"
    ];
    const camposQueCambianDeshabilitados = [
        "operacionesMonedaExtranjera",
        "poseeCuentasMonedaExtranjera",
        "esPep",
        "familiarEmpleadoEntidad",
        "familiarRecursosPublicos",
        "familiarPublicamenteExpuesto",
        "administraRecursosPublicos"
    ];
    function procesarCambioPorCampos(name, e) {
        if (camposQueMuestranTabs.includes(name)) {
            evaluarTabsDinamicas();
        }

        if (camposQueCambianContenidoOtrosDatos.includes(name)) {
            evaluarContenidoOtrosDatosAdicionales();
        }

        if (camposQueCambianDeshabilitados.includes(name)) {
            validarCamposDeshabilitados();
        }

        if (name === "tipoContrato") {
            const tipoContrato = formState?.datosLaborales?.tipoContrato;
            marcarCampoRequired("#pagaduria", tipoContrato !== "N");
        }

        if (
            name === "esPep" &&
            e?.originalEvent &&
            formState?.otrosDatos?.esPep === "S"
        ) {
            infoModal(
                "Usted es una persona expuesta políticamente y de acuerdo al decreto 830 del 26 de julio de 2021, las Personas Expuestas Políticamente deberán, declarar los nombres e identificación de las personas con las que tengan sociedad conyugal, de hecho, o de derecho, los nombres e identificación de sus familiares hasta segundo grado de consanguinidad",
                "informacion"
            );
        }
    }

    function marcarCampoRequired(selector, requerido) {
        const $campo = $(selector);
        if (!$campo.length) return;

        $campo.prop("required", requerido);

        if (!requerido) {
            $campo.removeClass("is-invalid");
        }
    }

    function limpiarCampoEstado($campo, tab) {
        const name = $campo.attr("name");
        if (!name) return;

        $campo.val("");
        $campo.removeClass("is-invalid");

        if (formState[tab] && Object.prototype.hasOwnProperty.call(formState[tab], name)) {
            formState[tab][name] = null;
        }
    }

    function marcarCamposDeshabilitados(selectores, deshabilitado, tab) {
        selectores.forEach(selector => {
            const $campo = $(selector);
            if (!$campo.length) return;

            $campo.prop("disabled", deshabilitado);
            $campo.css("background-color", deshabilitado ? "#e9ecef" : "#fff");

            if (deshabilitado) {
                limpiarCampoEstado($campo, tab);
            }

        });
    }

    function validarCamposDeshabilitados() {

        //REALIZA OPERACIONES EN MONEDA EXTRANJERA
        const realizaOperacionesMonedaExtranjera = formState.otrosDatos.operacionesMonedaExtranjera;
        const habilitarMonedaExtranjera = realizaOperacionesMonedaExtranjera == "S"
        const campoOperacionMonedaExtranjera = ["#cualesOperacionesMonedaExtranjera"];
        marcarCamposDeshabilitados(campoOperacionMonedaExtranjera, !habilitarMonedaExtranjera, "otrosDatos");
        campoOperacionMonedaExtranjera.forEach(id => {
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

        marcarCamposDeshabilitados(camposMonedaExtranjera, !habilitarCuentaMonedaExtranjera, "otrosDatos");
        camposMonedaExtranjera.forEach(id => {
            marcarCampoRequired(id, habilitarCuentaMonedaExtranjera)
        });

        //ES PEP
        const esPep = formState.otrosDatos.esPep;
        const habilitarTipoPep = esPep == "S"
        const campoTipoPep = ["#tipoPep", "#administraRecursosPublicos"];
        marcarCamposDeshabilitados(campoTipoPep, !habilitarTipoPep, "otrosDatos");
        campoTipoPep.forEach(id => {
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

        marcarCamposDeshabilitados(camposFamiliarEmpleadoEntidad, !habilitarFamiliarEmpleadoEntidad, "otrosDatos");
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

        marcarCamposDeshabilitados(camposFamiliarRecursosPublicos, !habilitarFamiliarRecursosPublicos, "otrosDatos");
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

        marcarCamposDeshabilitados(camposFamiliarPublicamenteExpuesto, !habilitarFamiliarPublicamenteExpuesto, "otrosDatos");
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
        marcarCamposDeshabilitados(camposAdminitraRecursos, !habilitarAdministraRecursos, "otrosDatos");
        camposAdminitraRecursos.forEach(id => {
            marcarCampoRequired(id, habilitarAdministraRecursos);
        });

    }


    //  SUMA DE TOTAL INGRESOS EGRESOS, PARA CUANDO EL USUARIO CAMBIA ALGUN VALOR QUE MODIFICA ESTOS
    const camposSumanIngresos = [
        "honorarios",
        "arriendos",
        "comisiones",
        "utilidadNegocio",
        "bonificaciones",
        "sueldo",
        "pensiones",
        "dividendos",
        "interesInversiones",
        "otrosIngresos"
    ];
    const camposSumanEgresos = [
        "alimentacion",
        "educacion",
        "serviciosPublicos",
        "arriendo",
        "transporte",
        "cuotaDomestica",
        "salud",
        "otrosGastos",
        "otrasDeudas",
        "prestamoVivienda",
        "otrosNegocios",
        "prestamoVehiculo",
        "tajetaCredito",
        "otrosPrestamos"
    ];

     function toNumber(value) {
        if (value === null || value === undefined || value === "") return 0;

        const texto = String(value).trim();
        const signo = texto.startsWith("-") ? -1 : 1;
        const limpio = limpiarNumero(texto);
        const numero = Number(limpio) * signo;
        return Number.isFinite(numero) ? numero : 0;
    }

    function recalcularTotalIngresos() {
        const i = formState.ingresosEgresos;

        const total = camposSumanIngresos.reduce((acum, campo) => {
            return acum + toNumber(i[campo]);
        }, 0);

        i.totalIngresos = String(total);
        pintarCampoMoneda("#totalIngresos", i.totalIngresos);
    }

    function recalcularTotalEgresos() {
        const i = formState.ingresosEgresos;

        const total = camposSumanEgresos.reduce((acum, campo) => {
            return acum + toNumber(i[campo]);
        }, 0);

        i.totalEgresos = String(total);
        pintarCampoMoneda("#totalEgresos", i.totalEgresos);
    }

    function sincronizarSueldoDesdeSalario() {
        const salario = formState?.datosLaborales?.salario ?? "";

        formState.ingresosEgresos.sueldo = salario;
        pintarCampoMoneda("#sueldo", salario);

        recalcularTotalIngresos();
    }

    function procesarTotalesIngresosEgresos(tab, name) {
        if (tab === "ingresosEgresos") {
            if (camposSumanIngresos.includes(name)) {
                recalcularTotalIngresos();
            }

            if (camposSumanEgresos.includes(name)) {
                recalcularTotalEgresos();
            }
        }

        if (tab === "datosLaborales" && name === "salario") {
            sincronizarSueldoDesdeSalario();
        }
    }

    let infoModalOnClose = null;
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
        const config = configPorTipo[tipo] || configPorTipo["informacion"];
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
            const closeHandler = typeof onClose === "function"
                ? onClose
                : infoModalOnClose;

            infoModalOnClose = null;

            if (typeof closeHandler === "function") {
                closeHandler();
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
    function normalizarRespuestaAutorizacion(valor) {
        return valor === true ||
            valor === "true" ||
            valor === "S" ||
            valor === "s" ||
            valor === "on" ||
            valor === 1 ||
            valor === "1";
    }

    function requiereRespuestaAutorizacion(autorizacion) {
        if (typeof autorizacion?.requiereRespuesta === "boolean") {
            return autorizacion.requiereRespuesta;
        }

        return Boolean(autorizacion?.obligatorio);
    }

    function inicializarEstadoAutorizacion(autorizacion) {
        const codigo = String(autorizacion?.codigo ?? "").trim();
        if (!codigo) return false;

        if (!formState.autorizaciones || typeof formState.autorizaciones !== "object") {
            formState.autorizaciones = {};
        }

        const requiereRespuesta = requiereRespuestaAutorizacion(autorizacion);

        if (!requiereRespuesta) {
            formState.autorizaciones[codigo] = true;
            return true;
        }

        if (Object.prototype.hasOwnProperty.call(formState.autorizaciones, codigo)) {
            formState.autorizaciones[codigo] = normalizarRespuestaAutorizacion(formState.autorizaciones[codigo]);
            return formState.autorizaciones[codigo];
        }

        formState.autorizaciones[codigo] = normalizarRespuestaAutorizacion(autorizacion.respuestaActual);
        return formState.autorizaciones[codigo];
    }

    async function initAutorizaciones() {
        const $contenedorAutorizaciones = $("#autorizaciones-content");
        if (!$contenedorAutorizaciones.length) return;
        autorizaciones = await cargarAutorizacionesBackend();
        if (!Array.isArray(autorizaciones)) return;
        $contenedorAutorizaciones.empty();
        autorizaciones.forEach(aut => {
            if (!aut.activo) return;

            const codigo = String(aut.codigo ?? "").trim();
            const requiereRespuesta = requiereRespuestaAutorizacion(aut);
            const autorizada = inicializarEstadoAutorizacion(aut);
            const marcaObligatorio = requiereRespuesta
                ? '<span class="text-danger">*</span>'
                : '';
            const controlRespuesta = requiereRespuesta
                ? `
                <div class="form-check form-switch">
                    <input class="form-check-input autorizacion-switch"
                        type="checkbox"
                        id="switch-${codigo}"
                        data-codigo="${codigo}"
                        ${autorizada ? 'checked' : ''}
                        required>
                    <label class="form-check-label"
                        for="switch-${codigo}">
                    Autorizo
                    </label>
                </div>
                `
                : '<span class="badge bg-secondary">No requiere respuesta</span>';

            const html = `
            <div class="col-12 mb-4 autorizacion-item"
                data-codigo="${codigo}">
            <div class="app-paper elevation-2 h-100 d-flex flex-column p-3">
                <h6 class="table-headers">
                ${aut.nombre} ${marcaObligatorio}
                </h6>
                <p class="table-body mb-2">
                ${aut.descripcion}
                </p>
                <div class="mt-auto">
                ${controlRespuesta}
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


    // ADJUNTOS -----------------------------------------------------------------------------------------------------------

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

    async function initAdjuntos() {
        const $contenedorAdjuntos = $("#adjuntos-content");
        if (!$contenedorAdjuntos.length) return;

        const data = await cargarAdjuntosBackend();
        const adjuntos = Array.isArray(data.items) ? data.items : [];
        adjuntosCatalogo = adjuntos;

        $contenedorAdjuntos.empty();

        adjuntos.forEach((adj, index) => {
            const posicion = index + 1;
            const estado = adjuntosState[adj.codigo];

            const html = `
            <div class="col-12 col-md-6 col-lg-4 mb-4 adjunto-item"
                data-codigo="${adj.codigo}"
                data-obligatorio="${adj.obligatorio ? "S" : "N"}">
                <div class="app-paper elevation-4 h-100 d-flex flex-column p-3">
                <h6 class="table-headers">
                    ${formatearNombreAdjunto(adj.nombre)} ${adj.obligatorio ? '<span class="text-danger">*</span>' : ''}
                </h6>

                <small class="text-muted mb-2">${adj.descripcion}</small>

                <div class="mt-auto">
                    <input type="hidden" name="codadjunto${posicion}" value="${adj.codadjunto}">
                    <input type="hidden" name="codnomadjunto${posicion}" value="${adj.codnomadjunto}">
                    <input type="file"
                    name="txtadjunto${posicion}"
                    id="txtadjunto${posicion}"
                    class="form-control form-control-sm adjuntospintados">

                    <div class="adjunto-estado small mt-2">
                    ${estado ? `Archivo cargado: ${estado.nombre}` : "Sin archivo"}
                    </div>

                    <div class="adjunto-error text-danger small mt-1"></div>
                </div>
                </div>
            </div>
            `;

            $contenedorAdjuntos.append(html);
        });
    }



    //PERSISTENCIA DE LOS ADJUNTOS MIENTRAS SE ESTA EN LA ACTUALIZACION

    const ADJUNTOS_META_KEY = "adjuntosMeta";
    const ADJUNTOS_DB_NAME = "actualizacionDatosDB";
    const ADJUNTOS_STORE_NAME = "adjuntos";

    let adjuntosCatalogo = [];
    let adjuntosState = {};


    function abrirAdjuntosDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(ADJUNTOS_DB_NAME, 1);

            request.onupgradeneeded = function (event) {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(ADJUNTOS_STORE_NAME)) {
                    db.createObjectStore(ADJUNTOS_STORE_NAME, { keyPath: "codigo" });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function guardarAdjuntoDB(codigo, file) {
        const db = await abrirAdjuntosDB();

        return new Promise((resolve, reject) => {
            const tx = db.transaction(ADJUNTOS_STORE_NAME, "readwrite");
            const store = tx.objectStore(ADJUNTOS_STORE_NAME);

            store.put({
                codigo,
                file,
                nombre: file.name,
                size: file.size,
                type: file.type
            });

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async function obtenerAdjuntoDB(codigo) {
        const db = await abrirAdjuntosDB();

        return new Promise((resolve, reject) => {
            const tx = db.transaction(ADJUNTOS_STORE_NAME, "readonly");
            const store = tx.objectStore(ADJUNTOS_STORE_NAME);
            const request = store.get(codigo);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async function eliminarAdjuntoDB(codigo) {
        const db = await abrirAdjuntosDB();

        return new Promise((resolve, reject) => {
            const tx = db.transaction(ADJUNTOS_STORE_NAME, "readwrite");
            const store = tx.objectStore(ADJUNTOS_STORE_NAME);

            store.delete(codigo);

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }


    function guardarAdjuntosSession() {
        sessionStorage.setItem(ADJUNTOS_META_KEY, JSON.stringify(adjuntosState));
    }

    function cargarAdjuntosSession() {
        const saved = sessionStorage.getItem(ADJUNTOS_META_KEY);
        adjuntosState = saved ? JSON.parse(saved) : {};
    }

    function validarArchivoAdjunto(file) {
        if (!file) {
            return { ok: false, message: "Debe seleccionar un archivo" };
        }

        const ext = file.name.split(".").pop()?.toLowerCase();
        const esPdfMime = file.type === "application/pdf";
        const esPdfExt = ext === "pdf";
        const sizeMax = 8 * 1024 * 1024;

        if (!esPdfMime && !esPdfExt) {
            return { ok: false, message: "Solo se permiten archivos PDF" };
        }

        if (file.size > sizeMax) {
            return { ok: false, message: "El archivo supera el tamaño permitido" };
        }

        return { ok: true };
    }

    function pintarEstadoAdjunto($item, mensaje) {
        $item.find(".adjunto-estado").text(mensaje);
    }

    function pintarErrorAdjunto($item, mensaje) {
        $item.find(".adjunto-error").text(mensaje);
    }

    $(document).on("change", ".adjuntospintados", async function () {
        try {
            const $input = $(this);
            const $item = $input.closest(".adjunto-item");
            const codigo = String($item.data("codigo"));
            const obligatorio = $item.data("obligatorio") === "S";
            const file = this.files?.[0];

            const validacion = validarArchivoAdjunto(file);

            if (!validacion.ok) {
                delete adjuntosState[codigo];
                await eliminarAdjuntoDB(codigo);
                pintarErrorAdjunto($item, validacion.message);
                pintarEstadoAdjunto($item, "Sin archivo");
                $input.val("");
                guardarAdjuntosSession();
                return;
            }

            await guardarAdjuntoDB(codigo, file);

            adjuntosState[codigo] = {
                codigo,
                nombre: file.name,
                size: file.size,
                type: file.type,
                obligatorio,
                valido: true
            };

            pintarErrorAdjunto($item, "");
            pintarEstadoAdjunto($item, `Archivo cargado: ${file.name}`);
            guardarAdjuntosSession();
            modificado = true;
        } catch (error){
            console.error("Error guardando adjunto:", error);
            pintarErrorAdjunto($(this).closest(".adjunto-item"), "No fue posible guardar el adjunto");
        }
    });

    async function validarAdjuntos() {
        try {
            if (!adjuntosCatalogo.length) {
                const data = await cargarAdjuntosBackend();
                adjuntosCatalogo = Array.isArray(data.items) ? data.items : [];
            }

            for (const adj of adjuntosCatalogo) {
                if (!adj.obligatorio) continue;

                const meta = adjuntosState[adj.codigo];
                const persistido = await obtenerAdjuntoDB(adj.codigo);

                if (!meta || !persistido) {
                    return crearError(
                        "adjuntos",
                        `.adjunto-item[data-codigo="${adj.codigo}"] input[type="file"]`,
                        `Debe adjuntar ${formatearNombreAdjunto(adj.nombre)}`
                    );
                }
            }

            return { ok: true };
        } catch (error){
            console.error("Error validando adjuntos:", error);
            return crearError("adjuntos", null, "No fue posible validar los adjuntos");
        }
    }

    async function reconciliarAdjuntosSession() {
        const codigos = Object.keys(adjuntosState);

        for (const codigo of codigos) {
            const guardado = await obtenerAdjuntoDB(codigo);
            if (!guardado) {
                delete adjuntosState[codigo];
            }
        }

        guardarAdjuntosSession();
    }

    function existeAdjuntosSession() {
        return sessionStorage.getItem(ADJUNTOS_META_KEY) !== null;
    }

    async function limpiarAdjuntosDB() {
        const db = await abrirAdjuntosDB();

        return new Promise((resolve, reject) => {
            const tx = db.transaction(ADJUNTOS_STORE_NAME, "readwrite");
            const store = tx.objectStore(ADJUNTOS_STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }


    async function obtenerTodosAdjuntosDB() {
        const db = await abrirAdjuntosDB();

        return new Promise((resolve, reject) => {
            const tx = db.transaction(ADJUNTOS_STORE_NAME, "readonly");
            const store = tx.objectStore(ADJUNTOS_STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }


    //LOGICA DE OTROS DATOS - GRUPO PROTECCION
    let grupoProteccionCatalogo = [];
    function normalizarGrupoProteccionEstado(grupo) {
        if (Array.isArray(grupo)) {
            return grupo
                .map(item => String(item ?? "").trim())
                .filter(Boolean);
        }

        const texto = String(grupo ?? "").trim();

        if (!texto || texto === "[]") {
            return [];
        }

        try {
            const parsed = JSON.parse(texto);
            return Array.isArray(parsed)
                ? parsed.map(item => String(item ?? "").trim()).filter(Boolean)
                : [String(parsed ?? "").trim()].filter(Boolean);
        } catch (error) {
            return [texto];
        }
    }

    async function cargarGrupoProteccionBackend() {
        try {
            const response = await fetch("/actualizaciondatos/grupoProteccion");

            if (!response.ok) {
                console.error("Error al obtener grupo de proteccion:", response.statusText);
                return [];
            }

            const data = await response.json();

            return (Array.isArray(data) ? data : [])
                .map(item => ({
                    codigo: String(item?.Code ?? item?.codigo ?? "").trim(),
                    nombre: String(item?.Name ?? item?.nombre ?? "").trim()
                }))
                .filter(item => item.codigo && item.nombre);
        } catch (error) {
            console.error("Excepcion cargando grupo de proteccion:", error);
            return [];
        }
    }

    function sincronizarGrupoProteccionDesdeEstado() {
        const seleccion = normalizarGrupoProteccionEstado(formState?.otrosDatos?.grupoProteccion);
        const codigos = new Set(grupoProteccionCatalogo.map(item => item.codigo));
        const $checks = $("#grupoProteccionLista .grupo-proteccion-checkbox");
        const $checkOtro = $("#grupoProteccionOtroCheck");
        const $inputOtro = $("#grupoProteccionOtroInput");
        const $contenedorOtro = $("#grupoProteccionOtroContenedor");

        $checks.prop("checked", false);
        $inputOtro.val("");

        seleccion.forEach(valor => {
            const normalizado = String(valor ?? "").trim();

            if (!normalizado) return;

            const $checkbox = $checks.filter(`[data-codigo="${normalizado}"]`);

            if ($checkbox.length) {
                $checkbox.prop("checked", true);
                return;
            }

            if ($checkOtro.length && !codigos.has(normalizado)) {
                $checkOtro.prop("checked", true);
                $inputOtro.val(normalizado);
            }
        });

        $contenedorOtro.toggle($checkOtro.is(":checked"));
    }

    function renderGrupoProteccionCatalogo() {
        const $lista = $("#grupoProteccionLista");
        if (!$lista.length) return;

        if (!grupoProteccionCatalogo.length) {
            $lista.html('<div class="small text-muted">No hay grupos de proteccion parametrizados.</div>');
            return;
        }

        let html = "";

        grupoProteccionCatalogo.forEach(item => {
            if (item.codigo !== "99") {
                html += `
                    <div class="form-check">
                        <input class="form-check-input app-checkbox grupo-proteccion-checkbox"
                            type="checkbox"
                            id="grupoProteccion-${item.codigo}"
                            data-codigo="${item.codigo}">
                        <label class="form-check-label" for="grupoProteccion-${item.codigo}">
                            ${item.nombre}
                        </label>
                    </div>
                `;
                return;
            }

            html += `
                <div class="form-check">
                    <input class="form-check-input app-checkbox grupo-proteccion-checkbox"
                        type="checkbox"
                        id="grupoProteccionOtroCheck"
                        data-codigo="${item.codigo}">
                    <label class="form-check-label" for="grupoProteccionOtroCheck">
                        ${item.nombre}
                    </label>
                </div>
                <div id="grupoProteccionOtroContenedor" style="display: none;" class="mt-2">
                    <input type="text"
                        class="form-control"
                        placeholder="Especifique aqui..."
                        id="grupoProteccionOtroInput">
                </div>
            `;
        });

        $lista.html(html);
        sincronizarGrupoProteccionDesdeEstado();
    }

    async function asegurarGrupoProteccionCatalogo() {
        if (!grupoProteccionCatalogo.length) {
            grupoProteccionCatalogo = await cargarGrupoProteccionBackend();
        }

        renderGrupoProteccionCatalogo();
    }

    function obtenerGrupoProteccionSeleccionado() {
        const seleccion = [];

        $("#grupoProteccionLista .grupo-proteccion-checkbox:checked").each(function () {
            const codigo = String($(this).data("codigo") ?? "").trim();

            if (!codigo) return;

            if (codigo === "99") {
                const otro = String($("#grupoProteccionOtroInput").val() ?? "").trim();
                if (otro) {
                    seleccion.push(otro);
                }
                return;
            }

            seleccion.push(codigo);
        });

        return seleccion;
    }

    function initOtrosDatos() {
        const $contenedorOtrosDatos = $("#otrosDatos");
        if (!$contenedorOtrosDatos.length) return;

        asegurarGrupoProteccionCatalogo();

        $contenedorOtrosDatos
            .off("click.otrosDatos", "#btnGrupoProteccion")
            .on("click.otrosDatos", "#btnGrupoProteccion", async function () {
                await asegurarGrupoProteccionCatalogo();
                sincronizarGrupoProteccionDesdeEstado();
                $("#modalGrupoProteccion").modal("show");
            });

        $contenedorOtrosDatos
            .off("change.otrosDatos", "#grupoProteccionOtroCheck")
            .on("change.otrosDatos", "#grupoProteccionOtroCheck", function () {
                const $contenedorOtro = $("#grupoProteccionOtroContenedor");
                const $inputOtro = $("#grupoProteccionOtroInput");

                $contenedorOtro.toggle(this.checked);

                if (!this.checked) {
                    $inputOtro.val("");
                }
            });

        $contenedorOtrosDatos
            .off("click.otrosDatos", "#btnAceptarGrupoProteccion")
            .on("click.otrosDatos", "#btnAceptarGrupoProteccion", function () {
                const $checkOtro = $("#grupoProteccionOtroCheck");
                const $textoOtro = $("#grupoProteccionOtroInput");
                const textoOtro = String($textoOtro.val() ?? "").trim();

                if ($checkOtro.is(":checked") && !textoOtro) {
                    alert("Especifique el grupo de proteccion");
                    $textoOtro.focus();
                    return;
                }

                if (!$checkOtro.is(":checked") && textoOtro) {
                    alert("Debe seleccionar la opcion Otro para guardar ese valor");
                    $checkOtro.focus();
                    return;
                }

                formState.otrosDatos.grupoProteccion = obtenerGrupoProteccionSeleccionado();
                guardarSessionStorage();

                if (!modificado) {
                    modificado = true;
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
        if (nuevaReferencia.telefono && (longitudNumerica(nuevaReferencia.telefono) < 7 || longitudNumerica(nuevaReferencia.telefono) > 10)) {
            alert('El telefono de la referencia debe tener entre 7 y 10 digitos');
            $('#telefonoReferencia').focus();
            return;
        }

        if (nuevaReferencia.telefonoOficina && (longitudNumerica(nuevaReferencia.telefonoOficina) < 7 || longitudNumerica(nuevaReferencia.telefonoOficina) > 10)) {
            alert('El telefono de oficina de la referencia debe tener entre 7 y 10 digitos');
            $('#telefonoOficinaReferencia').focus();
            return;
        }

        if (nuevaReferencia.celular && longitudNumerica(nuevaReferencia.celular) !== 10) {
            alert('El celular de la referencia debe tener 10 digitos');
            $('#celularReferencia').focus();
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
    $(document).on("input", "[data-moneda], [data-solo-numeros], [data-telefono], [data-celular]", function () {
        normalizarValorCampo($(this));
    });

    //GUARDAR CAMBIOS DE INPUTS EN EL ESTADO GLOBAL
    $(document).on("input change", "input, select, textarea", function (e) {

        const tab = $(".app-tab.active").data("tab");
        const name = $(this).attr("name");

        if (!tab || !name) return;
        if (!formState[tab]) return;

        formState[tab][name] = normalizarValorCampo($(this));
        if (!modificado) {
            modificado = true;
        }

        procesarTotalesIngresosEgresos(tab, name);
        if (e.type === "change") {
            procesarCambioPorCampos(name, e);
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
                if ($field.is("[data-moneda]")) {
                    $field.val(formatearMiles(state[key]));
                    return;
                }

                if ($field.is("[data-solo-numeros], [data-telefono], [data-celular]")) {
                    $field.val(limitarDigitos(state[key], $field.attr("data-max-digitos")));
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

    //PRUEBA DE PERSISTENCIA EN SESSION STORAGE
    const STORAGE_KEY = "testSavingFormState";
    // GUARDA LOS DATOS DEL FORMSTATE EN SESSION STORAGE
    function guardarSessionStorage() {
        try {
            normalizarNumerosFormState();
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formState));
            sessionStorage.setItem("peopleInCharge", JSON.stringify(peopleInChargeNew));
            sessionStorage.setItem("references", JSON.stringify(referencesNew));
            sessionStorage.setItem("familiarPeps", JSON.stringify(familiarPepsNew));
            guardarAdjuntosSession();
        } catch (error) {
            console.error("Error al guardar el formulario en session storage", error);
        }
    }

    // CARGA LOS DATOS DEL SESSION STORAGE AL FORMSTATE
    async function cargarSessionStorage() {

        try {

            const formData = sessionStorage.getItem(STORAGE_KEY);
            const peopleInChargeData = sessionStorage.getItem("peopleInCharge");
            const referencesData = sessionStorage.getItem("references");
            const familiarPepsData = sessionStorage.getItem("familiarPeps");

            await cargarAdjuntosSession();
            await reconciliarAdjuntosSession();
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
        if (sessionStorage.getItem(STORAGE_KEY) !== null || sessionStorage.getItem("peopleInCharge") !== null || sessionStorage.getItem("references") !== null || sessionStorage.getItem("familiarPeps") !== null || existeAdjuntosSession()) {
            return true;
        } else {
            return false;
        }
    }


    //ESTAS VARIABLES SE USAN PARA LA LOGICA DE SI SE MUESTRA O NO OTROS DATOS ADICIONALES
    let representantesLegalesRegistrados = [];
    let relacionRepresentanteLegal = "";
    let tienePersonaJuridica = false;

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
                const { representantesLegalesRegistrados: lista = [], relacionRepresentanteLegal: relacion = "", tienePersonaJuridica: juridica = false, ...datosFormulario } = resData;
                representantesLegalesRegistrados = Array.isArray(lista) ? lista : [];
                relacionRepresentanteLegal = String(relacion || "").trim();
                tienePersonaJuridica = Boolean(juridica);


                formState = {
                    ...formState,
                    ...datosFormulario
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
            await cargarSessionStorage();
            infoModal("Aun tiene datos sin enviar, continúe con la actualizacion de datos y presione finalizar para enviar la información", "alerta");
        }
        evaluarTabsDinamicas();
        evaluarContenidoOtrosDatosAdicionales();
        formularioInicializado = true;
    }


    //LIMPIAR SESSION STORAGE PARA CUANDO SE ENVIE EL FORMULARIO (PRUEBA)
    async function limpiarSessionStorage() {
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem("peopleInCharge");
        sessionStorage.removeItem("references");
        sessionStorage.removeItem("familiarPeps");
        sessionStorage.removeItem(ADJUNTOS_META_KEY);
        await limpiarAdjuntosDB();
    }

    let enviado = false;
    //Prueba guardando en caso de reloads si no se ha enviado
    window.addEventListener("beforeunload", function (e) {

        if (window.__cerrandoSesion) {
            return;
        }

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
        tipocontrato: { id: "codigotipocontrato", text: "nombretipocontrato" },
        ocupacionactualizacion: { id: "Code", text: "Name" }
    };

    async function obtenerDatos(url, tipo) {

        const res = await fetch(url);
        if (!res.ok) throw new Error("Error cargando datos");

        const data = await res.json();

        let configIds = idsEspeciales[tipo] || defaultIds;
        const { id, text } = configIds;
        return normalizarCombo(data, id, text);

    }

    function limpiarCampoCombo(select) {
        const tab = $(".app-tab.active").data("tab");
        const name = select.attr("name");

        select.val("");

        if (tab && name && formState[tab]) {
            formState[tab][name] = "";
        }
    }

    function limpiarCombosDependientes(parentSelect) {
        const parentId = parentSelect.attr("id");

        if (!parentId) return;

        $(`select[data-depende]`).each(function () {
            const child = $(this);
            const depende = String(child.data("depende") || "")
                .split(",")
                .map(x => x.trim());

            if (depende.includes(parentId)) {
                child.html(`<option value=""></option>`);
                limpiarCampoCombo(child);
                limpiarCombosDependientes(child);
            }
        });
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
        
        //SI EL VALOR VIENE PERO NO HAY MATCH CON ALGUN ID EN EL COMBO NO HAY CONSISTENCIA EN LA INFORMACION, SE VACIA 
        //EL VALOR EN EL COMBO PARA QUE EL USUARIO DEBA LLENAR CON LA INFORMACION ACTUAL SI QUIERE MANDAR LA ACTU
        const tab = $(".app-tab.active").data("tab");
        const name = select.attr("name");

        if (!tab || !name || !formState[tab]) {
            return;
        }

        const valueToSet = formState[tab][name];

        if (valueToSet === null || valueToSet === undefined || valueToSet === "") {
            return;
        }

        const match = Array.isArray(data)
            ? data.find(item => String(item.id) == String(valueToSet))
            : null;

        if (match) {
            select.val(match.id);
            formState[tab][name] = match.id;
            select.trigger("change");
            return;
        }

        if (Array.isArray(data) && data.length > 0) {
            select.val("");
            formState[tab][name] = "";
            limpiarCombosDependientes(select);
        }

        //  FUNCION VIEJA QUE NO CAMBIA EL VALOR EN FORMSTATE
        // const tab = $(".app-tab.active").data("tab");
        // const name = select.attr("name");
        // if (tab && name && formState[tab]) {
        //     const valueToSet = formState[tab][name];
        //     if (valueToSet !== null && valueToSet !== undefined && valueToSet !== "") {
        //         const exists = data.some(item => item.id == valueToSet);
        //         if (exists) {
        //             select.val(valueToSet);
        //             select.trigger("change"); // SE ACTIVA EL CHANGE PARA EL EFECTO CASCADA
        //         }
        //     }
        // }
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
    
    //CUANDO SE PULSA EL BOTON FINALIZAR
    $(document).on("click", "#btnFinalizar", async function (e) {
        e.preventDefault();

        const esValido = await validarActualizacionDatos();
        if (!esValido) {
            return;
        }

        // // infoModal("La validacion fue exitosa", "exito");
        // // console.log("FormSate:", formState)
        await enviarSolicitudActualizacionDatos();
        // await limpiarSessionStorage();
        // enviado = true;
    });


   async function enviarSolicitudActualizacionDatos() {
        const confirmar = window.confirm("¿Desea enviar la solicitud de actualización de datos?");
        if (!confirmar) {
            return;
        }

        const $btn = $("#btnFinalizar");
        const textoOriginal = $btn.html();

        try {
            mostrarLoader("Enviando solicitud...");
            $btn.prop("disabled", true).text("Enviando...");

            // Asegura que sessionStorage e IndexedDB estén sincronizados
            await reconciliarAdjuntosSession();

            const adjuntosGuardados = await obtenerTodosAdjuntosDB();

            // Metadata de adjuntos en el mismo orden en que se enviarán los archivos
            const adjuntosMeta = adjuntosGuardados.map((adjunto, index) => {
                const codigo = String(adjunto.codigo || "");
                const estadoAdjunto = adjuntosState[codigo] || {};
                const catalogoAdjunto = Array.isArray(adjuntosCatalogo)
                    ? adjuntosCatalogo.find(item => String(item.codigo) === codigo)
                    : null;

                return {
                    index,
                    codigo,
                    nombreArchivo: adjunto.nombre || estadoAdjunto.nombre || "",
                    tipo: adjunto.type || estadoAdjunto.type || "",
                    size: adjunto.size || estadoAdjunto.size || 0,
                    obligatorio: Boolean(estadoAdjunto.obligatorio),
                    nombreAdjunto: catalogoAdjunto?.nombre || ""
                };
            });

            const formData = new FormData();

            formData.append("formState", JSON.stringify(formState || {}));
            formData.append("references", JSON.stringify(referencesNew || []));
            formData.append("peopleInCharge", JSON.stringify(peopleInChargeNew || []));
            formData.append("familiarPeps", JSON.stringify(familiarPepsNew || []));
            formData.append("adjuntosMeta", JSON.stringify(adjuntosMeta));

            for (const adjunto of adjuntosGuardados) {
                if (adjunto?.file) {
                    formData.append("adjuntos", adjunto.file);
                }
            }

            const response = await fetch("/actualizaciondatos/guardar", {
                method: "POST",
                body: formData
            });

            let result = {};
            try {
                result = await response.json();
            } catch {
                result = {};
            }

            if (!response.ok || !result.estado) {
                throw new Error(result.mensaje || "No fue posible guardar la actualización de datos");
            }

            await limpiarSessionStorage();
            enviado = true;
            modificado = false;
            const redirectTo = result.redirectTo || "/ahorro/crear";
            infoModalOnClose = () => {
                window.location.href = redirectTo;
            };

            infoModal(result.mensaje || "La actualización de datos fue enviada correctamente", "exito");
        } catch (error) {
            console.error("Error enviando actualización de datos:", error);
            infoModal(error.message || "Ocurrió un error al enviar la información", "alerta");
        } finally {
            ocultarLoader();
            $btn.prop("disabled", false).html(textoOriginal);
        }
    }


})();



