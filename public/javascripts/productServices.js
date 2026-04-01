(function () {

    $(document).ready(function () {
    });

    $(document).on("click", ".product-tab", function (e) {
        e.preventDefault();

        const tab = $(this).data("tab");
        $("#tab-content-generate, #tab-content-details").hide();

        const $target = $(`#tab-content-${tab}`);
        $target.fadeIn("fast", function () {
            $target[0].scrollIntoView({ behavior: "smooth", block: "start" });
        });

    });

    $(document).on("change", "#productoServicio", function (e) {
        e.preventDefault();

    });

    $(document).on("click", "#btn-generate-form", function (e) {
        e.preventDefault();

        const productoServicio = $("#productoServicio").val();
        $("#tab-generate-form").fadeIn("fast", function () {
            $("#tab-generate-form")[0].scrollIntoView({ behavior: "smooth", block: "start" });
        });
    })

    $(document).on("click", "#btn-generate-cancel", function (e) {
        e.preventDefault();

        $("#tab-generate-form").hide("fast");

        $("#tab-content-generate").hide("fast", function () {
            $("#tab-content-generate")[0].scrollIntoView({ behavior: "smooth", block: "start" });
            $("#productoServicio").val("");

        });
    })

})();
