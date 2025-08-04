/**
 * Componente `EventLegend`:
 * - Muestra una leyenda de tipos de eventos usando etiquetas (Tags) de colores.
 * Props:
 * - `colors`: objeto con claves tipo de evento y valores de color (ej. {consulta: 'blue'}).
 */
import React from 'react';
import {Space, Tag, Typography} from 'antd';

const { Text } = Typography;
/**
 * Muestra una leyenda con Tags coloreados para cada tipo de evento
 * Props: 
 * colors: {[tipo: string]: string} mapa tipo -> color
 */
export default function EventLegend({colors}) {
    return (
        <div
            style={{
                marginBottom: 24,
            }}
        >
            <Text strong>Tipo de eventos:</Text>
            <Space wrap size={[12,8]} style={{marginTop: 8}}>
                {Object.entries(colors).map(([tipo,color]) => (
                    <Tag
                        key={tipo}
                        color={color}
                        style={{
                            padding: '4px 12px',
                            fontSize: 13,
                            fontWeight: 500,
                            borderRadius: 4
                        }}
                    >
                        {tipo.replace(/_/g,' ')}
                    </Tag>
                ))}
            </Space>
        </div>
    );
};