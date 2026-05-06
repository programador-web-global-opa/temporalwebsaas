class TokenExpiredError extends Error {
  constructor() {
    super('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
    this.code = 'TOKEN_EXPIRED';
    this.status = 401;
  }
}

const esTokenExpiradoBody = (data) => {
  // API app: [[{ Codigo: '401', tipoMensaje: 'E' }]]
  if (Array.isArray(data) && Array.isArray(data[0])) {
    const item = data[0][0];
    if (item?.Codigo === '401' && item?.tipoMensaje === 'E') return true;
  }
  // API web: { mensaje: 'Token no encontrado o revocado' | 'El token ha expirado' }
  if (data?.mensaje) {
    const msg = String(data.mensaje).toLowerCase();
    if (msg.includes('expirad') || msg.includes('revocad') || msg.includes('no encontrad')) return true;
  }
  return false;
};

const buildAuthHeader = ({ token, tokenWeb } = {}) => {
  if (tokenWeb) return `Bearer ${tokenWeb}`;
  if (token) return token;
  return null;
};

const buildHeaders = ({ token, tokenWeb } = {}) => {
  const headers = { "Content-Type": "application/json" };
  const auth = buildAuthHeader({ token, tokenWeb });
  if (auth) headers.Authorization = auth;
  return headers;
};

const parseResponse = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const extraerMensajeError = (data, fallback) => {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  return data.message ?? data.msj ?? data.error ?? fallback;
};

const construirUrlConParams = (url, params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, value);
    }
  });
  const query = searchParams.toString();
  return query ? `${url}?${query}` : url;
};

/**
 * @param {string} url
 * @param {{ method?: string, token?: string, tokenWeb?: string, body?: object, formBody?: URLSearchParams }} options
 * token    → Authorization: <token>          (sin Bearer, API legacy)
 * tokenWeb → Authorization: Bearer <token>   (REST API)
 */
const requestApi = async (url, { method = "GET", token, tokenWeb, body, formBody } = {}) => {
  let headers, bodyData;

  if (formBody) {
    headers = { "Content-Type": "application/x-www-form-urlencoded" };
    const auth = buildAuthHeader({ token, tokenWeb });
    if (auth) headers.Authorization = auth;
    bodyData = formBody;
  } else {
    headers = buildHeaders({ token, tokenWeb });
    bodyData = body ? JSON.stringify(body) : undefined;
  }

  const response = await fetch(url, { method, headers, body: bodyData });
  const data = await parseResponse(response);

  if (esTokenExpiradoBody(data)) throw new TokenExpiredError();

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new TokenExpiredError();
    const error = new Error(extraerMensajeError(data, `Error HTTP: ${response.status}`));
    error.status = response.status;
    error.responseData = data;
    throw error;
  }

  return data;
};

module.exports = { requestApi, buildHeaders, parseResponse, extraerMensajeError, construirUrlConParams, TokenExpiredError };
