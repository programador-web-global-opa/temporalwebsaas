$(document).ready(function () {
  const $listado = $("#listado-ahorros");
  const $modalConfirmacion = $("#modalConfirmacion");
  const $modalInfo = $("#modalInfo");
  const $btnConfirmar = $("#btnConfirmar");
  const $mensajeModal = $("#mensajeModalInformativo")
  const $mondalInformativo = $("#modalInformativo")
  const $btnAceptar = $("#btnAceptar")
  const $headerTabla = $("#headerSection");
  const $titleAhorrosCambioCuota = $("#titleAhorrosCambioCuota")

  //DATOS DE EJEMPLO PARA EL CAMBIO DE CUOTA, TEMPORAL
  const ahorrosDisponibles = [
    {
      id: 1,
      linea: "Ahorro niños guajira",
      cuenta: "123456789",
      fechaApertura: "2023-01-15",
      vence: "2025-01-18",
      cuota: 100000,
      saldo: 1200000,
      interes: 12000
    },
    {
      id: 2,
      linea: "Ahorro voluntario",
      cuenta: "987654321",
      fechaApertura: "2022-06-20",
      vence: "1900-01-01",
      cuota: 200000,
      saldo: 2400000,
      interes: 24000
    },
    {
      id: 3,
      linea: "AHORROS DONACIONES",
      cuenta: "987654322",
      fechaApertura: "2022-06-20",
      vence: "1900-01-01",
      cuota: 200000,
      saldo: 2400000,
      interes: 24000
    }
  ];

  let ahorroSeleccionado = null;

  function formatearMoneda(valor) {
    return Number(valor).toLocaleString("es-CO", {
      style: "decimal",
      currency: "COP",
      minimumFractionDigits: 0
    });
  }

  //funcion para cuando llegue la fecha 1900-01-01 (que no tiene fecha)
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
  //FUNCION PARA EVITAR INYECCION DE CODIGO
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderAhorros() {

    $headerTabla.empty();
    $listado.empty();

    if (ahorrosDisponibles.length === 0) {
      $headerTabla.append(`<div>No cuenta con ahorros disponibles</div>`);
      $titleAhorrosCambioCuota.empty();
      return;
    }

    $titleAhorrosCambioCuota.append(`
      <div class="col-12">
        <div class="secondary-header app-paper elevation-4 p-2 mb-3">
          <h3 class="mb-0">Ahorros disponibles para cambio de cuota</h3>
        </div>
      </div>
    `);

    $headerTabla.append(`
          <div class="col-xl-2">Línea</div>
          <div class="col-xl-2">N° Cuenta</div>
          <div class="col-xl-2">Fecha Apertura</div>
          <div class="col-xl-1">Vence</div>
          <div class="col-xl-1">Cuota</div>
          <div class="col-xl-1">Saldo</div>
          <div class="col-xl-1">Interés</div>
          <div class="col-xl-2"></div>`
    )


    let html = "";

    ahorrosDisponibles.forEach(ahorro => {
      html += `
      <div class="app-paper elevation-3 p-3 mb-3">
        <div class="row align-items-center text-xl-center">
          <div class="col-12 col-xl-2 fw-bold">
            <span class="d-xl-none">Línea:</span>
            ${escapeHTML(ahorro.linea)}
          </div>
          <div class="col-12 col-xl-2">
            <span class="d-xl-none fw-bold">Cuenta:</span>
            ${escapeHTML(ahorro.cuenta)}
          </div>
          <div class="col-6 col-xl-2">
            <span class="d-xl-none fw-bold">Apertura:</span>
            ${formatearFecha(escapeHTML(ahorro.fechaApertura))}
          </div>
          <div class="col-6 col-xl-1">
            <span class="d-xl-none fw-bold">Vence:</span>
            ${formatearFecha(escapeHTML(ahorro.vence))}
          </div>
          <div class="col-6 col-xl-1 text-xl-end">
            <span class="d-xl-none fw-bold">Cuota:</span>
            ${formatearMoneda(escapeHTML(ahorro.cuota))}
          </div>
          <div class="col-6 col-xl-1 text-xl-end">
            <span class="d-xl-none fw-bold">Saldo:</span>
            ${formatearMoneda(escapeHTML(ahorro.saldo))}
          </div>
          <div class="col-6 col-xl-1 text-xl-end">
            <span class="d-xl-none fw-bold">Interés:</span>
            ${formatearMoneda(escapeHTML(ahorro.interes))}
          </div>
          <div class="col-12 col-xl-2 mt-3 mt-xl-0 text-xl-center">
            <button
              type="button"
              class="app-button w-100 btn-cambiar"
              data-id="${escapeHTML(ahorro.id)}">
              Cambiar cuota
            </button>
          </div>
        </div>
      </div>
    `;
    });

    $listado.html(html);
  }


  $modalConfirmacion.on("input", "#nuevaCuota", function () {
    let valor = $(this).val();
    valor = valor.replace(/\D/g, "");

    if (valor === "") {
      $(this).val("");
      return;
    }

    $(this).val(
      Number(valor).toLocaleString("es-CO")
    );
  });

  // Click en botón "Cambiar cuota"
  $listado.on("click", ".btn-cambiar", function () {
    const id = $(this).data("id");
    ahorroSeleccionado = ahorrosDisponibles.find(a => a.id === id);

    $modalInfo.empty().append(
      `<div>
            <strong>Linea:</strong> ${escapeHTML(ahorroSeleccionado.linea)}
        </div>
        <div>
            <strong>N°Cuenta:</strong> ${escapeHTML(ahorroSeleccionado.cuenta)}
        </div>
        <div>
            <strong>Cuota actual:</strong> ${formatearMoneda(escapeHTML(ahorroSeleccionado.cuota))}
        </div>
        <div class="app-field">
            <input
              type="text"
              class="app-input"
              id="nuevaCuota"
              name="nuevaCuota"
              placeholder=" "
              required>
            <label for="nuevaCuota">Nueva cuota</label>
        </div>

        <div class = "mt-2 small text-muted">
           <strong>Nota:</strong> Ingrese la cuota de acuerdo
           a su periodo de deduccion actual, recuerde que sus deducciones se realizan "Quincenal"
        </div>`
    );

    $modalConfirmacion.modal("show");
  });



  // Confirmar acción EJEMPLO
  $btnConfirmar.on("click", function () {

    let valor = $("#nuevaCuota").val();
    valor = valor.replace(/\./g, "");
    let nuevaCuota = Number(valor);

    if (!nuevaCuota || nuevaCuota <= 0) {
      alert("La nueva cuota debe ser mayor a cero");
      $("#nuevaCuota").focus();
      return;
    }

    $modalConfirmacion.modal("hide");

    let mensajeInformativo = "El cambio de la cuota fue exitoso";
    $mensajeModal.empty().append(
      `<div>
            ${escapeHTML(mensajeInformativo)}
        </div>`
    )
    $mondalInformativo.modal("show");

  });

  $btnAceptar.on("click", function () {
    $mondalInformativo.modal("hide");
  })


  renderAhorros();

});
