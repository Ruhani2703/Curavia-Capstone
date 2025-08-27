import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Avatar from '@mui/material/Avatar';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import apiHelper from 'src/utils/apiHelper';

// Import chart components
import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

const SURGERY_TYPES = ['All', 'Bariatric', 'Cardiac', 'Orthopedic', 'Neurological', 'General'];
const PLAN_STATUS = ['All', 'Active', 'Draft', 'Archived'];

// ----------------------------------------------------------------------

export function DietExerciseView() {
  const [currentTab, setCurrentTab] = useState(0);
  const [filterSurgery, setFilterSurgery] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [dietPlans, setDietPlans] = useState<any[]>([]);
  const [exercisePlans, setExercisePlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statistics, setStatistics] = useState({
    dietPlans: { total: 0, active: 0 },
    exercisePlans: { total: 0, active: 0 },
    assignedPatients: 0
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchDietPlans();
    fetchExercisePlans();
    fetchStatistics();
  }, []);

  const fetchDietPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/diet-exercise/diet-plans', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDietPlans(data.dietPlans);
      } else {
        throw new Error('Failed to fetch diet plans');
      }
    } catch (error) {
      console.error('Error fetching diet plans:', error);
      setError('Failed to load diet plans');
    }
  };

  const fetchExercisePlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/diet-exercise/exercise-plans', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setExercisePlans(data.exercisePlans);
      } else {
        throw new Error('Failed to fetch exercise plans');
      }
    } catch (error) {
      console.error('Error fetching exercise plans:', error);
      setError('Failed to load exercise plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await apiHelper.get('/diet-exercise/statistics');
      if (response) {
        setStatistics(response);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Filter plans based on surgery type and status
  const filteredDietPlans = dietPlans.filter((plan) => {
    const matchesSurgery = filterSurgery === 'All' || plan.surgeryType === filterSurgery;
    const matchesStatus = filterStatus === 'All' || plan.status === filterStatus.toLowerCase();
    return matchesSurgery && matchesStatus;
  });

  const filteredExercisePlans = exercisePlans.filter((plan) => {
    const matchesSurgery = filterSurgery === 'All' || plan.surgeryType === filterSurgery;
    const matchesStatus = filterStatus === 'All' || plan.status === filterStatus.toLowerCase();
    return matchesSurgery && matchesStatus;
  });

  const handlePlanClick = (plan: any) => {
    setSelectedPlan(plan);
    setDetailDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'warning';
      case 'archived': return 'default';
      default: return 'default';
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity?.toLowerCase()) {
      case 'low': return 'success';
      case 'moderate': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  // Mock nutrition data for charts
  const nutritionData = {
    categories: ['Protein', 'Carbs', 'Fats', 'Fiber'],
    series: [
      { name: 'Target', data: [25, 45, 20, 10] },
      { name: 'Current', data: [22, 48, 18, 12] }
    ]
  };

  const chartOptions = useChart({
    xaxis: { categories: nutritionData.categories },
    yaxis: { title: { text: 'Percentage (%)' } },
    chart: { type: 'bar' }
  });

  return (
    <DashboardContent>
      <Typography variant="h4" sx={{ mb: 5 }}>
        Diet & Exercise Management 🥗
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="primary.main">
              {dietPlans.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Diet Plans
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="success.main">
              {exercisePlans.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Exercise Programs
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="info.main">
              {dietPlans.reduce((sum, plan) => sum + plan.assignedPatients, 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Diet Enrollments
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="warning.main">
              {exercisePlans.reduce((sum, plan) => sum + plan.assignedPatients, 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Exercise Enrollments
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Card>
        {/* Filters */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              select
              label="Surgery Type"
              value={filterSurgery}
              onChange={(e) => setFilterSurgery(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              {SURGERY_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
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
            <Box sx={{ ml: 'auto' }}>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={() => setCreateDialog(true)}
              >
                Create Plan
              </Button>
            </Box>
          </Stack>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab 
              label={`Diet Plans (${filteredDietPlans.length})`} 
              icon={<Iconify icon="solar:plate-bold" />}
            />
            <Tab 
              label={`Exercise Programs (${filteredExercisePlans.length})`} 
              icon={<Iconify icon="solar:running-bold" />}
            />
          </Tabs>
        </Box>

        {/* Diet Plans Tab */}
        {currentTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {filteredDietPlans.map((plan) => (
                <Grid xs={12} md={6} lg={4} key={plan.id}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      p: 3, 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => handlePlanClick(plan)}
                  >
                    <Stack spacing={2}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Iconify icon="solar:plate-bold" />
                        </Avatar>
                        <Chip
                          size="small"
                          label={plan.status}
                          color={getStatusColor(plan.status) as any}
                          variant="soft"
                        />
                      </Stack>
                      
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {plan.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {plan.description}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={2}>
                        <Chip 
                          size="small" 
                          label={plan.surgeryType} 
                          variant="outlined" 
                        />
                        <Chip 
                          size="small" 
                          label={plan.phase} 
                          variant="outlined" 
                        />
                      </Stack>

                      <Grid container spacing={2}>
                        <Grid xs={6}>
                          <Typography variant="body2">
                            <strong>{plan.calories}</strong> calories
                          </Typography>
                        </Grid>
                        <Grid xs={6}>
                          <Typography variant="body2">
                            <strong>{plan.protein}g</strong> protein
                          </Typography>
                        </Grid>
                        <Grid xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            {plan.duration}
                          </Typography>
                        </Grid>
                        <Grid xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            {plan.assignedPatients} patients
                          </Typography>
                        </Grid>
                      </Grid>

                      <Typography variant="caption" color="text.secondary">
                        Created by {plan.createdBy}
                      </Typography>
                    </Stack>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Exercise Programs Tab */}
        {currentTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {filteredExercisePlans.map((plan) => (
                <Grid xs={12} md={6} lg={4} key={plan.id}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      p: 3, 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => handlePlanClick(plan)}
                  >
                    <Stack spacing={2}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <Iconify icon="solar:running-bold" />
                        </Avatar>
                        <Chip
                          size="small"
                          label={plan.status}
                          color={getStatusColor(plan.status) as any}
                          variant="soft"
                        />
                      </Stack>
                      
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {plan.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {plan.description}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={2}>
                        <Chip 
                          size="small" 
                          label={plan.surgeryType} 
                          variant="outlined" 
                        />
                        <Chip 
                          size="small" 
                          label={plan.intensity} 
                          color={getIntensityColor(plan.intensity) as any}
                          variant="outlined" 
                        />
                      </Stack>

                      <Grid container spacing={2}>
                        <Grid xs={6}>
                          <Typography variant="body2">
                            <strong>{plan.phase}</strong>
                          </Typography>
                        </Grid>
                        <Grid xs={6}>
                          <Typography variant="body2">
                            <strong>{plan.duration}</strong>
                          </Typography>
                        </Grid>
                        <Grid xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            {plan.exercises.length} exercises
                          </Typography>
                        </Grid>
                        <Grid xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            {plan.assignedPatients} patients
                          </Typography>
                        </Grid>
                      </Grid>

                      <Typography variant="caption" color="text.secondary">
                        Created by {plan.createdBy}
                      </Typography>
                    </Stack>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Card>

      {/* Plan Detail Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: currentTab === 0 ? 'primary.main' : 'success.main' }}>
              <Iconify icon={currentTab === 0 ? 'solar:plate-bold' : 'solar:running-bold'} />
            </Avatar>
            <Box>
              <Typography variant="h6">{selectedPlan?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedPlan?.surgeryType} • {selectedPlan?.phase || selectedPlan?.intensity}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedPlan && (
            <Stack spacing={3}>
              <Alert severity="info">
                {selectedPlan.description}
              </Alert>

              {currentTab === 0 ? (
                // Diet Plan Details
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Daily Meal Plan
                  </Typography>
                  <List>
                    {selectedPlan.meals?.map((meal: any, index: number) => (
                      <Box key={index}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>
                            <Iconify icon="solar:plate-bold" />
                          </ListItemIcon>
                          <ListItemText
                            primary={meal.name}
                            secondary={meal.items.join(', ')}
                          />
                          <ListItemSecondaryAction>
                            <Stack alignItems="flex-end">
                              <Typography variant="body2">
                                {meal.calories} cal
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {meal.protein}g protein
                              </Typography>
                            </Stack>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < selectedPlan.meals.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                </Box>
              ) : (
                // Exercise Plan Details
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Exercise Routine
                  </Typography>
                  <List>
                    {selectedPlan.exercises?.map((exercise: any, index: number) => (
                      <Box key={index}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>
                            <Iconify icon="solar:running-bold" />
                          </ListItemIcon>
                          <ListItemText
                            primary={exercise.name}
                            secondary={`${exercise.type} • ${exercise.duration}`}
                          />
                          <ListItemSecondaryAction>
                            <Stack alignItems="flex-end">
                              <Typography variant="body2">
                                {exercise.sets} sets × {exercise.reps} reps
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {exercise.duration}
                              </Typography>
                            </Stack>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < selectedPlan.exercises.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                </Box>
              )}

              <Grid container spacing={2}>
                <Grid xs={6}>
                  <Typography variant="body2">
                    <strong>Duration:</strong> {selectedPlan.duration}
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="body2">
                    <strong>Assigned Patients:</strong> {selectedPlan.assignedPatients}
                  </Typography>
                </Grid>
                <Grid xs={12}>
                  <Typography variant="body2">
                    <strong>Created by:</strong> {selectedPlan.createdBy}
                  </Typography>
                </Grid>
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
          <Button variant="outlined" startIcon={<Iconify icon="solar:copy-bold" />}>
            Duplicate Plan
          </Button>
          <Button variant="contained" startIcon={<Iconify icon="solar:pen-bold" />}>
            Edit Plan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Plan Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Create New {currentTab === 0 ? 'Diet' : 'Exercise'} Plan
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Plan Name"
              placeholder="Enter plan name"
            />
            <TextField
              select
              fullWidth
              label="Surgery Type"
            >
              {SURGERY_TYPES.slice(1).map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              placeholder="Describe the plan objectives and target patients"
            />
            {currentTab === 0 ? (
              <>
                <TextField
                  fullWidth
                  label="Daily Calories"
                  type="number"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">kcal</InputAdornment>
                  }}
                />
                <TextField
                  fullWidth
                  label="Daily Protein"
                  type="number"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">g</InputAdornment>
                  }}
                />
              </>
            ) : (
              <>
                <TextField
                  select
                  fullWidth
                  label="Intensity Level"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="moderate">Moderate</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </TextField>
                <TextField
                  fullWidth
                  label="Duration"
                  placeholder="e.g., 4 weeks"
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<Iconify icon="solar:add-circle-bold" />}>
            Create Plan
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}