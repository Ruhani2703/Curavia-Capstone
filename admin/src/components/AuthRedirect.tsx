import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Component to handle automatic redirects based on auth state
export function AuthRedirect() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return null; // Let the AuthProvider handle loading state
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // Redirect based on user role
  if (user) {
    switch (user.role) {
      case 'patient':
        return <Navigate to="/patient/dashboard" replace />;
      case 'doctor':
        return <Navigate to="/doctor/dashboard" replace />;
      case 'super_admin':
        return <Navigate to="/admin" replace />;
      default:
        return <Navigate to="/auth/login" replace />;
    }
  }

  return <Navigate to="/auth/login" replace />;
}