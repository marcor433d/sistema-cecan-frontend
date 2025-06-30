import React, { useState, useEffect } from "react";
import { Typography, Form, Input, Button, DatePicker, message, Card, Divider, Row, Col, Drawer, Space, Select, Modal} from "antd";
import moment from "moment";
import { EyeOutlined, PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { useAuth } from "../../../context/useAuth";
import { fetchPatientsByNumExp } from "../../../services/patientsApi";
import { fetchCreateReports, fetchLastByExpediente } from "../../../services/informesApi";
import { fetchUsers } from "../../../services/userApi";
import { useLoading } from "../../../hooks/useLoading";
import ReportsPdfViewer from "../../../components/ReportsPdfViewer";

const { Title, Text } = Typography;
const {confirm} = Modal;
const rolesPermitidos = ["MEDICO", "NUTRICION", "PSICOLOGIA", "ENFERMERIA"];

export default function IndicacionesQuimioPage(){
    const [form] = Form.useForm();
    const { user } = useAuth();
    const [paciente, setPaciente] = useState(null);
    const [medicos, setMedicos] = useState([]);
    const [loading, dispatchLoading] = useLoading({
        paciente: false,
        payload: false,
        medicos: false
    });
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentReport, setCurrentReport] = useState(null);

    useEffect(() => {
    dispatchLoading({ type: "SET", key: "medicos", value: true });
        fetchUsers()
        .then(({ data }) =>
            setMedicos(data.filter((u) => rolesPermitidos.includes(u.rol)))
        )
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
            return fetchLastByExpediente("INDICACIONES_QUIMIO", value);
        })
        .then(({ data }) => {
            if(data){
                confirm({
                    title: "Hoja de indicaciones existente",
                    content: "Ya existe una hoja de indicaciones para este paciente. ¿Deseas cargarla?",
                    onOk(){
                        form.setFieldsValue({
                            numExpediente: value,
                            cedula: data.cedula,
                            detalles: data.detalles.map((row) => ({
                                ...row,
                                fecha: moment(row.fecha, "YYYY-MM-DD"),
                            })),
                        });
                    },
                });
            }
        })
        .catch((err) => {
            if (err.response && err.response.status !== 204) {
                message.warning("No se pudo cargar datos previos");
            }
        })
        .finally(() =>
            dispatchLoading({ type: "SET", key: "paciente", value: false })
        );
    };

    const onFinish = async (values) => {
        dispatchLoading({ type: "SET", key: "payload", value: true });
        try{
            const payload = {
                cabecera: {
                    tipo: "INDICACIONES_QUIMIO",
                    cedula: { cedula: user.cedula}
                },
                detalle: {
                    numExpediente: values.numExpediente,
                    cedula: values.cedula,
                    detalles: values.detalles.map((row) => ({
                        fecha: row.fecha.format("YYYY-MM-DD"),
                        medicamento: row.medicamento,
                        dosis: row.dosis,
                        tipoSolucion: row.tipoSolucion,
                        volumen: row.volumen,
                        tiempoInfusion: row.tiempoInfusion
                    }))
                }
            };
            const resp = await fetchCreateReports(payload);
            const nuevo = resp.data;
            message.success("Hoja de indicaciones creada correctamente");
            setCurrentReport({
                tipo: "INDICACIONES_QUIMIO",
                idInforme: nuevo.idInforme
            });
            setDrawerOpen(true);
            form.resetFields();
            setPaciente(null);
        }catch(err){
            if(err.validation){
                form.setFields(
                    err.validation.map(({field,message}) => ({
                        name: field,
                        errors: [message]
                    }))
                );
            }else{
               message.error("Error al guardar la hoja de indicaciones"); 
            }
        }finally{
             dispatchLoading({ type: "SET", key: "payload", value: false });
        }
    };

    return(
        <>
            <Card
               title={<Title level={2}>Hoja de Indicaciones de Quimioterapia</Title>}
                style={{ maxWidth: 1000, margin: "24px auto" }}
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
                                <Input onBlur={handleNumExpBlur} />
                            </Form.Item>
                        </Col>
                    </Row>
                    {paciente && (
                        <Card type="inner" size="small" style={{ marginBottom: 24 }}>
                            <Text>
                                <b>Nombre: </b>
                                {paciente.nombre} {paciente.apellidoPaterno}{" "}
                                {paciente.apellidoMaterno}
                            </Text>
                            <br />
                            <Text>
                               <b>Fecha de nacimiento: </b>
                               {moment(paciente.fechaNacimiento).format("YYYY-MM-DD")}
                            </Text>
                        </Card>
                    )}
                    {/* Detalles de la Hoja */}
                    <Divider orientation="left">Indicaciones</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="cedula"
                                label="DX. Oncológico"
                                rules={[{ required: true, message: "Selecciona un médico" }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Buscar médico..."
                                    loading={loading.medicos}
                                    optionFilterProp="children"
                                    filterOption={(input, option) =>
                                        option.children.toLowerCase().includes(input.toLowerCase())
                                    }
                                    style={{width: "100%"}}
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
                    {/* Tabla dinámica de indicaciones */}
                    <Row gutter={8} style={{ marginBottom: 8, fontWeight: 'bold' }}>
                        <Col span={4}>Fecha</Col>
                        <Col span={4}>Medicamento</Col>
                        <Col span={3}>Dosis</Col>
                        <Col span={4}>Tipo solución</Col>
                        <Col span={3}>Volumen</Col>
                        <Col span={3}>Tiempo infusión</Col>
                        <Col span={2}></Col>{/* espacio para el botón de eliminar */}
                    </Row>
                    <Form.List name="detalles" initialValue={[{}]}>
                        {(fields, { add, remove}) => (
                            <>
                                {fields.map((field) =>(
                                    <Row gutter={8} key={field.key} align="middle">
                                        <Col span={4}>
                                            <Form.Item
                                                {...field}
                                                name={[field.name, "fecha"]}
                                                fieldKey={[field.fieldKey, "fecha"]}
                                                rules={[{ required: true, message: "Ingresa la fecha" }]}
                                            >
                                                <DatePicker style={{ width: "100%" }} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={4}>
                                            <Form.Item
                                                {...field}
                                                name={[field.name, "medicamento"]}
                                                fieldKey={[field.fieldKey, "medicamento"]}
                                                rules={[{ required: true, message:"Ingresa el medicamento" }]}
                                            >
                                                <Input />
                                            </Form.Item>
                                        </Col>
                                        <Col span={3}>
                                            <Form.Item
                                                {...field}
                                                name={[field.name, "dosis"]}
                                                fieldKey={[field.fieldKey, "dosis"]}
                                                rules={[{ required: true, message: "Ingresa la dosis" }]}
                                            >
                                                <Input />
                                            </Form.Item>
                                        </Col>
                                        <Col span={4}>
                                            <Form.Item
                                                {...field}
                                                name={[field.name, "tipoSolucion"]}
                                                fieldKey={[field.fieldKey, "tipoSolucion"]}
                                                rules={[{ required: true, message: "Ingresa el tipo" }]}
                                            >
                                                <Input />
                                            </Form.Item>
                                        </Col>
                                        <Col span={3}>
                                            <Form.Item
                                                {...field}
                                                name={[field.name, "volumen"]}
                                                fieldKey={[field.fieldKey, "volumen"]}
                                                rules={[{ required: true, message: "Ingresa el volumen"}]}
                                            >
                                                <Input />
                                            </Form.Item>
                                        </Col>
                                        <Col span={3}>
                                            <Form.Item
                                                {...field}
                                                name={[field.name, "tiempoInfusion"]}
                                                fieldKey={[field.fieldKey, "tiempoInfusion"]}
                                                rules={[{ required: true, message:"Ingresa el tiempo" }]}
                                            >
                                                <Input />
                                            </Form.Item>
                                        </Col>
                                         <Col span={2}>
                                            <MinusCircleOutlined
                                                onClick={() => remove(field.name)}
                                                style={{ marginTop: 30, fontSize: 18, color: "red" }}
                                            />
                                         </Col>
                                    </Row>
                                ))}
                                <Form.Item>
                                    <Button
                                        type="dashed"
                                        onClick={() => add()}
                                        block
                                        icon={<PlusOutlined />}
                                    >
                                        Agregar fila
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>

                     <Form.Item style={{ textAlign: "right" }}>
                        <Space>
                            <Button
                                icon={<EyeOutlined/>}
                                onClick={() =>
                                    currentReport
                                        ? setDrawerOpen(true)
                                        : message.info("Guarda primero para visualizar")
                                }
                            >
                                Previsualizar
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading.payload}
                            >
                                Guardar Hoja
                            </Button>
                        </Space>
                     </Form.Item>
                </Form>
            </Card>

            <Drawer
                title="Vista previa de Hoja de indicaciones"
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