import React from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
//import 'dayjs/locale/es'; // Importa el locale español
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);


export function AbsenceDatePicker({absences = [], ...props}) {
    //Normalizar rangos a dayjs con inicio/fin de día
    const ranges = absences.map(a=> ({
        start: dayjs(a.start),
        end: dayjs(a.end),
    }));

    //Decide si una fecha debe deshabilitarse
const isUnavailable = date => {
    const d = date.startOf('day');
    return ranges.some(({start, end}) =>
        d.isSame(start) ||
        d.isSame(end) ||
        d.isBetween(start,end)

    );
};

return (
    <DatePicker
        {...props}
        disabledDate={isUnavailable}
        //Pinta la celda con fondo y puntito
        dateRender= { current => {
            const blocked = isUnavailable(current);
            const day = current.date();
            return (
                <div
                    style={{
                        height: '100%',
                        lineHeight: '24px',
                        textAlign: 'center',
                        backgroundColor: blocked ? '#fde3ca' : undefined,
                        color: blocked ? '#d48806' : undefined,
                        position: 'relative',
                    }}
                >
                    {day}
                    {blocked && (
                        <span
                            style={{
                                position: 'absolute',
                                bottom: 4,
                                right: 4,
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: '#d48806',
                            }}
                        />
                    )}
                </div>
            );
            
        }}
    />
);

}
export default AbsenceDatePicker;

