$(document).ready(function () {
  const $form = $("#formAhorro");
  const $selectLinea = $("#lineaAhorro");
  const $cuotaInput = $("#cuota");
  const $mensaje = $("#mensaje");
  const $btnSubmit = $form.find('button[type="submit"]');

  let lineasAhorro = [];
  let lineaSeleccionada = null;
  let enviando = false;
  let infoModalOnClose = null;

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

  function formatearMoneda(value) {
    const numero = numeroDesdeInput(value);
    return numero ? numero.toLocaleString("es-CO") : "";
  }

  function ocultarMensaje() {
    $mensaje.addClass("d-none").text("");
  }

  function infoModal(mensaje, tipo, onClose = null) {
    const configPorTipo = {
      informacion: {
        color: "#3beaf6",
        icono: "i",
        tituloDefault: "Informacion"
      },
      alerta: {
        color: "#f0ad4e",
        icono: "!",
        tituloDefault: "Alerta"
      },
      exito: {
        color: "#22c55e",
        icono: "✓",
        tituloDefault: "Exito"
      },
      falla: {
        color: "#dc3545",
        icono: "x",
        tituloDefault: "Error"
      }
    };
    const config = configPorTipo[tipo] || configPorTipo.informacion;

    $("#infoModalTemp").remove();

    const modalHTML = `
      <div class="modal fade app-modal" id="infoModalTemp" tabindex="-1" aria-hidden="true">
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
                font-size: 1.6rem;
                font-weight: 700;
                line-height: 1;
              ">
                ${config.icono}
              </div>
            </div>

            <div class="app-modal__body text-center pt-3" style="font-size: 25px;">
              ${escapeHTML(mensaje)}
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

    if (!window.bootstrap?.Modal) {
      alert(mensaje);
      $modalElement.remove();
      if (typeof onClose === "function") onClose();
      return;
    }

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

  function confirmModal(mensaje, onConfirm) {
    const config = {
      color: "#3beaf6",
      icono: "?"
    };

    $("#infoModalTemp").remove();

    const modalHTML = `
      <div class="modal fade app-modal" id="infoModalTemp" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 460px;">
          <div class="modal-content app-modal__content">
            <div class="app-modal__header justify-content-center border-0 pb-0 pt-4">
              <div style="
                width: 48px;
                height: 48px;
                border-radius: 50%;
                border: 2px solid ${config.color};
                color: ${config.color};
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.35rem;
                font-weight: 700;
                line-height: 1;
              ">
                ${config.icono}
              </div>
            </div>

            <div class="app-modal__body text-center pt-3 px-4" style="font-size: 18px; line-height: 1.35;">
              ${mensaje}
            </div>

            <div class="app-modal__footer justify-content-center border-0 pt-0 pb-4 gap-2">
              <button type="button" class="app-button secondary" data-bs-dismiss="modal">
                Cancelar
              </button>
              <button type="button" class="app-button" id="btnConfirmarInfoModal">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    $("body").append(modalHTML);

    const $modalElement = $("#infoModalTemp");

    if (!window.bootstrap?.Modal) {
      if (window.confirm($("<div>").html(mensaje).text())) {
        onConfirm();
      }
      $modalElement.remove();
      return;
    }

    const modal = new bootstrap.Modal($modalElement[0]);

    $modalElement.on("click", "#btnConfirmarInfoModal", function () {
      $modalElement.data("confirmado", true);
      modal.hide();
    });

    $modalElement.on("hidden.bs.modal", function () {
      const confirmado = Boolean($modalElement.data("confirmado"));
      $(this).remove();

      if (confirmado && typeof onConfirm === "function") {
        onConfirm();
      }
    });

    modal.show();
  }

  function setEstadoCarga(cargando, textoBoton = "Crear Ahorro") {
    $btnSubmit.prop("disabled", cargando);
    $selectLinea.prop("disabled", cargando || lineasAhorro.length === 0);
    $cuotaInput.prop("disabled", cargando);
    $btnSubmit.text(textoBoton);
  }

  async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || data?.estado === false) {
      throw new Error(data?.msj || data?.message || `Error HTTP: ${response.status}`);
    }

    return data;
  }

  function pintarLineasAhorro(lineas) {
    $selectLinea.empty().append('<option value="" selected></option>');

    lineas.forEach((linea, index) => {
      const nombre = String(linea.nombrelinea || "").trim();
      const tipo = String(linea.tipo || "").trim();

      $("<option>", {
        value: linea.codlinea,
        text: tipo ? `${nombre} (${tipo})` : nombre
      })
        .attr("data-index", index)
        .attr("data-tipo", tipo)
        .attr("data-valmin", linea.valorminimo)
        .attr("data-valmax", linea.valormaximo)
        .appendTo($selectLinea);
    });

    $selectLinea.prop("disabled", lineas.length === 0);
  }

  async function cargarLineasAhorro() {
    try {
      ocultarMensaje();
      $selectLinea
        .prop("disabled", true)
        .empty()
        .append('<option value="" selected>Cargando lineas...</option>');
      setEstadoCarga(true, "Cargando...");

      const response = await fetchJson("/ahorro/crear/lineas");
      lineasAhorro = Array.isArray(response.data) ? response.data : [];

      if (lineasAhorro.length === 0) {
        pintarLineasAhorro([]);
        infoModal("No hay lineas de ahorro disponibles para crear", "alerta");
        return;
      }

      pintarLineasAhorro(lineasAhorro);
    } catch (error) {
      console.error("Error cargando lineas de ahorro:", error);
      pintarLineasAhorro([]);
      infoModal(error.message || "No fue posible cargar las lineas de ahorro", "falla");
    } finally {
      setEstadoCarga(false);
    }
  }

  function obtenerLineaSeleccionada() {
    const $selectedOption = $selectLinea.find("option:selected");
    const index = Number($selectedOption.attr("data-index"));

    if (!Number.isInteger(index) || index < 0) {
      return null;
    }

    return lineasAhorro[index] || null;
  }

  function validarFormulario() {
    lineaSeleccionada = obtenerLineaSeleccionada();

    if (!lineaSeleccionada) {
      infoModal("Debe seleccionar una linea de ahorro", "alerta", function () {
        $selectLinea.trigger("focus");
      });
      return false;
    }

    const cuota = numeroDesdeInput($cuotaInput.val());
    const valMin = Number(lineaSeleccionada.valorminimo || 0);
    const valMax = Number(lineaSeleccionada.valormaximo || 0);

    if (!cuota) {
      infoModal("Debe ingresar la cuota mensual del ahorro", "alerta", function () {
        $cuotaInput.trigger("focus");
      });
      return false;
    }

    if (valMin && cuota < valMin) {
      infoModal(
        `La cuota del ahorro debe ser mayor o igual a ${valMin.toLocaleString("es-CO")}`,
        "alerta",
        function () {
          $cuotaInput.trigger("focus");
        }
      );
      return false;
    }

    if (valMax && cuota > valMax) {
      infoModal(
        `La cuota del ahorro debe ser menor o igual a ${valMax.toLocaleString("es-CO")}`,
        "alerta",
        function () {
          $cuotaInput.trigger("focus");
        }
      );
      return false;
    }

    ocultarMensaje();
    return true;
  }

  function prepararConfirmacion() {
    const nombreLinea = String(lineaSeleccionada?.nombrelinea || "").trim();
    const cuota = formatearMoneda($cuotaInput.val());

    return `
      Se creara el ahorro <strong>${escapeHTML(nombreLinea)}</strong><br>
      Con cuota: <strong>${escapeHTML(cuota)}</strong>
    `;
  }

  function construirPayload() {
    return {
      codLinea: lineaSeleccionada.codlinea,
      tipo: lineaSeleccionada.tipo,
      cuota: numeroDesdeInput($cuotaInput.val()),
      valmin: Number(lineaSeleccionada.valorminimo || 0),
      valmax: Number(lineaSeleccionada.valormaximo || 0)
    };
  }

  async function crearAhorro() {
    if (enviando || !validarFormulario()) return;

    enviando = true;

    try {
      setEstadoCarga(true, "Enviando...");

      const response = await fetchJson("/ahorro/crear", {
        method: "POST",
        body: JSON.stringify(construirPayload())
      });

      infoModal(response.msj || "Ahorro creado correctamente", "exito", function () {
        window.location.reload();
      });
    } catch (error) {
      console.error("Error creando ahorro:", error);
      infoModal(error.message || "No fue posible crear el ahorro", "falla");
      setEstadoCarga(false);
      enviando = false;
    }
  }

  $cuotaInput
    .attr("inputmode", "numeric")
    .attr("maxlength", "12")
    .on("input", function () {
      $(this).val(formatearMoneda($(this).val()));
    });

  $selectLinea.on("change", function () {
    lineaSeleccionada = obtenerLineaSeleccionada();
    ocultarMensaje();
  });

  $form.on("submit", function (e) {
    e.preventDefault();

    if (!validarFormulario()) return;

    confirmModal(prepararConfirmacion(), crearAhorro);
  });

  cargarLineasAhorro();
});
