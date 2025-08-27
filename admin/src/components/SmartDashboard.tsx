import { useEffect } from 'react';
import { useAuth } from 'src/contexts/AuthContext';
import { useRouter } from 'src/routes/hooks';
import { CircularProgress, Box, Typography } from '@mui/material';
import { OverviewAnalyticsView } from 'src/sections/overview/view';
import { DoctorDashboardView } from 'src/sections/doctor/dashboard/doctor-dashboard-view';

export function SmartDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is a patient, redirect to patient dashboard
    if (user && user.role === 'patient') {
      router.push('/patient/dashboard');
    }
  }, [user, router]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading dashboard...</Typography>
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  // Show doctor dashboard for doctors
  if (user.role === 'doctor') {
    return <DoctorDashboardView />;
  }

  // Show super admin dashboard for super admins
  if (user.role === 'super_admin') {
    return <OverviewAnalyticsView />;
  }

  // Default fallback
  return <OverviewAnalyticsView />;
}