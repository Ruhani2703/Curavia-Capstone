import type { NavItem } from '../nav-config-patient';

import Box from '@mui/material/Box';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';

import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

// ----------------------------------------------------------------------

type NavListProps = {
  data: NavItem[];
};

export function NavList({ data }: NavListProps) {
  const pathname = usePathname();

  return (
    <Box
      component="ul"
      sx={{
        gap: 0.5,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {data.map((item) => {
        const isActive = item.path === pathname;

        return (
          <ListItem disableGutters disablePadding key={item.title}>
            <ListItemButton
              disableGutters
              component={RouterLink}
              href={item.path}
              sx={[
                (theme) => ({
                  pl: 2,
                  pr: 1.5,
                  py: 0.75,
                  gap: 1.5,
                  color: 'var(--layout-nav-item-color)',
                  minHeight: 'var(--layout-nav-item-height)',
                  typography: 'body2',
                  fontWeight: 'fontWeightMedium',
                  ...(isActive && {
                    color: 'var(--layout-nav-item-active-color)',
                    bgcolor: 'var(--layout-nav-item-active-bg)',
                  }),
                }),
              ]}
            >
              <Box component="span" sx={{ width: 24, height: 24 }}>
                {item.icon}
              </Box>

              <Box component="span" sx={{ flexGrow: 1 }}>
                {item.title}
              </Box>

              {item.info && item.info}
            </ListItemButton>
          </ListItem>
        );
      })}
    </Box>
  );
}