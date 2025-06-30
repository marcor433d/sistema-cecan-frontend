import { message } from 'antd';
import axios from 'axios';

//COnfiguración del cliente HTTP central
const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    withCredentials:true,
});
//Intwerceptor para inyectar el JWT en cada petición
api.interceptors.request.use(config =>{
    const token = localStorage.getItem('token');
    console.log('[api.interceptor] » URL:',config.url, '- token:',token);

    //No inyectamos el header en /login, y sólo si token es string válido
    if(
        token &&
        token !== 'undefined' &&
        !config.url.endsWith('/login')
    ){
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, error => Promise.reject(error));

api.interceptors.response.use(
    response => response,
    error => {
        //Si no hay respuesta, p.e. caída de red
        if(!error.response){
            message.error('Sin conexión al servidor. Revisa tu red');
            return Promise.reject(error);
        }

        const { status, data } = error.response;

        if(data?.code === 'VALIDATION_ERROR' && Array.isArray(data.details)){
            //devolvemos un shape específico para el form
            return Promise.reject({validation: data.details});
        }

        //Mapeo de códigos de negocio  / HTTP a mensajes de usuario
        switch (data.code || status) {
            case 'VALIDATION_ERROR':
                message.error(data.message);
                break;
            case 401:
                message.error('No estás autorizado. Por favor inicia sesión.');
                break;
            case 404:
                message.error('Recurso no encontrado.');
                break;
            case 429:
                message.error('Has excedido el límite de solicitudes. Intenta más tarde.');
                break;
            case 500:
            default:
                message.error(data.message || 'Error en el servidor. Intenta de nuevo más tarde.');
        }
        return Promise.reject(error);


    }
);

export default api;