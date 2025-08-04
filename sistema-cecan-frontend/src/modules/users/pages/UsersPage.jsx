/**
 * Componente para gestión de usuarios del sistema.
 * 
 * Funcionalidades principales:
 * - Visualiza usuarios en una tabla con búsqueda.
 * - Muestra detalles del usuario en un Drawer.
 * - Permite editar, eliminar, cambiar contraseña y crear usuarios.
 * 
 * Requiere rol 'ADMIN' o 'SISTEMAS' para operaciones sensibles (crear, editar, eliminar).
 * 
 * @component
 */
import React, {useEffect, useState} from "react";
import { Table, Input, Drawer, Descriptions, Spin, Alert, Typography, Space, Form, message, Button, Select, Modal, Divider} from 'antd';
import { fetchUsers, fetchUsersSearch, fetchUserByCedula, updateUser,changeUserPassword, deleteUser, createUser } from "../../../services/userApi";
import { useAuth } from "../../../context/useAuth";
import { fetchRoles } from "../../../services/enumsApi";

const { Search } = Input;
const { Title } = Typography;
const { Option } = Select;
const { confirm } = Modal;

export default function UsersPage() {
   const [users, setUsers] = useState([]);
   const [loadingTable, setLoadingTable] = useState(true);
   const [loadingDetail, setLoadingDetail] = useState(false);
   const [error,setError] = useState(null);
   const { user: me } = useAuth();
   const [isEditing, setIsEditing] = useState(false);
   const[drawerVisible, setDrawerVisible] = useState(false);
   const[selectedUser, setSelectedUser] = useState(null);
   const[roles, setRoles] = useState([]);
   const[pwModalVisible, setPwModalVisible] = useState(false);
   const[createModalVisible,setCreateModalVisible]=useState(false);
   const[creating,setCreating]=useState(false);
   const[form] = Form.useForm();
   const[pwForm] = Form.useForm();
   const[createForm]=Form.useForm();
   //Mostrar usuario creado
   const[createdUser, setCreatedUser] =useState(null);
   const[createdPwd,setCreatedPwd] = useState('');
   const[showCreatedModal,setShowCreatedModal] = useState(false);


   /**
     * Efecto inicial que:
     * - Carga todos los usuarios.
     * - Carga los roles disponibles para el formulario.
     */
   useEffect(() => {
    loadAll();
    fetchRoles()
        .then(res => setRoles(res.data))
        .catch(() => message.error('No puede cargar roles'));
   },[]);

   /**
     * Carga todos los usuarios desde el backend y actualiza el estado.
     * Muestra errores si la petición falla.
     */
   const loadAll = async () => {
    setError(null);
    setLoadingTable(true);
    try{
        const {data} = await fetchUsers();
        setUsers(data);
    } catch(err) {
        setError(err);
    } finally {
        setLoadingTable(false);
    }
   };

   /**
     * Realiza búsqueda por nombre o cédula.
     * Muestra resultados en la tabla o limpia si no se encuentran.
     * 
     * @param {string} termino - El texto a buscar.
     */
   const onSearch = async (termino) => {
    setError(null);
    setLoadingTable(true);
    try{
        const resp = await fetchUsersSearch(termino);
        if(resp.status===204){
            setUsers([]);
        } else {
            setUsers(resp.data);
        }
        
    } catch (e) {
        setError(e);
    } finally {
        setLoadingTable(false);
    }
        
   };

   /**
     * Obtiene el detalle de un usuario por cédula y abre el Drawer.
     * 
     * @param {Object} record - Registro seleccionado de la tabla.
     */
const onRowClick = (record) => {
    setDrawerVisible(true);
    setLoadingDetail(true);
    fetchUserByCedula(record.cedula)
        .then(({data}) => {
            setSelectedUser(data);
            form.setFieldsValue(data);
        })
        .catch((err)=> setError(err))
        .finally(()=> setLoadingDetail(false));
};

/**
 * Envía los datos del formulario de edición y actualiza el usuario.
 * 
 * @param {Object} values - Nuevos valores del usuario.
 */
const handleUpdate = async (values) => {
    setError(null);
    setLoadingDetail(true);
    
    try {
        const payload = {...values, cedula: selectedUser.cedula};
        const resp = await updateUser(selectedUser.cedula, payload);
         if(resp.status == 200){
            message.success("Usuario actualizado correctamente.");

            await onRowClick({cedula: selectedUser.cedula});
            await loadAll();
            setIsEditing(false);
         } else {
            message.info('Usuario actualizado, pero sin contenido en la respuesta');
         }
    } catch (e) {
        setError(e);
        message.error(e.response?.data || 'Error actualizando el usuario');
    } finally {
        setLoadingDetail(false);
    }
};

/**
 * Cambia la contraseña del usuario actual.
 * 
 * @param {{newPassword: string}} values - Nueva contraseña a asignar.
 */
const handlePwChange = async ({newPassword}) => {
    setError(null);
    setLoadingDetail(true);
    try {
        await changeUserPassword(selectedUser.cedula,{newPassword});
        message.success('Contraseña actualizada correctamente');
        setPwModalVisible(false);
        pwForm.resetFields();
    } catch(err){
        message.error(err.response?.data || 'Error al cambiar contraseña');
    } finally {
        setLoadingDetail(false);
    }
};

/**
 * Muestra un modal de confirmación y elimina el usuario si se acepta.
 */
const handleDelete = () => {
    confirm({
        title:  `¿Eliminar a ${selectedUser.nombre}? `,
        content: "Esta acción no se puede deshacer.",
        okText:"Sí, eliminar",
        okType: "danger",
        cancelText: "Cancelar",
        onOk: async() => {
            try {
                await deleteUser(selectedUser.cedula);
                message.success("Usuario eliminado");
                setDrawerVisible(false);
                loadAll(); //Refresca la tabla
            } catch(e) {
                message.error(e.response?.data || "Error al eliminar usuario");
            }
        },
    });
};

/**
 * Abre el modal para crear un nuevo usuario.
 */
const openCreate = () => {
    setCreateModalVisible(true);
    createForm.resetFields();
};

/**
 * Crea un nuevo usuario con los datos ingresados.
 * Muestra la contraseña generada automáticamente.
 * 
 * @param {Object} values - Datos del nuevo usuario.
 */
const handleCreate = async values => {
    setCreating(true);
    try{
        const { data } = await createUser(values);
        setCreatedUser(data.user);
        setCreatedPwd(data.rawPwd);
        setShowCreatedModal(true);
        message.success("Usuario creado correctamente");
        loadAll();
        setCreateModalVisible(false);
        createForm.resetFields();

    } catch(e) {
        message.error(e.response?.data || "Error creando usuario");
    } finally {
        setCreating(false);
    }
};


const columns = [
    {title: 'Cédula', dataIndex: 'cedula', key: 'cedula'},
    {title: 'Nombre', dataIndex: 'nombre', key: 'nombre'},
    {title: 'Ap. Paterno', dataIndex: 'apellidoPaterno', key: 'apellidoPaterno'},
    {title: 'Ap. Materno', dataIndex: 'apellidoMaterno', key: 'apellidoMaterno'},
    {title: 'Correo', dataIndex: 'correo', key: 'correo'},
    {title: 'Rol', dataIndex: 'rol', key: 'rol'},
    {title: 'Puesto', dataIndex: 'puesto', key: 'puesto'},
];

return(
    <Space direction="vertical" style={{width: '100%'}}>
        <Title level={2}>Usuarios del sistema</Title>

         <Divider/>


        <Search
            placeholder="Buscar por nombre o cédula"
            allowClear
            enterButton="Buscar"
            size="middle"
            onSearch={onSearch}
            style={{madWidth: 400}}
        />
        {(me?.rol === "ADMIN" || me?.rol === "SISTEMAS") && (
            <Button type="primary" onClick={openCreate}>
                Agregar usuario
            </Button>
        )}

        {error &&(
            <Alert
                type="error"
                message="Error al cargar usuario"
                description={error.message}
                showIcon
            />
        )}

        <Table
            style={{marginTop: 16}}
            dataSource={users}
            columns={columns}
            rowKey="cedula"
            loading={loadingTable}
            onRow={(record) => ({
                onClick: () => onRowClick(record),
            })}
            pagination={{pageSize: 10}}
            bordered
            size="middle"
        />

        <Drawer
            width={500}
            title={isEditing ? "Editar usuario" : "Detalle de usuario"}
            placement="right"
            onClose={() =>setDrawerVisible(false)}
            open={drawerVisible}
            footer={isEditing && (
                <Space style={{width: '100%', justifyContent: 'end' }}>
                    <Button onClick={() => setIsEditing(false)}>
                        Cancelar
                    </Button>
                    <Button type="primary" onClick={() => form.submit()}>
                        Guardar
                    </Button>
                </Space>
            )}
        >
            {loadingDetail ? (
                <div style={{ textAlign: 'center', padding: 24 }}>
                    <Spin tip="Cargando..."/>
                </div>
            ) : selectedUser ?  (
                isEditing ? (
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleUpdate}
                        initialValues={selectedUser}
                    >
                        <Form.Item name="nombre" label="Nombre"
                            rules={[{required: true}]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item name="apellidoPaterno" label="Apellido Paterno"
                            rules={[{required: true}]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item name="apellidoMaterno" label="Apellido Materno">
                            <Input/>
                        </Form.Item>
                        <Form.Item name="telefono" label="Télefono">
                            <Input/>
                        </Form.Item>
                        <Form.Item name="correo" label="Correo"
                            rules={[{required: true}, {type: 'email'}]}
                        >
                            <Input/>
                        </Form.Item>
                        <Form.Item name="rol" label="Rol"
                            rules={[{ required: true }]}
                        >
                            <Select loading={roles.length === 0}>
                                {roles.map(r => (
                                    <Select.Option key={r} values={r}>
                                        {r}
                                    </Select.Option>
                                )
                                )}
                            </Select>
                        </Form.Item>
                        <Form.Item name="puesto" label="Puesto"
                                rules={[{required: true}]}
                        >
                            <Input/>
                        </Form.Item>
                    </Form>
                ) : (
                    <>
                <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="Cédula">
                        {selectedUser.cedula}
                    </Descriptions.Item>
                    <Descriptions.Item label="Nombre">
                        {selectedUser.nombre}
                    </Descriptions.Item>
                    <Descriptions.Item label="Apellido Paterno">
                        {selectedUser.apellidoPaterno}
                    </Descriptions.Item>
                    <Descriptions.Item label="Apellido Materno">
                        {selectedUser.apellidoMaterno || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Teléfono">
                        {selectedUser.telefono || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Correo">
                        {selectedUser.correo}
                    </Descriptions.Item>
                    <Descriptions.Item label="Rol">
                        {selectedUser.rol}
                    </Descriptions.Item>
                    <Descriptions.Item label="Puesto">
                        {selectedUser.puesto}
                    </Descriptions.Item>
                </Descriptions>
                
                {(me?.rol === 'ADMIN' || me?.rol === 'SISTEMAS') && (
                    <Space direction="vertical" style= {{ width: '100%', marginTop: 16}}>
                        <Button
                            type="primary"
                            block
                            onClick={() => setIsEditing(true)}>
                               Actualizar usuario
                            </Button>
                        {me?.rol==='ADMIN' && (
                        <>
                            <Button
                                type="default"
                                block
                                onClick={() => setPwModalVisible(true) }
                            >
                                Cambiar contraseña
                            </Button>

                            <Button
                                danger
                                block
                                onClick={handleDelete}
                            >
                                Eliminar usuario
                            </Button>
                          </>   
                        )}
                       
                    </Space>

                )}
            </>
                )
               
            ) : (
                <Alert type="warning" message="No se encontró el usuario"/>
            )}
        </Drawer>
        <Modal
            title={`Cambiar contraseña: ${selectedUser?.nombre}`}
            open={pwModalVisible}
            onCancel={() => setPwModalVisible(false)}
            footer={null}
        >
            <Form
                form={pwForm}
                layout="vertical"
                onFinish={handlePwChange}
            >
                <Form.Item
                    name="newPassword"
                    label="Nueva contraseña"
                    rules={[{required: true,message: 'Ingresa la nueva contraseña'}]}
                >
                    <Input.Password />
                </Form.Item>
                <Form.Item
                    name="confirm"
                    label="Confirmar contraseña"
                    dependencies={['newPassword']}
                    rules={[
                        { required: true, message: 'Confirma la contraseña'},
                        ({getFieldValue}) => ({
                            validator(_,value) {
                                if(!value || getFieldValue('newPassword') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('Las contraseñas no coinciden'));
                            },
                        }),
                    ]}
                >
                  <Input.Password />  
                </Form.Item>
                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loadingDetail}
                        block
                    >
                        Cambiar contraseña
                    </Button>
                </Form.Item>    
            </Form>
            
        </Modal>
        {/* Creación de usuarios */}
        <Modal
            title="Agregar nuevo usuario"
            open={createModalVisible}
            onCancel={() => setCreateModalVisible(false)}
            footer={null}
        >
            <Form
                form={createForm}
                layout="vertical"
                onFinish={handleCreate}
                initialValues={{rol:roles[0]}}
            >
              <Form.Item
                name="cedula"
                label="Cédula"
                rules={[{required:true,message:"Ingresa la cédula"}]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="nombre"
                    label="Nombre"
                    rules={[{required:true,message:"Ingresa el nombre"}]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="apellidoPaterno"
                    label="Apellido Paterno"
                    rules={[{required:true, message: "Ingresa el apellido paterno"}]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="apellidoMaterno"
                    label="Apellido Materno"
                >
                    <Input/>
                </Form.Item>
                <Form.Item
                    name="telefono"
                    label="Télefono"
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="correo"
                    label="Correo"
                    rules={[{required:true, message: "Ingresa un correo"},
                        {type:"email", message: "Correo inválido"},
                    ]}
                >
                    <Input/>
                </Form.Item>
                <Form.Item
                    name="rol"
                    label="Rol"
                    rules={[{required: true, message: "Selecciona un rol"}]}
                >
                    <Select loading={roles.length === 0}>
                        {roles.map(r => (
                            <Option key={r} value={r}>
                                {r}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item
                    name="puesto"
                    label="Puesto"
                    rules={[{required:true, message: "Ingresa el puesto"}]}
                >
                    <Input />
                </Form.Item>
                <Form.Item>
                    <Space style={{width: "100%", justifyContent: "end"}}>
                        <Button onClick={() => setCreateModalVisible(false)}>
                            Cancelar
                        </Button>
                       <Button type="primary" htmlType="submit" loading={creating}>
                        Crear usuario
                        </Button> 
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
        <Modal
            title="Usuario creado"
            open={showCreatedModal}
            onOk={() => setShowCreatedModal(false)}
            onCancel={() => setShowCreatedModal(false)}
            okText="Cerrar"
            cancelButtonProps={{style: {display: 'none' }}}
        >
            {createdUser && (
                <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="Cédula">
                        {createdUser.cedula}
                    </Descriptions.Item>
                    <Descriptions.Item label="Nombre">
                        {createdUser.nombre}
                    </Descriptions.Item>
                    <Descriptions.Item label="Apellido Paterno">
                        {createdUser.apellidoPaterno}
                    </Descriptions.Item>
                    <Descriptions.Item label="Apellido Materno">
                        {createdUser.apellidoMaterno}
                    </Descriptions.Item>
                    <Descriptions.Item label="Correo">
                        {createdUser.correo}
                    </Descriptions.Item>
                    <Descriptions.Item label="Rol">
                        {createdUser.rol}
                    </Descriptions.Item>
                    <Descriptions.Item label="Puesto">
                        {createdUser.puesto}
                    </Descriptions.Item>
                    <Descriptions.Item label="Contraseña generada">
                        <Typography.Text code>{createdPwd}</Typography.Text>
                    </Descriptions.Item>
                </Descriptions>
            )}
        </Modal>
    </Space> 
    );
}
