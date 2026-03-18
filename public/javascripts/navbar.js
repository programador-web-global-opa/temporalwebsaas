$(document).ready(function () {

  const $informacion = $("#Meta-informacion");
  const $btnNotificaciones = $("#btnNotificaciones");
  const $btnPerfil = $("#btnPerfil")


  // Nombre Quemado para simular 
  const nombre = ("VIDES DIAZ BRANDON KALET")
  const fecha = new Date();
  var fechaFormateada = fecha.toLocaleString('es-CO');
  const ultimoingreso = ("February 26, 2026 4:13 AM")


  function renderInfo() {
    $informacion.append(`
        <span class="app-navbar__user">
            Asociado(a): <strong>${nombre}</strong>
        </span>
        <span class="app-navbar__meta">
            Hoy es <strong>Thursday, February 26, 2026 10:11 PM</strong> :
            Ultimo ingreso: <strong>${ultimoingreso}</strong>
        </span>  
        `);
  }

  //ejemplo notificaciones
  const notificaciones = [
    {
      id: 1,
      titulo: "Cuota actualizada",
      mensaje: "La cuota de tu ahorro fue modificada correctamente.",
      fecha: "Hace 5 minutos"
    },
    {
      id: 2,
      titulo: "Ahorro próximo a vencer",
      mensaje: "Tu ahorro de la línea Programado vence en 3 días.",
      fecha: "Hace 2 horas"
    },
  ];


  function renderNotificaciones(notificaciones) {

    const $dropdown = $("#notificacionesDropdown");
    $dropdown.empty();
    const total = notificaciones ? notificaciones.length : 0;

    $dropdown.append(`
    <div class="app-navbar__dropdown-header">
      <div class="fw-bold">Notificaciones</div>
      <div class="small text-muted">
        Tienes ${total} notificaciónes
      </div>
    </div>
    <div class="dropdown-divider"></div>
  `);

    if (!notificaciones || total === 0) {
      $dropdown.append(`
      <div class="p-3 text-muted text-center">
        No tienes notificaciones
      </div>
    `);
      return;
    }
    $.each(notificaciones, function (_, notificacion) {
      $dropdown.append(`
      <div class="dropdown-item app-navbar__notification">
        <div class="fw-semibold">
          ${notificacion.titulo}
        </div>
        <div class="small text-muted">
          ${notificacion.mensaje}
        </div>
        <div class="small text-muted mt-1">
          ${notificacion.fecha}
        </div>
      </div>
    `);
    });
  }

  $btnNotificaciones.on("click", function () {
    renderNotificaciones(notificaciones);
  });


  renderInfo();

});