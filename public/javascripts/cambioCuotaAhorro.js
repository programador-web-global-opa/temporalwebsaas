$(document).ready(function () {
  const $listado = $("#listado-ahorros");
  const $modalConfirmacion = $("#modalConfirmacion");
  const $modalInfo = $("#modalInfo");
  const $btnConfirmar = $("#btnConfirmar");
  const $mensajeModal = $("#mensajeModalInformativo");
  const $iconoModal = $("#modalInformativoIcono");
  const $modalInformativo = $("#modalInformativo");
  const $btnAceptar = $("#btnAceptar");
  const $headerTabla = $("#headerSection");
  const $titleAhorrosCambioCuota = $("#titleAhorrosCambioCuota");

  let ahorrosDisponibles = [];
  let ahorroSeleccionado = null;
  let enviando = false;

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function limpiarNumero(value) {
    return String(value ?? "").replace(/\D/g, "");
  }

  function numeroDesdeInput(value) {
    const limpio = limpiarNumero(value);
    return limpio ? Number(limpio) : 0;
  }

  function formatearNumero(value) {
    const numero = numeroDesdeInput(value);
    return numero ? numero.toLocaleString("es-CO") : "0";
  }

  function formatearFecha(fecha) {
    if (!fecha || String(fecha).startsWith("1900-01-01")) {
      return "---";
    }

    const date = new Date(String(fecha).slice(0, 10) + "T00:00:00");

    if (Number.isNaN(date.getTime())) {
      return "---";
    }

    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  }

  function formatearFechaHora(date) {
    const pad = value => String(value).padStart(2, "0");

    return [
      pad(date.getDate()),
      pad(date.getMonth() + 1),
      date.getFullYear()
    ].join("/") + " " + [
      pad(date.getHours()),
      pad(date.getMinutes()),
      "00"
    ].join(":");
  }

  function fechaHabilitacion(producto) {
    const tiempoFaltante = Number(producto.tiempoFaltante || 0);

    if (tiempoFaltante <= 0) {
      return null;
    }

    return new Date(Date.now() + tiempoFaltante * 60 * 1000);
  }

  function mostrarMensaje(mensaje, tipo = "informacion", onClose = null) {
    const configPorTipo = {
      informacion: { color: "#3beaf6", icono: "i" },
      alerta: { color: "#f0ad4e", icono: "!" },
      exito: { color: "#22c55e", icono: "✓" },
      falla: { color: "#dc3545", icono: "x" }

    };

    const config = configPorTipo[tipo] || configPorTipo.informacion;

    $iconoModal.css({
      borderColor: config.color,
      color: config.color
    }).text(config.icono);

    $mensajeModal.html(`<div>${escapeHTML(mensaje)}</div>`);

    $modalInformativo.off("hidden.bs.modal.mensaje");
    if (typeof onClose === "function") {
      $modalInformativo.on("hidden.bs.modal.mensaje", function () {
        onClose();
      });
    }

    $modalInformativo.modal("show");
  }

  async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.estado === false) {
      throw new Error(data?.msj || data?.mensaje || data?.message || "No fue posible procesar la solicitud");
    }

    return data;
  }

  function setCargando(cargando) {
    $btnConfirmar.prop("disabled", cargando).text(cargando ? "Enviando..." : "Confirmar");
  }

  function renderEstadoVacio(mensaje) {
    $headerTabla.empty();
    $titleAhorrosCambioCuota.empty();
    $listado.html(`
      <div class="app-paper elevation-3 p-4 text-center">
        ${escapeHTML(mensaje)}
      </div>
    `);
  }

  function renderAhorros() {
    $headerTabla.empty();
    $listado.empty();
    $titleAhorrosCambioCuota.empty();

    if (ahorrosDisponibles.length === 0) {
      renderEstadoVacio("No cuenta con ahorros disponibles para cambio de cuota");
      return;
    }

    $titleAhorrosCambioCuota.html(`
      <div class="col-12">
        <div class="secondary-header app-paper elevation-4 p-2 mb-3">
          <h3 class="mb-0">Ahorros disponibles para cambio de cuota</h3>
        </div>
      </div>
    `);

    $headerTabla.html(`
      <div class="col-xl-2">Linea</div>
      <div class="col-xl-2">N. Cuenta</div>
      <div class="col-xl-1">Fecha Apertura</div>
      <div class="col-xl-1">Vence</div>
      <div class="col-xl-1">Cuota</div>
      <div class="col-xl-1">Saldo</div>
      <div class="col-xl-1">Interes</div>
      <div class="col-xl-2"></div>
    `);

    const html = ahorrosDisponibles.map((ahorro, index) => {
      const fechaHasta = fechaHabilitacion(ahorro);
      const accion = fechaHasta
        ? `<button type="button" class="app-button secondary w-100 btn-bloqueado" data-index="${index}">
             ${escapeHTML(formatearFechaHora(fechaHasta))}
           </button>`
        : `<button type="button" class="app-button w-100 btn-cambiar" data-index="${index}">
             Cambiar cuota
           </button>`;

      return `
        <div class="app-paper elevation-3 p-3 mb-3">
          <div class="row align-items-center text-xl-center g-2">
            <div class="col-12 col-xl-2 fw-bold">
              <span class="d-xl-none">Linea:</span>
              ${escapeHTML(ahorro.namelinea)}
            </div>
            <div class="col-12 col-xl-2">
              <span class="d-xl-none fw-bold">Cuenta:</span>
              ${escapeHTML(ahorro.numerocuenta)}
            </div>
            <div class="col-12 col-xl-1">
              <span class="d-xl-none fw-bold">Apertura:</span>
              ${formatearFecha(ahorro.fechainicio)}
            </div>
            <div class="col-12 col-xl-1">
              <span class="d-xl-none fw-bold">Vence:</span>
              ${formatearFecha(ahorro.fechavence)}
            </div>
            <div class="col-12 col-xl-1">
              <span class="d-xl-none fw-bold">Cuota:</span>
              ${formatearNumero(ahorro.valorcuota)}
            </div>
            <div class="col-12 col-xl-1">
              <span class="d-xl-none fw-bold">Saldo:</span>
              ${formatearNumero(ahorro.saldoTotal)}
            </div>
            <div class="col-12 col-xl-1">
              <span class="d-xl-none fw-bold">Interes:</span>
              ${formatearNumero(ahorro.interes)}
            </div>
            <div class="col-12 col-xl-2 mt-3 mt-xl-0 text-xl-center">
              ${accion}
            </div>
          </div>
        </div>
      `;
    }).join("");

    $listado.html(html);
  }

  async function cargarAhorros() {
    try {
      renderEstadoVacio("Cargando ahorros disponibles...");

      const response = await fetchJson("/ahorro/cambioCuota/productos");
      ahorrosDisponibles = Array.isArray(response.data) ? response.data : [];
      renderAhorros();
    } catch (error) {
      console.error("Error cargando ahorros para cambio de cuota:", error);
      renderEstadoVacio(error.message || "No fue posible cargar los ahorros disponibles");
    }
  }

  $modalConfirmacion.on("input", "#nuevaCuota", function () {
    const limpio = limpiarNumero($(this).val()).slice(0, 8);
    $(this).val(limpio ? Number(limpio).toLocaleString("es-CO") : "");
  });

    $listado.on("click", ".btn-cambiar", function () {
    const index = Number($(this).data("index"));
    ahorroSeleccionado = ahorrosDisponibles[index] || null;

    if (!ahorroSeleccionado) {
      mostrarMensaje("No fue posible seleccionar el ahorro", "falla");
      return;
    }

    $modalInfo.html(`
      <div class="mb-2">
        <strong>Linea:</strong> ${escapeHTML(ahorroSeleccionado.namelinea)}
      </div>
      <div class="mb-2">
        <strong>N. Cuenta:</strong> ${escapeHTML(ahorroSeleccionado.numerocuenta)}
      </div>
      <div class="mb-3">
        <strong>Cuota actual:</strong> ${formatearNumero(ahorroSeleccionado.valorcuota)}
      </div>
      <div class="app-field">
        <input
          type="text"
          class="app-input"
          id="nuevaCuota"
          name="nuevaCuota"
          inputmode="numeric"
          maxlength="10"
          placeholder=" "
          required>
        <label for="nuevaCuota">Nueva cuota</label>
      </div>
      <div class="mt-2 small text-muted">
        <strong>Nota:</strong> Ingrese la cuota de acuerdo a su periodo de deduccion actual,
        recuerde que sus deducciones se realizan "${escapeHTML(ahorroSeleccionado.periodoDeduccionTexto || "")}".
      </div>
    `);

    $modalConfirmacion.modal("show");
  });

  $listado.on("click", ".btn-bloqueado", function () {
    mostrarMensaje("Para realizar un cambio de cuota al producto seleccionado debera esperar la fecha que alli se le muestra, segun los lineamientos establecidos por la entidad.", "alerta");
  });

  $btnConfirmar.on("click", async function () {
    if (enviando || !ahorroSeleccionado) return;

    const nuevaCuota = numeroDesdeInput($("#nuevaCuota").val());

    if (!nuevaCuota || nuevaCuota <= 0) {
      mostrarMensaje("La nueva cuota debe ser mayor a cero", "alerta", function () {
        $("#nuevaCuota").trigger("focus");
      });
      return;
    }

    if (String(nuevaCuota).length > 8) {
      mostrarMensaje("La cuota debe ser menor a 8 digitos", "alerta", function () {
        $("#nuevaCuota").trigger("focus");
      });
      return;
    }

    enviando = true;

    try {
      setCargando(true);

      const response = await fetchJson("/ahorro/cambioCuota", {
        method: "POST",
        body: JSON.stringify({
          codlinea: ahorroSeleccionado.codlinea,
          numerocuenta: ahorroSeleccionado.numerocuenta,
          valorcuota: ahorroSeleccionado.valorcuota,
          cuotaNew: nuevaCuota
        })
      });

      $modalConfirmacion.modal("hide");
      mostrarMensaje(response.msj || "Cambio realizado correctamente", "exito");
      await cargarAhorros();
    } catch (error) {
      console.error("Error cambiando cuota:", error);
      mostrarMensaje(error.message || "No fue posible realizar el cambio de cuota", "falla");
    } finally {
      enviando = false;
      setCargando(false);
    }
  });

  $btnAceptar.on("click", function () {
    $modalInformativo.modal("hide");
  });

  cargarAhorros();
});
