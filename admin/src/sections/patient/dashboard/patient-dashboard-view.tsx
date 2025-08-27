import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Alert,
  Stack,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  Paper,
  LinearProgress,
  Divider,
  IconButton,
  Badge,
  Container
} from '@mui/material';
import { Icon } from '@iconify/react';
import { format, differenceInDays } from 'date-fns';

import { DashboardContent } from 'src/layouts/dashboard';
import { useAuth } from 'src/contexts/AuthContext';
import apiHelper from 'src/utils/apiHelper';
import { 
  VitalSignsWidget,
  MedicineReminderWidget,
  RecoveryProgressWidget,
  DietPlanWidget,
  ExerciseTrackerWidget,
  MotivationWidget,
  EmergencySOSWidget
} from './widgets';

interface PatientStats {
  todayMedications: number;
  completedMedications: number;
  nextMedication: string;
  dailySteps: number;
  stepGoal: number;
  waterIntake: number;
  waterGoal: number;
  sleepHours: number;
  sleepGoal: number;
}

interface WeatherInfo {
  temperature: number;
  condition: string;
  icon: string;
}

export function PatientDashboardView() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [patientStats, setPatientStats] = useState<PatientStats>({
    todayMedications: 4,
    completedMedications: 2,
    nextMedication: '2:00 PM',
    dailySteps: 3250,
    stepGoal: 5000,
    waterIntake: 1.2,
    waterGoal: 2.5,
    sleepHours: 7.5,
    sleepGoal: 8
  });
  const [weather, setWeather] = useState<WeatherInfo>({
    temperature: 72,
    condition: 'Sunny',
    icon: 'mdi:weather-sunny'
  });
  
  const [chatHistory, setChatHistory] = useState([
    {
      id: '1',
      message: 'Hello! I\'m your medical assistant. How are you feeling today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Calculate recovery metrics
  const surgeryDate = user?.surgeryDate ? new Date(user.surgeryDate) : new Date('2024-01-15');
  const daysPostSurgery = differenceInDays(new Date(), surgeryDate);
  const expectedRecoveryDays = 90;
  const recoveryProgress = Math.min(Math.round((daysPostSurgery / expectedRecoveryDays) * 100), 100);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getMedicationStatus = () => {
    const percentage = (patientStats.completedMedications / patientStats.todayMedications) * 100;
    if (percentage === 100) return { color: 'success', text: 'All Done!' };
    if (percentage >= 50) return { color: 'warning', text: 'On Track' };
    return { color: 'error', text: 'Behind Schedule' };
  };

  const getActivityLevel = () => {
    const percentage = (patientStats.dailySteps / patientStats.stepGoal) * 100;
    if (percentage >= 100) return { color: 'success', text: 'Goal Achieved!', icon: 'mdi:trophy' };
    if (percentage >= 75) return { color: 'info', text: 'Almost There!', icon: 'mdi:run-fast' };
    if (percentage >= 50) return { color: 'warning', text: 'Keep Going!', icon: 'mdi:walk' };
    return { color: 'error', text: 'Get Moving!', icon: 'mdi:account-alert' };
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      message: chatMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, newMessage]);

    setTimeout(() => {
      const botResponse = {
        id: (Date.now() + 1).toString(),
        message: getBotResponse(chatMessage),
        sender: 'bot',
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, botResponse]);
    }, 1000);

    setChatMessage('');
  };

  const getBotResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('pain')) {
      return 'I understand you\'re experiencing pain. On a scale of 1-10, how would you rate it? If it\'s severe (8+), please contact your doctor immediately.';
    }
    if (lowerMessage.includes('medication') || lowerMessage.includes('medicine')) {
      return 'For medication questions, please refer to your prescribed schedule. Always take medications as directed by your doctor.';
    }
    if (lowerMessage.includes('exercise') || lowerMessage.includes('walk')) {
      return 'Light exercise is great for recovery! Start slowly and gradually increase as you feel comfortable. Listen to your body.';
    }
    if (lowerMessage.includes('diet') || lowerMessage.includes('eat')) {
      return 'A balanced, heart-healthy diet supports recovery. Focus on fruits, vegetables, lean proteins, and whole grains. Stay hydrated!';
    }
    
    return 'Thank you for sharing. If you have specific medical concerns, please don\'t hesitate to contact your healthcare provider.';
  };

  const medicationStatus = getMedicationStatus();
  const activityLevel = getActivityLevel();

  return (
    <>
      <DashboardContent maxWidth="xl">
        {/* Header Section */}
        <Paper 
          sx={{ 
            p: 3, 
            mb: 4, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 3
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar 
                  sx={{ 
                    width: 64, 
                    height: 64, 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    fontSize: '1.5rem'
                  }}
                >
                  {user?.name?.charAt(0) || 'P'}
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {getGreeting()}, {user?.name}! 👋
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
                    {format(currentTime, 'EEEE, MMMM dd, yyyy')} • Day {daysPostSurgery} of Recovery
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Card sx={{ bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Icon icon={weather.icon} width={32} color="white" />
                      <Box>
                        <Typography variant="h6" color="white">
                          {weather.temperature}°F
                        </Typography>
                        <Typography variant="caption" color="white" sx={{ opacity: 0.8 }}>
                          {weather.condition}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
                <Card sx={{ bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack alignItems="center">
                      <Typography variant="h6" color="white">
                        {recoveryProgress}%
                      </Typography>
                      <Typography variant="caption" color="white" sx={{ opacity: 0.8 }}>
                        Recovery
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          {/* Quick Stats Row - Using Overview Pattern */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ 
              p: 3,
              boxShadow: 'none',
              bgcolor: 'success.lighter',
              border: '1px solid',
              borderColor: 'success.light'
            }}>
              <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center' }}>
                <Icon icon="mdi:pill" width={32} color="#4caf50" />
                <Typography variant="h4" fontWeight="bold">
                  {patientStats.completedMedications}/{patientStats.todayMedications}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Medications Today
                </Typography>
              </Stack>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ 
              p: 3,
              boxShadow: 'none',
              bgcolor: 'info.lighter',
              border: '1px solid',
              borderColor: 'info.light'
            }}>
              <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center' }}>
                <Icon icon={activityLevel.icon} width={32} color="#2196f3" />
                <Typography variant="h4" fontWeight="bold">
                  {Math.round(patientStats.dailySteps / 1000)}K
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Steps Today
                </Typography>
              </Stack>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ 
              p: 3,
              boxShadow: 'none',
              bgcolor: 'warning.lighter',
              border: '1px solid',
              borderColor: 'warning.light'
            }}>
              <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center' }}>
                <Icon icon="mdi:water" width={32} color="#ff9800" />
                <Typography variant="h4" fontWeight="bold">
                  {patientStats.waterIntake}L
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Water Intake
                </Typography>
              </Stack>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ 
              p: 3,
              boxShadow: 'none',
              bgcolor: 'primary.lighter',
              border: '1px solid',
              borderColor: 'primary.light'
            }}>
              <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center' }}>
                <Icon icon="mdi:sleep" width={32} color="#1976d2" />
                <Typography variant="h4" fontWeight="bold">
                  {patientStats.sleepHours}h
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sleep Last Night
                </Typography>
              </Stack>
            </Card>
          </Grid>

          {/* Vital Signs Widget */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <VitalSignsWidget 
              patientId={user?._id}
              realTime={true}
            />
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <MedicineReminderWidget 
              patientId={user?._id}
              nextMedication={patientStats.nextMedication}
            />
          </Grid>

          {/* Recovery Progress */}
          <Grid size={{ xs: 12, md: 8 }}>
            <RecoveryProgressWidget 
              surgeryType={user?.surgeryType || 'Cardiac Surgery'}
              surgeryDate={user?.surgeryDate}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <EmergencySOSWidget 
              patientLocation="Home"
            />
          </Grid>

          {/* Diet and Exercise */}
          <Grid size={{ xs: 12, md: 6 }}>
            <DietPlanWidget 
              patientId={user?._id}
              waterIntake={patientStats.waterIntake}
              waterGoal={patientStats.waterGoal}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <ExerciseTrackerWidget 
              patientId={user?._id}
              surgeryType={user?.surgeryType}
              daysPostSurgery={daysPostSurgery}
              dailySteps={patientStats.dailySteps}
              stepGoal={patientStats.stepGoal}
            />
          </Grid>

          {/* Motivation Widget - Full Width */}
          <Grid size={{ xs: 12 }}>
            <MotivationWidget 
              patientName={user?.name}
              recoveryProgress={recoveryProgress}
              daysPostSurgery={daysPostSurgery}
            />
          </Grid>
        </Grid>

        {/* Recovery Timeline Alert */}
        <Alert 
          severity="info" 
          icon={<Icon icon="mdi:timeline-clock" />}
          sx={{ 
            mt: 4,
            borderRadius: 2,
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                🎯 Recovery Timeline Progress
              </Typography>
              <Typography variant="body2">
                Day {daysPostSurgery} of {expectedRecoveryDays} • You're making excellent progress on your recovery journey!
              </Typography>
            </Box>
            <Box sx={{ minWidth: 200 }}>
              <LinearProgress
                variant="determinate"
                value={recoveryProgress}
                sx={{ height: 8, borderRadius: 4, mb: 1 }}
                color="info"
              />
              <Typography variant="caption" color="text.secondary" align="center" display="block">
                {recoveryProgress}% Complete
              </Typography>
            </Box>
          </Stack>
        </Alert>

        {/* Quick Actions */}
        <Paper sx={{ p: 3, mt: 3, borderRadius: 2, bgcolor: 'grey.50' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Icon icon="mdi:heart-pulse" />}
                onClick={() => window.location.href = '/patient/health-monitoring'}
                sx={{ py: 1.5 }}
              >
                View Vitals
              </Button>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Icon icon="mdi:pill" />}
                onClick={() => window.location.href = '/patient/medications'}
                sx={{ py: 1.5 }}
              >
                Medications
              </Button>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Icon icon="mdi:food-apple" />}
                onClick={() => window.location.href = '/patient/diet'}
                sx={{ py: 1.5 }}
              >
                Diet Plan
              </Button>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Icon icon="mdi:chart-line" />}
                onClick={() => window.location.href = '/patient/reports'}
                sx={{ py: 1.5 }}
              >
                My Reports
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </DashboardContent>

      {/* Floating Action Buttons */}
      <Stack
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000
        }}
        spacing={2}
      >
        {/* Emergency Button */}
        <Fab
          color="error"
          size="small"
          aria-label="emergency"
          sx={{ 
            boxShadow: 3,
            '&:hover': { transform: 'scale(1.05)' }
          }}
        >
          <Icon icon="mdi:phone" />
        </Fab>

        {/* Chatbot Button */}
        <Badge badgeContent={chatHistory.length > 1 ? 1 : 0} color="success">
          <Fab
            color="primary"
            aria-label="medical assistant"
            onClick={() => setChatbotOpen(true)}
            sx={{ 
              boxShadow: 3,
              '&:hover': { transform: 'scale(1.05)' }
            }}
          >
            <Icon icon="mdi:robot" />
          </Fab>
        </Badge>
      </Stack>

      {/* Enhanced Chatbot Dialog */}
      <Dialog
        open={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <Icon icon="mdi:robot" />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  Medical Assistant
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Online • Ready to help
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={() => setChatbotOpen(false)} size="small">
              <Icon icon="mdi:close" />
            </IconButton>
          </Stack>
        </DialogTitle>
        
        <Divider />
        
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ height: 350, overflowY: 'auto', p: 2 }}>
            <Stack spacing={2}>
              {chatHistory.map((chat) => (
                <Box
                  key={chat.id}
                  sx={{
                    display: 'flex',
                    justifyContent: chat.sender === 'user' ? 'flex-end' : 'flex-start',
                    animation: 'fadeIn 0.3s ease-in'
                  }}
                >
                  <Paper
                    elevation={1}
                    sx={{
                      maxWidth: '80%',
                      p: 2,
                      borderRadius: 3,
                      bgcolor: chat.sender === 'user' ? 'primary.main' : 'grey.100',
                      color: chat.sender === 'user' ? 'white' : 'text.primary',
                      borderBottomRightRadius: chat.sender === 'user' ? 1 : 3,
                      borderBottomLeftRadius: chat.sender === 'bot' ? 1 : 3,
                    }}
                  >
                    <Typography variant="body2">
                      {chat.message}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        opacity: 0.7,
                        display: 'block',
                        mt: 0.5,
                        textAlign: chat.sender === 'user' ? 'right' : 'left'
                      }}
                    >
                      {format(chat.timestamp, 'HH:mm')}
                    </Typography>
                  </Paper>
                </Box>
              ))}
            </Stack>
          </Box>
          
          <Divider />
          
          <Stack direction="row" spacing={1} sx={{ p: 2 }}>
            <TextField
              fullWidth
              placeholder="Ask about your recovery, medications, diet..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!chatMessage.trim()}
              sx={{ minWidth: 56, borderRadius: 3 }}
            >
              <Icon icon="mdi:send" />
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}