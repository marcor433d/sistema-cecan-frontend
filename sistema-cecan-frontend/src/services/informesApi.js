import api from './api';

export function fetchReportsPatients(numExpediente){
    return api.get(`/informes/paciente/${numExpediente}`);
}

export function fetchDetailReport(tipo, idInforme){
    return api.get('/informes/detalle', {
        params: {tipo,idInforme}
    });
}

export function fetchCreateReports(peticion) {
    return api.post('/informes/generico',peticion);
}

export function fetchImformePdf(tipo, idInforme){
    return api.get(`/informes/${tipo}/${idInforme}/pdf`, {
    responseType: 'blob'
    });
}

export function fetchLastByExpediente(tipo, numExpediente){
    return api.get(`/informes/${tipo}/last/by-expediente/${numExpediente}`)
}