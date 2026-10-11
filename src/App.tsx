import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { ProvasPage } from './pages/ProvasPage';
import { TurmaDetailsPage } from './pages/TurmaDetailsPage';
import { TurmasPage } from './pages/TurmasPage';

function RequireAuth() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet/> : <Navigate to="/login" replace/>;
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage/>}/>
    <Route element={<RequireAuth/>}>
      <Route element={<AppLayout/>}>
        <Route path="/" element={<OverviewPage/>}/>
        <Route path="/provas" element={<ProvasPage/>}/>
        <Route path="/turmas" element={<TurmasPage/>}/>
        <Route path="/turmas/:id" element={<TurmaDetailsPage/>}/>
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>;
}
