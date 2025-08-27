import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { Chart } from 'src/components/chart';
import apiHelper from 'src/utils/apiHelper';

// ----------------------------------------------------------------------

interface PatientData {
  patient: {
    patientId: string;
    name: string;
    bandId: string;
    surgeryType: string;
    channelId: string;
  };
  deviceStatus: 'online' | 'warning' | 'offline';
  dataAvailable: boolean;
  dataSource: 'real-time' | 'latest-available' | 'demo-data';
  currentValues: {
    heartRate: number;
    bloodPressureSystolic: number;
    bloodPressureDiastolic: number;
    temperature: number;
    spO2: number;
    movement: number;
    fallDetection: number;
    batteryLevel: number;
    ecgReading: number;
    lastUpdate: Date;
  };
  historicalData: Array<{
    timestamp: Date;
    heartRate: number;
    bloodPressureSystolic: number;
    bloodPressureDiastolic: number;
    temperature: number;
    spO2: number;
    movement: number;
    batteryLevel: number;
    ecgReading: number;
  }>;
  channelInfo: any;
  lastUpdated: string;
}

export function LiveMonitorView() {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [addDataLoading, setAddDataLoading] = useState(false);

  // Setup demo patient (John Smith)
  const setupDemoPatient = async () => {
    setSetupLoading(true);
    setError('');
    try {
      console.log('🚀 Setting up demo patient...');
      const response = await apiHelper.post('/thingspeak/setup-demo-patient');
      
      console.log('📋 Setup response:', response);
      
      if (response.success) {
        setError('✅ Demo patient created successfully! Fetching data...');
        // After setup, fetch the live data
        setTimeout(async () => {
          await fetchPatientData('DEMO001');
        }, 1000);
      } else {
        setError(response.message || 'Failed to setup demo patient');
      }
    } catch (err: any) {
      console.error('❌ Setup error:', err);
      setError(err.message || 'Error setting up demo patient');
    } finally {
      setSetupLoading(false);
    }
  };

  // Fetch live data for specific patient
  const fetchPatientData = async (patientId: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiHelper.get(`/thingspeak/patient/${patientId}/live-data?results=50`);
      
      if (response.success && response.data) {
        setPatientData(response.data);
        
        // Clear any previous errors and set appropriate status messages
        if (!response.data.dataAvailable) {
          setError('No data available from ThingSpeak channel');
        } else if (response.data.dataSource === 'latest-available') {
          // Show info message for latest available data (not an error)
          const lastUpdateTime = new Date(response.data.currentValues.lastUpdate).toLocaleString();
          setError(`Showing latest available data from ${lastUpdateTime}`);
        } else if (response.data.dataSource === 'demo-data') {
          // Show info message for demo data
          setError(`📊 Showing demo data - your ThingSpeak channel has no entries yet. Add sample data using the write API or connect a real device.`);
        } else {
          setError(''); // Clear any previous messages for real-time data
        }
      } else {
        setError(response.message || 'Failed to fetch patient data');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching patient data');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && patientData) {
      const interval = setInterval(() => {
        fetchPatientData('DEMO001');
      }, 10000); // Refresh every 10 seconds
      
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh, patientData]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [refreshInterval]);

  // Test ThingSpeak connection directly
  const testThingSpeakConnection = async () => {
    setTestLoading(true);
    setError('');
    try {
      console.log('🧪 Testing ThingSpeak connection...');
      const response = await apiHelper.get('/thingspeak/test-connection');
      
      console.log('📊 Test response:', response);
      
      if (response.success) {
        const { data } = response;
        if (data.feeds.success && data.feeds.feedCount > 0) {
          setError(`✅ ThingSpeak connection successful! Found ${data.feeds.feedCount} data entries. Latest data: ${new Date(data.feeds.latestFeed.created_at).toLocaleString()}`);
        } else if (data.channelInfo.success) {
          setError(`⚠️ Channel found but no data available. Channel: ${data.channelId}`);
        } else {
          setError(`❌ Cannot access ThingSpeak channel. Error: ${data.channelInfo.error || 'Unknown error'}`);
        }
      } else {
        setError(response.message || 'Failed to test ThingSpeak connection');
      }
    } catch (err: any) {
      console.error('❌ Test error:', err);
      setError(err.message || 'Error testing ThingSpeak connection');
    } finally {
      setTestLoading(false);
    }
  };

  // Add sample data to ThingSpeak
  const addSampleData = async () => {
    setAddDataLoading(true);
    setError('');
    try {
      console.log('📝 Adding sample data to ThingSpeak...');
      
      // Generate sample vital signs
      const sampleData = {
        field1: Math.floor(Math.random() * 20) + 70, // Heart Rate: 70-90
        field2: Math.floor(Math.random() * 20) + 110, // BP Systolic: 110-130
        field3: Math.floor(Math.random() * 10) + 75, // BP Diastolic: 75-85
        field4: (Math.random() * 2 + 97.5).toFixed(1), // Temperature: 97.5-99.5°F
        field5: Math.floor(Math.random() * 5) + 96, // SpO2: 96-100%
        field6: Math.floor(Math.random() * 3), // Movement: 0-2
        field7: 0, // Fall Detection: 0 (no fall)
        field8: Math.floor(Math.random() * 20) + 80 // Battery: 80-100%
      };

      const params = new URLSearchParams({
        api_key: '70RNO01F3YVMOCZ6',
        ...sampleData
      });

      const response = await fetch(`https://api.thingspeak.com/update?${params}`);
      const result = await response.text();
      
      if (result && result !== '0') {
        setError(`✅ Sample data added successfully! Entry ID: ${result}. Refreshing in 3 seconds...`);
        setTimeout(() => {
          fetchPatientData('DEMO001');
        }, 3000);
      } else {
        setError('❌ Failed to add sample data. Check your write API key.');
      }
    } catch (err: any) {
      console.error('❌ Add data error:', err);
      setError(err.message || 'Error adding sample data');
    } finally {
      setAddDataLoading(false);
    }
  };

  // Helper functions
  const getDeviceStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success';
      case 'warning': return 'warning';
      case 'offline': return 'error';
      default: return 'default';
    }
  };

  const getVitalStatus = (vital: string, value: number) => {
    const thresholds = {
      heartRate: { normal: [60, 100], warning: [50, 120] },
      temperature: { normal: [97, 99.5], warning: [95, 101] },
      spO2: { normal: [95, 100], warning: [90, 94] },
      bloodPressureSystolic: { normal: [90, 140], warning: [80, 160] },
      bloodPressureDiastolic: { normal: [60, 90], warning: [50, 100] }
    };

    const threshold = thresholds[vital as keyof typeof thresholds];
    if (!threshold) return 'default';

    if (value >= threshold.normal[0] && value <= threshold.normal[1]) return 'success';
    if (value >= threshold.warning[0] && value <= threshold.warning[1]) return 'warning';
    return 'error';
  };

  // Chart configuration
  const getChartOptions = (title: string, color: string) => ({
    chart: {
      type: 'line',
      height: 200,
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    colors: [color],
    title: {
      text: title,
      style: { fontSize: '14px', fontWeight: 600 }
    },
    xaxis: {
      type: 'datetime',
      labels: {
        format: 'HH:mm'
      }
    },
    yaxis: {
      title: {
        text: title
      }
    },
    grid: {
      show: true,
      borderColor: '#e0e0e0'
    },
    tooltip: {
      x: {
        format: 'dd/MM/yy HH:mm'
      }
    }
  });

  return (
    <DashboardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
        <Typography variant="h4">
          Live Patient Monitor 📡
        </Typography>
        
        {patientData && (
          <Stack direction="row" spacing={2}>
            <Button
              variant={autoRefresh ? 'contained' : 'outlined'}
              startIcon={<Iconify icon={autoRefresh ? 'solar:pause-bold' : 'solar:play-bold'} />}
              onClick={() => setAutoRefresh(!autoRefresh)}
              color={autoRefresh ? 'success' : 'primary'}
            >
              {autoRefresh ? 'Auto Refreshing' : 'Start Auto Refresh'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:refresh-bold" />}
              onClick={() => fetchPatientData('DEMO001')}
              disabled={loading}
            >
              Refresh Now
            </Button>
          </Stack>
        )}
      </Stack>

      {error && (
        <Alert 
          severity={
            error.includes('latest available data') ? 'info' : 
            error.includes('No data available') ? 'warning' : 'error'
          } 
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {!patientData && !loading && (
        <Card sx={{ p: 5, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Patient Data Loaded
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Setup John Smith as a demo patient with your ThingSpeak channel to view real-time data
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
            <Button
              variant="contained"
              size="large"
              startIcon={<Iconify icon="solar:user-plus-bold" />}
              onClick={setupDemoPatient}
              disabled={setupLoading || testLoading || addDataLoading}
            >
              {setupLoading ? 'Setting up...' : 'Setup Demo Patient (John Smith)'}
            </Button>
            
            <Button
              variant="outlined"
              size="large" 
              color="primary"
              startIcon={<Iconify icon="solar:pulse-2-bold" />}
              onClick={testThingSpeakConnection}
              disabled={testLoading || setupLoading || addDataLoading}
            >
              {testLoading ? 'Testing...' : 'Test ThingSpeak Connection'}
            </Button>
            
            <Button
              variant="contained"
              size="large" 
              color="success"
              startIcon={<Iconify icon="solar:database-bold" />}
              onClick={addSampleData}
              disabled={addDataLoading || setupLoading || testLoading}
            >
              {addDataLoading ? 'Adding Data...' : 'Add Sample Data'}
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              startIcon={<Iconify icon="solar:satellite-bold" />}
              onClick={() => window.open(`https://thingspeak.com/channels/3008199`, '_blank')}
            >
              View ThingSpeak Channel
            </Button>
          </Stack>
        </Card>
      )}

      {loading && !patientData && (
        <Card sx={{ p: 5, textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="body1">Loading patient data...</Typography>
        </Card>
      )}

      {patientData && (
        <>
          {/* Patient Header Card */}
          <Card sx={{ p: 3, mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={3}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                {patientData.patient.name.charAt(0)}
              </Avatar>
              
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">{patientData.patient.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Patient ID: {patientData.patient.patientId} • Band: {patientData.patient.bandId}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Surgery: {patientData.patient.surgeryType} • Channel: {patientData.patient.channelId}
                </Typography>
              </Box>

              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <Chip
                  label={`Device ${patientData.deviceStatus}`}
                  color={getDeviceStatusColor(patientData.deviceStatus) as any}
                  icon={<Iconify icon="solar:wifi-router-bold" />}
                />
                
                <Chip
                  label={
                    patientData.dataSource === 'real-time' ? 'Real-time Data' : 
                    patientData.dataSource === 'latest-available' ? 'Latest Available' : 'Demo Data'
                  }
                  color={
                    patientData.dataSource === 'real-time' ? 'success' : 
                    patientData.dataSource === 'latest-available' ? 'info' : 'warning'
                  }
                  icon={<Iconify icon={
                    patientData.dataSource === 'real-time' ? 'solar:play-circle-bold' : 
                    patientData.dataSource === 'latest-available' ? 'solar:history-bold' : 'solar:test-tube-bold'
                  } />}
                />
                
                <Chip
                  label={`Battery: ${Math.round(patientData.currentValues.batteryLevel || 0)}%`}
                  color={patientData.currentValues.batteryLevel > 20 ? 'success' : 'error'}
                  icon={<Iconify icon="solar:battery-bold" />}
                />
                
                <Typography variant="caption" color="text.secondary">
                  Last update: {new Date(patientData.currentValues.lastUpdate).toLocaleTimeString()}
                </Typography>
              </Stack>
            </Stack>
          </Card>

          {/* Current Vitals Grid */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Iconify icon="solar:heart-bold" width={40} color="error.main" />
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {Math.round(patientData.currentValues.heartRate || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Heart Rate (bpm)
                </Typography>
                <Chip
                  size="small"
                  label={getVitalStatus('heartRate', patientData.currentValues.heartRate) === 'success' ? 'Normal' : 'Alert'}
                  color={getVitalStatus('heartRate', patientData.currentValues.heartRate) as any}
                  sx={{ mt: 1 }}
                />
              </Paper>
            </Grid>

            <Grid xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Iconify icon="solar:pulse-2-bold" width={40} color="primary.main" />
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {Math.round(patientData.currentValues.bloodPressureSystolic || 0)}/{Math.round(patientData.currentValues.bloodPressureDiastolic || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Blood Pressure (mmHg)
                </Typography>
                <Chip
                  size="small"
                  label={getVitalStatus('bloodPressureSystolic', patientData.currentValues.bloodPressureSystolic) === 'success' ? 'Normal' : 'Alert'}
                  color={getVitalStatus('bloodPressureSystolic', patientData.currentValues.bloodPressureSystolic) as any}
                  sx={{ mt: 1 }}
                />
              </Paper>
            </Grid>

            <Grid xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Iconify icon="solar:thermometer-bold" width={40} color="warning.main" />
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {patientData.currentValues.temperature ? patientData.currentValues.temperature.toFixed(1) : 'N/A'}°F
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Temperature
                </Typography>
                <Chip
                  size="small"
                  label={getVitalStatus('temperature', patientData.currentValues.temperature) === 'success' ? 'Normal' : 'Alert'}
                  color={getVitalStatus('temperature', patientData.currentValues.temperature) as any}
                  sx={{ mt: 1 }}
                />
              </Paper>
            </Grid>

            <Grid xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Iconify icon="solar:lungs-bold" width={40} color="info.main" />
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {Math.round(patientData.currentValues.spO2 || 0)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Blood Oxygen (SpO2)
                </Typography>
                <Chip
                  size="small"
                  label={getVitalStatus('spO2', patientData.currentValues.spO2) === 'success' ? 'Normal' : 'Alert'}
                  color={getVitalStatus('spO2', patientData.currentValues.spO2) as any}
                  sx={{ mt: 1 }}
                />
              </Paper>
            </Grid>
          </Grid>

          {/* Real-time Charts */}
          <Grid container spacing={3}>
            <Grid xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <Chart
                  type="line"
                  series={[{
                    name: 'Heart Rate',
                    data: (patientData.historicalData || []).map(d => ({
                      x: new Date(d.timestamp).getTime(),
                      y: d.heartRate || 0
                    }))
                  }]}
                  options={getChartOptions('Heart Rate (bpm)', '#FF5722')}
                  height={300}
                />
              </Card>
            </Grid>

            <Grid xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <Chart
                  type="line"
                  series={[
                    {
                      name: 'Systolic',
                      data: (patientData.historicalData || []).map(d => ({
                        x: new Date(d.timestamp).getTime(),
                        y: d.bloodPressureSystolic || 0
                      }))
                    },
                    {
                      name: 'Diastolic',
                      data: (patientData.historicalData || []).map(d => ({
                        x: new Date(d.timestamp).getTime(),
                        y: d.bloodPressureDiastolic || 0
                      }))
                    }
                  ]}
                  options={{
                    ...getChartOptions('Blood Pressure (mmHg)', '#2196F3'),
                    colors: ['#2196F3', '#FF9800']
                  }}
                  height={300}
                />
              </Card>
            </Grid>

            <Grid xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <Chart
                  type="line"
                  series={[{
                    name: 'Temperature',
                    data: (patientData.historicalData || []).map(d => ({
                      x: new Date(d.timestamp).getTime(),
                      y: d.temperature || 0
                    }))
                  }]}
                  options={getChartOptions('Temperature (°F)', '#FF9800')}
                  height={300}
                />
              </Card>
            </Grid>

            <Grid xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <Chart
                  type="line"
                  series={[{
                    name: 'SpO2',
                    data: (patientData.historicalData || []).map(d => ({
                      x: new Date(d.timestamp).getTime(),
                      y: d.spO2 || 0
                    }))
                  }]}
                  options={getChartOptions('Blood Oxygen (%)', '#4CAF50')}
                  height={300}
                />
              </Card>
            </Grid>
          </Grid>

          {loading && (
            <LinearProgress sx={{ mt: 2 }} />
          )}
        </>
      )}
    </DashboardContent>
  );
}