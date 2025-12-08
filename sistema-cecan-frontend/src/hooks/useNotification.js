import { useEffect, useState, useCallback, useRef } from "react";
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import notificationApi from "../services/notificationApi";
import { message } from "antd";

/**
 * Hook personalizado mpara manejar las notificaciones en tiempo real.
 */
export function useNotification(cedula){
    const [notificaciones, setNotificaciones] = useState([]);
    const [loading, setLoading] = useState(false);
    const stompClientRef = useRef(null);

    /**
     * Carga inicial de notificaciones desd el backend.
     */
    const loadNotificaciones = useCallback(async () => {
        if(!cedula) return;
        setLoading(true);
        try{
            const {data} = await notificationApi.fetchNotification(cedula);
            const ordenadas = (data || []).sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
            setNotificaciones(ordenadas);
        }catch(error){
            console.error("Error al cargar notificaciones:", error);
        }finally{
            setLoading(false);
        }
    }, [cedula]);

    /**
     * Marcar como leída
     */
    const marcarLeida = useCallback(async (id) => {
        try{
            const { data, status} = await notificationApi.markNotificationAsRead(id);
            if(status === 200 && data){
                setNotificaciones((prev) => 
                    prev.map((n) => (n.id === id ? data : n))
                );
                message.success("Notificación marcada como leída");
            }
        }catch(error){
            console.error("Error al marcar notificación como leída:", error);
        }
    }, []);

    /**
     * Conecta al WebSocket y escucha notificaciones en tiempo real.
     */
    const connectWebSocket = useCallback(() => {
        if(!cedula) return;
        // Desconectar si ya había un cliente
        if (stompClientRef.current) {
            stompClientRef.current.deactivate();
        }
        
        const socket = new SockJS('http://localhost:8080/ws');
        const client = new Client({
            webSocketFactory: () => socket,
            debug: (str) => console.log(str),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('Conectado a WebSocket');
                client.subscribe(`/topic/notificaciones/${cedula}`, (message) => {
                    if(message.body){
                        const nueva = JSON.parse(message.body);
                        setNotificaciones((prev) => {
                            const actualizadas = [nueva, ...prev];
                            return actualizadas.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
                        });

                    }
                });
            },
        });
        client.activate();
        stompClientRef.current = client;
    }, [cedula]);

    /**
     * Efecto inicial: carga notificaciones y conecta al WebSocket.
     */
    useEffect(() => {
        if (!cedula) {
            // Si no hay usuario, desconecta el socket
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                stompClientRef.current = null;
                setNotificaciones([]);
            }
            return;
        }

        loadNotificaciones();
        connectWebSocket();

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                stompClientRef.current = null;
            }
        };
    }, [cedula, loadNotificaciones, connectWebSocket]);

    return {
        notificaciones,
        loading,
        marcarLeida,
        reload: loadNotificaciones,
    };
}