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


function PrivateRoute({children}) {
  const {token} = useAuth();
  return token ? children : <Navigate to= '/login' replace />;

}

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
          </Route>

          {/*Operativamente no llegas aquí, pero por si acaso: */}
          <Route path="*" element={<Navigate to="/login" replace />}/>
        </Routes>
  );
}