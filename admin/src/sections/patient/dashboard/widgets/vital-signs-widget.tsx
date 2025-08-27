import { useState, useEffect } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

import { Iconify } from 'src/components/iconify';
import apiHelper from 'src/utils/apiHelper';

// ----------------------------------------------------------------------

interface VitalSign {
  id: string;
  name: string;
  value: number;
  unit: string;
  icon: string;
  color: 'success' | 'warning' | 'error' | 'info';
  normalRange: { min: number; max: number };
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

interface VitalSignsWidgetProps {
  patientId?: string;
  realTime?: boolean;
}

export function VitalSignsWidget({ patientId, realTime = true }: VitalSignsWidgetProps) {
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate time ago from timestamp
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - time.getTime()) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return `${Math.floor(diffMinutes / 1440)} days ago`;
  };

  // Calculate trend based on historical data
  const calculateTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
    const difference = current - previous;
    const threshold = current * 0.05; // 5% threshold for trend
    
    if (Math.abs(difference) < threshold) return 'stable';
    return difference > 0 ? 'up' : 'down';
  };

  // Fetch real vital signs data
  const fetchVitalSigns = async () => {
    if (!patientId) {
      setError('Patient ID is required to fetch vital signs');
      setVitalSigns([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch latest sensor data
      const response = await apiHelper.get(`/sensor/latest/${patientId}`);
      
      if (response.success && response.data) {
        const sensorData = response.data;
        
        // Transform API data to VitalSign format
        const vitals: VitalSign[] = [];
        
        // Blood Pressure
        if (sensorData.bloodPressure) {
          vitals.push({
            id: 'bp',
            name: 'Blood Pressure',
            value: sensorData.bloodPressure.systolic,
            unit: `/${sensorData.bloodPressure.diastolic} mmHg`,
            icon: 'solar:heart-bold',
            color: 'success',
            normalRange: { min: 90, max: 140 },
            trend: sensorData.bloodPressure.trend || 'stable',
            lastUpdated: getTimeAgo(sensorData.recordedAt)
          });
        }
        
        // Heart Rate
        if (sensorData.heartRate) {
          vitals.push({
            id: 'hr',
            name: 'Heart Rate',
            value: sensorData.heartRate.value,
            unit: ' bpm',
            icon: 'solar:pulse-bold',
            color: 'success',
            normalRange: { min: 60, max: 100 },
            trend: sensorData.heartRate.trend || 'stable',
            lastUpdated: getTimeAgo(sensorData.recordedAt)
          });
        }
        
        // Temperature
        if (sensorData.temperature) {
          vitals.push({
            id: 'temp',
            name: 'Temperature',
            value: sensorData.temperature.value,
            unit: '°F',
            icon: 'solar:thermometer-bold',
            color: 'success',
            normalRange: { min: 97, max: 99 },
            trend: sensorData.temperature.trend || 'stable',
            lastUpdated: getTimeAgo(sensorData.recordedAt)
          });
        }
        
        // SpO2
        if (sensorData.spO2) {
          vitals.push({
            id: 'spo2',
            name: 'Blood Oxygen',
            value: sensorData.spO2.value,
            unit: '%',
            icon: 'solar:lung-bold',
            color: 'success',
            normalRange: { min: 95, max: 100 },
            trend: sensorData.spO2.trend || 'stable',
            lastUpdated: getTimeAgo(sensorData.recordedAt)
          });
        }
        
        setVitalSigns(vitals);
        setIsConnected(true);
      }
    } catch (err: any) {
      console.error('Error fetching vital signs:', err);
      setError(err.message || 'Failed to fetch vital signs');
      setIsConnected(false);
      setVitalSigns([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchVitalSigns();
  }, [patientId]);

  // Real-time updates
  useEffect(() => {
    if (!realTime) return;

    // Fetch data every 30 seconds
    const interval = setInterval(() => {
      fetchVitalSigns();
    }, 30000);

    return () => clearInterval(interval);
  }, [realTime, patientId]);

  const getVitalStatus = (vital: VitalSign): 'success' | 'warning' | 'error' => {
    if (vital.value < vital.normalRange.min || vital.value > vital.normalRange.max) {
      return 'error';
    }
    if (vital.value < vital.normalRange.min * 1.1 || vital.value > vital.normalRange.max * 0.9) {
      return 'warning';
    }
    return 'success';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'solar:arrow-up-bold';
      case 'down':
        return 'solar:arrow-down-bold';
      default:
        return 'solar:minus-bold';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'success.main';
      case 'down':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Vital Signs
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={isConnected ? 'Live' : 'Disconnected'}
              color={isConnected ? 'success' : 'error'}
              size="small"
              icon={<Iconify icon={isConnected ? 'solar:wifi-router-bold' : 'solar:wifi-router-minimalistic-bold'} />}
            />
            <Tooltip title="Refresh Data">
              <IconButton size="small" onClick={fetchVitalSigns} disabled={loading}>
                <Iconify icon="solar:refresh-bold" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {loading && vitalSigns.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error && vitalSigns.length === 0 ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Unable to fetch vital signs data. Please check your connection.
          </Alert>
        ) : null}

        <Grid container spacing={2}>
          {vitalSigns.map((vital) => {
            const status = getVitalStatus(vital);
            return (
              <Grid item xs={6} sm={3} key={vital.id}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.neutral',
                    textAlign: 'center',
                    position: 'relative',
                    border: '2px solid',
                    borderColor: status === 'error' ? 'error.light' : 
                                status === 'warning' ? 'warning.light' : 
                                'success.light'
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: `${status}.main`,
                      width: 48,
                      height: 48,
                      mx: 'auto',
                      mb: 1
                    }}
                  >
                    <Iconify icon={vital.icon} width={24} />
                  </Avatar>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    <Typography variant="h6">
                      {Math.round(vital.value * 10) / 10}
                    </Typography>
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{ color: 'text.secondary', ml: 0.5 }}
                    >
                      {vital.unit}
                    </Typography>
                    <Iconify 
                      icon={getTrendIcon(vital.trend)}
                      sx={{ 
                        ml: 0.5, 
                        fontSize: 16, 
                        color: getTrendColor(vital.trend)
                      }}
                    />
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    {vital.name}
                  </Typography>

                  {/* Normal range indicator */}
                  <Box sx={{ mb: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={
                        ((vital.value - vital.normalRange.min) / 
                         (vital.normalRange.max - vital.normalRange.min)) * 100
                      }
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: 'grey.300',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: `${status}.main`
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Normal: {vital.normalRange.min}-{vital.normalRange.max}
                    </Typography>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Updated {vital.lastUpdated}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
}