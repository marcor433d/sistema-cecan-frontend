/**
 * Clase para crear un informe de estudio socioeconomico
 * Esta clase sirve para dar de alta al paciente
 */

import React, {useEffect, useState, useRef} from "react";
import { Typography, Form, Input, InputNumber, Button, message, Row, Col, DatePicker, Select, Switch, Divider, Card,
 } from "antd";
import { fetchCreateReports } from "../../../services/informesApi";
import moment from 'moment';
import { useAuth } from "../../../context/useAuth";
import { PlusOutlined, MinusCircleOutlined, DownloadOutlined } from "@ant-design/icons";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import InformeSocioeconomicoPDF from "../../../components/InformeSocioeconomicoPDF";
import { fetchDerechoHabiencia, fetchEnfermedadesGD} from "../../../services/enumsApi";
import { useLoading } from "../../../hooks/useLoading";
const {Title} = Typography;
const { TextArea} = Input;
const {Option} = Select;

export default function EstudioSocioeconomicoPage(){
    const [form] = Form.useForm();
    const[tieneEnfCronicas, setTieneEnfCronicas] = useState(false);
    const {user} = useAuth();
    const [loading, dispatchLoading] = useLoading({derechos: false, enfermedades: false,});
    const [derechosOpciones, setDerechosOpciones] = useState([]);
    const [enfermedadesOpciones, setEnfermedadesOpciones] = useState([]);
    const [detalleGuardado, setDetalleGuardado] = useState(null);
    const pdfRef = useRef();

    /**
     * Hook que se ejecuta al montar el componente.
     * Establece valores por defecto y carga catálogos de derechohabiencia y enfermedades.
     */
    useEffect(() => {
        form.setFieldsValue({
            usuarioCedula: user?.cedula || "",
            fechaIngreso: moment(),
        });

        dispatchLoading({type: "SET", key: "derechos", value:true});
        dispatchLoading({type: "SET", key: "enfermedades", value:true});

        fetchDerechoHabiencia()
            .then((resp) => {
                setDerechosOpciones(resp.data || []);
            })
            .catch((err) => {
                console.error("Error cargando Derecho Habiencia:", err);
                message.error("No se pudieron cargar las opciones de Derecho Habiencia");
            })
            .finally(()=> {
                dispatchLoading({ type: "SET", key: "derechos", value: false });
            });

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
    }, [form, user, dispatchLoading]);

    /**
     * Función para procesar y enviar los datos del formulario al backend.
     * @param {Object} values - Datos capturados por el formulario.
     */
    const onFinish = async (values) => {
        try {
            //Procesar "direcciones" (permanente y provisional)
            const direcciones = [
                {
                    nombreVialidad: values.domP_nombreVialidad,
                    numeroExterior: values.domP_numeroExterior,
                    colonia: values.domP_colonia,
                    codigoPostal: values.domP_codigoPostal,
                    responsable: false,
                },
                {
                    nombreVialidad: values.domR_nombreVialidad,
                    numeroExterior: values.domR_numeroExterior,
                    colonia: values.domR_colonia,
                    codigoPostal: values.domR_codigoPostal,
                    responsable: true,
                },
            ];

            const contactos = [];
            if(values.telefono1){
                contactos.push({
                    telefono: values.telefono1,
                    relacion: "propio",
                });
            }
            if(values.telefono2) {
                contactos.push({
                    telefono: values.telefono2,
                    relacion: "propio",
                });
            }
            //Integramtes de familia fijos
            const integrantesFamilia = [];
            integrantesFamilia.push({
                    nombre: values.padreNombre,
                    parentesco: "padre",
                    vive: values.padreVive,
                    responsable: false,
                    edad: values.padreEdad || "",
                    escolaridad: values.padreEscolaidad || "",
                    edoCivil: values.padreEdoCivil || "",
                    ocupacion: values.padreOcupacion || "",
                });
                integrantesFamilia.push({
                    nombre: values.madreNombre,
                    parentesco: "madre",
                    vive: values.madreVive,
                    responsable: false,
                    edad: values.madreEdad || "",
                    escolaridad: values.madreEscolaridad || "",
                    edoCivil: values.madreEdoCivil || "",
                    ocupacion: values.madreOcupacion || "",
                });

                if(values.conyugeNombre && values.conyugeNombre.trim().length > 0){
                    integrantesFamilia.push({
                        nombre: values.conyugeNombre,
                        parentesco: "conyúge",
                        vive: values.conyugeVive,
                        responsable: false,
                        edad: values.conyugeEdad || "",
                        escolaridad: values.conyugeEscolaridad || "",
                        edoCivil: values.conyugeEdoCivil || "",
                        ocupacion: values.conyugeOcupacion || "",
                    });
                }
                integrantesFamilia.push({
                    nombre: values.responsableNombre,
                    parentesco: values.responsableParentesco,
                    vive: true,
                    responsable: true,
                    edad: values.responsableEdad || "",
                    escolaridad: values.responsableEscolaridad || "",
                    edoCivil: values.responsableEdoCivil || "",
                    ocupacion: values.responsableOcupacion || "",
                }); 

            //Procesar otros integrantes (10 filas)
            const otrosIntegrantesRaw = values.otrosIntegrantes || [];
            const otrosIntegrantes = otrosIntegrantesRaw
                .filter((o) => o.nombre && o.nombre.trim().length > 0)
                .map((o) => ({
                    nombre: o.nombre,
                    edad: o.edad,
                    parentesco: o.parentesco,
                    escolaridad: o.escolaridad,
                    edoCivil: o.edoCivil,
                    ocupacion: o.ocupacion,
                    responsable: false,
                }));
            integrantesFamilia.push(...otrosIntegrantes);
            
            //Procesas enfermedades cronicas degenrativas (hasta 4)
            let enfermedadesCronicas = [];
            if (tieneEnfCronicas && Array.isArray(values.enfermedadesGD)) {
                enfermedadesCronicas = values.enfermedadesGD
                    .slice(0,4)
                    .map((nombre) => ({
                        numExpediente: values.numExpediente,
                        nombreEnfermedad: nombre.trim(),
                    }));
            }

            //Procesar dinamica familiar
            const lineasDin = (values.dinamicaFamilia || "")
                .split("\n")
                .map((l) => l.trim())
                .filter((l) => l.length > 0)
                .slice(0,7);
            const dinamicaFamiliar = lineasDin.map((texto)=> ({
                dinamica: texto,
            }));

            //Procesar observaciones
            const lineasObs = (values.observaciones || "")
                .split("\n")
                .map((l) => l.trim())
                .filter((l) => l.length > 0)
                .slice(0,7)
            const observaciones = lineasObs.map((texto) => ({
                observacion: texto,
            }));

            //montar el paylodad
            const payload = {
                cabecera: {
                    tipo: "ESTUDIO_SOCIOECONOMICO",
                    cedula: {
                        cedula: user?.cedula
                    }
                },
                detalle: {
                    paciente: {
                        numExpediente: values.numExpediente,
                        curp: values.curp,
                        nombre: values.nombre,
                        apellidoPaterno: values.apellidoPaterno,
                        apellidoMaterno: values.apellidoMaterno,
                        edadCumplida: values.edadCumplida,
                        sexo: values.sexo,
                        estadoCivil: values.estadoCivil,
                        escolaridad: values.escolaridad,
                        fechaNacimiento: values.fechaNacimiento.format("YYYY-MM-DD"),
                        estadoNacimiento: values.estadoNacimiento,
                        ocupacion: values.ocupacion,
                        derechoHabiencia: values.derechoHabiencia,
                        fechaIngreso: values.fechaIngreso.format("YYYY-MM-DD"),
                        direcciones,
                        contactos,
                        integrantesFamilia,
                        otrosIntegrantes,
                        enfermedadesCronicas,
                    },
                    usuario: {
                        cedula: user?.cedula,
                    },
                    //Campos del estudio
                    quienEnvia: values.quienEnvia,
                    nombreUnidad: values.nombreUnidad,
                    dxMedico: values.dxMedico,
                    ocupacionSosten: values.ocupacionSosten,
                    parentescoSosten: values.parentescoSosten,
                    ingresoMensual: values.ingresoMensual,
                    gastoMensual: values.gastoMensual,
                    tipoVivienda: values.tipoVivienda,
                    gastoAlimentacion: values.gastoAlimentacion,
                    serviciosPublicos: values.serviciosPublicos,
                    regimenVivienda: values.regimenVivienda,
                    otrosServicios: values.otrosServicios,
                    materialVivienda: values.materialVivienda,
                    noHabitaciones: values.noHabitaciones,
                    personasHabitacion: values.personasHabitacion,
                    zonaVivienda: values.zonaVivienda,
                    areaGeografica: values.areaGeografica,
                    noEnfermoFamilia: values.noEnfermoFamilia,
                    noDependientes: values.noDependientes,
                    noTrabajadoresFamilia: values.noTrabajadoresFamilia,
                    servicioPaciente: values.servicioPaciente,
                    nivelAsignado: values.nivelAsignado,
                    dinamicaFamiliar,
                    observaciones,
                },
            };

            //Llamar al backend para crear el informe
            const resp = await fetchCreateReports(payload);
            console.log("RESPUESTA DEL BACKEND:", resp.data);
            const informeGuardado = resp.data;
            setDetalleGuardado(informeGuardado);
            console.log("informeGuardado extraído:", informeGuardado);
            message.success("Informe socioeconómico guardado correctamente");
            //form.resetFields();
        }catch (err) {
            console.error(err);
            message.error(
                err.response?.data || "Error al guardar el Estudio Socioeconómico"
            );
        }
        };

        /**
         * Genera un archivo PDF a partir del componente visual del informe.
         * Utiliza html2canvas + jsPDF.
         */
        const handleGenerarPDF = async () => {
            if (!detalleGuardado) {
                message.warning("Primero guarda el informe para generar el PDF.");
                return;
            }

            try {
                const contenedor = pdfRef.current;
                if (!contenedor) return;

                // Encuentra cada "página" por su clase
                const paginas = contenedor.querySelectorAll(".pagina");
                const pdf = new jsPDF("p", "mm", "a4");
                const pdfWidth = pdf.internal.pageSize.getWidth();

                for (let i = 0; i < paginas.length; i++) {
                const pagina = paginas[i];

                // Dale un breve delay para que renderice estilos
                await new Promise((r) => setTimeout(r, 100));

                const canvas = await html2canvas(pagina, { scale: 2 });
                const imgData = canvas.toDataURL("image/png");

                // Calcula alto manteniendo proporción
                const imgProps = pdf.getImageProperties(imgData);
                const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);

                if (i < paginas.length - 1) {
                    pdf.addPage();
                }
                }

                pdf.save(`EstudioSocioeconomico_${detalleGuardado.numExpediente}.pdf`);
            } catch (error) {
                console.error("Error al generar PDF:", error);
                message.error("Ocurrió un error al crear el PDF.");
            }
            };

        return (
        <div>
            <Card title="Registro de Estudio Socioeconómico" style={{maxWidth: 1000, margin: "auto"}}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    scrollToFirstError
                >
                    {/*seccion paciente*/}
                    <Divider orientation="left">Datos del paciente</Divider>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                        <Form.Item
                            name="numExpediente"
                            label="Número de Expediente"
                            rules={[{required: true, message: "Ingresa el expediente"}]}
                        >
                            <Input placeholder="24-356..."/>
                        </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="curp"
                                label="CURP"
                                rules={[{required: true, message: "Ingresa el CURP"}]}
                            >
                                <Input placeholder="AADM001111HDGNVRA0.." />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="nombre"
                                label="Nombre"
                                rules={[{required: true, message: "Ingresa el nombre"}]}
                            >
                                <Input placeholder="Ej. María..."/>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="apellidoPaterno"
                                label="Apellido Paterno"
                                rules={[{required: true, message: "Ingresa el apellido paterno"}]}
                            >
                                <Input placeholder="Ej. Castillo..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="apellidoMaterno"
                                label="Apellido Materno"
                                rules={[{required:true, message: "Ingresa el apellido materno"}]}
                            >
                                <Input placeholder="Ej. Ramírez..." />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="edadCumplida"
                                label="Edad"
                                rules={[{required: true, message: "Ingresa la edad"}]}
                            >
                                <InputNumber style={{width: "100%"}} min={0} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="sexo"
                                label="Genero"
                                rules={[{required: true, message: "Selecciona el genero"}]}
                            >
                                <Select placeholder="Selecciona">
                                    <Option value="F">Feminino</Option>
                                    <Option value="M">Masculino</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="estadoCivil"
                                label="Estado civil"
                                rules={[{required: true, message: "Selecciona el estado civil"}]}
                            >
                                <Select placeholder="Selecciona">
                                    <Option value="SOLTERO">Soltero(a)</Option>
                                    <Option value="CASADO">Casado(a)</Option>
                                    <Option value="VIUDO">Viudo(a)</Option>
                                    <Option value="DIVORCIADO">Divorciado(a)</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="escolaridad"
                                label="Escolaridad"
                                rules={[{required:true, message: "Ingresa la escolaridad"}]}
                            >
                                <Input placeholder="Ej. Bachillerato" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="fechaNacimiento"
                                label="Fecha de nacimiento"
                                rules={[{required: true, message: "Selecciona la fecha"}]}
                            >
                                <DatePicker placeholder="Selecciona fecha" style={{width: "100%"}} format={"YYYY-MM-DD"} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="estadoNacimiento"
                                label="L. de nacimiento"
                                rules={[{required:true, message: "Ingresa el estado"}]}>
                                    <Input placeholder="Ej. Jalisco" />
                                </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="ocupacion"
                                label="Ocupación"
                                rules={[{required: true, message: "Ingresa la ocupacion"}]}
                            >
                                <Input placeholder="Ej. Ama de casa.."/>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="derechoHabiencia"
                                label="Derecho Habiente"
                                rules={[{required: true, message:"Selecciona la institución"}]}
                            >
                                <Select
                                    placeholder="Selecciona una opción"
                                    loading={loading.derechos}
                                    allowClear
                                >
                                    {derechosOpciones.map((d) => (
                                        <Option key={d} value={d}>
                                            {d.replace(/_/g, " ")}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="fechaIngreso"
                                label="Fecha de alta"
                                rules={[{required:true, message:"Selecciona la fecha"}]}
                            >
                                <DatePicker style={{width:"100%"}} format="YYYY-MM-DD" />
                            </Form.Item>
                        </Col>
                    </Row>
                    {/**Sección direcciones */}
                    <Divider orientation="left">Domicilios</Divider>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Card type="inner" title="Domicilio Permanente" size="small">
                                <Form.Item
                                    name="domP_nombreVialidad"
                                    label="Calle / Avenida"
                                    rules={[{required: true, message: "Ingresa la vialidad"}]}
                                >
                                    <Input placeholder="Av. Principal" />
                                </Form.Item>
                                <Form.Item
                                    name="domP_numeroExterior"
                                    label="Número exterior"
                                    rules={[{required: true, message: "Ingresa el número"}]}
                                >
                                    <Input placeholder="456"/>
                                </Form.Item>
                                <Form.Item
                                    name="domP_colonia"
                                    label="Colonia"
                                    rules={[{required:true, message: "Ingresa la colonia"}]}
                                >
                                    <Input placeholder="Centro" />
                                </Form.Item>
                                <Form.Item
                                    name="domP_codigoPostal"
                                    label="Código Postal"
                                    rules={[{required: true, message:"Ingresa el CP"}]}
                                >
                                    <Input placeholder="44200" />
                                </Form.Item>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12}>
                           <Card type="inner" title="Domicilio Provisional (Responsable)" size="small">
                                <Form.Item
                                    name="domR_nombreVialidad"
                                    label="Calle / Avenida"
                                    rules={[{required: true, message: "Ingresa la vialidad"}]}
                                >
                                    <Input placeholder="Calle Secundaria" />
                                </Form.Item>
                                <Form.Item
                                    name="domR_numeroExterior"
                                    label="Número exterior"
                                    rules={[{required: true, message: "Ingresa el número"}]}
                                >
                                    <Input placeholder="78" />
                                </Form.Item>
                                <Form.Item
                                    name="domR_colonia"
                                    label="Colonia"
                                    rules={[{required: true, message: "Ingresa la colonia"}]}
                                >
                                    <Input placeholder="Barrio Alto" />
                                </Form.Item>
                                <Form.Item
                                    name="domR_codigoPostal"
                                    label="Código Postal"
                                    rules={[{required:true, message: "Ingresa el CP"}]}
                                >
                                    <Input placeholder="44210" />
                                </Form.Item>
                           </Card>
                        </Col>
                    </Row>
                    {/** Seccion contactos (Télefonos) */}
                    <Divider orientation="left">Teléfonos</Divider>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="telefono1"
                                label="Teléfono 1"
                                rules={[{required: true, message: "Ingresa el teléfono 1"}]}
                            >
                                <Input placeholder="61834949455.." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="telefono2" label="Teléfono 2 (opcional)">
                                <Input placeholder="61838484233.."/>
                            </Form.Item>
                        </Col>
                    </Row>
                    {/** Sección de integrantes de familia fijos */}
                    <Divider orientation="left">Integrantes de familia (fijos)</Divider>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Card type="inner" title="Padre" size="small">
                                <Form.Item
                                    name="padreNombre"
                                    label="Nombre del padre"
                                    rules={[{required: true, message: "Ingresa el nombre completo del padre"}]}
                                >
                                    <Input placeholder="Ej. Carlos López..." />
                                </Form.Item>
                                <Form.Item
                                    name="padreVive"
                                    label="VIVE"
                                    valuePropName="checked"
                                    initialValue={true}
                                >
                                    <Switch />
                                </Form.Item>
                                <Form.Item name="padreEdad" label="Edad (opcional)">
                                    <InputNumber style={{width: "100%"}} min={0} />
                                </Form.Item>
                                <Form.Item name="padreEscolaridad" label="Escolaridad (opcional)">
                                    <Input placeholder="Ej. Bachillerato" />
                                </Form.Item>
                                <Form.Item name="padreEdoCivil" label="Edo. Civil (opcional)">
                                    <Input placeholder="Ej. Casado" />
                                </Form.Item>
                                <Form.Item name="padreOcupacion" label="Ocupación (opcional)">
                                    <Input placeholder="Ej. Maestro" />
                                </Form.Item>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Card type="inner" title="Madre" size="small">
                                <Form.Item
                                    name="madreNombre"
                                    label="Nombre de la madre"
                                    rules={[{required: true, message: "Ingresa el nombre completo de la madre"}]}>
                                        <Input placeholder="Ej. Pili Ramírez" />
                                    </Form.Item>
                                    <Form.Item
                                        name="madreVive"
                                        label="VIVE"
                                        valuePropName="checked"
                                        initialValue={true}
                                    >
                                        <Switch />
                                    </Form.Item>
                                    <Form.Item name="madreEdad" label="Edad (opcional)">
                                        <InputNumber style={{width: "100%"}} min={0} />
                                    </Form.Item>
                                    <Form.Item name="madreEscolaridad" label="Escolaridad (opcional)">
                                        <Input placeholder="Ej. Bachillerato" />
                                    </Form.Item>
                                    <Form.Item name="madreEdoCivil" label="Edo. Civil (opcional)">
                                        <Input placeholder="Ej. Casada" />
                                    </Form.Item>
                                    <Form.Item name="madreOcupacion" label="Ocupación (opcional)">
                                        <Input placeholder="Ej. Ama de casa" />
                                    </Form.Item>
                            </Card>
                        </Col>
                    </Row>
                    <Row gutter={16} style={{ marginTop: 16 }}>
                         <Col xs={24} sm={12}>
                             <Card type="inner" title="Cónyuge" size="small">
                                <Form.Item name="conyugeNombre" label="Nombre del Cónyuge">
                                    <Input placeholder="Ej. Maria / Pedro.. " />
                                </Form.Item>
                                <Form.Item
                                    name="conyugeVive"
                                    label="¿Vive?"
                                    valuePropName="checked"
                                    initialValue={true}
                                >
                                    <Switch />
                                </Form.Item>
                                <Form.Item name="conyugeEdad" label="Edad (opcional)">
                                    <InputNumber style={{ width: "100%" }} min={0} />
                                </Form.Item>
                                <Form.Item name="conyugeEscolaridad" label="Escolaridad (opcional)">
                                    <Input placeholder="Ej. Bachillerato" />
                                </Form.Item>
                                <Form.Item name="conyugeEdoCivil" label="Edo. Civil (opcional)">
                                    <Input placeholder="Ej. Casado(a)" />
                                </Form.Item>
                                <Form.Item name="conyugeOcupacion" label="Ocupación (opcional)">
                                    <Input placeholder="Ej. maestro(a)" />
                                </Form.Item>
                             </Card>
                         </Col>
                         <Col xs={24} sm={12}>
                            <Card type="inner" title="Responsable" size="small">
                                <Form.Item
                                    name="responsableNombre"
                                    label="Nombre del Responsable"
                                    rules={[{ required: true, message: "Ingresa el nombre del responsable" }]}
                                >
                                    <Input placeholder="Ej. Luisa Gómez" />
                                </Form.Item>
                                <Form.Item
                                    name="responsableParentesco"
                                    label="Parentesco"
                                    rules={[{ required: true, message: "Ingresa el parentesco" }]}
                                >
                                    <Input placeholder="Ej. Sobrina" />
                                </Form.Item>
                                <Form.Item name="responsableEdad" label="Edad (opcional)">
                                    <InputNumber style={{ width: "100%" }} min={0} />
                                </Form.Item>
                                 <Form.Item name="responsableEscolaridad" label="Escolaridad (opcional)">
                                    <Input placeholder="Ej. Licenciatura" />
                                 </Form.Item>
                                 <Form.Item name="responsableEdoCivil" label="Edo. Civil (opcional)">
                                    <Input placeholder="Ej. Soltera" />
                                 </Form.Item>
                                 <Form.Item name="responsableOcupacion" label="Ocupación (opcional)">
                                     <Input placeholder="Ej. Estudiante" />
                                 </Form.Item>
                            </Card>
                         </Col>
                    </Row>
                    {/* Sección de otros integrantes */}
                    <Divider orientation="left">Otros Integrantes de Familia (opcional)</Divider>
                    <Form.List name="otrosIntegrantes">
                        {(fields, { add, remove }) => (
                            <>
                            {fields.map((field) => (
                                <Card
                                    key={field.key}
                                    size="small"
                                    style={{ marginBottom: 8 }}
                                    title={`Integrante ${field.name + 1}`}
                                    extra={
                                        <MinusCircleOutlined
                                        onClick={() => remove(field.name)}
                                        />
                                    }
                                >
                                    <Row gutter={16}>
                                        <Col xs={24} sm={8}>
                                        <Form.Item
                                            {...field}
                                            name={[field.name, "nombre"]}
                                            label="Nombre"
                                            rules={[{ required: true, message: "Ingresa el nombre" }]}
                                        >
                                            <Input placeholder="Nombre" />
                                        </Form.Item>
                                        </Col>
                                         <Col xs={24} sm={4}>
                                            <Form.Item
                                                {...field}
                                                name={[field.name, "edad"]}
                                                label="Edad"
                                            >
                                                <InputNumber style={{ width: "100%" }} min={0} />
                                            </Form.Item>
                                         </Col>
                                         <Col xs={24} sm={6}>
                                             <Form.Item
                                                {...field}
                                                name={[field.name, "parentesco"]}
                                                label="Parentesco"
                                            >
                                                <Input placeholder="Parentesco" />
                                            </Form.Item>
                                         </Col>
                                         <Col xs={24} sm={6}>
                                            <Form.Item
                                                {...field}
                                                name={[field.name, "escolaridad"]}
                                                label="Escolaridad"
                                            >
                                                <Input placeholder="Escolaridad" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row gutter={16}>
                                        <Col xs={24} sm={6}>
                                            <Form.Item
                                                {...field}
                                                name={[field.name, "edoCivil"]}
                                                label="Edo. Civil"
                                            >
                                                <Input placeholder="Edo. Civil" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={18}>
                                            <Form.Item
                                                {...field}
                                                name={[field.name, "ocupacion"]}
                                                label="Ocupación"
                                            >
                                                <Input placeholder="Ocupación" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>
                            ))}
                            <Form.Item>
                              <Button
                                type="dashed"
                                onClick={() => {
                                    if (fields.length < 10) {
                                    add();
                                    } else {
                                    message.warning("Máximo 10 integrantes");
                                    }
                                }}
                                block
                                icon={<PlusOutlined />}
                                >
                                Agregar Integrante
                                </Button>  
                            </Form.Item>
                            </>
                        )}
                    </Form.List>
                    {/**Sección enfermedades crónicas */}
                    <Divider orientation="left">Enfermedades Crónicas</Divider>
                    <Form.Item
                        name="tieneEnfCronicas"
                        label="¿Tiene enfermedades crónicas?"
                        valuePropName="checked"
                    >
                        <Switch onChange={(checked) => setTieneEnfCronicas(checked)} />
                    </Form.Item>
                    {tieneEnfCronicas && (
                        <Form.Item
                            name="enfermedadesGD"
                            label="Selecciona hasta 4 enfermedades"
                            rules={[
                            {
                                required: true,
                                message: "Selecciona al menos una enfermedad",
                            },
                            ]}
                        >
                            <Select
                            mode="multiple"
                            maxTagCount={4}
                            placeholder="Elige las enfermedades"
                            loading={loading.enfermedades} // tu estado useLoading({ enfermedades: false })
                            allowClear
                            >
                            {enfermedadesOpciones.map((cod) => (
                                <Option key={cod} value={cod}>
                                {cod.replace(/_/g, " ")}
                                </Option>
                            ))}
                            </Select>
                        </Form.Item>
                    )}
                    {/**Sección de datos socieconómicos */}
                    <Divider orientation="left">Datos Socioeconómicos</Divider>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="quienEnvia"
                                label="¿Quién envía al Centro?"
                                rules={[{ required: true, message: "Ingresa quién envía" }]}
                            >
                                <Input placeholder="Ej. Hospital Materno Infantil" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="nombreUnidad"
                                label="Nombre de la Unidad"
                                rules={[{ required: true, message: "Ingresa la unidad" }]}
                            >
                                <Input placeholder="Consultorio 05" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                            name="dxMedico"
                            label="Dx. Médico"
                            rules={[{ required: true, message: "Ingresa el diagnóstico" }]}
                            >
                            <Input placeholder="Ej. CIE-10: J45" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                            name="ocupacionSosten"
                            label="Ocupación del Sosten Económico"
                            rules={[{ required: true, message: "Ingresa la ocupación" }]}
                            >
                            <Input placeholder="Chofer" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="parentescoSosten"
                                label="Parentesco con el Paciente"
                                rules={[{ required: true, message: "Ingresa parentesco" }]}
                                >
                                <Input placeholder="Ej. Esposo(a)" />
                                </Form.Item>
                        </Col>
                        <Col xs={24} sm={6}>
                            <Form.Item
                                name="ingresoMensual"
                                label="Ingreso Mensual"
                                rules={[{ required: true, message: "Ingresa el ingreso" }]}
                                >
                                <InputNumber
                                    style={{ width: "100%" }}
                                    min={0}
                                    formatter={(value) =>
                                    `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                    }
                                    parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={6}>
                            <Form.Item
                                name="gastoMensual"
                                label="Gasto Mensual"
                                rules={[{ required: true, message: "Ingresa el gasto" }]}
                                >
                                <InputNumber
                                    style={{ width: "100%" }}
                                    min={0}
                                    formatter={(value) =>
                                    `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                    }
                                    parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    {/**Sección vivienda */}
                    <Divider orientation="left">Vivienda</Divider>
                     <Row gutter={16}>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="tipoVivienda"
                                label="Tipo de Vivienda"
                                rules={[{ required: true, message: "Ingresa el tipo" }]}
                                >
                                <Input placeholder="Ej. Ladrillo / Madera / Otra" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="gastoAlimentacion"
                                label="Gasto en Alimentación"
                                rules={[{ required: true, message: "Ingresa el gasto" }]}
                            >
                                <InputNumber
                                    style={{ width: "100%" }}
                                    min={0}
                                    formatter={(value) =>
                                    `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                    }
                                    parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="serviciosPublicos"
                                label="Servicios Públicos"
                                rules={[{ required: true, message: "Ingresa los servicios" }]}
                            >
                                <Input placeholder="Ej. Luz, Agua, Drenaje" />
                            </Form.Item>
                        </Col>
                     </Row>
                     <Row gutter={16}>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="regimenVivienda"
                                label="Régimen de Vivienda"
                                rules={[{ required: true, message: "Ingresa el régimen" }]}
                            >
                                <Input placeholder="Ej. Propia / Rentada / Prestada" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="otrosServicios"
                                label="Otros Servicios"
                            >
                                <Input placeholder="Ej. Internet / Gas" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="materialVivienda"
                                label="Material de Construcción"
                                rules={[{ required: true, message: "Ingresa el material" }]}
                            >
                                <Input placeholder="Ej. Azotea de Losa / Lamina" />
                            </Form.Item>
                        </Col>
                     </Row>
                     <Row gutter={16}>
                        <Col xs={24} sm={6}>
                            <Form.Item
                                name="noHabitaciones"
                                label="No. Habitaciones"
                                rules={[{ required: true, message: "Ingresa el número" }]}
                            >
                                <InputNumber style={{ width: "100%" }} min={1} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={6}>
                            <Form.Item
                                name="personasHabitacion"
                                label="Pers. por Habitación"
                                rules={[{ required: true, message: "Ingresa el número" }]}
                            >
                                <InputNumber style={{ width: "100%" }} min={1} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={6}>
                            <Form.Item
                                name="zonaVivienda"
                                label="Zona de Ubicación"
                                rules={[{ required: true, message: "Ingresa la zona" }]}
                            >
                                <Select placeholder="Selecciona">
                                    <Option value="RURAL">Rural</Option>
                                    <Option value="URBANA">Urbana</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={6}>
                        <Form.Item
                            name="areaGeografica"
                            label="Área Geográfica"
                            rules={[{ required: true, message: "Ingresa el área" }]}
                        >
                            <Select placeholder="Selecciona">
                                <Option value="LLANURA">Llanura</Option>
                                <Option value="SIERRA">Sierra</Option>
                                <Option value="COSTA">Costa</Option>
                                <Option value="DESIERTO">Desierto</Option>
                                <Option value="SELVA">Selva</Option>
                                <Option value="OTRA">Otra</Option>
                            </Select>
                        </Form.Item>
                        </Col>
                     </Row>
                     {/** Sección de estadisticas FAMILAIRES */}
                     <Divider orientation="left">Datos Familiares</Divider>
                     <Row gutter={16}>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="noEnfermoFamilia"
                                label="Nº Enfermos en la Familia"
                                rules={[{ required: true, message: "Ingresa el número" }]}
                            >
                                <InputNumber style={{ width: "100%" }} min={0} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="noDependientes"
                                label="Dependientes Económicos"
                                rules={[{ required: true, message: "Ingresa el número" }]}
                            >
                                <InputNumber style={{ width: "100%" }} min={0} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="noTrabajadoresFamilia"
                                label="Pers. que laboran en la Familia"
                                rules={[{ required: true, message: "Ingresa el número" }]}
                            >
                                <InputNumber style={{ width: "100%" }} min={0} />
                            </Form.Item>
                        </Col>
                     </Row>
                     {/** SECCIón servicio que recibe */}
                      <Divider orientation="left">Servicio que recibe</Divider>
                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="servicioPaciente"
                                label="Servicio que recibe el Paciente"
                                rules={[{ required: true, message: "Ingresa el servicio" }]}
                            >
                                <Input placeholder="Consulta Ginecológica" />
                            </Form.Item>
                        </Col>
                      </Row>
                      <Divider orientation="left"/>
                      {/**Sección dinámica familiar */}
                      <Divider orientation="left">Dinámica Familiar</Divider>
                      <Form.Item name="dinamicaFamilia" label="Escribe la dinámica (máx. 7 líneas)">
                        <TextArea rows={7} placeholder="Línea 1&#10;Línea 2&#10;... (hasta 7)" />
                    </Form.Item>
                    {/** Seccion observaciones */}
                    <Divider orientation="left">Observaciones</Divider>
                    <Form.Item name="observaciones" label="Escribe las observaciones (máx. 7 líneas)">
                        <TextArea rows={7} placeholder="Línea 1&#10;Línea 2&#10;... (hasta 7)" />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="nivelAsignado"
                                label="Nivel Asignado"
                                rules={[{ required: true, message: "Ingresa el nivel" }]}
                            >
                                <InputNumber style={{ width: "100%" }} min={1} />
                            </Form.Item>
                        </Col>
                    </Row>
                    {/** Boton de envio */}
                    <Form.Item style={{ textAlign: "right" }}>
                        <Button type="primary" htmlType="submit">
                            Guardar Informe
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {/** Bóton de descarga PDF */}
            {detalleGuardado && (
                <div style={{ maxWidth: 1000, margin: "24px auto", textAlign: "center" }}>
                    <Button
                        type="default"
                        icon={<DownloadOutlined />}
                        onClick={handleGenerarPDF}
                    >
                    Descargar / Imprimir Informe (PDF)
                    </Button>
                </div>
            )}
            {/* ========= RENDER INVISIBLE DEL PDF ========= */}
            <div style={{
                position: "absolute",
                top: 0,
                left: "-10000px",
                width: 794,  // debe coincidir con el ancho de .informe-pdf-container (≈ A4)
                height: "auto",
                backgroundColor: "#fff", }}>
                <InformeSocioeconomicoPDF ref={pdfRef} informe={detalleGuardado} />
            </div>
        </div>
        );
    }




    
