import type { NavItem } from '../nav-config-patient';

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import { useTheme } from '@mui/material/styles';

import { usePathname } from 'src/routes/hooks';

import { varAlpha } from 'minimal-shared/utils';

import { Logo } from 'src/components/logo';
import { Scrollbar } from 'src/components/scrollbar';

import { WorkspacesPopover } from '../components/workspaces-popover';
import { NavUpgrade } from '../components/nav-upgrade';

import { patientNavData } from '../nav-config-patient';
import { NavList } from './nav-list';

// ----------------------------------------------------------------------

export type NavProps = {
  data: NavItem[];
  layoutQuery: string;
  navOpen: boolean;
  onNavClose: () => void;
};

export function Nav({ data, layoutQuery, navOpen, onNavClose }: NavProps) {
  const theme = useTheme();
  const pathname = usePathname();
  const { pathname: locationPathname } = useLocation();

  useEffect(() => {
    if (navOpen) {
      onNavClose();
    }
  }, [locationPathname, navOpen, onNavClose]);

  const renderContent = (
    <Box
      sx={{
        pb: 2,
        px: 2,
        pt: 3,
        width: 1,
        maxWidth: 280,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'var(--layout-nav-bg)',
      }}
    >
      <Logo />

      <Box
        sx={{
          my: 2,
          mx: 2.5,
          py: 2,
          px: 2.5,
          borderRadius: 1.5,
          bgcolor: varAlpha(theme.palette.grey['500Channel'], 0.08),
        }}
      >
        <WorkspacesPopover
          data={[
            { name: 'Recovery Dashboard', logo: '/assets/icons/workspaces/logo-1.webp' },
          ]}
        />
      </Box>

      <Scrollbar fillContent>
        <NavList data={data} />

        <Box sx={{ px: 2, pb: 1, mt: 4 }}>
          <NavUpgrade />
        </Box>
      </Scrollbar>
    </Box>
  );

  return (
    <Box
      sx={{
        py: 1,
        top: 0,
        width: 1,
        height: 1,
        position: 'fixed',
        display: { xs: 'none', [layoutQuery]: 'block' },
      }}
    >
      {renderContent}

      <Drawer
        open={navOpen}
        onClose={onNavClose}
        PaperProps={{
          sx: {
            pt: 2.5,
            px: 2.5,
            top: 'var(--layout-header-height)',
            width: 'var(--layout-nav-width)',
            height: 'calc(100vh - var(--layout-header-height))',
          },
        }}
      >
        {renderContent}
      </Drawer>
    </Box>
  );
}