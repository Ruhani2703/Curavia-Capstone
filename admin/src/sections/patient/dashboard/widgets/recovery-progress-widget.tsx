import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  completed: boolean;
  completedDate?: string;
  icon: string;
  importance: 'high' | 'medium' | 'low';
}

interface RecoveryMetric {
  name: string;
  current: number;
  target: number;
  unit: string;
  icon: string;
  color: string;
}

interface RecoveryProgressWidgetProps {
  surgeryType?: string;
  surgeryDate?: string;
}

export function RecoveryProgressWidget({ 
  surgeryType = 'Cardiac Surgery',
  surgeryDate = '2024-01-15'
}: RecoveryProgressWidgetProps) {
  const [weeklyProgress] = useState(75);
  const [overallProgress] = useState(68);
  const [expectedRecoveryDays] = useState(90);
  const [daysElapsed] = useState(22);

  const [milestones] = useState<Milestone[]>([
    {
      id: '1',
      title: 'First Walk',
      description: 'Walk 50 steps without assistance',
      targetDate: '3 days post-surgery',
      completed: true,
      completedDate: '2024-01-18',
      icon: 'solar:walking-bold',
      importance: 'high'
    },
    {
      id: '2',
      title: 'Pain Management',
      description: 'Reduce pain medication by 50%',
      targetDate: '1 week post-surgery',
      completed: true,
      completedDate: '2024-01-22',
      icon: 'solar:shield-check-bold',
      importance: 'high'
    },
    {
      id: '3',
      title: 'Return to Light Activity',
      description: 'Resume light daily activities',
      targetDate: '2 weeks post-surgery',
      completed: true,
      completedDate: '2024-01-29',
      icon: 'solar:home-bold',
      importance: 'medium'
    },
    {
      id: '4',
      title: 'Exercise Tolerance',
      description: 'Walk 15 minutes continuously',
      targetDate: '4 weeks post-surgery',
      completed: false,
      icon: 'solar:heart-pulse-bold',
      importance: 'high'
    },
    {
      id: '5',
      title: 'Return to Work',
      description: 'Resume normal work activities',
      targetDate: '6-8 weeks post-surgery',
      completed: false,
      icon: 'solar:case-bold',
      importance: 'medium'
    },
    {
      id: '6',
      title: 'Full Recovery',
      description: 'Return to all pre-surgery activities',
      targetDate: '8-12 weeks post-surgery',
      completed: false,
      icon: 'solar:star-bold',
      importance: 'high'
    }
  ]);

  const [recoveryMetrics] = useState<RecoveryMetric[]>([
    {
      name: 'Mobility',
      current: 80,
      target: 100,
      unit: '%',
      icon: 'solar:walking-bold',
      color: 'success'
    },
    {
      name: 'Pain Level',
      current: 3,
      target: 1,
      unit: '/10',
      icon: 'solar:medical-kit-bold',
      color: 'warning'
    },
    {
      name: 'Sleep Quality',
      current: 7,
      target: 8,
      unit: '/10',
      icon: 'solar:sleep-bold',
      color: 'info'
    },
    {
      name: 'Energy Level',
      current: 70,
      target: 90,
      unit: '%',
      icon: 'solar:battery-charge-bold',
      color: 'primary'
    }
  ]);

  const completedMilestones = milestones.filter(m => m.completed).length;
  const nextMilestone = milestones.find(m => !m.completed);

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'success';
    if (progress >= 50) return 'info';
    if (progress >= 25) return 'warning';
    return 'error';
  };

  const getMetricProgress = (metric: RecoveryMetric) => {
    if (metric.name === 'Pain Level') {
      // For pain, lower is better
      return ((10 - metric.current) / (10 - metric.target)) * 100;
    }
    return (metric.current / metric.target) * 100;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Recovery Progress
        </Typography>

        {/* Overall Progress */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Overall Recovery</Typography>
            <Typography variant="body2" color={`${getProgressColor(overallProgress)}.main`}>
              {overallProgress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={overallProgress}
            color={getProgressColor(overallProgress)}
            sx={{ height: 8, borderRadius: 1, mb: 1 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Day {daysElapsed} of {expectedRecoveryDays}
            </Typography>
            <Chip 
              label={overallProgress >= 75 ? 'Ahead of Schedule' : 'On Track'} 
              size="small"
              color={overallProgress >= 75 ? 'success' : 'primary'}
            />
          </Box>
        </Box>

        {/* Weekly Progress */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">This Week</Typography>
            <Typography variant="body2" color={`${getProgressColor(weeklyProgress)}.main`}>
              {weeklyProgress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={weeklyProgress}
            color={getProgressColor(weeklyProgress)}
            sx={{ height: 6, borderRadius: 1 }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Recovery Metrics */}
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Recovery Metrics
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {recoveryMetrics.map((metric) => (
            <Grid item xs={6} key={metric.name}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: 'background.neutral',
                  textAlign: 'center'
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: `${metric.color}.main`,
                    width: 32,
                    height: 32,
                    mx: 'auto',
                    mb: 1
                  }}
                >
                  <Iconify icon={metric.icon} width={16} />
                </Avatar>
                <Typography variant="subtitle2">
                  {metric.current}{metric.unit}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {metric.name}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(getMetricProgress(metric), 100)}
                  color={metric.color as any}
                  sx={{ mt: 1, height: 4, borderRadius: 1 }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Next Milestone */}
        {nextMilestone && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Next Milestone
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
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Iconify icon={nextMilestone.icon} />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2">
                    {nextMilestone.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {nextMilestone.description}
                  </Typography>
                  <Typography variant="caption" color="primary.main">
                    Target: {nextMilestone.targetDate}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>
        )}

        {/* Milestones Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2">
            Milestones ({completedMilestones}/{milestones.length})
          </Typography>
          <Button
            size="small"
            endIcon={<Iconify icon="solar:arrow-right-bold" />}
          >
            View All
          </Button>
        </Box>

        <Stack spacing={1}>
          {milestones.slice(0, 3).map((milestone) => (
            <Box
              key={milestone.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 1,
                borderRadius: 1,
                bgcolor: milestone.completed ? 'success.lighter' : 'background.neutral'
              }}
            >
              <Avatar
                sx={{
                  bgcolor: milestone.completed ? 'success.main' : 'text.secondary',
                  width: 24,
                  height: 24,
                  mr: 1.5
                }}
              >
                <Iconify
                  icon={milestone.completed ? 'solar:check-circle-bold' : milestone.icon}
                  width={14}
                />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    textDecoration: milestone.completed ? 'line-through' : 'none',
                    color: milestone.completed ? 'text.secondary' : 'text.primary'
                  }}
                >
                  {milestone.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {milestone.completed
                    ? `Completed ${milestone.completedDate}`
                    : `Target: ${milestone.targetDate}`}
                </Typography>
              </Box>
              {milestone.importance === 'high' && !milestone.completed && (
                <Chip label="Important" size="small" color="warning" />
              )}
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}