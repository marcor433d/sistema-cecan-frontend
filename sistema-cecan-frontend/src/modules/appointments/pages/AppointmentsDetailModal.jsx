import { Modal, Card, Descriptions, Button, Popconfirm } from "antd";
import { useEffect, useState } from "react";
import { fetchAppointmentById } from "../../../services/appointmentsApi";

export default function AppointmentDetailModal({citaId, visible, onClose}){
    const [cita, setCita] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if(citaId && visible){
            setLoading(true);
            fetchAppointmentById(citaId)
                .then(({data}) => {
                    setCita(data);
                    console.log("Cita cargada:", data);
                })
                .finally(() => setLoading(false));
        } else {
        setCita(null);
    }
    }, [citaId, visible]);

    return (
        <Modal
            title="Detalles de la cita"
            open={visible}
            onCancel={onClose}
            footer={null}
            width={600}
        >
            {loading && <p>Cargando...</p>}
            {cita && (
                <Card>
                    <Descriptions column={1}>
                        <Descriptions.Item label="Titulo">{cita.title}</Descriptions.Item>
                        <Descriptions.Item label="Fecha y hora">
                            {new Date(cita.start).toLocaleString()} -{" "}
                            {new Date(cita.end).toLocaleString()}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tipo">{cita.tipo}</Descriptions.Item>
                        <Descriptions.Item label="Estado">{cita.estado}</Descriptions.Item>
                        <Descriptions.Item label="Motivo">{cita.motivo}</Descriptions.Item>
                    </Descriptions>
                </Card>
            )}
        </Modal>
    );
}