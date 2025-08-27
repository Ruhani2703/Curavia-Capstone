import { useState, useEffect } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface MealPlan {
  id: string;
  name: string;
  time: string;
  calories: number;
  items: string[];
  completed: boolean;
  icon: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

interface NutrientGoal {
  name: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  icon: string;
}

interface DietRecommendation {
  type: 'increase' | 'decrease' | 'maintain';
  food: string;
  reason: string;
  icon: string;
}

interface DietPlanWidgetProps {
  patientId?: string;
  vitalSigns?: {
    bloodPressure: { systolic: number; diastolic: number };
    heartRate: number;
    temperature: number;
  };
}

export function DietPlanWidget({ 
  patientId, 
  vitalSigns = { 
    bloodPressure: { systolic: 120, diastolic: 80 }, 
    heartRate: 72, 
    temperature: 98.6 
  }
}: DietPlanWidgetProps) {
  const [mealPlans] = useState<MealPlan[]>([
    {
      id: '1',
      name: 'Healthy Breakfast',
      time: '8:00 AM',
      calories: 350,
      items: ['Oatmeal with berries', 'Low-fat yogurt', 'Green tea'],
      completed: true,
      icon: 'solar:sunrise-bold',
      type: 'breakfast'
    },
    {
      id: '2',
      name: 'Mid-Morning Snack',
      time: '10:30 AM',
      calories: 150,
      items: ['Apple slices', 'Handful of almonds'],
      completed: true,
      icon: 'solar:apple-bold',
      type: 'snack'
    },
    {
      id: '3',
      name: 'Heart-Healthy Lunch',
      time: '1:00 PM',
      calories: 450,
      items: ['Grilled salmon', 'Quinoa salad', 'Steamed vegetables', 'Water'],
      completed: false,
      icon: 'solar:sun-bold',
      type: 'lunch'
    },
    {
      id: '4',
      name: 'Afternoon Snack',
      time: '4:00 PM',
      calories: 120,
      items: ['Carrot sticks', 'Hummus dip'],
      completed: false,
      icon: 'solar:carrot-bold',
      type: 'snack'
    },
    {
      id: '5',
      name: 'Light Dinner',
      time: '7:00 PM',
      calories: 400,
      items: ['Grilled chicken breast', 'Sweet potato', 'Mixed greens', 'Herbal tea'],
      completed: false,
      icon: 'solar:moon-bold',
      type: 'dinner'
    }
  ]);

  const [nutrientGoals] = useState<NutrientGoal[]>([
    {
      name: 'Protein',
      current: 45,
      target: 80,
      unit: 'g',
      color: 'success',
      icon: 'solar:dumbbell-bold'
    },
    {
      name: 'Fiber',
      current: 18,
      target: 25,
      unit: 'g',
      color: 'info',
      icon: 'solar:leaf-bold'
    },
    {
      name: 'Sodium',
      current: 1800,
      target: 2000,
      unit: 'mg',
      color: 'warning',
      icon: 'solar:salt-bold'
    },
    {
      name: 'Water',
      current: 6,
      target: 8,
      unit: 'glasses',
      color: 'primary',
      icon: 'solar:water-drop-bold'
    }
  ]);

  const [dynamicRecommendations, setDynamicRecommendations] = useState<DietRecommendation[]>([]);

  // Generate dynamic recommendations based on vital signs
  useEffect(() => {
    const recommendations: DietRecommendation[] = [];

    // Blood pressure recommendations
    if (vitalSigns.bloodPressure.systolic > 140) {
      recommendations.push({
        type: 'decrease',
        food: 'Sodium intake',
        reason: 'High blood pressure detected',
        icon: 'solar:salt-bold'
      });
      recommendations.push({
        type: 'increase',
        food: 'Potassium-rich foods',
        reason: 'Help lower blood pressure',
        icon: 'solar:banana-bold'
      });
    }

    if (vitalSigns.bloodPressure.systolic < 90) {
      recommendations.push({
        type: 'increase',
        food: 'Fluid intake',
        reason: 'Low blood pressure detected',
        icon: 'solar:water-drop-bold'
      });
    }

    // Heart rate recommendations
    if (vitalSigns.heartRate > 100) {
      recommendations.push({
        type: 'decrease',
        food: 'Caffeine',
        reason: 'Elevated heart rate',
        icon: 'solar:coffee-bold'
      });
    }

    // Default recommendations if vitals are normal
    if (recommendations.length === 0) {
      recommendations.push(
        {
          type: 'increase',
          food: 'Omega-3 fatty acids',
          reason: 'Support heart health',
          icon: 'solar:fish-bold'
        },
        {
          type: 'maintain',
          food: 'Balanced nutrition',
          reason: 'Vitals are within normal range',
          icon: 'solar:heart-bold'
        }
      );
    }

    setDynamicRecommendations(recommendations);
  }, [vitalSigns]);

  const completedMeals = mealPlans.filter(meal => meal.completed).length;
  const totalCalories = mealPlans.reduce((sum, meal) => sum + meal.calories, 0);
  const consumedCalories = mealPlans
    .filter(meal => meal.completed)
    .reduce((sum, meal) => sum + meal.calories, 0);

  const handleCompleteMeal = (mealId: string) => {
    // In a real app, this would update the backend
    console.log(`Meal ${mealId} completed`);
  };

  const getRecommendationColor = (type: DietRecommendation['type']) => {
    switch (type) {
      case 'increase':
        return 'success';
      case 'decrease':
        return 'warning';
      case 'maintain':
        return 'info';
      default:
        return 'primary';
    }
  };

  const getRecommendationIcon = (type: DietRecommendation['type']) => {
    switch (type) {
      case 'increase':
        return 'solar:arrow-up-bold';
      case 'decrease':
        return 'solar:arrow-down-bold';
      case 'maintain':
        return 'solar:check-circle-bold';
      default:
        return 'solar:info-circle-bold';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Today's Diet Plan
          </Typography>
          <IconButton size="small">
            <Iconify icon="solar:settings-bold" />
          </IconButton>
        </Box>

        {/* Calorie Progress */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Calories Consumed</Typography>
            <Typography variant="body2" color="primary.main">
              {consumedCalories} / {totalCalories} kcal
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(consumedCalories / totalCalories) * 100}
            sx={{ height: 8, borderRadius: 1, mb: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            Meals completed: {completedMeals}/{mealPlans.length}
          </Typography>
        </Box>

        {/* Dynamic Recommendations */}
        {dynamicRecommendations.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Personalized Recommendations
            </Typography>
            {dynamicRecommendations.map((rec, index) => (
              <Alert 
                key={index}
                severity={getRecommendationColor(rec.type) as any}
                icon={<Iconify icon={getRecommendationIcon(rec.type)} />}
                sx={{ mb: 1 }}
              >
                <Typography variant="body2">
                  <strong>{rec.type === 'increase' ? 'Increase' : rec.type === 'decrease' ? 'Reduce' : 'Maintain'} {rec.food}</strong>
                </Typography>
                <Typography variant="caption">
                  {rec.reason}
                </Typography>
              </Alert>
            ))}
          </Box>
        )}

        {/* Meal Schedule */}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Meal Schedule
        </Typography>
        <List dense>
          {mealPlans.map((meal) => (
            <ListItem 
              key={meal.id}
              divider
              sx={{
                bgcolor: meal.completed ? 'success.lighter' : 'background.paper',
                borderRadius: 1,
                mb: 1
              }}
            >
              <ListItemAvatar>
                <Avatar 
                  sx={{ 
                    bgcolor: meal.completed ? 'success.main' : 'primary.main',
                    width: 40,
                    height: 40
                  }}
                >
                  <Iconify 
                    icon={meal.completed ? 'solar:check-circle-bold' : meal.icon} 
                    width={20}
                  />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography 
                      variant="subtitle2"
                      sx={{
                        textDecoration: meal.completed ? 'line-through' : 'none'
                      }}
                    >
                      {meal.name}
                    </Typography>
                    <Chip 
                      label={`${meal.calories} kcal`} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      📍 {meal.time}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {meal.items.join(' • ')}
                    </Typography>
                  </Box>
                }
              />
              {!meal.completed && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleCompleteMeal(meal.id)}
                  sx={{ ml: 1 }}
                >
                  Mark Done
                </Button>
              )}
            </ListItem>
          ))}
        </List>

        {/* Nutrient Goals */}
        <Typography variant="subtitle2" sx={{ mt: 3, mb: 2 }}>
          Daily Nutrient Goals
        </Typography>
        <Stack spacing={2}>
          {nutrientGoals.map((nutrient) => (
            <Box key={nutrient.name}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Iconify icon={nutrient.icon} width={16} />
                  <Typography variant="body2">{nutrient.name}</Typography>
                </Box>
                <Typography variant="body2" color={`${nutrient.color}.main`}>
                  {nutrient.current}/{nutrient.target} {nutrient.unit}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min((nutrient.current / nutrient.target) * 100, 100)}
                color={nutrient.color as any}
                sx={{ height: 6, borderRadius: 1 }}
              />
            </Box>
          ))}
        </Stack>

        {/* Quick Actions */}
        <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button 
            size="small" 
            variant="outlined" 
            startIcon={<Iconify icon="solar:water-drop-bold" />}
          >
            Log Water
          </Button>
          <Button 
            size="small" 
            variant="outlined" 
            startIcon={<Iconify icon="solar:add-circle-bold" />}
          >
            Add Food
          </Button>
          <Button 
            size="small" 
            variant="outlined" 
            startIcon={<Iconify icon="solar:chart-bold" />}
          >
            View Trends
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}