/**
 * Punto de entrada de la aplicación en Vite + React.
 *
 * Este archivo:
 * - Importa los estilos globales y las dependencias base.
 * - Envuelve la aplicación con `AuthContextProvider` para manejar autenticación global.
 * - Usa `BrowserRouter` para permitir navegación por rutas (React Router).
 * - Renderiza el componente principal `<App />` dentro del DOM.
 *
 */

import '@ant-design/v5-patch-for-react-19'; 
import React from 'react';
import  ReactDOM  from 'react-dom/client';
import "antd/dist/reset.css";
import './index.css';
import App from './App.jsx';
import { AuthContextProvider } from './context/AuthContext.jsx';
import { BrowserRouter } from 'react-router-dom';


// Renderiza la app dentro del elemento raíz del DOM
ReactDOM.createRoot(document.getElementById('root')).render(
<React.StrictMode>

    <AuthContextProvider>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </AuthContextProvider>

</React.StrictMode>
);
