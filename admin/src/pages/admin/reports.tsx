import { CONFIG } from 'src/config-global';

import { ReportsAnalyticsView } from 'src/sections/admin/reports';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Reports & Analytics - ${CONFIG.appName}`}</title>
      <meta name="description" content="Generate comprehensive system and medical reports with analytics" />

      <ReportsAnalyticsView />
    </>
  );
}