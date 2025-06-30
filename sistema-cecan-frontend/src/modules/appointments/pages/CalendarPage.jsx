import React,{ useRef, useState, useCallback, useEffect, useContext} from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import  timeGridPlugin  from '@fullcalendar/timegrid';
import esLocale from '@fullcalendar/core/locales/es';
import interactionPlugin from '@fullcalendar/interaction';
import { Button, Modal, Form, DatePicker, TimePicker, Select, Input, message, Space, Spin, Card, Descriptions, Divider, Popconfirm,Typography, Alert } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { fetchCalendarEvents, fetchCreateAppointments, fetchUpdateAppointments,
        fetchDeleteAppointment, fetchUpdateAppointmentStatus, fetchCreateFestivos,
        fetchUpdateFestivos, fetchDeleteFestivos, fetchCreateAusencias,
        fetchUpdateAusencias, fetchDeleteAusencias, 
        fetchUserAusencias} from '../../../services/appointmentsApi';
import { fetchTipoCitas, fetchEstadoCitas } from '../../../services/enumsApi';
import moment from 'moment';
import { fetchUsers } from '../../../services/userApi';
import { AuthContext } from '../../../context/AuthContext';
import { useLoading } from "../../../hooks/useLoading";
import AbsenceDatePicker from '../../../components/AbsenceDatePicker';
import EventLegend from '../../../components/EventLegend';

const { Title } = Typography;

export default function CalendarPage(){

    const [loading, setLoading] = useLoading({
        calendar: true,
        appointment: false,
        festivo: false,
        ausencia: false,
        update: false,
    });
    const[events, setEvents] = useState([]);
    
    const calendarRef = useRef(null);
    const[modalVisible, setModalVisible] = useState(false);
    const[form]=Form.useForm();
    const tipoValue = Form.useWatch('tipo',form);
    const[tipoCitas,setTipoCitas]=useState([]);
    const[medicos, setMedicos]=useState([]);
    const lastRange = useRef({start: null, end: null});
    const[estadoOptions, setEstadoOptions] = useState([]);


    //Estado y modal para detalle
    const[detailVisible, setDetailVisible] = useState(false);
    const[selectedEvent, setSelectedEvent] = useState(null);

    //Editar
    const[editVisible, setEditVisible] = useState(false);
    const[editForm] = Form.useForm();
    const editTipoValue = Form.useWatch('tipo',editForm);

    //Cambio de estado
    const [statusVisible, setStatusVisible] = useState(false);
    const [statusForm] = Form.useForm();

    //Estado para filtrar
    const [filtroMedico, setFiltroMedico] = useState(null);

    //Modales para festivos y ausencias
    const [festivoModalVisible,setFestivoModalVisible] = useState(false);
    const [ausenciaModalVisible, setAusenciaModalVisible] = useState(false);
    const [festivoForm] = Form.useForm();
    const[ausenciaForm] = Form.useForm();
    const [festivoDetailVisible, setFestivoDetailVisible] = useState(false);
    const [selectedFestivo, setSelectedFestivo] = useState(null);
    const[ausenciaDetailVisible, setAusenciaDetailVisible] = useState(false);
    const [selectedAusencia, setSelectedAusencia] = useState(null);
    const [festivoEditVisible, setFestivoEditVisible] = useState(false);
    const[ausenciaEditVisible, setAusenciaEditVisible] = useState(false);


    //Chequeo de usuario
    const { user } = useContext(AuthContext);
    const isAdminOrAdmision = ['ADMIN', 'ADMISION'].includes(user.rol);
    const [userAbsences, setUserAbsences] = useState([]);
    //Colores
    const EVENT_COLORS = {
            CLINICA_DE_HERIDAS_Y_ESTOMAS:   '#4e73df',
            LABORATORIO:                    '#1cc88a',
            NUTRICION:                      '#36b9cc',
            CONSULTA:                       '#007bff',
            PRECONSULTA:                    '#6610f2',
            CLINICA_DEL_DOLOR:              '#e74a3b',
            PSICOLOGIA:                     '#f6c23e',
            MASTOGRAFIA:                    '#d63384',
            ULTRASONIDO:                    '#20c997',
            CUIDADOS_PALIATIVOS:            '#fd7e14',
            MASTOGRAFIA_MATUTINA:           '#6f42c1',
            VALORACIONES_PRE_ANESTESICAS:   '#343a40',
            FESTIVO:                        '#dc3545',
            AUSENCIA:                       '#fd7e14',
    };
    //Errores
    const [errorCalendar, setErrorCalendar] = useState(null);
    const [appointmentError, setAppointmentError] = useState(null);
    const [festivoError,setFestivoError] = useState(null);
    const [ausenciaError, setAusenciaError] = useState(null);

    //Mapeo de eventos
    const mapToFCEvent = useCallback(ev => {
        const color = EVENT_COLORS[ev.tipo] || '#3788d8'; // fallback
        return {
            id: ev.id,
            title: ev.title,
            start: ev.start,
            end: ev.end,
            allDay: ev.allDay,
            backgroundColor: color,
            borderColor:     color,
            textColor:       '#fff',
            extendedProps: {
            tipo:             ev.tipo,
            estado:           ev.estado,
            motivo:           ev.motivo,
            usuarioCedula:    ev.usuarioCedula,
            curpProvisional:  ev.curpProvisional,
            nombrePaciente:   ev.nombrePaciente,
            pacienteExpediente: ev.pacienteExpediente
            }
        };
    }, [EVENT_COLORS]);

    //Función de carga inicial de opciones de tipo de cita y médicos
    const loadFormOptions = useCallback(async () => {
        try {
            const [tipoRes, usersRes] = await Promise.all([
                fetchTipoCitas(),
                fetchUsers()
            ]);
            setTipoCitas(tipoRes.data);
            setMedicos(usersRes.data.filter(u => ['MEDICO', 'NUTRICIONISTA', 'PSICOLOGIA'].includes(u.rol))); 
        } catch (err) {
            message.error('Error cargando opciones: ' + (err.response?.data || err.message));
        }
    }, [])
    //Load  para cargar opciones al principio
    useEffect(() => {
        fetchEstadoCitas()
            .then((res) => setEstadoOptions(res.data))
            .catch(() => message.error('No se pudieron cargar los estados'));
        
        loadFormOptions();
    },[loadFormOptions])

    //Carga inicial de citas
    const handleDatesSet = useCallback(async({startStr, endStr}) => {
        if(lastRange.current.start === startStr && lastRange.current.end === endStr ) {
            return;
        }
        lastRange.current = { start: startStr, end: endStr};
        setErrorCalendar(null);
        setLoading({type: 'SET', key: 'calendar', value: true});
        try{
            const {data} = await fetchCalendarEvents(startStr, endStr, filtroMedico);
            setEvents(data.map(mapToFCEvent));
        } catch(e){
            const backendMsg=
            e.response?.data?.message
            ?? e.response?.data
            ?? e.message;
        setErrorCalendar(backendMsg);
        } finally {
            setLoading({type: 'SET', key: 'calendar', value: false});
        }
    }, [filtroMedico, mapToFCEvent, setLoading]);

    const openModal = () => {
        setModalVisible(true);
        setAppointmentError(null);
        loadFormOptions();
       
    };

    //Manejador para crear citas
    const handleCreate = async (values) => {
        setLoading({type: 'SET', key: 'appointment', value: true});

            const payload = {
                fecha: values.fecha.format('YYYY-MM-DD'),
                hora: values.hora.format('HH:mm'),
                fechaFin: values.fechaFin.format('YYYY-MM-DD'),
                horaFin: values.horaFin.format('HH:mm'),
                motivo: values.motivo,
                tipo: values.tipo,
                estado: 'PROGRAMADA',
                usuario: { cedula: values.usuarioCedula},
                ...(values.tipo === 'PRECONSULTA'
                    ? { curpProvisional: values.curpProvisional,
                        nombrePaciente: values.nombrePaciente
                    }
                    : {paciente: { numExpediente: values.pacienteExpediente}}
                ),
            };

            try{
            const {data: resp} = await fetchCreateAppointments(payload);


                //Mapeo la respuesta al FullCalendar event
                const newEvent ={
                    id: resp.id,
                    title: resp.title,
                    start: resp.start,
                    end:   resp.end,
                    allDay: resp.allDay,
                    extendedProps: {
                        tipo: resp.tipo,
                        estado: resp.estado,
                        motivo: resp.motivo,
                    }
                };

            message.success('Cita agendada correctamente');
            calendarRef.current.getApi().refetchEvents();
            setModalVisible(false);
            form.resetFields();
            //fuerza un refresco de la vista actual
            calendarRef.current.getApi().addEvent(newEvent);
            setEvents(prev => [...prev, newEvent]);
            } catch(e) {
                const msg = e.response?.data?.message
                    ?? e.response?.data
                    ?? e.message;
                setAppointmentError(msg);
            } finally {
                setLoading({type: 'SET', key: 'appointment', value: false});
            }
    };

    //Manejador para borrar citas
    const handleDelete = async () => {
        try {
            await fetchDeleteAppointment(selectedEvent.id);
            calendarRef.current.getApi().getEventById(selectedEvent.id).remove();
            setEvents((prev) => prev.filter((ev) => ev.id !== selectedEvent.id));
            message.success('Cita eliminada');
            calendarRef.current.getApi().refetchEvents();
            setDetailVisible(false);
        } catch(e){
            message.error(e.response?.data ||'Error elimando cita');
        }
    };

    const openEdit = () => {
        if(selectedEvent.usuarioCedula){
        handleUserSelect(selectedEvent.usuarioCedula);
        }
        
        editForm.setFieldsValue({
            tipo: selectedEvent.tipo,
            usuarioCedula: selectedEvent.usuarioCedula,
            fecha:moment(selectedEvent.start),
            hora: moment(selectedEvent.start),
            fechaFin: moment(selectedEvent.end),
            horaFin: moment(selectedEvent.end),
            motivo: selectedEvent.motivo,

            //Solo uno de estos bloques según el tipo
            ...(selectedEvent.tipo === 'PRECONSULTA'
                ? {
                    curpProvisional: selectedEvent.curpProvisional,
                    nombrePaciente: selectedEvent.nombrePaciente,
                }
                : {
                    pacienteExpediente: selectedEvent.pacienteExpediente,
                }
            ),
        });

        setEditVisible(true);
    };

    const handleEdit = async values => {
        setLoading({type: 'SET', key: 'update', value: true});
        setAppointmentError(null);
        try{
            const payload = {
                tipo: values.tipo,
                estado: values.estado,
                usuario: {cedula: values.usuarioCedula},
                fecha: values.fecha.format('YYYY-MM-DD'),
                hora: values.hora.format('HH:mm'),
                fechaFin: values.fechaFin.format('YYYY-MM-DD'),
                horaFin: values.horaFin.format('HH:mm'),
                motivo: values.motivo,
                ...(values.tipo === 'PRECONSULTA'
                    ? {
                        curpProvisional:values.curpProvisional,
                        nombrePaciente: values.nombrePaciente,
                    }
                    : {
                        paciente: {numExpediente: values.pacienteExpediente},
                    }),
             };
            const { data: resp } = await fetchUpdateAppointments(selectedEvent.id, payload);

            const fcEvent = calendarRef.current.getApi().getEventById(selectedEvent.id);
            fcEvent.setProp('title', resp.title);
            fcEvent.setStart(resp.start);
            fcEvent.setEnd(resp.end);
            fcEvent.setExtendedProp('tipo',resp.tipo);
            fcEvent.setExtendedProp('motivo',resp.motivo);
            fcEvent.setExtendedProp('usuario', resp.cedula)
            //actualiza también los props extra si es necesario
            if(resp.curpProvisional !== undefined){
                fcEvent.setExtendedProp('curpProvisional',resp.curpProvisional);
                fcEvent.setExtendedProp('nombrePaciente',resp.nombrePaciente);
            } else {
                fcEvent.setExtendedProp('pacienteExpediente',resp.paciente.numExpediente);
            }
            
            message.success('Cita actualizada correctamente');
            calendarRef.current.getApi().refetchEvents();
            setEditVisible(false);
            setDetailVisible(false);
        } catch(e){
            const msg = e.response?.data?.message 
              ?? e.response?.data 
              ?? e.message;
        setAppointmentError(msg);
        } finally {
            setLoading({type: 'SET', key: 'update', value: false});
        }
    };

    const openStatus = () => {
        statusForm.setFieldsValue({ estado: selectedEvent.estado});
        setStatusVisible(true);
    };
    
    const handleStatus = async values => {
        try {
            const { data: resp } = await fetchUpdateAppointmentStatus(selectedEvent.id, values.estado);
            const fcEvent = calendarRef.current.getApi().getEventById(selectedEvent.id);
            fcEvent.setExtendedProp('estado',resp.estado);
            message.success('Estado actualizado');
            calendarRef.current.getApi().refetchEvents();
            setStatusVisible(false);
            setDetailVisible(false);
        } catch {
            message.error('Error cambiando estado');
        }
    };

    const handleFilterChance = async (cedula) => {
        const filtro = cedula || null;
        setFiltroMedico(filtro);
        
        //obtenemos el rango actualmente visible en el calendario
        const calendarApi = calendarRef.current.getApi();
        const start = calendarApi.view.activeStart.toISOString();
        const end = calendarApi.view.activeEnd.toISOString();

        setLoading({type: 'SET', key: 'calendar', value: true});
        try {
            const { data } = await fetchCalendarEvents(start, end, filtro);
            setEvents(data.map(mapToFCEvent));
        } catch (e) {
            message.error('Error al filtrar citas: '+ (e.response?.data || e.message));
        } finally {
            setLoading({type: 'SET', key: 'calendar', value: false});
        }
    };

    //Manejadores para festivos
    const handleCreateFestivo = async (vals) => {
        setLoading({type: 'SET', key: 'festivo', value: true});
        try{
            await fetchCreateFestivos({
                fecha: vals.fecha.format('YYYY-MM-DD'),
                descripcion: vals.descripcion

            });
            message.success("Festivo creado");
            calendarRef.current.getApi().refetchEvents();
            setFestivoModalVisible(false);
            festivoForm.resetFields();
        } catch (e) {
            setFestivoError(e.response?.data ?? e.message);
        } finally {
            setLoading({type: 'SET', key: 'festivo', value: false});
        }
    };

    const openFestivoEdit = () => {
        festivoForm.setFieldsValue({
            fecha: moment(selectedFestivo.fecha),
            descripcion: selectedFestivo.descripcion
        });
        setFestivoError(null);
        setFestivoEditVisible(true);
    };

    const handleUpdateFestivo = async vals => {
        try {
            await fetchUpdateFestivos(selectedFestivo.id, {
                fecha: vals.fecha.format('YYYY-MM-DD'),
                descripcion: vals.descripcion
            });
            message.success('Festivo actualizado');
            calendarRef.current.getApi().refetchEvents();
            setFestivoEditVisible(false);
            setFestivoDetailVisible(false);
        } catch (e) {
            message.error(e.response?.data || 'Error actualizando día festivo');
        } finally {
            setLoading({type: 'SET', key: 'festivo', value: false});
        }
    };

    const handleDeleteFestivo = async () => {
        try{
            await fetchDeleteFestivos(selectedFestivo.id);
            message.success('Festivo eliminado');
            calendarRef.current.getApi().refetchEvents();
            setFestivoDetailVisible(false);
        }catch(e) {
            message.error(e.response?.data || 'Error eliminando festivo');
        }
    };

    //Manejadores para Ausencias
    const handleCreateAusencia = async (vals) => {
        setLoading({type: 'SET', key: 'ausencia', value: true});
        try{
            await fetchCreateAusencias({
                usuario: {cedula: vals.usuarioCedula},
                fechaInicio: vals.fechaInicio.format('YYYY-MM-DD'),
                fechaFin: vals.fechaFin.format('YYYY-MM-DD'),
                motivo: vals.motivo,
            });
            message.success("Ausencia registrada");
            calendarRef.current.getApi().refetchEvents();
            setAusenciaModalVisible(false);
            ausenciaForm.resetFields();
        } catch (e) {
            setAusenciaError(e.response?.data ?? e.message);
        } finally {
            setLoading({type: 'SET', key: 'ausencia', value: false});
        }
    };

    const openAusenciaEdit = () => {
        ausenciaForm.setFieldsValue({
            usuarioCedula: selectedAusencia.usuarioCedula,
            fechaInicio: moment(selectedAusencia.fechaInicio),
            fechaFin: moment(selectedAusencia.fechaFin),
            motivo: selectedAusencia.motivo
        });
        setAusenciaError(null);
        setAusenciaEditVisible(true);
    };

    const handleUpdateAusencia = async vals => {
        try {
            await fetchUpdateAusencias(selectedAusencia.id, {
                usuario: {cedula: vals.usuarioCedula},
                fechaInicio: vals.fechaInicio.format('YYYY-MM-DD'),
                fechaFin: vals.fechaFin.format('YYYY-MM-DD'),
                motivo: vals.motivo
            });
            message.success("Ausencia actualizada");
            calendarRef.current.getApi().refetchEvents();
            setAusenciaEditVisible(false);
            setAusenciaDetailVisible(false);
        } catch (e) {
            message.error(e.response?.data || 'Error al actualizar ausencia');
        }
    };

    const handleDeleteAusencia = async () => {
        try {
            await fetchDeleteAusencias(selectedAusencia.id);
            message.success('Ausencia eliminada');
            calendarRef.current.getApi().refetchEvents();
            setAusenciaDetailVisible(false);
        } catch (e) {
            message.error(e.response?.data || 'Error eliminando ausencia');
        }
    };

   const handleUserSelect = async (cedula) => {
    try{ 
    const ausencias = await fetchUserAusencias(cedula);
    const ausenciasRaw = ausencias.status === 204 ? [] : ausencias.data;
    const abs = ausenciasRaw.map(a => ({
        start: moment(a.fechaInicio),
        end: moment(a.fechaFin),
    }));
        console.log('ausencias del usuario: ', abs);
        setUserAbsences(abs);
    } catch (e) {
        message.error('Error cargando ausencias del usuario: ' + (e.response?.data || e.message));
        setUserAbsences([]);
    }
   };
 
    return(
        <>
        <Title level={2}>Agenda</Title>
        <Divider/>
        {/*LEYENDA DE COLORES */}
        <EventLegend colors={EVENT_COLORS}/>
        <Divider/>
            <Space style={{marginBottom: 16}}>
                <Select
                    showSearch
                    allowClear
                    placeholder="Filtrar por médico"
                    style={{width: 260}}
                    onChange={handleFilterChance}
                    optionFilterProp='children'
                    >
                        {medicos.map(m => (
                            <Select.Option key={m.cedula} value={m.cedula}>
                                {m.nombre} {m.apellidoPaterno} {m.apellidoMaterno} ({m.cedula})
                            </Select.Option>
                        ))}
                    </Select>
                    
                    {isAdminOrAdmision && (
                      <>  
                        <Button
                            type="primary"
                            icon={<PlusOutlined/>}
                            onClick={openModal}
                            aria-label="Agendar cita"
                        >
                           Agendar cita
                        </Button>
                        <Button
                            onClick={() => setFestivoModalVisible(true)}
                            aria-label="Agregar día festivo"
                        >
                            Agregar día festivo
                        </Button>
                        <Button
                            onClick={() => setAusenciaModalVisible(true)}
                        >
                            Agregar ausencia
                        </Button>
                        </>
                    )}
            </Space>
            {errorCalendar && (
                <Alert
                    style={{marginBottom:16}}
                    type='error'
                    message="Error cargando eventos"
                    description={errorCalendar}
                    closable
                    onClose={() => setErrorCalendar(null)}
                />
            )}
            
                <Spin spinning={loading.calendar} tip='Cargando calendario...' style={{width: '100%'}}>
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
                    initialView='timeGridWeek'
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    /**Hacer que los eventos en la vista de tiempo no se monten encima de otros */
                    slotEventOverlap={false}
                    eventOverlap={false}
                    /*Mostrar cada evento como bloque*/
                    eventDisplay='block'
                    /* Definir duración mínima para la rejilla de tiempo (media hora) para mas espacio  */
                    slotDuration="00:30:00"
                    slotLabelInterval="01:00"
                    /* PPara vistas de mes limitamos cuantos mostrar y agrupamos el resto */
                    dayMaxEvents={3}
                    dayMaxEventRows={true}
                    events={events}
                    eventTimeFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false 
                    }}
                    height="auto"
                    datesSet={handleDatesSet}
                    locales={[esLocale]}
                    locale="es"
                    firstDay={1}
                    dateClick={info => {
                        const calendarApi = info.view.calendar;
                        calendarApi.changeView('timeGridDay', info.date);
                    }}
                    eventClick={info => {
                        const e = info.event;
                        const props = e.extendedProps;
                
                        //Festivo
                        if(props.tipo === 'FESTIVO') {
                            setSelectedFestivo({ id: e.id, fecha: e.start, descripcion: props.motivo});
                            setFestivoDetailVisible(true);
                        }
                        //Ausencia
                        else if(props.tipo === 'AUSENCIA') {
                            setSelectedAusencia({
                                id: e.id,
                                usuarioCedula: props.usuarioCedula,
                                fechaInicio: e.start,
                                fechaFin: e.end,
                                motivo: props.motivo
                            });
                            setAusenciaDetailVisible(true);
                        }
                        else {
                            setSelectedEvent({
                                id: e.id,
                                title: e.title,
                                start: e.start,
                                end: e.end,
                                ...props
                            });
                            setDetailVisible(true);
                        }

                    }}
                />
                </Spin>

            <Modal
                title="Agendar nueva cita"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreate}
                >
                    <Form.Item name="tipo" label="Tipo de cita" rules={[{required: true}]}>
                        <Select onChange={() => {
                            form.setFieldsValue({pacienteExpediente: undefined, curpProvisional:undefined});
                        }}
                        >
                            {tipoCitas.map(t => (
                                <Select.Option key={t} value={t}>
                                    {t}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* Si es PRECONSULTA, muestro CURP, sino expediente */}
                    {tipoValue === 'PRECONSULTA' ? (
                        <>
                            <Form.Item
                                name="curpProvisional"
                                label="CURP provisional"
                                rules={[{
                                        required: true,
                                        message: 'Ingresa el número de expediente'
                                    }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                    name="nombrePaciente"
                                    label="Nombre completo del paciente"
                                    rules={[{ required: true, message: 'Ingresa el nombre del paciente'}]}
                            >
                                <Input placeholder='Ej. Juan Pérez García'/>
                            </Form.Item>
                        </>
                    ) : (
                             <Form.Item
                                name="pacienteExpediente"
                                label="Número de expediente"
                                rules={[{ required: true, message: 'Ingresa la CURP provisional' }]}
                            >
                                <Input />
                            </Form.Item>
                    )}



                    <Form.Item
                        name="usuarioCedula"
                        label="Cédula del usuario"
                        rules={[{required: true, message:'Selecciona a un usuario'}]}
                    >
                         <Select
                            onChange={(value) => {
                                handleUserSelect(value);
                            }}
                            showSearch
                            placeholder="Busca por nombre o cédula..."
                            loading={!medicos.length}
                            optionFilterProp='children'
                            style={{width: '100%'}}
                            >
                                {medicos.map((m) => (
                                    <Select.Option key={m.cedula} value={m.cedula}>
                                        {m.nombre} {m.apellidoPaterno} {m.apellidoMaterno} ({m.cedula})
                                    </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="fecha"
                        label="Fecha de inicio"
                        rules={[{required: true, message: 'Selecciona una fecha'}]}
                    >
                        <AbsenceDatePicker
                            absences={userAbsences}
                            onChange={date => form.setFieldValue('fecha', date)}
                            format='YYYY-MM-DD'
                            placeholder="Selecciona una fecha de inicio...."
                            style={{width: '100%'}}
                        />
                    </Form.Item>
                    <Form.Item
                        name="hora"
                        label="Hora de inicio"
                        rules={[{required: true, message: 'Selecciona una hora'}]}
                    >
                        <TimePicker style={{width: '100%'}} placeholder='Selecciona una hora de inicio...'/>
                    </Form.Item>
                    <Form.Item
                        name="fechaFin"
                        label="Fecha de fin"
                        rules={[{required: true, message: 'Selecciona la fecha de fin'}]}
                    >
                         <AbsenceDatePicker
                            absences={userAbsences}
                            onChange={date => form.setFieldValue('fechaFin', date)}
                            format='YYYY-MM-DD'
                            placeholder="Selecciona una fecha de fin..."
                            style={{width: '100%'}}
                        />
                    </Form.Item>
                    <Form.Item
                        name="horaFin"
                        label="Hora de fin"
                        rules={[{required: true, message: 'Selecciona la hora de fin'}]}
                    >
                        <TimePicker style={{width: '100%'}} placeholder='Selecciona una hora de fin...' />
                    </Form.Item>
                    <Form.Item
                        name="motivo"
                        label="Motivo"
                        rules={[{required: true, message: 'Especifica un motivo'}]}
                    >
                        <Input.TextArea row={2} placeholder='Escribe el motivo de la cita...' />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType='submit'
                            loading={loading.appointment}
                            block
                        >
                            Agendar
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
            {/**Modal para festivos */}
            <Modal
                title="Registrar día festivo en el calendario"
                open={festivoModalVisible}
                onCancel={() => setFestivoModalVisible(false)}
                footer={null}
            >
                {festivoError && (
                    <Alert
                        type="error"
                        message={festivoError}
                        style={{ marginBottom: 16 }}
                        showIcon
                    />
                )}
                <Form
                    form={festivoForm}
                    layout='vertical'
                    onFinish={handleCreateFestivo}
                >
                    <Form.Item
                        name="fecha"
                        label="Fecha"
                        rules={[{required: true, message: 'Selecciona una fecha'}]}
                    >
                        <DatePicker style={{width: '100%'}} placeholder='Selecciona uan fecha de inicio...' />
                    </Form.Item>
                    <Form.Item
                        name="descripcion"
                        label="Descripción"
                        rules={[{required: true, message: 'Ingresa una descripción'}]}
                    >
                        <Input.TextArea rows={2} placeholder='Escribe una descripción del día...'/>
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType='submit'
                            loading={loading.festivo}
                            block
                        >
                            Guardar festivo
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
            {/**Modal para ausencias */}
            <Modal
                title="Registrar ausencia de un médico"
                open={ausenciaModalVisible}
                onCancel={() =>{
                    setAusenciaModalVisible(false);
                    ausenciaForm.resetFields();
                }}
                afterClose={() => {
                    setUserAbsences([]);
                }}
                footer={null}
            >
                {ausenciaError && (
                    <Alert
                        type="error"
                        message={ausenciaError}
                        style={{ marginBottom: 16 }}
                        showIcon
                    />
                )}
                <Form 
                    form={ausenciaForm}
                    layout='vertical'
                    onFinish={handleCreateAusencia}
                >
                    <Form.Item
                        name="usuarioCedula"
                        label="Cédula del usuario"
                        rules={[{required: true, message: 'Selecciona un médico'}]}
                    >
                        <Select 
                            loading={!medicos.length}
                            showSearch
                            placeholder="Busca por nombre o cédula"
                            optionFilterProp='children'
                        >
                            {medicos.map((m) => (
                                <Select.Option key={m.cedula} value={m.cedula}>
                                    {m.nombre} {m.apellidoPaterno} ({m.cedula})
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="fechaInicio"
                        label="Fecha de inicio"
                        rules={[{required: true, message: 'Selecciona la fecha de inicio'}]}
                    >
                        <DatePicker style={{width: '100%'}} placeholder='Selecciona la fecha de inicio...'/>
                    </Form.Item>
                    <Form.Item
                        name="fechaFin"
                        label="Fecha de fin"
                        rules={[{required: true, message: 'Selecciona la fecha de fin'}]}
                    >
                        <DatePicker style={{width: '100%'}} placeholder='Selecciona la fecha de fin...'/>
                    </Form.Item>
                    <Form.Item
                        name="motivo"
                        label="Motivo de ausencia"
                        rules={[{required:true, message: 'Escribe el motivo de ausencia'}]}
                    >
                        <Input placeholder='Ej. Vacaciones, Enfermedad.....' />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type='primary'
                            htmlType='submit'
                            loading={loading.ausencia}
                            block
                        >
                            Guardar ausencia
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
            {/**Modal de detalle */}
            <Modal
                title="Detalle de la cita"
                open={detailVisible}
                footer={null}
                onCancel={() => setDetailVisible(false)}
            >
                {selectedEvent && (
                    <Card 
                        actions={
                            isAdminOrAdmision ? [
                            <Button type='link' onClick={openEdit}>Editar</Button>,
                            <Button type='link' onClick={openStatus}>Cambiar estado</Button>,
                            <Popconfirm title="¿Eliminar esta cita?" onConfirm={handleDelete} okText="Sí" cancelText="No">
                                <Button type='link' danger>Borrar</Button>
                            </Popconfirm>
                        ] : []
                    }
                    >
                        <Descriptions column={1}>
                            <Descriptions.Item label="Paciente">
                                {selectedEvent.title.split('/')[0].replace('Cita: ','')}
                            </Descriptions.Item>
                            <Descriptions.Item label="Médico">
                                {selectedEvent.title.split('/')[1].replace('Dr. ','')}
                            </Descriptions.Item>
                            <Descriptions.Item label="Fecha y hora">
                                {new Date(selectedEvent.start).toLocaleString()} -{' '}
                                {new Date(selectedEvent.end).toLocaleString()}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tipo">
                                {selectedEvent.tipo}
                            </Descriptions.Item>
                            <Descriptions.Item label="Estado">
                                {selectedEvent.estado}
                            </Descriptions.Item>
                            <Descriptions.Item label="Motivo">
                                {selectedEvent.motivo}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                )}
            </Modal>
            {/**Modal de detalle festivo  */}
            <Modal
                title="Detalle del festivo"
                open={festivoDetailVisible}
                footer={null}
                onCancel={() => setFestivoDetailVisible(false)}
            >
                {selectedFestivo && (
                    <Card
                        actions={
                            isAdminOrAdmision ? [
                            <Button type='link' onClick={openFestivoEdit}>Editar</Button>,
                            <Popconfirm
                                title="¿Eliminar este festivo?"
                                onConfirm={handleDeleteFestivo}
                                okText="Sí" cancelText="No"
                            >
                                <Button type="link" danger>Borrar</Button>
                            </Popconfirm>
                                
                        ] : []
                        }
                    >
                        <Descriptions columns={1}>
                            <Descriptions.Item label="Fecha">
                                {new Date(selectedFestivo.fecha).toLocaleDateString()}
                            </Descriptions.Item>
                            <Descriptions.Item label="Descripción">
                                {selectedFestivo.descripcion}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                )}
            </Modal>
            {/**Modal de editar festivo */}
            <Modal
                title="Editar día festivo"
                open={festivoEditVisible}
                footer={null}
                onCancel={() => setFestivoEditVisible(false)}
            >
                <Form
                    form={festivoForm}
                    layout="vertical"
                    onFinish={handleUpdateFestivo}
                >
                    <Form.Item
                        name="fecha"
                        label="Fecha"
                        rules={[{required: true}]}
                    >
                            <DatePicker style={{width: '100%'}} />
                    </Form.Item>
                    <Form.Item
                        name="descripcion"
                        label="Descripción"
                        rules={[{required: true}]}
                    >
                        <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            htmlType="submit"
                            type="primary"
                            block
                        >
                            Guardar cambios
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/**Modal de detalle ausencia */}
            <Modal
                title="Detalle de la ausencia"
                open={ausenciaDetailVisible}
                footer={null}
                onCancel={() => setAusenciaDetailVisible(false)}
            >
                {selectedAusencia && (
                    <Card
                        actions={
                            isAdminOrAdmision ? [
                            <Button type="link" onClick={openAusenciaEdit}>Editar</Button>,
                            <Popconfirm
                                title="¿Eliminar esta ausencia?"
                                onConfirm={handleDeleteAusencia}
                                okText="Sí" cancelText="No"
                            >
                                <Button type="link" danger>Borrar</Button>
                            </Popconfirm>
                        ] : []
                        }
                    >
                        <Descriptions column={1}>
                            <Descriptions.Item label="Usuario">
                                {medicos.find(u => u.cedula === selectedAusencia.usuarioCedula) 
                                    ? `${medicos.find(u => u.cedula === selectedAusencia.usuarioCedula).nombre} ${medicos.find(u => u.cedula === selectedAusencia.usuarioCedula).apellidoPaterno}${medicos.find(u => u.cedula === selectedAusencia.usuarioCedula).apellidoMaterno ? ` ${medicos.find(u => u.cedula === selectedAusencia.usuarioCedula).apellidoMaterno}` : ''} (${selectedAusencia.usuarioCedula})`
                                    : selectedAusencia.usuarioCedula}
                            </Descriptions.Item>
                            <Descriptions.Item label="Desde">
                                {new Date(selectedAusencia.fechaInicio).toLocaleDateString()}
                            </Descriptions.Item>
                            <Descriptions.Item label="Hasta">
                                {new Date (selectedAusencia.fechaFin).toLocaleDateString()}
                            </Descriptions.Item>
                            <Descriptions.Item label="Motivo">
                                {selectedAusencia.motivo}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                )}
            </Modal>
            {/**Modal de editar ausencia */}
            <Modal
                title="Editar ausencia"
                open={ausenciaEditVisible}
                footer={null}
                onCancel={() => setAusenciaEditVisible(false)}
            >
                <Form
                    form={ausenciaForm}
                    layout='vertical'
                    onFinish={handleUpdateAusencia}
                >
                    <Form.Item
                        name="usuarioCedula"
                        label="Cédula del médico"
                        rules={[{required: true}]}
                    >
                        <Select 
                            loading={!medicos.length}
                            showSearch 
                            optionFilterProp='children'
                        >
                            {medicos.map((m) => (
                                <Select.Option key={m.cedula} value={m.cedula}>
                                    {m.nombre} {m.apellidoPaterno} {m.apellidoMaterno} ({m.cedula})
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="fechaInicio"
                        label="Fecha de inicio"
                        rules={[{required: true}]}
                    >
                        <DatePicker style={{width: '100%'}} />
                    </Form.Item>
                    <Form.Item
                        name="fechaFin"
                        label="Fecha de fin"
                        rules={[{required: true}]}
                    >
                        <DatePicker style={{width: '100%'}} />
                    </Form.Item>
                    <Form.Item
                        name="motivo"
                        label="Motivo de ausencia"
                        rules={[{required: true}]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            htmlType="submit"
                            type="primary"
                            block
                        >
                            Guardar cambios
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/** Modal para editar */}
            <Modal
                title="Editar cita"
                open={editVisible}
                footer={null}
                onCancel={() => setEditVisible(false)}
            >
               {appointmentError && (
                    <Alert
                    type="error"
                    message={appointmentError}
                    style={{ marginBottom: 16 }}
                    showIcon
                    closable
                    onClose={() => setAppointmentError(null)}
                    />
                )} 
                <Form
                    form={editForm}
                    layout='vertical'
                    onFinish={handleEdit}
                >
                    <Form.Item
                        name="tipo"
                        label="Tipo de cita"
                        rules={[{required: true}]}
                    >
                    
                        <Select>
                            {tipoCitas.map((t) => (
                                <Select.Option key={t} value={t}>
                                    {t}
                                </Select.Option>)
                            )}
                        </Select>
                    </Form.Item> 
                    {editTipoValue === 'PRECONSULTA' ? (
                        <>
                            <Form.Item
                                name="curpProvisional"
                                label="CURP provisional"
                                rules={[{required:true, message: 'Ingresa la CURP provisional'}]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                name="nombrePaciente"
                                label="Nombre completo del paciente"
                                rules={[{required:true, message: 'Ingresa el nombre del paciente'}]}
                            >
                                <Input placeholder='Ej. Angel Cisneros García' />
                            </Form.Item>
                        </>
                    ) : (
                        <Form.Item
                            name="pacienteExpediente"
                            label="Número de expediente"
                            rules={[{required: true, message: 'Ingresa el número de expediente'}]}
                        >
                            <Input />
                        </Form.Item>
                    )}
                    <Form.Item
                        name="usuarioCedula"
                        label="Cédula del médico"
                        rules={[{required: true, message: 'Selecciona un médico'}]}
                    >
                        <Select
                            onChange={(value) => {
                                handleUserSelect(value);
                            }}
                            showSearch
                            placeholder="Busca por nombre o cédula"
                            loading={!medicos.length}
                            optionFilterProp='children'
                            style={{width: '100%'}}
                            >
                                {medicos.map((m) => (
                                    <Select.Option key={m.cedula} value={m.cedula}>
                                        {m.nombre} {m.apellidoPaterno} {m.apellidoMaterno} ({m.cedula})
                                    </Select.Option>
                            ))}
                        </Select>
                    </Form.Item> 
                    <Form.Item
                        name="fecha"
                        label="Fecha de inicio"
                        rules={[{required: true, message: 'Selecciona una fecha'}]}
                    >
                         <AbsenceDatePicker
                            absences={userAbsences}
                            onChange={date => editForm.setFieldValue('fecha', date)}
                            format='YYYY-MM-DD'
                        />
                    </Form.Item>
                    <Form.Item
                        name="hora"
                        label="Hora de inicio"
                        rules={[{required: true, message: 'Selecciona la hora de inicio'}]}
                    >
                        <TimePicker style={{ width: '100%'}} format="HH:mm"/>
                    </Form.Item>
                    <Form.Item
                        name="fechaFin"
                        label="Fecha de fin"
                        rules={[{required: true, message: 'Selecciona la fecha de fin'}]}
                    >
                         <AbsenceDatePicker
                            absences={userAbsences}
                            onChange={date => editForm.setFieldValue('fechaFin', date)}
                            format='YYYY-MM-DD'
                        />
                    </Form.Item>
                    <Form.Item
                        name="horaFin"
                        label="Hora de fin"
                        rules={[{required: true, message: 'Selecciona la hora de fin'}]}
                    >
                        <TimePicker style={{width: '100%'}} format="HH:mm" />
                    </Form.Item>
                    <Form.Item
                        name="motivo"
                        label="Motivo"
                        rules={[{required: true, message:'Especifica un motivo'}]}
                    >
                        <Input.TextArea row={2} />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type='primary'
                            htmlType='submit'
                            loading={loading.update}
                            block
                        >
                            Guardar cambios
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/**Modal de editar estado */}
            <Modal
                title="Actualizar estado"
                open={statusVisible}
                footer={null}
                onCancel={() => setStatusVisible(false)}
            >
               <Form
                    form={statusForm}
                    layout='vertical'
                    onFinish={handleStatus}
                >
                    <Form.Item
                        name="estado"
                        label="Estado"
                        rules={[{required:true}]}
                    >
                        <Select loading={estadoOptions.length === 0 }>
                            {estadoOptions.map(e => (
                                <Select.Option key={e} value={e}>
                                    {e}
                                </Select.Option>
                            )
                            )}
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type='primary'
                            htmlType='submit'
                            block
                        >
                            Actualizar
                        </Button>
                    </Form.Item>
                </Form> 
            </Modal>

        </>
    );





}