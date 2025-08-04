/**
 * Página para crear una solicitud de estudio ultrasonográfico.
 */
import React, { useState, useEffect } from "react";
import { Typography, Form, Input, Button, DatePicker, message, Card, Divider, Row, Col, Drawer, Space, Select} from "antd";
import moment from "moment";
import { EyeOutlined } from "@ant-design/icons";
import { useAuth } from "../../../context/useAuth";
import { fetchPatientsByNumExp } from "../../../services/patientsApi";
import { fetchCreateReports } from "../../../services/informesApi";
import { fetchUsers } from "../../../services/userApi";
import { useLoading } from "../../../hooks/useLoading";
import ReportsPdfViewer from "../../../components/ReportsPdfViewer";
import { fetchAllDiagnosticos } from "../../../services/enumsApi";

const { Title, Text} = Typography;
const { TextArea} = Input;
const rolesPermitidos = ["MEDICO", "NUTRICION", "PSICOLOGIA", "ENFERMERIA"];

export default function SolicitudUltrasonograficoPage(){
    const [form] = Form.useForm();
    const { user } = useAuth();
    const [paciente, setPaciente] = useState(null);
    const [medicos, setMedicos] = useState([]);
    const [loading, dispatchLoading] = useLoading({
        paciente: false,
        payload: false,
        medicos: false,
        diagnosticos: false,
    });
    const [diagnosticos, setDiagnosticos] = useState([]);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentReport, setCurrentReport] = useState(null);

    /**
 * useEffect que se ejecuta al montar el componente.
 * Enfoca automáticamente el input del número de expediente.
 */
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
    dispatchLoading({ type: "SET", key: "diagnosticos", value: true });  
    fetchAllDiagnosticos()
      .then(({data}) => setDiagnosticos(data))
      .catch(() => message.warning("No se pudo cargar la lista de diagnósticos"))
      .finally(() =>
            dispatchLoading({ type: "SET", key: "diagnosticos", value: false })
        );

  }, [dispatchLoading]);

   /**
     * Carga la información del usuario de acuerdo al tipo de rango.
     * 
     * @param {Object} e - Evento del input.
     */
  const handleNumExpBlur = ({ target: { value } }) => {
    if (!value) return;
    dispatchLoading({ type: "SET", key: "paciente", value: true });
    fetchPatientsByNumExp(value)
      .then(({ data }) => {
        setPaciente(data);
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

  /**
     * Envia el formulario a la API para crear la solicitud ultrasonográfica.
     * Muestra notificaciones y genera visor PDF.
     * 
     * @param {Object} values - Valores del formulario.
     */
  const onFinish = async (values) => {
    dispatchLoading({ type: "SET", key: "payload", value: true });
        try{
            const payload = {
            cabecera: {
            tipo: "SOLICITUDULTRASONOGRAFICO",
            cedula: { cedula: user.cedula },
            },
            detalle: {
            numExpediente: values.numExpediente,
            curp: paciente.curp,
            fecha: values.fecha.format("YYYY-MM-DD"),
            ubicacion: values.ubicacionCuarto,
            areaEstudio: values.areaEstudio,
            datosClinicos: values.datosClinicos,
            diagnostico: values.diagnostico,
            reporteUltrasonografico: values.reporteUltrasonografico,
            cedula: values.cedula, // aquí la cédula del médico solicitante
            },
        };
        const resp = await fetchCreateReports(payload);
        const nuevo = resp.data;
        message.success("Solicitud de ultrasonográfico creada correctamente");
        setCurrentReport({
            tipo: "SOLICITUDULTRASONOGRAFICO",
            idInforme: nuevo.idInforme,
        });
        setDrawerOpen(true);
        form.resetFields();
        setPaciente(null);
        }catch (err){
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
        }finally{
            dispatchLoading({ type: "SET", key: "payload", value: false });
        }
    };

    return(
        <>
            <Card
                title={<Title level={2}>Solicitud de Ultrasonográfico</Title>}
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
                                {paciente.nombre} {paciente.apellidoPaterno}{" "} {paciente.apellidoMaterno}
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
                             <br />
                            <Text>
                               <b>CURP: </b>
                                 {paciente.curp}
                            </Text>
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
                                rules={[
                                { required: true, message: "Selecciona un médico" },
                                ]}
                            >
                              <Select
                                showSearch
                                placeholder="Buscar médico..."
                                loading={loading.usuario}
                                optionFilterProp="children"
                                style={{ width: "100%" }}
                                filterOption={(input, option) =>
                                    (option?.children?.toString() || "").toLowerCase().includes(input.toLowerCase())
                                }
                                >
                                    {medicos.map((m) => (
                                        <Select.Option key={m.cedula} value={m.cedula}>
                                        {`${m.nombre} ${m.apellidoPaterno} ${m.apellidoMaterno || ""} (${m.cedula})`}
                                        </Select.Option>
                                    ))}
                                </Select>  
                            </Form.Item>
                         </Col>
                    </Row>
                    <Row gutter={16}>
                         <Col span={12}>
                            <Form.Item
                                name="ubicacionCuarto"
                                label="Ubicación / Cuarto"
                                rules={[
                                {
                                    required: true,
                                    message: "Ingresa la ubicación o cuarto",
                                },
                                ]}
                            >
                                <Input />
                            </Form.Item>
                         </Col>
                         <Col span={12}>
                            <Form.Item
                                name="areaEstudio"
                                label="Área de estudio"
                                rules={[
                                { required: true, message: "Ingresa el área de estudio" },
                                ]}
                            >
                                <Input />
                            </Form.Item>
                         </Col>
                    </Row>

                    <Form.Item
                        name="datosClinicos"
                        label="Datos clínicos"
                        rules={[{ required: true, message: "Ingresa los datos clínicos" }]}
                    >
                        <TextArea rows={4} />
                    </Form.Item>

                    <Form.Item
                        name="diagnostico"
                        label="Diagnóstico presuntivo"
                        rules={[{ required: true, message: "Ingresa el diagnóstico" }]}
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
                        name="reporteUltrasonografico"
                        label="Reporte ultrasonográfico"
                        rules={[
                        {
                            required: true,
                            message: "Ingresa el reporte ultrasonográfico",
                        },
                        ]}
                    >
                        <TextArea rows={12} />
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
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading.payload}
                            >
                                Guardar Solicitud
                            </Button>
                        </Space>
                    </Form.Item>
                 </Form>
            </Card>

            <Drawer
                title="Vista previa de Solicitud"
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

