import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import apiHelper from 'src/utils/apiHelper';
import { setupDevAuth, checkDevAuth } from 'src/utils/devAuth';

// ----------------------------------------------------------------------

const REPORT_TYPES = ['All', 'Weekly', 'Monthly', 'Quarterly', 'Custom'];
const TIME_RANGES = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 3 Months' },
  { value: '1y', label: 'Last Year' }
];

interface Report {
  _id: string;
  userId: { name: string; patientId: string; _id: string; surgeryType?: string };
  type: string;
  period: { startDate: string; endDate: string };
  generatedAt: string;
  generatedBy: { name: string };
  vitalStatistics?: any;
  recoveryProgress?: any;
  recommendations?: any;
}

interface Patient {
  _id: string;
  name: string;
  patientId: string;
  surgeryType?: string;
}

export function DoctorReportsView() {
  const [reports, setReports] = useState<Report[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [selectedPatient, setSelectedPatient] = useState('All');
  const [generateDialog, setGenerateDialog] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('monthly');
  const [selectedPatientForReport, setSelectedPatientForReport] = useState('');
  const [generating, setGenerating] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Fetch reports and patients data
  const fetchData = useCallback(async () => {
    try {
      setError('');
      
      // Check if authenticated
      if (!checkDevAuth()) {
        const authSuccess = await setupDevAuth('doctor');
        if (!authSuccess) {
          setError('Failed to authenticate. Please check your credentials.');
          setLoading(false);
          return;
        }
      }
      
      // Fetch reports (all reports for doctor's patients)
      const reportsResponse = await apiHelper.get('/report/doctor/reports');
      
      // Fetch patients assigned to this doctor
      const patientsResponse = await apiHelper.get('/doctor/patients');
      
      if (reportsResponse.reports) {
        setReports(reportsResponse.reports);
        setFilteredReports(reportsResponse.reports);
      }
      
      if (patientsResponse.patients) {
        setPatients(patientsResponse.patients);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Error fetching data:', err);
      
      // Fallback: generate mock data
      const mockReports = generateMockReports();
      const mockPatients = generateMockPatients();
      setReports(mockReports);
      setFilteredReports(mockReports);
      setPatients(mockPatients);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter reports based on type and patient
  useEffect(() => {
    let filtered = reports;

    if (filterType !== 'All') {
      filtered = filtered.filter(report => report.type === filterType.toLowerCase());
    }

    if (selectedPatient !== 'All') {
      filtered = filtered.filter(report => report.userId._id === selectedPatient);
    }

    setFilteredReports(filtered);
  }, [reports, filterType, selectedPatient]);

  const handleGenerateReport = async () => {
    if (!selectedPatientForReport) return;
    
    setGenerating(true);
    try {
      const response = await apiHelper.post('/report/generate', {
        patientId: selectedPatientForReport,
        type: selectedReportType
      });
      
      if (response.message) {
        await fetchData();
        setGenerateDialog(false);
        setSelectedPatientForReport('');
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setViewDialog(true);
  };

  const handleDownloadReport = async (report: Report, format = 'json') => {
    try {
      const token = localStorage.getItem('token');
      const url = `http://localhost:4000/api/report/${report._id}/download?format=${format}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', '');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download report');
    }
  };

  if (loading) {
    return (
      <DashboardContent>
        <Box sx={{ mb: 5 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Patient Reports 📋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage patient medical reports
          </Typography>
        </Box>

        <Stack spacing={3}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading reports...
          </Typography>
        </Stack>
      </DashboardContent>
    );
  }

  if (error && reports.length === 0) {
    return (
      <DashboardContent>
        <Box sx={{ mb: 5 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Patient Reports 📋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage patient medical reports
          </Typography>
        </Box>

        <Alert severity="error" action={
          <Button size="small" onClick={fetchData}>
            Retry
          </Button>
        }>
          <Typography variant="subtitle2">Failed to load reports</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Patient Reports 📋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage patient medical reports
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:document-add-bold" />}
            onClick={() => setGenerateDialog(true)}
          >
            Generate Report
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={fetchData}
            disabled={loading}
            startIcon={<Iconify icon="solar:refresh-bold" />}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {/* Report Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="primary.main">
              {reports.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Reports
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="success.main">
              {reports.filter(r => new Date(r.generatedAt) > new Date(Date.now() - 7*24*60*60*1000)).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This Week
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="info.main">
              {patients.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              My Patients
            </Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="warning.main">
              {reports.filter(r => r.type === 'monthly').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monthly Reports
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Reports Management */}
      <Card sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h6">Patient Reports</Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              select
              size="small"
              label="Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              {REPORT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Patient"
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="All">All Patients</MenuItem>
              {patients.map((patient) => (
                <MenuItem key={patient._id} value={patient._id}>
                  {patient.name} ({patient.patientId})
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>

        {filteredReports.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Iconify icon="solar:document-text-bold" width={48} sx={{ color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6">No reports found</Typography>
            <Typography variant="body2" color="text.secondary">
              Generate your first report or adjust the filters to see existing reports
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredReports.map((report, index) => (
              <Box key={report._id}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <Iconify icon="solar:document-text-bold" />
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle2">
                          {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report - {report.userId?.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={report.userId?.surgeryType || 'General'}
                          color="info"
                          variant="soft"
                        />
                      </Stack>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Patient: {report.userId?.name} ({report.userId?.patientId})
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Period: {new Date(report.period?.startDate).toLocaleDateString()} - {new Date(report.period?.endDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Generated: {new Date(report.generatedAt).toLocaleString()} by {report.generatedBy?.name}
                        </Typography>
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={1}>
                      <IconButton 
                        size="small"
                        title="View Report"
                        onClick={() => handleViewReport(report)}
                      >
                        <Iconify icon="solar:eye-bold" />
                      </IconButton>
                      <IconButton 
                        size="small"
                        title="Download JSON"
                        onClick={() => handleDownloadReport(report, 'json')}
                      >
                        <Iconify icon="solar:download-bold" />
                      </IconButton>
                      <IconButton 
                        size="small"
                        title="Download CSV"
                        onClick={() => handleDownloadReport(report, 'csv')}
                      >
                        <Iconify icon="solar:document-bold" />
                      </IconButton>
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredReports.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Card>

      {/* Generate Report Dialog */}
      <Dialog open={generateDialog} onClose={() => setGenerateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Patient Report</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Patient</InputLabel>
              <Select
                value={selectedPatientForReport}
                onChange={(e) => setSelectedPatientForReport(e.target.value)}
                label="Patient"
              >
                {patients.map((patient) => (
                  <MenuItem key={patient._id} value={patient._id}>
                    {patient.name} ({patient.patientId}) - {patient.surgeryType || 'General'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                label="Report Type"
              >
                <MenuItem value="weekly">Weekly Report</MenuItem>
                <MenuItem value="monthly">Monthly Report</MenuItem>
                <MenuItem value="quarterly">Quarterly Report</MenuItem>
                <MenuItem value="custom">Custom Report</MenuItem>
              </Select>
            </FormControl>

            <Alert severity="info">
              The report will include vital statistics, recovery progress, medication adherence, and recommendations for the selected patient.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleGenerateReport}
            disabled={generating || !selectedPatientForReport}
            startIcon={generating ? <CircularProgress size={16} /> : <Iconify icon="solar:document-add-bold" />}
          >
            {generating ? 'Generating...' : 'Generate Report'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report View Dialog */}
      <Dialog 
        open={viewDialog} 
        onClose={() => setViewDialog(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              {selectedReport ? `${selectedReport.type.charAt(0).toUpperCase() + selectedReport.type.slice(1)} Report - ${selectedReport.userId?.name}` : 'Report Details'}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:download-bold" />}
                onClick={() => selectedReport && handleDownloadReport(selectedReport, 'json')}
              >
                Download
              </Button>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent>
          {selectedReport && (
            <Stack spacing={3}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Report Summary</Typography>
                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Patient</Typography>
                    <Typography variant="body1">{selectedReport.userId?.name} ({selectedReport.userId?.patientId})</Typography>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Surgery Type</Typography>
                    <Typography variant="body1">{selectedReport.userId?.surgeryType || 'General'}</Typography>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Period</Typography>
                    <Typography variant="body1">
                      {new Date(selectedReport.period?.startDate).toLocaleDateString()} - {new Date(selectedReport.period?.endDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Generated</Typography>
                    <Typography variant="body1">{new Date(selectedReport.generatedAt).toLocaleString()}</Typography>
                  </Grid>
                </Grid>
              </Card>

              {selectedReport.recoveryProgress && (
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Recovery Progress</Typography>
                  <Typography variant="h4" color="primary.main" gutterBottom>
                    {selectedReport.recoveryProgress.currentProgress}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {selectedReport.recoveryProgress.status?.replace(/_/g, ' ').toUpperCase()}
                  </Typography>
                </Card>
              )}

              {selectedReport.recommendations && (
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Recommendations</Typography>
                  {selectedReport.recommendations.diet && selectedReport.recommendations.diet.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Diet</Typography>
                      <List dense>
                        {selectedReport.recommendations.diet.map((rec: string, index: number) => (
                          <ListItem key={index} sx={{ py: 0.5 }}>
                            <Typography variant="body2">• {rec}</Typography>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                  {selectedReport.recommendations.exercise && selectedReport.recommendations.exercise.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Exercise</Typography>
                      <List dense>
                        {selectedReport.recommendations.exercise.map((rec: string, index: number) => (
                          <ListItem key={index} sx={{ py: 0.5 }}>
                            <Typography variant="body2">• {rec}</Typography>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Card>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}

// Mock data generators
function generateMockReports(): Report[] {
  const mockPatients = [
    { _id: '1', name: 'John Smith', patientId: 'P001', surgeryType: 'Cardiac' },
    { _id: '2', name: 'Sarah Johnson', patientId: 'P002', surgeryType: 'Orthopedic' },
    { _id: '3', name: 'Michael Chen', patientId: 'P003', surgeryType: 'Neurological' },
  ];

  return mockPatients.map((patient, index) => ({
    _id: `report_${index + 1}`,
    userId: patient,
    type: ['monthly', 'weekly', 'quarterly'][index % 3],
    period: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString()
    },
    generatedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
    generatedBy: { name: 'Dr. Smith' },
    recoveryProgress: {
      currentProgress: 65 + index * 10,
      status: ['on_track', 'ahead_of_schedule', 'slightly_behind'][index % 3]
    },
    recommendations: {
      diet: ['Increase protein intake', 'Stay hydrated'],
      exercise: ['Light walking daily', 'Physical therapy sessions']
    }
  }));
}

function generateMockPatients(): Patient[] {
  return [
    { _id: '1', name: 'John Smith', patientId: 'P001', surgeryType: 'Cardiac' },
    { _id: '2', name: 'Sarah Johnson', patientId: 'P002', surgeryType: 'Orthopedic' },
    { _id: '3', name: 'Michael Chen', patientId: 'P003', surgeryType: 'Neurological' },
    { _id: '4', name: 'Emily Davis', patientId: 'P004', surgeryType: 'General' },
    { _id: '5', name: 'Robert Wilson', patientId: 'P005', surgeryType: 'Cardiac' },
  ];
}