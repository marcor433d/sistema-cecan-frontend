import '@ant-design/v5-patch-for-react-19'; 
import React from 'react';
import  ReactDOM  from 'react-dom/client';
import "antd/dist/reset.css";
import './index.css';
import App from './App.jsx';
import { AuthContextProvider } from './context/AuthContext.jsx';
import { BrowserRouter } from 'react-router-dom';


ReactDOM.createRoot(document.getElementById('root')).render(
<React.StrictMode>

    <AuthContextProvider>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </AuthContextProvider>

</React.StrictMode>
);
