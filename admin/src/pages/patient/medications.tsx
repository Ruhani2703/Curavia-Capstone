import { CONFIG } from 'src/config-global';
import { MedicationScheduleView } from 'src/sections/patient/medications/medication-schedule-view';

// ----------------------------------------------------------------------

export default function MedicationsPage() {
  return (
    <>
      <title>{`Medications - ${CONFIG.appName}`}</title>
      <meta
        name="description"
        content="Medication schedule, reminders, and adherence tracking"
      />
      <meta name="keywords" content="medications,reminders,schedule,pills,adherence" />

      <MedicationScheduleView />
    </>
  );
}