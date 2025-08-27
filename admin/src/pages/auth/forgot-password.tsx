import { CONFIG } from 'src/config-global';

import { ForgotPasswordView } from 'src/sections/auth';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Forgot Password - ${CONFIG.appName}`}</title>
      <meta name="description" content="Reset your Curavia account password" />

      <ForgotPasswordView />
    </>
  );
}