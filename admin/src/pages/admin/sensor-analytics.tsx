import { CONFIG } from 'src/config-global';

import { SensorAnalyticsView } from 'src/sections/admin/sensor-analytics';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Sensor Analytics - ${CONFIG.appName}`}</title>
      <meta name="description" content="Real-time sensor data monitoring and analytics" />

      <SensorAnalyticsView />
    </>
  );
}