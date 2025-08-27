import { CONFIG } from 'src/config-global';
import { HealthMonitoringView } from 'src/sections/patient/health/health-monitoring-view';

// ----------------------------------------------------------------------

export default function HealthMonitoringPage() {
  return (
    <>
      <title>{`Health Monitoring - ${CONFIG.appName}`}</title>
      <meta
        name="description"
        content="Real-time vital signs monitoring with detailed charts and trends"
      />
      <meta name="keywords" content="health,vitals,monitoring,heart rate,blood pressure,temperature" />

      <HealthMonitoringView />
    </>
  );
}