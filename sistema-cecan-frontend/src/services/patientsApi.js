import api from './api';


/**
 * Obtiene todos los pacientes registrados.
 */
export function fetchPatients(page=0, size=10) {
    return api.get(`/pacientes?page=${page}&size=${size}`);
}

/**
 * Realiza una búsqueda avanzada de pacientes por nombre o expediente.
 */
export function fetchSearchPatients(termino){
    return api.get('/pacientes/busqueda', {params: {termino}});
}

export function fetchSearchPatientsAdvanced(termino){
    return api.post('/pacientes/busqueda/filtrada',termino);
}

/**
 * Obtiene la información de un paciente específico por su número de expediente.
 */
export function fetchPatientsByNumExp(numExpediente) {
    return api.get(`/pacientes/${numExpediente}`);
}

/**
 * Obtiene las citas agendadas del paciente.
 */
export function fetchPatientsAppointments(numExpediente){
    return api.get(`/pacientes/${numExpediente}/citas`);
}

/**
 * Obtiene los informes generados para un paciente.
 */
export function fetchPatientsReports(numExpediente){
    return api.get(`/pacientes/${numExpediente}/informes`);
}

/**
 * Actualiza el estado general del paciente (activo/inactivo).
 */
export function fetchPatientsUpdate(numExpediente, payload){
    return api.put(`/pacientes/${numExpediente}/actualizar`, payload);
}

/**
 * Agregar estado de tratamiento al paciente.
 */
export function fetchPatientsAddEstado(numExpediente, payload){
    return api.post(`/pacientes/${numExpediente}/estado-tratamiento/crear`, payload);
}

/**
 * Agregar tratamientos a un paciente.
 */
export function fetchPatientsAddTratamiento(numExpediente, payload){
    return api.post(`/pacientes/${numExpediente}/tratamiento/crear`, payload);
}