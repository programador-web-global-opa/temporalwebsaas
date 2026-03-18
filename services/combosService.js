exports.obtenerCombo = async (params) => {

    const { tipo, pais, dpto, ciudad, zona, comuna, empresa } = params;

    let tabla;
    let condicion = "";

    switch (tipo) {

        case "paises":
            tabla = "pais";
            break;

        case "departamentos":
            tabla = "departamentos";
            condicion = pais;
            break;

        case "ciudades":
            tabla = "ciudad";
            condicion = dpto;
            break;
        case "ciiu":
            tabla = "ciiu";
            break;
        case "nacionalidad":
            tabla = "nacionalidad";
            break;
        case "abreviaturadir":
            tabla = "abreviaturasdirecciones";
            break;
        case "zona":
            tabla = "zona";
            condicion = ciudad;
            break;
        case "comuna":
            tabla = "comunas";
            condicion = zona + "|" + ciudad;
            break;
        case "barrio":
            tabla = "barrios";
            condicion = comuna + "|" + zona + "|" + ciudad;
            break;
        case "empresatrabajo":
            tabla = "empresatrabajo";
            break;
        case "profesiones":
            tabla = "profesiones";
            break;
        case "dependencia":
            tabla = "dependenciasempresas";
            condicion = empresa;
            break;
        case "tipocontrato":
            tabla = "tipocontrato";
            break;
        case "pagaduria":
            tabla = "empresas";
            break;
        case "estudios":
            tabla = "niveleducativo";
            break;
        case "profesiones":
            tabla = "profesiones";
            break;
        case "bancos":
            tabla = "cuentasbancos";
            break;
        case "tipovivienda":
            tabla = "tipovivienda";
            break;
        default:
            return [];
    }
    const form = new URLSearchParams();
    form.append("tabla", tabla);
    form.append("condicion", condicion);

    const response = await fetch("http://10.2.0.44:3013/public/api/General/CargarCombos", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: form
    });
    const data = await response.json();
    return data;

};

