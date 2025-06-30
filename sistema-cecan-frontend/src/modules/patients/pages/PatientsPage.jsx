import React, { useEffect, useState } from "react";
import { Table, Input, Alert, Space, Typography, Divider} from "antd";
import { useNavigate } from "react-router-dom";
import { fetchPatients, fetchSearchPatients } from "../../../services/patientsApi";

const { Search } = Input;
const { Title } = Typography;

export default function PatientsPage(){
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        setError(null);
        setLoading(true);

        try{
            const{data} = await fetchPatients();
            setPacientes(data);
        }catch(e) {
            setError(e);
        } finally {
            setLoading(false);
        }
    };

    const onSearch = async(term) => {
        setError(null)
        setLoading(true);

        try{
            const resp = await fetchSearchPatients(term);
            setPacientes(resp.status == 204 ? [] : resp.data);
        }catch(e){
            setError(e);
        }finally{
            setLoading(false);
        }
    };

     const columns = [
        { title: "No. Expediente", dataIndex: "numExpediente", key: "numExpediente" },
        { title: "Nombre", dataIndex: "nombre", key: "nombre" },
        { title: "Ap. Paterno", dataIndex: "apellidoPaterno", key: "apellitoPaterno" },
        { title: "Ap. Materno", dataIndex: "apellidoMaterno", key: "apellitoMaterno" },
        { title: "Edad", dataIndex: "edadCumplida", key: "edadCumplida" },
        { title: "Género", dataIndex: "sexo", key: "sexo" },
        { title: "Edo. civil", dataIndex: "estadoCivil", key: "estadoCivil" },
    ];

    return(
        <Space direction="vertical" style={{ width: "100%" }}>
            <Title level={2}>Pacientes</Title>

             <Divider/>

            <Search
                placeholder="Buscar un paciente por nombre o expediente"
                allowClear
                enterButton="Buscar"
                size="middle"
                onSearch={onSearch}
                style={{maxWidth: 400}}
            />

            {error && (
                <Alert
                    type="error"
                    message="Error al cargar pacientes"
                    description={error.message}
                    showIcon
                    style={{ marginTop: 16 }} 
                />
            )}

            <Table
                style={{marginTop: 16}}
                dataSource={pacientes}
                columns={columns}
                rowKey="numExpediente"
                loading={loading}
                pagination={{pageSize: 10}}
                bordered
                size="middle"
                onRow={(record) => ({
                    onClick: () => navigate(`/pacientes/${record.numExpediente}`),
                })}
            />
        </Space>
       
    );
}