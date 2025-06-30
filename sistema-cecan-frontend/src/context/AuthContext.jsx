import React, {createContext, useState, useEffect} from 'react';
import {fetchUserProfile} from '../services/userApi'
;
//Contexto de autentificación
export const AuthContext = createContext();

//componente provedor que envuelve la app y maneje al estado de auth
export function AuthContextProvider({children}) {
    //estado para el token, lo busca en el localstorage si existe
    //si hay token guardado lo usa
    const [token, setToken] = useState(()=>localStorage.getItem('token')||null);

    //Estado para los datos del usuario autentificado
    const [user,setUser] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });

    //Al montar, si hay token peor no user, obtenemos el perfil
    useEffect(() => {
        if(token && !user) {
            fetchUserProfile()
                .then((response) => {
                    setUser(response.data);
                    localStorage.setItem('user', JSON.stringify(response.data));
                })
                .catch(err => {
                    console.error('Error fetching user profile', err);
                });
        }
    },[token,user]);


    //funcion para iniciar sesión y cerrar
    const login = async (jwt) =>{
        console.log('Guardando JWT:',jwt);
        localStorage.setItem('token',jwt);//guarda en el navegador
        setToken(jwt);//actualiza el estado
        
        //Obtener el perfil
        try{
        const res = await fetchUserProfile();
        setUser(res.data);
        localStorage.setItem('user',JSON.stringify(res.data));
        } catch(err) {
            console.error('Error fetching ser profile after login',err);
        }
    };
    //Para cerrar sesión
    const logout = () =>{
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    //proveemos el contexto a toda la aplicación
    //todos los componentes hijos tendran acceso
    return(
        <AuthContext.Provider value={{token, user, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
}


