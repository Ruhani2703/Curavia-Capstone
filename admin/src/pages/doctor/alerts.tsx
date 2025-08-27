import { CONFIG } from 'src/config-global';

import { DoctorAlertsView } from 'src/sections/doctor/alerts';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Alerts Management - ${CONFIG.appName}`}</title>
      <meta name="description" content="Manage patient alerts and notifications" />

      <DoctorAlertsView />
    </>
  );
}