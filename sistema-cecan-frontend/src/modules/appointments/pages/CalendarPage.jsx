/**
 * Componente principal del calendario de citas.
 * Administra la creación, edición y eliminación de eventos,
 * así como festivos y ausencias.
 *
 * @component
 */
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
import { fetchUsers} from '../../../services/userApi';
import { AuthContext } from '../../../context/AuthContext';
import { useLoading } from "../../../hooks/useLoading";
import AbsenceDatePicker from '../../../components/AbsenceDatePicker';
import EventLegend from '../../../components/EventLegend';
import notificationApi from '../../../services/notificationApi';

const { Title } = Typography;

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
        FESTIVO:                        '#dc3545',
        AUSENCIA:                       '#fd7e14',
        VALORACIONES_DE_MEDICINA_INTERNA:'#343a40' ,
        VALORACIONES_DE_ANESTESICAS: '#063705ff',
};


export default function CalendarPage(){

    const [loading, setLoading] = useLoading({
        calendar: true,
        appointment: false,
        festivo: false,
        ausencia: false,
        update: false,
    });
    
    
    const calendarRef = useRef(null);
    const[modalVisible, setModalVisible] = useState(false);
    const[form]=Form.useForm();
    const tipoValue = Form.useWatch('tipo',form);
    const[tipoCitas,setTipoCitas]=useState([]);
    const[medicos, setMedicos]=useState([]);
    const lastRange = useRef({start: null, end: null});
    const[estadoOptions, setEstadoOptions] = useState([]);

    //filtrado
    const [fullEvents, setFullEvents] = useState([]);
    const[events, setEvents] = useState([]);
    const[filterField, setFilterField] = useState(null);
    const [filterValue, setFilterValue] = useState(null);
    const medicoFilter = (filterField === 'medico' ? filterValue : null)





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
    
    //Errores
    const [errorCalendar, setErrorCalendar] = useState(null);
    const [appointmentError, setAppointmentError] = useState(null);
    const [festivoError,setFestivoError] = useState(null);
    const [ausenciaError, setAusenciaError] = useState(null);

    const notified10Ref = useRef(new Set());
    const notified5Ref = useRef(new Set());

    //CONSOLE LOG
    useEffect(() => {
        console.log('fullEvents', fullEvents);
    }, [fullEvents]);

    useEffect(() => {
        console.log('events filtrados:',events);
    },[events]);

    //manejo de useeffect chequeo de citas
    const eventsRef = useRef([]);
    useEffect(() => { eventsRef.current = events; }, [events]);

    /**
     * Convierte un objeto de cita en el formato que FullCalendar espera.
     * @param {Object} ev - Evento original desde backend.
     * @returns {Object} Evento compatible con FullCalendar.
     */
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
    }, []);

    /**
     * Carga las opciones de tipo de cita y lista de médicos para el formulario.
     */
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
    /**
     * Carga los estados de cita y las opciones del formulario al montar el componente.
     */
    useEffect(() => {
        fetchEstadoCitas()
            .then((res) => setEstadoOptions(res.data))
            .catch(() => message.error('No se pudieron cargar los estados'));
        
        loadFormOptions();
    },[loadFormOptions]);

    /**
     * Aplica los filtros seleccionados (medico, tipo, estado, paciente) sobre todos los eventos.
     */
    useEffect(() => {
        let f = fullEvents;
        if(filterField && filterValue != null){
            switch(filterField){
                case 'medico':
                    f = f.filter(ev => ev.extendedProps.usuarioCedula === filterValue);
                    calendarRef.current.getApi().refetchEvents()
                break;
                case 'tipo':
                    f = f.filter(ev => ev.extendedProps.tipo === filterValue);
                    calendarRef.current.getApi().refetchEvents()
                break;
                case 'estado':
                    f = f.filter(ev => ev.extendedProps.estado === filterValue);
                    calendarRef.current.getApi().refetchEvents()
                break;
                case 'paciente':
                    f = f.filter(ev => ev.extendedProps.pacienteExpediente === filterValue);
                    calendarRef.current.getApi().refetchEvents()
                break;
            }
        }
        setEvents(f);


    }, [fullEvents, filterField,filterValue]);

    useEffect(() => {
    

        const interval = setInterval(async () => {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(),23,59,59);

            console.log("🕷️ Verificando notificaciones", now.toISOString());
            console.log("Eventos en memoria: ", eventsRef.current);


            const todayEvents = eventsRef.current.filter(ev => {
                const start = new Date(ev.start);
                return (
                    start >= todayStart && start <= todayEnd &&
                    ev.extendedProps && ev.extendedProps.estado &&
                    ev.extendedProps.usuarioCedula
                );
            });

            console.log("✅ Eventos que pasan filtro:", todayEvents);



            for(const ev of todayEvents){
                const start = new Date(ev.start);
                const end = new Date(ev.end);

                const usuarioCedula = ev.usuarioCedula || ev.extendedProps?.usuarioCedula;
                const estado = ev.estado || ev.extendedProps?.estado;
                // aseguramos que ev.extendedProps exista antes de usarlo
                if (!ev.extendedProps) continue;

                console.log("📌 Evento listo para notificación:", {
                    id: ev.id,
                    usuarioCedula,
                    estado,
                    start: ev.start
                });

                let nuevoEstado = null;

                if(ev.extendedProps.estado === 'CANCELADA') continue;


                if(now > start && now <= end && ev.extendedProps.estado !== 'EN_CURSO'){
                    nuevoEstado = 'EN_CURSO';
                } else if(now > end && ev.extendedProps.estado !== 'REALIZADA'){
                    nuevoEstado = 'REALIZADA';
                }

                if(nuevoEstado){

                    try{
                        const {data: resp} = await fetchUpdateAppointmentStatus(ev.id,nuevoEstado);
                        const updatedEvent = { ...ev, extendedProps: { ...ev.extendedProps, estado: resp.estado } };

                        //Actualizar localmente
                        setEvents(prev => prev.map(e => e.id === ev.id ? updatedEvent : e));

                        //Actualizar calendario
                        const fcEvent = calendarRef.current.getApi().getEventById(updatedEvent.id);
                        if(fcEvent){
                            fcEvent.setExtendedProp('estado',resp.estado);
                        }


                    }catch(err){
                        console.warn('Error actualizando estado de cita:', err);
                    }

                }else {
                    console.log(`No se cambia estado de ${ev.id}`);
                }
                //Notificación de 10 y 5 minutos
                const diffMs = start - now;
                const diffMin = Math.floor(diffMs / 60000);
                const usuarioId= ev.extendedProps?.usuarioCedula;
                console.log(`⏱️ Evento ${ev.id} - faltan ${diffMin} minutos`);

                try{
                    

                    if(diffMin <= 10 && diffMin > 5 && !notified10Ref.current.has(ev.id)){
                        notified10Ref.current.add(ev.id);
                        await notificationApi.createNotification({
                           mensaje:`La cita de ${ev.extendedProps.pacienteNombre} empieza en 10 minutos`,
                            leida: false,
                            fecha: now.toISOString(),
                            usuario: {cedula: usuarioId},
                            tipo: "CITA",
                            referenciaId: ev.id,
                            referenciaModulo: "citas"
                        });
                        console.log('Notificación de 10 minutos creada');
                    } else if(diffMin <= 5 && diffMin > 0 && !notified5Ref.current.has(ev.id)){
                        notified5Ref.current.add(ev.id);
                        await notificationApi.createNotification({
                           mensaje:`La cita de ${ev.extendedProps.pacienteNombre} empieza en 5 minutos`,
                            leida: false,
                            fecha: now.toISOString(),
                            usuario:{cedula: usuarioId},
                            tipo: "CITA",
                            referenciaId: ev.id,
                            referenciaModulo: "citas"
                        });
                        console.log('Notificación de 5 minutos creada');
                    }
                }catch(err) {
                    console.warn('Error creando notificación:', err);
                }

                }
                
                
        }, 30000);
        return () => clearInterval(interval);
    },[]);

    /**
     * Maneja la carga de citas en el calendario según el rango visible.
     * @param {Object} range - Contiene `startStr` y `endStr` del calendario.
     */
    const handleDatesSet = useCallback(async({startStr, endStr}) => {
        if(lastRange.current.start === startStr && lastRange.current.end === endStr ) {
            return;
        }
        lastRange.current = { start: startStr, end: endStr};
        setErrorCalendar(null);
        setLoading({type: 'SET', key: 'calendar', value: true});
        try{
            const {data} = await fetchCalendarEvents(startStr, endStr, medicoFilter);
            setFullEvents(data.map(mapToFCEvent));

        } catch(e){
            const backendMsg=
            e.response?.data?.message
            ?? e.response?.data
            ?? e.message;
        setErrorCalendar(backendMsg);
        } finally {
            setLoading({type: 'SET', key: 'calendar', value: false});
        }
    }, [medicoFilter, mapToFCEvent, setLoading]);

    /**
     * Abre el modal para crear nueva cita.
     */
    const openModal = () => {
        setModalVisible(true);
        setAppointmentError(null);
        loadFormOptions();
       
    };

    /**
     * Envía una nueva cita al backend y la agrega al calendario.
     * @param {Object} values - Datos del formulario de cita.
     */
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



            message.success('Cita agendada correctamente');
            
            setModalVisible(false);
            form.resetFields();
            //fuerza un refresco de la vista actual
            setEvents(prev => [...prev, resp]);


            } catch(e) {
                const msg = e.response?.data?.message
                    ?? e.response?.data
                    ?? e.message;
                setAppointmentError(msg);
            } finally {
                setLoading({type: 'SET', key: 'appointment', value: false});
            }
    };

    /**
     * Elimina una cita seleccionada del backend y del calendario.
     */
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

    /**
     * Abre el formulario de edición para una cita existente.
     */
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

    /**
     * Actualiza una cita existente en el backend y en el calendario.
     * @param {Object} values - Datos del formulario editado.
     */
    const handleEdit = async values => {
        setLoading({type: 'SET', key: 'update', value: true});
        setAppointmentError(null);
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
             try{
                const { data: resp } = await fetchUpdateAppointments(selectedEvent.id, payload);
                console.log('Respuesta actualización:', resp);

                const updatedEvent = mapToFCEvent(resp);
                //Actualizar solo el evento
                setEvents(prev =>
                    prev.map(ev => ev.id === resp.id ? mapToFCEvent(resp) : ev)
                );

                //Actualizar directamente en calendairo
                const fcEvent = calendarRef.current.getApi().getEventById(updatedEvent.id);
                if (fcEvent) {
                    fcEvent.setProp('title', updatedEvent.title);
                    fcEvent.setStart(updatedEvent.start);
                    fcEvent.setEnd(updatedEvent.end);
                    fcEvent.setProp('backgroundColor', updatedEvent.backgroundColor);
                    fcEvent.setProp('borderColor', updatedEvent.borderColor);
                    fcEvent.setProp('textColor', updatedEvent.textColor);

                    // Props extendidas
                    for (const [key, value] of Object.entries(updatedEvent.extendedProps)) {
                        fcEvent.setExtendedProp(key, value);
                    }
                }

                message.success('Cita actualizada correctamente');
                setModalVisible(false);
                form.resetFields();
                
                
            
        } catch(e){
            const msg = e.response?.data?.message 
              ?? e.response?.data 
              ?? e.message;
        setAppointmentError(msg);
        } finally {
            setLoading({type: 'SET', key: 'update', value: false});
        }
    };

    /**
     * Abre el formulario para cambiar el estado de la cita.
     */
    const openStatus = () => {
        statusForm.setFieldsValue({ estado: selectedEvent.estado});
        setStatusVisible(true);
    };
    
    /**
     * Cambia el estado de una cita en el backend.
     * @param {Object} values - Contiene el nuevo estado.
     */
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

    /*const handleFilterChance = async (cedula) => {
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
    };*/

    /**
     * Crea un nuevo día festivo.
     * @param {Object} vals - Datos del formulario de festivo.
     */
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

    /**
     * Abre el formulario de edición de día festivo.
     */
    const openFestivoEdit = () => {
        festivoForm.setFieldsValue({
            fecha: moment(selectedFestivo.fecha),
            descripcion: selectedFestivo.descripcion
        });
        setFestivoError(null);
        setFestivoEditVisible(true);
    };

    /**
     * Actualiza un día festivo.
     * @param {Object} vals - Datos editados del formulario.
     */
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

    /**
     * Elimina un día festivo.
     */
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

    /**
     * Crea una nueva ausencia para un médico.
     * @param {Object} vals - Datos del formulario de ausencia.
     */
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

    /**
     * Abre el formulario para editar una ausencia.
     */
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

    /**
     * Actualiza una ausencia existente.
     * @param {Object} vals - Datos editados del formulario.
     */
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

    /**
     * Elimina una ausencia.
     */
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

    /**
     * Carga y muestra las ausencias de un médico seleccionado.
     * @param {string} cedula - Cédula profesional del médico.
     */
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
                    placeholder="Selecciona filtro"
                    style={{width: 160}}
                    allowClear
                    value={filterField}
                    onChange={field => {
                        setFilterField(field);
                        setFilterValue(null);
                    }}
                >
                    <Select.Option value="medico">Médico</Select.Option>
                    <Select.Option value="tipo">Tipo de cita</Select.Option>
                    <Select.Option value="estado">Estado</Select.Option>
                    <Select.Option value="paciente">Paciente</Select.Option>
                </Select>
                {/*campo dinámico*/}
                {filterField === 'medico' && (
                    <Select
                        placeholder="Elige un médico"
                        style={{width: 200}}
                        allowClear
                        value={filterValue}
                        onChange={setFilterValue}
                    >
                        {medicos.map(m => (
                            <Select.Option key={m.cedula} value={m.cedula}>
                            {m.nombre} {m.apellidoPaterno} ({m.cedula})
                            </Select.Option>
                        ))}
                    </Select>
                )}
                {filterField === 'tipo' && (
                    <Select
                        placeholder="Elige tipo"
                        style={{width: 160}}
                        allowClear
                        value={filterValue}
                        onChange={setFilterValue}
                    >
                        {tipoCitas.map(t => (
                            <Select.Option key={t} value={t}>{t}</Select.Option>
                        ))}
                    </Select>
                )}
                {filterField === 'estado' && (
                    <Select
                       placeholder="Elige estado"
                        style={{ width: 160 }}
                        allowClear
                        value={filterValue}
                        onChange={setFilterValue}
                    >
                        {estadoOptions.map(e => (
                            <Select.Option key={e} value={e}>{e}</Select.Option>
                        ))}
                    </Select>
                )}
                {filterField === 'paciente' && (
                    <Input
                        placeholder="Busca paciente..."
                        style={{ width: 200 }}
                        value={filterValue || ''}
                        onChange={e => setFilterValue(e.target.value)}
                        allowClear
                    />
                )}

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