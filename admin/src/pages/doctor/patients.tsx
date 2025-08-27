import { CONFIG } from 'src/config-global';
import { DoctorPatientListView } from 'src/sections/doctor/patients/doctor-patient-list-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`My Patients - ${CONFIG.appName}`}</title>
      <meta name="description" content="View and manage assigned patients" />

      <DoctorPatientListView />
    </>
  );
}