/**
 * Componente de diseño principal (layout) que envuelve todas las vistas protegidas por autenticación.
 * Contiene un menú lateral con navegación, encabezado con logo, contenido principal renderizado vía <Outlet />,
 * e información de usuario y botón para cerrar sesión.
 *
 */
import React from "react";
import { Layout, Menu, Typography, Divider, Avatar, Button } from "antd";
import { CalendarOutlined, TeamOutlined, UserOutlined, BarChartOutlined, LogoutOutlined,} from '@ant-design/icons';
import { useNavigate, Navigate, useLocation, Outlet } from "react-router-dom";

import { useAuth } from "./context/useAuth";

import logo from './styles/logo-cecan.png';
import NotificationBell from "./components/notifications/NotificationBell";

const {Sider, Header, Content, Footer} = Layout;
const { Text } = Typography

/**
 * Rutas disponibles en el menú lateral con su icono, etiqueta y ruta.
 * Se utiliza en el componente <Menu />.
 */
const menuItems = [
    { key: 'citas', icon: <CalendarOutlined/>, label: 'Citas', path: '/citas'},
    { key: 'pacientes', icon: <TeamOutlined/>, label: 'Pacientes', path: '/pacientes'},
    { key: 'usuarios', icon: <UserOutlined/>, label: 'Usuarios', path: '/usuarios'},
    { key: 'informes', icon: <BarChartOutlined/>, label: 'Informes', path:'/informes'},
];

/**
 * Ruta protegida que requiere autenticación. Si no hay token, redirige al login.
 *
 * @param {Object} props
 * @param {JSX.Element} props.children - Contenido a mostrar si el usuario está autenticado.
 * @returns {JSX.Element}
 */
function PrivateRoute({children}) {
    const {token} = useAuth();
    return token ? children : <Navigate to="/login" replace />;
}

/**
 * Componente principal del layout de la aplicación.
 * Muestra la barra lateral con navegación, datos del usuario y permite cerrar sesión.
 * El contenido principal se renderiza dentro del componente <Outlet />.
 */
export default function MainLayout() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { user, logout} = useAuth();

    console.log('MainLayout render, ruta actual:', pathname);
    /**
     * Cierra sesión y redirige al login.
     * @param {Event} e - Evento del botón.
     */
    const handleLogout= (e) =>{
        e.stopPropagation();
        logout(); //limpia el toke y usuario
        navigate('/login');
    };

    /**
     * Redirige al perfil del usuario al hacer clic sobre el avatar.
     */
    const onAvatarClick = () => navigate('/perfil');

    /**
     * Determina qué opción del menú está activa en función de la ruta actual.
     */
    const selectedKey = menuItems.find(i=> pathname.startsWith(i.path))?.key;


    return(
        <Layout  style={{ minHeight: "100vh"}} hasSider>
            <Sider width={200} style={{
                background: "#001529",
                position: "sticky",
                height: "100vh",
                top: 0,
            }}>
                {/*Información de usuario */}
                <div className="user-info" style={{
                    padding: 16,
                    textAlign: "center",
                    color: "#fff",
                    cursor: "pointer",
                    }} onClick={onAvatarClick}>

                    <Avatar size={48} icon={<UserOutlined/>}/>
                    <Typography.Text style={{display: 'block', marginTop:8, fontWeight: 'bold', color: '#fff'}}>
                        {user?.nombre} {user?.apellidoPaterno} {user?.apellidoMaterno || ''}
                    </Typography.Text>
                    <Typography.Text style={{display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.85)'}}>
                        {user?.puesto}
                    </Typography.Text>
                    <div style={{marginTop:12}}>
                        <Button
                            className="logout-button"
                            onClick={handleLogout}
                            type="text"
                            icon={<LogoutOutlined />}
                            style={{ color: '#fff' }}
                        >
                            Cerrar sesión
                        </Button>
                    </div>
                </div>

                    <Divider style={{ background: 'rgba(255,255,255,0.3)' }}/>
                
                {/*Menú de navegación*/}
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    items={menuItems}
                    onClick={({ key }) => {
                        const item = menuItems.find(i => i.key === key);
                        if (item) navigate(item.path);
                    }}
                />
            </Sider>

            <Layout style={{
                flex: 1  
            }}>
                <Header style={{background: "#fff", padding: 0, display: 'flex', alignItems: 'center',justifyContent: "space-between"}}>
                    <img 
                        src={logo} 
                        alt="Mi Logo" 
                        style={{ height: 40, margin: '0 24px' }} 
                    />
                    {/* Sección derecha notificaciones, avatar y logout */}
                    <div style= {{ display: "flex", alignItems: "center", gap: "7px", paddingRight: '24px'}}>
                        {user?.cedula ? <NotificationBell cedula={user.cedula} /> : null}
                    </div>

                </Header>
                <Content style={{margin: '24px 16px 0', overflow: 'auto', minWidth: 0,}}>
                    <div style={{
                        padding: 24,
                        background: '#ededed',
                        minHeight: 360,
                        }}>
                            <Outlet/>
                    </div>
                </Content>
                <Footer style={{textAlign: 'center'}}>
                Centro Estatal de Cancerología del Estado de Durango ©{new Date().getFullYear()} |{' '}
                <a href="/privacy">Aviso de Privacidad</a> |{' '}
                <a href="/terms">Términos y Condiciones</a> |{' '}
                <a href="/manual.pdf" download="manual usuario cecan v1.pdf">Manual</a>
                </Footer>
            </Layout>
        </Layout>
    );
}