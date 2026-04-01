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
                    renderReferences();
                    renderReferencesNew();
                }
                if (tab === 'personasACargo') {
                    renderPeopleInChargeReal();
                    renderPeopleInChargeNew();
                }
                if (tab === 'familiaresPeps') {
                    renderFamiliarPepsReal();
                    renderFamiliarPepsNew();
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

        const tieneConyugue = ["C", "U"].includes(estadoCivil);
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

        document.body.insertAdjacentHTML("beforeend", modalHTML);

        const modalElement = document.getElementById("alertaModalTemp");
        const modal = new bootstrap.Modal(modalElement);

        modal.show();

        modalElement.addEventListener("hidden.bs.modal", () => {
            modalElement.remove();
        });
    }

    // AUTORIZACIONES
    function initAutorizaciones() {
        const $contenedorAutorizaciones = $("#autorizaciones-content");
        if (!$contenedorAutorizaciones.length) return;
        const autorizaciones = [
            {
                codigo: "AUT_1",
                nombre: "Autorización de tratamiento de datos personales",
                descripcion: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod.",
                obligatorio: true,
                activo: true
            },
            {
                codigo: "AUT_2",
                nombre: "Autorización de tratamiento de datos sensibles",
                descripcion: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod.",
                obligatorio: false,
                activo: true
            },
            {
                codigo: "AUT_3",
                nombre: "Autorización de tratamiento de datos de menores",
                descripcion: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod.",
                obligatorio: false,
                activo: true
            }
        ];
        $contenedorAutorizaciones.empty();
        autorizaciones.forEach(aut => {
            if (!aut.activo) return;

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
                    <input class="form-check-input"
                        type="checkbox"
                        id="switch-${aut.codigo}"
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

    // ADJUNTOS
    function initAdjuntos() {

        const $contenedorAdjuntos = $("#adjuntos-content");
        if (!$contenedorAdjuntos.length) return;

        const adjuntosERP = [
            {
                codigo: "DOC_CC",
                nombre: "Cédula de ciudadanía",
                obligatorio: true,
                activo: true,
                mensaje: "Documento legible por ambas caras",
                yaSubido: false,
                volverAPedir: false
            },
            {
                codigo: "DOC_RUT",
                nombre: "RUT KAKA",
                obligatorio: true,
                activo: true,
                mensaje: "Documento legible y actualizado",
                yaSubido: true,
                volverAPedir: true
            },
            {
                codigo: "DOC_ING",
                nombre: "Certificado de ingresos",
                obligatorio: false,
                activo: true,
                mensaje: "No mayor a 30 días",
                yaSubido: true,
                volverAPedir: false
            },
            {
                codigo: "DOC_ING2",
                nombre: "Certificado de ingresos2",
                obligatorio: true,
                activo: true,
                mensaje: "No mayor a 30 días",
                yaSubido: false,
                volverAPedir: true
            }
        ];

        $contenedorAdjuntos.empty();

        adjuntosERP.forEach(adj => {
            if (!adj.activo) return;

            const marcaObligatorio = adj.obligatorio
                ? '<span class="text-danger">*</span>'
                : '';

            let accion = '';

            if (adj.yaSubido && !adj.volverAPedir) {
                accion = `
          <div class="alert alert-success py-2 mb-0 small text-center border-0">
            Documento ya cargado en el sistema
          </div>
        `;
            } else {
                const alertaRequerido = adj.volverAPedir ?
                    '<div class="mb-2"><span class="badge bg-warning text-dark">Actualización requerida</span></div>' : '';
                accion = `
          ${alertaRequerido}
          <input type="file"
                 class="form-control form-control-sm"
                 ${adj.obligatorio ? 'required' : ''}>
        `;
            }

            const html = `
        <div class="col-12 col-md-6 col-lg-4 mb-4 adjunto-item"
             data-codigo="${adj.codigo}">
          <div class="app-paper elevation-4 h-100 d-flex flex-column p-3">
            <h6 class="table-headers">
              ${adj.nombre} ${marcaObligatorio}
            </h6>
            <small class="text-muted mb-2">${adj.mensaje}</small>
            <div class="mt-auto">
              ${accion}
              <small class="estado-adjunto text-success d-block mt-1"></small>
            </div>
          </div>
        </div>
      `;

            $contenedorAdjuntos.append(html);
        });
    }

    // OTROS DATOS
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
    let peopleInChargeRealMock = [];
    let peopleInChargeNewMock = [];

    //RENDERIZAR LAS PERSONAS A CARGO EXISTENTES
    function renderPeopleInChargeReal() {
        const $peopleInChargeReal = $("#list-peopleincharge-real");
        $peopleInChargeReal.empty();
        if (!peopleInChargeRealMock || peopleInChargeRealMock.length === 0) {
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
        $.each(peopleInChargeRealMock, function (_, peopleCharge) {
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
        if (!peopleInChargeNewMock || peopleInChargeNewMock.length === 0) {
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
        $.each(peopleInChargeNewMock, function (_, peopleInCharge) {
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
        ...peopleInChargeRealMock.map(r => r.id),
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
            fechaExpedicionDocumento: $('#fechaExpedicionDocumentoPersonaACargo').val().trim()
        };
        if (!identificationPeopleInCharge || !nuevaPersonaACargo.fullNames) {
            alert('Debe completar los campos obligatorios');
            return;
        }
        if (modo === 'editar') {
            let index = -1;
            if (source === 'new') {
                index = peopleInChargeNewMock.findIndex(r => r.id === id);
            } else if (source === 'real') {
                index = peopleInChargeNewMock.findIndex(r => r.originalId === id);
            }

            if (index !== -1) {
                nuevaPersonaACargo.id = peopleInChargeNewMock[index].id;
                nuevaPersonaACargo.originalId = peopleInChargeNewMock[index].originalId;
                peopleInChargeNewMock[index] = nuevaPersonaACargo;
                modificado = true;
            } else {
                nuevaPersonaACargo.id = peopleInChargeIdCounter++;
                peopleInChargeNewMock.push(nuevaPersonaACargo);
                modificado = true;
            }
        }
        else {
            const existeEnReal = peopleInChargeRealMock.some(r =>
                r.identification === identificationPeopleInCharge
            );
            if (existeEnReal) {
                alert('Ya existe una persona a cargo con esa identificación.');
                return;
            }
            const existeEnNew = peopleInChargeNewMock.some(r =>
                r.identification === identificationPeopleInCharge
            );
            if (existeEnNew) {
                alert('Ya existe una persona a cargo con esa identificación.');
                return;
            }
            nuevaPersonaACargo.id = peopleInChargeIdCounter++;
            nuevaPersonaACargo.originalId = null;
            peopleInChargeNewMock.push(nuevaPersonaACargo);
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
            peopleInCharge = peopleInChargeRealMock.find(r => r.id === id);
        } else {
            peopleInCharge = peopleInChargeNewMock.find(r => r.id === id);
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
        $('#fechaExpedicionDocumentoPersonaACargo').val(peopleInCharge.fechaExpedicionDocumento);

        const $modal = $('#modalAgregarPersonaACargo');
        const $submitBtn = $modal.find('button[type="submit"]');
        $submitBtn.text('Guardar cambios');
    });

    //ABRIR MODAL ELIMINAR PERSONA A CARGO
    $(document).on('click', '#btnEliminarPersonaACargo', function () {
        const id = $(this).data('id');
        const personaACargo = peopleInChargeNewMock.find(p => p.id === id);

        if (!personaACargo) return;

        $('#mensajeModalEliminarPersonaACargo')
            .text(`¿Está seguro de eliminar la persona a cargo: ${personaACargo.fullNames}?`);

        $('#btnAceptarEliminarPersonaACargo').data('id', id);

        $('#modalEliminarPersonaACargo').modal('show');
    });

    //CONFIRMAR ELIMINAR PERSONA A CARGO
    $(document).on('click', '#btnAceptarEliminarPersonaACargo', function () {
        const idAEliminar = $(this).data('id');
        peopleInChargeNewMock = peopleInChargeNewMock.filter(r => r.id !== idAEliminar);
        renderPeopleInChargeNew();
        const modalElement = document.getElementById('modalEliminarPersonaACargo');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
        guardarSessionStorage();

    });

    //REFERENCIAS
    let referencesNewMock = [
    ];

    // MOCK PARA REFERENCIAS ACTUALES
    let referencesRealMock = [
        { id: 2, tipoReferencia: 'FAMILIAR', identification: '87654321', fullNames: 'Pepito Perez', parentesco: 'AMISTAD', pais: 'EJEMPLO1', departamento: 'EJEMPLO2', ciudad: 'EJEMPLO3', zona: 'EJEMPLO4', comuna: 'EJEMPLO5', barrio: 'EJEMPLO6', direccion: 'Calle 45 # 67 - 89', telefono: '87654321', celular: '87654321', trabajaEn: 'Empresa 1', telefonoOficina: '87654321' },
        { id: 3, tipoReferencia: 'BANCARIA', identification: '11223344', fullNames: 'Pepito Perez', parentesco: 'FAMILIAR', pais: 'EJEMPLO1', departamento: 'EJEMPLO2', ciudad: 'EJEMPLO3', zona: 'EJEMPLO4', comuna: 'EJEMPLO5', barrio: 'EJEMPLO6', direccion: 'Calle 45 # 67 - 89', telefono: '87654321', celular: '87654321', trabajaEn: 'Empresa 12', telefonoOficina: '87654321' },
        { id: 4, tipoReferencia: 'PERSONAL', identification: '00000000', fullNames: 'Pepito Perez', parentesco: 'FAMILIAR', pais: 'EJEMPLO1', departamento: 'EJEMPLO2', ciudad: 'EJEMPLO3', zona: 'EJEMPLO4', comuna: 'EJEMPLO5', barrio: 'EJEMPLO6', direccion: 'Calle 45 # 67 - 89', telefono: '87654321', celular: '87654321', trabajaEn: 'Empresa 12', telefonoOficina: '00000000' },
    ];

    //RENDERIZAR LAS REFERENCIAS EXISTENTES
    function renderReferences() {
        const $referencesReal = $('#list-references-real');
        $referencesReal.empty();
        if (!referencesRealMock || referencesRealMock.length === 0) {
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
        $.each(referencesRealMock, function (_, reference) {
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

    //RENDERIZAR LAS NUEVAS REFERENCIAS AGREGADAS
    function renderReferencesNew() {
        const $referencesNew = $('#list-references-new');
        $referencesNew.empty();
        if (!referencesNewMock || referencesNewMock.length === 0) {
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
        $.each(referencesNewMock, function (_, reference) {
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

    //ID COUNTER REFERENCIAS
    let referenceIdCounter = Math.max(
        ...referencesRealMock.map(r => r.id),
        0
    ) + 1;

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
                index = referencesNewMock.findIndex(r => r.id === id);
            } else if (source === 'real') {
                index = referencesNewMock.findIndex(r => r.originalId === id);
            }

            if (index !== -1) {
                nuevaReferencia.id = referencesNewMock[index].id;
                nuevaReferencia.originalId = referencesNewMock[index].originalId;
                referencesNewMock[index] = nuevaReferencia;
                modificado = true;
            } else {
                nuevaReferencia.id = referenceIdCounter++;
                referencesNewMock.push(nuevaReferencia);
                modificado = true;
            }
        }
        else {
            const existeEnReal = referencesRealMock.some(r =>
                r.identification === identification
            );
            if (existeEnReal) {
                alert('Ya existe una referencia con esa identificación.');
                return;
            }
            const existeEnNew = referencesNewMock.some(r =>
                r.identification === identification
            );
            if (existeEnNew) {
                alert('Ya existe una referencia nueva con esa identificación.');
                return;
            }
            nuevaReferencia.id = referenceIdCounter++;
            nuevaReferencia.originalId = null;
            referencesNewMock.push(nuevaReferencia);
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
    $(document).on('click', '#btnEditarReferencia', function () {

        const id = Number($(this).data('id'));
        const source = $(this).data('source');
        let referencia;
        if (source === 'real') {
            referencia = referencesRealMock.find(r => r.id === id);
        } else {
            referencia = referencesNewMock.find(r => r.id === id);
        }
        if (!referencia) return;

        $('#formAgregarReferencia').data('modo', 'editar');
        $('#formAgregarReferencia').data('id', id);
        $('#formAgregarReferencia').data('source', source);

        $('#tipoReferencia').val(referencia.tipoReferencia);
        $('#cedulaReferencia').val(referencia.identification);
        $('#nombresReferencia').val(referencia.fullNames);
        $('#parentescoReferencia').val(referencia.parentesco);
        $('#paisReferencia').val(referencia.pais);
        $('#departamentoReferencia').val(referencia.departamento);
        $('#ciudadReferencia').val(referencia.ciudad);
        $('#zonaReferencia').val(referencia.zona);
        $('#comunaReferencia').val(referencia.comuna);
        $('#barrioReferencia').val(referencia.barrio);
        $('#direccionReferencia').val(referencia.direccion);
        $('#telefonoReferencia').val(referencia.telefono);
        $('#celularReferencia').val(referencia.celular);
        $('#trabajaEnReferencia').val(referencia.trabajaEn);
        $('#telefonoOficinaReferencia').val(referencia.telefonoOficina);

        const $modal = $('#modalAgregarReferencia');
        const $submitBtn = $modal.find('button[type="submit"]');
        $submitBtn.text('Guardar cambios');
    });


    //MODAL PARA ELIMINAR REFERENCIA
    $(document).on('click', '#btnEliminarReferencia', function () {
        const id = $(this).data('id');
        const referencia = referencesNewMock.find(r => r.id === id);

        if (!referencia) return;

        $('#mensajeModalEliminarReferencia')
            .text(`¿Está seguro de eliminar la referencia ${referencia.fullNames}?`);

        $('#btnAceptarEliminarReferencia').data('id', id);

        $('#modalEliminarReferencia').modal('show');
    });

    //CONFIRMAR ELIMINAR REFERENCIA
    $(document).on('click', '#btnAceptarEliminarReferencia', function () {
        const idAEliminar = $(this).data('id');
        referencesNewMock = referencesNewMock.filter(r => r.id !== idAEliminar);
        renderReferencesNew();
        const modalElement = document.getElementById('modalEliminarReferencia');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
        guardarSessionStorage();
    });

    //FAMILIARES PEPS
    let familiarPepsRealMock = [];

    let familiarPepsNewMock = [];

    //RENDERIZAR FAMILIARES PEPS EXISTENTES
    function renderFamiliarPepsReal() {
        const $familiarPepsReal = $('#list-familiar-peps-real');
        $familiarPepsReal.empty();
        if (!familiarPepsRealMock || familiarPepsRealMock.length === 0) {
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

        $.each(familiarPepsRealMock, function (_, familiarPeps) {
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
        if (!familiarPepsNewMock || familiarPepsNewMock.length === 0) {
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

        $.each(familiarPepsNewMock, function (_, familiarPeps) {
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
        ...familiarPepsRealMock.map(r => r.id),
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
                index = familiarPepsNewMock.findIndex(r => r.id === id);
            } else if (source === 'real') {
                index = familiarPepsNewMock.findIndex(r => r.originalId === id);
            }

            if (index !== -1) {
                nuevoFamiliarPeps.id = familiarPepsNewMock[index].id;
                nuevoFamiliarPeps.originalId = familiarPepsNewMock[index].originalId;
                familiarPepsNewMock[index] = nuevoFamiliarPeps;
                modificado = true;
            } else {
                nuevoFamiliarPeps.id = familiarPepsIdCounter++;
                familiarPepsNewMock.push(nuevoFamiliarPeps);
                modificado = true;
            }
        }
        else {
            const existeEnReal = familiarPepsRealMock.some(r =>
                r.identification === identification
            );
            if (existeEnReal) {
                alert('Ya existe una referencia real con esa identificación.');
                return;
            }
            const existeEnNew = familiarPepsNewMock.some(r =>
                r.identification === identification
            );
            if (existeEnNew) {
                alert('Ya existe una referencia nueva con esa identificación.');
                return;
            }
            nuevoFamiliarPeps.id = familiarPepsIdCounter++;
            nuevoFamiliarPeps.originalId = null;
            familiarPepsNewMock.push(nuevoFamiliarPeps);
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
            familiarPeps = familiarPepsRealMock.find(r => r.id === id);
        } else {
            familiarPeps = familiarPepsNewMock.find(r => r.id === id);
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
        const familiarPeps = familiarPepsNewMock.find(p => p.id === id);

        if (!familiarPeps) return;

        $('#mensajeModalEliminarFamiliarPeps')
            .text(`¿Está seguro de eliminar el familiar peps: ${familiarPeps.firstName} ${familiarPeps.firstLastName}?`);

        $('#btnAceptarEliminarFamiliarPeps').data('id', id);

        $('#modalEliminarFamiliarPeps').modal('show');
    });

    //CONFIRMAR ELIMINAR FAMILIAR PEPS
    $(document).on('click', '#btnAceptarEliminarFamiliarPeps', function () {
        const idAEliminar = $(this).data('id');
        familiarPepsNewMock = familiarPepsNewMock.filter(r => r.id !== idAEliminar);
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
            sessionStorage.setItem("peopleInCharge", JSON.stringify(peopleInChargeNewMock));
            sessionStorage.setItem("references", JSON.stringify(referencesNewMock));
            sessionStorage.setItem("familiarPeps", JSON.stringify(familiarPepsNewMock));
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
                    peopleInChargeNewMock.push(person);
                });
            }

            if (referencesData) {
                const savedReferences = JSON.parse(referencesData);
                savedReferences.forEach(reference => {
                    referencesNewMock.push(reference);
                });
            }

            if (familiarPepsData) {
                const savedFamiliarPeps = JSON.parse(familiarPepsData);
                savedFamiliarPeps.forEach(familiarPep => {
                    familiarPepsNewMock.push(familiarPep);
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
            const response = await fetch("/actualizaciondatos/informacionAsociado?Cedula=1128417092");
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
    function inicializarFormulario() {

        if (formularioInicializado) return;

        const haySession = existeSessionStorage();

        if (!haySession) {

            cargarDatosBackend();
            //guardarSessionStorage();

        } else {
            cargarSessionStorage();
            alertaModal("Aun tiene datos sin enviar, continúe con la actualizacion de datos y presione finalizar para enviar la información", "Información");
        }

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



