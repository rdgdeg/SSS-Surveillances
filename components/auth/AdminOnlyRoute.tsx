import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AdminOnlyRouteProps {
  children: React.ReactNode;
}

export default function AdminOnlyRoute({ children }: AdminOnlyRouteProps) {
  const { user } = useAuth();

  // Seul RaphD peut accéder aux routes admin-only
  if (user?.username !== 'RaphD') {
    return <Navigate to="/admin/aide" replace />;
  }

  return <>{children}</>;
}
