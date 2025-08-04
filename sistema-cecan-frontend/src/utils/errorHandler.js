/**
 * Devuelve un mensaje de error legible para el usuario
 * según el código de estado HTTP (`status`) y el código de error interno (`errorCode`)
 * proporcionado por la API durante el inicio de sesión.
 * 
 * Este manejador traduce errores comunes como credenciales inválidas o fallos de servidor
 * a mensajes más comprensibles y amigables para mostrar en la interfaz.
 * 
 * @param {number} status - Código de estado HTTP (ej. 400, 401, 500).
 * @param {string} errorCode - Código de error devuelto por el backend (ej. 'INVALID_CREDENTIALS').
 * @param {string} [defaultMsg] - Mensaje por defecto a mostrar si no hay coincidencias.
 * @returns {string} Mensaje listo para mostrar al usuario.
 */
export function getLoginErrorMessage(status, errorCode,defaultMsg) {
    switch (status) {
        case 400:
            return 'Por favor ingresa cédula y contraseña';
        case 401:
            //ERRORES que vienen desde el backend
            if (errorCode === 'INVALID_CREDENTIALS') {
                return 'La cédula o la contraseña son incorrectas';
            }
            return 'No autorizado. Verifica tus credenciales.';
        case 500:
            if(errorCode=== 'SERVER_ERROR') {
                return 'Ocurrió un error en el servidor. Intenta de nuevo más tarde.';
            }
            return 'Error interno. Por favor inténtalo nuevamente.';
        default:
            //cualquiera otro fallback
            return defaultMsg || 'Ocurrió un error inesperado.';
    }
}