/**
 * @file appointmentsApi.js
 * @description Funciones que interactúan con el backend para gestionar citas, festivos y ausencias.
 * Utiliza el cliente HTTP configurado (`api`) para realizar las peticiones a los endpoints REST.
 */
import api from './api';


/**
 * Obtiene todas las citas, o filtra por cédula de médico si se proporciona.
 * @param {string} [cedula] - Cédula del médico para filtrar las citas.
 * @returns {Promise} Promesa con la lista de citas.
 */
export function fetchAppointments(cedula) {
    return api.get('/citas', {
        params: cedula ? {cedula} : {}
    });
}

/**
 * Obtiene todas las citas sin filtros.
 * @returns {Promise}
 */
export function fetchAllAppointments() {
    return api.get('/citas');
}

/**
 * Crea una nueva cita.
 * @param {Object} data - Datos de la cita a crear.
 * @returns {Promise}
 */
export function fetchCreateAppointments(data){
    return api.post('/citas',data);
}

/**
 * Actualiza una cita existente.
 * @param {number|string} id - ID de la cita.
 * @param {Object} payload - Datos actualizados.
 * @returns {Promise}
 */
export function fetchUpdateAppointments(id,payload){
     return api.put(`/citas/${id}`, payload);
}

/**
 * Obtiene los eventos del calendario entre dos fechas, con opción a filtrar por cédula de médico.
 * @param {string} desde - Fecha de inicio (formato ISO).
 * @param {string} hasta - Fecha de fin (formato ISO).
 * @param {string} [cedula] - Cédula del médico.
 * @returns {Promise}
 */
export function fetchCalendarEvents(desde,hasta, cedula) {
    
    return api.get('/citas/calendar',{
        params: {
            desde,
            hasta,
            ...( cedula ? {cedula } : {}),
        },
    });
}

/**
 * Elimina una cita por ID.
 * @param {number|string} id - ID de la cita.
 * @returns {Promise}
 */
export function fetchDeleteAppointment(id){
    return api.delete(`/citas/${id}`);

}

/**
 * Actualiza el estado de una cita.
 * @param {number|string} id - ID de la cita.
 * @param {string} estado - Nuevo estado.
 * @returns {Promise}
 */
export function fetchUpdateAppointmentStatus(id,estado){
    return api.put(`/citas/${id}/estado`, {estado});
}

/**
 * Crea un nuevo festivo (día inhábil).
 * @param {Object} data - Datos del festivo.
 * @returns {Promise}
 */
export function fetchCreateFestivos(data) {
    return api.post('/citas/festivos',data);
}

/**
 * Actualiza un festivo existente.
 * @param {string} fecha - Fecha del festivo.
 * @param {Object} data - Datos actualizados.
 * @returns {Promise}
 */
export function fetchUpdateFestivos(fecha,data) {
    return api.put(`/citas/festivos/${fecha}`,data);
}

/**
 * Elimina un festivo por fecha.
 * @param {string} fecha - Fecha del festivo.
 * @returns {Promise}
 */
export function fetchDeleteFestivos(fecha){
    return api.delete(`/citas/festivos/${fecha}`);
}

/**
 * Crea un registro de ausencia para un médico.
 * @param {Object} data - Datos de la ausencia.
 * @returns {Promise}
 */
export function fetchCreateAusencias(data){
    return api.post('/citas/ausencias',data);
}

/**
 * Actualiza una ausencia existente.
 * @param {number|string} id - ID de la ausencia.
 * @param {Object} data - Datos actualizados.
 * @returns {Promise}
 */
export function fetchUpdateAusencias(id,data) {
    return api.put(`/citas/ausencias/${id}`,data);
}

/**
 * Elimina una ausencia.
 * @param {number|string} id - ID de la ausencia.
 * @returns {Promise}
 */
export function fetchDeleteAusencias(id){
    return api.delete(`/citas/ausencias/${id}`);
}

/**
 * Obtiene las ausencias de un usuario por su cédula.
 * @param {string} usuarioCedula - Cédula del médico.
 * @returns {Promise}
 */
export function fetchUserAusencias(usuarioCedula) {
    return api.get('/citas/ausencias', {
        params: {usuarioCedula}
    });
}

/**
 * Obtiene las citas del usuario logueado.
 * @param {string} usuarioCedula - Cédula del usuario.
 * @returns {Promise}
 */
export function fetchMeAppointments(usuarioCedula){
    return api.get(`/citas/mis-citas/${usuarioCedula}`)
}

/**
 * Obtiene una cita por su ID.
 * @param {number|string} id - ID de la cita.
 * @returns {Promise}
 */
export function fetchAppointmentById(id) {
    return api.get(`/citas/${id}`);
}