import { useState, useEffect } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface ExerciseGoal {
  id: string;
  name: string;
  current: number;
  target: number;
  unit: string;
  icon: string;
  color: string;
  description: string;
}

interface Activity {
  id: string;
  name: string;
  duration: number;
  calories: number;
  time: string;
  type: 'walking' | 'stretching' | 'breathing' | 'strength';
  completed: boolean;
  icon: string;
}

interface ExerciseTrackerWidgetProps {
  patientId?: string;
  surgeryType?: string;
  daysPostSurgery?: number;
}

export function ExerciseTrackerWidget({ 
  patientId,
  surgeryType = 'Cardiac Surgery',
  daysPostSurgery = 22
}: ExerciseTrackerWidgetProps) {
  const [exerciseGoals, setExerciseGoals] = useState<ExerciseGoal[]>([
    {
      id: 'steps',
      name: 'Daily Steps',
      current: 3250,
      target: 5000,
      unit: 'steps',
      icon: 'solar:walking-bold',
      color: 'primary',
      description: 'Gradual increase recommended'
    },
    {
      id: 'active_minutes',
      name: 'Active Minutes',
      current: 25,
      target: 30,
      unit: 'min',
      icon: 'solar:heart-pulse-bold',
      color: 'success',
      description: 'Light to moderate activity'
    },
    {
      id: 'distance',
      name: 'Walking Distance',
      current: 1.8,
      target: 2.5,
      unit: 'km',
      icon: 'solar:route-bold',
      color: 'info',
      description: 'Build endurance slowly'
    },
    {
      id: 'calories',
      name: 'Calories Burned',
      current: 180,
      target: 250,
      unit: 'kcal',
      icon: 'solar:fire-bold',
      color: 'warning',
      description: 'Through light exercise'
    }
  ]);

  const [todayActivities] = useState<Activity[]>([
    {
      id: '1',
      name: 'Morning Walk',
      duration: 15,
      calories: 80,
      time: '8:30 AM',
      type: 'walking',
      completed: true,
      icon: 'solar:walking-bold'
    },
    {
      id: '2',
      name: 'Breathing Exercise',
      duration: 10,
      calories: 15,
      time: '11:00 AM',
      type: 'breathing',
      completed: true,
      icon: 'solar:wind-bold'
    },
    {
      id: '3',
      name: 'Gentle Stretching',
      duration: 12,
      calories: 25,
      time: '2:00 PM',
      type: 'stretching',
      completed: false,
      icon: 'solar:stretching-bold'
    },
    {
      id: '4',
      name: 'Evening Walk',
      duration: 20,
      calories: 100,
      time: '6:00 PM',
      type: 'walking',
      completed: false,
      icon: 'solar:walking-bold'
    },
    {
      id: '5',
      name: 'Relaxation',
      duration: 8,
      calories: 10,
      time: '8:00 PM',
      type: 'breathing',
      completed: false,
      icon: 'solar:meditation-bold'
    }
  ]);

  const [isActive, setIsActive] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<string | null>(null);

  // Simulate real-time step counting
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setExerciseGoals(prev =>
        prev.map(goal =>
          goal.id === 'steps'
            ? { ...goal, current: Math.min(goal.current + Math.floor(Math.random() * 5), goal.target) }
            : goal
        )
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isActive]);

  const completedActivities = todayActivities.filter(activity => activity.completed).length;
  const totalPlannedCalories = todayActivities.reduce((sum, activity) => sum + activity.calories, 0);
  const burnedCalories = todayActivities
    .filter(activity => activity.completed)
    .reduce((sum, activity) => sum + activity.calories, 0);

  const nextActivity = todayActivities.find(activity => !activity.completed);

  const handleStartActivity = (activityId: string) => {
    setCurrentActivity(activityId);
    setIsActive(true);
  };

  const handleCompleteActivity = (activityId: string) => {
    setCurrentActivity(null);
    setIsActive(false);
    // In a real app, this would update the backend
    console.log(`Activity ${activityId} completed`);
  };

  const getActivityTypeColor = (type: Activity['type']) => {
    switch (type) {
      case 'walking':
        return 'primary';
      case 'stretching':
        return 'success';
      case 'breathing':
        return 'info';
      case 'strength':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'success';
    if (percentage >= 75) return 'info';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  const getRecommendationForSurgeryType = () => {
    if (daysPostSurgery < 7) {
      return {
        type: 'info' as const,
        message: 'Focus on gentle breathing exercises and short walks as tolerated.',
        icon: 'solar:info-circle-bold'
      };
    }
    if (daysPostSurgery < 14) {
      return {
        type: 'warning' as const,
        message: 'Gradually increase activity. Listen to your body and rest when needed.',
        icon: 'solar:shield-warning-bold'
      };
    }
    return {
      type: 'success' as const,
      message: 'Good progress! Continue building endurance with regular activity.',
      icon: 'solar:check-circle-bold'
    };
  };

  const recommendation = getRecommendationForSurgeryType();

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Exercise Tracker
          </Typography>
          <Tooltip title={isActive ? 'Activity in progress' : 'Start tracking'}>
            <IconButton 
              color={isActive ? 'success' : 'default'}
              onClick={() => setIsActive(!isActive)}
            >
              <Iconify icon={isActive ? 'solar:pause-bold' : 'solar:play-bold'} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Surgery-specific recommendation */}
        <Alert 
          severity={recommendation.type}
          icon={<Iconify icon={recommendation.icon} />}
          sx={{ mb: 3 }}
        >
          <Typography variant="body2">
            Day {daysPostSurgery} post-{surgeryType.toLowerCase()}: {recommendation.message}
          </Typography>
        </Alert>

        {/* Current Activity */}
        {currentActivity && (
          <Box
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              bgcolor: 'success.lighter',
              border: '1px solid',
              borderColor: 'success.light'
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <Iconify icon="solar:play-bold" />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2">
                  Activity in Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {todayActivities.find(a => a.id === currentActivity)?.name}
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="success"
                size="small"
                onClick={() => handleCompleteActivity(currentActivity)}
              >
                Complete
              </Button>
            </Stack>
          </Box>
        )}

        {/* Exercise Goals */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {exerciseGoals.map((goal) => {
            const percentage = Math.min((goal.current / goal.target) * 100, 100);
            return (
              <Grid item xs={6} sm={3} key={goal.id}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.neutral',
                    textAlign: 'center'
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: `${goal.color}.main`,
                      width: 40,
                      height: 40,
                      mx: 'auto',
                      mb: 1
                    }}
                  >
                    <Iconify icon={goal.icon} width={20} />
                  </Avatar>
                  
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    {goal.current.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    {goal.name}
                  </Typography>
                  
                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    color={getProgressColor(percentage) as any}
                    sx={{ mb: 1, height: 6, borderRadius: 1 }}
                  />
                  
                  <Typography variant="caption" color="text.secondary">
                    {goal.target} {goal.unit} goal
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>

        {/* Next Activity */}
        {nextActivity && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Next Activity
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'primary.lighter',
                border: '1px solid',
                borderColor: 'primary.light'
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: `${getActivityTypeColor(nextActivity.type)}.main` }}>
                  <Iconify icon={nextActivity.icon} />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2">
                    {nextActivity.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {nextActivity.duration} min • {nextActivity.calories} kcal • {nextActivity.time}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleStartActivity(nextActivity.id)}
                  disabled={isActive}
                  startIcon={<Iconify icon="solar:play-bold" />}
                >
                  Start
                </Button>
              </Stack>
            </Box>
          </Box>
        )}

        {/* Today's Schedule */}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Today's Activities ({completedActivities}/{todayActivities.length})
        </Typography>
        <Stack spacing={1} sx={{ mb: 3 }}>
          {todayActivities.map((activity) => (
            <Box
              key={activity.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 1.5,
                borderRadius: 1,
                bgcolor: activity.completed ? 'success.lighter' : 'background.neutral'
              }}
            >
              <Avatar
                sx={{
                  bgcolor: activity.completed 
                    ? 'success.main' 
                    : `${getActivityTypeColor(activity.type)}.main`,
                  width: 32,
                  height: 32,
                  mr: 1.5
                }}
              >
                <Iconify 
                  icon={activity.completed ? 'solar:check-circle-bold' : activity.icon} 
                  width={16}
                />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    textDecoration: activity.completed ? 'line-through' : 'none',
                    color: activity.completed ? 'text.secondary' : 'text.primary'
                  }}
                >
                  {activity.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {activity.time} • {activity.duration} min • {activity.calories} kcal
                </Typography>
              </Box>
              <Chip 
                label={activity.type}
                size="small"
                color={getActivityTypeColor(activity.type) as any}
                variant="outlined"
              />
            </Box>
          ))}
        </Stack>

        {/* Summary */}
        <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
          <Typography variant="body2" color="info.dark">
            📊 Today's Progress: {burnedCalories}/{totalPlannedCalories} kcal burned
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Keep up the great work! Regular activity aids in recovery.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}