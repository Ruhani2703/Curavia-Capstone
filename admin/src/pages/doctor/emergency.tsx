import { CONFIG } from 'src/config-global';

import { DoctorEmergencyView } from 'src/sections/doctor/emergency';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Emergency Response - ${CONFIG.appName}`}</title>
      <meta name="description" content="Monitor and respond to patient emergencies" />

      <DoctorEmergencyView />
    </>
  );
}