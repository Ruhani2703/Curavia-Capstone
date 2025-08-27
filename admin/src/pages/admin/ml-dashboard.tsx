import { CONFIG } from 'src/config-global';

import { MLDashboardView } from 'src/sections/admin/ml-dashboard';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`ML Dashboard - ${CONFIG.appName}`}</title>
      <meta name="description" content="Machine Learning anomaly detection and health insights" />

      <MLDashboardView />
    </>
  );
}