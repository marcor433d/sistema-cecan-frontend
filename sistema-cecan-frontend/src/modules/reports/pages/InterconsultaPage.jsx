/**
 * Página para la creación del informe de Interconsulta.
 */
import React, { useEffect, useState} from "react";
import { Typography, Form, Input, Button, DatePicker, message, Card, Divider, Row, Col, Drawer, Space, Select} from "antd";
import moment from "moment";
import { EyeOutlined } from "@ant-design/icons";
import { useAuth } from "../../../context/useAuth";
import { fetchPatientsByNumExp } from "../../../services/patientsApi";
import { fetchCreateReports } from "../../../services/informesApi";
import { useLoading } from "../../../hooks/useLoading";
import ReportsPdfViewer from "../../../components/ReportsPdfViewer";
import { fetchAllDiagnosticos } from "../../../services/enumsApi";
const { Title, Text} = Typography;
const { TextArea } = Input;

export default function InterconsultaPage(){
    const[form] = Form.useForm();
    const {user} = useAuth();
    const[paciente,setPaciente] = useState(null);
    const [loading, dispatchLoading] = useLoading({
        paciente: false,
        payload: false,
        diagnosticos: false,
    });

    const[drawerOpen, setDrawerOpen] = useState(false);
    const[currentReport, setCurrentReport] = useState(null);
    const [diagnosticos, setDiagnosticos] = useState([]);

    /**
     * Evento que se dispara cuando el usuario pierde el foco del input de expediente.
     * Busca automáticamente al paciente por número de expediente.
     *
     * @param {Object} e - Evento blur del input.
     */
    const handleNumExpBlur = ({target: {value}}) => {
        if(!value) return;
        dispatchLoading({ type: "SET", key: "paciente", value: true });
        fetchPatientsByNumExp(value)
            .then(({data}) => {
            setPaciente(data);
            form.setFieldsValue({
            diagnostico: data?.diagnostico || '' 
        });
    })
            .catch(() => {
                message.warning("No se pudo cargar el paciente");
                setPaciente(null);
            })
            .finally(()=>
                dispatchLoading({ type: "SET", key: "paciente", value: false }));
        
    };

    useEffect(()=>{
        dispatchLoading({ type: "SET", key: "diagnosticos", value: true });
            fetchAllDiagnosticos()
                .then(({data}) => setDiagnosticos(data))
                .catch(() => {
                    message.warning("No cargaron los diagnósticos");
                    setDiagnosticos(null);
                })
                .finally(() =>
                dispatchLoading({ type: "SET", key: "diagnosticos", value: false}));
    },[dispatchLoading])

    /**
     * Evento que se ejecuta al enviar el formulario de Interconsulta.
     * Envía los datos al backend, genera el informe y muestra el PDF.
     *
     * @param {Object} values - Valores del formulario completado.
     */
    const onFinish = async (values) => {
       dispatchLoading({ type: "SET", key: "payload", value: true });
       try{
        const payload = {
            cabecera: {
                tipo: 'INTERCONSULTA',
                cedula: { cedula: user.cedula},
            },
            detalle: {
                numExpediente: values.numExpediente,
                fecha: values.fecha.format("YYYY-MM-DD"),
                especialidad: values.especialidad,
                resumenClinico: values.resumenClinico,
                motivoEnvio: values.motivoEnvio,
                diagnostico: values.diagnostico || "",
            },
        };
        const resp = await fetchCreateReports(payload);
        const nuevo = resp.data;
        message.success("Interconsulta creada correctamente");
        setCurrentReport({
            tipo: "INTERCONSULTA",
            idInforme: nuevo.idInforme,
        });
        setDrawerOpen(true);
        form.resetFields();
        setPaciente(null);
       } catch(err){
        if(err.validation){
            form.setFields(
                err.validation.map(({field, message}) => ({
                    name: field,
                    errors: [message],
                }))
            );
        } else {
            message.error("Error al crear la interconsulta");
        }
       } finally {
        dispatchLoading({ type: "SET", key: "payload", value: false });
       }
    };

    return(
        <>
            <Card
                title={<Title level={2}>Registro de Interconsulta</Title>}
                style={{ maxWidth: 800, margin: "24px auto" }}
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    {/* Datos del paciente */}
                    <Divider orientation="left">Datos del paciente</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="numExpediente"
                                label="Número de expediente"
                                rules={[{required: true, message: "Ingresa el expediente"}]}
                            >
                                <Input onBlur={handleNumExpBlur}/>
                            </Form.Item>
                        </Col>
                    </Row>
                    {paciente &&(
                        <Card type="inner" size="small" style={{ marginBottom: 24 }}>
                            <Text>
                                <b>Nombre: </b>
                                {paciente.nombre} {paciente.apellidoPaterno}{" "}{paciente.apellidoMaterno}
                            </Text>
                            <br />
                            <Text>
                                <b>Fecha de nacimiento: </b>
                                {moment(paciente.fechaNacimiento).format("YYYY-MM-DD")}
                            </Text>
                            <br />
                            <Text>
                                <b>Edad: </b>
                                {paciente.edadCumplida} años{" "}
                            </Text>
                            <Text>
                                <b>Sexo: </b>
                                {paciente.sexo === "F" ? "Femenino" : "Masculino"}
                            </Text>
                        </Card>
                    )}

                    {/* Datos de la interconsulta */}
                    <Divider orientation="left">Detalles de Interconsulta</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="fecha"
                                label="Fecha"
                                rules={[{required: true, message: "Selecciona la fecha"}]}
                            >
                                <DatePicker style={{width: "100%"}}/>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="especialidad"
                                label="Especialidad a la que se envia"
                                rules={[{required:true, message: "Ingresa la especialidad"}]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item
                        name="resumenClinico"
                        label="Resumen clínico"
                        rules={[{required: true, message: "Ingresa el resumen clínico"}]}
                    >
                        <TextArea rows={4} />
                    </Form.Item>
                    <Form.Item
                        name="diagnostico"
                        label="Diagnóstico de presunción"
                        rules={[{required: true, message: "Ingresa el diagnóstico"}]}
                    >
                        <Select
                        showSearch
                        placeholder="Selecciona un diagnóstico"
                        loading={diagnosticos.length===0}
                        optionFilterProp='children'
                        filterOption={(input, option) =>
                            option?.children?.toLowerCase().includes(input.toLowerCase())

                        }
                        >
                            {diagnosticos.map(d => (
                                <Select.Option key={d} value={d}>
                                    {d}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="motivoEnvio"
                        label="Motivo de envío"
                        rules={[{required: true, message: "Ingresa el motivo de envío"}]}
                    >
                        <TextArea rows={4} />
                    </Form.Item>

                    <Form.Item style={{textAlign: "right"}}>
                        <Space>
                            <Button
                                icon={<EyeOutlined />}
                                onClick={() => 
                                    currentReport
                                        ? setDrawerOpen(true)
                                        : message.info("Guarda primero para previsualizar.")
                                }
                            >
                                Previsualizar
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading.payload}
                            >
                                Guardar Interconsulta
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>

            <Drawer
                title="Vista previa de Interconsulta"
                width="80vw"
                onClose={() => {
                    setDrawerOpen(false);

                }}
                open={drawerOpen}
                footer={null}
            >
                {currentReport && (
                    <ReportsPdfViewer
                        url={`/api/informes/${currentReport.tipo}/${currentReport.idInforme}/pdf`}
                    />
                )}
            </Drawer>
        </>
    );
}