import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { AuthLayout } from 'src/layouts/auth';
import { DashboardLayout } from 'src/layouts/dashboard';
import { PublicGuard, SuperAdminGuard, DoctorGuard, PatientGuard } from 'src/components/RouteGuard';
import { AuthRedirect } from 'src/components/AuthRedirect';

// ----------------------------------------------------------------------

// Original pages
export const DashboardPage = lazy(() => import('src/pages/dashboard'));
export const BlogPage = lazy(() => import('src/pages/blog'));
export const UserPage = lazy(() => import('src/pages/user'));
export const ProductsPage = lazy(() => import('src/pages/products'));
export const Page404 = lazy(() => import('src/pages/page-not-found'));

// Authentication Pages
export const LoginPage = lazy(() => import('src/pages/auth/login'));
export const SignupPage = lazy(() => import('src/pages/auth/signup'));
export const ForgotPasswordPage = lazy(() => import('src/pages/auth/forgot-password'));

// Admin Pages
export const PatientManagementPage = lazy(() => import('src/pages/admin/patient-management'));
export const SensorAnalyticsPage = lazy(() => import('src/pages/admin/sensor-analytics'));
export const EmergencyResponsePage = lazy(() => import('src/pages/admin/emergency-response'));
export const AlertManagementPage = lazy(() => import('src/pages/admin/alert-management'));
export const MedicalStaffPage = lazy(() => import('src/pages/admin/medical-staff'));
export const SystemConfigPage = lazy(() => import('src/pages/admin/system-config'));
export const ReportsAnalyticsPage = lazy(() => import('src/pages/admin/reports'));
export const DietExercisePage = lazy(() => import('src/pages/admin/diet-exercise'));
export const MLDashboardPage = lazy(() => import('src/pages/admin/ml-dashboard'));
export const LiveMonitorPage = lazy(() => import('src/pages/admin/live-monitor'));

// Doctor Pages
export const DoctorDashboardPage = lazy(() => import('src/pages/doctor/dashboard'));
export const DoctorPatientsPage = lazy(() => import('src/pages/doctor/patients'));
export const DoctorPatientDetailPage = lazy(() => import('src/pages/doctor/patient-detail'));
export const DoctorPrescriptionsPage = lazy(() => import('src/pages/doctor/prescriptions'));
export const DoctorAnalyticsPage = lazy(() => import('src/pages/doctor/analytics'));
export const DoctorAlertsPage = lazy(() => import('src/pages/doctor/alerts'));
export const DoctorReportsPage = lazy(() => import('src/pages/doctor/reports'));
export const DoctorEmergencyPage = lazy(() => import('src/pages/doctor/emergency'));
export const DoctorRecoveryPlansPage = lazy(() => import('src/pages/doctor/recovery-plans'));

// Patient Pages
export const PatientDashboardPage = lazy(() => import('src/pages/patient/dashboard'));
export const HealthMonitoringPage = lazy(() => import('src/pages/patient/health-monitoring'));
export const RecoveryPlanPage = lazy(() => import('src/pages/patient/recovery-plan'));
export const MedicationsPage = lazy(() => import('src/pages/patient/medications'));
export const PatientReportsPage = lazy(() => import('src/pages/patient/reports'));
export const EmergencyPage = lazy(() => import('src/pages/patient/emergency'));
export const DietPage = lazy(() => import('src/pages/patient/diet'));

const renderFallback = () => (
  <Box
    sx={{
      display: 'flex',
      flex: '1 1 auto',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <LinearProgress
      sx={{
        width: 1,
        maxWidth: 320,
        bgcolor: (theme) => varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
        [`& .${linearProgressClasses.bar}`]: { bgcolor: 'text.primary' },
      }}
    />
  </Box>
);

export const routesSection: RouteObject[] = [
  // Authentication Routes (Public)
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        element: (
          <PublicGuard>
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          </PublicGuard>
        ),
      },
      {
        path: 'signup',
        element: (
          <PublicGuard>
            <AuthLayout>
              <SignupPage />
            </AuthLayout>
          </PublicGuard>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <PublicGuard>
            <AuthLayout>
              <ForgotPasswordPage />
            </AuthLayout>
          </PublicGuard>
        ),
      },
    ],
  },

  // Patient Routes
  {
    path: 'patient',
    element: (
      <PatientGuard>
        <DashboardLayout>
          <Suspense fallback={renderFallback()}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </PatientGuard>
    ),
    children: [
      { path: 'dashboard', element: <PatientDashboardPage /> },
      { path: 'health-monitoring', element: <HealthMonitoringPage /> },
      { path: 'recovery-plan', element: <RecoveryPlanPage /> },
      { path: 'medications', element: <MedicationsPage /> },
      { path: 'diet', element: <DietPage /> },
      { path: 'reports', element: <PatientReportsPage /> },
      { path: 'emergency', element: <EmergencyPage /> },
    ],
  },

  // Admin Routes (Admin & Doctor access)
  {
    path: 'admin',
    element: (
      <DoctorGuard>
        <DashboardLayout>
          <Suspense fallback={renderFallback()}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </DoctorGuard>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'patient-management', element: <PatientManagementPage /> },
      { path: 'sensor-analytics', element: <SensorAnalyticsPage /> },
      { path: 'emergency-response', element: <EmergencyResponsePage /> },
      { path: 'alert-management', element: <AlertManagementPage /> },
      { path: 'medical-staff', element: <MedicalStaffPage /> },
      { path: 'system-config', element: <SystemConfigPage /> },
      { path: 'reports', element: <ReportsAnalyticsPage /> },
      { path: 'diet-exercise', element: <DietExercisePage /> },
      { path: 'ml-dashboard', element: <MLDashboardPage /> },
      { path: 'live-monitor', element: <LiveMonitorPage /> },
      // Doctor-specific routes
      { path: 'doctor/dashboard', element: <DoctorDashboardPage /> },
      { path: 'doctor/patients', element: <DoctorPatientsPage /> },
      { path: 'doctor/patient/:patientId', element: <DoctorPatientDetailPage /> },
      { path: 'doctor/prescriptions', element: <DoctorPrescriptionsPage /> },
    ],
  },
  {
    path: 'doctor',
    element: (
      <DoctorGuard>
        <DashboardLayout>
          <Suspense fallback={renderFallback()}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </DoctorGuard>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      
      // Doctor-specific routes
      { path: 'dashboard', element: <DoctorDashboardPage /> },
      { path: 'patients', element: <DoctorPatientsPage /> },
      { path: 'patient/:patientId', element: <DoctorPatientDetailPage /> },
      { path: 'prescriptions', element: <DoctorPrescriptionsPage /> },
      { path: 'analytics', element: <DoctorAnalyticsPage /> },
      { path: 'alerts', element: <DoctorAlertsPage /> },
      { path: 'reports', element: <DoctorReportsPage /> },
      { path: 'emergency', element: <DoctorEmergencyPage /> },
      { path: 'recovery-plans', element: <DoctorRecoveryPlansPage /> },
    ],
  },

  // Root redirect
  {
    index: true,
    element: <AuthRedirect />,
  },
  
  // Legacy login route
  {
    path: 'login',
    element: <PublicGuard><AuthLayout><LoginPage /></AuthLayout></PublicGuard>,
  },

  // 404 Routes
  {
    path: '404',
    element: <Page404 />,
  },
  { path: '*', element: <Page404 /> },
];
