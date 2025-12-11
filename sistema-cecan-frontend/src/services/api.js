/**
 * Cliente Axios central configurado para manejar peticiones HTTP al backend.
 * - Inyecta automáticamente el token JWT en los headers (excepto en /login).
 * - Muestra mensajes de error amigables según el código de error HTTP o de negocio.
 * - Incluye manejo para errores de validación, red y sesión.
 */
import { message } from 'antd';
import axios from 'axios';

//COnfiguración del cliente HTTP central
const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    withCredentials:true,
});

// Interceptor para agregar el token JWT en cada solicitud, excepto /login.
/**
 * Inyecta el token JWT en el encabezado Authorization de cada solicitud si existe.
 * Evita agregarlo en peticiones al endpoint /login.
 */
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

// Interceptor para manejo global de respuestas
/**
 * Maneja errores de red y respuestas del servidor.
 * Muestra mensajes al usuario según el tipo de error (401, 404, 429, VALIDATION_ERROR, etc).
 * Rechaza la promesa con información del error para que los componentes puedan manejarla.
 */
api.interceptors.response.use(
    response => response,
    error => {
        
        if(!error.response){
            message.error('Error de red. Por favor verifica tu conexión.');
            return Promise.reject(error);
        }
        const {status, data} = error.response;
        const url = error.config?.url;

        //No mostramos mensajes de error para el endpoint de login aquí
        if(url?.endsWith('/login')){
            return Promise.reject(error);
        }
        
        if(data?.errorCode === 'VALIDATION_ERROR' && Array.isArray(data.details)){

            return Promise.reject({validation: data.details});
        }

        //Mapeo de códigos de negocio  / HTTP a mensajes de usuario
        switch (data.code || status) {
            case 401:
                message.error('No estás autorizado. Por favor inicia sesión.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                //redirecciona a login
                window.location.href = '/login';
                break;
            case 404:
                message.error('Recurso no encontrado. La ruta solicitada no existe.');
                break;
            case 429:
                message.error('Has excedido el límite de solicitudes. Intenta más tarde.');
                break;
            case 500:
            case 'SERVER_ERROR':
            default:
                message.error(data.message || 'Error en el servidor. Intenta de nuevo más tarde.');
        }
        return Promise.reject(error);


    }
);

export default api;