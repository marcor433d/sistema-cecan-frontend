/**
 * Página para registrar y generar el informe de Historia Clínica de un paciente.
 */
import React, {  useEffect, useState} from "react";
import { Typography, Form, Input,Button, DatePicker, message, Card, Divider, Spin, Row, Col, Select, Drawer, Space } from "antd";
import moment from "moment";
import { PlusOutlined, DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import { useAuth } from "../../../context/useAuth";
import { fetchCreateReports} from "../../../services/informesApi";
import { fetchPatientsByNumExp } from "../../../services/patientsApi";
import ReportsPdfViewer from "../../../components/ReportsPdfViewer";
import { useLoading } from "../../../hooks/useLoading";
import { fetchAllDiagnosticos } from "../../../services/enumsApi";
const { Title, Text} = Typography;
const { TextArea } = Input;

export default function HistoriaClinicaPage(){

  const [form] = Form.useForm();
  const { user } = useAuth();
  const [paciente, setPaciente] = useState(null);

  //Para el Drawer de previsualización
  const [drawerOpen,setDrawerOpen] = useState(false);
  const[currentReport, setCurrentReport] = useState(null);
  const [loading, dispatchLoading] = useLoading({ paciente: false, payload: false });

  const [diagnosticos, setDiagnosticos] = useState([]);

  /**
     * Maneja el blur en el input del expediente. Busca los datos del paciente asociado.
     * Si se encuentra, se actualiza el estado y precargan sus datos si existe.
     * @param {Event} e - Evento onBlur del input
     */
    const handleNumExpBlur = ({target: {value}}) => {
        if(!value) return;
        dispatchLoading({ type: "SET", key: "paciente", value: true });
        fetchPatientsByNumExp(value)
            .then(({data}) => {
                setPaciente(data);
                //Prefil de los campos del paciente en el formulario
                form.setFieldsValue({
                    fechaNacimiento: data.fechaNacimiento ? moment(data.fechaNacimiento) : null,
                    edadCumplida: data.edadCumplida,
                    sexo: data.sexo,
                    escolaridad: data.escolaridad,
                    ocupacion: data.ocupacion,
                    religion: data.religion,
                    estadoNacimiento: data.estadoNacimiento,
                    municipioNacimiento: data.municipioNacimiento,
                    estadoResidencia: data.estadoResidencia,
                    municipioResidencia: data.municipioResidencia,
                    diagnosticoSelect: data.diagnostico,
                });
            })
            .catch(() => {
                message.warning("No se pudo cargar el paciente");
            })
            .finally(() => {
              dispatchLoading({ type: "SET", key: "paciente", value: false });
            })
    };

  
  useEffect(() => {
    // Cargar diagnósticos al montar el componente
    dispatchLoading({ type: "SET", key: "payload", value: true });
    fetchAllDiagnosticos()
      .then(({ data }) => {
        setDiagnosticos(data);
      })
      .catch(() => {
        message.error("Error al cargar los diagnósticos");
      })
      .finally(() => {
        dispatchLoading({ type: "SET", key: "payload", value: false });
      });
  }, [dispatchLoading]);

  /**
   * Envía los datos del formulario para generar un nuevo informe de historia clínica.
   * Si el envío es exitoso, muestra el informe generado en un visor PDF (Drawer).
   * 
   * @param {Object} values - Valores capturados del formulario.
   */
  const onFinish = async (values) => {
    dispatchLoading({ type: "SET", key: "payload", value: true });
    try {
        const payload = {
            cabecera: {
                tipo: "HISTORIA_CLINICA",
                cedula: { cedula: user.cedula },
            },
            detalle: {
                numExpediente: values.numExpediente,
                fechaIdentificacion: values.fechaIdentificacion.format("YYYY-MM-DD"),
                // datos del paciente (se sincronizarán o actualizarán en backend)
                fechaNacimiento: values.fechaNacimiento.format("YYYY-MM-DD"),
                edadCumplida: values.edadCumplida,
                sexo: values.sexo,
                escolaridad: values.escolaridad,
                ocupacion: values.ocupacion,
                religion: values.religion,
                estadoNacimiento: values.estadoNacimiento,
                municipioNacimiento: values.municipioNacimiento,
                estadoResidencia: values.estadoResidencia,
                municipioResidencia: values.municipioResidencia,
                // datos clínicos
                antecedentesHeredofamiliares: values.antecedentesHeredofamiliares,
                antecedentesPersonalesNp: values.antecedentesPersonalesNp,
                antecedentesPersonalesP: values.antecedentesPersonalesP,
                padecimientoActual: values.padecimientoActual,
                exploracionFisica: values.exploracionFisica,
                diagnosticoTratamiento: values.diagnosticoTratamiento,
            },
        };  
        const resp = await fetchCreateReports(payload);
        const nuevoInforme = resp.data;
        message.success("Historia clinica guardada correctamente");

        //abrimos el drawer para previsualizar
        setCurrentReport({
          tipo: "HISTORIA_CLINICA",
          idInforme: nuevoInforme.idInforme,
        });
        setDrawerOpen(true);
        form.resetFields();
        setPaciente(null);
    }catch(err){
        form.setFields(
          err.validation.map(({field, message}) => ({
            name: field,
            errors:[message],
          }))
        );
    } finally{
        dispatchLoading({ type: "SET", key: "payload", value: false });
    }
  };

  return (
  <>
    <Card
      title={<Title level={2}>Registro de Historia Clínica</Title>}
      style={{ maxWidth: 800, margin: '24px auto' }}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {/* ---- Datos del paciente ---- */}
        <Divider orientation="left">Datos del paciente</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="numExpediente"
              label="Número de expediente"
              rules={[{ required: true, message: 'Ingresa el expediente' }]}
            >
              <Input placeholder="24-243…" onBlur={handleNumExpBlur} />
            </Form.Item>
            {paciente && (
              <Text type="secondary">
                Paciente: {paciente.nombre} {paciente.apellidoPaterno}{' '}
                {paciente.apellidoMaterno}
              </Text>
            )}
          </Col>
          <Col span={12}>
            <Form.Item
              name="fechaIdentificacion"
              label="Fecha de identificación"
              rules={[{ required: true, message: 'Selecciona la fecha' }]}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="fechaNacimiento"
              label="Fecha de nacimiento"
              rules={[{ required: true, message: 'Selecciona la fecha' }]}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item
              name="edadCumplida"
              label="Edad"
              rules={[{ required: true, message: 'Ingresa la edad' }]}
            >
              <Input type="number" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="sexo"
              label="Sexo"
              rules={[{ required: true, message: 'Selecciona el sexo' }]}
            >
              <Select placeholder="Selecciona">
                <Select.Option value="F">Femenino</Select.Option>
                <Select.Option value="M">Masculino</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="escolaridad"
              label="Escolaridad"
              rules={[{ required: true, message: 'Ingresa la escolaridad' }]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="ocupacion"
              label="Ocupación"
              rules={[{ required: true, message: 'Ingresa la ocupación' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="religion"
              label="Religión"
              rules={[{ required: true, message: 'Ingresa la religión' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="estadoNacimiento" label="Estado de nacimiento" rules={[{ required: true, message: 'Ingresa el estado de nacimiento' }]} >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="municipioNacimiento"
              label="Municipio de nacimiento"
              rules={[{ required: true, message: 'Ingresa el muninipio de nacimiento' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="estadoResidencia" label="Estado de residencia" rules={[{ required: true, message: 'Ingresa el estado de residencia del paciente' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="municipioResidencia"
              label="Municipio de residencia"
              rules={[{ required: true, message: 'Ingresa el municipio de residencia del paciente' }]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        {/* ---- Antecedentes ---- */}
        <Divider orientation="left">Antecedentes</Divider>
        <Form.Item
          name="antecedentesHeredofamiliares"
          label="Antecedentes heredofamiliares"
        >
          <TextArea rows={8} />
        </Form.Item>
        <Form.Item
          name="antecedentesPersonalesNp"
          label="Antecedentes personales NO patológicos"
        >
          <TextArea rows={8} />
        </Form.Item>
        <Form.Item
          name="antecedentesPersonalesP"
          label="Antecedentes personales patológicos"
        >
          <TextArea rows={8} />
        </Form.Item>

        {/* ---- Examen y Plan ---- */}
        <Divider orientation="left">Examen y Plan</Divider>
        <Form.Item name="padecimientoActual" label="Padecimiento actual">
          <TextArea rows={8} />
        </Form.Item>
        <Form.Item name="exploracionFisica" label="Exploración física">
          <TextArea rows={8} />
        </Form.Item>
        <Form.Item
          label="Diagnóstico y tratamiento"
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Form.Item name="diagnosticoSelect" noStyle>
              <Select
                placeholder="Selecciona un diagnóstico"
                loading={diagnosticos.length === 0}
                optionFilterProp="children"
                style={{ width: '100%' }}
                onChange={(val) => {
                  const tratamiento = form.getFieldValue("tratamientoTexto") || "";
                  const combinado = `${val}\n\n${tratamiento}`;
                  form.setFieldsValue({ diagnosticoTratamiento: combinado });
                }}
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
        <Form.Item name="tratamientoTexto" noStyle>
          <TextArea
            rows={6}
            placeholder="Escribe el tratamiento..."
            onChange={(e) => {
              const diagnostico = form.getFieldValue("diagnosticoSelect") || "";
              const combinado = `${diagnostico}\n\n${e.target.value}`;
              form.setFieldsValue({ diagnosticoTratamiento: combinado });
            }}
          />
        </Form.Item>
        {/* Campo oculto que guarda el texto final combinado */}
        <Form.Item name="diagnosticoTratamiento" hidden>
          <Input />
        </Form.Item>
          </Space>
        </Form.Item>

        <Form.Item style={{ textAlign: 'right' }}>
          <Space>
            <Button
              icon={<EyeOutlined/>}
              onClick={() => {
                if(currentReport){
                  setDrawerOpen(true);
                } else {
                  message.info("Guarda primero para previsualizar.");
                }
              }}
            >
              Previsualizar
            </Button>
          
            <Button type="primary" htmlType="submit" loading={loading.paciente}>
              Guardar Historia Clínica
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>

    {/**Drawer de previsualización */}
    <Drawer
      title="Vista previa del informe"
      width="80vw"
      onClose={() => {setDrawerOpen(false)}}
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