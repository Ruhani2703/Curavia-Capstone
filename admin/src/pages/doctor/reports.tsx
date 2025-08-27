import { CONFIG } from 'src/config-global';

import { DoctorReportsView } from 'src/sections/doctor/reports';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Patient Reports - ${CONFIG.appName}`}</title>
      <meta name="description" content="View and manage patient medical reports" />

      <DoctorReportsView />
    </>
  );
}