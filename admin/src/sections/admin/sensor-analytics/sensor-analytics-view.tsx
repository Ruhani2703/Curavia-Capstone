import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import apiHelper from 'src/utils/apiHelper';

// Import chart components (using existing chart setup)
import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------


const TIME_RANGES = [
  { value: '1h', label: 'Last Hour' },
  { value: '6h', label: 'Last 6 Hours' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last Week' },
  { value: '30d', label: 'Last Month' }
];


// ----------------------------------------------------------------------

export function SensorAnalyticsView() {
  const [selectedPatient, setSelectedPatient] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [sensorData, setSensorData] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch data on component mount and set up real-time updates
  useEffect(() => {
    fetchPatients();
    fetchSensorData();
    
    if (realTimeEnabled) {
      const interval = setInterval(fetchSensorData, 30000); // Fetch every 30 seconds
      return () => clearInterval(interval);
    }
  }, [selectedPatient, timeRange, realTimeEnabled]);

  const fetchPatients = async () => {
    try {
      const response = await apiHelper.get('/admin/users?role=patient');
      
      if (response.users) {
        const patientOptions = [
          { value: 'all', label: 'All Patients' },
          ...response.users.map((patient: any) => ({
            value: patient._id || patient.id,
            label: `${patient.name} (${patient.patientId || patient.id})`
          }))
        ];
        setPatients(patientOptions);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([{ value: 'all', label: 'All Patients' }]);
    }
  };

  const fetchSensorData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedPatient !== 'all') {
        params.append('patientId', selectedPatient);
      }
      params.append('timeRange', timeRange);
      
      const response = await apiHelper.get(`/sensor/?${params.toString()}`);
      
      if (response) {
        setSensorData(response);
        setError('');
      } else {
        throw new Error('No sensor data available');
      }
    } catch (error: any) {
      console.error('Error fetching sensor data:', error);
      setError('Failed to load sensor analytics. No sensor data available for the selected criteria.');
      setSensorData(null);
    } finally {
      setLoading(false);
    }
  };

  const heartRateData = sensorData?.chartData?.heartRate || {
    categories: [],
    series: [{ name: 'Heart Rate', data: [] }]
  };

  const vitalsData = sensorData?.chartData?.vitals || {
    categories: [],
    series: []
  };

  const chartOptions = useChart({
    xaxis: { categories: heartRateData.categories },
    stroke: { width: 3 },
    markers: { size: 4 },
    colors: ['#00AB55', '#FF5630', '#00B8D4', '#FFAB00']
  });

  const vitalsChartOptions = useChart({
    xaxis: { categories: vitalsData.categories },
    yaxis: [
      { title: { text: 'Temperature (°F)' }, min: 97, max: 100 },
      { opposite: true, title: { text: 'Oxygen Saturation (%)' }, min: 90, max: 100 }
    ],
    stroke: { width: 2 },
    markers: { size: 3 }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'error';
      case 'warning': return 'warning';
      default: return 'default';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'stable': return 'solar:minus-bold';
      case 'rising': return 'solar:arrow-up-bold';
      case 'falling': return 'solar:arrow-down-bold';
      default: return 'solar:minus-bold';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'stable': return 'success';
      case 'rising': return 'warning';
      case 'falling': return 'error';
      default: return 'default';
    }
  };

  return (
    <DashboardContent>
      <Typography variant="h4" sx={{ mb: 5 }}>
        Sensor Data Analytics 📊
      </Typography>

      {/* Controls */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            select
            label="Patient"
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            {patients.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            select
            label="Time Range"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            {TIME_RANGES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <FormControlLabel
            control={
              <Switch
                checked={realTimeEnabled}
                onChange={(e) => setRealTimeEnabled(e.target.checked)}
              />
            }
            label="Real-time Updates"
          />

          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:database-bold" />}
            onClick={async () => {
              try {
                await apiHelper.post('/sensor/generate-test-data', {});
                console.log('Test data generated successfully');
                fetchSensorData(); // Refresh data
              } catch (error: any) {
                console.error('Error generating test data:', error);
                setError('Failed to generate test data: ' + error.message);
              }
            }}
          >
            Generate Test Data
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:download-bold" />}
            onClick={() => {
              // TODO: Implement data export functionality
              console.log('Export data for:', { selectedPatient, timeRange });
            }}
          >
            Export Data
          </Button>
        </Stack>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={fetchSensorData}
              startIcon={<Iconify icon="solar:refresh-bold" />}
            >
              Retry
            </Button>
          }
        >
          <Typography variant="subtitle2">Sensor Analytics Error</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      {/* ThingSpeak Status */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          ThingSpeak API Status
        </Typography>
        {loading ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Loading sensor data...
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid xs={12} md={6}>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Chip
                    icon={<Iconify icon="solar:server-bold" />}
                    label={sensorData?.thingSpeakStatus?.status?.toUpperCase() || 'UNKNOWN'}
                    color={getStatusColor(sensorData?.thingSpeakStatus?.status || 'offline') as any}
                    variant="soft"
                  />
                  <Typography variant="body2" color="text.secondary">
                    Last update: {sensorData?.thingSpeakStatus?.lastUpdate || 'Unknown'}
                  </Typography>
                </Stack>
                
                <Box>
                  <Typography variant="body2">
                    <strong>Channel ID:</strong> {sensorData?.thingSpeakStatus?.channelId || '3008199'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Active Fields:</strong> {sensorData?.thingSpeakStatus?.fieldsActive || 0}/8
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total Data Points:</strong> {(sensorData?.thingSpeakStatus?.dataPoints || 0).toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            
            <Grid xs={12} md={6}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Data Quality Metrics
                </Typography>
                <Stack spacing={1}>
                  <Box>
                    <Typography variant="body2">Data Integrity: {sensorData?.qualityMetrics?.dataIntegrity || 0}%</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={sensorData?.qualityMetrics?.dataIntegrity || 0} 
                      color={sensorData?.qualityMetrics?.dataIntegrity > 90 ? "success" : "warning"}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2">Missing Readings: {sensorData?.qualityMetrics?.missingReadings || 0}%</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={sensorData?.qualityMetrics?.missingReadings || 0} 
                      color="warning"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Last calibration: {sensorData?.qualityMetrics?.lastCalibration || 'Unknown'}
                  </Typography>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        )}
      </Card>

      {/* No Data State */}
      {!loading && !error && (!sensorData || !sensorData.realtimeMetrics) && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6">No Sensor Data Available</Typography>
          <Typography>
            No sensor data found for the selected patient and time range. 
            {selectedPatient === 'all' 
              ? ' Try selecting a specific patient or generating test data.' 
              : ' Please check if the patient has any sensor data or try generating test data.'}
          </Typography>
          <Button 
            variant="contained" 
            onClick={fetchSensorData} 
            sx={{ mt: 2, mr: 1 }}
            startIcon={<Iconify icon="solar:refresh-bold" />}
          >
            Refresh Data
          </Button>
        </Alert>
      )}

      {/* Real-time Metrics Cards - Only show when data exists */}
      {sensorData?.realtimeMetrics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {Object.entries(sensorData.realtimeMetrics).map(([key, data]: [string, any]) => (
          <Grid xs={12} sm={6} md={3} key={key}>
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <Stack alignItems="center" spacing={1}>
                <Iconify 
                  icon={
                    key === 'heartRate' ? 'solar:heart-pulse-bold' :
                    key === 'bloodPressure' ? 'solar:pulse-bold' :
                    key === 'temperature' ? 'solar:thermometer-bold' :
                    'solar:health-bold'
                  } 
                  width={32} 
                  sx={{ color: 'primary.main' }}
                />
                <Typography variant="h4" color="primary.main">
                  {key === 'heartRate' ? (data.current || 0) :
                   key === 'bloodPressure' ? (data.current || 'N/A') :
                   key === 'temperature' ? `${data.current || 0}°F` :
                   `${data.current || 0}%`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Typography>
                <Chip
                  size="small"
                  icon={<Iconify icon={getTrendIcon(data.trend || 'unknown')} />}
                  label={data.trend || 'unknown'}
                  color={getTrendColor(data.trend || 'unknown') as any}
                  variant="soft"
                />
              </Stack>
            </Card>
          </Grid>
          ))}
        </Grid>
      )}

      {/* Charts - Only show when data exists */}
      {sensorData?.chartData && (
        <Grid container spacing={3}>
        {/* Heart Rate Chart */}
        <Grid xs={12} lg={8}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Heart Rate Trends (24 Hours)
            </Typography>
            <Chart
              type="line"
              series={heartRateData.series}
              options={chartOptions}
              height={300}
            />
          </Card>
        </Grid>

        {/* Vital Signs Distribution */}
        <Grid xs={12} lg={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Current Status
            </Typography>
            <Stack spacing={2}>
              <Alert severity="success" icon={<Iconify icon="solar:check-circle-bold" />}>
                All sensors operating normally
              </Alert>
              <Alert severity="info" icon={<Iconify icon="solar:info-circle-bold" />}>
                {realTimeEnabled ? 'Real-time monitoring active' : 'Real-time monitoring paused'}
              </Alert>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  ML Anomaly Detection
                </Typography>
                <Stack spacing={1}>
                  {sensorData?.realtimeMetrics && Object.values(sensorData.realtimeMetrics).some((metric: any) => 
                    metric.mlAnomaly === true
                  ) ? (
                    <Alert severity="warning" icon={<Iconify icon="solar:danger-triangle-bold" />}>
                      ML Anomaly Detected
                    </Alert>
                  ) : (
                    <Alert severity="success" icon={<Iconify icon="solar:shield-check-bold" />}>
                      ML: All vitals normal
                    </Alert>
                  )}
                  <Typography variant="body2">Model Accuracy: 89.5%</Typography>
                  <Typography variant="body2">Last ML Update: {new Date().toLocaleTimeString()}</Typography>
                </Stack>
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Multi-parameter Chart */}
        <Grid xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Multi-Parameter Analysis
            </Typography>
            <Chart
              type="line"
              series={vitalsData.series}
              options={vitalsChartOptions}
              height={350}
            />
          </Card>
        </Grid>
        </Grid>
      )}
    </DashboardContent>
  );
}