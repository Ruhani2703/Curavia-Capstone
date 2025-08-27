import { CONFIG } from 'src/config-global';
import { PatientDashboardView } from 'src/sections/patient/dashboard/patient-dashboard-view';

// ----------------------------------------------------------------------

export default function PatientDashboardPage() {
  return (
    <>
      <title>{`Recovery Dashboard - ${CONFIG.appName}`}</title>
      <meta
        name="description"
        content="Post-surgery recovery monitoring dashboard with vital signs, medications, and progress tracking"
      />
      <meta name="keywords" content="recovery,health,monitoring,vitals,surgery,patient" />

      <PatientDashboardView />
    </>
  );
}