import api from '../../services/api.js';

export function login({cedula, password}){
    //asume que el backend expone POST /api/login y devuelve el token
    return api.post('/login',{cedula,password});
}