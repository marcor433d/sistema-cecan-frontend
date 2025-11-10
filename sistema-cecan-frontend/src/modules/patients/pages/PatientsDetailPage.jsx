/**
 * Página de detalle de un paciente.
 * Muestra información personal, citas, reportes, enfermedades, contactos y más.
 * Permite actualizar datos si el usuario tiene permiso.
 */
import React, {useEffect, useState} from "react";
import { useParams } from "react-router-dom";
import { Descriptions, Card, Collapse, Alert, Typography, Divider, Spin, Table,Tag, Drawer, Space, Button, message, Select,Form, Modal, Input, Checkbox, Switch, DatePicker} from "antd";
import { fetchPatientsByNumExp, fetchPatientsAppointments,fetchPatientsReports, fetchPatientsUpdate, fetchPatientsAddEstado, fetchPatientsAddTratamiento} from "../../../services/patientsApi";
import { useLoading } from "../../../hooks/useLoading";
import { EyeOutlined, FilePdfOutlined, DownloadOutlined, EditOutlined, PlusOutlined} from '@ant-design/icons';
import ReportsPdfViewer from "../../../components/ReportsPdfViewer";
import { fetchImformePdf } from "../../../services/informesApi";
import { fetchEnfermedadesGD, fetchAllDiagnosticos } from "../../../services/enumsApi";
import { useAuth } from "../../../context/useAuth";
import TextArea from "antd/es/input/TextArea";
import dayjs from "dayjs";


const { Title, Text} = Typography;
const {Panel} = Collapse;
const {Option} = Select;

const INFO_DESC_STYLE = {
  styles: {
  labelStyle: { width: 140, textAlign: 'right', paddingRight: 16 },
  // el contenido ocupará el resto del espacio
  contentStyle: { width: 'calc(50% - 156px)' }
  }
};


export default function PatientsDetailPage(){

    const{numExpediente} = useParams();
    const[paciente, setPaciente] = useState(null);
    const [loading, dispatchLoading] = useLoading({info: false, enfermades:false });
    const [error, setError] = useState(null);
    const [citas,setCitas] = useState([]);
    const [reports,setReports] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentReport, setCurrentReport] = useState(null);
    const BACKEND = 'https://10.6.37.36:8443'
    const [nameModalVisible, setNameModalVisible] = useState(false);
    const [nameForm] = Form.useForm();
    const [justUpdated, setJustUpdated] = useState(null);

    //Direcciones
    const[dirModalVisible, setDirModalVisible] = useState(false);
    const[dirForm] = Form.useForm();
     /** Cierra el modal de direcciones y limpia el form */
    const closeDirModal = () => {
        setDirModalVisible(false);
        dirForm.resetFields();
    };
    //Enfermedades
    const [enfModalVisible, setEnfModalVisible] = useState(false);
    const [enfForm] = Form.useForm();
    const [tieneEnfCronicas, setTieneEnfCronicas] = useState(false);
    const [enfermedadesOpciones, setEnfermedadesOpciones] = useState([]);

    const [diagnosticoOpciones, setDiagnosticoOpciones] = useState([]);

    //Integramtes familia
    const [famModalVisible, setFamModalVisible] = useState(false);
    const [famForm] = Form.useForm();

    //Contactos
    const [contsModalVisible, setContsModalVisible] = useState(false);
    const [contsForm] = Form.useForm();

    //estado tratamiento
    const [estadoActual, setEstadoActual] = useState(null);
    const getEstadoColor = (tipo) => {
        if(!tipo) return "default";
        if (tipo.includes("CONSULTA 1RA VEZ")) return "green";
        if (tipo.includes("SUBSECUENTE")) return "blue";
        if (tipo.includes("VIGILANCIA")) return "gold";
        if (tipo.includes("PALIATIVO")) return "pink";
         if (tipo.includes("DEFUNCIÓN")) return "red";

        return "default"; // color por defecto si no coincide
    };
    const [estadoModalVisible, setEstadoModalVisible] = useState(false);
    const [estadoForm] = Form.useForm();
    const closeEstadoModal = () => {
        setEstadoModalVisible(false);
        estadoForm.resetFields();
    };

    //tratamientos
    const [tratamientosModalVisible, setTratamientosModalVisible] = useState(false);
    const [tratamientoForm] = Form.useForm();
    const closeTratamientosModal = () => {
        setTratamientosModalVisible(false);
        tratamientoForm.resetFields();
    };
    const openTratamientosModal = async () => {
        try {
            //Si no hay tratamientos registrados, crea uno vacío
            if(!paciente.tratamientos || paciente.tratamientos.length === 0){
                 await fetchPatientsAddTratamiento(paciente.numExpediente,{
                tipo: '',
                descripcion: '',
                fecha:null,
                numExpediente: paciente.numExpediente   
            });
        }
            //Recargar los datos
            const {data} = await fetchPatientsByNumExp(numExpediente);

            //convertir fecha a dayjs
            const tratamientosConFecha = data.tratamientos.map(t => ({
                ...t,
                fecha: t.fecha ? dayjs(t.fecha) : null,
            }));

            setPaciente({...data, tratamientos: tratamientosConFecha});
        
        //Establecer los valores del formulario con los tratamientos actuales
        tratamientoForm.setFieldValue({
            tratamientos: tratamientosConFecha
        });

        setTratamientosModalVisible(true);
        }catch {
            message.error("Error al abrir el modal de tratamientos");
        }
    };

     /** Cierra el modal de nombre y resetea el form */
    const closeNameModal = () => {
        setNameModalVisible(false);
        nameForm.resetFields();
    };

    //permisos
    const { user: me} = useAuth();
    const canEdit = ['ADMISION','ADMIN','TRABAJOSOCIAL'].includes(me?.rol);

     /**
     * Muestra un campo opcional si hay valor, o un mensaje si está vacío y el usuario puede editar.
     * @param {string} value - Valor del campo
     * @returns {string}
     */
    function renderField(value){
        if(value !=null && value !== '') return value;
        if(canEdit) return 'Haga click para completar';
        return '';
    }

    /**
     * Carga datos del paciente, citas y reportes al montar el componente.
     */
    useEffect(() => {
        dispatchLoading({type: "SET", key: "info", value:true});
        fetchPatientsByNumExp(numExpediente)
            .then(({data}) => {
                setPaciente(data);
                if(data.estadoTratamientos?.length > 0){
                    const estadoMasReciente = [...data.estadoTratamientos].sort((a,b) => new Date(b.fecha) - new Date(a.fecha))[0];
                    setEstadoActual(estadoMasReciente);
                }else{
                    setEstadoActual(null);
                }

            })
            .catch((e) => setError(e))
            .finally(() => dispatchLoading({type: "SET", key: "info", value:false}));

        fetchPatientsAppointments(numExpediente)
            .then(({data}) =>{ 
                //Ordenamos de más recientes a más antiguo
                const sorted = data.sort((a,b) => {
                    //Creamos Date objects para comparar fecha+hora
                    const dtA = new Date(`${a.fecha}T${a.hora}`);
                    const dtB = new Date(`${b.fecha}T${b.hora}`);
                    return dtB - dtA; // b antes que a => descendente
                })
                setCitas(sorted)})
            .catch(()=>{});
        
        fetchPatientsReports(numExpediente)
                .then(({data}) => setReports(data))
                .catch(()=>{});
    },[numExpediente, dispatchLoading]);

    /**
     * Rellena el formulario de direcciones cuando se abre el modal.
     */
    useEffect(() => {
        if (dirModalVisible && paciente) {
            dirForm.setFieldsValue({ direcciones: paciente.direcciones });
        }
    }, [dirModalVisible, paciente, dirForm]);

    /**
     * Muestra un mensaje cuando se actualiza algún dato.
     */
    useEffect(() => {
        if (justUpdated) {
        message.success(`${justUpdated} actualizado`);
        setJustUpdated(null);
        }
    }, [justUpdated]);

    /**
     * Carga enfermedades crónicas al abrir el modal.
     */
    useEffect(() => {
    dispatchLoading({ type: "SET", key: "enfermedades", value: true });
    if (enfModalVisible && paciente) {
        const has = paciente.enfermedadesCronicas.length > 0;
        setTieneEnfCronicas(has);
        enfForm.setFieldsValue({
            tieneEnfCronicas: has,
            enfermedadesGD: paciente.enfermedadesCronicas.map(e => e.nombreEnfermedad),
        });
    }
    fetchEnfermedadesGD()
        .then((resp) => {
            setEnfermedadesOpciones(resp.data || []);
        })
        .catch((err) => {
            console.error("Error cargando Enfermedades GD:", err);
            message.error("No se pudieron cargar las enfermedades crónicas");
        })
        .finally(() => {
            dispatchLoading({ type: "SET", key: "enfermedades", value: false });
        })

    }, [enfModalVisible, paciente, enfForm, dispatchLoading]);

    /**
     * Rellena el formulario de integrantes de la familia.
     */
    useEffect(() => {
        if (famModalVisible && paciente) {
            famForm.setFieldsValue({ integrantesFamilia: paciente.integrantesFamilia });
        }
    }, [famModalVisible, paciente, famForm]);

    /**
     * Rellena el formulario de contactos.
     */
    useEffect(() => {
        if (contsModalVisible && paciente) {
            contsForm.setFieldsValue({ contactos: paciente.contactos });
        }
    }, [contsModalVisible, paciente, contsForm]);

    /**
     * Rellena el formulario de tratamientos.
     */
    useEffect(() => {
        if (tratamientosModalVisible && paciente) {
            tratamientoForm.setFieldsValue({ tratamientos: paciente.tratamientos });
        }
    }, [tratamientosModalVisible, paciente, tratamientoForm]);

    /**
     * Carga los diagnósticos desde el backend cuando se monta el componente.
     */
    useEffect(() => {
        fetchAllDiagnosticos()
            .then((resp) => {
                setDiagnosticoOpciones(resp.data || []);
            })
            .catch((err) => {
                console.error("Error cargando diagnósticos:", err);
                message.error("No se pudieron cargar los diagnósticos");
            });
    },[]);

    if(loading.info){
        return(
            <div style={{textAlign: "center", marginTop: 60}}>
                <Spin size="large" />
            </div>
        );
    }

    if(error) {
        return(
            <Alert
                type="error"
                message="Error cargando datos del paciente"
                description={error.message}
            />
        );
    }

    if(!paciente){
        return <Alert type="warning" message="Paciente no encontrado" />
    }

    /**
     * Descarga un informe PDF desde el backend.
     * @async
     * @param {string} tipo - Tipo de informe (ej. 'hoja clinica', 'estudio socieconomico')
     * @param {number|string} idInforme - ID del informe
     */
    const handleDownloadPdf = async (tipo,idInforme) => {
        try {
            const resp = await fetchImformePdf(tipo, idInforme);

            const url = window.URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = `informe-${tipo}-${idInforme}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            message.error('Error al descargar el PDF');
        }
    };
    /**
     * Actualiza múltiples campos del paciente y recarga los datos.
     * @async
     * @param {Object} updates - Objeto con los campos a actualizar
     * @param {string} [label='datos'] - Nombre del bloque actualizado (para el mensaje)
     */
    const handleUpdateMultiple = async (updates, label = 'datos') => {
        try {
            await fetchPatientsUpdate(paciente.numExpediente, updates);
            // refrescar paciente
            const { data } = await fetchPatientsByNumExp(paciente.numExpediente);
            setPaciente(data);
             message.success(`${label.charAt(0).toUpperCase() + label.slice(1)} actualizados`);
        } catch {
            message.error('Error al actualizar');
        }
    };

     /**
     * Actualiza un solo campo del paciente.
     * @async
     * @param {string} field - Nombre del campo a actualizar
     * @param {*} value - Nuevo valor
     */
    const handleUpdate = async (field, value) => {
        try{
            await fetchPatientsUpdate(numExpediente, {[field]: value});
            setPaciente(prev =>({...prev, [field]: value}));
            setJustUpdated(field);
        }catch{
            message.error("Error al actualizar");
        }
    };

    



    /**
     * Arreglo de paneles desplegables para mostrar la información detallada de un paciente.
     * Cada panel contiene un encabezado (`label`) y un cuerpo (`children`) con contenido dinámico.
     * Estos paneles son utilizados dentro de un componente tipo <Collapse />.
     */
    const panels = [
        {
           key: "panel-info",
            label: "Información Básica",
            children: (
                <Descriptions
                    column={2}
                    size="small"
                    bordered
                    styles={INFO_DESC_STYLE.styles}
                >
                    <Descriptions.Item label="Nombre">
                        <Space>
                            <Text>
                                {paciente.nombre || ''} {paciente.apellidoPaterno || ''} {paciente.apellidoMaterno || ''}
                            </Text>
                            {canEdit && (
                            <EditOutlined
                                style={{ color: '#1890ff', cursor: 'pointer' }}
                                onClick={() => {
                                    nameForm.setFieldsValue({
                                    nombre: paciente.nombre,
                                    apellidoPaterno: paciente.apellidoPaterno,
                                    apellidoMaterno: paciente.apellidoMaterno
                                    });
                                    setNameModalVisible(true);
                                }}
                                />
                            )}
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="CURP">
                        <Text
                            type={paciente.curp ? undefined : 'secondary'}
                            italic={!paciente.curp}
                            editable={canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar CURP',
                                onChange: val => handleUpdate('curp', val),
                            } : false }
                            >
                                {renderField(paciente.curp)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Fecha Nac.">
                         <Text
                            type={paciente.fechaNacimiento ? undefined : 'secondary'}
                            italic={!paciente.fechaNacimiento}
                            editable={ canEdit ?{
                                icon: <EditOutlined />,
                                tooltip: 'Editar fecha de nacimiento',
                                onChange: val => handleUpdate('fechaNacimiento', val),
                            } : false }
                            >
                                {renderField(paciente.fechaNacimiento)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Edad">
                         <Text
                            type={paciente.edadCumplida != null ? undefined : 'secondary'}
                            italic={paciente.edadCumplida == null}
                            editable={canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar edad',
                                onChange: val => handleUpdate('edadCumplida', Number(val)),
                            } : false}
                            >
                                {renderField(paciente.edadCumplida)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Sexo">
                        <Select
                            value={paciente.sexo}
                            placeholder="Selecciona..."
                            style={{ width: 120 }}
                            onChange={val => handleUpdate('sexo', val)}
                        >
                            <Option value="M">Masculino (M)</Option>
                            <Option value="F">Femenino (F)</Option>
                        </Select>
                    </Descriptions.Item>
                    <Descriptions.Item label="Estado Civil">
                        <Text
                            type={paciente.estadoCivil ? undefined : 'secondary'}
                            italic={!paciente.estadoCivil}
                            editable={canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar estado civil',
                                onChange: val => handleUpdate('estadoCivil', val),
                            } : false}
                            >
                                {renderField(paciente.estadoCivil)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Escolaridad">
                        <Text
                            type={paciente.escolaridad ? undefined : 'secondary'}
                            italic={!paciente.escolaridad}
                            editable={ canEdit ?{
                                icon: <EditOutlined />,
                                tooltip: 'Editar escolaridad',
                                onChange: val => handleUpdate('escolaridad', val),
                            } : false}
                            >
                                {renderField(paciente.escolaridad)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Diagnóstico">
                        <Select
                            value={paciente.diagnostico || undefined}
                            onChange={val => handleUpdate('diagnostico', val)}
                            style={{minWidth: 200}}
                            showSearch
                            placeholder="Selecciona un diagnóstico"
                            loading={diagnosticoOpciones.length === 0}
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                option.children.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {diagnosticoOpciones.map(d => (
                                <Select.Option key={d} value={d}>
                                    {d}
                                </Select.Option>
                            ))}
                        </Select>
                    </Descriptions.Item>
                    <Descriptions.Item label="Grupo Sanguíneo">
                        <Text
                            type={paciente.grupoSanguineo ? undefined : 'secondary'}
                            italic={!paciente.grupoSanguineo}
                            editable={ canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar grupo sanguíneo',
                                onChange: val => handleUpdate('grupoSanguineo', val),
                            } : false}
                        >
                            {renderField(paciente.grupoSanguineo)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="RH">
                        <Text
                            type={paciente.rh ? undefined : 'secondary'}
                            italic={!paciente.rh}
                            editable={canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar RH',
                                onChange: val => handleUpdate('rh', val),
                            } : false}
                            >
                                {renderField(paciente.rh)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Peso (kg)">
                        <Text
                            type={paciente.pesoKg != null ? undefined : 'secondary'}
                            italic={paciente.pesoKg == null}
                            editable={ canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar peso (kg)',
                                onChange: val => handleUpdate('pesoKg', Number(val)),
                            } : false}
                            >
                                {renderField(paciente.pesoKg)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Peso (g)">
                        <Text
                            type={paciente.pesoGr != null ? undefined : 'secondary'}
                            italic={paciente.pesoGr == null}
                            editable={canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar peso (g)',
                                onChange: val => handleUpdate('pesoGr', Number(val)),
                            } : false}
                            >
                                {renderField(paciente.pesoGr)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Talla (cm)">
                        <Text
                            type={paciente.talla != null ? undefined : 'secondary'}
                            italic={paciente.talla == null}
                            editable={canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar talla (cm)',
                                onChange: val => handleUpdate('talla', Number(val)),
                            } : false}
                            >
                                {renderField(paciente.talla)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Alergias">
                        <Text
                            type={paciente.alergias ? undefined : 'secondary'}
                            italic={!paciente.alergias}
                            editable={ canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar alergias',
                                onChange: val => handleUpdate('alergias', val),
                            } : false}
                            >
                                {renderField(paciente.alergias)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Riesgo de Caída">
                       <Select
                            value={paciente.riesgoCaida}
                            onChange={val => handleUpdate('riesgoCaida', val)}
                            style={{ width: 80 }}
                        >
                            <Option value={true}>Sí</Option>
                            <Option value={false}>No</Option>
                        </Select>
                    </Descriptions.Item>
                    <Descriptions.Item label="Riesgo de Úlceras">
                        <Select
                            value={paciente.riesgoUlceras}
                            onChange={val => handleUpdate('riesgoUlceras',val)}
                            style={{width: 80}}
                        >
                            <Option value={true}>Sí</Option>
                            <Option value={false}>No</Option>
                        </Select>
                    </Descriptions.Item>
                    <Descriptions.Item label="País Residencia">
                        <Text
                            type={paciente.paisResidencia ? undefined : 'secondary'}
                            italic={!paciente.paisResidencia}
                            editable={ canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar país de residencia',
                                onChange: val => handleUpdate('paisResidencia', val),
                            } : false}
                            >
                                {renderField(paciente.paisResidencia)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Estado Residencia">
                        <Text
                            type={paciente.estadoResidencia ? undefined : 'secondary'}
                            italic={!paciente.estadoResidencia}
                            editable={ canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar estado de residencia',
                                onChange: val => handleUpdate('estadoResidencia', val),
                            } : false}
                            >
                                {renderField(paciente.estadoResidencia)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Municipio Residencia">
                        <Text
                            type={paciente.municipioResidencia ? undefined : 'secondary'}
                            italic={!paciente.municipioResidencia}
                            editable={ canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar municipio de residencia',
                                onChange: val => handleUpdate('municipioResidencia', val),
                            } : false}
                        >
                            {renderField(paciente.municipioResidencia)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Nacionalidad">
                         <Text
                            type={paciente.nacionalidad ? undefined : 'secondary'}
                            italic={!paciente.nacionalidad}
                            editable={ canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar nacionalidad',
                                onChange: val => handleUpdate('nacionalidad', val),
                            } : false}
                        >
                            {(paciente.nacionalidad)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Escolaridad">
                        <Text
                            type={paciente.escolaridad ? undefined : 'secondary'}
                            italic={!paciente.escolaridad}
                            editable={canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar escolaridad',
                                onChange: val => handleUpdate('escolaridad', val),
                            } : false}
                        >
                            {renderField(paciente.escolaridad)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Ocupación">
                        <Text
                            type={paciente.ocupacion ? undefined : 'secondary'}
                            italic={!paciente.ocupacion}
                            editable={canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar ocupación',
                                onChange: val => handleUpdate('ocupacion', val),
                            } : false }
                        >
                            {renderField(paciente.ocupacion)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Grupo Étnico">
                        <Text
                            type={paciente.grupoEtnico ? undefined : 'secondary'}
                            italic={!paciente.grupoEtnico}
                            editable={ canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar grupo étnico',
                                onChange: val => handleUpdate('grupoEtnico', val),
                            } : false}
                        >
                            {renderField(paciente.grupoEtnico)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Habla Lengua Indígena">
                        <Select
                            value={paciente.hablaLenguaIndigena}
                            onChange={val => handleUpdate('hablaLenguaIndigena', val)}
                            style={{ width: 80 }}
                        >
                            <Option value={true}>Sí</Option>
                            <Option value={false}>No</Option>
                        </Select>
                    </Descriptions.Item>
                    <Descriptions.Item label="Lengua Indígena">
                        <Text
                            type={paciente.lenguaIndigena ? undefined : 'secondary'}
                            italic={!paciente.lenguaIndigena}
                            editable={ canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar lengua indígena',
                                onChange: val => handleUpdate('lenguaIndigena', val),
                            } : false}
                        >
                            {renderField(paciente.lenguaIndigena)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Edad menor 30d">
                        <Text
                            type={paciente.edadMenor30d ? undefined : 'secondary'}
                            italic={!paciente.edadMenor30d}
                            editable={ canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar edad menor 30 días',
                                onChange: val => handleUpdate('edadMenor30d', val),
                            } : false}
                        >
                            {renderField(paciente.edadMenor30d)}
                        </Text> 
                    </Descriptions.Item>
                    <Descriptions.Item label="Edad menor 1 año">
                        <Text
                            type={paciente.edadMenor1a ? undefined : 'secondary'}
                            italic={!paciente.edadMenor1a}
                            editable={ canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar edad menor 1 año',
                                onChange: val => handleUpdate('edadMenor1a', val),
                            } : false}
                        >
                            {renderField(paciente.edadMenor1a)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Edad mayor 1 año">
                        <Text
                            type={paciente.edadMayor1a ? undefined : 'secondary'}
                            italic={!paciente.edadMayor1a}
                            editable={ canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar edad mayor 1 año',
                                onChange: val => handleUpdate('edadMayor1a', val),
                            } : false}
                        >
                            {renderField(paciente.edadMayor1a)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Religión">
                        <Text
                            type={paciente.religion ? undefined : 'secondary'}
                            italic={!paciente.religion}
                            editable={ canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar religión',
                                onChange: val => handleUpdate('religion', val),
                            } : false}
                        >
                            {renderField(paciente.religion)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Estado Nacimiento">
                         <Text
                            type={paciente.estadoNacimiento ? undefined : 'secondary'}
                            italic={!paciente.estadoNacimiento}
                            editable={ canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar estado de nacimiento',
                                onChange: val => handleUpdate('estadoNacimiento', val),
                            } : false}
                        >
                            {renderField(paciente.estadoNacimiento)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Municipio Nacimiento">
                        <Text
                            type={paciente.municipioNacimiento ? undefined : 'secondary'}
                            italic={!paciente.municipioNacimiento}
                            editable={ canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar municipio de nacimiento',
                                onChange: val => handleUpdate('municipioNacimiento', val),
                            } : false}
                        >
                            {renderField(paciente.municipioNacimiento)}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Localidad Nacimiento">
                        <Text
                            type={paciente.localidadNacimiento ? undefined : 'secondary'}
                            italic={!paciente.localidadNacimiento}
                            editable={ canEdit ? {
                                icon: <EditOutlined />,
                                tooltip: 'Editar localidad de nacimiento',
                                onChange: val => handleUpdate('localidadNacimiento', val),
                            } : false}
                        >
                            {renderField(paciente.localidadNacimiento)}
                        </Text>
                    </Descriptions.Item>
                </Descriptions>
            ) 
        },
        {
            key: "dirs",
            label: (
                <Space>
                    Direcciones
                    {canEdit && (
                        <Button
                            size="small"
                            icon={<EditOutlined/>}
                            onClick={() => setDirModalVisible(true)}
                        >
                            Editar
                        </Button>
                    )}
                </Space>
            ),
            children: paciente.direcciones.length > 0
                ? paciente.direcciones.map((d,i) => (
                    <Descriptions
                        key={`dir-${i}`} column={1} size="small" bordered
                        style={{ marginBottom:12 }}
                        styles={INFO_DESC_STYLE.styles}
                    >
                        <Descriptions.Item label="Calle/Avenida">{d.nombreVialidad}</Descriptions.Item>
                        <Descriptions.Item label="No. Exterior">{d.numeroExterior}</Descriptions.Item>
                        <Descriptions.Item label="Colonia">{d.colonia}</Descriptions.Item>
                        <Descriptions.Item label="CP">{d.codigoPostal}</Descriptions.Item>
                        <Descriptions.Item label="Responsable">{d.responsable ? "Sí" : "No"}</Descriptions.Item>
                    </Descriptions>
                ))
            : <Text type="secondary">No hay direcciones registradas</Text>
        },
        {
            key: "conts",
            label: (
                <Space>
                    Contactos
                    {canEdit && (
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => setContsModalVisible(true)}
                        >
                            Editar
                        </Button>
                    )}
                </Space>
            ),
            children: (() => {
                const propios = paciente.contactos.filter(c => c.relacion==="propio");
                const otros   = paciente.contactos.filter(c => c.relacion!=="propio");
                return (
                    <>
                        {propios.length >0
                            ? <>
                                <Text strong>Télefonos del paciente</Text>
                                <ul>{propios.map((c,i) =><li key={i}>{c.telefono}</li>)}</ul>
                                </>
                            : <Text type="secondary">No hay teléfonos propios</Text>
                        }
                        {otros.length>0&&
                            <>
                                <Text strong>Otros contactos</Text>
                                <Table
                                    dataSource={otros.map((c,i) => ({key: i,...c}))}
                                    columns={[
                                        {title:"Teléfono",dataIndex:"telefono",key:"tel"},
                                        {title:"Relación",dataIndex:"relacion",key:"rel"}
                                    ]}
                                    pagination={false} size="small" bordered
                                />
                            </>
                            }
                    </>
                );
            })()
        },
        {
            key: "enfs",
            label: (
                <Space>
                    Enfermedades Crónicas
                    {canEdit && (
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => setEnfModalVisible(true)}
                        >
                            Editar
                        </Button>
                    )}
                </Space>
            ),
            children: paciente.enfermedadesCronicas.length > 0
                ? <ul>{paciente.enfermedadesCronicas.map((e,i) =><li key={i}>{e.nombreEnfermedad}</li>)}</ul>
                : <Text type="secondary">No registra enfermedades crónicas.</Text>
        },
        {
            key: "fam",
            label: (
                <Space>
                    Integrantes de Familia
                    {canEdit && (
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => setFamModalVisible(true)}
                        >
                            Editar
                        </Button>
                    )}
                </Space>
                
            ),
            children: paciente.integrantesFamilia.length>0
                ? <Table
                    dataSource={paciente.integrantesFamilia}
                    columns={[
                        {title:'Nombre',      dataIndex:'nombre',     key:'nombre'},
                        {title:'Parentesco',  dataIndex:'parentesco', key:'parentesco'},
                        {title:'Edad',        dataIndex:'edad',       key:'edad'},
                        {title:'Vive',
                            dataIndex: 'vive', key: 'vive',
                            render: v => (v?'Si' : 'No')
                        },
                        {title:'Escolaridad', dataIndex:'escolaridad',key:'escolaridad'},
                        {title:'Ocupación',   dataIndex:'ocupacion',  key:'ocupacion'},
                        {title: 'Responsable',
                            dataIndex: 'responsable', key: 'resp',
                            render:r=>r?<Tag color="blue">RESPONSABLE</Tag>:null
                        }
                    ]}
                    rowKey={rec=>rec.idIntegranteFamilia?.toString()||rec.nombre}
                    pagination={false} size="small" bordered
                    />
                : <Text type="secondary">No hay integrantes registrados.</Text>
        },
        {
            key: "cits",
            label: "Citas",
            children: citas.length>0
                ? <Table
                    dataSource={citas}
                    columns={[
                        {title:"Tipo",         dataIndex:"tipo",      key:"tipo"},
                        {title:"Fecha inicio", dataIndex:"fecha",     key:"fecha"},
                        {title:"Hora inicio",  dataIndex:"hora",      key:"hora"},
                        {title:"Fecha fin",    dataIndex:"fechaFin",  key:"fechaFin"},
                        {title:"Hora fin",     dataIndex:"horaFin",   key:"horaFin"},
                        {title:"Estado",       dataIndex:"estado",    key:"estado"},
                        {title:"Motivo",       dataIndex:"motivo",    key:"motivo"},
                    ]}
                    rowKey="idCita"
                    pagination={false} size="small" bordered
                    onRow={r => ({ style: {
                        backgroundColor:
                            r.estado==='PROGRAMADA'? '#e6f7ff'
                            : r.estado==='REALIZADA'?   '#f6ffed'
                            : r.estado==='CANCELADA'?   '#fff1f0'
                            : r.estado==='EN_CURSO'?    '#fffbe6'
                            : undefined
                    }})}
                    />
                : <Text type="secondary">No hay citas registradas.</Text>
        },
        {
            key: "infs",
            label: "Informes",
            children: reports.length>0
                ? <Table
                    dataSource={reports}
                    columns={[
                        {title:'Tipo',  dataIndex:'tipo',        key:'tipo'},
                        {title:'Fecha', dataIndex:'fecha',       key:'fecha'},
                        {title:'Hora',  dataIndex:'hora',        key:'hora'},
                        {title:'Usuario',key:'usuario', 
                            render: (_,rec) => rec.cedula.cedula
                        },
                        {title: 'Acciones', key: 'acc',
                            render: (_,rec) => (
                                <Space size="small">
                                    <EyeOutlined
                                        style={{color: '#1890ff', cursor: 'pointer'}}
                                        onClick={() => {setCurrentReport(rec); setDrawerOpen(true);}}
                                    />
                                    <FilePdfOutlined
                                        style={{ color: '#f5222d', cursor: 'pointer' }}
                                        onClick={() => handleDownloadPdf(rec.tipo, rec.idInforme)}
                                    />
                                </Space>
                            )
                        }
                    ]}
                    rowKey="idInforme"
                    pagination={false} size="small" bordered
                    />
                : <Text type="secondary">No hay informes registrados.</Text>
        },
        {
            key: "estados",
            label: (
                <Space>
                    Estado de Tratamiento
                    {canEdit && (
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => setEstadoModalVisible(true)}
                        >
                            Actualizar
                        </Button>
                    )}
                </Space>
                
            ),
            children: paciente.estadoTratamientos.length>0
                ? <Table
                    dataSource={[...paciente.estadoTratamientos]
                        .sort((a,b) => new Date(b.fecha) - new Date(a.fecha))
                    }
                    columns={[
                        {title:'Estado',  dataIndex:'tipo',        key:'tipo'},
                        {title:'Fecha de inicio', dataIndex:'fecha',       key:'fecha'},
                    ]}
                    rowKey="id"
                    pagination={false} size="small" bordered
                    onRow={record => ({
                        style: {
                            backgroundColor: 
                                record.tipo.includes("CONSULTA 1RA VEZ") ? '#e6ffed' : 
                                record.tipo.includes("SUBSECUENTE") ? '#e6f7ff' :      
                                record.tipo.includes("VIGILANCIA") ? '#fffbe6' :      
                                record.tipo.includes("PALIATIVO") ? '#fff0fdff' : 
                                record.tipo.includes("DEFUNCIÓN") ? '#fff1f0' :
                                undefined
                        }
                    })}
                    />
                : <Text type="secondary">No hay estados de tratamiento registrados.</Text>
        },
        {
            key: "tratamientos",
            label: (
                <Space>
                    Tratamientos
                    {canEdit && (
                        <Button
                            size="small"
                            icon= {<EditOutlined />}
                            onClick={openTratamientosModal}
                        >
                            Editar tratamientos
                        </Button>
                    )}
                </Space>
            ),
            children: paciente.tratamientos.length>0
                ? (
                    <Table
                        dataSource={[...paciente.tratamientos].sort(
                            (a,b) => new Date(b.fecha) - new Date(a.fecha)
                        )}
                        columns={[
                            { title: "Tipo de Tratamiento", dataIndex: "tipo", key: "tipo" },
                            { title: "Fecha", dataIndex: "fecha", key: "fecha", render: (fecha) => fecha ? dayjs(fecha).format('DD/MM/YYYY') : '-'},
                            { title: "Descripción", dataIndex: "descripcion", key: "descripcion", render: (text) => (
                                <div style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: 300}}>
                                    {text}
                                </div>
                            ) },
                        ]}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        bordered
                    />
                ) : (
                    <Text type="secondary">No hay tratamientos registrados.</Text>
                )
        }
    ];

    
    return(
    <>
       <Card variant="bordered" style={{ maxWidth: 800, margin: "auto", padding: 24 }}>
            <Title level={2}>Perfil de Paciente</Title>
            <div style={{ marginBottom: 8 }}>
            <Text type="secondary">Expediente: {paciente.numExpediente}</Text>
            </div>
            <div style={{ marginBottom: 8 }}>
            {estadoActual ? (
                <Tag color={getEstadoColor(estadoActual.tipo)}>
                    ESTADO: {estadoActual.tipo}
                </Tag>
            ) : (
                canEdit && (
                    <Button
                        type="dashed"
                        onClick={() => setEstadoModalVisible(true)}
                    >
                        Agregar Estado de Tratamiento
                    </Button>
            ))}
            </div>
            <Divider />

            <Collapse defaultActiveKey={["info"]} destroyOnHidden items={panels} />

            <Drawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                width="80vw"
                footer={
                    <Button
                       type="primary"
                        icon={<DownloadOutlined />}
                        onClick={() =>
                            window.open(
                                 `${BACKEND}/api/informes/${currentReport.tipo}/${currentReport.idInforme}/pdf`,
                                 "_blank"
                            )
                        }
                    >
                        Descargar PDF
                    </Button>
                }
            >
                {currentReport && (
                    <ReportsPdfViewer
                        url={`https://10.6.37.36:8443/api/informes/${currentReport.tipo}/${currentReport.idInforme}/pdf`}
                    />
                )}
            </Drawer>
       </Card>
       <Modal
        title="Editar nombre del paciente"
        open={nameModalVisible}
        onCancel={closeNameModal}
        onOk={() => {
            nameForm
            .validateFields()
            .then(values => {
                // llamar tu función de actualización
                handleUpdateMultiple({
                nombre: values.nombre,
                apellidoPaterno: values.apellidoPaterno,
                apellidoMaterno: values.apellidoMaterno
                }, 'nombre');
                closeNameModal();
            })
            .catch(() => {});
        }}
        okText="Guardar"
        cancelText="Cancelar"
       >
        <Form form={nameForm} layout="vertical">
            <Form.Item
            name="nombre"
            label="Nombre"
            rules={[{ required: true, message: 'Ingresa el nombre' }]}
            >
            <Input />
            </Form.Item>
            <Form.Item
            name="apellidoPaterno"
            label="Apellido Paterno"
            rules={[{ required: true, message: 'Ingresa el apellido paterno' }]}
            >
            <Input />
            </Form.Item>
            <Form.Item
            name="apellidoMaterno"
            label="Apellido Materno"
            rules={[{ required: true, message: 'Ingresa el apellido materno' }]}
            >
            <Input />
            </Form.Item>
        </Form>
       </Modal>
       <Modal
            title="Editar Direcciones"
            open={dirModalVisible}
            width={600}
            onCancel={closeDirModal}
            onOk={async () => {
                try{
                    const vals = await dirForm.validateFields();
                    await handleUpdateMultiple({direcciones: vals.direcciones}, 'direcciones');
                    closeDirModal();
                }catch(err){
                    message.error(err);
                }
            }}
        >
            <Form form={dirForm} layout="vertical">
                <Form.List 
                    name="direcciones"
                    rules={[{validator: async(_,dirs) => {
                        if (!dirs || dirs.length < 1) {
                            return Promise.reject(new Error('Debe haber al menos una dirección'));
                        }
                    }}]}
                >
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({key, name, ...restField }) => (
                                <Space
                                    key={key}
                                    style={{display: 'flex', marginBottom: 8}}
                                    align="baseline"
                                >
                                   <Form.Item
                                        {...restField}
                                        name={[name, 'nombreVialidad']}
                                        rules={[{required: true, message: 'Calle requerida'}]}
                                    >
                                        <Input placeholder="Calle/Avenida"/>
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'numeroExterior']}
                                        rules={[{required: true, message: 'No. Ext. requerido'}]}
                                    >
                                        <Input placeholder="No. Ext." style={{width: 80}}/>
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'colonia']}
                                        rules={[{required: true, message: 'Colonia requerida'}]}
                                    >
                                        <Input placeholder="Colonia"/>
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'codigoPostal']}
                                        rules={[{required: true, message: 'CP requerido'}]}
                                    >
                                        <Input placeholder="CP" style={{width: 80}}/>
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'responsable']}
                                        valuePropName="checked"
                                        initialValue={false}
                                    >
                                        <Checkbox>Resp.</Checkbox>
                                    </Form.Item>
                                    <Button danger onClick={() => remove(name)}>
                                        Eliminar
                                    </Button>
                                </Space>
                            ))}
                            <Form.Item>
                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    block
                                    icon={<PlusOutlined />}
                                >
                                    Agregar dirección
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>
            </Form>

        </Modal>
        <Modal
            title="Editar enfermedades crónicas"
            open={enfModalVisible}
            onCancel={() => {
                setEnfModalVisible(false);
                enfForm.resetFields();
            }}
            onOk={async () => {
                try {
                    const vals = await enfForm.validateFields();
                    //preparar el paylodad, si tieneEnfCronicas=false enviamos lista vacía
                    const lista = vals.tieneEnfCronicas
                        ? vals.enfermedadesGD.map(cod => ({ nombreEnfermedad: cod }))
                        : [];
                    await handleUpdateMultiple({enfermedadesCronicas: lista},'enfermedades crónicas' );
                    setEnfModalVisible(false);
                    enfForm.resetFields();
                }catch(err){
                    message.error('Corrige los campos antes de guardar', err);
                }
            }}
            okText="Guardar"
            cancelText="Cancelar"
        >
            <Form form={enfForm} layout="vertical">
                <Form.Item
                    name="tieneEnfCronicas"
                    label="¿Tiene enfermedades crónicas?"
                    valuePropName="checked"
                >
                    <Switch onChange={checked => setTieneEnfCronicas(checked)} />
                </Form.Item>
                {tieneEnfCronicas && (
                    <Form.Item
                        name="enfermedadesGD"
                        label="Selecciona hasta 4 enfermedades"
                        rules={[{
                        required: true,
                        message: 'Selecciona al menos una enfermedad',
                        }]}
                    >
                        <Select
                            mode="multiple"
                            maxTagCount={4}
                            placeholder="Elige las enfermedades"
                            loading={loading.enfermedades}
                            allowClear
                        >
                            {enfermedadesOpciones.map(cod => (
                                <Option key={cod} value={cod}>
                                {cod.replace(/_/g, ' ')}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                )}
            </Form>
        </Modal>
        <Modal
           title="Editar Integrantes de Familia"
            open={famModalVisible}
            width={700}
            onCancel={() => {
                setFamModalVisible(false);
                famForm.resetFields();
            }}
            onOk={async () => {
                try {
                    const vals = await famForm.validateFields();
                    await handleUpdateMultiple(
                        { integrantesFamilia: vals.integrantesFamilia },
                        'integrantes de familia'
                    );
                    setFamModalVisible(false);
                    famForm.resetFields();
                }catch(err){
                    message.error('Corrige los campos antes de guardar', err);
                }
            }}
            okText="Guardar"
            cancelText="Cancelar"
        >
             <Form form={famForm} layout="vertical">
                <Form.List
                    name="integrantesFamilia"
                    rules={[
                         {
                            validator: async (_, list) => {
                                if (!list || list.length < 1) {
                                return Promise.reject(new Error('Debe haber al menos un integrante'));
                                }
                            },
                        },
                    ]}
                >
                    {(fields, {add, remove }) => (
                        <>
                            {fields.map(({key, name, ...restField}) => (
                                <Space
                                    key={key}
                                    style={{ display: 'flex', marginBottom: 8 }}
                                    align="baseline"
                                >
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'nombre']}
                                    >
                                        <Input placeholder="Nombre completo"/>
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'parentesco']}
                                    >
                                        <Input placeholder="Parentesco" />
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'edad']}
                                    >
                                        <Input placeholder="Edad" style={{ width: 80 }} />
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'vive']}
                                        valuePropName="checked"
                                        initialValue={true}
                                    >
                                        <Checkbox>Vive</Checkbox>
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'escolaridad']}
                                    >
                                        <Input placeholder="Escolaridad" />
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'ocupacion']}
                                    >
                                        <Input placeholder="Ocupación" />
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'responsable']}
                                        valuePropName="checked"
                                        initialValue={false}
                                    >
                                        <Checkbox>Responsable</Checkbox>
                                    </Form.Item>
                                    <Button danger onClick={() => remove(name)}>
                                        Eliminar
                                    </Button>
                                </Space>
                            ))}
                            <Form.Item>
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                Agregar integrante
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>
             </Form>
        </Modal>
        <Modal
            title="Editar Contactos"
            open={contsModalVisible}
            width={600}
            onCancel={() => {
                setContsModalVisible(false);
                contsForm.resetFields();
            }}
            onOk={async () => {
                try {
                    const vals = await contsForm.validateFields();
                    await handleUpdateMultiple(
                        {contactos: vals.contactos.map(c => ({
                            telefono: c.telefono,
                            relacion: c.relacion || 'otros'
                        }))},
                        "contactos"
                    );
                    setContsModalVisible(false);
                    contsForm.resetFields();
                }catch(err){
                    message.error("Corrige los campos antes de guardar",err);
                }
            }}
            okText="Guardar"
            cancelText="Cancelar"
        >
            <Form form={contsForm} layout="vertical">
                <Form.List
                    name="contactos"
                    rules={[
                        {
                            validator: async (_,list) => {
                                if(!list || list.length < 1){
                                    return Promise.reject(new Error("Debe haber al menos un contacto"));
                                }
                            }
                        }
                    ]}
                >
                    {(fields, {add, remove}) => (
                        <>
                            {fields.map(({key, name, ...restField}) => (
                                <Space key={key} align="baseline" style={{ display: "flex", marginBottom: 8 }}>
                                    <Form.Item
                                        {...restField}
                                        name={[name, "telefono"]}
                                        rules={[{required: true, message: "Teléfono requerido"}]}
                                    >
                                        <Input placeholder="Teléfono" style={{ width: 150 }} />
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, "relacion"]}
                                        rules={[{required: true, message: "Relación requerida"}]}
                                    >
                                        <Select style={{width: 120}}>
                                            <Option value="propio">Propio</Option>
                                            <Option value="casa">Casa</Option>
                                            <Option value="responsable">Responsable</Option>
                                            <Option value="otro">Otro</Option>
                                        </Select>
                                    </Form.Item>
                                    <Button
                                        danger
                                        onClick={() => remove(name)}
                                    >
                                        Eliminar
                                    </Button>
                                </Space>
                            ))}
                            <Form.Item>
                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    block
                                    icon={<PlusOutlined/>}
                                >
                                    Agregar contacto
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>
            </Form>
        </Modal>
        <Modal
            title="Agregar Estado de tratamiento"
            open={estadoModalVisible}
            onCancel={closeEstadoModal}
            onOk={() => {
                estadoForm.validateFields()
                .then(async values => {
                    try {
                        await fetchPatientsAddEstado(numExpediente, values);
                        
                        message.success("Estado de tratamiento agregado correctamente");
                        closeEstadoModal();
                        // recargar el paciente para mostrar el nuevo estado
                        const { data } = await fetchPatientsByNumExp(numExpediente);
                        setPaciente(data);

                        setEstadoActual(
                            data.estadoTratamientos.length > 0
                                ? data.estadoTratamientos
                                    .slice() //copia para no mutar original
                                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0]
                                : null
                        );
                    }catch {
                        message.error("Error al agregar el estado de tratamiento");
                    }
            })
            .catch(() => {});
            }}
            >
                <Form form={estadoForm} layout="vertical">
                    <Form.Item
                        name="tipo"
                        label="Estado de tratamiento"
                        rules={[{ required: true, message: 'Selecciona un estado' }]}
                    >
                        <Select placeholder="Selecciona un estado">
                            <Option value="CONSULTA 1RA VEZ">Consulta 1ra vez</Option>
                            <Option value="SUBSECUENTE">Subsecuente</Option>
                            <Option value="VIGILANCIA">Vigilancia</Option>
                            <Option value="PALIATIVO">Paliativo</Option>
                            <Option value="DEFUNCIÓN">Defunción</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="fecha"
                        label="Fecha del estado"
                        rules={[{ required: true, message: 'Selecciona una fecha' }]}
                    >
                        <DatePicker placeholder="Selecciona una fecha" />
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title="Editar Tratamientos"
                open={tratamientosModalVisible}
                width={700}
                onCancel={closeTratamientosModal}
                onOk={async () => {
                    try {
                        const vals = await tratamientoForm.validateFields();
                        await handleUpdateMultiple({ tratamientos: vals.tratamientos }, 'tratamientos');
                        closeTratamientosModal();
                    } catch (err) {
                        message.error('Error al guardar los tratamientos', err);
                    }
                }}
            >
                <Form
                    form={tratamientoForm}
                    layout="vertical"
                >
                    <Form.List
                        name="tratamientos"
                        rules={[
                            {
                                validator: async (_, trats) => {
                                    if (!trats || trats.length < 1) {
                                        return Promise.reject(new Error('Debe haber al menos un tratamiento'));
                                    }
                                },
                            },
                        ]}
                    >
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({key, name, ...restField }) => (
                               <Space
                                    key={key}
                                    direction="vertical"
                                    style={{display: 'flex', marginBottom: 16, borderBottom: '1px solid #f0f0f0', paddingBottom: 8}}
                                >
                                    <Space wrap style={{display: 'flex'}} align="baseline">
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'tipo']}
                                        rules={[{ required: true, message: 'Tipo de tratamiento requerido' }]}
                                    >
                                        <Select placeholder= "Tipo de tratamiento" style={{ width: 200}}>
                                            <Option value= "QT">Quimioterapia</Option>
                                            <Option value= "RT">Radioterapia</Option>
                                            <Option value= "CX">Cirugía</Option>
                                            <Option value= "CX + RT">Cirugía + Radioterapia</Option>
                                            <Option value= "CX + QT">Cirugía + Quimioterapia</Option>
                                            <Option value= "RT + QT">Radioterapia + Quimioterapia</Option>
                                        </Select>
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'fecha']}
                                        rules={[{ required: true, message: 'Fecha requerida' }]}
                                    >
                                        <DatePicker placeholder="Selecciona una fecha" />
                                    </Form.Item>

                                    <Button danger onClick={() => remove(name)}>
                                        Eliminar
                                    </Button>
                                    </Space>

                                    <Form.Item
                                        {...restField}
                                        name={[name, 'descripcion']}
                                        rules={[{ required: true, message: 'Descripción requerida' }]}
                                    >
                                        <Input.TextArea placeholder="Descripción" autoSize={{ minRows: 1, maxRows: 6 }} 
                                        style={{ width: '100%' }}/>
                                    </Form.Item>
                                    
                                </Space>
                            ))}
                            <Form.Item>
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                    Agregar tratamiento
                                </Button>
                            </Form.Item>
                        </>
                    )}
                    </Form.List>
                </Form>

            </Modal>

                      
    </>
            
    );
}
