/**
 *  Componente principal de rutas para la aplicación.
 * Define las rutas públicas y privadas utilizando React Router DOM.
 * 
 * Rutas públicas:
 * - /login: Página de inicio de sesión.
 * - /privacy: Política de privacidad.
 * - /terms: Términos y condiciones.

 * Rutas privadas (requieren JWT):
 * - /: Enrutamiento general con `MainLayout`.
 *   - /citas: Página principal del calendario.
 *   - /pacientes: Listado de pacientes.
 *   - /pacientes/:numExpediente: Detalle de paciente.
 *   - /usuarios: Gestión de usuarios.
 *   - /informes/...: Diversas páginas para llenado de formatos médicos.
 *   - /perfil: Página de perfil del usuario.
 * 
 * Cualquier ruta desconocida redirige a /login.
 */

import React from "react";
import { Routes,Route, Navigate, BrowserRouter} from 'react-router-dom';
import LoginPage from './modules/users/pages/LoginPage';
import { useAuth }     from './context/useAuth';
import MainLayout from "./MainLayout";
import CalendarPage from "./modules/appointments/pages/CalendarPage";
import PatientsPage from "./modules/patients/pages/PatientsPage";
import ReportsPage from "./modules/reports/pages/ReportsPage";
import UsersPage from "./modules/users/pages/UsersPage";
import ProfilePage from "./modules/users/pages/ProfilePage";
import { AuthContextProvider } from "./context/AuthContext";
import EstudioSocioeconomicoPage from "./modules/reports/pages/EstudioSocioeconomicoPage";
import PatientsDetailPage from "./modules/patients/pages/PatientsDetailPage";
import HistoriaClinicaPage from "./modules/reports/pages/HistoriaClinicaPage";
import HojaFrontalDiagnosticoPage from "./modules/reports/pages/HojaFrontalDiagnosticoPage";
import InterconsultaPage from "./modules/reports/pages/InterconsultaPage";
import SolicitudUltrasonograficoPage from "./modules/reports/pages/SolicitudUltrasonograficoPage";
import EstudioGabineteLabPage from "./modules/reports/pages/EstudioGabineteLabPage";
import IndicacionesQuimioPage from "./modules/reports/pages/IndicacionesQuimioPage";
import SolicitudTransfusion from "./modules/reports/pages/SolicitudTransfusion";
import InformeIdPacientePage from "./modules/reports/pages/InformeIdPacientePage";
import SubrogadosPage from "./modules/reports/pages/SubrogadosPage";
import PrivacyPolicyPage from "./modules/users/pages/PrivacyPolicyPage";
import TerminosCondicionesPage from "./modules/users/pages/TerminosCondicionesPage";

/**
 * Ruta privada que verifica si hay un token activo en el contexto de autenticación.
 * Si no hay token, redirige a /login.
 *
 * @param {Object} props
 * @param {JSX.Element} props.children - Componente hijo que se renderiza si hay sesión activa.
 * @returns {JSX.Element}
 */
function PrivateRoute({children}) {
  const {token} = useAuth();
  return token ? children : <Navigate to= '/login' replace />;

}

/**
 * Componente principal que define todas las rutas de la aplicación.
 */
export default function App() {
  return(
        <Routes>
          <Route path="/login" element={<LoginPage/>}/>
          {/*Todo lo demás pasa por MainLayout*/}
          <Route path="/" element={
            <PrivateRoute>
              <MainLayout/>
            </PrivateRoute>
            }>
              {/* Ruta por defecto redirige a /citas */}
              <Route index element={<Navigate to="citas" replace />} />
              <Route path="citas" element={<CalendarPage />} />
              <Route path="pacientes" element={<PatientsPage />} />
              {/* detalle de un paciente */}
              <Route path="pacientes/:numExpediente" element={<PatientsDetailPage />} />
              <Route path="usuarios" element={<UsersPage />} />
              <Route path="informes" element={<ReportsPage />} />
              {/**Ruta hija de informes */}
              <Route path="informes/estudio-socioeconomico" element={<EstudioSocioeconomicoPage />} /> 
              <Route path="informes/historia-clinica" element={<HistoriaClinicaPage />} />
              <Route path="/informes/hoja-frontal-diagnostico" element={<HojaFrontalDiagnosticoPage />} />
              <Route path="/informes/interconsulta" element={<InterconsultaPage />} />
              <Route path="/informes/solicitudultrasonografico" element={<SolicitudUltrasonograficoPage/>}/>
              <Route path="/informes/estudio-gabinete" element={<EstudioGabineteLabPage/>}/>
              <Route path="/informes/indicaciones-quimio" element={<IndicacionesQuimioPage />}/>
              <Route path="/informes/solicitud-transfusion" element={<SolicitudTransfusion />}/>
              <Route path="/informes/informe-id-paciente" element={<InformeIdPacientePage />}/>
              <Route path="/informes/subrogados" element={<SubrogadosPage />}/>
              <Route path="perfil" element={<ProfilePage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TerminosCondicionesPage />}/>
          </Route>

          {/*Operativamente no llegas aquí, pero por si acaso: */}
          <Route path="*" element={<Navigate to="/login" replace />}/>
        </Routes>
  );
}