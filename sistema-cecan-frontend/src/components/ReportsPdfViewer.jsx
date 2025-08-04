/**
 * Componente `ReportsPdfViewer`:
 * - Muestra un archivo PDF incrustado usando un `<iframe>`.
 * - Recibe la URL del PDF como prop (`url`) y lo despliega a pantalla completa.
 * Props:
 * - `url`: string con la ruta del archivo PDF a mostrar.
 */
import React from 'react';

export default function ReportsPdfViewer({url}) {
    return (
        <iframe
            src={url}
            title='Visor de informe PDF'
            width="100%"
            height="100%"
            style={{border: 'none'}}
        />
    );
}