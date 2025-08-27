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
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import LinearProgress from '@mui/material/LinearProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import apiHelper from 'src/utils/apiHelper';
import { setupDevAuth, checkDevAuth } from 'src/utils/devAuth';

// ----------------------------------------------------------------------

const PLAN_STATUS = ['All', 'Active', 'Completed', 'On Hold'];
const RECOVERY_STAGES = ['Pre-Surgery', 'Immediate Post-Op', 'Early Recovery', 'Late Recovery', 'Full Recovery'];

interface RecoveryPlan {
  _id: string;
  patientId: { name: string; patientId: string; _id: string; surgeryType?: string };
  surgeryType: string;
  stage: string;
  status: 'active' | 'completed' | 'on_hold';
  progress: number;
  createdAt: string;
  updatedAt: string;
  createdBy: { name: string };
  milestones: Milestone[];
  exercises: Exercise[];
  dietPlan: DietPlan;
  medications: Medication[];
  nextAppointment?: string;
  notes?: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  completed: boolean;
  completedAt?: string;
  priority: 'low' | 'medium' | 'high';
}

interface Exercise {
  id: string;
  name: string;
  description: string;
  frequency: string;
  duration: string;
  completed: boolean;
  instructions: string;
}

interface DietPlan {
  calories: number;
  restrictions: string[];
  recommendations: string[];
  mealPlan: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  completed: boolean;
}

interface Patient {
  _id: string;
  name: string;
  patientId: string;
  surgeryType?: string;
}

export function DoctorRecoveryPlansView() {
  const [plans, setPlans] = useState<RecoveryPlan[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<RecoveryPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedStage, setSelectedStage] = useState('All');
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [creating, setCreating] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<RecoveryPlan | null>(null);
  const [editDialog, setEditDialog] = useState(false);

  // Fetch recovery plans and patients data
  const fetchData = useCallback(async () => {
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
      
      // Fetch recovery plans for doctor's patients
      const plansResponse = await apiHelper.get('/recovery-plan/doctor/plans');
      
      // Fetch patients assigned to this doctor
      const patientsResponse = await apiHelper.get('/doctor/patients');
      
      if (plansResponse.plans) {
        setPlans(plansResponse.plans);
        setFilteredPlans(plansResponse.plans);
      }
      
      if (patientsResponse.patients) {
        setPatients(patientsResponse.patients);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Error fetching data:', err);
      
      // Fallback: generate mock data
      const mockPlans = generateMockPlans();
      const mockPatients = generateMockPatients();
      setPlans(mockPlans);
      setFilteredPlans(mockPlans);
      setPatients(mockPatients);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter plans based on status and stage
  useEffect(() => {
    let filtered = plans;

    if (filterStatus !== 'All') {
      filtered = filtered.filter(plan => plan.status === filterStatus.toLowerCase().replace(' ', '_'));
    }

    if (selectedStage !== 'All') {
      filtered = filtered.filter(plan => plan.stage === selectedStage);
    }

    setFilteredPlans(filtered);
  }, [plans, filterStatus, selectedStage]);

  const handleCreatePlan = async () => {
    if (!selectedPatient) return;
    
    setCreating(true);
    try {
      const response = await apiHelper.post('/recovery-plan/create', {
        patientId: selectedPatient
      });
      
      if (response.message) {
        await fetchData();
        setCreateDialog(false);
        setSelectedPatient('');
      } else {
        throw new Error('Failed to create recovery plan');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create recovery plan');
    } finally {
      setCreating(false);
    }
  };

  const handleViewPlan = (plan: RecoveryPlan) => {
    setSelectedPlan(plan);
    setViewDialog(true);
  };

  const handleUpdateProgress = async (planId: string, updates: any) => {
    try {
      const response = await apiHelper.put(`/recovery-plan/${planId}`, updates);
      if (response.success) {
        await fetchData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update plan');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'primary';
      case 'on_hold': return 'warning';
      default: return 'default';
    }
  };

  const getStageProgress = (stage: string) => {
    const stages = ['Pre-Surgery', 'Immediate Post-Op', 'Early Recovery', 'Late Recovery', 'Full Recovery'];
    const index = stages.indexOf(stage);
    return index >= 0 ? ((index + 1) / stages.length) * 100 : 0;
  };

  if (loading) {
    return (
      <DashboardContent>
        <Box sx={{ mb: 5 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Recovery Plans 🏥
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage patient recovery and treatment plans
          </Typography>
        </Box>

        <Stack spacing={3}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading recovery plans...
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
            Recovery Plans 🏥
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage patient recovery and treatment plans
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:document-add-bold" />}
            onClick={() => setCreateDialog(true)}
          >
            Create Plan
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={fetchData}
            disabled={loading}
            startIcon={<Iconify icon="solar:refresh-bold" />}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {/* Recovery Plans Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="primary.main">
              {plans.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Plans
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="success.main">
              {plans.filter(p => p.status === 'active').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Plans
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="info.main">
              {Math.round(plans.reduce((acc, plan) => acc + plan.progress, 0) / plans.length || 0)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Progress
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="warning.main">
              {plans.filter(p => p.status === 'completed').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completed
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Recovery Plans Management */}
      <Card sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h6">Recovery Plans</Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              select
              size="small"
              label="Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              {PLAN_STATUS.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Stage"
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="All">All Stages</MenuItem>
              {RECOVERY_STAGES.map((stage) => (
                <MenuItem key={stage} value={stage}>
                  {stage}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>

        {filteredPlans.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Iconify icon="solar:health-bold" width={48} sx={{ color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6">No recovery plans found</Typography>
            <Typography variant="body2" color="text.secondary">
              Create your first recovery plan or adjust the filters to see existing plans
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredPlans.map((plan, index) => (
              <Box key={plan._id}>
                <ListItem 
                  sx={{ 
                    px: 0,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => handleViewPlan(plan)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <Iconify icon="solar:health-bold" />
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle2">
                          {plan.patientId?.name} - {plan.surgeryType}
                        </Typography>
                        <Chip
                          size="small"
                          label={plan.status}
                          color={getStatusColor(plan.status) as any}
                          variant="soft"
                        />
                        <Chip
                          size="small"
                          label={plan.stage}
                          color="info"
                          variant="outlined"
                        />
                      </Stack>
                    }
                    secondary={
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Progress: {plan.progress}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={plan.progress} 
                            sx={{ width: 100, height: 6, borderRadius: 3 }}
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          Patient: {plan.patientId?.name} ({plan.patientId?.patientId})
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Created: {new Date(plan.createdAt).toLocaleDateString()} by {plan.createdBy?.name}
                        </Typography>
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={1}>
                      <IconButton 
                        size="small"
                        title="View Details"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewPlan(plan);
                        }}
                      >
                        <Iconify icon="solar:eye-bold" />
                      </IconButton>
                      <IconButton 
                        size="small"
                        title="Edit Plan"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlan(plan);
                          setEditDialog(true);
                        }}
                      >
                        <Iconify icon="solar:pen-bold" />
                      </IconButton>
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredPlans.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Card>

      {/* Create Plan Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Recovery Plan</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Patient</InputLabel>
              <Select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                label="Patient"
              >
                {patients.map((patient) => (
                  <MenuItem key={patient._id} value={patient._id}>
                    {patient.name} ({patient.patientId}) - {patient.surgeryType || 'General'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Alert severity="info">
              A comprehensive recovery plan will be created including milestones, exercises, diet recommendations, and medication tracking based on the patient's surgery type.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreatePlan}
            disabled={creating || !selectedPatient}
            startIcon={creating ? <CircularProgress size={16} /> : <Iconify icon="solar:document-add-bold" />}
          >
            {creating ? 'Creating...' : 'Create Plan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Plan Dialog */}
      <Dialog 
        open={viewDialog} 
        onClose={() => setViewDialog(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              {selectedPlan ? `Recovery Plan - ${selectedPlan.patientId?.name}` : 'Recovery Plan Details'}
            </Typography>
            <Chip
              label={selectedPlan?.status || 'active'}
              color={getStatusColor(selectedPlan?.status || 'active') as any}
              variant="soft"
            />
          </Stack>
        </DialogTitle>

        <DialogContent>
          {selectedPlan && (
            <Stack spacing={4}>
              {/* Plan Overview */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Plan Overview</Typography>
                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Patient</Typography>
                    <Typography variant="body1">{selectedPlan.patientId?.name} ({selectedPlan.patientId?.patientId})</Typography>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Surgery Type</Typography>
                    <Typography variant="body1">{selectedPlan.surgeryType}</Typography>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Current Stage</Typography>
                    <Typography variant="body1">{selectedPlan.stage}</Typography>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Overall Progress</Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="h6" color="primary.main">{selectedPlan.progress}%</Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={selectedPlan.progress} 
                        sx={{ flex: 1, height: 8, borderRadius: 4 }}
                      />
                    </Stack>
                  </Grid>
                </Grid>
              </Card>

              {/* Milestones */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Recovery Milestones</Typography>
                <Stepper orientation="vertical">
                  {selectedPlan.milestones.map((milestone, index) => (
                    <Step key={milestone.id} active={!milestone.completed}>
                      <StepLabel 
                        icon={milestone.completed ? <Iconify icon="solar:check-circle-bold" color="success.main" /> : index + 1}
                      >
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="subtitle2">{milestone.title}</Typography>
                          <Chip
                            size="small"
                            label={milestone.priority}
                            color={milestone.priority === 'high' ? 'error' : milestone.priority === 'medium' ? 'warning' : 'info'}
                            variant="outlined"
                          />
                        </Stack>
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2" color="text.secondary">
                          {milestone.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Target: {new Date(milestone.targetDate).toLocaleDateString()}
                        </Typography>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </Card>

              {/* Exercises */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Exercise Program</Typography>
                <List>
                  {selectedPlan.exercises.map((exercise, index) => (
                    <Box key={exercise.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: exercise.completed ? 'success.main' : 'action.disabled' }}>
                            <Iconify icon="solar:dumbbell-large-minimalistic-bold" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={exercise.name}
                          secondary={
                            <Box>
                              <Typography variant="body2">{exercise.description}</Typography>
                              <Typography variant="caption">
                                {exercise.frequency} | {exercise.duration}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Checkbox
                            checked={exercise.completed}
                            onChange={(e) => {
                              const updatedExercises = selectedPlan.exercises.map(ex => 
                                ex.id === exercise.id ? { ...ex, completed: e.target.checked } : ex
                              );
                              handleUpdateProgress(selectedPlan._id, { exercises: updatedExercises });
                            }}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < selectedPlan.exercises.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </Card>

              {/* Diet Plan */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Diet & Nutrition</Typography>
                <Grid container spacing={3}>
                  <Grid xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>Daily Calories</Typography>
                    <Typography variant="h4" color="primary.main">{selectedPlan.dietPlan.calories}</Typography>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>Restrictions</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {selectedPlan.dietPlan.restrictions.map((restriction, index) => (
                        <Chip key={index} label={restriction} color="error" variant="outlined" size="small" />
                      ))}
                    </Stack>
                  </Grid>
                  <Grid xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Recommendations</Typography>
                    <List dense>
                      {selectedPlan.dietPlan.recommendations.map((rec, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <Typography variant="body2">• {rec}</Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              </Card>

              {/* Medications */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Medications</Typography>
                <List>
                  {selectedPlan.medications.map((medication, index) => (
                    <Box key={medication.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'info.main' }}>
                            <Iconify icon="solar:pill-bold" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={medication.name}
                          secondary={
                            <Box>
                              <Typography variant="body2">{medication.dosage}</Typography>
                              <Typography variant="caption">
                                {medication.frequency} for {medication.duration}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Checkbox
                            checked={medication.completed}
                            onChange={(e) => {
                              const updatedMeds = selectedPlan.medications.map(med => 
                                med.id === medication.id ? { ...med, completed: e.target.checked } : med
                              );
                              handleUpdateProgress(selectedPlan._id, { medications: updatedMeds });
                            }}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < selectedPlan.medications.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </Card>
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
          <Button 
            variant="outlined"
            startIcon={<Iconify icon="solar:pen-bold" />}
            onClick={() => {
              setViewDialog(false);
              setEditDialog(true);
            }}
          >
            Edit Plan
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}

// Mock data generators
function generateMockPlans(): RecoveryPlan[] {
  const mockPatients = [
    { _id: '1', name: 'John Smith', patientId: 'P001', surgeryType: 'Cardiac' },
    { _id: '2', name: 'Sarah Johnson', patientId: 'P002', surgeryType: 'Orthopedic' },
    { _id: '3', name: 'Michael Chen', patientId: 'P003', surgeryType: 'Neurological' },
  ];

  return mockPatients.map((patient, index) => ({
    _id: `plan_${index + 1}`,
    patientId: patient,
    surgeryType: patient.surgeryType || 'General',
    stage: ['Early Recovery', 'Late Recovery', 'Immediate Post-Op'][index % 3],
    status: ['active', 'completed', 'on_hold'][index % 3] as 'active' | 'completed' | 'on_hold',
    progress: 65 + index * 15,
    createdAt: new Date(Date.now() - index * 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: { name: 'Dr. Smith' },
    milestones: [
      {
        id: `milestone_1_${index}`,
        title: 'Initial Assessment Complete',
        description: 'Complete initial post-surgery assessment and vital signs check',
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        completed: true,
        priority: 'high'
      },
      {
        id: `milestone_2_${index}`,
        title: 'Mobility Goals',
        description: 'Patient can walk 100 meters without assistance',
        targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        completed: index === 0,
        priority: 'medium'
      }
    ],
    exercises: [
      {
        id: `exercise_1_${index}`,
        name: 'Breathing Exercises',
        description: 'Deep breathing exercises to improve lung capacity',
        frequency: '3 times daily',
        duration: '10 minutes',
        completed: true,
        instructions: 'Inhale for 4 counts, hold for 4, exhale for 6'
      },
      {
        id: `exercise_2_${index}`,
        name: 'Light Walking',
        description: 'Supervised walking for mobility improvement',
        frequency: 'Twice daily',
        duration: '15 minutes',
        completed: index === 0,
        instructions: 'Start with 5 minutes and gradually increase'
      }
    ],
    dietPlan: {
      calories: 2000 + index * 200,
      restrictions: ['No alcohol', 'Low sodium'],
      recommendations: ['High protein intake', 'Plenty of fluids', 'Fresh fruits and vegetables'],
      mealPlan: 'Mediterranean diet with emphasis on lean proteins and vegetables'
    },
    medications: [
      {
        id: `med_1_${index}`,
        name: 'Pain Management',
        dosage: '500mg',
        frequency: 'Every 6 hours',
        duration: '7 days',
        completed: false
      },
      {
        id: `med_2_${index}`,
        name: 'Anti-inflammatory',
        dosage: '200mg',
        frequency: 'Twice daily',
        duration: '10 days',
        completed: index === 0
      }
    ],
    nextAppointment: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: `Recovery plan for ${patient.name} following ${patient.surgeryType} surgery. Patient is responding well to treatment.`
  }));
}

function generateMockPatients(): Patient[] {
  return [
    { _id: '1', name: 'John Smith', patientId: 'P001', surgeryType: 'Cardiac' },
    { _id: '2', name: 'Sarah Johnson', patientId: 'P002', surgeryType: 'Orthopedic' },
    { _id: '3', name: 'Michael Chen', patientId: 'P003', surgeryType: 'Neurological' },
    { _id: '4', name: 'Emily Davis', patientId: 'P004', surgeryType: 'General' },
    { _id: '5', name: 'Robert Wilson', patientId: 'P005', surgeryType: 'Cardiac' },
  ];
}