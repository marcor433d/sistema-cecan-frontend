import React from 'react';
import { Typography, Divider } from 'antd';
import "../../../styles/TerminosCondicionesPage.css";

const { Title, Paragraph, Text } = Typography;

export default function TerminosCondicionesPage(){
    return(
        <div className="tc-wrapper">
            <Typography>
                <Title level={1}>Términos y Condiciones</Title>
                <Paragraph><Text type="secondary">Última actualización: 30 de junio de 2025</Text></Paragraph>

                <Title level={2}>1. Aceptación de los Términos</Title>
                <Paragraph>
                Al acceder y usar el sistema “sistema-cecan” (en adelante, “el Servicio”), aceptas quedar vinculado por estos Términos y Condiciones, así como por nuestra <a href="/privacy">Política de Privacidad</a>.
                </Paragraph>

                <Title level={2}>2. Definiciones</Title>
                <Paragraph>
                <Text strong>“Usuario”</Text>: persona física o jurídica que accede al Servicio.<br/>
                <Text strong>“Contenido”</Text>: toda información, datos, funciones o servicios que el Usuario puede encontrar en el Servicio.<br/>
                <Text strong>“Proveedor”</Text>: entidad responsable del desarrollo y mantenimiento del Servicio.
                </Paragraph>

                <Title level={2}>3. Uso del Servicio</Title>
                <Paragraph>
                - El Usuario se compromete a utilizar el Servicio de forma lícita y de acuerdo con estos Términos.<br/>
                - Queda prohibido el uso para cualquier propósito ilegal, difamatorio o infractor de derechos ajenos.
                </Paragraph>

                <Title level={2}>4. Registro y Cuenta</Title>
                <Paragraph>
                - Para acceder a ciertas funcionalidades, el Usuario deberá registrarse proporcionando datos veraces.<br/>
                - El Usuario es responsable de mantener la confidencialidad de su contraseña y notificar inmediatamente cualquier uso no autorizado.
                </Paragraph>

                <Title level={2}>5. Propiedad Intelectual</Title>
                <Paragraph>
                Todos los derechos sobre el diseño, código, marcas y contenidos del Servicio pertenecen al Proveedor. Queda prohibida su reproducción, distribución o transformación sin autorización.
                </Paragraph>

                <Title level={2}>6. Responsabilidad</Title>
                <Paragraph>
                - El Servicio se ofrece “tal cual”; el Proveedor no garantiza su disponibilidad continua ni estará obligado a subsanar errores de inmediato.<br/>
                - En ningún caso el Proveedor será responsable de daños indirectos, lucro cesante o pérdida de datos.
                </Paragraph>

                <Title level={2}>7. Enlaces a Terceros</Title>
                <Paragraph>
                El Servicio puede contener enlaces a sitios de terceros. El Proveedor no se responsabiliza de su contenido ni prácticas de privacidad.
                </Paragraph>

                <Title level={2}>8. Modificaciones</Title>
                <Paragraph>
                El Proveedor se reserva el derecho de modificar estos Términos en cualquier momento. Las nuevas condiciones se publicarán aquí con la fecha de actualización.
                </Paragraph>

                <Title level={2}>9. Legislación Aplicable y Jurisdicción</Title>
                <Paragraph>
                Estos Términos se rigen por las leyes de México. Para cualquier controversia, las partes se someten a los tribunales competentes de Durango, México.
                </Paragraph>

                <Title level={2}>10. Contacto</Title>
                <Paragraph>
                Si tienes dudas sobre estos Términos, contáctanos al correo: <a href="mailto:cecandgo@outlook.com">cecandgo@outlook.com</a>
                </Paragraph>
            </Typography>
        </div>
    );
}