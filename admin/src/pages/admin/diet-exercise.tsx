import { CONFIG } from 'src/config-global';

import { DietExerciseView } from 'src/sections/admin/diet-exercise';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Diet & Exercise Management - ${CONFIG.appName}`}</title>
      <meta name="description" content="Manage nutritional and physical therapy programs for post-surgery recovery" />

      <DietExerciseView />
    </>
  );
}