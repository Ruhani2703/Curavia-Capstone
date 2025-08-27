import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import MenuItem from '@mui/material/MenuItem';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------


// ----------------------------------------------------------------------

export function EmergencyResponseView() {
  const [broadcastDialog, setBroadcastDialog] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState<any>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [broadcastData, setBroadcastData] = useState({
    type: 'system',
    message: '',
    priority: 'high'
  });
  const [emergencyData, setEmergencyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch emergency data on component mount and set up real-time updates
  useEffect(() => {
    fetchEmergencyData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchEmergencyData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchEmergencyData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/alert/emergency', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setEmergencyData(data);
        setError('');
      } else {
        throw new Error('Failed to fetch emergency data');
      }
    } catch (error) {
      console.error('Error fetching emergency data:', error);
      setError('Failed to load emergency data');
      // Fallback to empty structure
      setEmergencyData({
        activeEmergencies: [],
        recentEmergencies: [],
        hospitalContacts: [],
        responseTeams: [],
        summary: { activeCount: 0, availableTeams: 0, availableHospitals: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'error';
      case 'dispatched': return 'warning';
      case 'enroute': return 'info';
      case 'resolved': return 'success';
      case 'available': return 'success';
      case 'maintenance': return 'default';
      default: return 'default';
    }
  };

  const handleEmergencyClick = (emergency: any) => {
    setSelectedEmergency(emergency);
    setDetailDialog(true);
  };

  const handleBroadcast = () => {
    // Mock broadcast functionality
    setBroadcastDialog(false);
    setBroadcastData({ type: 'system', message: '', priority: 'high' });
  };

  return (
    <DashboardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
        <Typography variant="h4">
          Emergency Response Center 🚨
        </Typography>
        <Button
          variant="contained"
          color="error"
          size="large"
          startIcon={<Iconify icon="solar:siren-bold" />}
          onClick={() => setBroadcastDialog(true)}
        >
          Emergency Broadcast
        </Button>
      </Stack>

      {/* System Status Alert */}
      <Alert 
        severity="success" 
        icon={<Iconify icon="solar:shield-check-bold" />}
        sx={{ mb: 3 }}
      >
        <strong>System Status:</strong> All emergency response systems operational. 
        Response teams available: 2 active, 1 standby.
      </Alert>

      {/* Loading and Error States */}
      {loading && <LinearProgress sx={{ mb: 3 }} />}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Emergency Data Dependent Content */}
      {emergencyData && (
        <Grid container spacing={3}>
          <Grid xs={12} lg={8}>
            {/* Active Emergencies */}
            <Card sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'error.main' }}>
                🚨 Active Emergencies ({emergencyData.activeEmergencies.length})
              </Typography>
              
              {emergencyData.activeEmergencies.length === 0 ? (
                <Alert severity="success">No active emergencies</Alert>
              ) : (
                <Stack spacing={2}>
                  {emergencyData.activeEmergencies.map((emergency) => (
                    <Card 
                      key={emergency.id} 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        borderColor: 'error.main',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => handleEmergencyClick(emergency)}
                    >
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: 'error.main' }}>
                          <Iconify icon="solar:danger-triangle-bold" />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                            <Typography variant="subtitle2">{emergency.type}</Typography>
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
                              variant="soft"
                            />
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            {emergency.patient.name} ({emergency.patient.id}) • {emergency.timeStarted}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            📍 {emergency.location}
                          </Typography>
                          {emergency.assignedTeam && (
                            <Typography variant="body2" color="primary.main">
                              🚑 {emergency.assignedTeam} • ETA: {emergency.estimatedArrival}
                            </Typography>
                          )}
                        </Box>
                        <IconButton color="error">
                          <Iconify icon="solar:phone-calling-bold" />
                        </IconButton>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              )}
            </Card>

            {/* Recent Emergencies */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Emergency History
              </Typography>
              <List>
                {emergencyData.recentEmergencies.map((emergency, index) => (
                  <Box key={emergency.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <Iconify icon="solar:check-circle-bold" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${emergency.type} - ${emergency.patient.name}`}
                        secondary={`Resolved ${emergency.timeResolved} • Duration: ${emergency.duration}`}
                      />
                      <Chip
                        size="small"
                        label={emergency.outcome}
                        color="success"
                        variant="soft"
                      />
                    </ListItem>
                    {index < emergencyData.recentEmergencies.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </Card>
          </Grid>

          {/* Right Sidebar */}
          <Grid xs={12} lg={4}>
            {/* Hospital Contacts */}
            <Card sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Hospital Network
              </Typography>
              <Stack spacing={2}>
                {emergencyData.hospitalContacts.map((hospital, index) => (
                  <Box key={index}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ bgcolor: hospital.available ? 'success.main' : 'error.main' }}>
                        <Iconify icon="solar:health-bold" />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2">{hospital.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {hospital.distance} • {hospital.phone}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={hospital.available ? 'Available' : 'Full'}
                        color={hospital.available ? 'success' : 'error'}
                        variant="soft"
                      />
                    </Stack>
                    {index < emergencyData.hospitalContacts.length - 1 && <Divider sx={{ my: 1 }} />}
                  </Box>
                ))}
              </Stack>
            </Card>

            {/* Response Teams */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Response Teams
              </Typography>
              <Stack spacing={2}>
                {emergencyData.responseTeams.map((team) => (
                  <Box key={team.id}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ bgcolor: getStatusColor(team.status) + '.main' }}>
                        <Iconify icon="solar:shield-user-bold" />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2">{team.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {team.location}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={team.status}
                        color={getStatusColor(team.status) as any}
                        variant="soft"
                      />
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Emergency Broadcast Dialog */}
      <Dialog open={broadcastDialog} onClose={() => setBroadcastDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Iconify icon="solar:siren-bold" sx={{ color: 'error.main' }} />
            Emergency System Broadcast
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <FormControl>
              <FormLabel>Broadcast Type</FormLabel>
              <RadioGroup
                value={broadcastData.type}
                onChange={(e) => setBroadcastData({ ...broadcastData, type: e.target.value })}
              >
                <FormControlLabel value="system" control={<Radio />} label="System Alert" />
                <FormControlLabel value="emergency" control={<Radio />} label="Emergency Protocol" />
                <FormControlLabel value="evacuation" control={<Radio />} label="Evacuation Order" />
              </RadioGroup>
            </FormControl>

            <TextField
              select
              label="Priority Level"
              value={broadcastData.priority}
              onChange={(e) => setBroadcastData({ ...broadcastData, priority: e.target.value })}
            >
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
            </TextField>

            <TextField
              multiline
              rows={4}
              label="Emergency Message"
              placeholder="Enter emergency broadcast message..."
              value={broadcastData.message}
              onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
            />

            <Alert severity="warning">
              This will send an immediate alert to all connected patients, medical staff, and emergency services.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBroadcastDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleBroadcast}
            startIcon={<Iconify icon="solar:siren-bold" />}
          >
            Send Emergency Broadcast
          </Button>
        </DialogActions>
      </Dialog>

      {/* Emergency Detail Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Emergency Details - {selectedEmergency?.id}
        </DialogTitle>
        <DialogContent>
          {selectedEmergency && (
            <Grid container spacing={3}>
              <Grid xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Patient Information</Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Name:</strong> {selectedEmergency.patient.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>ID:</strong> {selectedEmergency.patient.id}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Age:</strong> {selectedEmergency.patient.age}
                  </Typography>
                </Stack>
              </Grid>
              <Grid xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Current Vitals</Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Heart Rate:</strong> {selectedEmergency.vitals.heartRate} bpm
                  </Typography>
                  <Typography variant="body2">
                    <strong>Blood Pressure:</strong> {selectedEmergency.vitals.bloodPressure}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Temperature:</strong> {selectedEmergency.vitals.temperature}°F
                  </Typography>
                  <Typography variant="body2">
                    <strong>Oxygen:</strong> {selectedEmergency.vitals.oxygen}%
                  </Typography>
                </Stack>
              </Grid>
              <Grid xs={12}>
                <Typography variant="subtitle2" gutterBottom>Location & Response</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Address:</strong> {selectedEmergency.location}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Response Team:</strong> {selectedEmergency.assignedTeam}
                </Typography>
                <Typography variant="body2">
                  <strong>ETA:</strong> {selectedEmergency.estimatedArrival}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
          <Button variant="contained" startIcon={<Iconify icon="solar:phone-calling-bold" />}>
            Contact Team
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}