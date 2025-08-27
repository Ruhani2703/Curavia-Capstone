import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Button,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Paper,
  Badge,
  Tooltip,
  LinearProgress
} from '@mui/material';
import { Icon } from '@iconify/react';
import { DashboardContent } from 'src/layouts/dashboard';
import { useAuth } from 'src/contexts/AuthContext';
import apiHelper from 'src/utils/apiHelper';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';

interface Medication {
  _id?: string;
  name: string;
  dosage: string;
  frequency: string;
  timings: string[];
  startDate: Date;
  endDate?: Date;
  active: boolean;
  instructions?: string;
  prescribedBy?: string;
  refillDate?: Date;
}

interface MedicationLog {
  medicationId: string;
  takenAt: Date;
  status: 'taken' | 'missed' | 'skipped';
  notes?: string;
}

export function MedicationsView() {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newMedication, setNewMedication] = useState<Partial<Medication>>({
    name: '',
    dosage: '',
    frequency: 'Daily',
    timings: ['08:00'],
    active: true
  });

  // Fetch medications
  const fetchMedications = async () => {
    if (!user?._id) return;
    
    setLoading(true);
    try {
      const response = await apiHelper.get(`/patient/medications?patientId=${user._id}`);
      if (response.success && response.data) {
        // Extract medications from prescriptions if they exist
        if (response.data.medications) {
          setMedications(response.data.medications);
        }
        
        // Also try to get medications from user profile
        const userResponse = await apiHelper.get('/auth/me');
        if (userResponse.user?.medications) {
          setMedications(prev => [...prev, ...userResponse.user.medications]);
        }
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
      setMedications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, [user?._id]);

  // Calendar view - weekly
  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Get medications for a specific day and time
  const getMedicationsForDayTime = (day: Date, timing: string) => {
    return medications.filter(med => {
      if (!med.active) return false;
      const startDate = new Date(med.startDate);
      const endDate = med.endDate ? new Date(med.endDate) : null;
      
      if (day < startDate) return false;
      if (endDate && day > endDate) return false;
      
      return med.timings.includes(timing);
    });
  };

  // Mark medication as taken
  const markMedicationTaken = async (medicationId: string, timing: string) => {
    try {
      await apiHelper.post(`/patient/medications/log`, {
        userId: user?._id,
        medicationId,
        takenAt: new Date(),
        status: 'taken'
      });
      
      // Update local state
      setMedicationLogs([...medicationLogs, {
        medicationId,
        takenAt: new Date(),
        status: 'taken'
      }]);
    } catch (error) {
      console.error('Error logging medication:', error);
    }
  };

  // Add new medication
  const handleAddMedication = async () => {
    try {
      await apiHelper.post(`/patient/medications`, {
        userId: user?._id,
        ...newMedication
      });
      
      setAddDialogOpen(false);
      fetchMedications();
      setNewMedication({
        name: '',
        dosage: '',
        frequency: 'Daily',
        timings: ['08:00'],
        active: true
      });
    } catch (error) {
      console.error('Error adding medication:', error);
    }
  };

  // Calculate adherence rate
  const calculateAdherence = () => {
    const totalExpected = medications.reduce((acc, med) => 
      acc + (med.timings.length * 7), 0
    );
    const totalTaken = medicationLogs.filter(log => 
      log.status === 'taken' && 
      new Date(log.takenAt) >= addDays(new Date(), -7)
    ).length;
    
    return totalExpected > 0 ? Math.round((totalTaken / totalExpected) * 100) : 0;
  };

  const adherenceRate = calculateAdherence();

  // Time slots for the calendar
  const timeSlots = ['Morning (8 AM)', 'Noon (12 PM)', 'Evening (6 PM)', 'Night (10 PM)'];
  const timeSlotMappings: { [key: string]: string } = {
    'Morning (8 AM)': '08:00',
    'Noon (12 PM)': '12:00',
    'Evening (6 PM)': '18:00',
    'Night (10 PM)': '22:00'
  };

  return (
    <DashboardContent>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ mb: 5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h4">Medication Management</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                Track your medications, set reminders, and monitor adherence
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Icon icon="mdi:plus" />}
              onClick={() => setAddDialogOpen(true)}
            >
              Add Medication
            </Button>
          </Stack>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Active Medications
                  </Typography>
                  <Typography variant="h3">
                    {medications.filter(m => m.active).length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Daily medications
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Today's Doses
                  </Typography>
                  <Typography variant="h3">
                    {medications.reduce((acc, med) => acc + med.timings.length, 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total scheduled
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Adherence Rate
                  </Typography>
                  <Typography variant="h3" color={adherenceRate > 80 ? 'success.main' : 'warning.main'}>
                    {adherenceRate}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={adherenceRate} 
                    color={adherenceRate > 80 ? 'success' : 'warning'}
                    sx={{ mt: 1 }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Refills Needed
                  </Typography>
                  <Typography variant="h3" color="error.main">
                    2
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Within 7 days
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Medication Calendar */}
        <Card sx={{ mb: 4 }}>
          <CardHeader
            title="Weekly Medication Schedule"
            subheader={`Week of ${format(weekStart, 'MMM dd, yyyy')}`}
            action={
              <Stack direction="row" spacing={1}>
                <IconButton onClick={() => setSelectedDate(addDays(selectedDate, -7))}>
                  <Icon icon="mdi:chevron-left" />
                </IconButton>
                <Button variant="outlined" size="small" onClick={() => setSelectedDate(new Date())}>
                  Today
                </Button>
                <IconButton onClick={() => setSelectedDate(addDays(selectedDate, 7))}>
                  <Icon icon="mdi:chevron-right" />
                </IconButton>
              </Stack>
            }
          />
          <CardContent>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>
                      Time
                    </th>
                    {weekDays.map(day => (
                      <th key={day.toString()} style={{ 
                        padding: '12px', 
                        textAlign: 'center', 
                        borderBottom: '2px solid #e0e0e0',
                        backgroundColor: isSameDay(day, new Date()) ? '#f5f5f5' : 'transparent'
                      }}>
                        <Typography variant="subtitle2">
                          {format(day, 'EEE')}
                        </Typography>
                        <Typography variant="h6">
                          {format(day, 'dd')}
                        </Typography>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(slot => (
                    <tr key={slot}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
                        <Typography variant="subtitle2">{slot}</Typography>
                      </td>
                      {weekDays.map(day => {
                        const meds = getMedicationsForDayTime(day, timeSlotMappings[slot]);
                        return (
                          <td key={`${day}-${slot}`} style={{ 
                            padding: '8px', 
                            borderBottom: '1px solid #e0e0e0',
                            backgroundColor: isSameDay(day, new Date()) ? '#f5f5f5' : 'transparent'
                          }}>
                            <Stack spacing={1}>
                              {meds.map(med => (
                                <Chip
                                  key={med._id}
                                  label={`${med.name} ${med.dosage}`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                  icon={<Icon icon="mdi:pill" />}
                                  onClick={() => markMedicationTaken(med._id!, timeSlotMappings[slot])}
                                />
                              ))}
                            </Stack>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </CardContent>
        </Card>

        {/* Medication List */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="Active Medications" />
              <CardContent>
                <List>
                  {medications.filter(m => m.active).map((medication, index) => (
                    <ListItem key={medication._id || index} divider>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Icon icon="mdi:pill" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="subtitle1">{medication.name}</Typography>
                            <Chip label={medication.dosage} size="small" />
                          </Stack>
                        }
                        secondary={
                          <Stack spacing={0.5} sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              Frequency: {medication.frequency} at {medication.timings.join(', ')}
                            </Typography>
                            {medication.instructions && (
                              <Typography variant="caption" color="text.secondary">
                                Instructions: {medication.instructions}
                              </Typography>
                            )}
                          </Stack>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Edit">
                            <IconButton size="small">
                              <Icon icon="mdi:pencil" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error">
                              <Icon icon="mdi:delete" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Upcoming Reminders" />
              <CardContent>
                <Stack spacing={2}>
                  <Alert severity="info" icon={<Icon icon="mdi:clock" />}>
                    <Typography variant="subtitle2">Next Dose</Typography>
                    <Typography variant="caption">
                      Aspirin 81mg - Today at 6:00 PM
                    </Typography>
                  </Alert>
                  
                  <Alert severity="warning" icon={<Icon icon="mdi:alert" />}>
                    <Typography variant="subtitle2">Refill Reminder</Typography>
                    <Typography variant="caption">
                      Metoprolol - Refill needed in 5 days
                    </Typography>
                  </Alert>

                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Icon icon="mdi:bell" />}
                  >
                    Manage Reminders
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Add Medication Dialog */}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Medication</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="Medication Name"
                fullWidth
                value={newMedication.name}
                onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
              />
              <TextField
                label="Dosage"
                fullWidth
                placeholder="e.g., 500mg, 2 tablets"
                value={newMedication.dosage}
                onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
              />
              <TextField
                select
                label="Frequency"
                fullWidth
                value={newMedication.frequency}
                onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
              >
                <MenuItem value="Daily">Daily</MenuItem>
                <MenuItem value="Twice Daily">Twice Daily</MenuItem>
                <MenuItem value="Three Times Daily">Three Times Daily</MenuItem>
                <MenuItem value="Four Times Daily">Four Times Daily</MenuItem>
                <MenuItem value="Weekly">Weekly</MenuItem>
                <MenuItem value="As Needed">As Needed</MenuItem>
              </TextField>
              <TextField
                label="Instructions"
                fullWidth
                multiline
                rows={2}
                placeholder="e.g., Take with food"
                value={newMedication.instructions}
                onChange={(e) => setNewMedication({ ...newMedication, instructions: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleAddMedication}>Add Medication</Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
    </DashboardContent>
  );
}