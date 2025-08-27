import { CONFIG } from 'src/config-global';
import { DietPlanView } from 'src/sections/patient/diet/diet-plan-view';

// ----------------------------------------------------------------------

export default function DietPage() {
  return (
    <>
      <title>{`Diet Plan - ${CONFIG.appName}`}</title>
      <meta
        name="description"
        content="Personalized diet plan and nutrition tracking for optimal recovery"
      />
      <meta name="keywords" content="diet,nutrition,meal,plan,calories,health,recovery" />

      <DietPlanView />
    </>
  );
}