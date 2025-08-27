import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Button
} from '@mui/material';
import { Icon } from '@iconify/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts';
import { useAuth } from 'src/contexts/AuthContext';
import apiHelper from 'src/utils/apiHelper';

interface VitalData {
  timestamp: string;
  heartRate?: number;
  systolic?: number;
  diastolic?: number;
  temperature?: number;
  spO2?: number;
}

interface HealthMetrics {
  vitals: VitalData[];
  averages: {
    heartRate: number;
    bloodPressure: { systolic: number; diastolic: number };
    temperature: number;
    spO2: number;
  };
  trends: {
    heartRate: 'up' | 'down' | 'stable';
    bloodPressure: 'up' | 'down' | 'stable';
    temperature: 'up' | 'down' | 'stable';
    spO2: 'up' | 'down' | 'stable';
  };
  alerts: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: string;
  }>;
}

const NORMAL_RANGES = {
  heartRate: { min: 60, max: 100 },
  systolic: { min: 90, max: 140 },
  diastolic: { min: 60, max: 90 },
  temperature: { min: 97, max: 99.5 },
  spO2: { min: 95, max: 100 }
};

export function HealthMonitoringView() {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedMetric, setSelectedMetric] = useState<string>('all');

  useEffect(() => {
    fetchHealthData();
  }, [timeRange]);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const response = await apiHelper.get(`/patient/health-monitoring?range=${timeRange}`);
      
      if (response.success) {
        setHealthData(response.data);
      } else {
        setError('Failed to load health data');
      }
    } catch (err: any) {
      console.error('Health data fetch error:', err);
      setError(err.message || 'Failed to load health data');
    } finally {
      setLoading(false);
    }
  };

  const formatVitalsData = (vitals: VitalData[]) => {
    return vitals.map(vital => ({
      time: new Date(vital.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        month: timeRange !== '24h' ? 'short' : undefined,
        day: timeRange !== '24h' ? 'numeric' : undefined
      }),
      heartRate: vital.heartRate || null,
      systolic: vital.systolic || null,
      diastolic: vital.diastolic || null,
      temperature: vital.temperature || null,
      spO2: vital.spO2 || null,
      timestamp: vital.timestamp
    }));
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <Icon icon="material-symbols:trending-up" style={{ color: '#4caf50' }} width={20} />;
      case 'down': return <Icon icon="material-symbols:trending-down" style={{ color: '#f44336' }} width={20} />;
      default: return <Icon icon="material-symbols:monitor-heart" style={{ color: '#2196f3' }} width={20} />;
    }
  };

  const getVitalStatus = (value: number | undefined, type: keyof typeof NORMAL_RANGES) => {
    if (!value) return 'unknown';
    const range = NORMAL_RANGES[type];
    if (value < range.min) return 'low';
    if (value > range.max) return 'high';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': case 'high': return 'warning';
      case 'normal': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading health data...</Typography>
      </Box>
    );
  }

  if (!healthData) {
    return (
      <Container maxWidth="lg">
        <Alert severity="info" sx={{ mt: 2 }}>
          No health monitoring data available yet. Make sure your monitoring device is active.
        </Alert>
      </Container>
    );
  }

  const chartData = formatVitalsData(healthData.vitals);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Health Monitoring
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time tracking of your vital signs and health parameters
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={fetchHealthData} color="primary">
            <Icon icon="material-symbols:refresh" width={24} />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Current Status Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="error.main">
                    {healthData.averages.heartRate}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Heart Rate (bpm)
                  </Typography>
                  <Chip 
                    size="small" 
                    label={getVitalStatus(healthData.averages.heartRate, 'heartRate')}
                    color={getStatusColor(getVitalStatus(healthData.averages.heartRate, 'heartRate')) as any}
                    sx={{ mt: 1 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                  <Icon icon="material-symbols:favorite" style={{ color: '#f44336', fontSize: 40 }} />
                  {getTrendIcon(healthData.trends.heartRate)}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="primary.main">
                    {healthData.averages.bloodPressure.systolic}/
                    {healthData.averages.bloodPressure.diastolic}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Blood Pressure
                  </Typography>
                  <Chip 
                    size="small" 
                    label={getVitalStatus(healthData.averages.bloodPressure.systolic, 'systolic')}
                    color={getStatusColor(getVitalStatus(healthData.averages.bloodPressure.systolic, 'systolic')) as any}
                    sx={{ mt: 1 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                  <Icon icon="material-symbols:monitor-heart" style={{ color: '#2196f3', fontSize: 40 }} />
                  {getTrendIcon(healthData.trends.bloodPressure)}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {healthData.averages.temperature}°F
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Temperature
                  </Typography>
                  <Chip 
                    size="small" 
                    label={getVitalStatus(healthData.averages.temperature, 'temperature')}
                    color={getStatusColor(getVitalStatus(healthData.averages.temperature, 'temperature')) as any}
                    sx={{ mt: 1 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                  <Icon icon="material-symbols:device-thermostat" style={{ color: '#ff9800', fontSize: 40 }} />
                  {getTrendIcon(healthData.trends.temperature)}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="info.main">
                    {healthData.averages.spO2}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    SpO2 Saturation
                  </Typography>
                  <Chip 
                    size="small" 
                    label={getVitalStatus(healthData.averages.spO2, 'spO2')}
                    color={getStatusColor(getVitalStatus(healthData.averages.spO2, 'spO2')) as any}
                    sx={{ mt: 1 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                  <Icon icon="material-symbols:air" style={{ color: '#2196f3', fontSize: 40 }} />
                  {getTrendIcon(healthData.trends.spO2)}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Heart Rate Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Heart Rate Trend" 
              avatar={<Icon icon="material-symbols:favorite" style={{ color: '#f44336' }} width={24} />}
              action={
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>View</InputLabel>
                  <Select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                    label="View"
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="heartRate">Heart Rate</MenuItem>
                  </Select>
                </FormControl>
              }
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[50, 120]} />
                  <ChartTooltip />
                  <ReferenceLine y={NORMAL_RANGES.heartRate.min} stroke="#4caf50" strokeDasharray="2 2" />
                  <ReferenceLine y={NORMAL_RANGES.heartRate.max} stroke="#4caf50" strokeDasharray="2 2" />
                  <Area 
                    type="monotone" 
                    dataKey="heartRate" 
                    stroke="#f44336" 
                    fill="#f44336" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Blood Pressure Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Blood Pressure Trend" 
              avatar={<Icon icon="material-symbols:monitor-heart" style={{ color: '#2196f3' }} width={24} />}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[50, 180]} />
                  <ChartTooltip />
                  <Legend />
                  <ReferenceLine y={NORMAL_RANGES.systolic.max} stroke="#ff9800" strokeDasharray="2 2" />
                  <ReferenceLine y={NORMAL_RANGES.diastolic.max} stroke="#4caf50" strokeDasharray="2 2" />
                  <Line 
                    type="monotone" 
                    dataKey="systolic" 
                    stroke="#2196f3" 
                    strokeWidth={2}
                    dot={false}
                    name="Systolic"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="diastolic" 
                    stroke="#4caf50" 
                    strokeWidth={2}
                    dot={false}
                    name="Diastolic"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Temperature Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Body Temperature" 
              avatar={<Icon icon="material-symbols:device-thermostat" style={{ color: '#ff9800' }} width={24} />}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[96, 102]} />
                  <ChartTooltip />
                  <ReferenceLine y={NORMAL_RANGES.temperature.min} stroke="#4caf50" strokeDasharray="2 2" />
                  <ReferenceLine y={NORMAL_RANGES.temperature.max} stroke="#4caf50" strokeDasharray="2 2" />
                  <Area 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#ff9800" 
                    fill="#ff9800" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* SpO2 Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Oxygen Saturation (SpO2)" 
              avatar={<Icon icon="material-symbols:air" style={{ color: '#2196f3' }} width={24} />}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[90, 100]} />
                  <ChartTooltip />
                  <ReferenceLine y={NORMAL_RANGES.spO2.min} stroke="#f44336" strokeDasharray="2 2" />
                  <Area 
                    type="monotone" 
                    dataKey="spO2" 
                    stroke="#00bcd4" 
                    fill="#00bcd4" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Alerts */}
      {healthData.alerts.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardHeader 
            title="Recent Health Alerts"
            avatar={<Icon icon="material-symbols:warning" style={{ color: '#ff9800' }} width={24} />}
          />
          <CardContent>
            <Stack spacing={2}>
              {healthData.alerts.slice(0, 5).map((alert, index) => (
                <Alert 
                  key={index}
                  severity={alert.severity === 'critical' ? 'error' : 
                           alert.severity === 'high' ? 'warning' : 'info'}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2">{alert.type}</Typography>
                      <Typography variant="body2">{alert.message}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(alert.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                </Alert>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}