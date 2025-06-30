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