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

    //CARGAR TAB DINAMICO PRUEBA
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

    //MANEJO DE CONDICIONES PARA TABS DINAMICAS
    $(document).on("change", "#tipoDocumento", function () {
        evaluarTabsDinamicas();
    });
    $(document).on("change", "#estadoCivil", function () {
        evaluarTabsDinamicas();
    });
    $(document).on("change", "#esPep", function () {
        evaluarTabsDinamicas();
        if (this.value === "S") {
            alertaModal("Usted es una persona expuesta políticamente y de acuerdo al decreto 830 del 26 de julio de 2021, las Personas Expuestas Políticamente deberán, declarar los nombres e identificación de las personas con las que tengan sociedad conyugal, de hecho, o de derecho, los nombres e identificación de sus familiares hasta segundo grado de consanguinidad", "Persona expuesta políticamente");
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

    //CAMBIO EN BOTON
    $(document).on("change", "#familiarEmpleadoEntidad", function () {
        validarCamposDeshabilitados();
    });

    $(document).on("change", "#familiarRecursosPublicos", function () {
        validarCamposDeshabilitados();
    });

    $(document).on("change", "#familiarPublicamenteExpuesto", function () {
        validarCamposDeshabilitados();
    });

    function validarCamposDeshabilitados() {

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
        camposFamiliarEmpleadoEntidad.forEach(id => {
            $(id)
                .prop("disabled", !habilitarFamiliarEmpleadoEntidad)
                .css("background-color", habilitarFamiliarEmpleadoEntidad ? "#fff" : "#e9ecef");

            if (!habilitarFamiliarEmpleadoEntidad) {
                $(id).val("");
                const campo = id.replace("#", "");
                formState.otrosDatos[campo] = null;
            }
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
        camposFamiliarRecursosPublicos.forEach(id => {
            $(id)
                .prop("disabled", !habilitarFamiliarRecursosPublicos)
                .css("background-color", habilitarFamiliarRecursosPublicos ? "#fff" : "#e9ecef");

            if (!habilitarFamiliarRecursosPublicos) {
                $(id).val("");
                const campo = id.replace("#", "");
                formState.otrosDatos[campo] = null;
            }
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

        camposFamiliarPublicamenteExpuesto.forEach(id => {
            $(id)
                .prop("disabled", !habilitarFamiliarPublicamenteExpuesto)
                .css("background-color", habilitarFamiliarPublicamenteExpuesto ? "#fff" : "#e9ecef");

            if (!habilitarFamiliarPublicamenteExpuesto) {
                $(id).val("");
                const campo = id.replace("#", "");
                formState.otrosDatos[campo] = null;
            }
        });
    }

    //FNCION DE MODAL CON INFORMACION
    function alertaModal(mensaje, titulo) {
        const modalHTML = `
            <div class="modal fade app-modal" id="alertaModalTemp">
                <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content app-modal__content">
                
                    <div class="app-modal__header">
                    <h5 class="app-modal__title">${titulo}</h5>
                    <button type="button" class="app-modal__close" data-bs-dismiss="modal">×</button>
                    </div>

                    <div class="app-modal__body">
                    ${mensaje}
                    </div>

                    <div class="app-modal__footer">
                    <button class="app-button" data-bs-dismiss="modal">Aceptar</button>
                    </div>

                </div>
                </div>
            </div>
        `;
        $("body").append(modalHTML);

        const $modalElement = $("#alertaModalTemp");
        const modal = new bootstrap.Modal($modalElement[0]);
        modal.show();

        $modalElement.on("hidden.bs.modal", function () {
            $(this).remove();
        });
    }



    // AUTORIZACIONES
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


    async function initAutorizaciones() {
        const $contenedorAutorizaciones = $("#autorizaciones-content");
        if (!$contenedorAutorizaciones.length) return;
        const autorizaciones = await cargarAutorizacionesBackend();
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
    $(document).on("click", "#btnFinalizar", function () {
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
            alertaModal("Aun tiene datos sin enviar, continúe con la actualizacion de datos y presione finalizar para enviar la información", "Información");
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



