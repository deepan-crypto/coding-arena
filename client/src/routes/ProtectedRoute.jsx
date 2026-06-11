import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-screen">
        <div className="auth-card center-card">
          <div className="loading-spinner" />
          <p className="muted-copy">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to appropriate login page
    const loginPath = role === 'admin' ? '/admin/login' : '/login';
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;
  }

  return children;
}