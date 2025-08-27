import { CONFIG } from 'src/config-global';
import { DoctorDashboardView } from 'src/sections/doctor/dashboard/doctor-dashboard-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Doctor Dashboard - ${CONFIG.appName}`}</title>
      <meta name="description" content="Doctor dashboard for managing assigned patients" />

      <DoctorDashboardView />
    </>
  );
}