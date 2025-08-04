import api from './api';

/**
 * Obtiene todos los informes de un paciente.
 */
export function fetchReportsPatients(numExpediente){
    return api.get(`/informes/paciente/${numExpediente}`);
}

/**
 * Obtiene el detalle de un informe específico.

 */
export function fetchDetailReport(tipo, idInforme){
    return api.get('/informes/detalle', {
        params: {tipo,idInforme}
    });
}

/**
 * Crea un nuevo informe genérico.
 */
export function fetchCreateReports(peticion) {
    return api.post('/informes/generico',peticion);
}

/**
 * Descarga el PDF de un informe.
 */
export function fetchImformePdf(tipo, idInforme){
    return api.get(`/informes/${tipo}/${idInforme}/pdf`, {
    responseType: 'blob'
    });
}

/**
 * Obtiene el informe más reciente por expediente.
 */
export function fetchLastByExpediente(tipo, numExpediente){
    return api.get(`/informes/${tipo}/last/by-expediente/${numExpediente}`)
}