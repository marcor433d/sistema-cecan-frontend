/**
 * Página para registrar un informe de subrogados.
 */
import React, { useEffect, useState } from 'react';
import { Typography, Form, Input, Button, DatePicker, message, Card, Divider, Row, Col, Drawer, Space, Select, } from 'antd';
import moment from 'moment';
import { EyeOutlined } from '@ant-design/icons';
import { useAuth } from "../../../context/useAuth";
import { fetchPatientsByNumExp } from "../../../services/patientsApi";
import { fetchUsers } from "../../../services/userApi";
import { fetchCreateReports } from "../../../services/informesApi";
import { useLoading } from "../../../hooks/useLoading";
import ReportsPdfViewer from "../../../components/ReportsPdfViewer";
import { fetchAllDiagnosticos } from '../../../services/enumsApi';

const { Title, Text } = Typography;
const { Option } = Select;

export default function SubrogadosPage() {
    const [form] = Form.useForm();
    const { user } = useAuth();
    const [paciente, setPaciente] = useState(null);
    const [medicos, setMedicos] = useState([]);
    const [loading, dispatchLoading] = useLoading({
        paciente: false,
        medicos: false,
        payload: false,
        diagnosticos: false,
    });
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentReport, setCurrentReport] = useState(null);

    const [diagnosticos, setDiagnosticos] = useState([]);

    /**
     * useEffect que se ejecuta la montar el componente para cargar la lista de médicos
    * */
    useEffect(() => {
    dispatchLoading({ type: "SET", key: "medicos", value: true });
    dispatchLoading({ type: "SET", key: "diagnosticos", value: true });
    fetchUsers()
      .then(({ data }) => setMedicos(data.filter((u) => u.rol === "MEDICO")))
      .catch(() => message.warning("No se pudo cargar la lista de médicos"))
      .finally(() =>
        dispatchLoading({ type: "SET", key: "medicos", value: false })
      );
    fetchAllDiagnosticos()
      .then(({ data }) => setDiagnosticos(data))
      .catch(() => message.warning("No se pudo cargar la lista de diagnósticos"))
      .finally(() =>
        dispatchLoading({ type: "SET", key: "diagnosticos", value: false })
      );
  }, [dispatchLoading]);

  /**
     * Carga la información del paciente cuando se ingresa su número de expediente.
     * 
     * @param {Object} e - Evento del input.
     */
  const handleNumExpBlur = ({ target: { value } }) => {
    if (!value) return;
    dispatchLoading({ type: "SET", key: "paciente", value: true });
    fetchPatientsByNumExp(value)
      .then(({ data }) => {
        setPaciente(data);
        form.setFieldsValue({
            diagnosticoPresuncion: data?.diagnostico || '' 
        });

      })
      .catch(() => {
        message.warning("Paciente no encontrado");
        setPaciente(null);
      })
      .finally(() =>
        dispatchLoading({ type: "SET", key: "paciente", value: false })
      );
  };

  /**
     * Envia los datos del formulario a la API para generar el informe.
     * Abre el visor PDF en caso de éxito.
     * 
     * @param {Object} values - Datos del formulario.
     */
  const onFinish = async (values) => {
    dispatchLoading({ type: "SET", key: "payload", value: true });
    try{
        const detalle = {
            numExpediente: values.numExpediente,
            fecha: values.fecha.format("YYYY-MM-DD"),
            material: values.materialSolicitado,
            diagnosticoPresuncion: values.diagnosticoPresuncion,
            cedula: values.medicoSolicitante,
        };
        const payload = {
            cabecera: {
                tipo: "SUBROGADOS",
                cedula: {cedula: user.cedula },
            },
            detalle,
        };
        console.log("Payload a enviar: ", payload);
        const resp = await fetchCreateReports(payload);
        setCurrentReport({
            tipo: "SUBROGADOS",
            idInforme: resp.data.idInforme,
        });
        setDrawerOpen(true);
        form.resetFields();
        setPaciente(null);
    }catch(err){
        if(err.validation){
            form.setFields(
                err.validation.map((e) => ({
                    name: e.field,
                    errors: [e.message],
                }))
            );
        }else {
            message.error("Error al crear el informe");
            console.error(err);
        }
    }finally {
        dispatchLoading({ type: "SET", key: "payload", value: false });
    }
  };

  return (
    <>
        <Card
            title={<Title level={2}>Informe Subrogados</Title>}
            style={{ maxWidth: 800, margin: "24px auto" }}
        >
            <Form form={form} layout='vertical' onFinish={onFinish}>
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
                            <b>Nombre:</b> {paciente.nombre}{" "}
                            {paciente.apellidoPaterno} {paciente.apellidoMaterno}
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
                    </Card>
                )}

                <Divider>Solicitud de material</Divider>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name="fecha"
                            label="Fecha"
                            rules={[{required: true, message: "Ingresa la fecha"}]}
                        >
                            <DatePicker style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>
                    <Col span={16}>
                        <Form.Item
                            name="materialSolicitado"
                            label="Material que solicita"
                            rules={[{ required: true, message: "Ingresa el material" }]}
                        >
                            <Input placeholder="Especifica el material" />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item
                    name="diagnosticoPresuncion"
                    label="Diagnóstico de presunción"
                    rules={[{ required: true, message: "Ingresa el diagnóstico de presunción"}]}
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
                    name="medicoSolicitante"
                    label="Médico solicitante"
                    rules={[{ required: true, message: "Ingresa el médico solicitante"}]}
                >
                    <Select
                        showSearch
                        placeholder="Selecciona médico..."
                        loading={loading.medicos}
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                        (option?.children?.toString() || "").toLowerCase().includes(input.toLowerCase())
                        }
                    >
                        {medicos.map((m) => (
                            <Option key={m.cedula} value={m.cedula}>
                            {`${m.nombre} ${m.apellidoPaterno} ${m.apellidoMaterno || ""} (${m.cedula})`}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item style={{ textAlign: "right" }}>
                    <Space>
                        <Button
                            icon={<EyeOutlined />}
                            onClick={() =>
                            currentReport
                                ? setDrawerOpen(true)
                                : message.info("Guarda primero para previsualizar")
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
            title="Vista previa Informe Subrogados"
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