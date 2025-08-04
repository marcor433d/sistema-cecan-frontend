import { useReducer } from 'react';

/**
 * Reducer que maneja el estado de carga para múltiples claves.
 *
 * @param {Object} state - Estado actual del loading (ej. `{ pacientes: false, informes: true }`).
 * @param {Object} action - Acción despachada.
 * @param {string} action.type - Tipo de acción. Actualmente solo soporta `"SET"`.
 * @param {string} action.key - Clave del estado a modificar.
 * @param {boolean} action.value - Nuevo valor booleano para la clave especificada.
 * @returns {Object} Nuevo estado actualizado.
 */
function loadingReducer(state, action) {
    switch (action.type) {
        case 'SET':
            return {...state, [action.key]: action.value};
        default:
            return state;
    }
}

/**
 * Hook personalizado para manejar múltiples estados de carga de forma centralizada.
 */
export function useLoading(initial = {}) {
    return useReducer(loadingReducer, initial);
}