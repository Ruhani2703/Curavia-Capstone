import { CONFIG } from 'src/config-global';

import { EmergencyResponseView } from 'src/sections/admin/emergency-response';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Emergency Response - ${CONFIG.appName}`}</title>
      <meta name="description" content="Critical patient emergency response and coordination" />

      <EmergencyResponseView />
    </>
  );
}