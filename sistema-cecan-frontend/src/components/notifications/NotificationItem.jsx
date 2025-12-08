
import { useState } from "react";
import AppointmentDetailModal from "../../modules/appointments/pages/AppointmentsDetailModal";

const NotificationItem = ({notificacion, marcaLeida}) => {

    const [modalVisible, setModalVisible] = useState(false);

    const handleClick = () => {
         console.log("Clic en notificación:", notificacion); // log al hacer click
        marcaLeida(notificacion.id);

        if(notificacion.referenciaModulo === "citas"){
            setModalVisible(true);
        }else {
            console.warn("Ruta no definida para módulo", notificacion.referenciaModulo);
        }
    };

    return(
    <>
        <div
            style= {{
                backgroundColor: notificacion.leida ? '#fff' : '#e6f7ff',
                cursor: "pointer",
                padding: "8px",
                borderBottom: "1px solid #f0f0f0",
            }}
            onClick={handleClick}
        >
            <strong>{notificacion.mensaje}</strong>
            <div>{new Date(notificacion.fecha).toLocaleString()}</div>
        </div>
        {notificacion.referenciaModulo === "citas" && (
            <AppointmentDetailModal
                citaId={notificacion.referenciaId}
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
            />
        )}
    </>
    );
};

export default NotificationItem;