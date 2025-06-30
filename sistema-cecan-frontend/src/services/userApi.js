import api from './api';

/**
* Hacer GET /api/usuarios/me para traer el perfil
*/
export function fetchUserProfile() {
    return api.get('/me');
}

/**
 * Cambia la contraseña del usuario autentificado
 */
export function changePassword({oldPassword, newPassword}) {
    return api.put('/me/password', {oldPassword, newPassword});
}

/**
 * Trae todos los usuarios
 */
export function fetchUsers() {
    return api.get('/usuarios')
}

/**
 * Busca usuarios por fragmento de nombre
 * @param {string} nombre
 */
export function searchUsersByName(nombre){
    return api.get('/usuarios/buscar',{params:{nombre}});
}

/**
 * Trae un usuario por cédula
 * @param {string} cedula
 */
export function fetchUserByCedula(cedula) {
    return api.get(`/usuarios/${cedula}`);
}
  
/** Busqueda avanzada */
export function fetchUsersSearch(termino){
    return api.get('/usuarios/busqueda', {params: {termino}});
}

/**
 * Actualizar usuarios
 */
export function updateUser(cedula,payload) {
    return api.put(`/usuarios/${cedula}`, payload);
};

/*
* Para que el ADMIN cambie las contraseñas de los usuarios
 */
export function changeUserPassword(cedula, payload) {
    return api.put(`/usuarios/${cedula}/cambiar-contrasena`, payload);
}

/**
 * Eliminar usuarios: solo ADMIN y SISTEMAS
 */
export function deleteUser(cedula) {
    return api.delete(`/usuarios/${cedula}`);
}

/**
 * Agregar usuarios
 */
export function createUser(payload) {
    return api.post('/usuarios',payload);
}

/**
 * userApi agrupa todas las llamadas relacionas con usuarios.
 */
const userApi = {
    fetchUserProfile
};




export default userApi;