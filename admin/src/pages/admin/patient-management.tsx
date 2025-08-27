import { CONFIG } from 'src/config-global';

import { PatientManagementView } from 'src/sections/admin/patient-management';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Patient Management - ${CONFIG.appName}`}</title>
      <meta name="description" content="Comprehensive patient administration and monitoring" />

      <PatientManagementView />
    </>
  );
}