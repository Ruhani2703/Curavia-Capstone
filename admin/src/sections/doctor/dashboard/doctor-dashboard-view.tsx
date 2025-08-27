import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Button
} from '@mui/material';
import { Icon } from '@iconify/react';
import { useRouter } from 'src/routes/hooks';
import apiHelper from 'src/utils/apiHelper';

interface Patient {
  _id: string;
  name: string;
  patientId: string;
  surgeryType: string;
  actualRecoveryProgress: number;
  isBandActive: boolean;
  age: number;
  gender: string;
}

interface DashboardStats {
  totalPatients: number;
  criticalPatients: number;
  activeBands: number;
  pendingAlerts: number;
}

interface AlertData {
  _id: string;
  title: string;
  severity: string;
  createdAt: string;
  userId: {
    name: string;
    patientId: string;
  };
}

interface DashboardData {
  statistics: DashboardStats;
  assignedPatients: Patient[];
  recentAlerts: AlertData[];
  patientsByStatus: {
    critical: number;
    stable: number;
    recovering: number;
  };
}

export function DoctorDashboardView() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiHelper.get('/doctor/dashboard');
      
      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'error';
    if (progress < 70) return 'warning';
    return 'success';
  };

  const getProgressText = (progress: number) => {
    if (progress < 30) return 'Critical';
    if (progress < 70) return 'Stable';
    return 'Recovering';
  };

  const handleViewPatient = (patientId: string) => {
    router.push(`/admin/patient/${patientId}`);
  };

  const handleViewAllPatients = () => {
    router.push('/admin/doctor/patients');
  };

  const handleViewAllAlerts = () => {
    router.push('/admin/alert-management');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!dashboardData) return null;

  const { statistics, assignedPatients, recentAlerts, patientsByStatus } = dashboardData;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Doctor Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor your assigned patients and manage their care
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Icon icon="material-symbols:person" width={24} />
                </Avatar>
                <Box>
                  <Typography variant="h4">{statistics.totalPatients}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Patients
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                  <Icon icon="material-symbols:warning" width={24} />
                </Avatar>
                <Box>
                  <Typography variant="h4">{statistics.criticalPatients}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Critical Patients
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <Icon icon="material-symbols:check-circle" width={24} />
                </Avatar>
                <Box>
                  <Typography variant="h4">{statistics.activeBands}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Bands
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Icon icon="material-symbols:notifications" width={24} />
                </Avatar>
                <Box>
                  <Typography variant="h4">{statistics.pendingAlerts}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Alerts
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Patient Status Overview */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Patient Status Overview"
              avatar={<Icon icon="material-symbols:trending-up" style={{ color: '#1976d2' }} width={24} />}
            />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Critical</Typography>
                  <Typography variant="body2" color="error.main">
                    {patientsByStatus.critical}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Stable</Typography>
                  <Typography variant="body2" color="warning.main">
                    {patientsByStatus.stable}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Recovering</Typography>
                  <Typography variant="body2" color="success.main">
                    {patientsByStatus.recovering}
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleViewAllPatients}
                startIcon={<Icon icon="material-symbols:person" width={20} />}
              >
                View All Patients
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Patients */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Recent Patients"
              avatar={<Icon icon="material-symbols:local-hospital" style={{ color: '#1976d2' }} width={24} />}
            />
            <CardContent sx={{ pt: 0 }}>
              <List dense>
                {assignedPatients.slice(0, 5).map((patient, index) => (
                  <Box key={patient._id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" noWrap>
                              {patient.name}
                            </Typography>
                            <Chip
                              size="small"
                              label={getProgressText(patient.actualRecoveryProgress)}
                              color={getProgressColor(patient.actualRecoveryProgress) as any}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={`ID: ${patient.patientId}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          size="small"
                          onClick={() => handleViewPatient(patient._id)}
                        >
                          <Icon icon="material-symbols:visibility" width={18} />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < assignedPatients.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
              {assignedPatients.length > 5 && (
                <Button
                  variant="text"
                  size="small"
                  onClick={handleViewAllPatients}
                  sx={{ mt: 1 }}
                >
                  View {assignedPatients.length - 5} more patients
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Alerts */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Recent Alerts"
              avatar={<Icon icon="material-symbols:notifications" style={{ color: '#1976d2' }} width={24} />}
              action={
                <IconButton onClick={handleViewAllAlerts}>
                  <Icon icon="material-symbols:visibility" width={24} />
                </IconButton>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              <List dense>
                {recentAlerts.slice(0, 5).map((alert, index) => (
                  <Box key={alert._id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32,
                            bgcolor: alert.severity === 'critical' ? 'error.main' : 
                                   alert.severity === 'high' ? 'warning.main' : 'info.main'
                          }}
                        >
                          <Icon icon="material-symbols:warning" width={16} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" noWrap>
                            {alert.title}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {alert.userId.name} ({alert.userId.patientId})
                            </Typography>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(alert.createdAt).toLocaleTimeString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentAlerts.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
              {recentAlerts.length === 0 && (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                  No recent alerts
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}