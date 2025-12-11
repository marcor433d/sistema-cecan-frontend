/**
 * Página principal del sistema
 */
import React from "react";
import { Typography, Card } from "antd";

const {Title, Paragraph} = Typography;

export default function MenuPage() {
    return (
        <Card
            style={{
                padding: 24,
                textAlign: 'center',
                background: '#fff',
            }}
        >
                <Title level={2}>Bienvenido al Sistema Cecan</Title>
                <Paragraph style={{fontSize: 16}}>
                    Selecciona una opción del menú para comenzar.
                </Paragraph>
        </Card>
    );
}