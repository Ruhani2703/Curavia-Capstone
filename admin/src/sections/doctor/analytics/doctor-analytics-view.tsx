import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Paper,
  Stack,
  Avatar,
  Chip,
  LinearProgress,
  Alert
} from '@mui/material';
import { Icon } from '@iconify/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

import { DashboardContent } from 'src/layouts/dashboard';
import apiHelper from 'src/utils/apiHelper';

// ----------------------------------------------------------------------

interface PatientMetric {
  patientId: string;
  patientName: string;
  vitals: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    spO2: number;
  };
  lastUpdate: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  adherence: number;
}

interface AnalyticsData {
  totalPatients: number;
  activeMonitoring: number;
  criticalAlerts: number;
  averageRecovery: number;
  patientMetrics: PatientMetric[];
  vitalsTrends: any[];
  alertSummary: any[];
}

export function DoctorAnalyticsView() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalPatients: 0,
    activeMonitoring: 0,
    criticalAlerts: 0,
    averageRecovery: 0,
    patientMetrics: [],
    vitalsTrends: [],
    alertSummary: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'heartRate' | 'bloodPressure' | 'temperature' | 'spO2'>('heartRate');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from doctor-specific analytics endpoint
      // For now, we'll use mock data
      const mockData: AnalyticsData = {
        totalPatients: 12,
        activeMonitoring: 9,
        criticalAlerts: 2,
        averageRecovery: 73,
        patientMetrics: [
          {
            patientId: 'CRV-2024-001',
            patientName: 'John Smith',
            vitals: { heartRate: 78, bloodPressure: '120/80', temperature: 98.6, spO2: 97 },
            lastUpdate: '2 min ago',
            riskLevel: 'Low',
            adherence: 95
          },
          {
            patientId: 'CRV-2024-002',
            patientName: 'Emily Davis',
            vitals: { heartRate: 88, bloodPressure: '135/85', temperature: 99.1, spO2: 95 },
            lastUpdate: '5 min ago',
            riskLevel: 'Medium',
            adherence: 87
          },
          {
            patientId: 'CRV-2024-003',
            patientName: 'Robert Wilson',
            vitals: { heartRate: 95, bloodPressure: '145/90', temperature: 100.2, spO2: 92 },
            lastUpdate: '1 min ago',
            riskLevel: 'High',
            adherence: 78
          }
        ],
        vitalsTrends: [
          { time: '00:00', heartRate: 72, bloodPressure: 120, temperature: 98.4, spO2: 98 },
          { time: '04:00', heartRate: 68, bloodPressure: 118, temperature: 98.2, spO2: 97 },
          { time: '08:00', heartRate: 75, bloodPressure: 122, temperature: 98.6, spO2: 98 },
          { time: '12:00', heartRate: 82, bloodPressure: 125, temperature: 98.8, spO2: 96 },
          { time: '16:00', heartRate: 79, bloodPressure: 121, temperature: 98.5, spO2: 97 },
          { time: '20:00', heartRate: 73, bloodPressure: 119, temperature: 98.3, spO2: 98 }
        ],
        alertSummary: [
          { name: 'Critical', value: 2, color: '#f44336' },
          { name: 'Warning', value: 5, color: '#ff9800' },
          { name: 'Normal', value: 5, color: '#4caf50' }
        ]
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'heartRate': return 'Heart Rate (BPM)';
      case 'bloodPressure': return 'Blood Pressure (mmHg)';
      case 'temperature': return 'Temperature (°F)';
      case 'spO2': return 'SpO2 (%)';
      default: return metric;
    }
  };

  if (loading) {
    return (
      <DashboardContent maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography variant="h6">Loading analytics data...</Typography>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Patient Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor your patients' health metrics, recovery progress, and alert status
        </Typography>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <Icon icon="solar:users-group-rounded-bold" width={24} />
                </Avatar>
                <Box>
                  <Typography variant="h3" color="primary.main">
                    {analyticsData.totalPatients}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Patients
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                  <Icon icon="solar:heart-pulse-bold" width={24} />
                </Avatar>
                <Box>
                  <Typography variant="h3" color="success.main">
                    {analyticsData.activeMonitoring}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Monitoring
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'error.main', width: 56, height: 56 }}>
                  <Icon icon="solar:danger-triangle-bold" width={24} />
                </Avatar>
                <Box>
                  <Typography variant="h3" color="error.main">
                    {analyticsData.criticalAlerts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Critical Alerts
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                  <Icon icon="solar:chart-square-bold" width={24} />
                </Avatar>
                <Box>
                  <Typography variant="h3" color="info.main">
                    {analyticsData.averageRecovery}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Recovery
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Vitals Trends Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="Patient Vitals Trends"
              subheader="Average vitals across all patients over 24 hours"
              action={
                <Stack direction="row" spacing={1}>
                  {['heartRate', 'bloodPressure', 'temperature', 'spO2'].map((metric) => (
                    <Chip
                      key={metric}
                      label={getMetricLabel(metric)}
                      variant={selectedMetric === metric ? 'filled' : 'outlined'}
                      color={selectedMetric === metric ? 'primary' : 'default'}
                      onClick={() => setSelectedMetric(metric as any)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Stack>
              }
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.vitalsTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey={selectedMetric} 
                    stroke="#1976d2" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Alert Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Alert Distribution" subheader="Current patient risk levels" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.alertSummary}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {analyticsData.alertSummary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Patient Status Table */}
      <Card>
        <CardHeader
          title="Patient Status Overview"
          subheader={`${analyticsData.patientMetrics.length} patients under your care`}
        />
        <CardContent>
          <Grid container spacing={2}>
            {analyticsData.patientMetrics.map((patient) => (
              <Grid item xs={12} md={6} lg={4} key={patient.patientId}>
                <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
                  <Stack spacing={2}>
                    {/* Patient Header */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {patient.patientName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {patient.patientId}
                        </Typography>
                      </Box>
                      <Chip
                        label={patient.riskLevel}
                        color={getRiskColor(patient.riskLevel) as any}
                        size="small"
                      />
                    </Stack>

                    {/* Vitals */}
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Latest Vitals
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption">Heart Rate</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {patient.vitals.heartRate} BPM
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption">Blood Pressure</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {patient.vitals.bloodPressure}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption">Temperature</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {patient.vitals.temperature}°F
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption">SpO2</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {patient.vitals.spO2}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Adherence */}
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Medication Adherence
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {patient.adherence}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={patient.adherence}
                        color={patient.adherence >= 90 ? 'success' : patient.adherence >= 70 ? 'warning' : 'error'}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>

                    {/* Last Update */}
                    <Typography variant="caption" color="text.secondary">
                      Last updated: {patient.lastUpdate}
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {analyticsData.criticalAlerts > 0 && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="subtitle2">
            {analyticsData.criticalAlerts} patient(s) require immediate attention
          </Typography>
          <Typography variant="body2">
            Check the high-risk patients above and consider immediate intervention.
          </Typography>
        </Alert>
      )}
    </DashboardContent>
  );
}