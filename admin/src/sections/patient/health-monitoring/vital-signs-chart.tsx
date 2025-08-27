import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Tab,
  Tabs,
  Grid,
  Typography,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Button,
  ButtonGroup
} from '@mui/material';
import { Icon } from '@iconify/react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { format } from 'date-fns';

interface VitalData {
  recordedAt: string;
  heartRate?: number;
  systolicBP?: number;
  diastolicBP?: number;
  spO2?: number;
  temperature?: number;
  respiratoryRate?: number;
}

interface VitalSignsChartProps {
  patientId?: string;
  data?: VitalData[];
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onPeriodChange?: (period: string) => void;
}

export function VitalSignsChart({
  patientId,
  data = [],
  loading = false,
  error,
  onRefresh,
  onPeriodChange
}: VitalSignsChartProps) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    onPeriodChange?.(period);
  };

  // Process data for charts
  const processChartData = (dataKey: string | string[]) => {
    if (!data || data.length === 0) return { categories: [], series: [] };

    const sortedData = [...data].sort((a, b) => 
      new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );

    const categories = sortedData.map(d => 
      format(new Date(d.recordedAt), 'MMM dd HH:mm')
    );

    if (Array.isArray(dataKey)) {
      // For blood pressure (systolic and diastolic)
      return {
        categories,
        series: dataKey.map(key => ({
          name: key === 'systolicBP' ? 'Systolic' : 'Diastolic',
          data: sortedData.map(d => d[key as keyof VitalData] || 0)
        }))
      };
    } else {
      // For single value charts
      return {
        categories,
        series: [{
          name: dataKey.charAt(0).toUpperCase() + dataKey.slice(1),
          data: sortedData.map(d => d[dataKey as keyof VitalData] || 0)
        }]
      };
    }
  };

  // Chart configurations for different vital signs
  const getChartOptions = (title: string, color: string | string[], yAxisTitle: string, min?: number, max?: number): ApexOptions => ({
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      },
      zoom: {
        enabled: true
      }
    },
    colors: Array.isArray(color) ? color : [color],
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    title: {
      text: title,
      align: 'left',
      style: {
        fontSize: '16px',
        fontWeight: 600
      }
    },
    grid: {
      borderColor: '#e7e7e7',
      row: {
        colors: ['#f3f3f3', 'transparent'],
        opacity: 0.5
      }
    },
    markers: {
      size: 4,
      hover: {
        size: 6
      }
    },
    xaxis: {
      title: {
        text: 'Date & Time'
      },
      labels: {
        rotate: -45,
        rotateAlways: true
      }
    },
    yaxis: {
      title: {
        text: yAxisTitle
      },
      min: min,
      max: max
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      floating: true,
      offsetY: -25,
      offsetX: -5
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val: number) => val ? `${val.toFixed(1)}` : 'N/A'
      }
    }
  });

  const charts = [
    {
      title: 'Heart Rate',
      icon: 'mdi:heart-pulse',
      color: '#FF4560',
      dataKey: 'heartRate',
      unit: 'BPM',
      normalRange: '60-100',
      yAxisTitle: 'Beats per Minute',
      min: 40,
      max: 140
    },
    {
      title: 'Blood Pressure',
      icon: 'mdi:blood-bag',
      color: ['#008FFB', '#00E396'],
      dataKey: ['systolicBP', 'diastolicBP'],
      unit: 'mmHg',
      normalRange: '120/80',
      yAxisTitle: 'mmHg',
      min: 60,
      max: 180
    },
    {
      title: 'Oxygen Saturation',
      icon: 'mdi:lungs',
      color: '#00E396',
      dataKey: 'spO2',
      unit: '%',
      normalRange: '95-100',
      yAxisTitle: 'Percentage (%)',
      min: 85,
      max: 100
    },
    {
      title: 'Temperature',
      icon: 'mdi:thermometer',
      color: '#FEB019',
      dataKey: 'temperature',
      unit: '°F',
      normalRange: '97-99',
      yAxisTitle: 'Temperature (°F)',
      min: 95,
      max: 104
    }
  ];

  const currentChart = charts[selectedTab];
  const chartData = processChartData(currentChart.dataKey);

  // Get latest value for the selected vital sign
  const getLatestValue = () => {
    if (!data || data.length === 0) return null;
    const latest = data[data.length - 1];
    
    if (Array.isArray(currentChart.dataKey)) {
      return `${latest.systolicBP || '--'}/${latest.diastolicBP || '--'}`;
    }
    return latest[currentChart.dataKey as keyof VitalData] || '--';
  };

  // Check if value is in normal range
  const isNormalValue = (value: any) => {
    if (!value || value === '--') return true;
    
    if (currentChart.title === 'Heart Rate') {
      return value >= 60 && value <= 100;
    } else if (currentChart.title === 'Oxygen Saturation') {
      return value >= 95;
    } else if (currentChart.title === 'Temperature') {
      return value >= 97 && value <= 99;
    } else if (currentChart.title === 'Blood Pressure') {
      const [systolic, diastolic] = value.split('/').map(Number);
      return systolic <= 120 && diastolic <= 80;
    }
    return true;
  };

  const latestValue = getLatestValue();
  const isNormal = isNormalValue(latestValue);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={onRefresh}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Vital Signs Monitoring"
        subheader="Real-time tracking of your vital health parameters"
        action={
          <Stack direction="row" spacing={2}>
            <ButtonGroup size="small" variant="outlined">
              <Button 
                variant={selectedPeriod === '24h' ? 'contained' : 'outlined'}
                onClick={() => handlePeriodChange('24h')}
              >
                24H
              </Button>
              <Button 
                variant={selectedPeriod === '7d' ? 'contained' : 'outlined'}
                onClick={() => handlePeriodChange('7d')}
              >
                7D
              </Button>
              <Button 
                variant={selectedPeriod === '30d' ? 'contained' : 'outlined'}
                onClick={() => handlePeriodChange('30d')}
              >
                30D
              </Button>
            </ButtonGroup>
            <Button
              startIcon={<Icon icon="mdi:refresh" />}
              onClick={onRefresh}
              variant="outlined"
            >
              Refresh
            </Button>
          </Stack>
        }
      />
      <CardContent>
        <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          {charts.map((chart, index) => (
            <Tab
              key={index}
              icon={<Icon icon={chart.icon} width={20} />}
              label={chart.title}
              iconPosition="start"
            />
          ))}
        </Tabs>

        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Current Value
              </Typography>
              <Typography variant="h3" color={isNormal ? 'success.main' : 'error.main'}>
                {latestValue || '--'}
                <Typography component="span" variant="subtitle1" sx={{ ml: 1 }}>
                  {currentChart.unit}
                </Typography>
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                <Icon 
                  icon={isNormal ? "mdi:check-circle" : "mdi:alert-circle"} 
                  color={isNormal ? '#00E396' : '#FF4560'}
                />
                <Typography variant="caption" color="text.secondary">
                  Normal Range: {currentChart.normalRange} {currentChart.unit}
                </Typography>
              </Stack>
            </Box>

            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.neutral', borderRadius: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Statistics
              </Typography>
              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Data Points:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {data.length}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Period:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {selectedPeriod === '24h' ? 'Last 24 Hours' : 
                     selectedPeriod === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                  </Typography>
                </Box>
                {data.length > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Last Updated:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {format(new Date(data[data.length - 1].recordedAt), 'HH:mm')}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          </Grid>

          <Grid item xs={12} md={9}>
            {data.length > 0 ? (
              <Chart
                options={getChartOptions(
                  currentChart.title,
                  currentChart.color,
                  currentChart.yAxisTitle,
                  currentChart.min,
                  currentChart.max
                )}
                series={chartData.series}
                type="line"
                height={350}
              />
            ) : (
              <Box 
                display="flex" 
                flexDirection="column" 
                alignItems="center" 
                justifyContent="center" 
                minHeight={350}
                sx={{ bgcolor: 'background.neutral', borderRadius: 2 }}
              >
                <Icon icon="mdi:chart-line" width={64} color="#999" />
                <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                  No Data Available
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Sensor data will appear here once your device starts transmitting
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}