import { CONFIG } from 'src/config-global';
import { PrescriptionManagementView } from 'src/sections/doctor/prescriptions/prescription-management-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Prescription Management - ${CONFIG.appName}`}</title>
      <meta name="description" content="Create and manage patient prescriptions" />

      <PrescriptionManagementView />
    </>
  );
}