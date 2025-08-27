import { CONFIG } from 'src/config-global';
import { PatientDetailView } from 'src/sections/doctor/patients/patient-detail-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Patient Details - ${CONFIG.appName}`}</title>
      <meta name="description" content="Detailed patient monitoring and care management" />

      <PatientDetailView />
    </>
  );
}