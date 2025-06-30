import { useReducer } from 'react';

/** clase para manejar el estado de carga */
function loadingReducer(state, action) {
    switch (action.type) {
        case 'SET':
            return {...state, [action.key]: action.value};
        default:
            return state;
    }
}

export function useLoading(initial = {}) {
    return useReducer(loadingReducer, initial);
}