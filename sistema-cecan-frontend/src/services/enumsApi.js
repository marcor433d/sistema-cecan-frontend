import api from './api';

export function fetchRoles(){
    return api.get('/roles');
}

export function fetchTipoCitas() {
    return api.get('/tipo-citas');
}

export function fetchEstadoCitas() {
    return api.get('/estado-citas');
}

export function fetchDerechoHabiencia() {
    return api.get('/derecho-habiencia');
}

export function fetchEnfermedadesGD(){
    return api.get('/enfermedades-gd');
}