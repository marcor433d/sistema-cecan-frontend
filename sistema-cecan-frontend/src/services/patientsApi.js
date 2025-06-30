import api from './api';


/**
 * Trae todos los usuarios
 */
export function fetchPatients() {
    return api.get('/pacientes')
}

/** Busqueda avanzada */
export function fetchSearchPatients(termino){
    return api.get('/pacientes/busqueda', {params: {termino}});
}

/**
 * Trae un Paciente por número de expediente
 * @param {string} numExpediente
 */
export function fetchPatientsByNumExp(numExpediente) {
    return api.get(`/pacientes/${numExpediente}`);
}

export function fetchPatientsAppointments(numExpediente){
    return api.get(`/pacientes/${numExpediente}/citas`);
}

export function fetchPatientsReports(numExpediente){
    return api.get(`/pacientes/${numExpediente}/informes`);
}

/**
 * Para actualizar estado
 */
export function fetchPatientsUpdate(numExpediente, payload){
    return api.put(`/pacientes/${numExpediente}/actualizar`, payload);
}