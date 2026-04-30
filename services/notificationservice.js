const config = require("../config/config");

const BASE_URL = String(config.notificationApiBase || "").replace(/\/+$/, "");
const URL_PROVIDER = `${BASE_URL}/Notification/ProviderNotification`;
const URL_SEND = `${BASE_URL}/Notification/SendNotification`;
const DEFAULT_TIMEOUT_MS = 30000;

const texto = (valor) => {
    if (valor === null || valor === undefined) {
        return "";
    }

    return String(valor).trim();
};

const validarAttachment = (attachment = {}, index = 0) => {
    const document = texto(attachment.document);
    const attachmentName = texto(attachment.attachmentName);
    const mediaType = texto(attachment.mediaType);

    if (!document) {
        throw new Error(`El adjunto #${index + 1} no contiene document en base64`);
    }

    if (!attachmentName) {
        throw new Error(`El adjunto #${index + 1} no contiene attachmentName`);
    }

    if (!mediaType) {
        throw new Error(`El adjunto #${index + 1} no contiene mediaType`);
    }

    return {
        document,
        attachmentName,
        mediaType
    };
};

const validarPayload = (payload = {}) => {
    const to = texto(payload.to);
    const subject = texto(payload.subject);
    const html = texto(payload.html);
    const channel = Number(payload.channel);
    const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];

    if (!to) {
        throw new Error("El payload de notificacion no contiene destinatario");
    }

    if (!subject) {
        throw new Error("El payload de notificacion no contiene asunto");
    }

    if (!html) {
        throw new Error("El payload de notificacion no contiene cuerpo HTML");
    }

    if (!Number.isFinite(channel)) {
        throw new Error("El payload de notificacion no contiene un channel valido");
    }

    return {
        to,
        subject,
        html,
        channel,
        attachments: attachments.map(validarAttachment)
    };
};

const leerRespuesta = async (response) => {
    const responseText = await response.text();

    if (!responseText) {
        return null;
    }

    try {
        return JSON.parse(responseText);
    } catch (_) {
        return responseText;
    }
};

const extraerMensajeError = (data, fallback) => {
    if (!data) return fallback;
    if (typeof data === "string") return data;
    if (data.message) return data.message;
    if (data.msj) return data.msj;
    if (data.error) return data.error;

    return fallback;
};

const crearTimeoutSignal = (timeoutMs = DEFAULT_TIMEOUT_MS) => {
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
        return AbortSignal.timeout(timeoutMs);
    }

    return undefined;
};

const requestNotificationApi = async (url, { method = "POST", body, headers = {} } = {}) => {
    const requestHeaders = { ...headers };

    if (body !== undefined && body !== null && !requestHeaders["Content-Type"]) {
        requestHeaders["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
        signal: crearTimeoutSignal()
    });

    const data = await leerRespuesta(response);

    if (!response.ok) {
        const error = new Error(extraerMensajeError(data, `Error HTTP: ${response.status}`));
        error.status = response.status;
        error.responseData = data;
        throw error;
    }

    return data;
};

const transformarPayloadExterno = (payload = {}) => ({
    message: payload.html,
    receiver: payload.to,
    subject: payload.subject,
    notificationType: payload.channel,
    attachments: payload.attachments
});

const prepararNotificacion = (payload = {}) => {
    const validado = validarPayload(payload);

    return {
        prepared: true,
        provider: "sendNotification",
        payload: validado,
        summary: {
            to: validado.to,
            subject: validado.subject,
            channel: validado.channel,
            attachmentCount: validado.attachments.length,
            attachmentNames: validado.attachments.map((item) => item.attachmentName)
        }
    };
};

exports.prepareActualizacionDatosEmail = (payload = {}) => prepararNotificacion(payload);

exports.prepareDevolucionAhorroEmail = (payload = {}) => prepararNotificacion(payload);

exports.getNotificationProvider = async () => {
    const data = await requestNotificationApi(URL_PROVIDER, {
        method: "POST"
    });

    return {
        provider: texto(data?.provider),
        raw: data
    };
};

exports.sendNotification = async (payload = {}) => {
    const validado = validarPayload(payload);
    const provider = await exports.getNotificationProvider();
    const body = transformarPayloadExterno(validado);
    const data = await requestNotificationApi(URL_SEND, {
        method: "POST",
        body,
        headers: {
            "Content-Type": "application/json"
        }
    });

    return {
        ok: true,
        provider: provider.provider,
        request: body,
        response: data
    };
};
