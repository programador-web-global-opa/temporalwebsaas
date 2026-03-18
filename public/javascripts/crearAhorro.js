$(document).ready(function () {

  const $form = $("#formAhorro");
  const $selectLinea = $("#lineaAhorro");
  const $cuotaInput = $("#cuota");
  const $mensaje = $("#mensaje");


  const ahorrosDisponibles = [
    {
      codLinea: "001",
      nombrelinea: "Ahorro a la VistaJI",
      tipo: "AV",
      valorminimo: 50000
    },
    {
      codLinea: "002",
      nombrelinea: "Ahorro Contractual",
      tipo: "AC",
      valorminimo: 30000
    }
  ];


  //Cargar combo 
  $.each(ahorrosDisponibles, function (_, item) {
    const $option = $("<option>", {
      value: item.codLinea,
      text: item.nombrelinea
    })
      .data("tipo", item.tipo)
      .data("valmin", item.valorminimo);

    $selectLinea.append($option);
  });

  //Formatear número
  $cuotaInput.on("input", function () {
    let valor = $(this).val();
    valor = valor.replace(/\D/g, "");

    if (valor === "" || valor <= 0) {
      $(this).val("");
      return;
    }
    $(this).val(Number(valor).toLocaleString("es-CO"));
  });

  // Mostrar mensajes 
  function mostrarMensaje(texto, ok = true) {
    $mensaje
      .removeClass("d-none alert-success alert-danger")
      .addClass(ok ? "alert-success" : "alert-danger")
      .text(texto);
  }
  function ocultarMensaje(delay = 2500) {
    setTimeout(function () {
      $mensaje.addClass("d-none");
    }, delay);
  }


  //confirmacion
  $form.on("submit", function (e) {
    e.preventDefault();
    $("#modalConfirmarAhorro").modal("show");
  });

  $("#btnConfirmarAhorro").on("click", function () {

    $("#modalConfirmarAhorro").modal("hide");

    const $selectedOption = $selectLinea.find("option:selected");

    if (!$selectedOption.val()) {
      mostrarMensaje("Debe seleccionar una línea de ahorro", false);
      return;
    }

    const cuota = parseInt($cuotaInput.val().replace(/\./g, ""), 10);
    const valMin = parseInt($selectedOption.data("valmin"), 10);

    if (cuota < valMin) {
      mostrarMensaje(
        `La cuota debe ser mayor o igual a ${valMin.toLocaleString("es-CO")}`,
        false
      );
      ocultarMensaje();
      return;
    }

    mostrarMensaje("Ahorro creado correctamente", true);

    setTimeout(function () {
      $form[0].reset();
      $mensaje.addClass("d-none");
    }, 2500);
  });

});
