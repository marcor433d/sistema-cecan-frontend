import api from './api';


/**
 * Obtiene las notificaciones de un usuario por su cédula
 */
export function fetchNotification(cedula){
    return api.get(`/notificaciones/${cedula}`);
}

/**
 * Crea una notificación
 */
export function createNotification(payload){
    return api.post('/notificaciones', payload);
}

/**
 * Marca una notificación como leída
 */
export function markNotificationAsRead(id){
    return api.put(`/notificaciones/${id}/leida`);
}

const notificationApi = {
    fetchNotification,
    createNotification,
    markNotificationAsRead
};

export default notificationApi;
