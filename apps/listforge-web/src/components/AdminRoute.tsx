import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface AdminRouteProps {
  children: React.ReactElement;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const globalRole = useSelector((state: RootState) => state.auth.user?.globalRole);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (globalRole !== 'staff' && globalRole !== 'superadmin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

