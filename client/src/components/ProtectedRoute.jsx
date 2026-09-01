import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function ProtectedRoute({ children }) {
  const { ready, authenticated } = useAuth();
  const location = useLocation();

  if (!ready) return <div className="page-loading">Cargando…</div>;

  if (!authenticated) {
    return <Navigate to="/ingresar" state={{ from: location.pathname }} replace />;
  }

  return children;
}
