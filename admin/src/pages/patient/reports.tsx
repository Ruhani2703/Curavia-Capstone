import { CONFIG } from 'src/config-global';
import { MonthlyReportView } from 'src/sections/patient/reports/monthly-report-view';

// ----------------------------------------------------------------------

export default function PatientReportsPage() {
  return (
    <>
      <title>{`My Reports - ${CONFIG.appName}`}</title>
      <meta
        name="description"
        content="Weekly and monthly recovery reports to share with your doctor"
      />
      <meta name="keywords" content="reports,progress,recovery,doctor,monthly,weekly" />

      <MonthlyReportView />
    </>
  );
}