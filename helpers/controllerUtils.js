const { TokenExpiredError } = require('./apiFetch');

const manejarError = (req, res, error, status = 500) => {
  if (error instanceof TokenExpiredError || error.code === 'TOKEN_EXPIRED') {
    req.session?.destroy?.(() => {});
    return res.status(401).json({
      estado: false,
      sessionExpired: true,
      msj: error.message,
    });
  }
  return res.status(error?.status || status).json({
    estado: false,
    msj: error?.message || 'Ocurrió un error procesando la solicitud',
  });
};

module.exports = { manejarError };
