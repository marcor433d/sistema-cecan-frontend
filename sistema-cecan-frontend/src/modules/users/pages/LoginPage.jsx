/**
 * Página de inicio de sesión.
 * Permite al usuario autenticarse mediante su cédula y contraseña,
 * consumiendo el endpoint de login del backend. Si la autenticación es exitosa,
 * el usuario es redirigido a la vista de citas.
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import {Form,Input, Button, message, Card} from 'antd';
import {login as loginAPI} from '../api';
import { useAuth } from "../../../context/useAuth";
import '../../../styles/LoginPage.css';
import { getLoginErrorMessage } from "../../../utils/errorHandler";

/**
 * Componente funcional para la página de login.
 * Utiliza Ant Design para el formulario y react-router para la navegación.
 */
export default function LoginPage() {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const {login} = useAuth(); // contexto de autenticación
    const[loading, setLoading] = React.useState(false);

    /**
   * Manejador del envío del formulario.
   * @param {Object} values - Valores del formulario.
   * @param {string} values.cedula - Cédula profesional del usuario.
   * @param {string} values.password - Contraseña del usuario.
   */
    const onFinish = async ({cedula, password}) =>{
        setLoading(true);
        try{
            const {data} = await loginAPI({cedula, password});
            //guarda el token en el contexto y localStorage
            //Mira en la consola para confirmar
            console.log('Login response data:',data);
            const jwt= data.token ?? data.accessToken;
            console.log('-> tiken antes de login(): ', jwt);
            login(jwt);
            //redirige a menu
            navigate('/menu');

        }catch(err) {
           const responseData = err.response?.data;
           const status = err.response?.status;
           const errorCode = responseData?.errorCode;
           const messageFromBackend = responseData?.message;

           const friendlyMessage = getLoginErrorMessage(
            status,
            errorCode,
            messageFromBackend
           );
           message.error(friendlyMessage);
            
        } finally {
            setTimeout(() => setLoading(false), 300);
        }
    
};

return(
    <div className="login-wrapper">
        <Card title="Iniciar sesión" style={{ width: 350}}>
            <Form
                form={form}
                name="login"
                layout="vertical"
                onFinish={onFinish}
                initialValues={{cedula: '', password: ''}}
            >
                <Form.Item
                    label="Cédula"
                    name="cedula"
                    rules={[{required: true, message: 'Por favor ingresa tu cédula'}]}
                >
                    <Input placeholder="e.g. AECEM-23925"/>
                </Form.Item>
                
                <Form.Item
                    label="Contraseña"
                    name="password"
                    rules={[{required: true, message: 'Por favor ingresa tu contraseña'}]}
                >
                    <Input.Password placeholder="••••••••"/>
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading}>
                        Entrar
                    </Button>
                </Form.Item>

            </Form>
        </Card>
    </div>
);
}