import React, { useState, useEffect } from "react";
import { Typography, Form, Input, Button, DatePicker, message, Card, Divider, Row, Col, Drawer, Space, Select } from "antd";
import moment from "moment";
import { EyeOutlined } from "@ant-design/icons";
import { useAuth } from "../../../context/useAuth";
import { fetchPatientsByNumExp } from "../../../services/patientsApi";
import { fetchCreateReports } from "../../../services/informesApi";
import { fetchUsers } from "../../../services/userApi";
import { useLoading } from "../../../hooks/useLoading";
import ReportsPdfViewer from "../../../components/ReportsPdfViewer";

const { Title, Text } = Typography;
const { TextArea } = Input;
const rolesPermitidos = ["MEDICO", "NUTRICION", "PSICOLOGIA", "ENFERMERIA"];

export default function EstudioGabineteLabPage(){

    const [form] = Form.useForm();
    const { user } = useAuth();
    const [paciente, setPaciente] = useState(null);
    const [medicos, setMedicos] = useState([]);
    const [loading, dispatchLoading] = useLoading({
        paciente: false,
        payload: false,
        medicos: false,
    });
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentReport, setCurrentReport] = useState(null);

    useEffect(() => {
    dispatchLoading({ type: "SET", key: "medicos", value: true });
    fetchUsers()
      .then(({ data }) => {
        setMedicos(data.filter((u) => rolesPermitidos.includes(u.rol)));
      })
      .catch(() => message.warning("No se pudo cargar la lista de médicos"))
      .finally(() =>
        dispatchLoading({ type: "SET", key: "medicos", value: false })
      );
  }, [dispatchLoading]);

    const handleNumExpBlur = ({ target: { value } }) => {
        if (!value) return;
        dispatchLoading({ type: "SET", key: "paciente", value: true });
        fetchPatientsByNumExp(value)
        .then(({ data }) => {
            setPaciente(data);
            // si paciente tiene diagnóstico, rellenarlo
            if (data.diagnostico) {
            form.setFieldsValue({ diagnostico: data.diagnostico });
            }
        })
        .catch(() => {
            message.warning("No se pudo cargar el paciente");
            setPaciente(null);
        })
        .finally(() =>
            dispatchLoading({ type: "SET", key: "paciente", value: false })
        );
    };

    const onFinish = async (values) =>{
        dispatchLoading({ type: "SET", key: "payload", value: true });
        try{
           const payload = {
            cabecera: {
                tipo: "ESTUDIO_GABINETE_LAB",
                cedula: {cedula: user.cedula},
            },
            detalle: {
                numExpediente: values.numExpediente,
                curp: paciente.curp,
                fecha: values.fecha.format("YYYY-MM-DD"),
                cama: values.cama,
                servicio: values.servicio,
                estudioSolicitado: values.estudioSolicitado,
                indicaciones: values.indicaciones,
                cedula: values.cedula,
            },
           };
            const resp = await fetchCreateReports(payload);
            const nuevo = resp.data;
            message.success("Solicitud creada correctamente");
            setCurrentReport({
                tipo: "ESTUDIOS_GABINETE_LABORATORIO",
                idInforme: nuevo.idInforme,
            });
            setDrawerOpen(true);
            form.resetFields();
            setPaciente(null);  
        }catch(err){
            if (err.validation) {
                form.setFields(
                err.validation.map(({ field, message }) => ({
                    name: field,
                    errors: [message],
                }))
                );
            } else {
                message.error("Error al guardar la solicitud");
            }
        }finally {
            dispatchLoading({ type: "SET", key: "payload", value: false });
        }
    };

    return(
        <>
            <Card
                title={<Title level={2}>Solicitud Estudios Gabinete/Lab</Title>}
                style={{maxWidth: 800, margin: "24px auto"}}
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    {/* Datos del paciente */}
                    <Divider orientation="left">Datos del paciente</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="numExpediente"
                                label="Número de expediente"
                                rules={[{ required: true, message: "Ingresa el expediente" }]}
                            >
                                <Input onBlur={handleNumExpBlur} />
                            </Form.Item>
                        </Col>
                    </Row>
                    {paciente && (
                        <Card type="inner" size="small" style={{ marginBottom: 24 }}>
                            <Text><b>Nombre: </b>{paciente.nombre} {paciente.apellidoPaterno} {paciente.apellidoMaterno}</Text><br/>
                            <Text><b>Fecha de nacimiento: </b>{moment(paciente.fechaNacimiento).format("YYYY-MM-DD")}</Text><br/>
                            <Text><b>Edad: </b>{paciente.edadCumplida} años</Text><br/>
                            <Text><b>Sexo: </b>{paciente.sexo === "F" ? "Femenino" : "Masculino"}</Text><br/>
                            <Text><b>CURP: </b>{paciente.curp}</Text>
                            <Text><b>Diagnóstico: </b>{paciente.diagnostico}</Text>
                        </Card>
                    )}
                    {/* Detalles de la solicitud */}
                    <Divider orientation="left">Detalles de la solicitud</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="fecha"
                                label="Fecha"
                                rules={[{ required: true, message: "Selecciona la fecha" }]}
                            >
                                <DatePicker style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="cedula"
                                label="Médico solicitante"
                                rules={[{ required: true, message: "Selecciona un médico" }]}
                            >
                               <Select
                                showSearch
                                placeholder="Buscar médico..."
                                loading={loading.medicos}
                                optionFilterProp="children"
                                filterOption={(inp, opt) =>
                                    opt.children.toLowerCase().includes(inp.toLowerCase)
                                }
                                >
                                    {medicos.map((m) => (
                                        <Select.Option key={m.cedula} value={m.cedula}>
                                            {m.nombre} {m.apellidoPaterno} ({m.cedula})
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                     <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="cama"
                                label="Cama"
                                rules={[{required: true, message: "Ingresa la cama"}]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="servicio"
                                label="Servicio"
                                rules={[{ required: true, message: "Ingresa el servicio" }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                     </Row>
                     <Form.Item
                        name="estudioSolicitado"
                        label="Estudio solicitado"
                        rules={[{ required: true, message: "Ingresa el estudio solicitado" }]}
                    >
                        <TextArea rows={3} />
                    </Form.Item>
                    <Form.Item
                        name="indicaciones"
                        label="Indicaciones"
                        rules={[{required: true, message: "Ingresa las indicaciones"}]}
                    >
                        <TextArea rows={3}/>
                    </Form.Item>
                    <Form.Item style={{ textAlign: "right" }}>
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
                            <Button type="primary" htmlType="submit" loading={loading.payload}>
                                Guardar Solicitud
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
            <Drawer
                title="Vista previa de Solicitud"
                width="80vw"
                onClose={() => setDrawerOpen(false)}
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