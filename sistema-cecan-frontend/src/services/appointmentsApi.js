import api from './api';


/**
 * Trae las citas. Si pasas una cédula, filtra por médico.
 * @param {string} cedula - cedula del médico
 * @returns Promiise de axios con la lista de CitaDTO
 */
export function fetchAppointments(cedula) {
    return api.get('/citas', {
        params: cedula ? {cedula} : {}
    });
}

export function fetchAllAppointments() {
    return api.get('/citas');
}

export function fetchCreateAppointments(data){
    return api.post('/citas',data);
}

export function fetchUpdateAppointments(id,payload){
     return api.put(`/citas/${id}`, payload);
}

export function fetchCalendarEvents(desde,hasta, cedula) {
    
    return api.get('/citas/calendar',{
        params: {
            desde,
            hasta,
            ...( cedula ? {cedula } : {}),
        },
    });
}

export function fetchDeleteAppointment(id){
    return api.delete(`/citas/${id}`);

}

export function fetchUpdateAppointmentStatus(id,estado){
    return api.put(`/citas/${id}/estado`, {estado});
}

export function fetchCreateFestivos(data) {
    return api.post('/citas/festivos',data);
}

export function fetchUpdateFestivos(fecha,data) {
    return api.put(`/citas/festivos/${fecha}`,data);
}

export function fetchDeleteFestivos(fecha){
    return api.delete(`/citas/festivos/${fecha}`);
}

export function fetchCreateAusencias(data){
    return api.post('/citas/ausencias',data);
}

export function fetchUpdateAusencias(id,data) {
    return api.put(`/citas/ausencias/${id}`,data);
}

export function fetchDeleteAusencias(id){
    return api.delete(`/citas/ausencias/${id}`);
}

export function fetchUserAusencias(usuarioCedula) {
    return api.get('/citas/ausencias', {
        params: {usuarioCedula}
    });
}

export function fetchMeAppointments(usuarioCedula){
    return api.get(`/citas/mis-citas/${usuarioCedula}`)
}
