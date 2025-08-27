import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

export function MLDashboardView() {
  const [loading, setLoading] = useState(true);
  const [mlStats, setMlStats] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientAnalysis, setPatientAnalysis] = useState<any>(null);

  useEffect(() => {
    fetchMLStats();
    fetchAnomalies();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMLStats();
      fetchAnomalies();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchMLStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/ml/dashboard-stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMlStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching ML stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnomalies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/ml/anomalies?limit=20', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnomalies(data.byPatient || []);
      }
    } catch (error) {
      console.error('Error fetching anomalies:', error);
    }
  };

  const analyzePatient = async (patientId: string) => {
    setSelectedPatient(patientId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/ml/analyze/${patientId}?period=7d`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPatientAnalysis(data);
      }
    } catch (error) {
      console.error('Error analyzing patient:', error);
    }
  };

  const testMLPrediction = async () => {
    const testVitals = {
      heart_rate: 45,
      spo2: 89,
      temperature: 102.5,
      bp_systolic: 160,
      bp_diastolic: 95,
      ecg: 25
    };
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/ml/predict', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testVitals)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('ML Prediction Result:', data);
        // Refresh anomalies to show new one
        fetchAnomalies();
      }
    } catch (error) {
      console.error('Error testing ML:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'solar:arrow-up-bold';
      case 'decreasing': return 'solar:arrow-down-bold';
      default: return 'solar:minus-bold';
    }
  };

  // Chart configuration for anomaly distribution
  const anomalyChartOptions = useChart({
    chart: { type: 'donut' },
    labels: ['Critical', 'High', 'Medium', 'Low'],
    colors: ['#FF5630', '#FF8F00', '#00B8D4', '#00AB55'],
    legend: { position: 'bottom' },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () => mlStats?.totalAnomalies || 0
            }
          }
        }
      }
    }
  });

  const anomalyChartSeries = [
    mlStats?.severityDistribution?.critical || 0,
    mlStats?.severityDistribution?.high || 0,
    mlStats?.severityDistribution?.medium || 0,
    mlStats?.severityDistribution?.low || 0
  ];

  if (loading) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Typography variant="h4">
          ML Anomaly Detection Dashboard 🤖
        </Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:test-tube-bold" />}
          onClick={testMLPrediction}
        >
          Test ML Prediction
        </Button>
      </Stack>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify icon="solar:danger-triangle-bold" width={48} sx={{ color: 'error.main', mb: 2 }} />
            <Typography variant="h3">{mlStats?.anomalies24h || 0}</Typography>
            <Typography variant="body2" color="text.secondary">
              Anomalies (24h)
            </Typography>
            <Chip
              size="small"
              icon={<Iconify icon={getTrendIcon(mlStats?.detectionRate?.trend || 'stable')} />}
              label={mlStats?.detectionRate?.trend || 'stable'}
              color={mlStats?.detectionRate?.trend === 'increasing' ? 'error' : 'success'}
              variant="soft"
              sx={{ mt: 1 }}
            />
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify icon="solar:chart-square-bold" width={48} sx={{ color: 'warning.main', mb: 2 }} />
            <Typography variant="h3">{mlStats?.anomalies7d || 0}</Typography>
            <Typography variant="body2" color="text.secondary">
              Weekly Anomalies
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Avg: {mlStats?.detectionRate?.weekly || 0}/day
            </Typography>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify icon="solar:users-group-rounded-bold" width={48} sx={{ color: 'info.main', mb: 2 }} />
            <Typography variant="h3">{mlStats?.patientsAtRisk?.length || 0}</Typography>
            <Typography variant="body2" color="text.secondary">
              Patients at Risk
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Critical/High severity
            </Typography>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Iconify icon="solar:shield-check-bold" width={48} sx={{ color: 'success.main', mb: 2 }} />
            <Typography variant="h3">89.5%</Typography>
            <Typography variant="body2" color="text.secondary">
              Model Accuracy
            </Typography>
            <Typography variant="caption" color="text.secondary">
              80% sensitivity
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Anomaly Distribution and Top Types */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Severity Distribution
            </Typography>
            <Chart
              type="donut"
              series={anomalyChartSeries}
              options={anomalyChartOptions}
              height={240}
            />
          </Card>
        </Grid>

        <Grid xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Anomaly Types
            </Typography>
            <Stack spacing={2}>
              {mlStats?.topAnomalyTypes?.map((type: any, index: number) => (
                <Stack key={index} direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2">
                    {type.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </Typography>
                  <Chip label={type.count} size="small" color="primary" variant="soft" />
                </Stack>
              )) || (
                <Typography variant="body2" color="text.secondary">
                  No anomaly data available
                </Typography>
              )}
            </Stack>
          </Card>
        </Grid>

        <Grid xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              High-Risk Patients
            </Typography>
            <Stack spacing={2}>
              {mlStats?.patientsAtRisk?.slice(0, 5).map((patient: any, index: number) => (
                <Stack key={index} spacing={0.5}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" fontWeight="bold">
                      {patient.patientName}
                    </Typography>
                    <Chip 
                      label={`${patient.anomalyCount} alerts`} 
                      size="small" 
                      color="error" 
                      variant="soft" 
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Last: {new Date(patient.lastAnomaly).toLocaleString()}
                  </Typography>
                </Stack>
              )) || (
                <Typography variant="body2" color="text.secondary">
                  No high-risk patients
                </Typography>
              )}
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Anomalies Table */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 3, pb: 1 }}>
          <Typography variant="h6">
            Recent Anomalies Detected
          </Typography>
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Risk Score</TableCell>
                <TableCell>Anomaly Types</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {anomalies.flatMap(patient => 
                patient.anomalies.slice(0, 3).map((anomaly: any) => (
                  <TableRow key={anomaly.id}>
                    <TableCell>{patient.patientName}</TableCell>
                    <TableCell>{new Date(anomaly.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={anomaly.severity} 
                        size="small" 
                        color={getSeverityColor(anomaly.severity) as any}
                        variant="soft"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LinearProgress 
                          variant="determinate" 
                          value={anomaly.risk_score} 
                          sx={{ width: 60, height: 6, borderRadius: 3 }}
                          color={anomaly.risk_score > 70 ? 'error' : anomaly.risk_score > 40 ? 'warning' : 'success'}
                        />
                        <Typography variant="body2">{Math.round(anomaly.risk_score)}%</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        {anomaly.anomaly_types.slice(0, 2).map((type: string, idx: number) => (
                          <Chip key={idx} label={type} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="small"
                        onClick={() => analyzePatient(patient.patientId)}
                      >
                        Analyze
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Patient Analysis (if selected) */}
      {patientAnalysis && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Patient Analysis Results
          </Typography>
          <Grid container spacing={2}>
            <Grid xs={12} md={6}>
              <Alert severity={patientAnalysis.riskTrend?.trend === 'worsening' ? 'warning' : 'info'}>
                Risk Trend: {patientAnalysis.riskTrend?.trend || 'Unknown'}
              </Alert>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Average Risk Score: {patientAnalysis.riskTrend?.averageRisk || 0}%
                </Typography>
                <Typography variant="body2">
                  Total Anomalies (7d): {patientAnalysis.riskTrend?.anomalyCount || 0}
                </Typography>
                <Typography variant="body2">
                  Critical Events: {patientAnalysis.riskTrend?.criticalCount || 0}
                </Typography>
              </Box>
            </Grid>
            <Grid xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Analysis Summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Readings: {patientAnalysis.analysis?.total_readings || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Anomaly Rate: {((patientAnalysis.analysis?.anomaly_rate || 0) * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Max Risk: {Math.round(patientAnalysis.analysis?.max_risk || 0)}%
              </Typography>
            </Grid>
          </Grid>
        </Card>
      )}
    </DashboardContent>
  );
}