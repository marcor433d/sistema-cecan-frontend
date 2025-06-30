import React, {useEffect, useState} from "react";
import { Typography, Form, Input, Button, DatePicker, message, Card, Divider, Space, Row, Col, Select, Drawer, } from "antd";
import moment from "moment";
import { PlusOutlined, EyeOutlined } from "@ant-design/icons";
import { useAuth } from "../../../context/useAuth";
import { fetchCreateReports } from "../../../services/informesApi";
import { fetchPatientsByNumExp } from "../../../services/patientsApi";
import { fetchUsers} from "../../../services/userApi";
import ReportsPdfViewer from "../../../components/ReportsPdfViewer";
import { useLoading } from "../../../hooks/useLoading";

const { Title, Text} = Typography;
const { TextArea} = Input;
 const rolesPermitidos = ["MEDICO", "NUTRICION", "PSICOLOGIA", "ENFERMERIA"];

export default function HojaFrontalDiagnosticoPage(){
    const [form] = Form.useForm();
    const {user} = useAuth();
    const [paciente, setPaciente] = useState(null);
    const[medicos,setMedicos] = useState([]);
    const [loading, dispatchLoading] = useLoading({
        paciente: false,
        payload: false,
        usuario: false,
    });
   

    //Drawer preview
    const[drawerOpen, setDrawerOpen] = useState(false);
    const [currentReport, setCurrentReport] = useState(null);

    useEffect(() =>{
        dispatchLoading({ type: "SET", key: "usuario", value: true });
        fetchUsers()
            .then(({data}) => {
                //filtrar solo roles 'MEDICO', 'NUTRICION', 'PSICOLOGIA', 'ENFERMERIA'
                setMedicos(data.filter((u) => rolesPermitidos.includes(u.rol)));
            })
            .catch(() => message.warning("No se pudo cargar la lista de médicos"))
            .finally(() => 
                dispatchLoading({ type: "SET", key: "usuario", value: false })
            );
    }, [dispatchLoading]);

    const handleNumExpBlur = ({ target: {value}}) =>{
        if(!value) return;
        dispatchLoading({ type: "SET", key: "paciente", value: true });
        fetchPatientsByNumExp(value)
            .then(({data}) =>{
                setPaciente(data);
            })
            .catch(() => {
                message.warning("No se pudo cargar el paciente");
                setPaciente(null);
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
                    tipo: "HOJA_FRONTAL_DIAGNOSTICO",
                    cedula: { cedula: user.cedula},
                },
                detalle: {
                    numExpediente: values.numExpediente,
                    codigoClave: values.codigoClave,
                    servicio: values.servicio,
                    noHoja: values.noHoja,
                    tabla: values.tabla.map((row) => ({
                        fecha: row.fecha.format("YYYY-MM-DD"),
                        diagnosticoNosologico: row.diagnosticoNosologico,
                        cedula: row.cedula,
                    })),
                },
            };

            const resp = await fetchCreateReports(payload);
            const nuevo = resp.data;
            message.success("Hoja Frontal Diagnóstico guardada correctamente");

            setCurrentReport({
                tipo: "HOJA_FRONTAL_DIAGNOSTICO",
                idInforme: nuevo.idInforme,
            });
            setDrawerOpen(true);
            form.resetFields();
            setPaciente(null); 
        }catch(err){
            if(err.validation){
                form.resetFields(
                   err.validation.map(({ field, message }) => ({
                    name: field,
                    errors: [message],
                    })) 
                );
            } else {
                message.error("Error al guardar la hoja frontal");
            }
        }finally{
            dispatchLoading({ type: "SET", key: "payload", value: false });
        }
    };

    return(
        <>
            <Card
                title={<Title level={2}>Hoja Frontal Diagnóstico</Title>}
                style={{ maxWidth: 800, margin: "24px auto" }}
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    {/* Datos del paciente (solo display) */}
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
                            <br />
                            <Text>
                                <b>Edad: </b>
                                {paciente.edadCumplida} años
                            </Text>
                            <br />
                            <Text>
                                <b>Sexo: </b>
                                {paciente.sexo === "F" ? "Femenino" : "Masculino"}
                            </Text>
                        </Card>
                    )}

                    {/* Datos del informe */}
                    <Divider orientation="left">Datos del informe</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                        <Form.Item
                            name="codigoClave"
                            label="Código clave"
                            rules={[{ required: true, message: "Ingresa el código" }]}
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
                        name="noHoja"
                        label="Número de hoja"
                        rules={[{ required: true, message: "Ingresa el número de hoja" }]}
                    >
                        <Input />
                    </Form.Item>
                    {/* Tabla de diagnósticos */}
                    <Divider orientation="left">Diagnósticos</Divider>
                    <Form.List
                        name="tabla"
                        rules={[
                            {
                                validator: async (_,lista)=>{
                                    if(!lista || lista.length < 1){
                                        return Promise.reject(
                                            new Error("Agrega al menos una fila")
                                        );
                                    }
                                },
                            },
                        ]}
                    >
                        {(fields, { add, remove }, {errors}) => (
                            <>
                                {fields.map((field) => (
                                    <Space
                                        key={field.key}
                                        align="baseline"
                                        style={{ display: "flex", marginBottom: 8 }}
                                    >
                                        <Form.Item
                                            {...field}
                                            name={[field.name, "fecha"]}
                                            fieldKey={[field.fieldKey, "fecha"]}
                                            rules={[{required: true, message: "Selecciona la fecha"}]}
                                        >
                                            <DatePicker />
                                        </Form.Item>
                                        <Form.Item
                                            {...field}
                                            name={[field.name, "diagnosticoNosologico"]}
                                            fieldKey={[field.fieldKey, "diagnosticoNosologico"]}
                                            rules={[{ required: true, message: "Ingresa diagnóstico" }]}
                                        >
                                            <TextArea style={{width: '300px'}} rows={1} placeholder="Diagnóstico nosológico" />
                                        </Form.Item>
                                        <Form.Item
                                            {...field}
                                            name={[field.name, "cedula"]}
                                            fieldKey={[field.fieldKey, "cedula"]}
                                            rules={[{required: true,message:"Selecciona un médico"}]}
                                        >
                                            <Select
                                                showSearch
                                                placeholder="Buscar médico..."
                                                loading={loading.usuario}
                                                optionFilterProp="children"
                                                style={{width: 240}}
                                                filterOption={(input, option) =>
                                                    option.children
                                                        .toLowerCase()
                                                        .includes(input.toLowerCase())
                                                }
                                            >
                                                {medicos.map((m)=>  (
                                                    <Select.Option key={m.cedula} value={m.cedula}>
                                                        {m.nombre} {m.apellidoPaterno} ({m.cedula})
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                        <Form.Item key="add-row">
                                        <Button
                                            type="link"
                                            icon= {<PlusOutlined rotate={45}/>}
                                            onClick={() => remove(field.name)}
                                        />
                                        </Form.Item>
                                    </Space>
                                ))}
                                <Form.Item>
                                    <Button
                                        type="dashed"
                                        onClick={() => add()}

                                        icon={<PlusOutlined />}
                                    >
                                        Agregar fila
                                    </Button>
                                    <Form.ErrorList errors={errors} />
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
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
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading.payload}
                            >
                                Guardar Hoja frontal
                            </Button>
                        </Space>
                    </Form.Item>

                </Form>

            </Card>
            <Drawer
                title= "Vista previa del informe"
                width="80vw"
                onClose={() => {
                    setDrawerOpen(false)

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