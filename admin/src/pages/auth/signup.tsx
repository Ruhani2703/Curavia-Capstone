import { CONFIG } from 'src/config-global';

import { SignupView } from 'src/sections/auth';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Sign Up - ${CONFIG.appName}`}</title>
      <meta name="description" content="Register for Curavia patient monitoring system" />

      <SignupView />
    </>
  );
}