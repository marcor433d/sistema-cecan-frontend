import React,{useEffect,useState} from 'react';
import { changePassword, fetchUserProfile } from '../../../services/userApi';
import {  fetchMeAppointments} from '../../../services/appointmentsApi';
import {  Card, Collapse, Descriptions, Divider, Row, Col,
  Alert, Spin, Table, DatePicker, Tabs, Button, message, Form, Input, Tag} from 'antd';
import './ProfilePage.css';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);
const {Panel} = Collapse;
const ROLES_CON_CITAS = ['MEDICO', 'NUTRICION', 'PSICOLOGIA'];
const{RangePicker} = DatePicker;
const{TabPane} = Tabs;

export default function ProfilePage() {
    

    const[user,setUser] = useState(null);
    const [citas,setCitas] = useState([]);
    const[loadingUser,setLoadingUser] = useState(true);
    const[loadingCitas,setLoadingCitas] = useState(true);
    const[errorUser,setErrorUser] = useState(null);
    const[errorCitas,setErrorCitas] = useState(null);

    //Formulario para cambiar contraseñas
    const[pwForm]= Form.useForm();
    const[pwSubmitting,setPwSubmitting]= useState(false);

    const [dateRange, setDateRange] = useState([dayjs(), dayjs()]);
    const [activeEstado, setActiveEstado] = useState('ALL');

    //Carga el perfil
    useEffect(() => {
        (async () => {
            try{
                //Perfil
                const { data } = await fetchUserProfile();
                setUser(data);
            } catch(err) {
                setErrorUser(err);
            } finally {
                setLoadingUser(false);
            }
        })();
    },[]);

    //Si el rol está en ROLES_CON_CITAS, cargo sus citas
    useEffect(() => {
        if(!user || !ROLES_CON_CITAS.includes(user.rol)) return;
        setLoadingCitas(true);
        fetchMeAppointments(user.cedula)
            .then(({data}) => 
                setCitas(data)
            )
            .catch (err => setErrorCitas(err))
            .finally(() => setLoadingCitas(false));

    },[user]);

    // prefiltrado por rango y estado:
  const mostradas = activeEstado === 'ALL'
    ? citas
    : citas
        .filter(c => {
        const f = dayjs(`${c.fecha}T${c.hora}`);
        return f.isBetween(dateRange[0].startOf('day'), dateRange[1].endOf('day'), null, '[]');
        })
        .filter(c => c.estado === activeEstado);

    if(errorUser) return <Alert type="error" message="Error al cargar perfil"/>;

    //cambio de contraseña enviar formulario
    const onFinishChangePw = async ({oldPassword, newPassword}) => {
        setPwSubmitting(true);
        try {
            await changePassword({oldPassword,newPassword});
            message.success('Contraseña cambiada correctamente');
            pwForm.resetFields();
        } catch(err) {
            const msg = err.response?.data || 'Error al cambiar la contraseña';
            message.error(msg);
        } finally {
            setPwSubmitting(false);
        }
    };

    return(
        <div className='profile-container'>
            {loadingUser
                ? (<div style={{ textAlign: 'center', padding: 48}}>
                    <Spin size= "large" />
                </div>)
                : (
                    <Card title="Mi Perfil" className='profile-card'>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Descriptions column={1} bordered size='small'>
                                    <Descriptions.Item label="Cédula">{user.cedula}</Descriptions.Item>
                                    <Descriptions.Item label="Nombre">{user.nombre}</Descriptions.Item>
                                    <Descriptions.Item label="Apellido Paterno">{user.apellidoPaterno}</Descriptions.Item>
                                </Descriptions>
                            </Col>
                            <Col span={12}>
                                <Descriptions column={1} bordered size='small'>
                                    <Descriptions.Item label="Apellido Materno">{user.apellidoMaterno || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="Teléfono">{user.telefono || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="Correo">{user.correo}</Descriptions.Item>
                                </Descriptions>
                            </Col>
                        </Row>

                        <Divider />

                        <Row gutter={16}>
                            <Col span={12}>
                                <Descriptions column={1} bordered size="small">
                                    <Descriptions.Item label="Rol">{user.rol}</Descriptions.Item>
                                    <Descriptions.Item label="Puesto">{user.puesto}</Descriptions.Item>
                                </Descriptions>
                            </Col>
                        </Row>
                    </Card>
                )
            }

            {/* Sección para cambiar contraseñas */}
            <Collapse style = {{ margin:'24px 0' }}>
                <Panel header="Cambiar contraseña" key="pw">
                    <Form
                        form={pwForm}
                        layout='vertical'
                        onFinish={onFinishChangePw}
                        style={{ maxWidth: 400}}
                    >
                        <Form.Item
                            name="oldPassword"
                            label="Contraseña actual"
                            rules={[{required: true, message: 'Ingresa tu contraseña actual'}]}
                        >
                            <Input.Password/>
                        </Form.Item>
                        <Form.Item
                            name="newPassword"
                            label="Nueva contraseña"
                            rules={[{required: true, message: 'Ingresa la nueva contraseña'}]}>
                                <Input.Password/>
                            </Form.Item>
                        <Form.Item
                            name="confirm"
                            label="Confirma nueva contraseña"
                            dependencies={['newPassword']}
                            rules={[
                                {required: true, message: 'Confirma tu nueva contraseña'},
                                ({getFieldValue}) => ({
                                    validator(_,value) {
                                        if(!value || getFieldValue('newPassword')=== value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Las contraseñas no coinciden'));  
                                    },
                                }),
                            ]}
                            >
                                <Input.Password/>
                            </Form.Item>
                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={pwSubmitting}
                                >
                                    Cambiar contraseña
                                </Button>
                            </Form.Item>
                    </Form>
                </Panel>
            </Collapse>
            
            {/*Solo para médicos, nutricionistas, psicologos se muestra "Mis citas" */}
            {ROLES_CON_CITAS.includes(user?.rol)&& (
            <Card title= "Mis Citas" className='citas-card'>
                 <Row justify="space-between" style={{ marginBottom: 16 }}>
                    <Col>
                        <RangePicker
                            value={dateRange}
                            onChange={r => r && setDateRange(r)}
                        />
                        <Button
                            style={{marginLeft: 8}}
                            onClick={() => {
                                if(activeEstado === 'ALL'){
                                    message.info('Para filtrar por fecha selecciona un estado distinto de "Todas".');
                                }else {
                                setDateRange([dayjs(), dayjs()]);
                            }
                        }}>
                            Hoy
                        </Button>
                    </Col>
                    <Col>
                        <Tabs
                            activeKey='activeEstado'
                            onChange={setActiveEstado}
                            style={{marginBottom: 16}}
                        >
                            <TabPane tab="Todas" key="ALL" />
                            <TabPane tab="Programadas" key="PROGRAMADA" />
                            <TabPane tab="En Curso"   key="EN_CURSO"  />
                            <TabPane tab="Realizadas" key="REALIZADA" />
                            <TabPane tab="Canceladas" key="CANCELADA" />
                        </Tabs>
                    </Col>
                </Row>

                {errorCitas && <Alert type='error' message="Error al cargar citas"  style={{ marginBottom: 16 }} />}

                {loadingCitas
                    ? <Spin/>
                    : mostradas.length > 0
                        ? <Table
                            dataSource={mostradas}
                            rowKey="idCita"
                            pagination={false}
                            rowClassName={rec => {
                                switch(rec.estado){
                                    case 'PROGRAMADA': return 'fila-programada';
                                    case 'EN_CURSO':   return 'fila-encurso';
                                    case 'REALIZADA':  return 'fila-realizada';
                                    case 'CANCELADA':  return 'fila-cancelada';
                                    default:           return '';
                                    }
                            }}
                            columns={[
                                { title: 'Expediente', dataIndex: 'numExpediente' },
                                { title: 'Paciente', dataIndex: 'pacienteNombre'},
                                { title: 'Inicio',
                                render: (_,r) => `${r.fecha} ${r.hora}` },
                                { title: 'Fin',
                                render: (_,r) => `${r.fechaFin} ${r.horaFin}` },
                                { title: 'Motivo',   dataIndex: 'motivo' },
                                { title: 'Estado',   dataIndex: 'estado', render: e => <Tag className={`tag-estado tag-${e.toLowerCase()}`}>{e}</Tag>},
                                { title: 'Tipo',     dataIndex: 'tipo', render: t => <Tag className={`tag-tipo tag-${t.toLowerCase()}`}>{t}</Tag>},
                            ]}
                        />
                        : <Alert type='info' message="No hay citas en ese rango/estado."/>
                        }
            </Card>
            )}
        </div>
    );
}