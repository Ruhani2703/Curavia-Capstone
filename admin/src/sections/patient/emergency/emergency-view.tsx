import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function EmergencyView() {
  const emergencyActions = [
    {
      title: 'Call 911',
      description: 'For life-threatening emergencies',
      color: 'error' as const,
      icon: 'solar:phone-calling-bold',
    },
    {
      title: 'Alert Doctor',
      description: 'Contact your assigned doctor',
      color: 'warning' as const,
      icon: 'solar:user-cross-bold',
    },
    {
      title: 'Emergency Contact',
      description: 'Call your emergency contact',
      color: 'info' as const,
      icon: 'solar:users-group-rounded-bold',
    },
  ];

  return (
    <DashboardContent>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" color="error">
          Emergency
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Quick access to emergency services and contacts
        </Typography>
      </Box>

      <Alert severity="error" sx={{ mb: 3 }}>
        <Typography variant="h6">In case of emergency:</Typography>
        <Typography variant="body2">
          If you are experiencing a life-threatening emergency, call 911 immediately.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {emergencyActions.map((action) => (
          <Grid item xs={12} md={4} key={action.title}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Iconify
                  icon={action.icon}
                  sx={{ fontSize: 60, color: `${action.color}.main`, mb: 2 }}
                />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {action.description}
                </Typography>
                <Button
                  variant="contained"
                  color={action.color}
                  size="large"
                  fullWidth
                  startIcon={<Iconify icon={action.icon} />}
                >
                  {action.title}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </DashboardContent>
  );
}