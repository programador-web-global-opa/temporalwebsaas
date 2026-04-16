/**
 * Helpers de formato de fecha para las vistas EJS
 */

/**
 * Formatea la fecha actual con día de la semana, para mostrar en "Hoy es..."
 * Ejemplo: "Thursday, February 26, 2026 10:11 PM"
 * @param {Date|string} date
 * @returns {string}
 */
function formatFechaHoy(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d)) return 'Fecha inválida';

  const result = d.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'long',
    month:   'long',
    day:     'numeric',
    year:    'numeric',
    hour:    'numeric',
    minute:  '2-digit',
    hour12:  true,
  });
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Formatea una fecha de último ingreso (sin día de la semana).
 * Ejemplo: "February 26, 2026 4:13 AM"
 * @param {Date|string} date
 * @returns {string}
 */
function formatUltimoIngreso(date) {
  if (!date) return 'Sin registro';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d)) return 'Fecha inválida';

  const result = d.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    month:   'long',
    day:     'numeric',
    year:    'numeric',
    hour:    'numeric',
    minute:  '2-digit',
    hour12:  true,
  });
  return result.charAt(0).toUpperCase() + result.slice(1);
}

module.exports = { formatFechaHoy, formatUltimoIngreso };
