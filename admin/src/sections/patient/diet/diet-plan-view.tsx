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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Paper,
  LinearProgress,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Icon } from '@iconify/react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from 'src/contexts/AuthContext';
import apiHelper from 'src/utils/apiHelper';

interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  ingredients: string[];
  instructions: string;
  completed: boolean;
  rating?: number;
}

interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water: number; // in liters
  sodium: number; // in mg
}

interface DietPlan {
  id: string;
  patientId: string;
  planName: string;
  startDate: string;
  endDate: string;
  nutritionTargets: NutritionTargets;
  todayMeals: Meal[];
  weeklyProgress: {
    day: string;
    caloriesConsumed: number;
    caloriesTarget: number;
    proteinConsumed: number;
    proteinTarget: number;
  }[];
  recommendations: string[];
  restrictions: string[];
  supplements: Array<{
    name: string;
    dosage: string;
    timing: string;
  }>;
}

interface WaterIntake {
  target: number;
  consumed: number;
  logs: Array<{
    time: string;
    amount: number;
  }>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export function DietPlanView() {
  const { user } = useAuth();
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [waterIntake, setWaterIntake] = useState<WaterIntake | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [mealDialogOpen, setMealDialogOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [mealRating, setMealRating] = useState(5);
  const [mealNotes, setMealNotes] = useState('');
  const [waterDialogOpen, setWaterDialogOpen] = useState(false);
  const [waterAmount, setWaterAmount] = useState(250);

  useEffect(() => {
    fetchDietPlan();
    fetchWaterIntake();
  }, [selectedDate]);

  const fetchDietPlan = async () => {
    try {
      setLoading(true);
      const response = await apiHelper.get(`/patient/diet-plan?date=${selectedDate}`);
      
      if (response.success) {
        setDietPlan(response.data);
      } else {
        setError('Failed to load diet plan');
      }
    } catch (err: any) {
      console.error('Diet plan fetch error:', err);
      setError(err.message || 'Failed to load diet plan');
    } finally {
      setLoading(false);
    }
  };

  const fetchWaterIntake = async () => {
    try {
      const response = await apiHelper.get(`/patient/water-intake?date=${selectedDate}`);
      if (response.success) {
        setWaterIntake(response.data);
      }
    } catch (err: any) {
      console.error('Water intake fetch error:', err);
    }
  };

  const markMealCompleted = async (mealId: string, rating: number, notes: string) => {
    try {
      const response = await apiHelper.post(`/patient/meal-log/${mealId}`, {
        completed: true,
        rating,
        notes,
        loggedAt: new Date()
      });

      if (response.success) {
        setMealDialogOpen(false);
        setSelectedMeal(null);
        setMealRating(5);
        setMealNotes('');
        fetchDietPlan();
      }
    } catch (err: any) {
      console.error('Meal log error:', err);
      setError(err.message || 'Failed to log meal');
    }
  };

  const logWaterIntake = async () => {
    try {
      const response = await apiHelper.post('/patient/water-log', {
        amount: waterAmount,
        loggedAt: new Date()
      });

      if (response.success) {
        setWaterDialogOpen(false);
        setWaterAmount(250);
        fetchWaterIntake();
      }
    } catch (err: any) {
      console.error('Water log error:', err);
      setError(err.message || 'Failed to log water intake');
    }
  };

  const getMealIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return 'mdi:coffee';
      case 'lunch': return 'mdi:hamburger';
      case 'dinner': return 'mdi:food-turkey';
      case 'snack': return 'mdi:food-apple';
      default: return 'mdi:silverware-fork-knife';
    }
  };

  const getMealColor = (type: string) => {
    switch (type) {
      case 'breakfast': return '#ff9800';
      case 'lunch': return '#4caf50';
      case 'dinner': return '#2196f3';
      case 'snack': return '#9c27b0';
      default: return '#757575';
    }
  };

  const calculateNutritionProgress = () => {
    if (!dietPlan) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

    const completedMeals = dietPlan.todayMeals.filter(meal => meal.completed);
    const totals = completedMeals.reduce((acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    return {
      calories: Math.round((totals.calories / dietPlan.nutritionTargets.calories) * 100),
      protein: Math.round((totals.protein / dietPlan.nutritionTargets.protein) * 100),
      carbs: Math.round((totals.carbs / dietPlan.nutritionTargets.carbs) * 100),
      fat: Math.round((totals.fat / dietPlan.nutritionTargets.fat) * 100)
    };
  };

  const nutritionData = dietPlan ? [
    { name: 'Protein', value: dietPlan.todayMeals.reduce((acc, meal) => acc + (meal.completed ? meal.protein : 0), 0) },
    { name: 'Carbs', value: dietPlan.todayMeals.reduce((acc, meal) => acc + (meal.completed ? meal.carbs : 0), 0) },
    { name: 'Fat', value: dietPlan.todayMeals.reduce((acc, meal) => acc + (meal.completed ? meal.fat : 0), 0) },
  ] : [];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading diet plan...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            My Diet Plan
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Personalized nutrition plan for your recovery journey
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
          <Button
            variant="outlined"
            startIcon={<Icon icon="mdi:refresh" width={20} />}
            onClick={fetchDietPlan}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!dietPlan ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Icon icon="mdi:food-variant" style={{ fontSize: 64, color: '#9e9e9e', marginBottom: 16 }} />
            <Typography variant="h6" color="text.secondary">
              No diet plan available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your healthcare team will create a personalized diet plan for you.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={3}>
          {/* Nutrition Overview */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader
                  title="Daily Nutrition Progress"
                  avatar={<Icon icon="mdi:nutrition" style={{ color: '#4caf50' }} width={24} />}
                />
                <CardContent>
                  <Grid container spacing={3}>
                    {Object.entries(calculateNutritionProgress()).map(([key, value]) => (
                      <Grid item xs={6} md={3} key={key}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color={value >= 100 ? 'success.main' : value >= 75 ? 'warning.main' : 'text.primary'}>
                            {value}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min(value, 100)} 
                            sx={{ height: 6, borderRadius: 3 }}
                            color={value >= 100 ? 'success' : value >= 75 ? 'warning' : 'primary'}
                          />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader
                  title="Macronutrient Breakdown"
                  avatar={<Icon icon="mdi:chart-donut" style={{ color: '#2196f3' }} width={24} />}
                />
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={nutritionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {nutritionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Water Intake */}
          {waterIntake && (
            <Card>
              <CardHeader
                title="Water Intake"
                avatar={<Icon icon="mdi:water" style={{ color: '#00bcd4' }} width={24} />}
                action={
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Icon icon="mdi:plus" width={16} />}
                    onClick={() => setWaterDialogOpen(true)}
                  >
                    Log Water
                  </Button>
                }
              />
              <CardContent>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h3" color="info.main">
                        {waterIntake.consumed}L
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        / {waterIntake.target}L target
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(waterIntake.consumed / waterIntake.target) * 100} 
                      sx={{ mt: 2, height: 8, borderRadius: 4 }}
                      color="info"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Today's Water Log
                    </Typography>
                    <Box sx={{ maxHeight: 120, overflowY: 'auto' }}>
                      {waterIntake.logs.map((log, index) => (
                        <Chip
                          key={index}
                          size="small"
                          label={`${log.amount}ml at ${log.time}`}
                          variant="outlined"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Today's Meals */}
          <Card>
            <CardHeader
              title={`Meals for ${new Date(selectedDate).toLocaleDateString()}`}
              avatar={<Icon icon="mdi:silverware-fork-knife" style={{ color: '#ff9800' }} width={24} />}
            />
            <CardContent>
              <Grid container spacing={2}>
                {dietPlan.todayMeals.map((meal) => (
                  <Grid item xs={12} md={6} key={meal.id}>
                    <Paper sx={{ p: 2 }} elevation={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: getMealColor(meal.type) }}>
                          <Icon icon={getMealIcon(meal.type)} width={24} />
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1">
                            {meal.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {meal.time} • {meal.calories} calories
                          </Typography>
                        </Box>
                        <Box>
                          {meal.completed ? (
                            <Chip
                              icon={<Icon icon="mdi:check-circle" width={16} />}
                              label="Completed"
                              color="success"
                              size="small"
                            />
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setSelectedMeal(meal);
                                setMealDialogOpen(true);
                              }}
                            >
                              Log Meal
                            </Button>
                          )}
                        </Box>
                      </Box>
                      
                      <Grid container spacing={1} sx={{ mb: 2 }}>
                        <Grid item xs={3}>
                          <Typography variant="caption" display="block" color="text.secondary">
                            Protein
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {meal.protein}g
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="caption" display="block" color="text.secondary">
                            Carbs
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {meal.carbs}g
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="caption" display="block" color="text.secondary">
                            Fat
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {meal.fat}g
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="caption" display="block" color="text.secondary">
                            Fiber
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {meal.fiber}g
                          </Typography>
                        </Grid>
                      </Grid>

                      <Typography variant="caption" color="text.secondary">
                        <strong>Ingredients:</strong> {meal.ingredients.join(', ')}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Weekly Progress & Recommendations */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader
                  title="Weekly Nutrition Progress"
                  avatar={<Icon icon="mdi:trending-up" style={{ color: '#4caf50' }} width={24} />}
                />
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dietPlan.weeklyProgress}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="caloriesConsumed" fill="#8884d8" name="Calories Consumed" />
                      <Bar dataKey="caloriesTarget" fill="#82ca9d" name="Calories Target" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack spacing={2}>
                {/* Dietary Recommendations */}
                <Card>
                  <CardHeader
                    title="Recommendations"
                    avatar={<Icon icon="mdi:lightbulb" style={{ color: '#ff9800' }} width={24} />}
                  />
                  <CardContent>
                    <List dense>
                      {dietPlan.recommendations.map((rec, index) => (
                        <ListItem key={index} disablePadding>
                          <ListItemIcon>
                            <Icon icon="mdi:check-circle" style={{ color: '#4caf50' }} width={20} />
                          </ListItemIcon>
                          <ListItemText
                            primary={rec}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>

                {/* Dietary Restrictions */}
                {dietPlan.restrictions.length > 0 && (
                  <Card>
                    <CardHeader
                      title="Dietary Restrictions"
                      avatar={<Icon icon="mdi:alert" style={{ color: '#f44336' }} width={24} />}
                    />
                    <CardContent>
                      <Stack spacing={1}>
                        {dietPlan.restrictions.map((restriction, index) => (
                          <Chip
                            key={index}
                            label={restriction}
                            color="warning"
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                )}

                {/* Supplements */}
                {dietPlan.supplements.length > 0 && (
                  <Card>
                    <CardHeader
                      title="Supplements"
                      avatar={<Icon icon="mdi:pill" style={{ color: '#9c27b0' }} width={24} />}
                    />
                    <CardContent>
                      <List dense>
                        {dietPlan.supplements.map((supplement, index) => (
                          <ListItem key={index} disablePadding>
                            <ListItemText
                              primary={supplement.name}
                              secondary={`${supplement.dosage} - ${supplement.timing}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      )}

      {/* Meal Log Dialog */}
      <Dialog open={mealDialogOpen} onClose={() => setMealDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Log Meal: {selectedMeal?.name}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="I have completed this meal"
            />
            
            <Box>
              <Typography variant="body2" gutterBottom>
                How would you rate this meal?
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon
                    key={star}
                    icon="mdi:star"
                    width={32}
                    style={{
                      color: star <= mealRating ? '#ffb400' : '#e0e0e0',
                      cursor: 'pointer'
                    }}
                    onClick={() => setMealRating(star)}
                  />
                ))}
              </Box>
            </Box>

            <TextField
              fullWidth
              label="Notes (Optional)"
              multiline
              rows={3}
              value={mealNotes}
              onChange={(e) => setMealNotes(e.target.value)}
              placeholder="How did you feel after eating? Any substitutions made?"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMealDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => selectedMeal && markMealCompleted(selectedMeal.id, mealRating, mealNotes)}
            variant="contained"
          >
            Log Meal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Water Log Dialog */}
      <Dialog open={waterDialogOpen} onClose={() => setWaterDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Log Water Intake</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              type="number"
              label="Amount (ml)"
              value={waterAmount}
              onChange={(e) => setWaterAmount(Number(e.target.value))}
              inputProps={{ min: 50, max: 1000, step: 50 }}
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {[250, 500, 750, 1000].map((amount) => (
                <Chip
                  key={amount}
                  label={`${amount}ml`}
                  clickable
                  variant={waterAmount === amount ? 'filled' : 'outlined'}
                  onClick={() => setWaterAmount(amount)}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWaterDialogOpen(false)}>Cancel</Button>
          <Button onClick={logWaterIntake} variant="contained">
            Log Water
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}