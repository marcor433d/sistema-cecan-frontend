import React from "react";
import { Layout, Menu, Typography, Divider, Avatar, Button } from "antd";
import { CalendarOutlined, TeamOutlined, UserOutlined, BarChartOutlined, LogoutOutlined,} from '@ant-design/icons';
import { useNavigate, Navigate, useLocation, Outlet } from "react-router-dom";

import { useAuth } from "./context/useAuth";

import logo from './styles/logo-cecan.png';

const {Sider, Header, Content, Footer} = Layout;
const { Text } = Typography

const menuItems = [
    { key: 'citas', icon: <CalendarOutlined/>, label: 'Citas', path: '/citas'},
    { key: 'pacientes', icon: <TeamOutlined/>, label: 'Pacientes', path: '/pacientes'},
    { key: 'usuarios', icon: <UserOutlined/>, label: 'Usuarios', path: '/usuarios'},
    { key: 'informes', icon: <BarChartOutlined/>, label: 'Informes', path:'/informes'},
];

function PrivateRoute({children}) {
    const {token} = useAuth();
    return token ? children : <Navigate to="/login" replace />;
}

export default function MainLayout() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { user, logout} = useAuth();

    console.log('MainLayout render, ruta actual:', pathname);
    //Manejador para cerrar sesión
    const handleLogout= (e) =>{
        e.stopPropagation();
        logout(); //limpia el toke y usuario
        navigate('/login');
    };

    //Acción para clickear al avatar
    const onAvatarClick = () => navigate('/perfil');

    //Encuentra la key cuyo path coincide con el inicio de la URL actual
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
                </div>
                <div style={{textAlign: 'center', marginTop: 12}}>
                    <Button
                        className="logout-button"
                        type="text"
                        icon={<LogoutOutlined style={{color: '#fff'}}/>}
                        onClick={handleLogout}
                        style={{marginTop:12,color: '#fff'}}
                    >
                        Cerrar sesión
                    </Button>
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
                <Header style={{background: "#fff", padding: 0, display: 'flex', alignItems: 'center'}}>
                    <img 
                        src={logo} 
                        alt="Mi Logo" 
                        style={{ height: 40, margin: '0 24px' }} 
                    />
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
                Centro Estatal de Cancerología del Estado de Durango ©{new Date().getFullYear()} 
                </Footer>
            </Layout>
        </Layout>
    );
}