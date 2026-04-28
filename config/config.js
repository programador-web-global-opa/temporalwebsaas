const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  // Backend API APP
  apiBaseUrlApp: process.env.OPA_WEB_SERVICE_API_APP_BASE || 'http://localhost:3000/api',
  apiUrlApp: process.env.OPA_WEB_SERVICE_API_APP_URL || 'http://localhost:3000',
  
  // Backend API WEB
  apiBaseUrlWeb: process.env.OPA_WEB_SERVICE_API_WEB_BASE || 'http://localhost:3000/api',
  apiUrlWeb: process.env.OPA_WEB_SERVICE_API_WEB_URL || 'http://localhost:3000',

  // Session
  sessionSecret: process.env.SESSION_SECRET || 'secret',
  sessionMaxAge: 1000 * 60 * 60 * 13, // 13 horas

  // Security
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',

  // Call to websaas
  isWebSaas: process.env.OPA_IS_WEBSAAS || 1,

  // token tets
  tokePruebas: process.env.TOKEN_PRUEBAS,

  // Cedula test
  cedulaPruebas: process.env.CEDULA_PRUEBAS,

  // Adjuntos actualizacion de datos
  actualizacionDatosAdjuntosDir:
    process.env.ACTUALIZACION_DATOS_ADJUNTOS_DIR ||
    path.join(process.cwd(), 'storage', 'actualizacion_datos'),

  productosServiciosAdjuntosDir:
    process.env.PRODUCTOS_SERVICIOS_ADJUNTOS_DIR ||
    path.join(process.cwd(), 'storage', 'productos_servicios')

};

module.exports = config;