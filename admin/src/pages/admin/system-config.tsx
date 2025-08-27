import { CONFIG } from 'src/config-global';

import { SystemConfigView } from 'src/sections/admin/system-config';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`System Configuration - ${CONFIG.appName}`}</title>
      <meta name="description" content="Technical system settings and maintenance for Curavia platform" />

      <SystemConfigView />
    </>
  );
}