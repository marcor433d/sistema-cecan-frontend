import React, { useState, useEffect } from "react";
import { Typography, Form, Input, Button, TimePicker, message, Card, Divider, Row, Col, Drawer, Space, Select, InputNumber, Checkbox } from "antd";
import moment from "moment";
import { EyeOutlined } from "@ant-design/icons";
import { useAuth } from "../../../context/useAuth";
import { fetchPatientsByNumExp } from "../../../services/patientsApi";
import { fetchCreateReports } from "../../../services/informesApi";
import { fetchUsers } from "../../../services/userApi";
import { useLoading } from "../../../hooks/useLoading";
import ReportsPdfViewer from "../../../components/ReportsPdfViewer";

const { Title, Text } = Typography;
const { Option } = Select;
const rolesPermitidos = ["MEDICO", "ENFERMERIA"];

export default function InformeIdPacientePage() {
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
    const [riesgoCaida, setRiesgoCaida] = useState(false);
    const [riesgoUlceras, setRiesgoUlceras] = useState(false);

    // cargar lista de médicos/usuarios
    useEffect(() => {
        dispatchLoading({ type: "SET", key: "medicos", value: true });
        fetchUsers()
        .then(({ data }) =>
            setMedicos(data.filter((u) => rolesPermitidos.includes(u.rol)))
        )
        .catch(() => message.warning("No se pudo cargar la lista de usuarios"))
        .finally(() =>
            dispatchLoading({ type: "SET", key: "medicos", value: false })
        );
    }, [dispatchLoading]);

    const handleNumExpBlur = ({ target: {value} }) => {
        if(!value) return;
        dispatchLoading({ type: "SET", key: "paciente", value: true });
        fetchPatientsByNumExp(value)
            .then(({data}) => {
                setPaciente(data);
                //prerellenamos si existen
                form.setFieldsValue({
                    fechaIngreso: data.fechaIngreso 
                    ? moment(data.fechaIngreso, "YYYY-MM-DD") 
                    : undefined,
                    grupoSanguineo: data.grupoSanguineo || undefined,
                    rh: data.rh || undefined,
                    alergias: data.alergias || undefined,
                    pesoKg: data.pesoKg || undefined,
                    pesoGr: data.pesoGr || undefined,
                    talla: data.talla || undefined,
                    riesgoCaida: data.riesgoCaida || false,
                    riesgoUlceras: data.riesgoUlceras || false,
                });
                setRiesgoCaida(!!data.riesgoCaida);
                setRiesgoUlceras(!!data.riesgoUlceras);
                
            })
            .catch(() => {
                setPaciente(null);
                message.warning("No se encontró el paciente");
            })
            .finally(() => 
                dispatchLoading({ type: "SET", key: "paciente", value: false })
            );
    };

    const toggleCaida = () => {
        setRiesgoCaida(!riesgoCaida);
        form.setFieldsValue({ riesgoCaida: !riesgoCaida });
    };

    const toggleUlceras = () => {
        setRiesgoUlceras(!riesgoUlceras);
        form.setFieldsValue({ riesgoUlceras: !riesgoUlceras });
    };

    const onFinish = async (values) => {
        dispatchLoading({ type: "SET", key: "payload", value: true });
        try{
            const detalle = {
                numExpediente: values.numExpediente,
                hora: values.hora.format("HH:mm"),
                cama: values.cama,
                especialidad: values.especialidad,
                pesoKg: values.pesoKg,
                pesoGr: values.pesoGr,
                talla: values.talla,
                alergias: values.alergias,
                riesgoCaida: values.riesgoCaida,
                riesgoUlceras: values.riesgoUlceras,
                cedula: values.usuario,
                grupoSanguineo: values.grupoSanguineo,
                rh: values.rh,
            };
            const payload = {
                cabecera: {
                    tipo: "INFORME_ID_PACIENTE",
                    cedula: { cedula: user.cedula },
                },
                detalle,
            };

            console.log("Payload a enviar:", JSON.stringify(payload, null, 2));
            const resp = await fetchCreateReports(payload);
            message.success("Informe guardado correctamente");
            setCurrentReport({
                tipo: "INFORME_ID_PACIENTE",
                idInforme: resp.data.idInforme,
            });
            setDrawerOpen(true);
            form.resetFields();
            setPaciente(null);
            setRiesgoCaida(false);
            setRiesgoUlceras(false);
        }catch (err) {
            if(err.validation){
                form.setFields(
                    err.validation.map((e) => ({
                        name: e.field,
                        errors: [e.message],
                    }))
                );
            }else{
                message.error("Error al guardar el informe");
                console.error("Error al guardar el informe:", err);
            }
        }finally {
            dispatchLoading({ type: "SET", key: "payload", value: false });
        }
    };

    return(
        <>
            <Card
                title={<Title level={2}>Informe ID Paciente</Title>}
                style={{ maxWidth: 800, margin: "24px auto" }}
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Divider>Datos del paciente</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="numExpediente"
                                label="Número de expediente"
                                rules={[{ required: true }]}
                            >
                                <Input onBlur={handleNumExpBlur} />
                            </Form.Item>
                        </Col>
                    </Row>
                    {paciente && (
                        <Card type="inner" size="small" style={{ marginBottom: 24 }}>
                        <Text>
                            <b>Nombre:</b> {paciente.nombre} {paciente.apellidoPaterno}{" "}
                            {paciente.apellidoMaterno}
                        </Text>
                        <br />
                        <Text>
                            <b>F. nacimiento:</b>{" "}
                            {moment(paciente.fechaNacimiento).format("YYYY-MM-DD")}
                        </Text>
                        <br />
                        <Text>
                            <b>Edad:</b> {paciente.edadCumplida} años
                        </Text>
                        <br />
                        <Text>
                            <b>Sexo:</b>{" "}
                            {paciente.sexo === "F" ? "Femenino" : "Masculino"}
                        </Text>
                        <br />
                        <Text>
                            <b>F. ingreso:</b>{" "}
                            {moment(paciente.fechaIngreso, "YYYY-MM-DD").format(
                            "YYYY-MM-DD"
                            )}
                        </Text>
                        </Card>
                    )}

                    <Divider>Rellenar Informe</Divider>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name="hora"
                                label="Hora"
                                rules={[{ required: true }]}
                            >
                                <TimePicker style={{ width: "100%" }} format="HH:mm" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                             <Form.Item
                                name="cama"
                                label="Cama"
                                rules={[{ required: true }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                         <Col span={8}>
                            <Form.Item
                                name="especialidad"
                                label="Especialidad"
                                rules={[{ required: true }]}
                            >
                                <Input />
                            </Form.Item>
                         </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="usuario"
                                label="Usuario"
                                rules={[{ required: true }]}
                            >
                                <Select
                                showSearch
                                placeholder="Selecciona..."
                                loading={loading.medicos}
                                optionFilterProp="children"
                                filterOption={(inp, opt) =>
                                    opt.children.toLowerCase().includes(inp.toLowerCase())
                                }
                                >
                                {medicos.map((m) => (
                                    <Option key={m.cedula} value={m.cedula}>
                                    {m.nombre} {m.apellidoPaterno}
                                    </Option>
                                ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="grupoSanguineo" label="Grupo sanguíneo"
                                rules={[{ required: true }]}>
                                <Input placeholder="Ej. A+" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="rh" label="RH" rules={[{ required: true }]}>
                                <Input/>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="alergias" label="Alergias">
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item name="pesoKg" label="Peso (kg)">
                                <InputNumber style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="pesoGr" label="Peso (g)">
                                <InputNumber style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="talla" label="Talla (cm)">
                                <InputNumber style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider>Precauciones estándar</Divider>
                    <Row
                        justify="center"
                        align="middle"
                        gutter={48}
                        style={{ marginBottom: 24 }}
                    >
                        <Col span={4}>
                            <div
                                onClick={toggleCaida}
                                style={{
                                    width: 0,
                                    height: 0,
                                    borderLeft: "40px solid transparent",
                                    borderRight: "40px solid transparent",
                                    borderBottom: riesgoCaida ? "80px solid #ff4d4f" : "80px solid #ccc",
                                    cursor: "pointer",
                                }}
                            >
                               <span
                                    style={{
                                    position: "absolute",
                                    top: "40px",    // baja el texto dentro del triángulo
                                    left: "45px", // ajusta para centrar
                                    width: "10px",
                                    textAlign: "center",
                                    color: "#fff",
                                    fontSize: 10,
                                    fontWeight: "bold",
                                    lineHeight: 1.1,
                                    pointerEvents: "none", // que el span no intercepte el click
                                    }}
                                >
                                    RIESGO DE CAÍDA
                                </span> 
                            </div>
                            <Form.Item name="riesgoCaida" valuePropName="checked" hidden>
                                <Checkbox/>
                            </Form.Item>
                        </Col>
                        <Col span={4}>
                            <div
                                onClick={toggleUlceras}
                                style={{
                                    position: "relative",
                                    width: 80,
                                    height: 80,
                                    border: `4px solid ${riesgoUlceras ? "#ff4d4f" : "#ccc"}`,
                                    borderRadius: "50%",
                                    cursor: "pointer",
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "50%",
                                        transform: "translate(-50%, -50%)",
                                        textAlign: "center",
                                        color: riesgoUlceras ? "#ff4d4f" : "#000",
                                        fontSize: 10,
                                        fontWeight: "bold",
                                        lineHeight: 1.1,
                                    }}
                                >
                                    RIESGO<br />ULCERA
                                </div>
                            </div>
                            <Form.Item name="riesgoUlceras" valuePropName="checked" hidden>
                                <Checkbox/>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item style={{ textAlign: "right"}}>
                        <Space>
                            <Button
                                icon={<EyeOutlined />}
                                onClick={() =>
                                    currentReport
                                        ? setDrawerOpen(true)
                                        : message.warning("Guarda el informe primero para previsualizar")
                                }
                            >
                                Previsualizar
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading.payload}
                            >
                                Guardar Informe
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>

           <Drawer
                title="Vista previa Informe ID Paciente"
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