import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireFullAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireFullAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si la route nécessite un admin complet et que l'utilisateur n'est pas RaphD
  if (requireFullAdmin && user?.username !== 'RaphD') {
    return <Navigate to="/admin/aide" replace />;
  }

  return <>{children}</>;
}
