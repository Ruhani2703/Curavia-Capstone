import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Button,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Paper,
  LinearProgress,
  Tooltip
} from '@mui/material';
import { Icon } from '@iconify/react';
import { useAuth } from 'src/contexts/AuthContext';
import apiHelper from 'src/utils/apiHelper';

interface Medication {
  _id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  prescribedBy: string;
  startDate: string;
  endDate?: string;
  totalDoses: number;
  takenDoses: number;
  status: 'active' | 'completed' | 'paused';
}

interface MedicationSchedule {
  _id: string;
  medicationId: string;
  medication: Medication;
  scheduledTime: string;
  actualTime?: string;
  status: 'pending' | 'taken' | 'missed' | 'skipped';
  notes?: string;
  sideEffects?: string[];
}

interface MedicationData {
  medications: Medication[];
  todaySchedule: MedicationSchedule[];
  weeklySchedule: MedicationSchedule[];
  adherenceStats: {
    overallRate: number;
    thisWeek: number;
    thisMonth: number;
    streakDays: number;
  };
  upcomingReminders: Array<{
    medication: string;
    time: string;
    timeUntil: string;
  }>;
}

const SIDE_EFFECTS = [
  'Nausea', 'Dizziness', 'Headache', 'Drowsiness', 'Fatigue', 
  'Stomach upset', 'Dry mouth', 'Sleep issues', 'Other'
];

export function MedicationScheduleView() {
  const { user } = useAuth();
  const [medicationData, setMedicationData] = useState<MedicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<MedicationSchedule | null>(null);
  const [logData, setLogData] = useState({
    status: 'taken' as 'taken' | 'missed' | 'skipped',
    actualTime: new Date().toTimeString().slice(0, 5),
    notes: '',
    sideEffects: [] as string[]
  });

  useEffect(() => {
    fetchMedicationData();
  }, [selectedDate]);

  const fetchMedicationData = async () => {
    try {
      setLoading(true);
      const response = await apiHelper.get(`/patient/medications?date=${selectedDate}`);
      
      if (response.success) {
        setMedicationData(response.data);
      } else {
        setError('Failed to load medication data');
      }
    } catch (err: any) {
      console.error('Medication data fetch error:', err);
      setError(err.message || 'Failed to load medication data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogMedication = async () => {
    if (!selectedSchedule) return;

    try {
      const response = await apiHelper.post(`/patient/medication-log/${selectedSchedule._id}`, {
        ...logData,
        loggedAt: new Date()
      });

      if (response.success) {
        setLogDialogOpen(false);
        setSelectedSchedule(null);
        setLogData({
          status: 'taken',
          actualTime: new Date().toTimeString().slice(0, 5),
          notes: '',
          sideEffects: []
        });
        fetchMedicationData();
      }
    } catch (err: any) {
      console.error('Log medication error:', err);
      setError(err.message || 'Failed to log medication');
    }
  };

  const openLogDialog = (schedule: MedicationSchedule) => {
    setSelectedSchedule(schedule);
    setLogDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken': return 'success';
      case 'pending': return 'warning';
      case 'missed': return 'error';
      case 'skipped': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken': return <Icon icon="material-symbols:check-circle" style={{ color: '#4caf50' }} width={24} />;
      case 'pending': return <Icon icon="material-symbols:timer" style={{ color: '#ff9800' }} width={24} />;
      case 'missed': return <Icon icon="material-symbols:warning" style={{ color: '#f44336' }} width={24} />;
      case 'skipped': return <Icon icon="material-symbols:cancel" style={{ color: '#9e9e9e' }} width={24} />;
      default: return <Icon icon="material-symbols:schedule" width={24} />;
    }
  };

  const formatTimeUntil = (scheduledTime: string) => {
    const now = new Date();
    const scheduled = new Date(`${selectedDate}T${scheduledTime}`);
    const diffMinutes = Math.floor((scheduled.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes < 0) return 'Overdue';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`;
    return `${Math.floor(diffMinutes / 1440)}d`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading medication schedule...</Typography>
      </Box>
    );
  }

  if (!medicationData) {
    return (
      <Container maxWidth="lg">
        <Alert severity="info" sx={{ mt: 2 }}>
          No medication schedule available. Consult your doctor for prescriptions.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Medication Schedule
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your medications and maintain adherence to your treatment plan
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
          />
          <IconButton onClick={fetchMedicationData} color="primary">
            <Icon icon="material-symbols:refresh" width={24} />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Adherence Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="success.main">
                    {medicationData.adherenceStats.overallRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall Adherence
                  </Typography>
                </Box>
                <Icon icon="material-symbols:trending-up" style={{ color: '#4caf50', fontSize: 40 }} />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={medicationData.adherenceStats.overallRate} 
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
                color="success"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="primary.main">
                    {medicationData.adherenceStats.thisWeek}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This Week
                  </Typography>
                </Box>
                <Icon icon="material-symbols:schedule" style={{ color: '#1976d2', fontSize: 40 }} />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={medicationData.adherenceStats.thisWeek} 
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="info.main">
                    {medicationData.adherenceStats.streakDays}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Day Streak
                  </Typography>
                </Box>
                <Icon icon="material-symbols:check-circle" style={{ color: '#0288d1', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {medicationData.upcomingReminders.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upcoming Today
                  </Typography>
                </Box>
                <Icon icon="material-symbols:notifications" style={{ color: '#ed6c02', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Today's Schedule */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title={`Schedule for ${new Date(selectedDate).toLocaleDateString()}`}
              avatar={<Icon icon="material-symbols:schedule" style={{ color: '#1976d2' }} width={24} />}
            />
            <CardContent>
              {medicationData.todaySchedule.length > 0 ? (
                <List>
                  {medicationData.todaySchedule.map((schedule, index) => (
                    <div key={schedule._id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: getStatusColor(schedule.status) + '.light' }}>
                            {getStatusIcon(schedule.status)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1">
                                {schedule.medication.name}
                              </Typography>
                              <Chip
                                size="small"
                                label={schedule.status}
                                color={getStatusColor(schedule.status) as any}
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Stack spacing={1}>
                              <Typography variant="body2">
                                {schedule.medication.dosage} • {schedule.scheduledTime}
                              </Typography>
                              {schedule.medication.instructions && (
                                <Typography variant="caption" color="text.secondary">
                                  {schedule.medication.instructions}
                                </Typography>
                              )}
                              {schedule.status === 'pending' && (
                                <Typography variant="caption" color="warning.main">
                                  Due in {formatTimeUntil(schedule.scheduledTime)}
                                </Typography>
                              )}
                              {schedule.actualTime && (
                                <Typography variant="caption" color="success.main">
                                  Taken at {schedule.actualTime}
                                </Typography>
                              )}
                            </Stack>
                          }
                        />
                        <ListItemSecondaryAction>
                          {schedule.status === 'pending' && (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => openLogDialog(schedule)}
                              startIcon={<Icon icon="material-symbols:check-circle" width={20} />}
                            >
                              Log
                            </Button>
                          )}
                          {schedule.status !== 'pending' && (
                            <Tooltip title="View Details">
                              <IconButton onClick={() => openLogDialog(schedule)}>
                                <Icon icon="material-symbols:history" width={20} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < medicationData.todaySchedule.length - 1 && <Divider />}
                    </div>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Icon icon="material-symbols:local-pharmacy" style={{ fontSize: 64, color: '#9e9e9e', marginBottom: 16 }} />
                  <Typography variant="h6" color="text.secondary">
                    No medications scheduled for this day
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Active Medications & Upcoming Reminders */}
        <Grid item xs={12} md={4}>
          {/* Active Medications */}
          <Card sx={{ mb: 3 }}>
            <CardHeader 
              title="Active Medications"
              avatar={<Icon icon="material-symbols:local-pharmacy" style={{ color: '#2e7d32' }} width={24} />}
            />
            <CardContent>
              <Stack spacing={2}>
                {medicationData.medications
                  .filter(med => med.status === 'active')
                  .map((medication) => (
                    <Paper key={medication._id} sx={{ p: 2 }} elevation={1}>
                      <Typography variant="subtitle2">
                        {medication.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {medication.dosage} • {medication.frequency}
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={(medication.takenDoses / medication.totalDoses) * 100}
                          sx={{ flexGrow: 1, height: 4, borderRadius: 2 }}
                        />
                        <Typography variant="caption">
                          {medication.takenDoses}/{medication.totalDoses}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
              </Stack>
            </CardContent>
          </Card>

          {/* Upcoming Reminders */}
          <Card>
            <CardHeader 
              title="Upcoming Reminders"
              avatar={<Icon icon="material-symbols:notifications" style={{ color: '#ed6c02' }} width={24} />}
            />
            <CardContent>
              <Stack spacing={2}>
                {medicationData.upcomingReminders.map((reminder, index) => (
                  <Paper key={index} sx={{ p: 2 }} elevation={1}>
                    <Typography variant="subtitle2">
                      {reminder.medication}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {reminder.time}
                    </Typography>
                    <Typography variant="caption" color="warning.main">
                      in {reminder.timeUntil}
                    </Typography>
                  </Paper>
                ))}
                {medicationData.upcomingReminders.length === 0 && (
                  <Typography variant="body2" color="text.secondary" align="center">
                    No upcoming reminders today
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Log Medication Dialog */}
      <Dialog open={logDialogOpen} onClose={() => setLogDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Log Medication: {selectedSchedule?.medication.name}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={logData.status}
                onChange={(e) => setLogData({ ...logData, status: e.target.value as any })}
                label="Status"
              >
                <MenuItem value="taken">Taken</MenuItem>
                <MenuItem value="missed">Missed</MenuItem>
                <MenuItem value="skipped">Skipped</MenuItem>
              </Select>
            </FormControl>

            {logData.status === 'taken' && (
              <TextField
                fullWidth
                label="Actual Time"
                type="time"
                value={logData.actualTime}
                onChange={(e) => setLogData({ ...logData, actualTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            )}

            <TextField
              fullWidth
              label="Notes (Optional)"
              multiline
              rows={3}
              value={logData.notes}
              onChange={(e) => setLogData({ ...logData, notes: e.target.value })}
              placeholder="Any observations, difficulties, or comments..."
            />

            {logData.status === 'taken' && (
              <FormControl fullWidth>
                <InputLabel>Side Effects (Optional)</InputLabel>
                <Select
                  multiple
                  value={logData.sideEffects}
                  onChange={(e) => setLogData({ 
                    ...logData, 
                    sideEffects: typeof e.target.value === 'string' 
                      ? e.target.value.split(',') 
                      : e.target.value 
                  })}
                  label="Side Effects (Optional)"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {SIDE_EFFECTS.map((effect) => (
                    <MenuItem key={effect} value={effect}>
                      {effect}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleLogMedication} variant="contained">
            Save Log
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}