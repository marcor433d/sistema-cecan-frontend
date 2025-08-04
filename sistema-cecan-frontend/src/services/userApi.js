import api from './api';

/**
 * Obtiene el perfil del usuario autenticado.
 */
export function fetchUserProfile() {
    return api.get('/me');
}

/**
 * Cambia la contraseña del usuario autenticado.
 */
export function changePassword({oldPassword, newPassword}) {
    return api.put('/me/password', {oldPassword, newPassword});
}

/**
 * Obtiene la lista completa de usuarios del sistema.
 */
export function fetchUsers() {
    return api.get('/usuarios')
}

/**
 * Busca usuarios por fragmento del nombre.
 */
export function searchUsersByName(nombre){
    return api.get('/usuarios/buscar',{params:{nombre}});
}

/**
 * Obtiene la información de un usuario por cédula profesional.
 */
export function fetchUserByCedula(cedula) {
    return api.get(`/usuarios/${cedula}`);
}
  
/**
 * Realiza una búsqueda avanzada de usuarios.
 */
export function fetchUsersSearch(termino){
    return api.get('/usuarios/busqueda', {params: {termino}});
}

/**
 * Actualiza la información de un usuario específico.
 */
export function updateUser(cedula,payload) {
    return api.put(`/usuarios/${cedula}`, payload);
};

/**
 * Permite que el administrador cambie la contraseña de otro usuario.
 */
export function changeUserPassword(cedula, payload) {
    return api.put(`/usuarios/${cedula}/cambiar-contrasena`, payload);
}

/**
 * Elimina un usuario del sistema (solo permitido para ADMIN o SISTEMAS).
 */
export function deleteUser(cedula) {
    return api.delete(`/usuarios/${cedula}`);
}

/**
 * Crea un nuevo usuario en el sistema.
 */
export function createUser(payload) {
    return api.post('/usuarios',payload);
}

/**
 * Objeto agrupado para exportar algunas funciones relacionadas con usuarios.
 */
const userApi = {
    fetchUserProfile
};




export default userApi;