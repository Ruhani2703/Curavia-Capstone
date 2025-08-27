import { Label } from 'src/components/label';
import { Icon } from '@iconify/react';

// ----------------------------------------------------------------------

const icon = (iconName: string) => <Icon icon={iconName} width={24} height={24} />;

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
  children?: NavItem[];
};

// Patient Dashboard Navigation
export const patientNavData = [
  // Main Dashboard
  {
    title: 'Dashboard',
    path: '/patient/dashboard',
    icon: icon('solar:home-bold'),
    info: (
      <Label color="success" variant="inverted">
        Live
      </Label>
    ),
  },

  // Health Monitoring
  {
    title: 'Health Monitoring',
    path: '/patient/health-monitoring',
    icon: icon('solar:pulse-bold'),
    info: (
      <Label color="info" variant="inverted">
        Real-time
      </Label>
    ),
  },

  // Recovery Plan
  {
    title: 'Recovery Plan',
    path: '/patient/recovery-plan',
    icon: icon('solar:heart-bold'),
  },

  // Medications
  {
    title: 'Medications',
    path: '/patient/medications',
    icon: icon('solar:medical-kit-bold'),
    info: (
      <Label color="warning" variant="inverted">
        2 Due
      </Label>
    ),
  },

  // Diet Plan
  {
    title: 'Diet Plan',
    path: '/patient/diet',
    icon: icon('solar:cup-star-bold'),
    info: (
      <Label color="success" variant="inverted">
        85%
      </Label>
    ),
  },

  // Reports
  {
    title: 'My Reports',
    path: '/patient/reports',
    icon: icon('solar:chart-bold'),
  },

  // Emergency (Always accessible)
  {
    title: 'Emergency',
    path: '/patient/emergency',
    icon: icon('solar:siren-bold'),
    info: (
      <Label color="error" variant="inverted">
        SOS
      </Label>
    ),
  },
];

// Emergency quick access items (always visible in patient dashboard)
export const emergencyQuickAccess = [
  {
    title: 'Call 911',
    path: '/patient/emergency/call',
    icon: icon('solar:phone-calling-bold'),
    color: 'error' as const,
  },
  {
    title: 'Alert Doctor',
    path: '/patient/emergency/doctor',
    icon: icon('solar:user-cross-bold'),
    color: 'warning' as const,
  },
  {
    title: 'Emergency Contact',
    path: '/patient/emergency/contact',
    icon: icon('solar:users-group-rounded-bold'),
    color: 'info' as const,
  },
];

// Quick stats for patient dashboard
export const patientQuickStats = [
  {
    title: 'Heart Rate',
    value: '72',
    unit: 'bpm',
    icon: icon('solar:pulse-bold'),
    color: 'success' as const,
    trend: 'stable' as const,
  },
  {
    title: 'Blood Pressure',
    value: '120/80',
    unit: 'mmHg',
    icon: icon('solar:heart-bold'),
    color: 'success' as const,
    trend: 'stable' as const,
  },
  {
    title: 'Temperature',
    value: '98.6',
    unit: '°F',
    icon: icon('solar:thermometer-bold'),
    color: 'success' as const,
    trend: 'stable' as const,
  },
  {
    title: 'SpO2',
    value: '98',
    unit: '%',
    icon: icon('solar:lungs-bold'),
    color: 'success' as const,
    trend: 'stable' as const,
  },
];

// Recovery milestones
export const recoveryMilestones = [
  {
    title: 'Week 1: Initial Recovery',
    completed: true,
    date: '2024-01-15',
    icon: icon('solar:check-circle-bold'),
  },
  {
    title: 'Week 2: Basic Movement',
    completed: true,
    date: '2024-01-22',
    icon: icon('solar:check-circle-bold'),
  },
  {
    title: 'Week 4: Regular Activity',
    completed: false,
    date: '2024-02-05',
    icon: icon('solar:clock-circle-bold'),
  },
  {
    title: 'Week 8: Full Recovery',
    completed: false,
    date: '2024-03-05',
    icon: icon('solar:clock-circle-bold'),
  },
];