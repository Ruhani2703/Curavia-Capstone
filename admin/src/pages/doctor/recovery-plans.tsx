import { CONFIG } from 'src/config-global';

import { DoctorRecoveryPlansView } from 'src/sections/doctor/recovery-plans';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Recovery Plans - ${CONFIG.appName}`}</title>
      <meta name="description" content="Manage patient recovery and treatment plans" />

      <DoctorRecoveryPlansView />
    </>
  );
}