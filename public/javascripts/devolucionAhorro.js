$(document).ready(function () {
  const $listado = $("#listado-ahorros");
  const $modalConfirmacion = $("#modalConfirmacion");
  const $modalInfo = $("#modalInfo");
  const $btnSolicitar = $("#btnSolicitar");
  const $mensajeModal = $("#mensajeModalInformativo");
  const $modalInformativo = $("#modalInformativo");
  const $btnAceptar = $("#btnAceptar");
  const $headerTabla = $("#headerSection");
  const $titleAhorrosDevolucion = $("#titleAhorrosDevolucion");

  //DATOS DE EJEMPLO PARA LA DEVOLUCION DE AHORRO (SIMULA LOS AHORROS DEL USUARIO), TEMPORAL
  const ahorrosDisponibles = [
    { id: 1, linea: "Ahorro Contractual", cuenta: "123456789", fechaApertura: "2023-01-15", vence: "2025-01-15", cuota: 100000, saldo: 1200000, interes: 12000 },
    { id: 2, linea: "Ahorro voluntario", cuenta: "987654321", fechaApertura: "2022-06-20", vence: "", cuota: 200000, saldo: 2400000, interes: 24000 },
    { id: 3, linea: "AHORROS DONACIONES", cuenta: "987654322", fechaApertura: "2022-06-20", vence: "", cuota: '<img src=x onerror="alert(\'XSS\')">', saldo: 2400000, interes: 24000 }
  ];

  let ahorroSeleccionado = null;

  //FUNCION PARA FORMATER MONEDAS
  function formatearMoneda(valor) {
    return Number(valor).toLocaleString("es-CO", {
      style: "decimal",
      currency: "COP",
      minimumFractionDigits: 0
    });
  }

  //FUNCION PARA FORMATER FECHAS CUANDO VIENEN EN FORMATO 1900-01-01
  function formatearFecha(fecha) {
    if (!fecha || fecha === "1900-01-01") {
      return "---";
    }
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  }

  function fechaActualFormateada() {
    const hoy = new Date();
    return hoy.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  }

  //FUNCION PARA EVITAR INYECCION DE CODIGO
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  //FUNCION PARA RENDERIZAR LOS AHORROS
  function renderAhorros() {

    $headerTabla.empty();
    $listado.empty();

    if (ahorrosDisponibles.length === 0) {
      $headerTabla.append(`<div>No cuenta con ahorros disponibles</div>`);
      $titleAhorrosDevolucion.empty();
      return;
    }

    $titleAhorrosDevolucion.append(`
      <div class="col-12">
        <div class="secondary-header app-paper elevation-4 p-2 mb-3">
          <h3 class="mb-0">Ahorros disponibles para devolucion</h3>
        </div>
      </div>`);

    $headerTabla.append(`
    <div class="col-md-2">Línea</div>
    <div class="col-md-2">N° Cuenta</div>
    <div class="col-md-2">Fecha Apertura</div>
    <div class="col-md-1">Vence</div>
    <div class="col-md-1">Cuota</div>
    <div class="col-md-1">Saldo</div>
    <div class="col-md-1">Interés</div>
    <div class="col-md-2"></div>
  `);

    let html = "";

    ahorrosDisponibles.forEach(ahorro => {
      html += `
      <div class="app-paper elevation-3 p-3 mb-3">
        <div class="row align-items-center text-lg-center">

          <div class="col-12 col-lg-2 fw-bold">
            <span class="d-lg-none">Línea:</span>
            ${escapeHTML(ahorro.linea)}
          </div>

          <div class="col-12 col-lg-2">
            <span class="d-lg-none fw-bold">Cuenta:</span>
            ${escapeHTML(ahorro.cuenta)}
          </div>

          <div class="col-6 col-lg-2">
            <span class="d-lg-none fw-bold">Apertura:</span>
            ${escapeHTML(formatearFecha(ahorro.fechaApertura))}
          </div>

          <div class="col-6 col-lg-1">
            <span class="d-lg-none fw-bold">Vence:</span>
            ${escapeHTML(ahorro.vence ? formatearFecha(ahorro.vence) : '-')} 
          </div>

          <div class="col-6 col-lg-1 text-lg-end">
            <span class="d-lg-none fw-bold">Cuota:</span>
            ${formatearMoneda(escapeHTML(ahorro.cuota))}
          </div>

          <div class="col-6 col-lg-1 text-lg-end">
            <span class="d-lg-none fw-bold">Saldo:</span>
            ${formatearMoneda(escapeHTML(ahorro.saldo))}
          </div>

          <div class="col-6 col-lg-1 text-lg-end">
            <span class="d-lg-none fw-bold">Interés:</span>
            ${formatearMoneda(escapeHTML(ahorro.interes))}
          </div>

          <div class="col-12 col-lg-2 mt-3 mt-lg-0 text-lg-center">
            <button
              type="button"
              class="app-button w-100 btn-solicitar"
              data-id="${escapeHTML(ahorro.id)}">
              Solicitar
            </button>
          </div>

        </div>
      </div>
    `;
    });

    $listado.html(html);
  }

  $modalConfirmacion.on("input", "#valorRetirar", function () {
    let valor = $(this).val().replace(/\D/g, "");

    if (!valor) {
      $(this).val("");
      return;
    }

    $(this).val(
      Number(valor).toLocaleString("es-CO")
    );
  });

  //click en solicitar
  $listado.on("click", ".btn-solicitar", function () {

    const id = $(this).data("id");
    ahorroSeleccionado = ahorrosDisponibles.find(a => a.id === id);

    $modalInfo.empty().append(
      `
      <section class="app-modal__section">
          <div><strong>Linea:</strong> ${escapeHTML(ahorroSeleccionado.linea)}</div>
          <div><strong>N°Cuenta:</strong> ${escapeHTML(ahorroSeleccionado.cuenta)}</div>
          <div><strong>Fecha apertura:</strong> ${escapeHTML(ahorroSeleccionado.fechaApertura)}</div>
          <div><strong>Fecha vencimiento:</strong> ${escapeHTML(ahorroSeleccionado.vence)}</div>
          <div><strong>Saldo total:</strong> ${Number(escapeHTML(ahorroSeleccionado.saldo)).toLocaleString("es-CO")}</div>
          <div><strong>Interes:</strong> ${Number(escapeHTML(ahorroSeleccionado.interes)).toLocaleString("es-CO")}</div>
      </section>

      <section class="app-modal__section">
          <div><strong>Fecha solicitud:</strong> ${fechaActualFormateada()}</div>
          <div style="color: #8B0000;">Disponible retiro: ${Number(escapeHTML(ahorroSeleccionado.saldo)).toLocaleString("es-CO")}</div>

          <div class="app-field">
              <input type="text" class="app-input" id="valorRetirar" name="valorRetirar" placeholder=" " required>
              <label for="nuevaCuota">Valor a retirar</label>
          </div>
      </section>`
    );

    $modalConfirmacion.modal("show");
  });



  $btnSolicitar.on("click", function () {

    let valor = $("#valorRetirar").val().replace(/\./g, "");
    let valorRetirar = Number(valor);

    if (!valorRetirar || valorRetirar <= 0) {
      alert("El valor a retirar debe ser mayor a cero");
      $("#valorRetirar").focus();
      return;
    }

    if (valorRetirar >= ahorroSeleccionado.saldo) {
      alert("No tiene saldo suficiente");
      $("#valorRetirar").focus();
      return;
    }

    $modalConfirmacion.modal("hide");

    let mensajeInformativo = "La solicitud fue realizada";

    $mensajeModal.empty().append(`<div>${escapeHTML(mensajeInformativo)}</div>`);
    $modalInformativo.modal("show");
  });


  $btnAceptar.on("click", function () {
    $modalInformativo.modal("hide");
  });

  renderAhorros();

});
