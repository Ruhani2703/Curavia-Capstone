import type { Theme, SxProps, Breakpoint } from '@mui/material/styles';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';

import { usePathname } from 'src/routes/hooks';

import { varAlpha } from 'minimal-shared/utils';

import { Nav } from './nav';
import { Main } from './main';
import { layoutClasses } from '../core';
import { HeaderSection } from '../core/header-section';
import { LayoutSection } from '../core/layout-section';
import { patientNavData } from '../nav-config-patient';
import { AccountPopover } from '../components/account-popover';
import { _account } from '../nav-config-account';

// ----------------------------------------------------------------------

export type PatientLayoutProps = {
  sx?: SxProps<Theme>;
  children: React.ReactNode;
  header?: {
    sx?: SxProps<Theme>;
  };
};

export function PatientLayout({ sx, children, header }: PatientLayoutProps) {
  const theme = useTheme();
  const pathname = usePathname();

  const [navOpen, setNavOpen] = useState(false);

  const layoutQuery: Breakpoint = 'lg';

  return (
    <LayoutSection
      /** **************************************
       * Header
       *************************************** */
      headerSection={
        <HeaderSection
          layoutQuery={layoutQuery}
          onNavToggle={() => setNavOpen((prev) => !prev)}
          sx={{
            bgcolor: 'var(--layout-header-bg)',
            position: { [layoutQuery]: 'fixed' },
            ...header?.sx,
          }}
          slots={{
            topArea: (
              <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
                This is an info Alert.
              </Alert>
            ),
            rightArea: (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0, sm: 0.75 } }}>
                <AccountPopover data={_account} />
              </Box>
            ),
          }}
        />
      }
      /** **************************************
       * Sidebar
       *************************************** */
      sidebarSection={
        <Nav
          data={patientNavData}
          layoutQuery={layoutQuery}
          navOpen={navOpen}
          onNavClose={() => setNavOpen(false)}
        />
      }
      /** **************************************
       * Footer
       *************************************** */
      footerSection={null}
      /** **************************************
       * Style
       *************************************** */
      cssVars={{
        '--layout-nav-bg': varAlpha(theme.palette.background.defaultChannel, 0.9),
        '--layout-header-bg': varAlpha(theme.palette.background.defaultChannel, 0.8),
      }}
      sx={{
        [`& .${layoutClasses.hasSidebar}`]: {
          [theme.breakpoints.up(layoutQuery)]: {
            pl: 'var(--layout-nav-width)',
          },
        },
        ...sx,
      }}
    >
      <Main>{children}</Main>
    </LayoutSection>
  );
}