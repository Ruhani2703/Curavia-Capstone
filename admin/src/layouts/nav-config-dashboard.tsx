import { Label } from 'src/components/label';
import { Icon } from '@iconify/react';
import { patientNavData } from './nav-config-patient';

// ----------------------------------------------------------------------

const icon = (iconName: string) => <Icon icon={iconName} width={24} height={24} />;

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
  children?: NavItem[];
};

// ADMIN Navigation (Full hospital management access)
export const adminNavData = [
  {
    title: 'Admin Dashboard',
    path: '/admin',
    icon: icon('solar:widget-5-bold'),
    info: (
      <Label color="success" variant="inverted">
        Live
      </Label>
    ),
  },
  {
    title: 'Patient Management',
    path: '/admin/patient-management',
    icon: icon('solar:users-group-rounded-bold'),
    info: (
      <Label color="info" variant="inverted">
        Admin
      </Label>
    ),
  },
  {
    title: 'Medical Staff',
    path: '/admin/medical-staff',
    icon: icon('solar:stethoscope-bold'),
  },
  {
    title: 'Sensor Analytics',
    path: '/admin/sensor-analytics',
    icon: icon('solar:pulse-bold'),
    info: (
      <Label color="success" variant="inverted">
        Live
      </Label>
    ),
  },
  {
    title: 'Alert Management',
    path: '/admin/alert-management',
    icon: icon('solar:bell-bing-bold'),
    info: (
      <Label color="error" variant="inverted">
        3
      </Label>
    ),
  },
  {
    title: 'Reports & Analytics',
    path: '/admin/reports',
    icon: icon('solar:chart-bold'),
  },
  {
    title: 'Emergency Center',
    path: '/admin/emergency-response',
    icon: icon('solar:siren-bold'),
    info: (
      <Label color="error" variant="inverted">
        SOS
      </Label>
    ),
  },
  {
    title: 'Diet & Exercise',
    path: '/admin/diet-exercise',
    icon: icon('solar:plate-bold'),
  },
  {
    title: 'System Config',
    path: '/admin/system-config',
    icon: icon('solar:settings-bold'),
  },
];

// DOCTOR Navigation (Patient care focused)
export const doctorNavData = [
  {
    title: 'Doctor Dashboard',
    path: '/doctor/dashboard',
    icon: icon('solar:widget-5-bold'),
    info: (
      <Label color="primary" variant="inverted">
        Doctor
      </Label>
    ),
  },
  {
    title: 'My Patients',
    path: '/doctor/patients',
    icon: icon('solar:users-group-rounded-bold'),
    info: (
      <Label color="info" variant="inverted">
        12
      </Label>
    ),
  },
  {
    title: 'Prescriptions',
    path: '/doctor/prescriptions',
    icon: icon('solar:pill-bold'),
    info: (
      <Label color="success" variant="inverted">
        Active
      </Label>
    ),
  },
  {
    title: 'Patient Analytics',
    path: '/doctor/analytics',
    icon: icon('solar:pulse-bold'),
    info: (
      <Label color="success" variant="inverted">
        Live
      </Label>
    ),
  },
  {
    title: 'Alerts & Notifications',
    path: '/doctor/alerts',
    icon: icon('solar:bell-bing-bold'),
    info: (
      <Label color="warning" variant="inverted">
        2
      </Label>
    ),
  },
  {
    title: 'Patient Reports',
    path: '/doctor/reports',
    icon: icon('solar:chart-bold'),
  },
  {
    title: 'Emergency Response',
    path: '/doctor/emergency',
    icon: icon('solar:siren-bold'),
    info: (
      <Label color="error" variant="inverted">
        SOS
      </Label>
    ),
  },
  {
    title: 'Recovery Plans',
    path: '/doctor/recovery-plans',
    icon: icon('solar:plate-bold'),
  },
];

// Default export for backward compatibility (uses admin nav)
export const navData = adminNavData;

// Function to get navigation based on user role
export const getNavDataByRole = (userRole: 'super_admin' | 'doctor' | 'patient') => {
  switch (userRole) {
    case 'super_admin':
      return adminNavData;
    case 'doctor':
      return doctorNavData;
    case 'patient':
      return patientNavData;
    default:
      return adminNavData; // Fallback to admin for any unhandled roles
  }
};

// Emergency quick access items (always visible)
export const emergencyNavData = [
  {
    title: 'Emergency Call',
    path: '/emergency/call',
    icon: icon('solar:phone-calling-bold'),
    info: (
      <Label color="error" variant="inverted">
        911
      </Label>
    ),
  },
  {
    title: 'Alert Doctor',
    path: '/emergency/alert-doctor',
    icon: icon('solar:siren-bold'),
    info: (
      <Label color="warning" variant="inverted">
        MD
      </Label>
    ),
  },
  {
    title: 'Critical Alert',
    path: '/emergency/critical',
    icon: icon('solar:danger-bold'),
    info: (
      <Label color="error" variant="inverted">
        SOS
      </Label>
    ),
  },
];