/**
 * Página que muestra una tabla con la lista de pacientes.
 * Permite buscar pacientes por nombre o número de expediente.
 * Al hacer clic en un paciente, redirige a su vista detallada.
 */
import React, { useEffect, useState } from "react";
import { Table, Input, Alert, Space, Typography, Divider, Form, Select, DatePicker, Button, Row, Col, InputNumber, Drawer, Collapse, Tag, message} from "antd";

import { useNavigate } from "react-router-dom";
import { fetchPatients,fetchSearchPatientsAdvanced } from "../../../services/patientsApi";
import { fetchAllDiagnosticos } from "../../../services/enumsApi";
const { Search } = Input;
const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Panel } = Collapse;


export default function PatientsPage(){
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [form] = Form.useForm();
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [resultadosCount, setResultadosCount] = useState(0);
    const [diagnosticos, setDiagnosticos] = useState([]);
    /** Hook de React Router para redireccionar entre rutas */
    const navigate = useNavigate();

    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [totalPacientes, setTotalPacientes] = useState(0);

    /**
     * Hook que se ejecuta una vez al montar el componente.
     * Llama a la función que carga todos los pacientes.
     */
    useEffect(() => {
        loadPage(0);
        fetchAllDiagnosticos()
        .then(res => setDiagnosticos(res.data))
        .catch(() => message.error('No puede cargar diagnósticos'));
    }, []);

    /**
     * Carga todos los pacientes desde el backend.
     * Maneja estados de carga y errores.
     */
    const loadPage = async (newPage = 0) => {
        setError(null);
        setLoading(true);

        try{
            const{data} = await fetchPatients(newPage, size);
            setPacientes(data.content);
            setTotalPacientes(data.totalElements);
            setPage(newPage);
        }catch(e) {
            setError(e);
        } finally {
            setLoading(false);
        }
    };

    const loadAll = () => {
        form.resetFields();
        setResultadosCount(0);
        loadPage(0);
        setDrawerVisible(false);
    };

    

    /** Envío de formulario de búsqueda avanzada */
    const onAdvancedSearch = async (values = {}, term = "") => {
        setError(null);
        setLoading(true);
        try{
            const payload = {
                ...values,
                edadMin: values.edadMinima || null,
                edadMax: values.edadMaxima || null,
                fechaIngresoInicio: values.fechaIngreso?.[0]?.format('YYYY-MM-DD') || null,
                fechaIngresoFin: values.fechaIngreso?.[1]?.format('YYYY-MM-DD') || null,
                fechaInicioTratamiento: values.fechaTratamiento?.[0]?.format("YYYY-MM-DD") || null,
                fechaFinTratamiento: values.fechaTratamiento?.[1]?.format("YYYY-MM-DD") || null,
                terminoParcial: term || values.terminoParcial || null,
            };
            const { data } = await fetchSearchPatientsAdvanced(payload);
            setPacientes(data);
            setResultadosCount(data.length);
             setTotalPacientes(data.length);
             setPage(0);
        }catch(e){
            setError(e);
        }finally{
            setLoading(false);
        }
    };
    /**
     * Columnas de la tabla de pacientes.
     */
     const columns = [
        { title: "No. Expediente", dataIndex: "numExpediente", key: "numExpediente" },
        { title: "Nombre", dataIndex: "nombre", key: "nombre" },
        { title: "Ap. Paterno", dataIndex: "apellidoPaterno", key: "apellitoPaterno" },
        { title: "Ap. Materno", dataIndex: "apellidoMaterno", key: "apellitoMaterno" },
        { title: "Edad", dataIndex: "edadCumplida", key: "edadCumplida" },
        { title: "Género", dataIndex: "sexo", key: "sexo" },
        { title: "Edo. civil", dataIndex: "estadoCivil", key: "estadoCivil" },
        {
            title: "Estado Tratamiento",
            dataIndex: "estadoTratamientos",
            key: "estadoTratamientos",
            render: (_, record) => {
                 console.log("Record:", record); // Asegúrate que `estadoTratamientos` y `tratamientos` existen
                const estadoActual = record.estadoTratamientos?.at(-1);
                return estadoActual?.tipo || '-';
            },
        },
        {
            title: "Ultimo Tratamiento",
            dataIndex: "tratamientos",
            key: "tratamientos",
            render: (_,record) => {
                const ultimoTratamiento = record.tratamientos?.at(-1);
                return ultimoTratamiento?.tipo || '-';
            },
        },
        { title: "Fecha de ingreso", dataIndex: "fechaIngreso", key: "fechaIngreso"},
    ];

    return(
        <Space direction="vertical" style={{ width: "100%" }}>
            <Title level={2}>Pacientes</Title>

            <Divider/>
            <Space style={{justifyContent: "space-between", width: "100%" }}>
                <Search
                    placeholder="Buscar un paciente por nombre o expediente"
                    allowClear
                    enterButton="Buscar"
                    size="middle"
                    onSearch={(term) => onAdvancedSearch({}, term)}
                    style={{maxWidth: 400}}
                />
                <Button type="primary" onClick={() => setDrawerVisible(true)}>
                    Filtrar
                </Button>
            </Space>

            {error && (
                <Alert
                    type="error"
                    message="Error al cargar pacientes"
                    description={error.message}
                    showIcon
                    style={{ marginTop: 16 }} 
                />
            )}
            <Drawer
                title="Filtrar Pacientes"
                placement="right"
                width={420}
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                footer={
                    <div style={{ textAlign: 'right' }}>
                        <Button onClick={()=>{
                            form.resetFields();
                            loadAll();
                            setResultadosCount(0);
                        }} style={{ marginRight: 8 }}>
                            Limpiar
                        </Button>
                        <Button type="primary" onClick={() => {
                            form.submit();
                        }}>Aplicar</Button>
                    </div>
                    }
            >
                <Form
                    form={form}
                layout="vertical"
                onFinish={(values) => onAdvancedSearch(values)}
                >
                    <Collapse>
                        <Panel header="Datos personales" key="1">
                            <Form.Item name="sexo" label= "Género">
                                <Select allowClear placeholder="Selecciona un género">
                                    <Option value="M">Masculino</Option>
                                    <Option value="F">Femenino</Option>
                                    <Option value="O">Otro</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item name="estadoCivil" label="Estado civil">
                                <Select allowClear placeholder="Selecciona un estado civil">
                                    <Option value="SOLTERO">Soltero(a)</Option>
                                    <Option value="CASADO">Casado(a)</Option>
                                    <Option value="VIUDO">Viudo(a)</Option>
                                    <Option value="DIVORCIADO">Divorciado(a)</Option>
                                </Select>
                            </Form.Item>
                        </Panel>
                        <Panel header="Diagnóstico" key="3">
                            <Form.Item name="diagnostico" label="Diagnóstico">
                                <Select
                                    showSearch
                                    placeholder="Selecciona un diagnóstico"
                                    loading={diagnosticos.length === 0}
                                    optionFilterProp="children"
                                    filterOption={(input, option) =>
                                        option.children.toLowerCase().includes(input.toLowerCase())
                                    }
                                >
                                    {diagnosticos.map(d => (
                                        <Option key={d} value={d}>
                                            {d}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Panel>
                    <Panel header="Edad" key="4">
                        <Form.Item name="edadMinima" label="Edad mínima">
                            <InputNumber min={0} placeholder="Edad mínima" style={{ width: "100%" }} />
                        </Form.Item>
                            <Form.Item name="edadMaxima" label="Edad maxima" rules={[
                                ({getFieldValue}) => ({
                                    validator(_,value) {
                                        const min = getFieldValue('edadMinima');
                                        if (value === undefined || value === null || value >= min) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error("La edad máxima debe ser mayor o igual a la edad mínima"));
                                    },
                                }),
                            ]}>
                                <InputNumber min={0} placeholder="Edad maxima" style={{ width: "100%" }} />
                        </Form.Item>
                    </Panel>
                    <Panel header="Ingreso" key="5">
                        <Form.Item name="fechaIngreso" label="Rango fecha de ingreso">
                            <RangePicker format="YYYY-MM-DD" style={{width: "100%"}}/>
                        </Form.Item>
                    </Panel>
                    <Panel header="Tratamiento" key="6">
                        
                        <Form.Item name="tipoTratamiento" label="Tipo tratamiento">
                            <Select allowClear placeholder="Ej. Quimioterapia, Cirugía...">
                                <Option value= "QT">Quimioterapia</Option>
                                <Option value= "RT">Radioterapia</Option>
                                <Option value= "CX">Cirugía</Option>
                                <Option value= "CX + RT">Cirugía + Radioterapia</Option>
                                <Option value= "CX + QT">Cirugía + Quimioterapia</Option>
                                <Option value= "RT + QT">Radioterapia + Quimioterapia</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="fechaTratamiento" label="Rango de fecha de tratamiento">
                            <RangePicker format="YYYY-MM-DD" style={{width: "100%"}}/>
                        </Form.Item>
                    </Panel>
                    </Collapse>
                </Form>
            </Drawer>
            { resultadosCount > 0 && (
                <Tag color="blue" style={{fontSize: 16, marginBottom: 10}}>
                    RESULTADOS: {resultadosCount}
                </Tag>
            )}
            <Table
                style={{marginTop: 16}}
                dataSource={pacientes}
                columns={columns}
                rowKey="numExpediente"
                loading={loading}
                pagination={{
                    current: page+1,
                    total: totalPacientes,
                    pageSize: size,
                    onChange: (newPage) => loadPage(newPage - 1),
                    showSizeChanger:false
                }}
                bordered
                size="middle"
                onRow={(record) => ({
                    onClick: () => navigate(`/pacientes/${record.numExpediente}`),
                })}
            />
        </Space>
       
    );
}