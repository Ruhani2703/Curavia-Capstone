import { CONFIG } from 'src/config-global';

import { MedicalStaffView } from 'src/sections/admin/medical-staff';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Medical Staff Portal - ${CONFIG.appName}`}</title>
      <meta name="description" content="Manage medical professionals and their patient assignments" />

      <MedicalStaffView />
    </>
  );
}