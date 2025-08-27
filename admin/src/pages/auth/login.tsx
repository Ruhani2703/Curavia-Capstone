import { CONFIG } from 'src/config-global';

import { LoginView } from 'src/sections/auth';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Login - ${CONFIG.appName}`}</title>
      <meta name="description" content="Login to Curavia admin dashboard" />

      <LoginView />
    </>
  );
}