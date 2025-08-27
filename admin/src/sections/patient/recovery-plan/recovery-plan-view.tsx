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
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tabs,
  Tab,
  Divider,
  Rating,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent,
} from '@mui/lab';
import { Icon } from '@iconify/react';
import { DashboardContent } from 'src/layouts/dashboard';
import { useAuth } from 'src/contexts/AuthContext';
import apiHelper from 'src/utils/apiHelper';
import { format, differenceInDays, addDays } from 'date-fns';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  category: 'medical' | 'physical' | 'dietary' | 'mental';
  icon: string;
  color: string;
}

interface Activity {
  id: string;
  name: string;
  type: 'exercise' | 'therapy' | 'medication' | 'appointment';
  duration: number;
  frequency: string;
  completed: boolean;
  scheduledTime: string;
  notes?: string;
}

interface RecoveryGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  category: string;
  trend: 'up' | 'down' | 'stable';
}

export function RecoveryPlanView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [todayActivities, setTodayActivities] = useState<Activity[]>([]);
  const [recoveryGoals, setRecoveryGoals] = useState<RecoveryGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [recoveryProgress, setRecoveryProgress] = useState(0);
  const [addGoalDialog, setAddGoalDialog] = useState(false);

  // Calculate days since surgery
  const surgeryDate = user?.surgeryDate ? new Date(user.surgeryDate) : new Date();
  const daysSinceSurgery = differenceInDays(new Date(), surgeryDate);
  const expectedRecoveryDays = 90; // Default 90 days recovery
  const recoveryPercentage = Math.min(Math.round((daysSinceSurgery / expectedRecoveryDays) * 100), 100);

  // Fetch recovery plan data
  const fetchRecoveryPlan = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual API calls
      setMilestones([
        {
          id: '1',
          title: 'Initial Assessment',
          description: 'Complete post-surgery assessment with medical team',
          targetDate: addDays(surgeryDate, 3),
          completedDate: addDays(surgeryDate, 2),
          status: 'completed',
          category: 'medical',
          icon: 'mdi:doctor',
          color: 'success.main'
        },
        {
          id: '2',
          title: 'Start Physical Therapy',
          description: 'Begin gentle mobility exercises',
          targetDate: addDays(surgeryDate, 7),
          completedDate: addDays(surgeryDate, 7),
          status: 'completed',
          category: 'physical',
          icon: 'mdi:run',
          color: 'success.main'
        },
        {
          id: '3',
          title: 'Walking Milestone',
          description: 'Walk 500 meters without assistance',
          targetDate: addDays(surgeryDate, 14),
          status: 'in_progress',
          category: 'physical',
          icon: 'mdi:walk',
          color: 'warning.main'
        },
        {
          id: '4',
          title: 'Diet Transition',
          description: 'Transition to regular diet',
          targetDate: addDays(surgeryDate, 21),
          status: 'pending',
          category: 'dietary',
          icon: 'mdi:food-apple',
          color: 'info.main'
        },
        {
          id: '5',
          title: 'Full Recovery',
          description: 'Return to normal daily activities',
          targetDate: addDays(surgeryDate, 90),
          status: 'pending',
          category: 'medical',
          icon: 'mdi:trophy',
          color: 'info.main'
        }
      ]);

      setTodayActivities([
        {
          id: '1',
          name: 'Morning Walk',
          type: 'exercise',
          duration: 30,
          frequency: 'Daily',
          completed: true,
          scheduledTime: '08:00 AM'
        },
        {
          id: '2',
          name: 'Physical Therapy Session',
          type: 'therapy',
          duration: 45,
          frequency: '3x per week',
          completed: false,
          scheduledTime: '02:00 PM'
        },
        {
          id: '3',
          name: 'Evening Stretches',
          type: 'exercise',
          duration: 15,
          frequency: 'Daily',
          completed: false,
          scheduledTime: '06:00 PM'
        }
      ]);

      setRecoveryGoals([
        {
          id: '1',
          title: 'Daily Steps',
          target: 5000,
          current: 3250,
          unit: 'steps',
          category: 'physical',
          trend: 'up'
        },
        {
          id: '2',
          title: 'Pain Level',
          target: 2,
          current: 3,
          unit: '/10',
          category: 'medical',
          trend: 'down'
        },
        {
          id: '3',
          title: 'Flexibility',
          target: 100,
          current: 75,
          unit: '%',
          category: 'physical',
          trend: 'up'
        },
        {
          id: '4',
          title: 'Sleep Quality',
          target: 8,
          current: 6.5,
          unit: 'hours',
          category: 'mental',
          trend: 'stable'
        }
      ]);

      setRecoveryProgress(recoveryPercentage);
    } catch (error) {
      console.error('Error fetching recovery plan:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecoveryPlan();
  }, [user?._id]);

  // Progress chart options
  const progressChartOptions: ApexOptions = {
    chart: {
      type: 'radialBar',
      height: 200
    },
    plotOptions: {
      radialBar: {
        hollow: {
          size: '70%',
        },
        dataLabels: {
          show: true,
          name: {
            show: true,
            fontSize: '14px',
            fontWeight: 600,
            color: undefined,
            offsetY: -10
          },
          value: {
            show: true,
            fontSize: '24px',
            fontWeight: 700,
            color: undefined,
            offsetY: 5,
            formatter: function (val) {
              return val + '%';
            }
          },
          total: {
            show: true,
            label: 'Recovery',
            fontSize: '14px',
            fontWeight: 600,
            color: '#666'
          }
        }
      }
    },
    colors: ['#00E396'],
    labels: ['Progress']
  };

  const handleActivityToggle = (activityId: string) => {
    setTodayActivities(prev =>
      prev.map(activity =>
        activity.id === activityId
          ? { ...activity, completed: !activity.completed }
          : activity
      )
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'medical': return 'mdi:medical-bag';
      case 'physical': return 'mdi:run-fast';
      case 'dietary': return 'mdi:food-apple';
      case 'mental': return 'mdi:brain';
      default: return 'mdi:heart';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'medical': return 'error';
      case 'physical': return 'primary';
      case 'dietary': return 'success';
      case 'mental': return 'warning';
      default: return 'info';
    }
  };

  return (
    <DashboardContent>
      <Box sx={{ mb: 5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4">Recovery Plan</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              Track your recovery journey and achieve your health goals
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Icon icon="mdi:download" />}
            >
              Export Plan
            </Button>
            <Button
              variant="contained"
              startIcon={<Icon icon="mdi:target" />}
              onClick={() => setAddGoalDialog(true)}
            >
              Add Goal
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Recovery Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overall Progress
              </Typography>
              <Chart
                options={progressChartOptions}
                series={[recoveryProgress]}
                type="radialBar"
                height={200}
              />
              <Stack spacing={1} sx={{ mt: 2 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    Surgery Date
                  </Typography>
                  <Typography variant="caption" fontWeight="bold">
                    {format(surgeryDate, 'MMM dd, yyyy')}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    Days Elapsed
                  </Typography>
                  <Typography variant="caption" fontWeight="bold">
                    {daysSinceSurgery} days
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    Expected Recovery
                  </Typography>
                  <Typography variant="caption" fontWeight="bold">
                    {expectedRecoveryDays} days
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={9}>
          <Grid container spacing={2}>
            {recoveryGoals.map((goal) => (
              <Grid item xs={12} sm={6} key={goal.id}>
                <Card>
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ bgcolor: `${getCategoryColor(goal.category)}.lighter`, width: 36, height: 36 }}>
                            <Icon icon={getCategoryIcon(goal.category)} width={20} />
                          </Avatar>
                          <Typography variant="subtitle2">{goal.title}</Typography>
                        </Stack>
                        <Icon
                          icon={
                            goal.trend === 'up' ? 'mdi:trending-up' :
                            goal.trend === 'down' ? 'mdi:trending-down' :
                            'mdi:trending-neutral'
                          }
                          width={20}
                          color={
                            goal.trend === 'up' ? '#00E396' :
                            goal.trend === 'down' ? '#FF4560' :
                            '#FEB019'
                          }
                        />
                      </Stack>
                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="h4">
                            {goal.current}
                            <Typography component="span" variant="subtitle1" color="text.secondary">
                              /{goal.target} {goal.unit}
                            </Typography>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {Math.round((goal.current / goal.target) * 100)}%
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={(goal.current / goal.target) * 100}
                          sx={{ height: 8, borderRadius: 1 }}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Tabs for different views */}
      <Card>
        <CardHeader
          title={
            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
              <Tab label="Timeline" icon={<Icon icon="mdi:timeline" />} iconPosition="start" />
              <Tab label="Today's Plan" icon={<Icon icon="mdi:calendar-today" />} iconPosition="start" />
              <Tab label="Milestones" icon={<Icon icon="mdi:flag-checkered" />} iconPosition="start" />
              <Tab label="Progress Charts" icon={<Icon icon="mdi:chart-line" />} iconPosition="start" />
            </Tabs>
          }
        />
        <CardContent>
          {/* Timeline View */}
          {activeTab === 0 && (
            <Timeline position="alternate">
              {milestones.map((milestone, index) => (
                <TimelineItem key={milestone.id}>
                  <TimelineOppositeContent color="text.secondary">
                    <Typography variant="subtitle2">
                      {format(milestone.targetDate, 'MMM dd, yyyy')}
                    </Typography>
                    <Typography variant="caption">
                      Day {differenceInDays(milestone.targetDate, surgeryDate)}
                    </Typography>
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot
                      color={
                        milestone.status === 'completed' ? 'success' :
                        milestone.status === 'in_progress' ? 'warning' :
                        milestone.status === 'overdue' ? 'error' : 'grey'
                      }
                    >
                      <Icon icon={milestone.icon} width={20} />
                    </TimelineDot>
                    {index < milestones.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Paper elevation={3} sx={{ p: 2 }}>
                      <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="h6">{milestone.title}</Typography>
                          <Chip
                            label={milestone.status.replace('_', ' ')}
                            size="small"
                            color={
                              milestone.status === 'completed' ? 'success' :
                              milestone.status === 'in_progress' ? 'warning' :
                              milestone.status === 'overdue' ? 'error' : 'default'
                            }
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {milestone.description}
                        </Typography>
                        {milestone.completedDate && (
                          <Typography variant="caption" color="success.main">
                            Completed on {format(milestone.completedDate, 'MMM dd, yyyy')}
                          </Typography>
                        )}
                      </Stack>
                    </Paper>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          )}

          {/* Today's Plan */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>
                  Today's Activities
                </Typography>
                <List>
                  {todayActivities.map((activity) => (
                    <ListItem
                      key={activity.id}
                      sx={{
                        bgcolor: activity.completed ? 'success.lighter' : 'background.paper',
                        mb: 1,
                        borderRadius: 1,
                        border: 1,
                        borderColor: 'divider'
                      }}
                    >
                      <ListItemAvatar>
                        <Checkbox
                          checked={activity.completed}
                          onChange={() => handleActivityToggle(activity.id)}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography
                              variant="subtitle1"
                              sx={{ textDecoration: activity.completed ? 'line-through' : 'none' }}
                            >
                              {activity.name}
                            </Typography>
                            <Chip
                              label={activity.type}
                              size="small"
                              variant="outlined"
                            />
                          </Stack>
                        }
                        secondary={
                          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              <Icon icon="mdi:clock-outline" /> {activity.scheduledTime}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              <Icon icon="mdi:timer" /> {activity.duration} min
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              <Icon icon="mdi:repeat" /> {activity.frequency}
                            </Typography>
                          </Stack>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'primary.lighter' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Daily Tips
                    </Typography>
                    <Stack spacing={2}>
                      <Alert severity="info" icon={<Icon icon="mdi:lightbulb" />}>
                        Remember to stay hydrated throughout your exercises
                      </Alert>
                      <Alert severity="success" icon={<Icon icon="mdi:food-apple" />}>
                        Include protein-rich foods to aid recovery
                      </Alert>
                      <Alert severity="warning" icon={<Icon icon="mdi:bed" />}>
                        Ensure 7-8 hours of quality sleep tonight
                      </Alert>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Milestones */}
          {activeTab === 2 && (
            <Box>
              <Stepper orientation="vertical">
                {milestones.map((milestone, index) => (
                  <Step key={milestone.id} active={milestone.status === 'in_progress'} completed={milestone.status === 'completed'}>
                    <StepLabel
                      StepIconComponent={() => (
                        <Avatar
                          sx={{
                            bgcolor: milestone.status === 'completed' ? 'success.main' :
                                    milestone.status === 'in_progress' ? 'warning.main' :
                                    'grey.400',
                            width: 40,
                            height: 40
                          }}
                        >
                          <Icon icon={milestone.icon} width={24} />
                        </Avatar>
                      )}
                    >
                      <Typography variant="h6">{milestone.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Target: {format(milestone.targetDate, 'MMM dd, yyyy')}
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {milestone.description}
                      </Typography>
                      {milestone.status === 'in_progress' && (
                        <Box sx={{ mb: 2 }}>
                          <Button variant="contained" size="small" sx={{ mr: 1 }}>
                            Mark Complete
                          </Button>
                          <Button size="small">
                            Add Note
                          </Button>
                        </Box>
                      )}
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </Box>
          )}

          {/* Progress Charts */}
          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2">Progress Tracking</Typography>
                  <Typography variant="caption">
                    Your recovery progress is being monitored across multiple metrics. Keep up the great work!
                  </Typography>
                </Alert>
              </Grid>
              {recoveryGoals.map((goal) => (
                <Grid item xs={12} md={6} key={goal.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {goal.title} Progress
                      </Typography>
                      <Chart
                        options={{
                          chart: { type: 'line', toolbar: { show: false } },
                          stroke: { curve: 'smooth', width: 3 },
                          xaxis: {
                            categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Current']
                          },
                          yaxis: {
                            title: { text: goal.unit }
                          },
                          colors: ['#008FFB']
                        }}
                        series={[{
                          name: goal.title,
                          data: [
                            goal.current * 0.3,
                            goal.current * 0.5,
                            goal.current * 0.7,
                            goal.current * 0.85,
                            goal.current
                          ]
                        }]}
                        type="line"
                        height={250}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Add Goal Dialog */}
      <Dialog open={addGoalDialog} onClose={() => setAddGoalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Recovery Goal</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField label="Goal Title" fullWidth />
            <TextField label="Target Value" type="number" fullWidth />
            <TextField label="Unit (e.g., steps, minutes)" fullWidth />
            <TextField
              select
              label="Category"
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="physical">Physical</option>
              <option value="medical">Medical</option>
              <option value="dietary">Dietary</option>
              <option value="mental">Mental Health</option>
            </TextField>
            <TextField
              label="Description"
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddGoalDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setAddGoalDialog(false)}>Add Goal</Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}