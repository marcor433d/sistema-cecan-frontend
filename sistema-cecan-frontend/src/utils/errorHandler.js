/**
 * Dado un estatus HTTP y un errorCode de la API,
 * Devuelve el texto que se quieree mostrar al usuario.
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