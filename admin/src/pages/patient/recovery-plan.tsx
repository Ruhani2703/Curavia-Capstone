import { CONFIG } from 'src/config-global';
import { RecoveryPlanView } from 'src/sections/patient/recovery-plan/recovery-plan-view';

// ----------------------------------------------------------------------

export default function RecoveryPlanPage() {
  return (
    <>
      <title>{`Recovery Plan - ${CONFIG.appName}`}</title>
      <meta
        name="description"
        content="Personalized recovery plan with diet recommendations and exercise schedule"
      />
      <meta name="keywords" content="recovery,diet,exercise,plan,recommendations,progress" />

      <RecoveryPlanView />
    </>
  );
}