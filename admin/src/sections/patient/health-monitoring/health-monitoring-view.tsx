import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Alert,
  Button,
  Skeleton,
  Paper,
  Divider,
  Chip
} from '@mui/material';
import { Icon } from '@iconify/react';
import { DashboardContent } from 'src/layouts/dashboard';
import { VitalSignsChart } from './vital-signs-chart';
import { useAuth } from 'src/contexts/AuthContext';
import apiHelper from 'src/utils/apiHelper';
import { format } from 'date-fns';

interface SensorData {
  _id: string;
  recordedAt: string;
  heartRate: number;
  systolicBP: number;
  diastolicBP: number;
  spO2: number;
  temperature: number;
  respiratoryRate: number;
  activityLevel: string;
}

interface Analytics {
  heartRate: {
    average: number;
    min: number;
    max: number;
    trend: string;
  };
  bloodPressure: {
    avgSystolic: number;
    avgDiastolic: number;
    trend: string;
  };
  spO2: {
    average: number;
    min: number;
    max: number;
    trend: string;
  };
  temperature: {
    average: number;
    min: number;
    max: number;
    trend: string;
  };
}

export function HealthMonitoringView() {
  const { user } = useAuth();
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  // Fetch sensor data
  const fetchSensorData = async () => {
    if (!user?._id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch sensor data
      const response = await apiHelper.get(`/sensor-data/data/${user._id}?period=${selectedPeriod}`);
      
      if (response.data) {
        setSensorData(response.data);
      }

      // Fetch analytics
      const analyticsResponse = await apiHelper.get(`/sensor-data/analytics/${user._id}?period=${selectedPeriod}`);
      if (analyticsResponse) {
        setAnalytics(analyticsResponse);
      }
    } catch (err: any) {
      console.error('Error fetching sensor data:', err);
      setError(err?.data?.error || 'Failed to load health monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensorData();
  }, [user?._id, selectedPeriod]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSensorData();
    }, 30000);

    return () => clearInterval(interval);
  }, [user?._id, selectedPeriod]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  // Get latest sensor reading
  const latestReading = sensorData.length > 0 ? sensorData[sensorData.length - 1] : null;

  // Summary cards data
  const summaryCards = [
    {
      title: 'Heart Rate',
      icon: 'mdi:heart-pulse',
      value: latestReading?.heartRate || '--',
      unit: 'BPM',
      trend: analytics?.heartRate?.trend || 'stable',
      average: analytics?.heartRate?.average,
      color: '#FF4560',
      bgColor: 'error.lighter',
      normalRange: '60-100'
    },
    {
      title: 'Blood Pressure',
      icon: 'mdi:blood-bag',
      value: latestReading ? `${latestReading.systolicBP}/${latestReading.diastolicBP}` : '--',
      unit: 'mmHg',
      trend: analytics?.bloodPressure?.trend || 'stable',
      average: analytics?.bloodPressure ? `${Math.round(analytics.bloodPressure.avgSystolic)}/${Math.round(analytics.bloodPressure.avgDiastolic)}` : null,
      color: '#008FFB',
      bgColor: 'info.lighter',
      normalRange: '120/80'
    },
    {
      title: 'Oxygen Level',
      icon: 'mdi:lungs',
      value: latestReading?.spO2 || '--',
      unit: '%',
      trend: analytics?.spO2?.trend || 'stable',
      average: analytics?.spO2?.average,
      color: '#00E396',
      bgColor: 'success.lighter',
      normalRange: '95-100'
    },
    {
      title: 'Temperature',
      icon: 'mdi:thermometer',
      value: latestReading?.temperature || '--',
      unit: '°F',
      trend: analytics?.temperature?.trend || 'stable',
      average: analytics?.temperature?.average,
      color: '#FEB019',
      bgColor: 'warning.lighter',
      normalRange: '97-99'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'mdi:trending-up';
      case 'decreasing':
        return 'mdi:trending-down';
      default:
        return 'mdi:trending-neutral';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'error.main';
      case 'decreasing':
        return 'info.main';
      default:
        return 'success.main';
    }
  };

  return (
    <DashboardContent>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4">Health Monitoring</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          Real-time vital signs tracking and health trends analysis
        </Typography>
      </Box>

      {/* Connection Status */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: latestReading ? 'success.lighter' : 'warning.lighter' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Icon 
            icon={latestReading ? "mdi:wifi" : "mdi:wifi-off"} 
            width={24}
            color={latestReading ? '#00E396' : '#FEB019'}
          />
          <Box flex={1}>
            <Typography variant="subtitle2">
              {latestReading ? 'Device Connected' : 'Waiting for Device Connection'}
            </Typography>
            {latestReading && (
              <Typography variant="caption" color="text.secondary">
                Last sync: {format(new Date(latestReading.recordedAt), 'MMM dd, yyyy HH:mm:ss')}
              </Typography>
            )}
          </Box>
          <Chip
            label={latestReading ? 'ONLINE' : 'OFFLINE'}
            size="small"
            color={latestReading ? 'success' : 'warning'}
          />
        </Stack>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: card.bgColor,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Icon icon={card.icon} width={24} color={card.color} />
                    </Box>
                    <Icon
                      icon={getTrendIcon(card.trend)}
                      width={20}
                      color={getTrendColor(card.trend)}
                    />
                  </Stack>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      {card.title}
                    </Typography>
                    <Typography variant="h4">
                      {loading ? (
                        <Skeleton width={80} />
                      ) : (
                        <>
                          {card.value}
                          <Typography component="span" variant="subtitle1" sx={{ ml: 0.5 }}>
                            {card.unit}
                          </Typography>
                        </>
                      )}
                    </Typography>
                  </Box>

                  <Divider />

                  <Stack spacing={0.5}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        Average
                      </Typography>
                      <Typography variant="caption" fontWeight="bold">
                        {card.average ? `${card.average.toFixed(1)} ${card.unit}` : '--'}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        Normal
                      </Typography>
                      <Typography variant="caption" color="success.main">
                        {card.normalRange} {card.unit}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Vital Signs Chart */}
      <VitalSignsChart
        patientId={user?._id}
        data={sensorData}
        loading={loading}
        error={error || undefined}
        onRefresh={fetchSensorData}
        onPeriodChange={handlePeriodChange}
      />

      {/* Additional Information */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Health Tips
              </Typography>
              <Stack spacing={2}>
                <Alert severity="info" icon={<Icon icon="mdi:water" />}>
                  Stay hydrated - Drink at least 8 glasses of water daily
                </Alert>
                <Alert severity="success" icon={<Icon icon="mdi:walk" />}>
                  Maintain regular physical activity as per your recovery plan
                </Alert>
                <Alert severity="warning" icon={<Icon icon="mdi:pill" />}>
                  Take medications on time as prescribed by your doctor
                </Alert>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Stack spacing={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Icon icon="mdi:download" />}
                  onClick={() => {
                    // TODO: Implement export functionality
                    alert('Export feature coming soon!');
                  }}
                >
                  Export Health Data
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Icon icon="mdi:share" />}
                  onClick={() => {
                    // TODO: Implement share with doctor
                    alert('Share with doctor feature coming soon!');
                  }}
                >
                  Share with Doctor
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  color="error"
                  startIcon={<Icon icon="mdi:alert" />}
                  onClick={() => {
                    // TODO: Implement emergency alert
                    alert('Emergency alert sent to your doctor!');
                  }}
                >
                  Emergency Alert
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}