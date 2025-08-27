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

export const adminNavData = [
  // Main Overview
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

  // Patient & Medical Management
  {
    title: 'Patient Management',
    path: '/admin/patients',
    icon: icon('solar:users-group-rounded-bold'),
    info: (
      <Label color="info" variant="inverted">
        Active
      </Label>
    ),
  },

  {
    title: 'Medical Staff Portal',
    path: '/admin/medical-staff',
    icon: icon('solar:stethoscope-bold'),
  },

  // Data & Analytics
  {
    title: 'Live Patient Monitor',
    path: '/admin/live-monitor',
    icon: icon('solar:monitor-bold'),
    info: (
      <Label color="success" variant="inverted">
        Real-time
      </Label>
    ),
  },

  {
    title: 'Sensor Analytics',
    path: '/admin/sensor-data',
    icon: icon('solar:pulse-bold'),
    info: (
      <Label color="success" variant="inverted">
        Live
      </Label>
    ),
  },

  {
    title: 'ML Anomaly Detection',
    path: '/admin/ml-dashboard',
    icon: icon('solar:cpu-bolt-bold'),
    info: (
      <Label color="info" variant="inverted">
        AI
      </Label>
    ),
  },

  {
    title: 'Reports & Analytics',
    path: '/admin/reports',
    icon: icon('solar:chart-bold'),
  },

  // Alert & Emergency Management
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
    title: 'Emergency Center',
    path: '/admin/emergency',
    icon: icon('solar:siren-bold'),
    info: (
      <Label color="error" variant="inverted">
        SOS
      </Label>
    ),
  },

  // Medical Resources
  {
    title: 'Medication Database',
    path: '/admin/medications',
    icon: icon('solar:pill-bold'),
  },

  {
    title: 'Diet & Exercise',
    path: '/admin/diet-exercise',
    icon: icon('solar:plate-bold'),
  },

  // Communication & Support
  {
    title: 'Communication Center',
    path: '/admin/communications',
    icon: icon('solar:chat-round-dots-bold'),
    info: (
      <Label color="warning" variant="inverted">
        12
      </Label>
    ),
  },

  // System Management
  {
    title: 'System Config',
    path: '/admin/config',
    icon: icon('solar:settings-bold'),
    children: [
      {
        title: 'ThingSpeak API',
        path: '/admin/config/thingspeak',
        icon: icon('solar:server-bold'),
      },
      {
        title: 'Email Service',
        path: '/admin/config/email',
        icon: icon('solar:mailbox-bold'),
      },
      {
        title: 'Security Settings',
        path: '/admin/config/security',
        icon: icon('solar:shield-keyhole-bold'),
      },
      {
        title: 'Database Backup',
        path: '/admin/config/backup',
        icon: icon('solar:database-bold'),
      },
    ],
  },

  // Compliance & Audit
  {
    title: 'Audit & Compliance',
    path: '/admin/audit',
    icon: icon('solar:document-text-bold'),
    children: [
      {
        title: 'HIPAA Compliance',
        path: '/admin/audit/hipaa',
        icon: icon('solar:shield-check-bold'),
      },
      {
        title: 'Access Logs',
        path: '/admin/audit/logs',
        icon: icon('solar:history-bold'),
      },
      {
        title: 'User Activity',
        path: '/admin/audit/activity',
        icon: icon('solar:user-check-bold'),
      },
    ],
  },
];

// Quick access emergency actions for admin
export const adminEmergencyActions = [
  {
    title: 'System Alert',
    path: '/admin/emergency/broadcast',
    icon: icon('solar:danger-triangle-bold'),
    info: (
      <Label color="error" variant="inverted">
        Alert All
      </Label>
    ),
  },
  {
    title: 'Emergency Protocol',
    path: '/admin/emergency/protocol',
    icon: icon('solar:siren-bold'),
    info: (
      <Label color="error" variant="inverted">
        Activate
      </Label>
    ),
  },
];