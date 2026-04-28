(function () {
  const BASE = '/products-services';

  let productoActual = null;
  let productosMap = {};
  let adjuntosActuales = [];
  let camposActuales = [];
  let infoModalOnClose = null;

  // ── Helpers ────────────────────────────────────────────────────────────────

  function escapeHTML(v) {
    return String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function esObligatorio(val) {
    return val === 'S' || val === 's' || val === true || val === 1;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return escapeHTML(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  function infoModal(mensaje, tipo, onClose) {
    const tipos = {
      alerta: { color: '#f0ad4e', icono: '!' },
      exito:  { color: '#22c55e', icono: '✓' },
      falla:  { color: '#dc3545', icono: '✕' },
      info:   { color: '#3beaf6', icono: 'i' },
    };
    const cfg = tipos[tipo] || tipos.info;
    $('#infoModalTemp').remove();
    $('body').append(`
      <div class="modal fade app-modal" id="infoModalTemp" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" style="max-width:650px;">
          <div class="modal-content app-modal__content">
            <div class="app-modal__header justify-content-center border-0 pb-0">
              <div style="width:64px;height:64px;border-radius:50%;border:3px solid ${cfg.color};color:${cfg.color};
                display:flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:700;">
                ${cfg.icono}
              </div>
            </div>
            <div class="app-modal__body text-center pt-3" style="font-size:22px;">${escapeHTML(mensaje)}</div>
            <div class="app-modal__footer justify-content-center border-0 pt-0">
              <button type="button" class="app-button" data-bs-dismiss="modal">Aceptar</button>
            </div>
          </div>
        </div>
      </div>`);

    const $el = $('#infoModalTemp');
    if (!window.bootstrap?.Modal) {
      alert(mensaje);
      $el.remove();
      if (typeof onClose === 'function') onClose();
      return;
    }
    new bootstrap.Modal($el[0]).show();
    $el.on('hidden.bs.modal', function () {
      const cb = typeof onClose === 'function' ? onClose : infoModalOnClose;
      infoModalOnClose = null;
      $(this).remove();
      if (typeof cb === 'function') cb();
    });
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  $(document).ready(function () {
    cargarProductos();
  });

  // ── Navegación de tabs ─────────────────────────────────────────────────────

  $(document).on('click', '.product-tab', function (e) {
    e.preventDefault();
    const tab = $(this).data('tab');
    $('#tab-content-generate, #tab-content-details').hide();
    const $target = $(`#tab-content-${tab}`);
    $target.fadeIn('fast', function () {
      $target[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    if (tab === 'details') cargarEstadoSolicitudes();
  });

  // ── Cargar productos en select ─────────────────────────────────────────────

  function cargarProductos() {
    $.getJSON(`${BASE}/listar`)
      .done(function (res) {
        if (!res.estado) return;
        productosMap = {};
        const $sel = $('#productoServicio').empty().append('<option value="" disabled selected hidden></option>');
        (res.data || []).forEach(function (p) {
          productosMap[p.idtipo] = p;
          $sel.append(`<option value="${escapeHTML(p.idtipo)}">${escapeHTML(p.nombre)}</option>`);
        });
      })
      .fail(function () {
        infoModal('No fue posible cargar los productos.', 'falla');
      });
  }

  // ── Paso 1 → Siguiente ─────────────────────────────────────────────────────

  $(document).on('click', '#btn-generate-form', function (e) {
    e.preventDefault();
    const idProducto = $('#productoServicio').val();
    if (!idProducto) {
      infoModal('Selecciona un producto o servicio.', 'alerta');
      return;
    }

    const $btn = $(this).prop('disabled', true).text('Validando...');

    $.getJSON(`${BASE}/validar-solicitudes`, { idProducto })
      .done(function (res) {
        if (!res.estado) { infoModal(res.msj || 'Error al validar.', 'falla'); return; }
        if (res.data !== 'SI') { infoModal(res.data, 'alerta'); return; }

        const prod = productosMap[idProducto] || {};
        productoActual = { id: idProducto, nombre: prod.nombre || '', desc: prod.descripcion || '' };
        $('#NomProd').val(productoActual.nombre);
        $('#DescProd').val(productoActual.desc);
        cargarFormulario(idProducto);
      })
      .fail(function (xhr) {
        infoModal(xhr.responseJSON?.msj || 'Error al validar solicitudes.', 'falla');
      })
      .always(function () {
        $btn.prop('disabled', false).text('Siguiente');
      });
  });

  // ── Cargar adjuntos y campos dinámicos ─────────────────────────────────────

  function cargarFormulario(idProducto) {
    $.when(
      $.getJSON(`${BASE}/adjuntos`, { idProductoServicio: idProducto }),
      $.getJSON(`${BASE}/campos`,   { idProductoServicio: idProducto })
    ).done(function (rAdj, rCampos) {
      adjuntosActuales = (rAdj[0]?.estado && rAdj[0].data)     ? rAdj[0].data     : [];
      camposActuales   = (rCampos[0]?.estado && rCampos[0].data) ? rCampos[0].data : [];
      renderAdjuntos(adjuntosActuales);
      renderCampos(camposActuales);
      $('#tab-generate-select').hide();
      $('#tab-generate-form').show();
      $('#tab-generate-form')[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }).fail(function () {
      infoModal('Error al cargar el formulario del producto.', 'falla');
    });
  }

  // ── Render adjuntos ────────────────────────────────────────────────────────

  function renderAdjuntos(adjuntos) {
    const $lista = $('#lista-adjuntos').empty();
    if (!adjuntos.length) { $('#seccion-adjuntos').hide(); return; }
    $('#seccion-adjuntos').show();
    adjuntos.forEach(function (adj, i) {
      const oblig = esObligatorio(adj.EsObligatorio);
      $lista.append(`
        <div class="row mb-3 align-items-center">
          <label class="col-sm-4 col-form-label" for="adjunto_${i + 1}">${escapeHTML(adj.NomAdj || adj.descripcion || '')}</label>
          <div class="col-sm-5">
            <input type="file" class="form-control" name="adjuntos${i + 1}" id="btn-adjuntos${i + 1}" ${oblig ? ' required' : ''}>
            <input type="hidden" name="IdAdj${i + 1}" value="${escapeHTML(String(adj.idProSerAdj ?? ''))}">
          </div>
          <div class="col-sm-3 text-center">${oblig ? 'Sí' : 'No'}</div>
        </div>`);
    });
    $lista.append(`<input type="hidden" name="contAdjuntos" value="${adjuntos.length}">`);
  }

  // ── Render campos dinámicos ────────────────────────────────────────────────

  function renderCampos(campos) {
    const $lista = $('#lista-campos').empty();
    if (!campos.length) { $('#seccion-campos').hide(); return; }
    $('#seccion-campos').show();
    campos.forEach(function (campo, i) {
      const oblig = esObligatorio(campo.obligatorio);
      const label = escapeHTML(campo.nombre || campo.descripcion || '');
      const cid   = escapeHTML(String(campo.idCamForDim ?? i));
      let inputHtml;

      if (campo.tipoCampo === 'select') {
        const opts = (campo.contenidoLista || []).map(function (o) {
          return `<option value="${escapeHTML(String(o.ContenidoDeLaLista ?? ''))}">${escapeHTML(o.ContenidoDeLaLista ?? '')}</option>`;
        }).join('');
        inputHtml = `
          <div class="app-field select mb-0">
            <select class="app-select campo-dinamico" data-campo-id="${cid}" id="campo_${i}"${oblig ? ' required' : ''}>
              <option value="" disabled selected hidden></option>${opts}
            </select>
            <label for="campo_${i}">${label}</label>
          </div>`;
      } else {
        inputHtml = `
          <div class="app-field mb-0">
            <input type="${campo.tipoCampo}" class="app-input campo-dinamico"
              data-campo-id="${cid}" id="campo_${i}" placeholder=" "${oblig ? ' required' : ''}>
            <label for="campo_${i}">${label}</label>
          </div>`;
      }

      $lista.append(`
        <div class="row mb-3 align-items-center">
          <div class="col-sm-4 col-form-label">${label}</div>
          <div class="col-sm-5">${inputHtml}</div>
          <div class="col-sm-3 text-center">${oblig ? 'Sí' : 'No'}</div>
        </div>`);
    });
  }

  // ── Paso 2 → Regresar ──────────────────────────────────────────────────────

  $(document).on('click', '#btn-form-back', function (e) {
    e.preventDefault();
    $('#tab-generate-form').hide();
    $('#tab-generate-select').show();
  });

  // ── Cancelar ───────────────────────────────────────────────────────────────

  $(document).on('click', '#btn-generate-cancel', function (e) {
    e.preventDefault();
    $('#tab-generate-form').hide();
    $('#tab-generate-select').show();
    $('#tab-content-generate').hide('fast', function () {
      $('#tab-content-generate')[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('#productoServicio').val('');
    productoActual = null;
  });

  // ── Enviar solicitud ───────────────────────────────────────────────────────

  $(document).on('submit', '#formSolicitud', function (e) {
    e.preventDefault();
    if (!this.checkValidity()) { this.reportValidity(); return; }

    const formData = new FormData(this);
    formData.append('idtipo', productoActual.id);

    const xmlCampos = camposActuales.map(function (campo) {
      const val = $(`#lista-campos .campo-dinamico[data-campo-id="${campo.idCamForDim}"]`).val() || '';
      return `<Campo><idCampo>${campo.idCamForDim}</idCampo><Contenido>${val}</Contenido></Campo>`;
    }).join('');
    formData.append('ContenidoCampos', xmlCampos);

    const $btn = $('#btn-submit-solicitud').prop('disabled', true).text('Enviando...');

    $.ajax({
      url: `${BASE}/guardar`,
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
    })
    .done(function (res) {
      if (res.estado) {
        infoModal(res.msj, 'exito', function () {
          $('#formSolicitud')[0].reset();
          $('#tab-generate-form').hide();
          $('#tab-generate-select').show();
          $('#productoServicio').val('');
          productoActual = null;
        });
      } else {
        infoModal(res.msj || 'No fue posible enviar la solicitud.', 'falla');
      }
    })
    .fail(function (xhr) {
      infoModal(xhr.responseJSON?.msj || 'Error al enviar la solicitud.', 'falla');
    })
    .always(function () {
      $btn.prop('disabled', false).text('Enviar Solicitud');
    });
  });

  // ── Estado de solicitudes ──────────────────────────────────────────────────

  function cargarEstadoSolicitudes() {
    $('#tbody-solicitudes').html(
      '<tr><td colspan="5" class="text-center text-muted py-4">Cargando solicitudes...</td></tr>'
    );
    $.getJSON(`${BASE}/estado`)
      .done(function (res) {
        const $tbody = $('#tbody-solicitudes').empty();
        if (!res.estado || !res.data?.length) {
          $tbody.html('<tr><td colspan="5" class="text-center text-muted py-4">No hay solicitudes registradas.</td></tr>');
          return;
        }
        res.data.forEach(function (sol) {
          $tbody.append(`
            <tr>
              <td class="text-center">${escapeHTML(sol.numeroSolicitud ?? '')}</td>
              <td class="text-center">${escapeHTML(sol.nombre ?? '')}</td>
              <td class="text-center">${escapeHTML(formatDate(sol.fechaSolicitud ?? ''))}</td>
              <td class="text-center">${escapeHTML(sol.EstadoActual ?? '')}</td>
              <td class="text-center">
                <button type="button" class="app-button primary btn-ver-mas"
                  data-id="${escapeHTML(String(sol.idTabla ?? ''))}"
                  data-fecha="${escapeHTML(formatDate(sol.fechaSolicitud ?? ''))}"
                  data-numero="${escapeHTML(String(sol.numeroSolicitud ?? ''))}"
                  data-producto="${escapeHTML(sol.nombre ?? '')}">
                  Ver más
                </button>
              </td>
            </tr>`);
        });
      })
      .fail(function () {
        $('#tbody-solicitudes').html(
          '<tr><td colspan="5" class="text-center text-danger py-4">Error al cargar las solicitudes.</td></tr>'
        );
      });
  }

  // ── Modal seguimiento ──────────────────────────────────────────────────────

  $(document).on('click', '.btn-ver-mas', function () {
    const $btn = $(this);
    $('#modal-fecha').val($btn.data('fecha'));
    $('#modal-numero').val($btn.data('numero'));
    $('#modal-producto').val($btn.data('producto'));
    $('#tbody-seguimiento').html(
      '<tr><td colspan="3" class="text-center text-muted py-4">Cargando...</td></tr>'
    );

    new bootstrap.Modal(document.getElementById('modalSeguimiento')).show();

    $.getJSON(`${BASE}/seguimiento`, { idSolicitud: $btn.data('id') })
      .done(function (res) {
        const $tbody = $('#tbody-seguimiento').empty();
        if (!res.estado || !res.data?.length) {
          $tbody.html('<tr><td colspan="3" class="text-center text-muted py-4">Sin registros de seguimiento.</td></tr>');
          return;
        }
        res.data.forEach(function (seg) {
          $tbody.append(`
            <tr>
              <td class="text-center">${escapeHTML(seg.FechaEstado ?? seg.FechEstado ?? '')}</td>
              <td class="text-center">${escapeHTML(seg.EstadoNuevo ?? '')}</td>
              <td>${escapeHTML(seg.Observaciones ?? '')}</td>
            </tr>`);
        });
      })
      .fail(function () {
        $('#tbody-seguimiento').html(
          '<tr><td colspan="3" class="text-center text-danger py-4">Error al cargar el seguimiento.</td></tr>'
        );
      });
  });

})();
