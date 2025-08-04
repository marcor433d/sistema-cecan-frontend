/**
 * Componente `InformeSocioeconomicoPDF` (React + forwardRef):
 * - Renderiza un informe tipo PDF con datos socioeconómicos de un paciente.
 * - Divide el contenido en dos páginas: datos personales y contexto familiar.
 * - Soporta referencia externa (ref) para impresión/exportación.
 * Props:
 * - `informe`: Objeto con toda la información del paciente (datos personales, familiares, vivienda, economía, etc.).
 */
import React, { forwardRef } from "react";
import "../styles/InformeSocioeconomicoPDF.css";

const InformeSocioeconomicoPDF = forwardRef(({ informe }, ref) => {
  const d = informe || {};

  const numExpediente         = d.numExpediente || "";
  const fechaIngreso          = d.fechaIngreso?.slice(0,10) || "";
  const nombreCompleto        = d.nombreCompleto || "";
  const edadCumplida          = d.edadCumplida ?? "";
  const sexo                  = d.sexo || "";
  const estadoCivil           = d.estadoCivil || "";
  const escolaridad           = d.escolaridad || "";
  const fechaNacimiento       = d.fechaNacimiento?.slice(0,10) || "";

  const domicilioPermanente   = d.domicilioPermanente || "";
  const telefono1             = d.contactos?.[0]?.telefono || "";
  const telefono2             = d.contactos?.[1]?.telefono || "";
  const domicilioProvisional  = d.domicilioProvisional || "";

  const quienEnvia            = d.quienEnvia || "";
  const derechoHabiencia      = d.derechoHabiencia || "";
  const nombreUnidad          = d.nombreUnidad || "";
  const dxMedico              = d.dxMedico || "";
  const tieneEnfCronicas      = d.tieneEnfermedadesCronicas;
  const listaEnfCronicas      = d.listaEnfermedadesCronicas || [];

  const nombrePadre           = d.nombrePadre || "";
  const vivePadre             = d.vivePadre;
  const nombreMadre           = d.nombreMadre || "";
  const viveMadre             = d.viveMadre;
  const nombreConyuge         = d.nombreConyuge || "";
  const viveConyuge           = d.viveConyuge;

  const nombreResponsable     = d.nombreResponsable || "";
  const parentescoResponsable = d.parentescoResponsable || "";
  const domicilioResponsable  = d.domicilioResponsable || "";

  const ocupacionSosten       = d.ocupacionSosten || "";
  const parentescoSosten      = d.parentescoSosten || "";
  const ingresoMensual        = d.ingresoMensual ?? "";
  const gastoMensual          = d.gastoMensual ?? "";
  const gastoAlimentacion     = d.gastoAlimentacion ?? "";

  const tipoVivienda          = d.tipoVivienda || "";
  const regimenVivienda       = d.regimenVivienda || "";
  const serviciosPublicos     = d.serviciosPublicos || "";
  const otrosServicios        = d.otrosServicios || "";
  const materialVivienda      = d.materialVivienda || "";
  const noHabitaciones        = d.noHabitaciones ?? "";
  const personasHabitacion    = d.personasHabitacion ?? "";

  const zonaVivienda          = d.zonaVivienda || "";
  const areaGeografica        = d.areaGeografica || "";

  const noEnfermoFamilia      = d.noEnfermoFamilia ?? "";
  const noDependientes        = d.noDependientes ?? "";
  const noTrabajadoresFamilia = d.noTrabajadoresFamilia ?? "";

  const servicioPaciente      = d.servicioPaciente || "";
  const nivelAsignado         = d.nivelAsignado || "";

  const usuarioNombre = d.usuarioNombre || "";

  // Integrantes tabla (hasta 10)
  const filasIntegrantes = Array.from({length:10},(_,i)=>{
    const it = d.integrantesFamilia?.[i]||{};
    return {
      nombre: it.nombre||"",
      edad:    it.edad||"",
      parentesco: it.parentesco||"",
      escolaridad: it.escolaridad||"",
      edoCivil: it.edoCivil||"",
      ocupacion: it.ocupacion||""
    };
  });

  // Dinámica y observaciones
  const dinamica     = (d.dinamicaFamiliar || []).map(x=>x.dinamica);
  const observaciones= (d.observaciones      || []).map(x=>x.observacion);

  return (
    <div className="informe-pdf-container" ref={ref}>
      {/* PÁGINA 1 */}
      <div className="pagina">
        <img src="/logo-cecan.png" alt="Logo CECAN" className="pdf-logo large"/>
        <h2 className="titulo">DEPARTAMENTO DE TRABAJO SOCIAL MÉDICO</h2>
        <h3 className="titulo">ENTREVISTA INICIAL</h3>

        <div className="spacer" />

        {/* Fila 1 */}
        <div className="fila">
          <div className="campo"><b>EXPEDIENTE:</b> {numExpediente}</div>
          <div className="campo"><b>FECHA DE ALTA:</b> {fechaIngreso}</div>
        </div>
        {/* Fila 2 */}
        <div className="fila">
          <div className="campo full"><b>NOMBRE PACIENTE:</b> {nombreCompleto}</div>
        </div>
        {/* Fila 3 */}
        <div className="fila">
          <div className="campo"><b>EDAD:</b> {edadCumplida}</div>
          <div className="campo"><b>GÉNERO:</b> {sexo}</div>
          <div className="campo"><b>EDO. CIVIL:</b> {estadoCivil}</div>
        </div>
        {/* Fila 4 */}
        <div className="fila">
          <div className="campo"><b>ESCOLARIDAD:</b> {escolaridad}</div>
          <div className="campo"><b>FECHA NAC.:</b> {fechaNacimiento}</div>
        </div>
        {/* Fila 5 */}
        <div className="fila">
          <div className="campo full"><b>DOMICILIO PERMANENTE:</b> {domicilioPermanente}</div>
        </div>
        {/* Fila 6 */}
        <div className="fila">
          <div className="campo"><b>TEL. 1:</b> {telefono1}</div>
          <div className="campo"><b>TEL. 2:</b> {telefono2}</div>
        </div>
        {/* Fila 7 */}
        <div className="fila">
          <div className="campo full"><b>DOMICILIO PROV.:</b> {domicilioProvisional}</div>
        </div>
        {/* Fila 8 */}
        <div className="fila">
          <div className="campo full"><b>QUIÉN LO ENVÍA AL CENTRO:</b> {quienEnvia}</div>
        </div>
        {/* Fila 9 */}
        <div className="fila">
          <div className="campo"><b>DERECHO HAB.:</b> {derechoHabiencia}</div>
          <div className="campo"><b>UNIDAD:</b> {nombreUnidad}</div>
        </div>
        {/* Fila 10 */}
        <div className="fila">
          <div className="campo"><b>DX. MÉDICO:</b> {dxMedico}</div>
          <div className="campo"><b>ENF. CRÓNICAS:</b> {tieneEnfCronicas?"Sí":"No"}</div>
        </div>
        {tieneEnfCronicas && listaEnfCronicas.length>0 && (
          <div className="fila">
            <div className="campo full"><b>LISTA ENF. CRÓNICAS:</b> {listaEnfCronicas.join(", ")}</div>
          </div>
        )}
        {/* Fila 11 */}
        <div className="fila">
          <div className="campo"><b>NOMBRE PADRE:</b> {nombrePadre}</div>
          <div className="campo"><b>VIVE:</b> {vivePadre?"Sí":"No"}</div>
        </div>
        {/* Fila 12 */}
        <div className="fila">
          <div className="campo"><b>NOMBRE MADRE:</b> {nombreMadre}</div>
          <div className="campo"><b>VIVE:</b> {viveMadre?"Sí":"No"}</div>
        </div>
        {/* Fila 13 */}
        <div className="fila">
          <div className="campo"><b>NOMBRE CÓNYUGE:</b> {nombreConyuge}</div>
          <div className="campo"><b>VIVE:</b> {viveConyuge?"Sí":"No"}</div>
        </div>
        {/* Fila 14 */}
        <div className="fila">
          <div className="campo full"><b>RESPONSABLE:</b> {nombreResponsable}</div>
        </div>
        {/* Fila 15 */}
        <div className="fila">
          <div className="campo"><b>PARENTESCO:</b> {parentescoResponsable}</div>
        </div>
        {/* Fila 16 */}
        <div className="fila">
          <div className="campo full"><b>DOM. RESPONSABLE:</b> {domicilioResponsable}</div>
        </div>
        {/* Fila 17 */}
        <div className="fila">
          <div className="campo"><b>OCUP. SOSTÉN:</b> {ocupacionSosten}</div>
          <div className="campo"><b>PARENTESCO:</b> {parentescoSosten}</div>
          <div className="campo"><b>ING. MENSUAL:</b> {ingresoMensual}</div>
        </div>
        {/* Fila 18 */}
        <div className="fila">
          <div className="campo"><b>GASTO MENSUAL:</b> {gastoMensual}</div>
          <div className="campo"><b>GASTO ALIM.:</b> {gastoAlimentacion}</div>
        </div>
        {/* Fila 19 */}
        <div className="fila">
          <div className="campo"><b>TIPO VIVIENDA:</b> {tipoVivienda}</div>
          <div className="campo"><b>RÉGIMEN:</b> {regimenVivienda}</div>
        </div>
        {/* Fila 20 */}
        <div className="fila">
          <div className="campo"><b>SERV. PÚBLICOS:</b> {serviciosPublicos}</div>
          <div className="campo"><b>OTROS SER.:</b> {otrosServicios}</div>
        </div>
        {/* Fila 21 */}
        <div className="fila">
          <div className="campo"><b>MAT. CONST.:</b> {materialVivienda}</div>
          <div className="campo"><b>HABITACIONES:</b> {noHabitaciones}</div>
          <div className="campo"><b>PERS/DOM:</b> {personasHabitacion}</div>
        </div>
        {/* Fila 22 */}
        <div className="fila">
          <div className="campo"><b>ZONA:</b> {zonaVivienda}</div>
        </div>
        {/* Fila 23 */}
        <div className="fila">
          <div className="campo"><b>ÁREA GEOG.:</b> {areaGeografica}</div>
          <div className="campo"><b>ENF. FAM.:</b> {noEnfermoFamilia}</div>
        </div>
        {/* Fila 24 */}
        <div className="fila">
          <div className="campo"><b>DEPEND.:</b> {noDependientes}</div>
          <div className="campo"><b>LABORAN:</b> {noTrabajadoresFamilia}</div>
        </div>
        {/* Fila 25 */}
        <div className="fila">
          <div className="campo full"><b>SERV. RECIBE:</b> {servicioPaciente}</div>
        </div>
      </div>

      {/* PÁGINA 2 */}
      <div className="pagina">
        <img src="/logo-cecan.png" alt="Logo CECAN" className="pdf-logo large"/>
        <h2 className="titulo">Integrantes de la Familia</h2>

        <table className="tabla-integrantes">
          <thead>
            <tr>
              <th>Nombre</th><th>Edad</th><th>Parentesco</th>
              <th>Escolaridad</th><th>Edo. Civil</th><th>Ocupación</th>
            </tr>
          </thead>
          <tbody>
            {filasIntegrantes.map((f,i)=>(
              <tr key={i}>
                <td>{f.nombre}</td>
                <td>{f.edad}</td>
                <td>{f.parentesco}</td>
                <td>{f.escolaridad}</td>
                <td>{f.edoCivil}</td>
                <td>{f.ocupacion}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="titulo">Dinámica Familiar</h2>
        {dinamica.length>0
          ? <ul>{dinamica.slice(0,7).map((lx,i)=><li key={i}>{lx}</li>)}</ul>
          : <p>No hay dinámica familiar.</p>
        }

        <h2 className="titulo">Observaciones</h2>
        {observaciones.length>0
          ? <ul>{observaciones.slice(0,7).map((ox,i)=><li key={i}>{ox}</li>)}</ul>
          : <p>No hay observaciones.</p>
        }

        <div className="firma-section">
          {/* Bloque Trabajador Social */}
          <div className="firma-block">
            <div className="firma-label trabajador-name">{usuarioNombre}</div>
            <div className="firma-line left-line"></div>
            <div className="firma-label trabajador-text">Trabajador Social</div>
          </div>
          {/* Bloque Firma */}
          <div className="firma-block">
            <div className="firma-label invisible">Placeholder</div>
            <div className="firma-line right-line"></div>
            <div className="firma-label firma-text">Firma</div>
          </div>
        </div>
        <div className="nivel">Nivel {nivelAsignado}</div>
      </div>
    </div>
  );
});

export default InformeSocioeconomicoPDF;