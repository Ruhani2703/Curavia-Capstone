import { CONFIG } from 'src/config-global';
import { DoctorAnalyticsView } from 'src/sections/doctor/analytics/doctor-analytics-view';

// ----------------------------------------------------------------------

export default function DoctorAnalyticsPage() {
  return (
    <>
      <title>{`Patient Analytics - ${CONFIG.appName}`}</title>
      <meta name="description" content="Doctor's patient analytics and monitoring dashboard" />

      <DoctorAnalyticsView />
    </>
  );
}