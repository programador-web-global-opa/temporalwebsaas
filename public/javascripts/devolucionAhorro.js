$(document).ready(function () {
  const $listado = $("#listado-ahorros");
  const $modalConfirmacion = $("#modalConfirmacion");
  const $modalInfo = $("#modalInfo");
  const $btnSolicitar = $("#btnSolicitar");
  const $mensajeModal = $("#mensajeModalInformativo");
  const $iconoModal = $("#modalInformativoIcono");
  const $modalInformativo = $("#modalInformativo");
  const $btnAceptar = $("#btnAceptar");
  const $headerTabla = $("#headerSection");
  const $titleAhorrosDevolucion = $("#titleAhorrosDevolucion");

  let ahorrosDisponibles = [];
  let ahorroSeleccionado = null;
  let disponibleSeleccionado = 0;
  let consultandoDetalle = false;
  let consultaDetalleId = 0;
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
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    const limpio = limpiarNumero(value);
    return limpio ? Number(limpio) : 0;
  }

  function formatearNumero(value) {
    const numero = numeroDesdeInput(value);
    return numero.toLocaleString("es-CO");
  }

  function formatearFecha(fecha) {
    const valor = String(fecha ?? "").trim();

    if (!valor || valor.startsWith("1900-01-01")) {
      return "---";
    }

    const date = new Date(valor.slice(0, 10) + "T00:00:00");

    if (Number.isNaN(date.getTime())) {
      return escapeHTML(valor);
    }

    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  }

  function textoVisible(value) {
    const limpio = String(value ?? "").trim();
    return limpio || "---";
  }

  function mostrarMensaje(mensaje, tipo = "informacion", onClose = null) {
    const configPorTipo = {
      informacion: { color: "#3beaf6", icono: "i" },
      alerta: { color: "#f0ad4e", icono: "!" },
      exito: { color: "#22c55e", icono: "&#10003;" },
      falla: { color: "#dc3545", icono: "x" }
    };

    const config = configPorTipo[tipo] || configPorTipo.informacion;

    $iconoModal.css({
      borderColor: config.color,
      color: config.color
    }).html(config.icono);

    $mensajeModal.html(`<div>${escapeHTML(mensaje)}</div>`);

    $modalInformativo.off("hidden.bs.modal.mensaje");
    if (typeof onClose === "function") {
      $modalInformativo.on("hidden.bs.modal.mensaje", function () {
        onClose();
      });
    }

    $modalInformativo.modal("show");
  }

  async function preguntarConfirmacion(mensaje, onConfirm) {
    if (!window.confirm(mensaje)) {
      return;
    }

    if (typeof onConfirm === "function") {
      await onConfirm();
    }
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

  function setCargandoSolicitud(cargando, texto = "Solicitar") {
    $btnSolicitar
      .prop("disabled", cargando)
      .text(cargando ? texto : "Solicitar");
  }

  function renderEstadoVacio(mensaje) {
    $headerTabla.empty();
    $titleAhorrosDevolucion.empty();
    $listado.html(`
      <div class="app-paper elevation-3 p-4 text-center">
        ${escapeHTML(mensaje)}
      </div>
    `);
  }

  function renderAhorros() {
    $headerTabla.empty();
    $listado.empty();
    $titleAhorrosDevolucion.empty();

    if (ahorrosDisponibles.length === 0) {
      renderEstadoVacio("No tiene productos para realizar devolucion de ahorros");
      return;
    }

    $titleAhorrosDevolucion.html(`
      <div class="col-12">
        <div class="secondary-header app-paper elevation-4 p-2 mb-3">
          <h3 class="mb-0">Ahorros disponibles para devolucion</h3>
        </div>
      </div>
    `);

    $headerTabla.html(`
      <div class="col-md-2">Linea</div>
      <div class="col-md-2">N. Cuenta</div>
      <div class="col-md-2">Fecha Apertura</div>
      <div class="col-md-1">Vence</div>
      <div class="col-md-1">Cuota</div>
      <div class="col-md-1">Saldo</div>
      <div class="col-md-1">Interes</div>
      <div class="col-md-2"></div>
    `);

    const html = ahorrosDisponibles.map((ahorro, index) => `
      <div class="app-paper elevation-3 p-3 mb-3">
        <div class="row align-items-center text-lg-center">
          <div class="col-12 col-lg-2 fw-bold">
            <span class="d-lg-none">Linea:</span>
            ${escapeHTML(ahorro.namelinea)}
          </div>

          <div class="col-12 col-lg-2">
            <span class="d-lg-none fw-bold">Cuenta:</span>
            ${escapeHTML(ahorro.numerocuenta)}
          </div>

          <div class="col-6 col-lg-2">
            <span class="d-lg-none fw-bold">Apertura:</span>
            ${formatearFecha(ahorro.fechainicio)}
          </div>

          <div class="col-6 col-lg-1">
            <span class="d-lg-none fw-bold">Vence:</span>
            ${formatearFecha(ahorro.fechavence)}
          </div>

          <div class="col-6 col-lg-1 ">
            <span class="d-lg-none fw-bold">Cuota:</span>
            ${formatearNumero(ahorro.valorcuota)}
          </div>

          <div class="col-6 col-lg-1 ">
            <span class="d-lg-none fw-bold">Saldo:</span>
            ${formatearNumero(ahorro.saldoTotal)}
          </div>

          <div class="col-6 col-lg-1 ">
            <span class="d-lg-none fw-bold">Interes:</span>
            ${formatearNumero(ahorro.interes)}
          </div>

          <div class="col-12 col-lg-2 mt-3 mt-lg-0 text-lg-center">
            <button
              type="button"
              class="app-button w-100 btn-solicitar"
              data-index="${index}">
              Solicitar
            </button>
          </div>
        </div>
      </div>
    `).join("");

    $listado.html(html);
  }

  async function cargarAhorros() {
    try {
      renderEstadoVacio("Cargando ahorros disponibles...");

      const response = await fetchJson("/ahorro/devolucion/productos");
      ahorrosDisponibles = Array.isArray(response.data) ? response.data : [];
      renderAhorros();
    } catch (error) {
      console.error("Error cargando ahorros para devolucion:", error);
      renderEstadoVacio(error.message || "No fue posible cargar los ahorros disponibles");
    }
  }

  function construirContenidoModal(ahorro, detalleDisponible) {
    const disponible = numeroDesdeInput(detalleDisponible?.valorDisponible);
    const fechaSolicitud = textoVisible(detalleDisponible?.fechaSolicitud);
    const cedula = textoVisible(detalleDisponible?.cedula);
    const nombre = textoVisible(detalleDisponible?.asociado?.nombreintegrado || ahorro.nombreintegrado);
    const email = textoVisible(detalleDisponible?.asociado?.email || ahorro.txtEmail);

    return `
      <section class="app-modal__section">
        <div><strong>Cedula:</strong> ${escapeHTML(cedula)}</div>
        <div><strong>Nombre:</strong> ${escapeHTML(nombre)}</div>
        <div><strong>Email:</strong> ${escapeHTML(email)}</div>
        <div><strong>Linea:</strong> ${escapeHTML(ahorro.namelinea)}</div>
        <div><strong>N. Cuenta:</strong> ${escapeHTML(ahorro.numerocuenta)}</div>
        <div><strong>Fecha apertura:</strong> ${formatearFecha(ahorro.fechainicio)}</div>
        <div><strong>Fecha vencimiento:</strong> ${formatearFecha(ahorro.fechavence)}</div>
        <div><strong>Cuota:</strong> ${formatearNumero(ahorro.valorcuota)}</div>
        <div><strong>Saldo total:</strong> ${formatearNumero(ahorro.saldoTotal)}</div>
        <div><strong>Interes:</strong> ${formatearNumero(ahorro.interes)}</div>
      </section>

      <section class="app-modal__section">
        <div><strong>Fecha solicitud:</strong> ${escapeHTML(fechaSolicitud)}</div>
        <div style="color: #8B0000;"><strong>Disponible retiro:</strong> ${formatearNumero(disponible)}</div>

        <div class="app-field mt-3">
          <input type="text" class="app-input" id="valorRetirar" name="valorRetirar" placeholder=" " required>
          <label for="valorRetirar">Valor a retirar</label>
        </div>

        ${disponible <= 0
          ? '<div class="mt-2" style="color: #8B0000;">No puede realizar la devolucion de este ahorro porque el disponible para retirar tiene valor $0.</div>'
          : ""}
      </section>
    `;
  }

  function construirContenidoCargandoModal(ahorro) {
    return `
      <section class="devolucion-modal__loading" aria-live="polite">
        <div class="devolucion-modal__spinner" aria-hidden="true"></div>
        <div class="devolucion-modal__text">Consultando informacion del ahorro...</div>
        <div class="devolucion-modal__meta">
          ${escapeHTML(ahorro.namelinea)} - ${escapeHTML(ahorro.numerocuenta)}
        </div>
      </section>
    `;
  }

  async function enviarSolicitudRetiro(valorRetirar) {
    enviando = true;

    try {
      setCargandoSolicitud(true, "Enviando...");

      const response = await fetchJson("/ahorro/devolucion", {
        method: "POST",
        body: JSON.stringify({
          codlinea: ahorroSeleccionado.codlinea,
          numerocuenta: ahorroSeleccionado.numerocuenta,
          valorRetirar
        })
      });

      $modalConfirmacion.modal("hide");
      mostrarMensaje(response.msj || "Solicitud guardada correctamente", "exito");
      await cargarAhorros();
    } catch (error) {
      console.error("Error enviando solicitud de devolucion:", error);
      mostrarMensaje(error.message || "No fue posible guardar la solicitud", "falla");
    } finally {
      enviando = false;
      setCargandoSolicitud(disponibleSeleccionado <= 0);
    }
  }

  $modalConfirmacion.on("input", "#valorRetirar", function () {
    const limpio = limpiarNumero($(this).val());
    $(this).val(limpio ? Number(limpio).toLocaleString("es-CO") : "");
  });

  $listado.on("click", ".btn-solicitar", async function () {
    if (consultandoDetalle || enviando) {
      return;
    }

    const index = Number($(this).data("index"));
    const ahorroObjetivo = ahorrosDisponibles[index] || null;
    const consultaId = ++consultaDetalleId;

    ahorroSeleccionado = ahorroObjetivo;
    disponibleSeleccionado = 0;
    consultandoDetalle = true;
    let consultaExitosa = false;

    if (!ahorroObjetivo) {
      consultandoDetalle = false;
      mostrarMensaje("No fue posible seleccionar el ahorro", "falla");
      return;
    }

    try {
      setCargandoSolicitud(true, "Consultando...");
      $modalInfo.html(construirContenidoCargandoModal(ahorroObjetivo));
      $modalConfirmacion.modal("show");

      const response = await fetchJson(`/ahorro/devolucion/disponible?${new URLSearchParams({
        codlinea: ahorroObjetivo.codlinea,
        numerocuenta: ahorroObjetivo.numerocuenta
      }).toString()}`);

      if (consultaId !== consultaDetalleId) {
        return;
      }

      const detalleDisponible = response.data || {};

      disponibleSeleccionado = numeroDesdeInput(detalleDisponible.valorDisponible);
      consultaExitosa = true;
      $modalInfo.html(construirContenidoModal(ahorroObjetivo, detalleDisponible));

      if (disponibleSeleccionado <= 0) {
        setCargandoSolicitud(true);
        mostrarMensaje("No puede realizar la devolucion de este ahorro porque el disponible para retirar tiene valor $0.", "alerta");
      } else {
        setCargandoSolicitud(false);
      }
    } catch (error) {
      if (consultaId !== consultaDetalleId) {
        return;
      }

      console.error("Error consultando disponible de devolucion:", error);
      $modalConfirmacion.modal("hide");
      mostrarMensaje(error.message || "No fue posible consultar el valor disponible", "falla");
    } finally {
      if (consultaId === consultaDetalleId) {
        consultandoDetalle = false;

        if (!consultaExitosa || disponibleSeleccionado > 0) {
          setCargandoSolicitud(false);
        }
      }
    }
  });

  $btnSolicitar.on("click", async function () {
    if (enviando || !ahorroSeleccionado) {
      return;
    }

    const valorRetirar = numeroDesdeInput($("#valorRetirar").val());

    if (!valorRetirar || valorRetirar <= 0) {
      mostrarMensaje("Ingresa el valor a retirar", "alerta", function () {
        $("#valorRetirar").trigger("focus");
      });
      return;
    }

    await preguntarConfirmacion(
      `Estas seguro de realizar la solicitud de retiro de ahorro por valor de ${formatearNumero(valorRetirar)}`,
      async function () {
        await enviarSolicitudRetiro(valorRetirar);
      }
    );
  });

  $modalConfirmacion.on("hidden.bs.modal", function () {
    consultaDetalleId += 1;
    consultandoDetalle = false;
    $modalInfo.empty();
    disponibleSeleccionado = 0;
    ahorroSeleccionado = null;
    setCargandoSolicitud(false);
  });

  $btnAceptar.on("click", function () {
    $modalInformativo.modal("hide");
  });

  cargarAhorros();
});
