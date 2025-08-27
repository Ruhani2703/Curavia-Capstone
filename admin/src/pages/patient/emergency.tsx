import { CONFIG } from 'src/config-global';
import { EmergencyView } from 'src/sections/patient/emergency/emergency-view';

// ----------------------------------------------------------------------

export default function EmergencyPage() {
  return (
    <>
      <title>{`Emergency - ${CONFIG.appName}`}</title>
      <meta
        name="description"
        content="Emergency contacts and quick access to emergency services"
      />
      <meta name="keywords" content="emergency,sos,911,doctor,alert,help" />

      <EmergencyView />
    </>
  );
}