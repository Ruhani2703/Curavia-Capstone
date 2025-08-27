import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: 'patient' | 'doctor' | 'super_admin' | Array<'patient' | 'doctor' | 'super_admin'>;
  requireAuth?: boolean;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  requiredRole,
  requireAuth = true 
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && user) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!allowedRoles.includes(user.role)) {
      // Redirect based on user's actual role
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
  }

  return <>{children}</>;
};

// Specific guards for different roles
export const SuperAdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RouteGuard requiredRole="super_admin">{children}</RouteGuard>
);

export const DoctorGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RouteGuard requiredRole={['doctor', 'super_admin']}>{children}</RouteGuard>
);

export const PatientGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RouteGuard requiredRole="patient">{children}</RouteGuard>
);

// Public route guard (no auth required)
export const PublicGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  // If user is already authenticated, redirect to their dashboard
  if (isAuthenticated && user) {
    switch (user.role) {
      case 'patient':
        return <Navigate to="/patient/dashboard" replace />;
      case 'doctor':
        return <Navigate to="/doctor/dashboard" replace />;
      case 'super_admin':
        return <Navigate to="/admin" replace />;
      default:
        break;
    }
  }

  return <RouteGuard requireAuth={false}>{children}</RouteGuard>;
};