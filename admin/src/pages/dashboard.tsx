import { CONFIG } from 'src/config-global';

import { SmartDashboard } from 'src/components/SmartDashboard';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Dashboard - ${CONFIG.appName}`}</title>
      <meta
        name="description"
        content="Health monitoring platform dashboard - role-based access to patient care management"
      />
      <meta name="keywords" content="health,monitoring,dashboard,patient,care,medical" />

      <SmartDashboard />
    </>
  );
}
