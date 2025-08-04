/**
 * API de autenticación.
 * - `login({cedula, password})`: Realiza una solicitud POST al backend para iniciar sesión y obtener un token.
 */
import api from '../../services/api.js';

export function login({cedula, password}){
    //asume que el backend expone POST /api/login y devuelve el token
    return api.post('/login',{cedula,password});
}