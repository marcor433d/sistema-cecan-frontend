import React from "react";
import {Badge, Dropdown, List, Spin } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useNotification } from "../../hooks/useNotification";
import NotificationItem from "./NotificationItem";

export default function NotificationBell({cedula}) {
    const { notificaciones, marcarLeida } = useNotification(cedula);
    if (!cedula) return null; // Evita render si no hay cédula

    const unreadCount = notificaciones.filter(n => !n.leida).length;

    const menuItems = {
        items: notificaciones.length > 0
            ? notificaciones.map((item) => ({
                key: item.id,
                label: (
                    <NotificationItem
                        notificacion={item}
                        marcaLeida={marcarLeida}
                    />
                ),
            }))
            : [
                {
                    key: "empty",
                    label: <div style={{ textAlign: "center", color: "#999" }}>No hay notificaciones</div>
                }
            ]
    };

    return (
        <Dropdown menu={menuItems} trigger={['click']} placement="bottomRight">
            <div style={{cursor: "pointer"}}>
                <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                    <BellOutlined style={{ fontSize: 20, cursor: "pointer", marginRight: 24 }} />
                </Badge>
            </div>
        </Dropdown>
    );
}
