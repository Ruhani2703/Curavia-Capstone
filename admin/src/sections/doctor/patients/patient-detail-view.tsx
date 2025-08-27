import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Avatar,
  Chip,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Paper
} from '@mui/material';
import { Icon } from '@iconify/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useRouter, useParams } from 'src/routes/hooks';
import apiHelper from 'src/utils/apiHelper';

interface VitalTrend {
  value: number;
  timestamp: string;
}

interface Patient {
  _id: string;
  name: string;
  email: string;
  patientId: string;
  surgeryType: string;
  surgeryDate: string;
  actualRecoveryProgress: number;
  age: number;
  gender: string;
  bloodGroup: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  assignedDoctors: Array<{
    name: string;
    email: string;
  }>;
  clinicalNotes?: Array<{
    note: string;
    type: string;
    priority: string;
    addedAt: string;
  }>;
}

interface VitalsTrends {
  heartRate: VitalTrend[];
  bloodPressure: Array<{
    systolic: number;
    diastolic: number;
    timestamp: string;
  }>;
  temperature: VitalTrend[];
  spO2: VitalTrend[];
}

interface PatientDetail {
  patient: Patient;
  latestVitals: any;
  vitalsTrends: VitalsTrends;
  alerts: any[];
  statistics: {
    totalAlerts: number;
    criticalAlerts: number;
    avgHeartRate: number;
    dataPoints: number;
  };
}

export function PatientDetailView() {
  const router = useRouter();
  const { patientId } = useParams();
  const [patientData, setPatientData] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState({
    note: '',
    type: 'general',
    priority: 'normal'
  });

  useEffect(() => {
    if (patientId) {
      fetchPatientDetail();
    }
  }, [patientId]);

  const fetchPatientDetail = async () => {
    try {
      setLoading(true);
      const response = await apiHelper.get(`/doctor/patient/${patientId}`);
      
      if (response.success) {
        setPatientData(response.data);
      } else {
        setError('Failed to load patient details');
      }
    } catch (err: any) {
      console.error('Patient detail fetch error:', err);
      setError(err.message || 'Failed to load patient details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    try {
      await apiHelper.post(`/doctor/patient/${patientId}/notes`, newNote);
      setNoteDialogOpen(false);
      setNewNote({ note: '', type: 'general', priority: 'normal' });
      fetchPatientDetail(); // Refresh data
    } catch (err: any) {
      console.error('Add note error:', err);
    }
  };

  const formatChartData = (trends: VitalTrend[]) => {
    return trends.slice(-24).map(trend => ({
      ...trend,
      time: new Date(trend.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
  };

  const formatBPChartData = (bpTrends: VitalsTrends['bloodPressure']) => {
    return bpTrends.slice(-24).map(bp => ({
      time: new Date(bp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      systolic: bp.systolic,
      diastolic: bp.diastolic
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading patient details...</Typography>
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

  if (!patientData) return null;

  const { patient, latestVitals, vitalsTrends, alerts, statistics } = patientData;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => router.back()}>
          <Icon icon="material-symbols:arrow-back" width={20} />
        </IconButton>
        <Avatar sx={{ width: 60, height: 60 }}>
          {patient.name.split(' ').map(n => n[0]).join('')}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1">
            {patient.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Patient ID: {patient.patientId} • {patient.surgeryType}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="material-symbols:note" width={20} />}
          onClick={() => setNoteDialogOpen(true)}
        >
          Add Note
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Patient Info */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 'fit-content' }}>
            <CardHeader title="Patient Information" />
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Personal Details
                  </Typography>
                  <Typography variant="body2">
                    Age: {patient.age} years
                  </Typography>
                  <Typography variant="body2">
                    Gender: {patient.gender}
                  </Typography>
                  <Typography variant="body2">
                    Blood Group: {patient.bloodGroup}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Surgery Information
                  </Typography>
                  <Typography variant="body2">
                    Type: {patient.surgeryType}
                  </Typography>
                  <Typography variant="body2">
                    Date: {new Date(patient.surgeryDate).toLocaleDateString()}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Recovery Progress: {patient.actualRecoveryProgress}%
                    </Typography>
                    <Box sx={{ 
                      width: '100%', 
                      height: 8, 
                      backgroundColor: 'grey.200', 
                      borderRadius: 4,
                      overflow: 'hidden'
                    }}>
                      <Box sx={{ 
                        width: `${patient.actualRecoveryProgress}%`, 
                        height: '100%',
                        backgroundColor: patient.actualRecoveryProgress < 30 ? 'error.main' :
                                       patient.actualRecoveryProgress < 70 ? 'warning.main' : 'success.main'
                      }} />
                    </Box>
                  </Box>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Emergency Contact
                  </Typography>
                  <Typography variant="body2">
                    {patient.emergencyContact.name} ({patient.emergencyContact.relation})
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <IconButton 
                      size="small" 
                      href={`tel:${patient.emergencyContact.phone}`}
                    >
                      <Icon icon="material-symbols:phone" width={16} />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      href={`mailto:${patient.email}`}
                    >
                      <Icon icon="material-symbols:email" width={16} />
                    </IconButton>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Latest Vitals Card */}
          {latestVitals && (
            <Card sx={{ mt: 2 }}>
              <CardHeader title="Latest Vitals" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Icon icon="material-symbols:favorite" style={{ color: '#f44336', marginRight: 8 }} width={16} />
                      <Typography variant="caption">Heart Rate</Typography>
                    </Box>
                    <Typography variant="h6">
                      {latestVitals.heartRate?.value || 'N/A'} bpm
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Icon icon="material-symbols:device-thermostat" style={{ color: '#ff9800', marginRight: 8 }} width={16} />
                      <Typography variant="caption">Temperature</Typography>
                    </Box>
                    <Typography variant="h6">
                      {latestVitals.temperature?.value || 'N/A'}°F
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption">Blood Pressure</Typography>
                    </Box>
                    <Typography variant="h6">
                      {latestVitals.bloodPressure?.systolic || 'N/A'}/
                      {latestVitals.bloodPressure?.diastolic || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Icon icon="material-symbols:air" style={{ color: '#0288d1', marginRight: 8 }} width={16} />
                      <Typography variant="caption">SpO2</Typography>
                    </Box>
                    <Typography variant="h6">
                      {latestVitals.spO2?.value || 'N/A'}%
                    </Typography>
                  </Grid>
                </Grid>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Last updated: {new Date(latestVitals.recordedAt).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Vitals Charts */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {/* Heart Rate Chart */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader 
                  title="Heart Rate Trend" 
                  avatar={<Icon icon="material-symbols:favorite" style={{ color: '#f44336' }} width={24} />}
                />
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={formatChartData(vitalsTrends.heartRate)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#f44336" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Temperature Chart */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader 
                  title="Temperature Trend" 
                  avatar={<Icon icon="material-symbols:device-thermostat" style={{ color: '#ff9800' }} width={24} />}
                />
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={formatChartData(vitalsTrends.temperature)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#ff9800" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Blood Pressure Chart */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Blood Pressure Trend" />
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={formatBPChartData(vitalsTrends.bloodPressure)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="systolic" 
                        stroke="#2196f3" 
                        strokeWidth={2}
                        dot={false}
                        name="Systolic"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="diastolic" 
                        stroke="#4caf50" 
                        strokeWidth={2}
                        dot={false}
                        name="Diastolic"
                      />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* SpO2 Chart */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader 
                  title="SpO2 Trend" 
                  avatar={<Icon icon="material-symbols:air" style={{ color: '#0288d1' }} width={24} />}
                />
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={formatChartData(vitalsTrends.spO2)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[90, 100]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#00bcd4" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Recent Alerts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title={`Recent Alerts (${alerts.length})`} 
              avatar={<Icon icon="material-symbols:warning" style={{ color: '#ff9800' }} width={24} />}
            />
            <CardContent sx={{ maxHeight: 400, overflowY: 'auto' }}>
              {alerts.length > 0 ? (
                <List dense>
                  {alerts.slice(0, 10).map((alert, index) => (
                    <ListItem key={alert._id} divider={index < alerts.length - 1}>
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            bgcolor: alert.severity === 'critical' ? 'error.main' : 
                                   alert.severity === 'high' ? 'warning.main' : 'info.main',
                            width: 32,
                            height: 32
                          }}
                        >
                          <Icon icon="material-symbols:warning" width={16} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={alert.title}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {alert.message}
                            </Typography>
                            <Chip
                              size="small"
                              label={alert.severity}
                              color={
                                alert.severity === 'critical' ? 'error' : 
                                alert.severity === 'high' ? 'warning' : 'info'
                              }
                              sx={{ mt: 0.5, mr: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(alert.createdAt).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center">
                  No recent alerts
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Clinical Notes */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Clinical Notes" 
              avatar={<Icon icon="material-symbols:note" style={{ color: '#1976d2' }} width={24} />}
            />
            <CardContent sx={{ maxHeight: 400, overflowY: 'auto' }}>
              {patient.clinicalNotes && patient.clinicalNotes.length > 0 ? (
                <List dense>
                  {patient.clinicalNotes.map((note, index) => (
                    <Paper key={index} sx={{ p: 2, mb: 2 }} elevation={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Chip
                          size="small"
                          label={note.type}
                          variant="outlined"
                        />
                        <Chip
                          size="small"
                          label={note.priority}
                          color={note.priority === 'critical' ? 'error' : 
                                note.priority === 'high' ? 'warning' : 'default'}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {note.note}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(note.addedAt).toLocaleString()}
                      </Typography>
                    </Paper>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center">
                  No clinical notes yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Clinical Note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Note"
            fullWidth
            multiline
            rows={4}
            value={newNote.note}
            onChange={(e) => setNewNote({ ...newNote, note: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newNote.type}
                  onChange={(e) => setNewNote({ ...newNote, type: e.target.value })}
                  label="Type"
                >
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="vitals">Vitals</MenuItem>
                  <MenuItem value="medication">Medication</MenuItem>
                  <MenuItem value="surgery">Surgery</MenuItem>
                  <MenuItem value="recovery">Recovery</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newNote.priority}
                  onChange={(e) => setNewNote({ ...newNote, priority: e.target.value })}
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddNote} variant="contained" disabled={!newNote.note.trim()}>
            Add Note
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}