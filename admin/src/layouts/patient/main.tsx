import type { Theme, SxProps } from '@mui/material/styles';

import { layoutClasses } from '../core';

// ----------------------------------------------------------------------

export type MainProps = {
  sx?: SxProps<Theme>;
  children: React.ReactNode;
};

export function Main({ sx, children }: MainProps) {
  return (
    <main className={layoutClasses.main} style={{ flexGrow: 1, paddingTop: 'var(--layout-header-height)' }}>
      <div style={{ maxWidth: '100%', margin: '0 auto', padding: '24px' }}>
        {children}
      </div>
    </main>
  );
}