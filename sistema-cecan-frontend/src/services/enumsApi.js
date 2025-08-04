import api from './api';

/**
 * Obtiene los roles del sistema.
 */
export function fetchRoles(){
    return api.get('/roles');
}

/**
 * Obtiene los tipos de citas médicas.
 */
export function fetchTipoCitas() {
    return api.get('/tipo-citas');
}

/**
 * Obtiene los posibles estados de las citas médicas.
 */
export function fetchEstadoCitas() {
    return api.get('/estado-citas');
}

/**
 * Obtiene opciones de derechohabiencia de los pacientes.
 */
export function fetchDerechoHabiencia() {
    return api.get('/derecho-habiencia');
}

/**
 * Obtiene enfermedades crónico-degenerativas registradas.
 */
export function fetchEnfermedadesGD(){
    return api.get('/enfermedades-gd');
}

export function fetchAllDiagnosticos(){
    return api.get('/diagnosticos-comun');
}