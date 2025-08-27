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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar
} from '@mui/material';
import { Icon } from '@iconify/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from 'src/contexts/AuthContext';
import apiHelper from 'src/utils/apiHelper';

interface MonthlyReport {
  reportId: string;
  patientInfo: {
    name: string;
    patientId: string;
    surgeryType: string;
    surgeryDate: string;
    doctorName: string;
  };
  reportPeriod: {
    startDate: string;
    endDate: string;
    month: string;
    year: number;
  };
  vitalsAnalysis: {
    averages: {
      heartRate: number;
      bloodPressure: { systolic: number; diastolic: number };
      temperature: number;
      spO2: number;
    };
    trends: {
      heartRate: 'improving' | 'stable' | 'concerning';
      bloodPressure: 'improving' | 'stable' | 'concerning';
      temperature: 'improving' | 'stable' | 'concerning';
      spO2: 'improving' | 'stable' | 'concerning';
    };
    chartData: Array<{
      date: string;
      heartRate: number;
      systolic: number;
      diastolic: number;
      temperature: number;
      spO2: number;
    }>;
  };
  medicationAdherence: {
    overallRate: number;
    medications: Array<{
      name: string;
      adherenceRate: number;
      missedDoses: number;
      totalDoses: number;
    }>;
    sideEffectsReported: string[];
  };
  recoveryProgress: {
    currentProgress: number;
    expectedProgress: number;
    milestones: Array<{
      milestone: string;
      achieved: boolean;
      achievedDate?: string;
    }>;
  };
  alerts: Array<{
    date: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    resolved: boolean;
  }>;
  recommendations: Array<{
    category: string;
    recommendation: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  summary: {
    overallStatus: 'excellent' | 'good' | 'fair' | 'concerning';
    keyInsights: string[];
    nextSteps: string[];
  };
}

export function MonthlyReportView() {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchMonthlyReport();
  }, [selectedMonth, selectedYear]);

  const fetchMonthlyReport = async () => {
    try {
      setLoading(true);
      const response = await apiHelper.get(`/patient/monthly-report?month=${selectedMonth}&year=${selectedYear}`);
      
      if (response.success) {
        setReportData(response.data);
      } else {
        setError('Failed to load monthly report');
      }
    } catch (err: any) {
      console.error('Monthly report fetch error:', err);
      setError(err.message || 'Failed to load monthly report');
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReport = async () => {
    try {
      setGenerating(true);
      const response = await apiHelper.post('/patient/generate-pdf-report', {
        month: selectedMonth,
        year: selectedYear,
        format: 'pdf'
      });

      if (response.success) {
        // Trigger download
        const link = document.createElement('a');
        link.href = response.data.downloadUrl;
        link.download = `health-report-${selectedMonth + 1}-${selectedYear}.pdf`;
        link.click();
      }
    } catch (err: any) {
      console.error('PDF generation error:', err);
      setError(err.message || 'Failed to generate PDF report');
    } finally {
      setGenerating(false);
    }
  };

  const emailReport = async () => {
    try {
      await apiHelper.post('/patient/email-report', {
        month: selectedMonth,
        year: selectedYear,
        reportId: reportData?.reportId
      });
      
      alert('Report emailed successfully to your registered email address.');
    } catch (err: any) {
      console.error('Email report error:', err);
      setError(err.message || 'Failed to email report');
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <Icon icon="material-symbols:trending-up" style={{ color: '#4caf50' }} width={20} />;
      case 'concerning': return <Icon icon="material-symbols:trending-down" style={{ color: '#f44336' }} width={20} />;
      default: return <Icon icon="material-symbols:timeline" style={{ color: '#2196f3' }} width={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'success';
      case 'good': return 'info';
      case 'fair': return 'warning';
      case 'concerning': return 'error';
      default: return 'default';
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading monthly report...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Monthly Health Report
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive analysis of your health metrics and recovery progress
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Month</InputLabel>
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              label="Month"
            >
              {months.map((month, index) => (
                <MenuItem key={index} value={index}>
                  {month}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 100 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              label="Year"
            >
              {years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {reportData && (
            <>
              <Button
                variant="contained"
                startIcon={<Icon icon="material-symbols:picture-as-pdf" width={20} />}
                onClick={generatePDFReport}
                disabled={generating}
              >
                {generating ? 'Generating...' : 'Download PDF'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Icon icon="material-symbols:email" width={20} />}
                onClick={emailReport}
              >
                Email Report
              </Button>
            </>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!reportData ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Icon icon="material-symbols:assessment" style={{ fontSize: 64, color: '#9e9e9e', marginBottom: 16 }} />
            <Typography variant="h6" color="text.secondary">
              No report data available for {months[selectedMonth]} {selectedYear}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Reports are generated for months with sufficient health data.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={3}>
          {/* Report Header */}
          <Card>
            <CardHeader
              title={`Health Report - ${months[selectedMonth]} ${selectedYear}`}
              avatar={<Icon icon="material-symbols:date-range" style={{ color: '#2196f3' }} width={24} />}
              action={
                <Chip
                  label={reportData.summary.overallStatus.toUpperCase()}
                  color={getStatusColor(reportData.summary.overallStatus) as any}
                  variant="outlined"
                />
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Patient Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Name:</strong> {reportData.patientInfo.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Patient ID:</strong> {reportData.patientInfo.patientId}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Surgery:</strong> {reportData.patientInfo.surgeryType}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Attending Doctor:</strong> {reportData.patientInfo.doctorName}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Report Period
                  </Typography>
                  <Typography variant="body2">
                    <strong>From:</strong> {new Date(reportData.reportPeriod.startDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>To:</strong> {new Date(reportData.reportPeriod.endDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Generated:</strong> {new Date().toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Vitals Analysis */}
          <Card>
            <CardHeader
              title="Vital Signs Analysis"
              avatar={<Icon icon="material-symbols:favorite" style={{ color: '#f44336' }} width={24} />}
            />
            <CardContent>
              <Grid container spacing={3}>
                {/* Average Values */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Monthly Averages
                  </Typography>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon icon="material-symbols:favorite" style={{ color: '#f44336' }} width={20} />
                        <Typography variant="body2">Heart Rate</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {reportData.vitalsAnalysis.averages.heartRate} bpm
                        </Typography>
                        {getTrendIcon(reportData.vitalsAnalysis.trends.heartRate)}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Blood Pressure</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {reportData.vitalsAnalysis.averages.bloodPressure.systolic}/
                          {reportData.vitalsAnalysis.averages.bloodPressure.diastolic}
                        </Typography>
                        {getTrendIcon(reportData.vitalsAnalysis.trends.bloodPressure)}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon icon="material-symbols:device-thermostat" style={{ color: '#ff9800' }} width={20} />
                        <Typography variant="body2">Temperature</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {reportData.vitalsAnalysis.averages.temperature}°F
                        </Typography>
                        {getTrendIcon(reportData.vitalsAnalysis.trends.temperature)}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon icon="material-symbols:air" style={{ color: '#2196f3' }} width={20} />
                        <Typography variant="body2">SpO2</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {reportData.vitalsAnalysis.averages.spO2}%
                        </Typography>
                        {getTrendIcon(reportData.vitalsAnalysis.trends.spO2)}
                      </Box>
                    </Box>
                  </Stack>
                </Grid>

                {/* Trends Chart */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Monthly Trends
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={reportData.vitalsAnalysis.chartData.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="heartRate" stroke="#f44336" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="systolic" stroke="#2196f3" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Medication Adherence */}
          <Card>
            <CardHeader
              title="Medication Adherence"
              avatar={<Icon icon="material-symbols:local-pharmacy" style={{ color: '#4caf50' }} width={24} />}
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="success.main">
                      {reportData.medicationAdherence.overallRate}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overall Adherence Rate
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Typography variant="subtitle2" gutterBottom>
                    Medication Details
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Medication</TableCell>
                          <TableCell align="right">Adherence</TableCell>
                          <TableCell align="right">Missed Doses</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.medicationAdherence.medications.map((med, index) => (
                          <TableRow key={index}>
                            <TableCell>{med.name}</TableCell>
                            <TableCell align="right">
                              <Chip
                                size="small"
                                label={`${med.adherenceRate}%`}
                                color={med.adherenceRate >= 90 ? 'success' : 
                                       med.adherenceRate >= 70 ? 'warning' : 'error'}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="right">{med.missedDoses}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Recovery Progress */}
          <Card>
            <CardHeader
              title="Recovery Progress"
              avatar={<Icon icon="material-symbols:trending-up" style={{ color: '#2196f3' }} width={24} />}
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Progress Overview
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="h4" color="primary.main">
                      {reportData.recoveryProgress.currentProgress}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      (Expected: {reportData.recoveryProgress.expectedProgress}%)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recovery Milestones
                  </Typography>
                  <List dense>
                    {reportData.recoveryProgress.milestones.map((milestone, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemIcon>
                          {milestone.achieved ? 
                            <Icon icon="material-symbols:check-circle" style={{ color: '#4caf50' }} width={20} /> :
                            <Icon icon="material-symbols:warning" style={{ color: '#ff9800' }} width={20} />
                          }
                        </ListItemIcon>
                        <ListItemText
                          primary={milestone.milestone}
                          secondary={milestone.achievedDate && 
                            `Achieved: ${new Date(milestone.achievedDate).toLocaleDateString()}`
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Summary & Recommendations */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Key Insights"
                  avatar={<Icon icon="material-symbols:assessment" style={{ color: '#2196f3' }} width={24} />}
                />
                <CardContent>
                  <List dense>
                    {reportData.summary.keyInsights.map((insight, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemText primary={insight} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Recommendations"
                  avatar={<Icon icon="material-symbols:trending-up" style={{ color: '#4caf50' }} width={24} />}
                />
                <CardContent>
                  <Stack spacing={2}>
                    {reportData.recommendations.map((rec, index) => (
                      <Box key={index}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Chip
                            size="small"
                            label={rec.category}
                            color={rec.priority === 'high' ? 'error' : 
                                   rec.priority === 'medium' ? 'warning' : 'default'}
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="body2">
                          {rec.recommendation}
                        </Typography>
                        {index < reportData.recommendations.length - 1 && <Divider sx={{ mt: 2 }} />}
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      )}
    </Container>
  );
}