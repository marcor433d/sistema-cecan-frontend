import React from "react";
import { useNavigate } from "react-router-dom";
import {Form,Input, Button, message, Card} from 'antd';
import {login as loginAPI} from '../api';
import { useAuth } from "../../../context/useAuth";
import '../../../styles/LoginPage.css';
import { getLoginErrorMessage } from "../../../utils/errorHandler";


export default function LoginPage() {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const {login} = useAuth();
    const[loading, setLoading] = React.useState(false);

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
            //redirige a citas
            navigate('/citas');

        }catch(err) {
            const status = err.response?.status;
            const errorObj = err.response?.data;
            const apiMsg = errorObj?.message;
            const errorCode = errorObj?.errorCode;

            const userMsg = getLoginErrorMessage(status,errorCode,apiMsg);
            message.error(userMsg);
        } finally {
            setLoading(false);
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