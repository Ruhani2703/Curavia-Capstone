import { CONFIG } from 'src/config-global';

import { LiveMonitorView } from 'src/sections/admin/live-monitor';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Live Patient Monitor - ${CONFIG.appName}`}</title>
      <meta name="description" content="Real-time patient monitoring with ThingSpeak integration" />

      <LiveMonitorView />
    </>
  );
}