import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

import { DashboardContent } from 'src/layouts/dashboard';

// ----------------------------------------------------------------------

export function PatientReportsView() {
  return (
    <DashboardContent>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4">
          My Reports
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Recovery reports to share with your doctor
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Coming Soon: Patient Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This page will show weekly and monthly recovery reports you can share with your doctor.
          </Typography>
        </CardContent>
      </Card>
    </DashboardContent>
  );
}