const config = require("../../config/config");
const { requestApi, extraerMensajeError, construirUrlConParams } = require("../../helpers/apiFetch");

const BASE_URL = config.apiUrlWeb;

const API_PARAMETROS = `${BASE_URL}/private/api/ProdServ/ParametrosProductosServicios`;
const API_ADJUNTOS = `${BASE_URL}/private/api/ProdServ/Adjuntos`;
const API_CAMPOS_DINAMICOS = `${BASE_URL}/private/api/ProdServ/CamposDinamicos`;
const API_LISTAS_CAMPOS = `${BASE_URL}/public/api/ProdServ/ArmarListasDeCampoDinamico`;
const API_NUMSOLICITUD = `${BASE_URL}/private/api/ProdServ/Numsolicitud`;
const API_CONSULTAR_SOL = `${BASE_URL}/private/api/ProdServ/ConsultarSolicitudes`;
const API_SEGUIMIENTO = `${BASE_URL}/private/api/ProdServ/SeguimientoSol`;
const API_GUARDAR = `${BASE_URL}/private/api/ProdServ/GuardarSolicitud`;

// ─── Helpers base ────────────────────────────────────────────────────────────

const normalizarTabla = (data) => {
  if (!Array.isArray(data)) return [];
  if (Array.isArray(data[0])) return data[0];
  return data;
};

// ─── Normalización de texto ───────────────────────────────────────────────────

const fullUpper = (str) =>
  String(str ?? "")
    .toUpperCase()
    .trim();

const fullLower = (str) => {
  const lower = String(str ?? "").toLowerCase();
  return lower.replace(
    /(^|\.\s+)(\S)/gu,
    (_, sep, char) => sep + char.toUpperCase(),
  );
};

const ucFirst = (str) => {
  const s = String(str ?? "");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// ─── Traducción de estados ────────────────────────────────────────────────────

const MAPA_ESTADOS = {
  E: "EN ESTUDIO",
  T: "EN TRÁMITE",
  A: "APROBADA",
  N: "NEGADA",
  X: "ANULADA",
};

const traducirEstado = (codigo) =>
  MAPA_ESTADOS[String(codigo ?? "").toUpperCase()] ?? codigo;

// ─── Control de periodos ──────────────────────────────────────────────────────

const getMesesPorPeriodo = (tipo) => {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const anio = String(ahora.getFullYear());

  const bimestres = [
    ["01", "02"],
    ["03", "04"],
    ["05", "06"],
    ["07", "08"],
    ["09", "10"],
    ["11", "12"],
  ];
  const trimestres = [
    ["01", "02", "03"],
    ["04", "05", "06"],
    ["07", "08", "09"],
    ["10", "11", "12"],
  ];
  const semestres = [
    ["01", "02", "03", "04", "05", "06"],
    ["07", "08", "09", "10", "11", "12"],
  ];

  if (tipo === "M") return mes;
  if (tipo === "B") return bimestres.find((b) => b.includes(mes)) ?? [];
  if (tipo === "T") return trimestres.find((t) => t.includes(mes)) ?? [];
  if (tipo === "S") return semestres.find((s) => s.includes(mes)) ?? [];
  if (tipo === "A") return anio;
  return [];
};

const MSJ_PERIODO = {
  M: "mensuales",
  B: "bimestrales",
  T: "trimestrales",
  S: "semestrales",
  A: "anuales",
};

// ─── Tipos de campo dinámico ──────────────────────────────────────────────────

const MAPA_TIPOS_CAMPO = { C: "text", N: "number", E: "email", L: "select" };

// ─── Funciones exportadas ─────────────────────────────────────────────────────

exports.obtenerProductosServicios = async (token) => {
  try {
    const data = await requestApi(API_PARAMETROS, { token });
    return normalizarTabla(data).map((item) => ({
      ...item,
      nombre: fullUpper(item.nombre),
      descripcion: ucFirst(fullLower(item.descripcion)),
    }));
  } catch (error) {
    console.error("Error consultando productos y servicios:", error);
    throw error;
  }
};

exports.obtenerAdjuntos = async (idProductoServicio, token) => {
  try {
    const url = construirUrlConParams(API_ADJUNTOS, { idProductoServicio });
    const data = await requestApi(url, { token });
    return normalizarTabla(data).map((item) => ({
      ...item,
      descripcion: ucFirst(fullLower(item.descripcion ?? "")),
      NomAdj: ucFirst(fullLower(item.NomAdj ?? "")),
    }));
  } catch (error) {
    console.error("Error consultando adjuntos:", error);
    throw error;
  }
};

exports.obtenerCamposDinamicos = async (idProductoServicio, token) => {
  try {
    const url = construirUrlConParams(API_CAMPOS_DINAMICOS, { idProductoServicio });
    const data = await requestApi(url, { token });
    const campos = normalizarTabla(data).filter(
      (c) => c.existe !== null && c.estadolista !== "I",
    );

    return Promise.all(
      campos.map(async (campo) => {
        const tipo = MAPA_TIPOS_CAMPO[campo.tipoCampo] ?? campo.tipoCampo;
        const base = {
          ...campo,
          descripcion: ucFirst(fullLower(campo.descripcion ?? "")),
          nombre: ucFirst(fullLower(campo.nombre ?? "")),
          tipoCampo: tipo,
        };

        if (tipo === "select") {
          const urlLista = construirUrlConParams(API_LISTAS_CAMPOS, {
            CodigoLista: campo.codigolista,
          });
          const listaData = await requestApi(urlLista);
          base.contenidoLista = normalizarTabla(listaData);
        }

        return base;
      }),
    );
  } catch (error) {
    console.error("Error consultando campos dinámicos:", error);
    throw error;
  }
};

exports.obtenerEstadoSolicitudes = async (cedula, token) => {
  try {
    const url = construirUrlConParams(API_CONSULTAR_SOL, {
      idProductoServicio: "",
      cedula,
    });
    const data = await requestApi(url, { token });
    return normalizarTabla(data).map((item) => ({
      ...item,
      EstadoActual: traducirEstado(item.EstadoActual),
    }));
  } catch (error) {
    console.error("Error consultando estado de solicitudes:", error);
    throw error;
  }
};

exports.obtenerSeguimientoSolicitud = async (idSolicitud, token) => {
  try {
    const url = construirUrlConParams(API_SEGUIMIENTO, { idSolicitud });
    const data = await requestApi(url, { token });
    const registros = normalizarTabla(data);

    if (!registros.length)
      throw new Error("Error consultando los seguimientos de las solicitudes");

    return registros.map((item) => ({
      ...item,
      EstadoNuevo: traducirEstado(item.EstadoNuevo),
    }));
  } catch (error) {
    console.error("Error consultando seguimiento:", error);
    throw error;
  }
};

exports.obtenerNumeroSolicitud = async (token) => {
  try {
    const data = await requestApi(API_NUMSOLICITUD, { token });
    const registro = normalizarTabla(data)[0] ?? {};
    const ultimo = registro.numeroSolicitud;

    if (ultimo === undefined || ultimo === null || ultimo === "") {
      const ahora = new Date();
      const pad = (n, l = 2) => String(n).padStart(l, "0");
      return Number(
        `${ahora.getFullYear()}${pad(ahora.getMonth() + 1)}${pad(ahora.getDate())}` +
          `${pad(ahora.getHours())}${pad(ahora.getMinutes())}${pad(ahora.getSeconds())}`,
      );
    }

    return Number(ultimo) + 1;
  } catch (error) {
    console.error("Error consultando número de solicitud:", error);
    throw error;
  }
};

exports.controlarNumeroSolicitudes = async (idProducto, cedula, token) => {
  try {
    const [productosData, solicitudesData] = await Promise.all([
      requestApi(API_PARAMETROS, { token }),
      requestApi(
        construirUrlConParams(API_CONSULTAR_SOL, {
          idProductoServicio: idProducto,
          cedula,
        }),
        { token },
      ),
    ]);

    const productos = normalizarTabla(productosData);
    const solicitudes = normalizarTabla(solicitudesData);
    const producto = productos.find(
      (p) => String(p.idtipo) === String(idProducto),
    );

    if (!producto) throw new Error("No se encontró el producto o servicio");

    const tipo = producto.controlpor;
    const periodoPeriodo = getMesesPorPeriodo(tipo);
    let contador = 0;

    for (const sol of solicitudes) {
      if (sol.EstadoActual === "X") continue;

      const mesSol = String(Number(sol.mesSolicitud)).padStart(2, "0");
      let enPeriodo = false;

      if (tipo === "M") {
        enPeriodo = periodoPeriodo === mesSol;
      } else if (tipo === "B" || tipo === "T" || tipo === "S") {
        enPeriodo =
          Array.isArray(periodoPeriodo) && periodoPeriodo.includes(mesSol);
      } else if (tipo === "A") {
        enPeriodo = String(sol.anioSolicitud) === String(periodoPeriodo);
      }

      if (enPeriodo) contador++;
    }

    if (contador >= Number(producto.solicitudes)) {
      return `Excedes el número total de solicitudes que puedes realizar para este servicio que son: ${producto.solicitudes} solicitudes ${MSJ_PERIODO[tipo] ?? ""}. Si quieres más información colócate en contacto con nosotros.`;
    }

    return "SI";
  } catch (error) {
    console.error("Error controlando número de solicitudes:", error);
    throw error;
  }
};

exports.guardarSolicitud = async (
  {
    numeroSolicitud,
    cedula,
    idProducto,
    camposDinamicos,
    observacion,
    adjuntos,
  } = {},
  token,
) => {
  try {
    const data = await requestApi(API_GUARDAR, {
      method: "POST",
      token,
      body: {
        numeroSolicitud,
        Cedula: cedula,
        IdProSer: idProducto,
        ContenidoCamProSer: camposDinamicos ?? "",
        NotaAsociado: observacion ?? "",
        Adjuntos: adjuntos ?? "",
      },
    });

    if (Array.isArray(data) && data.length > 0) {
      throw new Error(
        extraerMensajeError(data[0], "No fue posible realizar la solicitud"),
      );
    }

    return {
      estado: true,
      msj: `Tu solicitud ha sido generada con el siguiente número de radicado ${numeroSolicitud} y enviada a la entidad. Puedes hacerle seguimiento a su estado en la opción 'Ver estado solicitud'.`,
    };
  } catch (error) {
    console.error("Error guardando solicitud:", error);
    throw error;
  }
};
