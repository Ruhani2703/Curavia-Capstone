import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Badge from '@mui/material/Badge';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import apiHelper from 'src/utils/apiHelper';
import { setupDevAuth, checkDevAuth } from 'src/utils/devAuth';

// ----------------------------------------------------------------------

const EMERGENCY_TYPES = ['All', 'Critical Vitals', 'Cardiac', 'Respiratory', 'Neurological', 'Fall Detection', 'SOS'];
const RESPONSE_STATUS = ['All', 'Active', 'Responding', 'Resolved'];

interface Emergency {
  _id: string;
  patientId: string;
  patientName: string;
  type: string;
  severity: 'critical' | 'high' | 'medium';
  status: 'active' | 'responding' | 'resolved';
  description: string;
  location?: string;
  vitals?: any;
  timestamp: string;
  responseTime?: number;
  responders?: string[];
  resolution?: string;
}

export function DoctorEmergencyView() {
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [filteredEmergencies, setFilteredEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [responding, setResponding] = useState(false);

  // Real-time emergency monitoring
  const fetchEmergencies = useCallback(async () => {
    try {
      setError('');
      
      // Check if authenticated
      if (!checkDevAuth()) {
        const authSuccess = await setupDevAuth('doctor');
        if (!authSuccess) {
          setError('Failed to authenticate. Please check your credentials.');
          setLoading(false);
          return;
        }
      }
      
      // Fetch critical alerts that qualify as emergencies
      const response = await apiHelper.get('/alert?severity=critical,high&status=pending,acknowledged');
      
      if (response.alerts) {
        // Transform alerts to emergency format
        const emergencyData = response.alerts.map((alert: any) => ({
          _id: alert._id,
          patientId: alert.userId?._id || 'unknown',
          patientName: alert.userId?.name || 'Unknown Patient',
          type: getEmergencyType(alert.type, alert.details),
          severity: alert.severity,
          status: getEmergencyStatus(alert.status),
          description: alert.message,
          location: alert.details?.location || 'Room 101',
          vitals: alert.details?.vital_signs,
          timestamp: alert.createdAt,
          responseTime: calculateResponseTime(alert.createdAt, alert.acknowledgedAt),
          responders: alert.details?.responders || [],
          resolution: alert.details?.resolution
        }));
        
        // Add some mock emergency data for demonstration
        const mockEmergencies = generateMockEmergencies();
        const allEmergencies = [...emergencyData, ...mockEmergencies];
        
        setEmergencies(allEmergencies);
        setFilteredEmergencies(allEmergencies);
      } else {
        // Fallback to mock data
        const mockEmergencies = generateMockEmergencies();
        setEmergencies(mockEmergencies);
        setFilteredEmergencies(mockEmergencies);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch emergencies');
      console.error('Error fetching emergencies:', err);
      
      // Use mock data as fallback
      const mockEmergencies = generateMockEmergencies();
      setEmergencies(mockEmergencies);
      setFilteredEmergencies(mockEmergencies);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmergencies();
    
    // Set up real-time polling for emergency updates
    const interval = setInterval(fetchEmergencies, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [fetchEmergencies]);

  // Filter emergencies based on type and status
  useEffect(() => {
    let filtered = emergencies;

    if (filterType !== 'All') {
      filtered = filtered.filter(emergency => emergency.type === filterType);
    }

    if (filterStatus !== 'All') {
      filtered = filtered.filter(emergency => emergency.status === filterStatus.toLowerCase());
    }

    setFilteredEmergencies(filtered);
  }, [emergencies, filterType, filterStatus]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return 'solar:danger-triangle-bold';
      case 'high': return 'solar:shield-warning-bold';
      case 'medium': return 'solar:info-circle-bold';
      default: return 'solar:info-circle-bold';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'success';
      case 'responding': return 'info';
      case 'active': return 'error';
      default: return 'default';
    }
  };

  const handleRespond = async (emergencyId: string) => {
    setResponding(true);
    try {
      // Update emergency status to responding
      const updatedEmergencies = emergencies.map(emergency => 
        emergency._id === emergencyId 
          ? { ...emergency, status: 'responding' as const, responders: ['Dr. Current'] }
          : emergency
      );
      
      setEmergencies(updatedEmergencies);
      
      // In a real app, this would make an API call
      // await apiHelper.put(`/emergency/${emergencyId}/respond`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to respond to emergency');
    } finally {
      setResponding(false);
    }
  };

  const handleResolve = async (emergencyId: string) => {
    try {
      const updatedEmergencies = emergencies.map(emergency => 
        emergency._id === emergencyId 
          ? { ...emergency, status: 'resolved' as const, resolution: 'Emergency resolved by medical team' }
          : emergency
      );
      
      setEmergencies(updatedEmergencies);
      
      if (selectedEmergency && selectedEmergency._id === emergencyId) {
        setDetailDialog(false);
        setSelectedEmergency(null);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve emergency');
    }
  };

  const activeCount = emergencies.filter(e => e.status === 'active').length;
  const respondingCount = emergencies.filter(e => e.status === 'responding').length;
  const criticalCount = emergencies.filter(e => e.severity === 'critical').length;

  if (loading) {
    return (
      <DashboardContent>
        <Box sx={{ mb: 5 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Emergency Response 🚨
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor and respond to patient emergencies
          </Typography>
        </Box>

        <Stack spacing={3}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading emergency data...
          </Typography>
        </Stack>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Emergency Response 🚨
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor and respond to patient emergencies
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="error"
            startIcon={<Iconify icon="solar:phone-calling-bold" />}
            disabled={activeCount === 0}
          >
            Emergency Call ({activeCount})
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={fetchEmergencies}
            disabled={loading}
            startIcon={<Iconify icon="solar:refresh-bold" />}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {/* Emergency Status Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center', bgcolor: activeCount > 0 ? 'error.lighter' : 'background.paper' }}>
            <Typography variant="h3" color="error.main">
              {activeCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Emergencies
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="info.main">
              {respondingCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Responding
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="warning.main">
              {criticalCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Critical Level
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="success.main">
              {emergencies.filter(e => e.status === 'resolved').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Resolved Today
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Emergency Management */}
      <Card sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h6">Emergency Cases</Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              select
              size="small"
              label="Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              {EMERGENCY_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              {RESPONSE_STATUS.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>

        {filteredEmergencies.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Iconify icon="solar:shield-check-bold" width={48} sx={{ color: 'success.main', mb: 2 }} />
            <Typography variant="h6">No active emergencies</Typography>
            <Typography variant="body2" color="text.secondary">
              All patients are stable. Emergency monitoring is active.
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredEmergencies.map((emergency, index) => (
              <Box key={emergency._id}>
                <ListItem
                  sx={{ 
                    px: 0,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    ...(emergency.status === 'active' && { bgcolor: 'error.lighter' })
                  }}
                  onClick={() => {
                    setSelectedEmergency(emergency);
                    setDetailDialog(true);
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      variant="dot"
                      color={emergency.status === 'active' ? 'error' : emergency.status === 'responding' ? 'warning' : 'success'}
                    >
                      <Avatar 
                        sx={{ 
                          bgcolor: `${getSeverityColor(emergency.severity)}.main`,
                          color: 'white'
                        }}
                      >
                        <Iconify icon={getSeverityIcon(emergency.severity)} />
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle2">
                          {emergency.patientName} - {emergency.type}
                        </Typography>
                        <Chip
                          size="small"
                          label={emergency.severity}
                          color={getSeverityColor(emergency.severity) as any}
                          variant="soft"
                        />
                        <Chip
                          size="small"
                          label={emergency.status}
                          color={getStatusColor(emergency.status) as any}
                          variant="outlined"
                        />
                      </Stack>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {emergency.description}
                        </Typography>
                        <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            📍 {emergency.location}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            🕐 {new Date(emergency.timestamp).toLocaleString()}
                          </Typography>
                          {emergency.responseTime && (
                            <Typography variant="caption" color="success.main">
                              Response: {emergency.responseTime}m
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={1}>
                      {emergency.status === 'active' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="warning"
                          startIcon={<Iconify icon="solar:user-speak-bold" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRespond(emergency._id);
                          }}
                          disabled={responding}
                        >
                          Respond
                        </Button>
                      )}
                      {emergency.status !== 'resolved' && (
                        <IconButton 
                          size="small"
                          color="success"
                          title="Mark Resolved"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResolve(emergency._id);
                          }}
                        >
                          <Iconify icon="solar:shield-check-bold" />
                        </IconButton>
                      )}
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredEmergencies.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Card>

      {/* Emergency Detail Dialog */}
      <Dialog 
        open={detailDialog} 
        onClose={() => setDetailDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar 
              sx={{ 
                bgcolor: `${getSeverityColor(selectedEmergency?.severity || 'medium')}.main`,
                color: 'white'
              }}
            >
              <Iconify icon={getSeverityIcon(selectedEmergency?.severity || 'medium')} />
            </Avatar>
            <Box>
              <Typography variant="h6">Emergency: {selectedEmergency?.type}</Typography>
              <Typography variant="body2" color="text.secondary">
                Patient: {selectedEmergency?.patientName}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent>
          {selectedEmergency && (
            <Stack spacing={3}>
              <Alert severity={getSeverityColor(selectedEmergency.severity) as any}>
                <Typography variant="subtitle2">
                  {selectedEmergency.severity.toUpperCase()} EMERGENCY
                </Typography>
                <Typography variant="body2">
                  {selectedEmergency.description}
                </Typography>
              </Alert>

              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip
                    label={selectedEmergency.status}
                    color={getStatusColor(selectedEmergency.status) as any}
                    variant="soft"
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Location</Typography>
                  <Typography variant="body1">📍 {selectedEmergency.location}</Typography>
                </Grid>
                <Grid xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Time</Typography>
                  <Typography variant="body1">
                    {new Date(selectedEmergency.timestamp).toLocaleString()}
                  </Typography>
                </Grid>
                {selectedEmergency.responseTime && (
                  <Grid xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Response Time</Typography>
                    <Typography variant="body1" color="success.main">
                      {selectedEmergency.responseTime} minutes
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {selectedEmergency.vitals && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Current Vitals</Typography>
                  <Grid container spacing={2}>
                    {Object.entries(selectedEmergency.vitals).map(([key, value]) => (
                      <Grid xs={6} sm={3} key={key}>
                        <Typography variant="caption" color="text.secondary">
                          {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                        </Typography>
                        <Typography variant="h6">
                          {String(value)}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              )}

              {selectedEmergency.responders && selectedEmergency.responders.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Responding Team</Typography>
                  <Stack direction="row" spacing={1}>
                    {selectedEmergency.responders.map((responder, index) => (
                      <Chip key={index} label={responder} variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              )}

              {selectedEmergency.resolution && (
                <Alert severity="success">
                  <Typography variant="subtitle2">Resolution</Typography>
                  <Typography variant="body2">{selectedEmergency.resolution}</Typography>
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
          {selectedEmergency && selectedEmergency.status === 'active' && (
            <Button 
              variant="contained" 
              color="warning"
              onClick={() => {
                if (selectedEmergency) {
                  handleRespond(selectedEmergency._id);
                }
              }}
              disabled={responding}
            >
              Respond
            </Button>
          )}
          {selectedEmergency && selectedEmergency.status !== 'resolved' && (
            <Button 
              variant="contained" 
              color="success"
              onClick={() => {
                if (selectedEmergency) {
                  handleResolve(selectedEmergency._id);
                }
              }}
            >
              Mark Resolved
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}

// Helper functions
function getEmergencyType(alertType: string, details: any): string {
  if (alertType === 'vital_breach') {
    if (details?.vital_type === 'heartRate') return 'Cardiac';
    if (details?.vital_type === 'spO2') return 'Respiratory';
    return 'Critical Vitals';
  }
  if (alertType === 'ml_anomaly') return 'Critical Vitals';
  if (alertType === 'fall_detection') return 'Fall Detection';
  if (alertType === 'sos') return 'SOS';
  return 'Critical Vitals';
}

function getEmergencyStatus(alertStatus: string): 'active' | 'responding' | 'resolved' {
  if (alertStatus === 'pending') return 'active';
  if (alertStatus === 'acknowledged') return 'responding';
  if (alertStatus === 'resolved') return 'resolved';
  return 'active';
}

function calculateResponseTime(createdAt: string, acknowledgedAt?: string): number | undefined {
  if (!acknowledgedAt) return undefined;
  const created = new Date(createdAt);
  const acknowledged = new Date(acknowledgedAt);
  return Math.floor((acknowledged.getTime() - created.getTime()) / (1000 * 60)); // minutes
}

// Mock emergency data for demonstration
function generateMockEmergencies(): Emergency[] {
  return [
    {
      _id: 'emergency_1',
      patientId: 'patient_1',
      patientName: 'John Smith',
      type: 'Cardiac',
      severity: 'critical',
      status: 'active',
      description: 'Heart rate critically high: 145 BPM. Patient experiencing chest pain.',
      location: 'Room 201A',
      vitals: { heartRate: 145, bloodPressure: '160/95', spO2: 92 },
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      responders: [],
    },
    {
      _id: 'emergency_2',
      patientId: 'patient_2',
      patientName: 'Sarah Johnson',
      type: 'Respiratory',
      severity: 'high',
      status: 'responding',
      description: 'Blood oxygen saturation dropped to 85%. Respiratory distress detected.',
      location: 'Room 105B',
      vitals: { heartRate: 110, bloodPressure: '140/85', spO2: 85 },
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      responseTime: 3,
      responders: ['Dr. Smith', 'Nurse Jennifer'],
    },
    {
      _id: 'emergency_3',
      patientId: 'patient_3',
      patientName: 'Michael Chen',
      type: 'Fall Detection',
      severity: 'medium',
      status: 'resolved',
      description: 'Patient fall detected in bathroom. No injuries sustained.',
      location: 'Room 302C',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      responseTime: 2,
      responders: ['Nurse Patricia', 'Dr. Wilson'],
      resolution: 'Patient assessed, no injuries. Fall prevention measures reviewed.',
    },
  ];
}