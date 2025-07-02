import React from 'react';
import { Layout, Typography } from 'antd';
import "../../../styles/PrivacyPolicyPage.css";
const { Content } = Layout;
const { Title, Paragraph, Text, Link} = Typography;

export default function PrivacyPolicyPage(){
    return(
         <Layout className="privacy-wrapper">
            <Content style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
                <Title level={1}>Aviso de privacidad</Title>
                <Paragraph><Text type="secondary">Última actualización: 30 de junio de 2025</Text></Paragraph>
                <Paragraph>
                En el Centro Estatal de Cancerología del Estado de Durango ("nosotros"),
                respetamos su privacidad y nos comprometemos a proteger sus datos personales. Esta Política de Privacidad explica cómo recopilamos, usamos,
                divulgamos y protegemos su información cuando utiliza nuestro servicio de agenda de citas.
                </Paragraph>
                <Title level={2}>1. Responsable del Tratamiento</Title>
                <Paragraph>
                El responsable del tratamiento de sus datos es el Centro Estatal de Cancerología del Estado de Durango, con domicilio en Calle 5 de Febrero, Zona Centro, 34000 Durango, Dgo., México.
                </Paragraph>
                <Title level={2}>2. Datos que Recopilamos</Title>
                <Paragraph>
                Podemos recopilar los siguientes datos:
                </Paragraph>
                <ul>
                <li>Datos de identificación: nombre, cédula, CURP.</li>
                <li>Datos de contacto: correo electrónico, teléfono.</li>
                <li>Datos de salud: motivo de cita, historial médico de pacientes y su información personal.</li>
                </ul>
                <Title level={2}>3. Finalidades del Tratamiento</Title>
                 <ul>
                    <li>Proporcionar y mantener el servicio de citas médicas.</li>
                    <li>Enviar confirmaciones y recordatorios de citas (a través de SMS o correo).</li>
                    <li>Mejorar su experiencia y optimizar nuestras funcionalidades.</li>
                    <li>Cumplir con obligaciones legales y contractuales.</li>
                </ul>
                <Title level={2}>4. Bases Legales</Title>
                <Paragraph>
                Tratamos sus datos personales con base en su consentimiento, la ejecución de un contrato y el cumplimiento de obligaciones legales,
                según lo establecido por la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.
                </Paragraph>
                <Title level={2}>5. Transferencias y Terceros</Title>
                <Paragraph>
                Sus datos pueden transferirse a:
                </Paragraph>
                <ul>
                <li>Proveedores de SMS (Twilio), bajo cláusula de confidencialidad.</li>
                <li>Proveedores de correo electrónico y analíticas (p.ej. Google Analytics).</li>
                <li>Autoridades competentes, cuando sea requerido por ley.</li>
                </ul>
                <Title level={2}>6. Derechos ARCO</Title>
                <Paragraph>
                Usted puede ejercer los derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO) enviando un correo a  
                 {' '}<Link href=" mailto:privacidad@cecan-dgo.gob.mx">privacidad@cecan-dgo.gob.mx</Link> o llamando al +52 618 137 7174.
                </Paragraph>
                <Title level={2}>7. Cookies y Tecnologías Similares</Title>
                <Paragraph>
                Utilizamos cookies propias y de terceros para analizar el uso del sitio y mejorar su experiencia. Puede gestionar sus preferencias
                en la configuración de su navegador.
                </Paragraph>
                <Title level={2}>8. Seguridad</Title>
                <Paragraph>
                Implementamos medidas de seguridad técnicas y administrativas para proteger sus datos. Sin embargo, ningún método electrónico
                o de almacenamiento es 100% seguro.
                </Paragraph>
                <Title level={2}>9. Menores de Edad</Title>
                <Paragraph>
                Nuestro servicio no está dirigido para ser usado por menores de 18 años. En el historial de pacientes si recopilamos conscientemente datos de menores.
                </Paragraph>
                <Title level={2}>10. Cambios a esta Política</Title>
                <Paragraph>
                Podremos actualizar esta política periódicamente. Publicaremos la nueva fecha de actualización en esta página.
                </Paragraph>
            </Content>
         </Layout>
    );
}