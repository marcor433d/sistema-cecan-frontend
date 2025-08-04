import React from "react";
import {Card, Row, Col, Typography} from 'antd';
import {BarChartOutlined,MedicineBoxOutlined,ProfileOutlined,ReconciliationOutlined,FundOutlined,TableOutlined,FundViewOutlined,FileTextOutlined, UserOutlined, ToolOutlined} from '@ant-design/icons';
import { Route, useNavigate} from 'react-router-dom';

const { Title } = Typography;

/**
 * 
 *Muestra un menú de tipos de informes.
 * Al haccer click a una tarjeta, navegamos a lapágina dedicada de ese informe
 */
export default function ReportsPage(){
        const navigate = useNavigate();

        /**
         * Arreglo de tipos de informes disponibles.
         * Cada objeto contiene:
         * - `key`: identificador único del informe.
         * - `label`: nombre visible en la tarjeta.
         * - `icon`: ícono representativo.
         * - `route`: ruta a la cual se navega al dar click.
         */
        const tipoDeInforme = [
            {
                key: "ESTUDIO_SOCIOECONOMICO",
                label: 'Estudio Socioeconómico',
                icon: <BarChartOutlined style={{fontSize: 32, color: '#1890ff'}} />,
                route: '/informes/estudio-socioeconomico'

            },
            {
                key: "HISTORIA_CLINICA",
                label: 'Historia Clinica',
                icon: <MedicineBoxOutlined style={{fontSize: 32, color: '#1890ff'}} />,
                route: '/informes/historia-clinica'

            },
            {
                key: "HOJA_FRONTAL_DIAGNOSTICO",
                label: 'Hoja Frontal Diagnóstico',
                icon: <ProfileOutlined style={{fontSize: 32, color: '#1890ff'}} />,
                route: '/informes/hoja-frontal-diagnostico'

            },
            {
                key: "INTERCONSULTA",
                label: 'Interconsulta',
                icon: <ReconciliationOutlined style={{fontSize: 32, color: '#1890ff'}} />,
                route: '/informes/interconsulta'

            },
            {
                key: "ULTRASONOGRAFICO",
                label: 'Solicitud Ultrasonográfico',
                icon: <FundOutlined style={{fontSize: 32, color: '#1890ff'}} />,
                route: '/informes/solicitudultrasonografico'

            },
            {
                key: "ESTUDIOGABINETE",
                label: 'Solicitud Estudio de Gabinete y laboratorio',
                icon: <TableOutlined style={{fontSize: 32, color: '#1890ff'}} />,
                route: '/informes/estudio-gabinete'

            },
            {
                key: "INDICACIONESQUIMIO",
                label: 'Hoja de Indicaciones de Quimioterapia',
                icon: <FundViewOutlined style={{fontSize: 32, color: '#1890ff'}} />,
                route: '/informes/indicaciones-quimio'
            },
            {
                key: "SOLICITUDTRANSFUSION",
                label: 'Solicitud de Transfusión',
                icon: <FileTextOutlined style={{fontSize: 32, color: '#1890ff'}} />,
                route: '/informes/solicitud-transfusion'
            },
            {
                key: "INFORME_ID_PACIENTE",
                label: 'Informe de Identificación del Paciente',
                icon: <UserOutlined style={{fontSize: 32, color: '#1890ff'}} />,
                route: '/informes/informe-id-paciente'
            },
            {
                key: "SUBROGADOS",
                label: "Informe Subrogados",
                icon: <ToolOutlined style={{fontSize: 32, color: '#1890ff'}}/>,
                route: '/informes/subrogados'
            },

        ];


    return(
        <div>
            <Title level={2}>Selecciona un tipo de informe</Title>
            <Row gutter={[16,16]}>
                {tipoDeInforme.map(tipo => (
                    <Col key={tipo.key} xs={24} sm={12} md={8} lg={6}>
                        <Card
                            hoverable
                            onClick={() => navigate(tipo.route)}
                            style={{
                                textAlign: 'center', 
                                height: 180, 
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                            }}
                        >
                            <div style={{marginBottom: 12}}>{tipo.icon}</div>
                            <Title level={4}>{tipo.label}</Title>
                        </Card>
                    </Col>
                ))}
            </Row>
            
        </div>
    );
}