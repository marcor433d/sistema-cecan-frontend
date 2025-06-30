import React, { useState, useEffect } from "react";
import { Typography, Form, Input, Button, DatePicker, TimePicker, InputNumber, message, Card, Divider, Row, Col, Drawer, Space, Select, Modal, Checkbox } from "antd";
import moment from "moment";
import { EyeOutlined } from "@ant-design/icons";
import { useAuth } from "../../../context/useAuth";
import { fetchPatientsByNumExp } from "../../../services/patientsApi";
import { fetchCreateReports} from "../../../services/informesApi";
import { fetchUsers } from "../../../services/userApi";
import { useLoading } from "../../../hooks/useLoading";
import ReportsPdfViewer from "../../../components/ReportsPdfViewer";

const { Title, Text } = Typography;
const { Option } = Select;
const PRODUCT_OPTIONS = [
  "PAQUETE GLOBULAR",
  "PAQUETE GLOBULAR DESLEUCOCITADO",
  "PAQUETE GLOBULAR LAVADO",
  "SANGRE TOTAL",
  "PLASMA FRESCO PLAQUETARIO",
  "CONCENTRADO PLAQUETARIO",
  "CRIOPRECIPITADO",
  "OTRO",
];

export default function SolicitudTransfusion() {

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

    // cargar lista de médicos
    useEffect(() => {
        dispatchLoading({ type: "SET", key: "medicos", value: true });
        fetchUsers()
        .then(({ data }) =>
            setMedicos(data.filter((u) => u.rol === "MEDICO"))
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
                //prerellenar grupo sanguíneo si ya existe
                form.setFieldsValue({grupoSanguineo: data.grupoSanguineo || undefined});
            })
            .catch(() => {
                message.warning("No se pudo cargar el paciente");
                setPaciente(null);
            })
            .finally(() =>
                dispatchLoading({ type: "SET", key: "paciente", value: false })
            );
     };

     
     const handleProductChange = (values) => {
        if(values.length > 5) {
            message.warning("Sólo puedes seleccionar hasta 5 productos");
            return;
        }
        form.setFieldsValue({productoSolicitado: values});
     };

     const onFinish = async (values) => {
        dispatchLoading({ type: "SET", key: "payload", value: true });
        try{
            const productosArray = values.productoSolicitado || [];
            const productosString = productosArray.join(", "); 
            const detalle = {
                numExpediente: values.numExpediente,
                cedula: values.medicoSolicitante,
                grupoSanguineo: values.grupoSanguineo,
                caracterSolicitud: values.caracterSolicitud,
                rh: values.rh,
                ho: values.ho,
                hto: values.hto,
                cama: values.cama,
                transPrevias: values.transfusionesPrevias,
                cuantasTrans: values.transfusionesPrevias ? values.cuantasTrans : null,
                fechaUltimaTrans:
                    values.transfusionesPrevias && values.fechaUltimaTrans
                    ? values.fechaUltimaTrans.format("YYYY-MM-DD")
                    : null,
                tipo: values.tipo,
                reaccionesTrans: values.reaccionesTransfusiones,
                enfHemoliticaRn: values.enfHemoliticaRN,
                recibeMedicamento:  values.recibeMedicamento,
                noEmbarazos: values.noEmbarazos,
                productoSolicitado: productosString,
                fechaTrans: values.fechaTransfusion.format("YYYY-MM-DD"),
                horaTrans: values.horaTransfusion.format("HH:mm"),
                volumen: values.volumen,
                servicioSolicitado:  values.servicioSolicitado,
                motivoTrans: values.motivoTransfusion,
                fechaSolicitud: values.fechaSolicitud.format("YYYY-MM-DD"),
                horaSolicitud: values.horaSolicitud.format("HH:mm"),
            };

            const payload = {
                cabecera: {
                    tipo: "SOLICITUD_TRANSFUSION",
                    cedula: { cedula: user.cedula },
                },
                detalle,
            };
             // <-- Aquí el console.log para ver la estructura en la consola
            console.log("Payload a enviar:", JSON.stringify(payload, null, 2));
            const resp = await fetchCreateReports(payload);

            message.success("Solicitud de transfusión creada correctamente");
            setCurrentReport({
                tipo: "SOLICITUD_TRANSFUSION",
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
            }else{
                message.error("Error al crear la solicitud de transfusión");
            }
        }finally {
            dispatchLoading({ type: "SET", key: "payload", value: false });
        }
     };

     return(
        <>
            <Card title={<Title level={2}>Solicitud de Transfusión</Title>} style={{ maxWidth: 900, margin: "24px auto" }}>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    {/* Datos del paciente */}
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
                            <Text><b>Nombre:</b> {paciente.nombre} {paciente.apellidoPaterno} {paciente.apellidoMaterno}</Text><br/>
                            <Text><b>Fecha de nacimiento:</b> {moment(paciente.fechaNacimiento).format("YYYY-MM-DD")}</Text><br/>
                            <Text><b>Sexo:</b> {paciente.sexo === "F" ? "Femenino" : "Masculino"}</Text><br/>
                            <Text><b>Edad:</b> {paciente.edadCumplida} años</Text><br/>
                            <Form.Item
                                name="grupoSanguineo"
                                label="Grupo sanguíneo"
                                rules={[{ required: true, message: "El grupo sanguíneo es obligatorio" }]}
                            >
                                <Input placeholder="Ej: A+, O–, B+, ..." />
                            </Form.Item>
                            <Text><b>Diagnóstico:</b> {paciente.diagnostico || "—"}</Text>
                        </Card>
                     )}
                     {/* Detalles de la solicitud */}
                    <Divider>Detalles de la solicitud</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="caracterSolicitud"
                                label="Carácter de la solicitud"
                                rules={[{ required: true }]}
                            >
                                <Select placeholder="Selecciona...">
                                    <Option value="ORDINARIO">Ordinario</Option>
                                    <Option value="URGENTE">Urgente</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={4}>
                            <Form.Item name="rh" label="RH" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={4}>
                            <Form.Item name="ho" label="Ho" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={4}>
                            <Form.Item name="hto" label="Hto" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item name="cama" label="Cama" rules={[{ required: true }]}>
                              <Input />
                          </Form.Item>
                       </Col>
                        <Col span={4}>
                              <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
                                  <Input />
                              </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name="transfusionesPrevias"
                                label="Transfusiones previas"
                                rules={[{ required: true }]}
                            >
                                <Select placeholder="Selecciona...">
                                <Select.Option value={true}>Sí</Select.Option>
                                <Select.Option value={false}>No</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        {form.getFieldValue("transfusionesPrevias") === true && (
                        <>
                            <Col span={8}>
                                <Form.Item
                                    name="cuantasTrans"
                                    label="¿Cuántas?"
                                    rules={[{ required: true }]}
                                >
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name="fechaUltimaTransfusion"
                                    label="Fecha última transfusión"
                                    rules={[{ required: true }]}
                                >
                                    <DatePicker style={{ width: "100%" }} />
                                </Form.Item>
                            </Col>
                        </>
                        )}
                    </Row>
                     <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name="reaccionesTransfusiones"
                                label="Reacciones transfusiones"
                                rules={[{ required: true }]}
                            >
                                <Select placeholder="Selecciona...">
                                <Select.Option value={true}>Sí</Select.Option>
                                <Select.Option value={false}>No</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="enfHemoliticaRN"
                                label="Enf. hemolítica RN"
                                rules={[{ required: true }]}
                            >
                                <Select placeholder="Selecciona...">
                                <Select.Option value={true}>Sí</Select.Option>
                                <Select.Option value={false}>No</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="recibeMedicamento"
                                label="Recibe medicamento"
                                rules={[{ required: true }]}
                            >
                                <Select placeholder="Selecciona...">
                                <Select.Option value={true}>Sí</Select.Option>
                                <Select.Option value={false}>No</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="noEmbarazos"
                                label="No. Embarazos"
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item
                        name="productoSolicitado"
                        label="Producto solicitado (máx. 5)"
                        rules={[{ required: true, message: "Selecciona al menos un producto" }]}
                    >
                        <Select
                            mode="multiple"
                            placeholder="Selecciona hasta 5..."
                            onChange={handleProductChange}
                            value={form.getFieldValue("productoSolicitado") || []}
                        >
                            {PRODUCT_OPTIONS.map((p) => (
                                <Option key={p} value={p}>{p}</Option>
                            ))}
                        </Select> 
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name="fechaTransfusion"
                                label="Fecha transfusión"
                                rules={[{ required: true }]}
                            >
                                <DatePicker style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                         <Col span={8}>
                            <Form.Item
                                name="horaTransfusion"
                                label="Hora transfusión"
                                rules={[{ required: true }]}
                            >
                                <TimePicker style={{ width: "100%" }} format="HH:mm" />
                            </Form.Item>
                         </Col>
                         <Col span={8}>
                            <Form.Item name="volumen" label="Volumen" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                         </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="servicioSolicitado"
                                label="Servicio"
                                rules={[{ required: true }]}
                            >
                                <Input/>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="medicoSolicitante"
                                label="Médico solicitante"
                                rules={[{ required: true }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Buscar médico..."
                                    loading={loading.medicos}
                                    optionFilterProp="children"
                                    filterOption={(inp, opt) =>
                                        opt.children.toLowerCase().includes(inp.toLowerCase())
                                    }
                                >
                                    {medicos.map(m => (
                                        <Option key={m.cedula} value={m.cedula}>
                                        {m.nombre} {m.apellidoPaterno} ({m.cedula})
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item
                        name="motivoTransfusion"
                        label="Motivo de la transfusión"
                        rules={[{ required: true }]}
                    >
                        <Input.TextArea rows={2} />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="fechaSolicitud"
                                label="Fecha de solicitud"
                                rules={[{ required: true }]}
                            >
                                <DatePicker style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                             <Form.Item
                                name="horaSolicitud"
                                label="Hora de solicitud"
                                rules={[{ required: true }]}
                            >
                                <TimePicker style={{ width: "100%" }} format="HH:mm" />
                            </Form.Item>
                        </Col>
                    </Row>

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
                            Guardar Solicitud
                        </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>

            <Drawer
                title="Vista previa Solicitud de Transfusión"
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