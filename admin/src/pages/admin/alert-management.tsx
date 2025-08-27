import { CONFIG } from 'src/config-global';

import { AlertManagementView } from 'src/sections/admin/alert-management';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Alert Management - ${CONFIG.appName}`}</title>
      <meta name="description" content="Monitor and manage all system alerts and notifications" />

      <AlertManagementView />
    </>
  );
}